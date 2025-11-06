using eAppointment.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace eAppointment.Infrastructure.Configurations;

internal sealed class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.StartDate)
            .IsRequired();

        builder.Property(a => a.EndDate)
            .IsRequired();

        builder.Property(a => a.IsCancelled)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.IsCompleted)
            .IsRequired()
            .HasDefaultValue(false);

        builder.Property(a => a.Note)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.HasIndex(a => new { a.DoctorId, a.StartDate, a.IsCancelled });

        builder.HasOne(a => a.Doctor)
            .WithMany(d => d.Appointments)
            .HasForeignKey(a => a.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Patient)
            .WithMany(p => p.Appointments)
            .HasForeignKey(a => a.PatientId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

