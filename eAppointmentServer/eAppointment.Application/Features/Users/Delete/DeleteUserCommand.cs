using MediatR;
using eAppointment.Application.Services;

namespace eAppointment.Application.Features.Users.Delete;

public sealed record DeleteUserCommand(string Id) : IRequest;

internal sealed class DeleteUserCommandHandler(IUserRoleService userRoleService) : IRequestHandler<DeleteUserCommand>
{
    public Task Handle(DeleteUserCommand request, CancellationToken cancellationToken)
        => userRoleService.DeleteUserAsync(request.Id, cancellationToken);
}


