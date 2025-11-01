using eAppointment.Domain.Entities;

namespace eAppointment.Domain.Repositories;

public interface IAppUserRepository : IRepository<AppUser>
{
    Task<AppUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<AppUser?> GetByUserNameAsync(string userName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<bool> ExistsByUserNameAsync(string userName, CancellationToken cancellationToken = default);
}

