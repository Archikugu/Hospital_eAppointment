using eAppointment.Application.Constants;
using eAppointment.Application.Features.Roles.SyncRoles;
using eAppointment.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace eAppointment.WebAPI.Controllers;

[Authorize(Roles = Roles.Admin)]
public sealed class RolesController : BaseApiController
{
    private readonly RoleManager<AppRole> _roleManager;
    private readonly UserManager<AppUser> _userManager;

    public RolesController(RoleManager<AppRole> roleManager, UserManager<AppUser> userManager)
    {
        _roleManager = roleManager;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var roles = await _roleManager.Roles.AsNoTracking().Select(r => new { r.Id, r.Name }).ToListAsync();
        return Ok(roles);
    }

    [HttpPost("sync")]
    public async Task<IActionResult> Sync([FromQuery] bool prune = false)
    {
        var result = await Mediator.Send(new SyncRolesCommand(prune));
        return HandleResult(result);
    }

    // Create Role
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoleRequest request)
    {
        var name = (request?.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(name))
            return BadRequest(new { message = "Role name is required" });

        var exists = await _roleManager.Roles.AnyAsync(r => r.Name!.ToLower() == name.ToLower());
        if (exists)
            return Conflict(new { message = "Role already exists" });

        var role = new AppRole
        {
            Name = name,
            NormalizedName = name.ToUpperInvariant()
        };
        var result = await _roleManager.CreateAsync(role);
        if (!result.Succeeded)
            return Problem(string.Join(", ", result.Errors.Select(e => e.Description)));

        return Ok(new { role.Id, role.Name });
    }

    // Update Role Name
    [HttpPut("{id}")]
    public async Task<IActionResult> Update([FromRoute] string id, [FromBody] UpdateRoleRequest request)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role is null)
            return NotFound(new { message = "Role not found" });

        var newName = (request?.Name ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(newName))
            return BadRequest(new { message = "Role name is required" });

        var nameTaken = await _roleManager.Roles.AnyAsync(r => r.Id != role.Id && r.Name!.ToLower() == newName.ToLower());
        if (nameTaken)
            return Conflict(new { message = "Role name already in use" });

        role.Name = newName;
        role.NormalizedName = newName.ToUpperInvariant();
        var result = await _roleManager.UpdateAsync(role);
        if (!result.Succeeded)
            return Problem(string.Join(", ", result.Errors.Select(e => e.Description)));

        return Ok(new { role.Id, role.Name });
    }

    // Delete Role (only if no users assigned)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete([FromRoute] string id)
    {
        var role = await _roleManager.FindByIdAsync(id);
        if (role is null)
            return NotFound(new { message = "Role not found" });

        // block delete if any user has this role
        var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name!);
        var anyUserInRole = usersInRole.Any();
        if (anyUserInRole)
            return Conflict(new { message = "Cannot delete a role assigned to users" });

        var result = await _roleManager.DeleteAsync(role);
        if (!result.Succeeded)
            return Problem(string.Join(", ", result.Errors.Select(e => e.Description)));

        return NoContent();
    }
}

public sealed record CreateRoleRequest(string Name);
public sealed record UpdateRoleRequest(string Name);


