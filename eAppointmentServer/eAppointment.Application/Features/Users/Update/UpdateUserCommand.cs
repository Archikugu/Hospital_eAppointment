using MediatR;
using eAppointment.Application.Services;

namespace eAppointment.Application.Features.Users.Update;

public sealed record UpdateUserCommand(string Id, string? Email, string? FirstName, string? LastName, bool? IsActive) : IRequest<UserUpdatedDto>;

public sealed record UserUpdatedDto(string Id, string Username, string? Email, string? FirstName, string? LastName, bool? IsActive);

internal sealed class UpdateUserCommandHandler(IUserRoleService userRoleService) : IRequestHandler<UpdateUserCommand, UserUpdatedDto>
{
    public Task<UserUpdatedDto> Handle(UpdateUserCommand request, CancellationToken cancellationToken)
        => userRoleService.UpdateUserAsync(request, cancellationToken);
}


