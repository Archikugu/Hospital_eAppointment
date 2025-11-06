using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Infrastructure.Repositories;

internal sealed class PatientRepository : Repository<Patient>, IPatientRepository
{
    public PatientRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<Patient?> GetByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .FirstOrDefaultAsync(p => p.IdentityNumber == identityNumber, cancellationToken);
    }

    public async Task<bool> ExistsByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .AnyAsync(p => p.IdentityNumber == identityNumber, cancellationToken);
    }

    public async Task<IEnumerable<Patient>> GetByCityAsync(string city, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .Where(p => p.City == city)
            .ToListAsync(cancellationToken);
    }

    public async Task<Patient?> GetByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .FirstOrDefaultAsync(p => p.FirstName == firstName && p.LastName == lastName, cancellationToken);
    }

    public async Task<bool> ExistsByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default)
    {
        return await _context.Patients
            .AnyAsync(p => p.FirstName == firstName && p.LastName == lastName, cancellationToken);
    }

    public async Task<Patient?> GetByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Patients.FirstOrDefaultAsync(p => p.AppUserId == appUserId, cancellationToken);
    }

    public async Task<bool> ExistsByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default)
    {
        return await _context.Patients.AnyAsync(p => p.AppUserId == appUserId, cancellationToken);
    }

    public async Task<bool> HasAppointmentsAsync(Guid patientId, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments.AnyAsync(a => a.PatientId == patientId, cancellationToken);
    }

    public async Task<bool> HasFutureAppointmentsAsync(Guid patientId, DateTime nowUtc, CancellationToken cancellationToken = default)
    {
        return await _context.Appointments.AnyAsync(a => a.PatientId == patientId && a.StartDate > nowUtc, cancellationToken);
    }

}

