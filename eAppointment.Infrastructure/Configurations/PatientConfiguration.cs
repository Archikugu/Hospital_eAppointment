using eAppointment.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace eAppointment.Infrastructure.Configurations;

internal sealed class PatientConfiguration : IEntityTypeConfiguration<Patient>
{
    public void Configure(EntityTypeBuilder<Patient> builder)
    {
        builder.ToTable("Patients");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.FirstName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.LastName)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(p => p.IdentityNumber)
            .HasMaxLength(11)
            .IsRequired();

        builder.HasIndex(p => p.IdentityNumber)
            .IsUnique();

        builder.Property(p => p.City)
            .HasMaxLength(50);

        builder.Property(p => p.District)
            .HasMaxLength(50);

        builder.Property(p => p.FullAddress)
            .HasMaxLength(500);

        builder.Ignore(p => p.FullName);

        builder.HasMany(p => p.Appointments)
            .WithOne(a => a.Patient)
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

