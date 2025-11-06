using eAppointment.Application.Services;
using MediatR;

namespace eAppointment.Application.Features.Users.GetAll;

public sealed record GetAllUsersQuery() : IRequest<IReadOnlyList<UserListItemDto>>;

internal sealed class GetAllUsersQueryHandler(IUserRoleService service) : IRequestHandler<GetAllUsersQuery, IReadOnlyList<UserListItemDto>>
{
    public Task<IReadOnlyList<UserListItemDto>> Handle(GetAllUsersQuery request, CancellationToken cancellationToken)
        => service.GetAllUsersAsync(cancellationToken);
}


