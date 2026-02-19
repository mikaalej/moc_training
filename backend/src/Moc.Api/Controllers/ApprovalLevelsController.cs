using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for maintaining approval levels. Admin can add/remove/reorder levels and assign a role per level.
/// When a MOC is submitted, MocApprover rows are created from these levels in order.
/// </summary>
[ApiController]
[Route("api/approvallevels")]
public class ApprovalLevelsController : ControllerBase
{
    private readonly MocDbContext _context;

    public ApprovalLevelsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all approval levels ordered by Order.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ApprovalLevelDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.ApprovalLevels.AsQueryable();
        if (activeOnly == true)
            query = query.Where(x => x.IsActive);

        var levels = await query
            .OrderBy(x => x.Order)
            .Select(x => new ApprovalLevelDto
            {
                Id = x.Id,
                Order = x.Order,
                RoleKey = x.RoleKey,
                IsActive = x.IsActive,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(levels);
    }

    /// <summary>
    /// Gets a single approval level by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ApprovalLevelDto>> GetById(Guid id)
    {
        var level = await _context.ApprovalLevels.FindAsync(id);
        if (level == null)
            return NotFound();

        return Ok(new ApprovalLevelDto
        {
            Id = level.Id,
            Order = level.Order,
            RoleKey = level.RoleKey,
            IsActive = level.IsActive,
            CreatedAtUtc = level.CreatedAtUtc
        });
    }

    /// <summary>
    /// Creates a new approval level. Order can be specified; if not, it will be max+1.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApprovalLevelDto>> Create([FromBody] CreateApprovalLevelDto dto)
    {
        var roleExists = await _context.AppRoles.AnyAsync(x => x.Key == dto.RoleKey && x.IsActive);
        if (!roleExists)
            return BadRequest(new { message = "Invalid or inactive role." });

        int order = dto.Order ?? 1;
        if (dto.Order == null)
        {
            var maxOrder = await _context.ApprovalLevels.MaxAsync(x => (int?)x.Order) ?? 0;
            order = maxOrder + 1;
        }

        var level = new ApprovalLevel
        {
            Id = Guid.NewGuid(),
            Order = order,
            RoleKey = dto.RoleKey,
            IsActive = dto.IsActive,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.ApprovalLevels.Add(level);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = level.Id }, new ApprovalLevelDto
        {
            Id = level.Id,
            Order = level.Order,
            RoleKey = level.RoleKey,
            IsActive = level.IsActive,
            CreatedAtUtc = level.CreatedAtUtc
        });
    }

    /// <summary>
    /// Updates an approval level (order, role, or active status).
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ApprovalLevelDto>> Update(Guid id, [FromBody] UpdateApprovalLevelDto dto)
    {
        var level = await _context.ApprovalLevels.FindAsync(id);
        if (level == null)
            return NotFound();

        if (dto.RoleKey != null)
        {
            var roleExists = await _context.AppRoles.AnyAsync(x => x.Key == dto.RoleKey && x.IsActive);
            if (!roleExists)
                return BadRequest(new { message = "Invalid or inactive role." });
            level.RoleKey = dto.RoleKey;
        }

        if (dto.Order.HasValue)
            level.Order = dto.Order.Value;

        if (dto.IsActive.HasValue)
            level.IsActive = dto.IsActive.Value;

        level.ModifiedAtUtc = DateTime.UtcNow;
        level.ModifiedBy = "system";
        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Deletes an approval level. Removes it from the chain; existing MOC approvers are unchanged.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var level = await _context.ApprovalLevels.FindAsync(id);
        if (level == null)
            return NotFound();

        _context.ApprovalLevels.Remove(level);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

public record ApprovalLevelDto
{
    public Guid Id { get; init; }
    public int Order { get; init; }
    public string RoleKey { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}

public record CreateApprovalLevelDto
{
    public int? Order { get; init; }
    public string RoleKey { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
}

public record UpdateApprovalLevelDto
{
    public int? Order { get; init; }
    public string? RoleKey { get; init; }
    public bool? IsActive { get; init; }
}
