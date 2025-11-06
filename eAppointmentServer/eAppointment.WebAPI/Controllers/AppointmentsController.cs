using eAppointment.Application.Common.Models;
using eAppointment.Application.Features.Appointments.CreateAppointment;
using eAppointment.Application.Features.Appointments.DeleteAppointment;
using eAppointment.Application.Features.Appointments.GetAllAppointments;
using eAppointment.Application.Features.Appointments.GetAppointmentById;
using eAppointment.Application.Features.Appointments.GetWeeklyAvailability;
using eAppointment.Application.Features.Appointments.UpdateAppointment;
using eAppointment.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace eAppointment.WebAPI.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public sealed class AppointmentsController(IMediator mediator, eAppointment.Domain.Repositories.IAppointmentRepository appointmentRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] Guid? doctorId, [FromQuery] Guid? patientId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        // Geçmiş randevuları tamamla (best-effort)
        _ = await appointmentRepository.CompletePastAppointmentsAsync(DateTime.UtcNow);
        var query = new GetAllAppointmentsQuery { DoctorId = doctorId, PatientId = patientId, StartDate = startDate, EndDate = endDate };
        var result = await mediator.Send(query);
        return result.IsSuccess ? Ok(Result.Success(result.Value)) : BadRequest(Result.Failure(result.Error));
    }

    [HttpGet("availability")]
    public async Task<IActionResult> GetAvailability([FromQuery] Guid doctorId, [FromQuery] DateTime weekStart)
    {
        _ = await appointmentRepository.CompletePastAppointmentsAsync(DateTime.UtcNow);
        var result = await mediator.Send(new GetWeeklyAvailabilityQuery { DoctorId = doctorId, WeekStart = weekStart });
        return result.IsSuccess ? Ok(Result.Success(result.Value)) : BadRequest(Result.Failure(result.Error));
    }

    [HttpPost("sweep-completed")]
    public async Task<IActionResult> SweepCompleted()
    {
        var count = await appointmentRepository.CompletePastAppointmentsAsync(DateTime.UtcNow);
        return Ok(Result.Success(new { completed = count }));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById([FromRoute] Guid id)
    {
        var result = await mediator.Send(new GetAppointmentByIdQuery { Id = id });
        if (result.IsSuccess)
            return Ok(Result.Success(result.Value));

        var code = result.Error.Code ?? string.Empty;
        if (code.Contains("NotFound", StringComparison.OrdinalIgnoreCase))
            return NotFound(Result.Failure(result.Error));
        if (code.Contains("Validation", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result.Failure(result.Error));

        return BadRequest(Result.Failure(result.Error));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAppointmentCommand command)
    {
        var result = await mediator.Send(command);
        if (result.IsSuccess)
            return StatusCode(201, Result.Success(result.Value));

        // Map common error codes to appropriate HTTP statuses
        var code = result.Error.Code ?? string.Empty;
        if (code.Contains("NotFound", StringComparison.OrdinalIgnoreCase))
            return NotFound(Result.Failure(result.Error));
        if (code.Contains("Conflict", StringComparison.OrdinalIgnoreCase))
            return Conflict(Result.Failure(result.Error));
        if (code.Contains("Validation", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result.Failure(result.Error));

        return BadRequest(Result.Failure(result.Error));
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromRoute] Guid id, [FromBody] UpdateAppointmentCommand command)
    {
        command.Id = id;
        var result = await mediator.Send(command);
        return result.IsSuccess ? Ok(Result.Success()) : BadRequest(Result.Failure(result.Error));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] Guid id)
    {
        var result = await mediator.Send(new DeleteAppointmentCommand { Id = id });
        if (result.IsSuccess)
            return Ok(Result.Success());

        // Map common error codes to appropriate HTTP statuses
        var code = result.Error.Code ?? string.Empty;
        if (code.Contains("NotFound", StringComparison.OrdinalIgnoreCase))
            return NotFound(Result.Failure(result.Error));
        if (code.Contains("Validation", StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result.Failure(result.Error));

        return BadRequest(Result.Failure(result.Error));
    }
}


