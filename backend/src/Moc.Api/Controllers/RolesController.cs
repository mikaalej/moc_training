using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for listing application roles (used in user management and approval level assignment).
/// Roles are seeded; this controller is read-only.
/// </summary>
[ApiController]
[Route("api/roles")]
public class RolesController : ControllerBase
{
    private readonly MocDbContext _context;

    public RolesController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all roles, optionally active only.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RoleDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.AppRoles.AsQueryable();
        if (activeOnly == true)
            query = query.Where(x => x.IsActive);

        var roles = await query
            .OrderBy(x => x.Key)
            .Select(x => new RoleDto { Id = x.Id, Key = x.Key, Name = x.Name, IsActive = x.IsActive })
            .ToListAsync();

        return Ok(roles);
    }
}

public record RoleDto
{
    public Guid Id { get; init; }
    public string Key { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}
