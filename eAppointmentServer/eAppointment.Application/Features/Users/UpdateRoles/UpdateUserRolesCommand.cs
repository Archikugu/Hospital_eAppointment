using eAppointment.Application.Services;
using MediatR;

namespace eAppointment.Application.Features.Users.UpdateRoles;

public sealed record UpdateUserRolesCommand(string UserId, IReadOnlyList<string> Roles) : IRequest<UpdateUserRolesResult>;

internal sealed class UpdateUserRolesCommandHandler(IUserRoleService service) : IRequestHandler<UpdateUserRolesCommand, UpdateUserRolesResult>
{
    public Task<UpdateUserRolesResult> Handle(UpdateUserRolesCommand request, CancellationToken cancellationToken)
        => service.UpdateUserRolesAsync(request.UserId, request.Roles, cancellationToken);
}


