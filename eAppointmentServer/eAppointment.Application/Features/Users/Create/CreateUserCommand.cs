using MediatR;
using eAppointment.Application.Services;

namespace eAppointment.Application.Features.Users.Create;

public sealed record CreateUserCommand(string Username, string Email, string Password, string? FirstName, string? LastName) : IRequest<UserCreatedDto>;

public sealed record UserCreatedDto(string Id, string Username, string? Email, string? FirstName, string? LastName);

internal sealed class CreateUserCommandHandler(IUserRoleService userRoleService) : IRequestHandler<CreateUserCommand, UserCreatedDto>
{
    public Task<UserCreatedDto> Handle(CreateUserCommand request, CancellationToken cancellationToken)
        => userRoleService.CreateUserAsync(request, cancellationToken);
}


