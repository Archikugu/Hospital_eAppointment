using eAppointment.Application.Common.Models;
using eAppointment.Application.Services;
using eAppointment.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.Application.Features.Auth.Login;

internal sealed class LoginCommandHandler(UserManager<AppUser> userManager, IJwtProvider jwtProvider) : IRequestHandler<LoginCommand, Result<LoginCommandResponse>>
{
    public async Task<Result<LoginCommandResponse>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        AppUser? appUser = await userManager.Users.FirstOrDefaultAsync(p => p.UserName == request.UserNameOrEmail || p.Email == request.UserNameOrEmail, cancellationToken);
        if (appUser is null)
        {
            return Result.Failure<LoginCommandResponse>(Error.NotFound("User", request.UserNameOrEmail));
        }
        bool isPasswordCorrect = await userManager.CheckPasswordAsync(appUser, request.Password);
        if (!isPasswordCorrect)
        {
            return Result.Failure<LoginCommandResponse>(Error.Validation("Invalid username or password."));
        }

        string token = jwtProvider.CreateToken(appUser);
        return Result.Success(new LoginCommandResponse(token));
    }
}