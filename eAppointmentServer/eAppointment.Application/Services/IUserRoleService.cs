using eAppointment.Application.Features.Users.Create;
using eAppointment.Application.Features.Users.Update;

namespace eAppointment.Application.Services;

public interface IUserRoleService
{
    Task<IReadOnlyList<UserListItemDto>> GetAllUsersAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<string>> GetUserRolesAsync(string userId, CancellationToken cancellationToken);
    Task<UpdateUserRolesResult> UpdateUserRolesAsync(string userId, IReadOnlyList<string> roles, CancellationToken cancellationToken);
    Task<UserCreatedDto> CreateUserAsync(object request, CancellationToken cancellationToken);
    Task<UserUpdatedDto> UpdateUserAsync(object request, CancellationToken cancellationToken);
    Task DeleteUserAsync(string userId, CancellationToken cancellationToken);
}

public sealed record UserListItemDto(string Id, string Username, string? Email, string? FirstName, string? LastName, IReadOnlyList<string> Roles);
public sealed record UpdateUserRolesResult(IReadOnlyList<string> Added, IReadOnlyList<string> Removed);


