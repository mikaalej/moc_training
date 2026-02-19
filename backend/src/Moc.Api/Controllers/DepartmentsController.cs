using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Department lookup table maintenance.
/// Departments belong to Divisions and contain Sections.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly MocDbContext _context;

    public DepartmentsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all departments, optionally filtered by division and active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DepartmentDto>>> GetAll(
        [FromQuery] Guid? divisionId = null,
        [FromQuery] bool? activeOnly = true)
    {
        var query = _context.Departments
            .Include(x => x.Division)
            .AsQueryable();

        if (divisionId.HasValue)
        {
            query = query.Where(x => x.DivisionId == divisionId.Value);
        }

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var departments = await query
            .OrderBy(x => x.Code)
            .Select(x => new DepartmentDto
            {
                Id = x.Id,
                DivisionId = x.DivisionId,
                DivisionName = x.Division.Name,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(departments);
    }

    /// <summary>
    /// Gets a single department by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DepartmentDto>> GetById(Guid id)
    {
        var department = await _context.Departments
            .Include(x => x.Division)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound();
        }

        return Ok(new DepartmentDto
        {
            Id = department.Id,
            DivisionId = department.DivisionId,
            DivisionName = department.Division.Name,
            Code = department.Code,
            Name = department.Name,
            IsActive = department.IsActive
        });
    }

    /// <summary>
    /// Creates a new department.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<DepartmentDto>> Create([FromBody] CreateDepartmentDto dto)
    {
        // Validate division exists
        var divisionExists = await _context.Divisions.AnyAsync(x => x.Id == dto.DivisionId);
        if (!divisionExists)
        {
            return BadRequest(new { message = "Invalid division ID." });
        }

        // Check for duplicate code
        var exists = await _context.Departments.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Department with code '{dto.Code}' already exists." });
        }

        var department = new Department
        {
            Id = Guid.NewGuid(),
            DivisionId = dto.DivisionId,
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Departments.Add(department);
        await _context.SaveChangesAsync();

        // Reload with division for response
        await _context.Entry(department).Reference(x => x.Division).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = department.Id }, new DepartmentDto
        {
            Id = department.Id,
            DivisionId = department.DivisionId,
            DivisionName = department.Division.Name,
            Code = department.Code,
            Name = department.Name,
            IsActive = department.IsActive
        });
    }

    /// <summary>
    /// Updates an existing department.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<DepartmentDto>> Update(Guid id, [FromBody] UpdateDepartmentDto dto)
    {
        var department = await _context.Departments
            .Include(x => x.Division)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (department == null)
        {
            return NotFound();
        }

        if (dto.DivisionId.HasValue && dto.DivisionId != department.DivisionId)
        {
            var divisionExists = await _context.Divisions.AnyAsync(x => x.Id == dto.DivisionId.Value);
            if (!divisionExists)
            {
                return BadRequest(new { message = "Invalid division ID." });
            }
            department.DivisionId = dto.DivisionId.Value;
        }

        if (dto.Code != null && dto.Code != department.Code)
        {
            var exists = await _context.Departments.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Department with code '{dto.Code}' already exists." });
            }
            department.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            department.Name = dto.Name;
        }

        department.ModifiedAtUtc = DateTime.UtcNow;
        department.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        // Reload division if changed
        await _context.Entry(department).Reference(x => x.Division).LoadAsync();

        return Ok(new DepartmentDto
        {
            Id = department.Id,
            DivisionId = department.DivisionId,
            DivisionName = department.Division.Name,
            Code = department.Code,
            Name = department.Name,
            IsActive = department.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a department.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var department = await _context.Departments.FindAsync(id);

        if (department == null)
        {
            return NotFound();
        }

        department.IsActive = false;
        department.ModifiedAtUtc = DateTime.UtcNow;
        department.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Department
public record DepartmentDto
{
    public Guid Id { get; init; }
    public Guid DivisionId { get; init; }
    public string DivisionName { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateDepartmentDto
{
    public Guid DivisionId { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateDepartmentDto
{
    public Guid? DivisionId { get; init; }
    public string? Code { get; init; }
    public string? Name { get; init; }
}
