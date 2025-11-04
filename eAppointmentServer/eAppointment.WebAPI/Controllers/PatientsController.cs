using eAppointment.Application.Features.Patients.GetAllPatients;
using eAppointment.Application.Features.Patients.CreatePatient;
using eAppointment.Application.Features.Patients.UpdatePatient;
using eAppointment.Application.Features.Patients.DeletePatient;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace eAppointment.WebAPI.Controllers;

[Authorize]
public sealed class PatientsController : BaseApiController
{
	/// <summary>
	/// Gets all patients
	/// </summary>
	[HttpGet]
	[ProducesResponseType(typeof(List<Patient>), StatusCodes.Status200OK)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> GetAll(CancellationToken cancellationToken = default)
	{
		var result = await Mediator.Send(new GetAllPatientsQuery(), cancellationToken);
		return HandleResult(result);
	}

	/// <summary>
	/// Creates a new patient
	/// </summary>
	[HttpPost]
	[ProducesResponseType(typeof(Patient), StatusCodes.Status201Created)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> Create([FromBody] CreatePatientCommand request, CancellationToken cancellationToken = default)
	{
		var result = await Mediator.Send(request, cancellationToken);
		if (result.IsSuccess)
		{
			return CreatedAtAction(nameof(GetAll), new { id = result.Value!.Id }, result.Value);
		}
		return HandleResult(result);
	}

	/// <summary>
	/// Updates an existing patient
	/// </summary>
	[HttpPut("{id:guid}")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status400BadRequest)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status409Conflict)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> Update(Guid id, [FromBody] UpdatePatientCommand request, CancellationToken cancellationToken = default)
	{
		if (id != request.Id)
			return BadRequest(new { message = "Route id and body id do not match." });

		var result = await Mediator.Send(request, cancellationToken);
		if (result.IsSuccess)
			return NoContent();
		return HandleResult(result);
	}

	/// <summary>
	/// Deletes a patient by id
	/// </summary>
	[HttpDelete("{id:guid}")]
	[ProducesResponseType(StatusCodes.Status204NoContent)]
	[ProducesResponseType(StatusCodes.Status404NotFound)]
	[ProducesResponseType(StatusCodes.Status401Unauthorized)]
	public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
	{
		var result = await Mediator.Send(new DeletePatientCommand(id), cancellationToken);
		if (result.IsSuccess)
			return NoContent();
		return HandleResult(result);
	}
}
