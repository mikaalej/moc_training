using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Section lookup table maintenance.
/// Sections belong to Departments.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SectionsController : ControllerBase
{
    private readonly MocDbContext _context;

    public SectionsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all sections, optionally filtered by department and active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SectionDto>>> GetAll(
        [FromQuery] Guid? departmentId = null,
        [FromQuery] bool? activeOnly = true)
    {
        var query = _context.Sections
            .Include(x => x.Department)
            .AsQueryable();

        if (departmentId.HasValue)
        {
            query = query.Where(x => x.DepartmentId == departmentId.Value);
        }

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var sections = await query
            .OrderBy(x => x.Code)
            .Select(x => new SectionDto
            {
                Id = x.Id,
                DepartmentId = x.DepartmentId,
                DepartmentName = x.Department.Name,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(sections);
    }

    /// <summary>
    /// Gets a single section by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SectionDto>> GetById(Guid id)
    {
        var section = await _context.Sections
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (section == null)
        {
            return NotFound();
        }

        return Ok(new SectionDto
        {
            Id = section.Id,
            DepartmentId = section.DepartmentId,
            DepartmentName = section.Department.Name,
            Code = section.Code,
            Name = section.Name,
            IsActive = section.IsActive
        });
    }

    /// <summary>
    /// Creates a new section.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SectionDto>> Create([FromBody] CreateSectionDto dto)
    {
        var departmentExists = await _context.Departments.AnyAsync(x => x.Id == dto.DepartmentId);
        if (!departmentExists)
        {
            return BadRequest(new { message = "Invalid department ID." });
        }

        var exists = await _context.Sections.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Section with code '{dto.Code}' already exists." });
        }

        var section = new Section
        {
            Id = Guid.NewGuid(),
            DepartmentId = dto.DepartmentId,
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Sections.Add(section);
        await _context.SaveChangesAsync();

        await _context.Entry(section).Reference(x => x.Department).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = section.Id }, new SectionDto
        {
            Id = section.Id,
            DepartmentId = section.DepartmentId,
            DepartmentName = section.Department.Name,
            Code = section.Code,
            Name = section.Name,
            IsActive = section.IsActive
        });
    }

    /// <summary>
    /// Updates an existing section.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SectionDto>> Update(Guid id, [FromBody] UpdateSectionDto dto)
    {
        var section = await _context.Sections
            .Include(x => x.Department)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (section == null)
        {
            return NotFound();
        }

        if (dto.DepartmentId.HasValue && dto.DepartmentId != section.DepartmentId)
        {
            var departmentExists = await _context.Departments.AnyAsync(x => x.Id == dto.DepartmentId.Value);
            if (!departmentExists)
            {
                return BadRequest(new { message = "Invalid department ID." });
            }
            section.DepartmentId = dto.DepartmentId.Value;
        }

        if (dto.Code != null && dto.Code != section.Code)
        {
            var exists = await _context.Sections.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Section with code '{dto.Code}' already exists." });
            }
            section.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            section.Name = dto.Name;
        }

        section.ModifiedAtUtc = DateTime.UtcNow;
        section.ModifiedBy = "system";

        await _context.SaveChangesAsync();
        await _context.Entry(section).Reference(x => x.Department).LoadAsync();

        return Ok(new SectionDto
        {
            Id = section.Id,
            DepartmentId = section.DepartmentId,
            DepartmentName = section.Department.Name,
            Code = section.Code,
            Name = section.Name,
            IsActive = section.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a section.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var section = await _context.Sections.FindAsync(id);

        if (section == null)
        {
            return NotFound();
        }

        section.IsActive = false;
        section.ModifiedAtUtc = DateTime.UtcNow;
        section.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Section
public record SectionDto
{
    public Guid Id { get; init; }
    public Guid DepartmentId { get; init; }
    public string DepartmentName { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateSectionDto
{
    public Guid DepartmentId { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateSectionDto
{
    public Guid? DepartmentId { get; init; }
    public string? Code { get; init; }
    public string? Name { get; init; }
}
