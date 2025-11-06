using eAppointment.Application.Services;
using MediatR;

namespace eAppointment.Application.Features.Users.GetRoles;

public sealed record GetUserRolesQuery(string UserId) : IRequest<IReadOnlyList<string>>;

internal sealed class GetUserRolesQueryHandler(IUserRoleService service) : IRequestHandler<GetUserRolesQuery, IReadOnlyList<string>>
{
    public Task<IReadOnlyList<string>> Handle(GetUserRolesQuery request, CancellationToken cancellationToken)
        => service.GetUserRolesAsync(request.UserId, cancellationToken);
}


