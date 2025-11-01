using eAppointment.Domain.Entities;
using System.Security.Claims;

namespace eAppointment.Application.Services;

public interface IJwtProvider
{
    string CreateToken(AppUser user);
}

