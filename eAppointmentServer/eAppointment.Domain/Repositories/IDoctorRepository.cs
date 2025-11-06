using eAppointment.Domain.Entities;
using eAppointment.Domain.Enums;

namespace eAppointment.Domain.Repositories;

public interface IDoctorRepository : IRepository<Doctor>
{
    Task<IEnumerable<Doctor>> GetByDepartmentAsync(Department department, CancellationToken cancellationToken = default);
    Task<Doctor?> GetByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default);
    Task<Doctor?> GetByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default);
    Task<bool> HasAppointmentsAsync(Guid doctorId, CancellationToken cancellationToken = default);
    Task<bool> HasFutureAppointmentsAsync(Guid doctorId, DateTime nowUtc, CancellationToken cancellationToken = default);
}

