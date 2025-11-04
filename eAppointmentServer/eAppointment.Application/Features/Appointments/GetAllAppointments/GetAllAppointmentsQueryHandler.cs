using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetAllAppointments;

internal sealed class GetAllAppointmentsQueryHandler(
    IAppointmentRepository appointmentRepository
) : IRequestHandler<GetAllAppointmentsQuery, Result<List<Appointment>>>
{
    public async Task<Result<List<Appointment>>> Handle(GetAllAppointmentsQuery request, CancellationToken cancellationToken)
    {
        IEnumerable<Appointment> items;
        if (request.DoctorId.HasValue)
        {
            items = await appointmentRepository.GetByDoctorIdAsync(request.DoctorId.Value, cancellationToken).ConfigureAwait(false);
        }
        else if (request.PatientId.HasValue)
        {
            items = await appointmentRepository.GetByPatientIdAsync(request.PatientId.Value, cancellationToken).ConfigureAwait(false);
        }
        else if (request.StartDate.HasValue && request.EndDate.HasValue)
        {
            items = await appointmentRepository.GetByDateRangeAsync(request.StartDate.Value, request.EndDate.Value, cancellationToken).ConfigureAwait(false);
        }
        else
        {
            // fall back to upcoming to avoid returning huge sets
            items = await appointmentRepository.GetUpcomingAppointmentsAsync(cancellationToken).ConfigureAwait(false);
        }

        return Result.Success(items.ToList());
    }
}


