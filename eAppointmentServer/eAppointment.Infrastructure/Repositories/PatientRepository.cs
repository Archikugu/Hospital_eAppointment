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

}

