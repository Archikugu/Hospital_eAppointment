using System.Threading;
using System.Threading.Tasks;

namespace eAppointment.Application.Services;

using eAppointment.Application.Features.Roles.SyncRoles;

public interface IRoleSyncService
{
    Task<SyncRolesResult> SyncRolesAsync(bool prune = false, CancellationToken cancellationToken = default);
}


