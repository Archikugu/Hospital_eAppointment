using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;

namespace eAppointment.Infrastructure.Seeding;

internal static class DataSeeder
{
    public static async Task SeedAsync(
        UserManager<AppUser> userManager,
        RoleManager<AppRole> roleManager,
        IConfiguration configuration)
    {
        await SeedRolesAsync(roleManager);
        await SeedAdminUserAsync(userManager, configuration);
    }

    private static async Task SeedRolesAsync(RoleManager<AppRole> roleManager)
    {
        var roles = new[] { "Admin", "Doctor", "Patient" };

        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new AppRole { Name = roleName });
            }
        }
    }

    private static async Task SeedAdminUserAsync(
        UserManager<AppUser> userManager,
        IConfiguration configuration)
    {
        // Check if any user exists
        if (userManager.Users.Any())
            return;

        var adminUserName = configuration["SeedSettings:AdminUserName"] ?? "admin";
        var adminEmail = configuration["SeedSettings:AdminEmail"] ?? "admin@admin.com";
        var adminPassword = configuration["SeedSettings:AdminPassword"] ?? "Admin123!";

        var adminUser = new AppUser
        {
            FirstName = "Admin",
            LastName = "Admin",
            UserName = adminUserName,
            Email = adminEmail,
            EmailConfirmed = true
        };

        var result = await userManager.CreateAsync(adminUser, adminPassword);

        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(adminUser, "Admin");
        }
    }
}

