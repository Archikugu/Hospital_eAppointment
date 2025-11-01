using eAppointment.Application.Common.Models;
using MediatR;

namespace eAppointment.Application.Features.Auth.Login;

public sealed record LoginCommand(string UserNameOrEmail, string Password) : IRequest<Result<LoginCommandResponse>>;
