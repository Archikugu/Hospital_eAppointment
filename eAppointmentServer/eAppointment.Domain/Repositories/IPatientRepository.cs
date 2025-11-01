using eAppointment.Domain.Entities;

namespace eAppointment.Domain.Repositories;

public interface IPatientRepository : IRepository<Patient>
{
    Task<Patient?> GetByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default);
    Task<bool> ExistsByIdentityNumberAsync(string identityNumber, CancellationToken cancellationToken = default);
    Task<IEnumerable<Patient>> GetByCityAsync(string city, CancellationToken cancellationToken = default);
}

