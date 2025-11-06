using eAppointment.Domain.Entities;
using eAppointment.Domain.Enums;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Infrastructure.Repositories;

internal sealed class DoctorRepository : Repository<Doctor>, IDoctorRepository
{
    public DoctorRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Doctor>> GetByDepartmentAsync(Department department, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors
            .Where(d => d.Department.Value == department.Value)
            .ToListAsync(cancellationToken);
    }

    public async Task<Doctor?> GetByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors
            .FirstOrDefaultAsync(
                d => d.FirstName == firstName && d.LastName == lastName,
                cancellationToken);
    }

    public async Task<bool> ExistsByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors
            .AnyAsync(
                d => d.FirstName == firstName && d.LastName == lastName,
                cancellationToken);
    }

    public async Task<Doctor?> GetByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors.FirstOrDefaultAsync(d => d.AppUserId == appUserId, cancellationToken);
    }

    public async Task<bool> ExistsByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Doctors.AnyAsync(d => d.AppUserId == appUserId, cancellationToken);
    }

    public async Task<bool> HasAppointmentsAsync(Guid doctorId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments.AnyAsync(a => a.DoctorId == doctorId, cancellationToken);
    }

    public async Task<bool> HasFutureAppointmentsAsync(Guid doctorId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments.AnyAsync(a => a.DoctorId == doctorId && a.StartDate > nowUtc, cancellationToken);
    }

}

