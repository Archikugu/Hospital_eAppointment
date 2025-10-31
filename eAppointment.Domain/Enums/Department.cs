namespace eAppointment.Domain.Enums;

public sealed record Department
{
    public int Value { get; }
    public string Name { get; }
    public string DisplayName { get; }
    public string Description { get; }

    private Department(int value, string name, string displayName, string description)
    {
        Value = value;
        Name = name;
        DisplayName = displayName;
        Description = description;
    }

    // Department definitions
    public static readonly Department Cardiology = new(1, nameof(Cardiology), "Kardiyoloji", "Kalp ve dolaşım sistemi hastalıkları");
    public static readonly Department Neurology = new(2, nameof(Neurology), "Nöroloji", "Sinir sistemi hastalıkları");
    public static readonly Department Orthopedics = new(3, nameof(Orthopedics), "Ortopedi", "Kemik, eklem ve kas hastalıkları");
    public static readonly Department Pediatrics = new(4, nameof(Pediatrics), "Pediatri", "Çocuk hastalıkları");
    public static readonly Department Gynecology = new(5, nameof(Gynecology), "Kadın Hastalıkları ve Doğum", "Kadın sağlığı ve doğum");
    public static readonly Department InternalMedicine = new(6, nameof(InternalMedicine), "İç Hastalıkları", "Genel dahiliye");
    public static readonly Department GeneralSurgery = new(7, nameof(GeneralSurgery), "Genel Cerrahi", "Cerrahi müdahaleler");
    public static readonly Department Ophthalmology = new(8, nameof(Ophthalmology), "Göz Hastalıkları", "Göz sağlığı");
    public static readonly Department Dermatology = new(9, nameof(Dermatology), "Dermatoloji", "Cilt hastalıkları");
    public static readonly Department Psychiatry = new(10, nameof(Psychiatry), "Psikiyatri", "Ruh sağlığı");
    public static readonly Department Emergency = new(11, nameof(Emergency), "Acil Servis", "Acil tıbbi müdahaleler");
    public static readonly Department Radiology = new(12, nameof(Radiology), "Radyoloji", "Görüntüleme ve tanı");
    public static readonly Department Urology = new(13, nameof(Urology), "Üroloji", "İdrar yolları ve erkek sağlığı");
    public static readonly Department ENT = new(14, nameof(ENT), "Kulak Burun Boğaz", "KBB hastalıkları");
    public static readonly Department Oncology = new(15, nameof(Oncology), "Onkoloji", "Kanser tedavisi");
    public static readonly Department Anesthesiology = new(16, nameof(Anesthesiology), "Anesteziyoloji", "Anestezi ve reanimasyon");
    public static readonly Department Pathology = new(17, nameof(Pathology), "Patoloji", "Hastalık tanısı");
    public static readonly Department PhysicalTherapy = new(18, nameof(PhysicalTherapy), "Fizik Tedavi", "Rehabilitasyon");

    // All departments
    public static IReadOnlyList<Department> All { get; } = new[]
    {
        Cardiology, Neurology, Orthopedics, Pediatrics, Gynecology,
        InternalMedicine, GeneralSurgery, Ophthalmology, Dermatology,
        Psychiatry, Emergency, Radiology, Urology, ENT, Oncology,
        Anesthesiology, Pathology, PhysicalTherapy
    };

    // Helper methods
    public static Department? FromValue(int value)
    {
        return All.FirstOrDefault(d => d.Value == value);
    }

    public static Department? FromName(string name)
    {
        return All.FirstOrDefault(d => 
            d.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
    }

    public override string ToString() => DisplayName;

    // Implicit conversion for EF Core compatibility
    public static implicit operator int(Department department) => department.Value;
    
    // Explicit conversion from int
    public static explicit operator Department(int value)
    {
        return FromValue(value) 
            ?? throw new ArgumentException($"Invalid Department value: {value}", nameof(value));
    }
}
