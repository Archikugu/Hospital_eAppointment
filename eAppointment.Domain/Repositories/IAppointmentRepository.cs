using eAppointment.Domain.Entities;

namespace eAppointment.Domain.Repositories;

public interface IAppointmentRepository : IRepository<Appointment>
{
    Task<IEnumerable<Appointment>> GetByDoctorIdAsync(Guid doctorId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Appointment>> GetByPatientIdAsync(Guid patientId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Appointment>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    Task<IEnumerable<Appointment>> GetUpcomingAppointmentsAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<Appointment>> GetCompletedAppointmentsAsync(CancellationToken cancellationToken = default);
    Task<bool> HasAppointmentAtAsync(Guid doctorId, DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
}

