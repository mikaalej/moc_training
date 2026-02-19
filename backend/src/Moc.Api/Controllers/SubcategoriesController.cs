using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Subcategory lookup table maintenance.
/// Subcategories belong to Categories for more granular classification.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class SubcategoriesController : ControllerBase
{
    private readonly MocDbContext _context;

    public SubcategoriesController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all subcategories, optionally filtered by category and active status.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SubcategoryDto>>> GetAll(
        [FromQuery] Guid? categoryId = null,
        [FromQuery] bool? activeOnly = true)
    {
        var query = _context.Subcategories
            .Include(x => x.Category)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
        }

        if (activeOnly == true)
        {
            query = query.Where(x => x.IsActive);
        }

        var subcategories = await query
            .OrderBy(x => x.Code)
            .Select(x => new SubcategoryDto
            {
                Id = x.Id,
                CategoryId = x.CategoryId,
                CategoryName = x.Category.Name,
                Code = x.Code,
                Name = x.Name,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(subcategories);
    }

    /// <summary>
    /// Gets a single subcategory by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SubcategoryDto>> GetById(Guid id)
    {
        var subcategory = await _context.Subcategories
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (subcategory == null)
        {
            return NotFound();
        }

        return Ok(new SubcategoryDto
        {
            Id = subcategory.Id,
            CategoryId = subcategory.CategoryId,
            CategoryName = subcategory.Category.Name,
            Code = subcategory.Code,
            Name = subcategory.Name,
            IsActive = subcategory.IsActive
        });
    }

    /// <summary>
    /// Creates a new subcategory.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SubcategoryDto>> Create([FromBody] CreateSubcategoryDto dto)
    {
        var categoryExists = await _context.Categories.AnyAsync(x => x.Id == dto.CategoryId);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Invalid category ID." });
        }

        var exists = await _context.Subcategories.AnyAsync(x => x.Code == dto.Code);
        if (exists)
        {
            return BadRequest(new { message = $"Subcategory with code '{dto.Code}' already exists." });
        }

        var subcategory = new Subcategory
        {
            Id = Guid.NewGuid(),
            CategoryId = dto.CategoryId,
            Code = dto.Code,
            Name = dto.Name,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Subcategories.Add(subcategory);
        await _context.SaveChangesAsync();

        await _context.Entry(subcategory).Reference(x => x.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = subcategory.Id }, new SubcategoryDto
        {
            Id = subcategory.Id,
            CategoryId = subcategory.CategoryId,
            CategoryName = subcategory.Category.Name,
            Code = subcategory.Code,
            Name = subcategory.Name,
            IsActive = subcategory.IsActive
        });
    }

    /// <summary>
    /// Updates an existing subcategory.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SubcategoryDto>> Update(Guid id, [FromBody] UpdateSubcategoryDto dto)
    {
        var subcategory = await _context.Subcategories
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (subcategory == null)
        {
            return NotFound();
        }

        if (dto.CategoryId.HasValue && dto.CategoryId != subcategory.CategoryId)
        {
            var categoryExists = await _context.Categories.AnyAsync(x => x.Id == dto.CategoryId.Value);
            if (!categoryExists)
            {
                return BadRequest(new { message = "Invalid category ID." });
            }
            subcategory.CategoryId = dto.CategoryId.Value;
        }

        if (dto.Code != null && dto.Code != subcategory.Code)
        {
            var exists = await _context.Subcategories.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Subcategory with code '{dto.Code}' already exists." });
            }
            subcategory.Code = dto.Code;
        }

        if (dto.Name != null)
        {
            subcategory.Name = dto.Name;
        }

        subcategory.ModifiedAtUtc = DateTime.UtcNow;
        subcategory.ModifiedBy = "system";

        await _context.SaveChangesAsync();
        await _context.Entry(subcategory).Reference(x => x.Category).LoadAsync();

        return Ok(new SubcategoryDto
        {
            Id = subcategory.Id,
            CategoryId = subcategory.CategoryId,
            CategoryName = subcategory.Category.Name,
            Code = subcategory.Code,
            Name = subcategory.Name,
            IsActive = subcategory.IsActive
        });
    }

    /// <summary>
    /// Soft-deletes (deactivates) a subcategory.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var subcategory = await _context.Subcategories.FindAsync(id);

        if (subcategory == null)
        {
            return NotFound();
        }

        subcategory.IsActive = false;
        subcategory.ModifiedAtUtc = DateTime.UtcNow;
        subcategory.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Subcategory
public record SubcategoryDto
{
    public Guid Id { get; init; }
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsActive { get; init; }
}

public record CreateSubcategoryDto
{
    public Guid CategoryId { get; init; }
    public string Code { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
}

public record UpdateSubcategoryDto
{
    public Guid? CategoryId { get; init; }
    public string? Code { get; init; }
    public string? Name { get; init; }
}
