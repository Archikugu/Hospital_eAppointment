using eAppointment.Application.Common.Models;
using eAppointment.Domain.Entities;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetAllAppointments;

public sealed class GetAllAppointmentsQuery : IRequest<Result<List<Appointment>>>
{
    public Guid? DoctorId { get; set; }
    public Guid? PatientId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}


