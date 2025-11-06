using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Infrastructure.Repositories;

internal sealed class AppointmentRepository : Repository<Appointment>, IAppointmentRepository
{
    public AppointmentRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Appointment>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.DoctorId == doctorId && !a.IsCancelled)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.PatientId == patientId && !a.IsCancelled)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.StartDate >= startDate && a.EndDate <= endDate && !a.IsCancelled)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetUpcomingAppointmentsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.StartDate > now && !a.IsCompleted && !a.IsCancelled)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetCompletedAppointmentsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.IsCompleted)
            .OrderByDescending(a => a.EndDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> HasAppointmentAtAsync(Guid doctorId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .AnyAsync(
                a => a.DoctorId == doctorId &&
                     !a.IsCompleted &&
                     !a.IsCancelled &&
                     a.Doctor != null && a.Patient != null &&
                     a.Doctor.IsActive && a.Patient.IsActive &&
                     ((a.StartDate <= startDate && a.EndDate > startDate) ||
                      (a.StartDate < endDate && a.EndDate >= endDate) ||
                      (a.StartDate >= startDate && a.EndDate <= endDate)),
                cancellationToken);
    }

    public async Task<int> CompletePastAppointmentsAsync(DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        var query = _context.Appointments.Where(a => !a.IsCompleted && !a.IsCancelled && a.EndDate <= nowUtc);
        var list = await query.ToListAsync(cancellationToken);
        foreach (var a in list)
        {
            a.IsCompleted = true;
            Update(a);
        }
        await _context.SaveChangesAsync(cancellationToken);
        return list.Count;
    }
}

