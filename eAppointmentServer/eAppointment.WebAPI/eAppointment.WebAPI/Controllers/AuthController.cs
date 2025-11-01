using eAppointment.Application.Features.Auth.Login;
using Microsoft.AspNetCore.Mvc;

namespace eAppointment.WebAPI.Controllers;

public sealed class AuthController : BaseApiController
{
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginCommandResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Login([FromBody] LoginCommand request, CancellationToken cancellationToken)
    {
        var result = await Mediator.Send(request, cancellationToken);
        return HandleResult(result);
    }
}

