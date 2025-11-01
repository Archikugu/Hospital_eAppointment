using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Infrastructure.Repositories;

internal sealed class AppUserRepository : Repository<AppUser>, IAppUserRepository
{
    public AppUserRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<AppUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<AppUser?> GetByUserNameAsync(string userName, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .FirstOrDefaultAsync(u => u.UserName == userName, cancellationToken);
    }

    public async Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AnyAsync(u => u.Email == email, cancellationToken);
    }

    public async Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default)
    {
        return await _context.Users
            .AnyAsync(u => u.UserName == userName, cancellationToken);
    }

}

