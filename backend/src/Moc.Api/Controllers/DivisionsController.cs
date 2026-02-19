using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Division lookup table maintenance.
/// Supports list, create, update, and soft-delete (deactivate) operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DivisionsController : ControllerBase
{
    private readonly MocDbContext _context;

    public DivisionsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all divisions, optionally filtered by active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DivisionDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.Divisions.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var divisions = await query
            .OrderBy(x => x.Code)
            .Select(x => new DivisionDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(divisions);
    }

    /// <summary>
    /// Gets a single division by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DivisionDto>> GetById(Guid id)
    {
        var division = await _context.Divisions.FindAsync(id);

        if (division == null)
        {
            return NotFound();
        }

        return Ok(new DivisionDto
        {
            Id = division.Id,
            Code = division.Code,
            Name = division.Name,
            IsActive = division.IsActive
        });
    }

    /// <summary>
    /// Creates a new division.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DivisionDto>> Create([FromBody] CreateDivisionDto dto)
    {
        // Check for duplicate code
        var exists = await _context.Divisions.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Division with code '{dto.Code}' already exists." });
        }

        var division = new Division
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system" // TODO: Get from current user when auth is implemented
        };

        _context.Divisions.Add(division);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = division.Id }, new DivisionDto
        {
            Id = division.Id,
            Code = division.Code,
            Name = division.Name,
            IsActive = division.IsActive
        });
    }

    /// <summary>
    /// Updates an existing division.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DivisionDto>> Update(Guid id, [FromBody] UpdateDivisionDto dto)
    {
        var division = await _context.Divisions.FindAsync(id);

        if (division == null)
        {
            return NotFound();
        }

        // Check for duplicate code if code is being changed
        if (dto.Code != null && dto.Code != division.Code)
        {
            var exists = await _context.Divisions.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Division with code '{dto.Code}' already exists." });
            }
            division.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            division.Name = dto.Name;
        }

        division.ModifiedAtUtc = DateTime.UtcNow;
        division.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return Ok(new DivisionDto
        {
            Id = division.Id,
            Code = division.Code,
            Name = division.Name,
            IsActive = division.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a division.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var division = await _context.Divisions.FindAsync(id);

        if (division == null)
        {
            return NotFound();
        }

        division.IsActive = false;
        division.ModifiedAtUtc = DateTime.UtcNow;
        division.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Division
public record DivisionDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateDivisionDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateDivisionDto
{
    public string? Code { get; init; }
    public string? Name { get; init; }
}
