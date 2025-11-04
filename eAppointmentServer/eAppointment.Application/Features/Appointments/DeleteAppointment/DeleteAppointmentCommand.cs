using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Appointments.DeleteAppointment;

public sealed class DeleteAppointmentCommand : IRequest<Result>
{
    public Guid Id { get; set; }
}


