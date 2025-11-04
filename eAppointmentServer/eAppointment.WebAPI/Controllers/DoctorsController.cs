using eAppointment.Application.Features.Doctors.CreateDoctor;
using eAppointment.Application.Features.Doctors.GetAllDoctor;
using eAppointment.Application.Features.Doctors.DeleteDoctor;
using eAppointment.Application.Features.Doctors.UpdateDoctor;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace eAppointment.WebAPI.Controllers;

[Authorize]
public sealed class DoctorsController : BaseApiController
{
    /// <summary>
    /// Gets all doctors with optional sorting
    /// </summary>
    /// <param name="sortByDepartment">Sort by department</param>
    /// <param name="sortByFullName">Sort by full name</param>
    /// <param name="sortDescending">Sort in descending order</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>List of doctors</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<Doctor>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAll(
        [FromQuery] bool sortByDepartment = false,
        [FromQuery] bool sortByFullName = false,
        [FromQuery] bool sortDescending = false,
        CancellationToken cancellationToken = default)
    {
        var query = new GetAllDoctorQuery(
            SortByDepartment: sortByDepartment,
            SortByFullName: sortByFullName,
            SortDescending: sortDescending
        );

        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Creates a new doctor
    /// </summary>
    /// <param name="request">Doctor creation data</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Created doctor</returns>
    [HttpPost]
    [ProducesResponseType(typeof(Doctor), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Create(
        [FromBody] CreateDoctorCommand request,
        CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(request, cancellationToken);
        
        if (result.IsSuccess)
        {
            return CreatedAtAction(
                nameof(GetAll),
                new { id = result.Value!.Id },
                result.Value);
        }

        return HandleResult(result);
    }

    /// <summary>
    /// Updates an existing doctor
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateDoctorCommand request, CancellationToken cancellationToken = default)
    {
        if (id != request.Id)
        {
            return BadRequest(new { message = "Route id and body id do not match." });
        }

        var result = await Mediator.Send(request, cancellationToken);
        if (result.IsSuccess)
        {
            return NoContent();
        }
        return HandleResult(result);
    }

    /// <summary>
    /// Deletes a doctor by id
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await Mediator.Send(new DeleteDoctorCommand(id), cancellationToken);
        if (result.IsSuccess)
        {
            return NoContent();
        }
        return HandleResult(result);
    }
}

