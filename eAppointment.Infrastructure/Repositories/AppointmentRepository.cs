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
            .Where(a => a.DoctorId == doctorId)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.PatientId == patientId)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.StartDate >= startDate && a.EndDate <= endDate)
            .OrderBy(a => a.StartDate)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Appointment>> GetUpcomingAppointmentsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await _context.Appointments
            .Include(a => a.Doctor)
            .Include(a => a.Patient)
            .Where(a => a.StartDate > now && !a.IsCompleted)
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
                     ((a.StartDate <= startDate && a.EndDate > startDate) ||
                      (a.StartDate < endDate && a.EndDate >= endDate) ||
                      (a.StartDate >= startDate && a.EndDate <= endDate)),
                cancellationToken);
    }

}

