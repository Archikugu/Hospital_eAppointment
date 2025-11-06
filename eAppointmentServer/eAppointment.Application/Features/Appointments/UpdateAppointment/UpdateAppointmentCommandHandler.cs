using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.UpdateAppointment;

internal sealed class UpdateAppointmentCommandHandler(
    IAppointmentRepository appointmentRepository,
    IDoctorRepository doctorRepository,
    IPatientRepository patientRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<UpdateAppointmentCommand, Result>
{
    public async Task<Result> Handle(UpdateAppointmentCommand request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result.Failure(Error.Validation("Id is required"));
        if (request.DoctorId == Guid.Empty)
            return Result.Failure(Error.Validation("DoctorId is required"));
        if (request.PatientId == Guid.Empty)
            return Result.Failure(Error.Validation("PatientId is required"));
        if (request.EndDate <= request.StartDate)
            return Result.Failure(Error.Validation("EndDate must be greater than StartDate"));

        var entity = await appointmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (entity is null)
            return Result.Failure(Error.NotFound("Appointment", request.Id));

        if (await doctorRepository.GetByIdAsync(request.DoctorId, cancellationToken) is null)
            return Result.Failure(Error.NotFound("Doctor", request.DoctorId));
        if (await patientRepository.GetByIdAsync(request.PatientId, cancellationToken) is null)
            return Result.Failure(Error.NotFound("Patient", request.PatientId));

        // Normalize incoming dates to UTC to avoid timezone drift
        static DateTime NormalizeToUtc(DateTime dt)
            => dt.Kind switch
            {
                DateTimeKind.Utc => dt,
                DateTimeKind.Local => dt.ToUniversalTime(),
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            };

        var startUtc = NormalizeToUtc(request.StartDate);
        var endUtc = NormalizeToUtc(request.EndDate);

        // Overlap check excluding this entity: naive approach by checking repository method then verifying id
        var hasOverlap = await appointmentRepository.HasAppointmentAtAsync(request.DoctorId, startUtc, endUtc, cancellationToken);
        if (hasOverlap)
        {
            // If overlaps, ensure it is not only with itself
            if (!(entity.StartDate == startUtc && entity.EndDate == endUtc && entity.DoctorId == request.DoctorId))
                return Result.Failure(Error.Conflict("Selected time overlaps with another appointment"));
        }

        // Map fields
        entity.DoctorId = request.DoctorId;
        entity.PatientId = request.PatientId;
        entity.StartDate = startUtc;
        entity.EndDate = endUtc;
        entity.IsCompleted = request.IsCompleted;
        entity.Note = request.Note;

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}


