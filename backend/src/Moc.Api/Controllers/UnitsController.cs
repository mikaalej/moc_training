using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Unit lookup table maintenance.
/// Units represent plant/process units affected by changes.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class UnitsController : ControllerBase
{
    private readonly MocDbContext _context;

    public UnitsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all units, optionally filtered by active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UnitDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.Units.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var units = await query
            .OrderBy(x => x.Code)
            .Select(x => new UnitDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(units);
    }

    /// <summary>
    /// Gets a single unit by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UnitDto>> GetById(Guid id)
    {
        var unit = await _context.Units.FindAsync(id);

        if (unit == null)
        {
            return NotFound();
        }

        return Ok(new UnitDto
        {
            Id = unit.Id,
            Code = unit.Code,
            Name = unit.Name,
            IsActive = unit.IsActive
        });
    }

    /// <summary>
    /// Creates a new unit.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UnitDto>> Create([FromBody] CreateUnitDto dto)
    {
        var exists = await _context.Units.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Unit with code '{dto.Code}' already exists." });
        }

        var unit = new Unit
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Units.Add(unit);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = unit.Id }, new UnitDto
        {
            Id = unit.Id,
            Code = unit.Code,
            Name = unit.Name,
            IsActive = unit.IsActive
        });
    }

    /// <summary>
    /// Updates an existing unit.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UnitDto>> Update(Guid id, [FromBody] UpdateUnitDto dto)
    {
        var unit = await _context.Units.FindAsync(id);

        if (unit == null)
        {
            return NotFound();
        }

        if (dto.Code != null && dto.Code != unit.Code)
        {
            var exists = await _context.Units.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Unit with code '{dto.Code}' already exists." });
            }
            unit.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            unit.Name = dto.Name;
        }

        unit.ModifiedAtUtc = DateTime.UtcNow;
        unit.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return Ok(new UnitDto
        {
            Id = unit.Id,
            Code = unit.Code,
            Name = unit.Name,
            IsActive = unit.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a unit.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var unit = await _context.Units.FindAsync(id);

        if (unit == null)
        {
            return NotFound();
        }

        unit.IsActive = false;
        unit.ModifiedAtUtc = DateTime.UtcNow;
        unit.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Unit
public record UnitDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateUnitDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateUnitDto
{
    public string? Code { get; init; }
    public string? Name { get; init; }
}
