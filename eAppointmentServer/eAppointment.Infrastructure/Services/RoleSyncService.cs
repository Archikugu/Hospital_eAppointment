using eAppointment.Application.Constants;
using eAppointment.Application.Services;
using eAppointment.Application.Features.Roles.SyncRoles;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Infrastructure.Services;

internal sealed class RoleSyncService(RoleManager<AppRole> roleManager, UserManager<AppUser> userManager) : IRoleSyncService
{
    public async Task<SyncRolesResult> SyncRolesAsync(bool prune = false, CancellationToken cancellationToken = default)
    {
        var existingRoles = await roleManager.Roles.AsNoTracking().Select(r => r.Name!).ToListAsync(cancellationToken);

        int createdCount = 0;
        foreach (var roleName in Roles.All)
        {
            if (!existingRoles.Contains(roleName))
            {
                var role = new AppRole
                {
                    Name = roleName,
                    NormalizedName = roleName.ToUpperInvariant()
                };

                var result = await roleManager.CreateAsync(role);
                if (result.Succeeded)
                {
                    createdCount++;
                }
                else
                {
                    var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Role create failed: {errors}");
                }
            }
        }

        int deletedCount = 0;
        if (prune)
        {
            var extras = existingRoles.Except(Roles.All).ToList();
            foreach (var extraName in extras)
            {
                var role = await roleManager.Roles.FirstOrDefaultAsync(r => r.Name == extraName, cancellationToken);
                if (role is null) continue;

                var usersInRole = await userManager.GetUsersInRoleAsync(extraName);
                if (usersInRole.Count > 0) continue; // bağlı kullanıcı varsa silme

                var delResult = await roleManager.DeleteAsync(role);
                if (delResult.Succeeded)
                {
                    deletedCount++;
                }
                else
                {
                    var errors = string.Join(", ", delResult.Errors.Select(e => e.Description));
                    throw new InvalidOperationException($"Role delete failed: {errors}");
                }
            }
        }

        return new SyncRolesResult(createdCount, deletedCount);
    }
}


