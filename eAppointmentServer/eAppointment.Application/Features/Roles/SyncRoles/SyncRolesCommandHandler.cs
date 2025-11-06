using eAppointment.Application.Common.Models;
using eAppointment.Application.Services;
using MediatR;

namespace eAppointment.Application.Features.Roles.SyncRoles;

internal sealed class SyncRolesCommandHandler(IRoleSyncService roleSyncService) : IRequestHandler<SyncRolesCommand, Result<SyncRolesResult>>
{
    public async Task<Result<SyncRolesResult>> Handle(SyncRolesCommand request, CancellationToken cancellationToken)
    {
        var result = await roleSyncService.SyncRolesAsync(request.Prune, cancellationToken);
        return Result.Success(result);
    }
}


