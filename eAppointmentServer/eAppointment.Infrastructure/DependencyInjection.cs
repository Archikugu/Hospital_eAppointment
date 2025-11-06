using eAppointment.Application.Services;
using eAppointment.Domain.Entities;
using eAppointment.Domain.Repositories;
using eAppointment.Infrastructure.Context;
using eAppointment.Infrastructure.Repositories;
using eAppointment.Infrastructure.Seeding;
using eAppointment.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

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
        var jwtSettings = configuration.GetSection("JwtSettings").Get<JwtSettings>();
        services.Configure<JwtSettings>(configuration.GetSection("JwtSettings"));
        services.AddScoped<IJwtProvider, JwtProvider>();

        // JWT Authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            if (jwtSettings != null)
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
                };
            }
        });

        // Repository registrations
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ApplicationDbContext>());
        services.AddScoped<IDoctorRepository, DoctorRepository>();
        services.AddScoped<IPatientRepository, PatientRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IAppUserRepository, AppUserRepository>();

        // Services
    services.AddScoped<IRoleSyncService, RoleSyncService>();
    services.AddScoped<IUserRoleService, UserRoleService>();

        return services;
    }

    public static async Task SeedDataAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        await DataSeeder.SeedAsync(userManager, roleManager, configuration);
    }
}
