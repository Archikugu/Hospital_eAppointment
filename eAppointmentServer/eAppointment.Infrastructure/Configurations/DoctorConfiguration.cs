using eAppointment.Domain.Entities;
using eAppointment.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace eAppointment.Infrastructure.Configurations;

internal sealed class DoctorConfiguration : IEntityTypeConfiguration<Doctor>
{
    public void Configure(EntityTypeBuilder<Doctor> builder)
    {
        builder.ToTable("Doctors");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.FirstName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.LastName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(d => d.Department)
            .HasConversion(
                d => d.Value,
                v => Department.FromValue(v) ?? Department.Cardiology)
            .IsRequired();

        builder.Ignore(d => d.FullName);

        // Unique index for AppUserId when not null
        builder.HasIndex(d => d.AppUserId)
            .IsUnique()
            .HasFilter("[AppUserId] IS NOT NULL");

        // Default query filter: only active doctors
        builder.HasQueryFilter(d => d.IsActive);

        builder.HasMany(d => d.Appointments)
            .WithOne(a => a.Doctor)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

