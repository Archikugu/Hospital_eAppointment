using eAppointment.Application.Common.Models;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace eAppointment.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    private IMediator? _mediator;

    protected IMediator Mediator => _mediator ??= HttpContext.RequestServices.GetRequiredService<IMediator>();

    /// <summary>
    /// Handles Result and returns appropriate IActionResult
    /// </summary>
    protected IActionResult HandleResult<T>(Result<T> result)
    {
        if (result.IsSuccess && result.Value == null)
            return NotFound();

        if (result.IsSuccess)
            return Ok(result.Value);

        return HandleError(result.Error);
    }

    /// <summary>
    /// Handles Result without value and returns appropriate IActionResult
    /// </summary>
    protected IActionResult HandleResult(Result result)
    {
        if (result.IsSuccess)
            return Ok();

        return HandleError(result.Error);
    }

    /// <summary>
    /// Handles errors and returns appropriate HTTP status code
    /// </summary>
    protected IActionResult HandleError(Error error)
    {
        return error.Code switch
        {
            "Error.NotFound" => NotFound(new { message = error.Message }),
            "Error.Validation" => BadRequest(new { message = error.Message }),
            "Error.Conflict" => Conflict(new { message = error.Message }),
            "Error.NullValue" => BadRequest(new { message = error.Message }),
            _ => StatusCode(500, new { message = error.Message })
        };
    }
}

