using AutoMapper;
using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.CreateAppointment;

internal sealed class CreateAppointmentCommandHandler(
    IAppointmentRepository appointmentRepository,
    IDoctorRepository doctorRepository,
    IPatientRepository patientRepository,
    IUnitOfWork unitOfWork,
    IMapper mapper
) : IRequestHandler<CreateAppointmentCommand, Result<Appointment>>
{
    public async Task<Result<Appointment>> Handle(CreateAppointmentCommand request, CancellationToken cancellationToken)
    {
        if (request.DoctorId == Guid.Empty)
            return Result.Failure<Appointment>(Error.Validation("DoctorId is required"));
        if (request.PatientId == Guid.Empty)
            return Result.Failure<Appointment>(Error.Validation("PatientId is required"));
        if (request.StartDate == default || request.EndDate == default)
            return Result.Failure<Appointment>(Error.Validation("Start and End dates are required"));
        if (request.EndDate <= request.StartDate)
            return Result.Failure<Appointment>(Error.Validation("EndDate must be greater than StartDate"));

        var doctor = await doctorRepository.GetByIdAsync(request.DoctorId, cancellationToken);
        if (doctor is null)
            return Result.Failure<Appointment>(Error.NotFound("Doctor", request.DoctorId));
        var patient = await patientRepository.GetByIdAsync(request.PatientId, cancellationToken);
        if (patient is null)
            return Result.Failure<Appointment>(Error.NotFound("Patient", request.PatientId));

        if (!doctor.IsActive)
            return Result.Failure<Appointment>(Error.Validation("Doctor is inactive"));
        if (!patient.IsActive)
            return Result.Failure<Appointment>(Error.Validation("Patient is inactive"));

        // Normalize incoming dates to UTC to avoid timezone drift between client/server/DB
        static DateTime NormalizeToUtc(DateTime dt)
            => dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            };

        var startUtc = NormalizeToUtc(request.StartDate);
        var endUtc = NormalizeToUtc(request.EndDate);

        var overlaps = await appointmentRepository.HasAppointmentAtAsync(request.DoctorId, startUtc, endUtc, cancellationToken);
        if (overlaps)
            return Result.Failure<Appointment>(Error.Conflict("Selected time overlaps with another appointment"));

        var entity = mapper.Map<Appointment>(request);
        entity.StartDate = startUtc;
        entity.EndDate = endUtc;
        await appointmentRepository.AddAsync(entity, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(entity);
    }
}


