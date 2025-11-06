using eAppointment.Domain.Entities;

namespace eAppointment.Application.Constants;

public static class Roles
{
    // Rol adları (sabitler)
    public const string Admin = "Admin";
    public const string Doctor = "Doctor";
    public const string Patient = "Patient";

    // Uygulamadaki tüm rol adları
    public static readonly IReadOnlyList<string> All = new[] { Admin, Doctor, Patient };

    // Varsayılan rol kayıtları (deterministic GUID'lerle)
    public static readonly IReadOnlyList<AppRole> Seed = new List<AppRole>
    {
        new AppRole { Id = Guid.Parse("8a2e6b62-4b58-4d7e-bf6a-3a7a7b0d2d11"), Name = Admin },
        new AppRole { Id = Guid.Parse("a6b8f5b3-9e2b-4b2c-9f51-6c8f0e9fd8a2"), Name = Doctor },
        new AppRole { Id = Guid.Parse("c4f1a9f0-5e6d-4b3c-89a7-2d5f1a0c6e33"), Name = Patient },
    };
}
