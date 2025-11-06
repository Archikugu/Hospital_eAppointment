using eAppointment.Application.Constants;
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
        foreach (var roleName in Roles.All)
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
        var adminUserName = configuration["SeedSettings:AdminUserName"] ?? "admin";
        var adminEmail = configuration["SeedSettings:AdminEmail"] ?? "admin@admin.com";
        var adminPassword = configuration["SeedSettings:AdminPassword"] ?? "Admin123!";

        // Try find existing admin by username or email
        var existingAdmin = userManager.Users.FirstOrDefault(u => u.UserName == adminUserName || u.Email == adminEmail);
        if (existingAdmin is null)
        {
            var adminUser = new AppUser
            {
                FirstName = "Admin",
                LastName = "Admin",
                UserName = adminUserName,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, Roles.Admin);
            }
        }
        else
        {
            // Ensure user is in Admin role
            if (!await userManager.IsInRoleAsync(existingAdmin, Roles.Admin))
            {
                await userManager.AddToRoleAsync(existingAdmin, Roles.Admin);
            }
        }
    }
}

