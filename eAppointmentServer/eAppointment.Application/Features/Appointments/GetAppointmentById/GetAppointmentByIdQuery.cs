using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetAppointmentById;

public sealed class GetAppointmentByIdQuery : IRequest<Result<Appointment>>
{
    public Guid Id { get; set; }
}

