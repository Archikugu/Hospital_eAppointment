using eAppointment.Application.Services;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using eAppointment.Infrastructure.Repositories;
using eAppointment.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace eAppointment.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(configuration.GetConnectionString("SqlServer"));
        });

        services.AddIdentity<AppUser, AppRole>(action =>
        {
            // Password settings
            action.Password.RequireDigit = true;
            action.Password.RequiredLength = 6;
            action.Password.RequireNonAlphanumeric = false;
            action.Password.RequireUppercase = false;
            action.Password.RequireLowercase = false;

            // User settings
            action.User.RequireUniqueEmail = true;
            action.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";

            // Lockout settings
            action.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            action.Lockout.MaxFailedAccessAttempts = 5;
            action.Lockout.AllowedForNewUsers = true;

            // SignIn settings
            action.SignIn.RequireConfirmedEmail = false;
            action.SignIn.RequireConfirmedPhoneNumber = false;
        }).AddEntityFrameworkStores<ApplicationDbContext>();

        // JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtProvider, JwtProvider>();

        // Repository registrations
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAppUserRepository, AppUserRepository>();

        return services;
    }
}
