using eAppointment.Application.Constants;
using eAppointment.Application.Features.Users.GetAll;
using eAppointment.Application.Features.Users.GetRoles;
using eAppointment.Application.Features.Users.UpdateRoles;
using eAppointment.Application.Features.Users.Create;
using eAppointment.Application.Features.Users.Update;
using eAppointment.Application.Features.Users.Delete;
using eAppointment.Application.Features.Users.Promote;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using eAppointment.Domain.Repositories;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using eAppointment.Application.Common.Models;

namespace eAppointment.WebAPI.Controllers;

[Authorize(Roles = Roles.Admin)]
public sealed class UsersController : BaseApiController
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IDoctorRepository _doctorRepository;
    private readonly IPatientRepository _patientRepository;
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UsersController(UserManager<AppUser> userManager, IDoctorRepository doctorRepository, IPatientRepository patientRepository, IAppointmentRepository appointmentRepository, IUnitOfWork unitOfWork)
    {
        _userManager = userManager;
        _doctorRepository = doctorRepository;
        _patientRepository = patientRepository;
        _appointmentRepository = appointmentRepository;
        _unitOfWork = unitOfWork;
    }

    // GET /api/users
    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
        => Ok(await Mediator.Send(new GetAllUsersQuery(), cancellationToken));

    // GET /api/users/{id}/roles
    [HttpGet("{id}/roles")]
    public async Task<IActionResult> GetUserRoles([FromRoute] string id)
        => Ok(new { userId = id, roles = await Mediator.Send(new GetUserRolesQuery(id)) });

    // PUT /api/users/{id}/roles
    [HttpPut("{id}/roles")]
    public async Task<IActionResult> UpdateUserRoles([FromRoute] string id, [FromBody] UpdateRolesBody body)
    {
        // Rol kaldırma ön-kontrolü: kaldırılacak roller bağımlılıklara sahip mi?
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound(Result.Failure(Error.NotFound("User", id)));
        }

        var targetRoles = body?.Roles ?? Array.Empty<string>();
        var currentRoles = await _userManager.GetRolesAsync(user);

        var rolesToRemove = currentRoles
            .Where(r => !targetRoles.Any(t => string.Equals(t, r, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (rolesToRemove.Count > 0 && Guid.TryParse(id, out var preCheckUserGuid))
        {
            var nowUtc = DateTime.UtcNow;
            if (rolesToRemove.Any(r => string.Equals(r, Roles.Doctor, StringComparison.OrdinalIgnoreCase)))
            {
                var doc = await _doctorRepository.GetByAppUserIdAsync(preCheckUserGuid, HttpContext.RequestAborted);
                if (doc is not null && await _doctorRepository.HasFutureAppointmentsAsync(doc.Id, nowUtc, HttpContext.RequestAborted))
                {
                    return Conflict(Result.Failure(Error.Conflict("Doctor role cannot be removed while future appointments exist. Please cancel/reassign future appointments first.")));
                }
            }
            if (rolesToRemove.Any(r => string.Equals(r, Roles.Patient, StringComparison.OrdinalIgnoreCase)))
            {
                var pat = await _patientRepository.GetByAppUserIdAsync(preCheckUserGuid, HttpContext.RequestAborted);
                if (pat is not null && await _patientRepository.HasFutureAppointmentsAsync(pat.Id, nowUtc, HttpContext.RequestAborted))
                {
                    return Conflict(Result.Failure(Error.Conflict("Patient role cannot be removed while future appointments exist. Please cancel/reassign future appointments first.")));
                }
            }
        }

        var result = await Mediator.Send(new UpdateUserRolesCommand(id, targetRoles));

        // Demote logic: if roles removed include Doctor/Patient, delete corresponding records by AppUserId
        var removed = result.Removed?.ToList() ?? new List<string>();
        if (removed.Count > 0)
        {
            if (Guid.TryParse(id, out var userGuid))
            {
                var nowUtc = DateTime.UtcNow;
                if (removed.Any(r => string.Equals(r, Roles.Doctor, StringComparison.OrdinalIgnoreCase)))
                {
                    var doc = await _doctorRepository.GetByAppUserIdAsync(userGuid, HttpContext.RequestAborted);
                    if (doc is not null)
                    {
                        // Gelecekteki randevuları iptal et
                        var docAppointments = await _appointmentRepository.GetByDoctorIdAsync(doc.Id, HttpContext.RequestAborted);
                        foreach (var appt in docAppointments.Where(a => a.StartDate > nowUtc && !a.IsCancelled))
                        {
                            appt.IsCancelled = true;
                            _appointmentRepository.Update(appt);
                        }

                        // Soft-delete: pasifleştir ve ilişkiyi kopar
                        doc.IsActive = false;
                        doc.AppUserId = null;
                        await _unitOfWork.SaveChangesAsync(HttpContext.RequestAborted);
                    }
                }
                if (removed.Any(r => string.Equals(r, Roles.Patient, StringComparison.OrdinalIgnoreCase)))
                {
                    var pat = await _patientRepository.GetByAppUserIdAsync(userGuid, HttpContext.RequestAborted);
                    if (pat is not null)
                    {
                        // Gelecekteki randevuları iptal et
                        var patAppointments = await _appointmentRepository.GetByPatientIdAsync(pat.Id, HttpContext.RequestAborted);
                        foreach (var appt in patAppointments.Where(a => a.StartDate > nowUtc && !a.IsCancelled))
                        {
                            appt.IsCancelled = true;
                            _appointmentRepository.Update(appt);
                        }

                        // Soft-delete: pasifleştir ve ilişkiyi kopar
                        pat.IsActive = false;
                        pat.AppUserId = null;
                        await _unitOfWork.SaveChangesAsync(HttpContext.RequestAborted);
                    }
                }
            }
        }

        return Ok(result);
    }

    public sealed record UpdateRolesBody
    {
        public IReadOnlyList<string> Roles { get; init; } = Array.Empty<string>();
    }

    // POST /api/users
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBody body, CancellationToken ct)
        => Ok(await Mediator.Send(new CreateUserCommand(body.Username, body.Email, body.Password, body.FirstName, body.LastName), ct));

    public sealed record CreateBody(string Username, string Email, string Password, string? FirstName, string? LastName);

    // PUT /api/users/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromRoute] string id, [FromBody] UpdateBody body, CancellationToken ct)
        => Ok(await Mediator.Send(new UpdateUserCommand(id, body.Email, body.FirstName, body.LastName, body.IsActive), ct));

    public sealed record UpdateBody(string? Email, string? FirstName, string? LastName, bool? IsActive);

    // DELETE /api/users/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id, CancellationToken ct)
    {
        // Kullanıcı silinmeden önce: gelecekteki randevuları iptal et ve domain kayıtlarını soft-delete yap
        if (Guid.TryParse(id, out var userGuid))
        {
            var doc = await _doctorRepository.GetByAppUserIdAsync(userGuid, ct);
            if (doc is not null)
            {
                var docAppointments = await _appointmentRepository.GetByDoctorIdAsync(doc.Id, ct);
                // Silinen kullanıcı için TÜM randevuları iptal et (geçmiş/gelecek fark etmeksizin)
                foreach (var appt in docAppointments.Where(a => !a.IsCancelled))
                {
                    appt.IsCancelled = true;
                    _appointmentRepository.Update(appt);
                }
                doc.IsActive = false;
                doc.AppUserId = null;
                await _unitOfWork.SaveChangesAsync(ct);
            }

            var pat = await _patientRepository.GetByAppUserIdAsync(userGuid, ct);
            if (pat is not null)
            {
                var patAppointments = await _appointmentRepository.GetByPatientIdAsync(pat.Id, ct);
                // Silinen kullanıcı için TÜM randevuları iptal et (geçmiş/gelecek fark etmeksizin)
                foreach (var appt in patAppointments.Where(a => !a.IsCancelled))
                {
                    appt.IsCancelled = true;
                    _appointmentRepository.Update(appt);
                }
                pat.IsActive = false;
                pat.AppUserId = null;
                await _unitOfWork.SaveChangesAsync(ct);
            }
        }

        await Mediator.Send(new DeleteUserCommand(id), ct);
        return NoContent();
    }

    // POST /api/users/{id}/promote-to-doctor
    [HttpPost("{id}/promote-to-doctor")]
    public async Task<IActionResult> PromoteToDoctor([FromRoute] string id, [FromBody] PromoteDoctorBody body, CancellationToken ct)
    {
        var firstName = body.FirstName?.Trim() ?? string.Empty;
        var lastName = body.LastName?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)) return BadRequest(Result.Failure(Error.Validation("FirstName and LastName are required")));
        if (body.DepartmentValue <= 0) return BadRequest(Result.Failure(Error.Validation("DepartmentValue must be provided")));
        if (!Guid.TryParse(id, out var userGuidDoctor)) return BadRequest(Result.Failure(Error.Validation("Invalid user id")));
        var doctor = await Mediator.Send(new PromoteToDoctorCommand(userGuidDoctor, firstName, lastName, body.DepartmentValue), ct);
        return Ok(doctor);
    }

    public sealed record PromoteDoctorBody(string? FirstName, string? LastName, int DepartmentValue);

    // POST /api/users/{id}/promote-to-patient
    [HttpPost("{id}/promote-to-patient")]
    public async Task<IActionResult> PromoteToPatient([FromRoute] string id, [FromBody] PromotePatientBody body, CancellationToken ct)
    {
        var firstName = body.FirstName?.Trim() ?? string.Empty;
        var lastName = body.LastName?.Trim() ?? string.Empty;
        var identity = body.IdentityNumber?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(firstName) || string.IsNullOrWhiteSpace(lastName)) return BadRequest(Result.Failure(Error.Validation("FirstName and LastName are required")));
        if (string.IsNullOrWhiteSpace(identity) || identity.Length != 11) return BadRequest(Result.Failure(Error.Validation("IdentityNumber must be 11 digits")));
        if (!Guid.TryParse(id, out var userGuidPatient)) return BadRequest(Result.Failure(Error.Validation("Invalid user id")));
        var patient = await Mediator.Send(new PromoteToPatientCommand(userGuidPatient, firstName, lastName, identity), ct);
        return Ok(patient);
    }

    public sealed record PromotePatientBody(string? FirstName, string? LastName, string? IdentityNumber);
}


