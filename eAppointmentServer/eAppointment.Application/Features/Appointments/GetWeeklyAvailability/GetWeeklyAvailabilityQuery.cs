using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetWeeklyAvailability;

public sealed class GetWeeklyAvailabilityQuery : IRequest<Result<List<DayAvailabilityDto>>>
{
    public Guid DoctorId { get; set; }
    public DateTime WeekStart { get; set; } // Monday 00:00:00
}

public sealed class DayAvailabilityDto
{
    public required DateOnly Date { get; set; }
    public List<SlotDto> Slots { get; set; } = new();
}

public sealed class SlotDto
{
    public required string Time { get; set; } // "09:00"
    public bool IsBusy { get; set; }
    public string? Title { get; set; }
    public Guid? AppointmentId { get; set; }
    public string? PatientName { get; set; }
    public string? Note { get; set; }
}


