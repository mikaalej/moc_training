using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Category lookup table maintenance.
/// Categories classify MOC requests for filtering and reporting.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly MocDbContext _context;

    public CategoriesController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all categories, optionally filtered by active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.Categories.AsQueryable();

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var categories = await query
            .OrderBy(x => x.Code)
            .Select(x => new CategoryDto
            {
                Id = x.Id,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(categories);
    }

    /// <summary>
    /// Gets a single category by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<CategoryDto>> GetById(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Code = category.Code,
            Name = category.Name,
            IsActive = category.IsActive
        });
    }

    /// <summary>
    /// Creates a new category.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create([FromBody] CreateCategoryDto dto)
    {
        var exists = await _context.Categories.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Category with code '{dto.Code}' already exists." });
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, new CategoryDto
        {
            Id = category.Id,
            Code = category.Code,
            Name = category.Name,
            IsActive = category.IsActive
        });
    }

    /// <summary>
    /// Updates an existing category.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CategoryDto>> Update(Guid id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        if (dto.Code != null && dto.Code != category.Code)
        {
            var exists = await _context.Categories.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Category with code '{dto.Code}' already exists." });
            }
            category.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            category.Name = dto.Name;
        }

        category.ModifiedAtUtc = DateTime.UtcNow;
        category.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return Ok(new CategoryDto
        {
            Id = category.Id,
            Code = category.Code,
            Name = category.Name,
            IsActive = category.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a category.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var category = await _context.Categories.FindAsync(id);

        if (category == null)
        {
            return NotFound();
        }

        category.IsActive = false;
        category.ModifiedAtUtc = DateTime.UtcNow;
        category.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Category
public record CategoryDto
{
    public Guid Id { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateCategoryDto
{
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateCategoryDto
{
    public string? Code { get; init; }
    public string? Name { get; init; }
}
