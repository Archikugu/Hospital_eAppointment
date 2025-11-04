namespace eAppointment.Domain.Entities;

public sealed class Patient
{
    public Patient()
    {
        Id = Guid.NewGuid();
        Appointments = new List<Appointment>();
    }
    public Guid Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string FullName => $"{FirstName} {LastName.ToUpper()}";
    public string IdentityNumber { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string FullAddress { get; set; } = string.Empty;
    public DateOnly? BirthDate { get; set; }
    public string? Gender { get; set; }
    
    // Navigation Properties
    public ICollection<Appointment> Appointments { get; set; }
}
