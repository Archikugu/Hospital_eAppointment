using eAppointment.Domain.Entities;

namespace eAppointment.Domain.Repositories;

public interface IPatientRepository : IRepository<Patient>
{
    Task<Patient?> GetByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default);
    Task<bool> ExistsByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<Patient>> GetByCityAsync(string city, CancellationToken cancellationToken = default);
    Task<Patient?> GetByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default);
    Task<bool> ExistsByFullNameAsync(string firstName, string lastName, CancellationToken cancellationToken = default);
    Task<Patient?> GetByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByAppUserIdAsync(Guid appUserId, CancellationToken cancellationToken = default);
    Task<bool> HasAppointmentsAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task<bool> HasFutureAppointmentsAsync(Guid patientId, DateTime nowUtc, CancellationToken cancellationToken = default);
}

