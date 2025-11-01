using eAppointment.Domain.Enums;

namespace eAppointment.Domain.Entities;

public sealed class Doctor
{
    public Doctor()
    {
        Id = Guid.NewGuid();
        Appointments = new List<Appointment>();
    }
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName.ToUpper()}";
    public required Department Department { get; set; }
    
    // Navigation Properties
    public ICollection<Appointment> Appointments { get; set; }
}
