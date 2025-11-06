using eAppointment.Application.Common.Models;
using eAppointment.Domain.Repositories;
using MediatR;

namespace eAppointment.Application.Features.Appointments.GetWeeklyAvailability;

internal sealed class GetWeeklyAvailabilityQueryHandler(
    IAppointmentRepository appointmentRepository,
    IDoctorRepository doctorRepository,
    IPatientRepository patientRepository
) : IRequestHandler<GetWeeklyAvailabilityQuery, Result<List<DayAvailabilityDto>>>
{
    private static readonly string[] TimeSlots = new[]
    {
        "09:00","09:30","10:00","10:30","11:00","11:30",
        "13:00","13:30","14:00","14:30","15:00","15:30","16:00"
    };

    public async Task<Result<List<DayAvailabilityDto>>> Handle(GetWeeklyAvailabilityQuery request, CancellationToken cancellationToken)
    {
        if (request.DoctorId == Guid.Empty)
            return Result.Failure<List<DayAvailabilityDto>>(Error.Validation("DoctorId is required"));

        if (await doctorRepository.GetByIdAsync(request.DoctorId, cancellationToken) is null)
            return Result.Failure<List<DayAvailabilityDto>>(Error.NotFound("Doctor", request.DoctorId));

        var weekStartLocal = StartOfWeek(request.WeekStart);
        var weekEndLocal = weekStartLocal.AddDays(6).AddHours(23).AddMinutes(59).AddSeconds(59);

        // Convert to UTC for repository filtering if appointments are stored in UTC
        DateTime ToUtc(DateTime dt)
            => (dt.Kind == DateTimeKind.Utc) ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Local).ToUniversalTime();

        var utcStart = ToUtc(weekStartLocal);
        var utcEnd = ToUtc(weekEndLocal);

        var appointments = await appointmentRepository.GetByDateRangeAsync(utcStart, utcEnd, cancellationToken).ConfigureAwait(false);
        appointments = appointments
            .Where(a => a.DoctorId == request.DoctorId)
            .Where(a => !a.IsCancelled && !a.IsCompleted)
            .Where(a => (a.Doctor?.IsActive ?? true) && (a.Patient?.IsActive ?? true));

        var days = new List<DayAvailabilityDto>(7);
        for (int i = 0; i < 7; i++)
        {
            var date = DateOnly.FromDateTime(weekStartLocal.AddDays(i));
            var dto = new DayAvailabilityDto
            {
                Date = date,
                Slots = TimeSlots.Select(t => new SlotDto { Time = t, IsBusy = false }).ToList()
            };

            // mark busy slots
            // cache patients to avoid N+1 repeated loads
            var patientCache = new Dictionary<Guid, (string firstName, string lastName)>();

            foreach (var appt in appointments.Where(a => DateOnly.FromDateTime(a.StartDate.ToLocalTime()) == date))
            {
                foreach (var slot in dto.Slots)
                {
                    var slotRange = ParseSlotRange(date, slot.Time);
                    // Compare in local time domain
                    var aStartLocal = appt.StartDate.ToLocalTime();
                    var aEndLocal = appt.EndDate.ToLocalTime();
                    if (RangesOverlap(aStartLocal, aEndLocal, slotRange.start, slotRange.end))
                    {
                        slot.IsBusy = true;
                        slot.AppointmentId = appt.Id;
                        slot.Note = appt.Note;
                        if (appt.Patient != null)
                        {
                            slot.PatientName = $"{appt.Patient.FirstName} {appt.Patient.LastName}";
                            slot.Title = slot.PatientName;
                        }
                        else
                        {
                            if (!patientCache.TryGetValue(appt.PatientId, out var name))
                            {
                                var p = await patientRepository.GetByIdAsync(appt.PatientId, cancellationToken).ConfigureAwait(false);
                                if (p != null)
                                {
                                    name = (p.FirstName, p.LastName);
                                    patientCache[appt.PatientId] = name;
                                }
                            }
                            if (name.firstName != null)
                            {
                                slot.PatientName = $"{name.firstName} {name.lastName}";
                                slot.Title = slot.PatientName;
                            }
                            else
                            {
                                slot.Title = "Booked";
                            }
                        }
                    }
                }
            }

            days.Add(dto);
        }

        return Result.Success(days);
    }

    private static DateTime StartOfWeek(DateTime date)
    {
        var d = date;
        var diff = (d.DayOfWeek == DayOfWeek.Sunday ? -6 : DayOfWeek.Monday - d.DayOfWeek);
        return d.Date.AddDays(diff);
    }

    private static (DateTime start, DateTime end) ParseSlotRange(DateOnly date, string time)
    {
        var parts = time.Split(':');
        var start = new DateTime(date.Year, date.Month, date.Day, int.Parse(parts[0]), int.Parse(parts[1]), 0);
        var end = start.AddMinutes(30);
        return (start, end);
    }

    private static bool RangesOverlap(DateTime aStart, DateTime aEnd, DateTime bStart, DateTime bEnd)
    {
        return aStart < bEnd && bStart < aEnd;
    }
}


