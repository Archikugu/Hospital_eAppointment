using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Appointments.UpdateAppointment;

public sealed class UpdateAppointmentCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsCompleted { get; set; }
    public string? Note { get; set; }
}


