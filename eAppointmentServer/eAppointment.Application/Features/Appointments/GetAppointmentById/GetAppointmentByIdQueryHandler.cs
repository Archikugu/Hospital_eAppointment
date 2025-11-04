using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetAppointmentById;

internal sealed class GetAppointmentByIdQueryHandler(
    IAppointmentRepository appointmentRepository
) : IRequestHandler<GetAppointmentByIdQuery, Result<Appointment>>
{
    public async Task<Result<Appointment>> Handle(GetAppointmentByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result.Failure<Appointment>(Error.Validation("Id is required"));

        var appointment = await appointmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (appointment is null)
            return Result.Failure<Appointment>(Error.NotFound("Appointment", request.Id));

        return Result.Success(appointment);
    }
}

