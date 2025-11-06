using eAppointment.Application.Services;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using eAppointment.Application.Features.Users.Create;
using eAppointment.Application.Features.Users.Update;

namespace eAppointment.Infrastructure.Services;

internal sealed class UserRoleService(UserManager<AppUser> userManager, RoleManager<AppRole> roleManager) : IUserRoleService
{
    public async Task<IReadOnlyList<UserListItemDto>> GetAllUsersAsync(CancellationToken cancellationToken)
    {
        var users = await userManager.Users.AsNoTracking()
            .Select(u => new { u.Id, u.UserName, u.Email, u.FirstName, u.LastName })
            .ToListAsync(cancellationToken);

        var results = new List<UserListItemDto>(users.Count);
        foreach (var u in users)
        {
            var user = await userManager.FindByIdAsync(u.Id.ToString());
            var roles = user is null ? Array.Empty<string>() : await userManager.GetRolesAsync(user);
            results.Add(new UserListItemDto(u.Id.ToString(), u.UserName!, u.Email, u.FirstName, u.LastName, roles.ToList()));
        }
        return results;
    }

    public async Task<IReadOnlyList<string>> GetUserRolesAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) return Array.Empty<string>();
        var roles = await userManager.GetRolesAsync(user);
        return roles.ToList();
    }

    public async Task<UpdateUserRolesResult> UpdateUserRolesAsync(string userId, IReadOnlyList<string> roles, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null) throw new InvalidOperationException("User not found");

        var requested = roles.Where(r => !string.IsNullOrWhiteSpace(r)).Select(r => r.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        var validRoleNames = await roleManager.Roles.Select(r => r.Name!).ToListAsync(cancellationToken);
        var target = requested.Where(r => validRoleNames.Contains(r)).ToList();

        var current = await userManager.GetRolesAsync(user);
        var toAdd = target.Except(current, StringComparer.OrdinalIgnoreCase).ToList();
        var toRemove = current.Except(target, StringComparer.OrdinalIgnoreCase).ToList();

        if (toAdd.Count > 0)
        {
            var addRes = await userManager.AddToRolesAsync(user, toAdd);
            if (!addRes.Succeeded)
                throw new InvalidOperationException(string.Join(", ", addRes.Errors.Select(e => e.Description)));
        }

        if (toRemove.Count > 0)
        {
            var remRes = await userManager.RemoveFromRolesAsync(user, toRemove);
            if (!remRes.Succeeded)
                throw new InvalidOperationException(string.Join(", ", remRes.Errors.Select(e => e.Description)));
        }

        return new UpdateUserRolesResult(toAdd, toRemove);
    }

    public async Task<UserCreatedDto> CreateUserAsync(object request, CancellationToken cancellationToken)
    {
        var cmd = (CreateUserCommand)request;
        var username = (cmd.Username ?? string.Empty).Trim();
        var email = (cmd.Email ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(cmd.Password))
            throw new InvalidOperationException("Username and password are required");

        var exists = await userManager.Users.AnyAsync(u => u.UserName!.ToLower() == username.ToLower(), cancellationToken);
        if (exists) throw new InvalidOperationException("Username already exists");

        var user = new AppUser
        {
            UserName = username,
            Email = string.IsNullOrWhiteSpace(email) ? null : email,
            FirstName = cmd.FirstName ?? string.Empty,
            LastName = cmd.LastName ?? string.Empty
        };
        var createResult = await userManager.CreateAsync(user, cmd.Password);
        if (!createResult.Succeeded)
            throw new InvalidOperationException(string.Join(", ", createResult.Errors.Select(e => e.Description)));

        return new UserCreatedDto(user.Id.ToString(), user.UserName!, user.Email, user.FirstName, user.LastName);
    }

    public async Task<UserUpdatedDto> UpdateUserAsync(object request, CancellationToken cancellationToken)
    {
        var cmd = (UpdateUserCommand)request;
        var user = await userManager.FindByIdAsync(cmd.Id) ?? throw new InvalidOperationException("User not found");
        if (cmd.Email is not null) user.Email = string.IsNullOrWhiteSpace(cmd.Email) ? null : cmd.Email.Trim();
        if (cmd.FirstName is not null) user.FirstName = cmd.FirstName;
        if (cmd.LastName is not null) user.LastName = cmd.LastName;
        // IsActive alanı varsa AppUser'da set edilebilir; yoksa atlanır
        var res = await userManager.UpdateAsync(user);
        if (!res.Succeeded)
            throw new InvalidOperationException(string.Join(", ", res.Errors.Select(e => e.Description)));
        return new UserUpdatedDto(user.Id.ToString(), user.UserName!, user.Email, user.FirstName, user.LastName, cmd.IsActive);
    }

    public async Task DeleteUserAsync(string userId, CancellationToken cancellationToken)
    {
        var user = await userManager.FindByIdAsync(userId) ?? throw new InvalidOperationException("User not found");
        var res = await userManager.DeleteAsync(user);
        if (!res.Succeeded)
            throw new InvalidOperationException(string.Join(", ", res.Errors.Select(e => e.Description)));
    }
}


