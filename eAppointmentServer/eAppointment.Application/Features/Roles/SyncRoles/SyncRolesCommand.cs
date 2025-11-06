using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Roles.SyncRoles;

public sealed record SyncRolesCommand(bool Prune = false) : IRequest<Result<SyncRolesResult>>;


