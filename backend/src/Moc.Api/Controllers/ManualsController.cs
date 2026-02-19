using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;
using Moc.Domain.Enums;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Manuals and Procedures management.
/// Supports hierarchical document structure with procedures, work instructions, and forms.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ManualsController : ControllerBase
{
    private readonly MocDbContext _context;

    public ManualsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all manuals with optional active filter.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ManualDto>>> GetAll([FromQuery] bool? activeOnly = true)
    {
        var query = _context.Manuals.AsQueryable();

        if (activeOnly == true)
            query = query.Where(x => x.IsActive);

        var manuals = await query
            .OrderBy(x => x.Code)
            .Select(x => new ManualDto
            {
                Id = x.Id,
                Title = x.Title,
                Code = x.Code,
                IsActive = x.IsActive,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(manuals);
    }

    /// <summary>
    /// Gets a single manual by ID with its procedure hierarchy.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ManualDetailDto>> GetById(Guid id)
    {
        var manual = await _context.Manuals
            .FirstOrDefaultAsync(x => x.Id == id);

        if (manual == null)
        {
            return NotFound();
        }

        // Get all procedure nodes for this manual
        var nodes = await _context.ProcedureNodes
            .Where(x => x.ManualId == id)
            .OrderBy(x => x.Title)
            .ToListAsync();

        // Build hierarchy (root nodes have no parent)
        var rootNodes = nodes
            .Where(x => x.ParentNodeId == null)
            .Select(x => BuildNodeTree(x, nodes))
            .ToList();

        return Ok(new ManualDetailDto
        {
            Id = manual.Id,
            Title = manual.Title,
            Code = manual.Code,
            IsActive = manual.IsActive,
            CreatedAtUtc = manual.CreatedAtUtc,
            Nodes = rootNodes
        });
    }

    /// <summary>
    /// Creates a new manual.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ManualDto>> Create([FromBody] CreateManualDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            var exists = await _context.Manuals.AnyAsync(x => x.Code == dto.Code);
            if (exists)
            {
                return BadRequest(new { message = $"Manual with code '{dto.Code}' already exists." });
            }
        }

        var manual = new Manual
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Code = dto.Code,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Manuals.Add(manual);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = manual.Id }, new ManualDto
        {
            Id = manual.Id,
            Title = manual.Title,
            Code = manual.Code,
            IsActive = manual.IsActive,
            CreatedAtUtc = manual.CreatedAtUtc
        });
    }

    /// <summary>
    /// Updates an existing manual.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ManualDto>> Update(Guid id, [FromBody] UpdateManualDto dto)
    {
        var manual = await _context.Manuals.FindAsync(id);

        if (manual == null)
        {
            return NotFound();
        }

        if (dto.Title != null) manual.Title = dto.Title;
        if (dto.Code != null)
        {
            var exists = await _context.Manuals.AnyAsync(x => x.Code == dto.Code && x.Id != id);
            if (exists)
            {
                return BadRequest(new { message = $"Manual with code '{dto.Code}' already exists." });
            }
            manual.Code = dto.Code;
        }

        manual.ModifiedAtUtc = DateTime.UtcNow;
        manual.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return Ok(new ManualDto
        {
            Id = manual.Id,
            Title = manual.Title,
            Code = manual.Code,
            IsActive = manual.IsActive,
            CreatedAtUtc = manual.CreatedAtUtc
        });
    }

    /// <summary>
    /// Deactivates a manual.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var manual = await _context.Manuals.FindAsync(id);

        if (manual == null)
        {
            return NotFound();
        }

        manual.IsActive = false;
        manual.ModifiedAtUtc = DateTime.UtcNow;
        manual.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    #region Procedure Nodes

    /// <summary>
    /// Gets all procedure nodes for a manual.
    /// </summary>
    [HttpGet("{manualId}/nodes")]
    public async Task<ActionResult<IEnumerable<ProcedureNodeDto>>> GetNodes(Guid manualId)
    {
        var manualExists = await _context.Manuals.AnyAsync(x => x.Id == manualId);
        if (!manualExists)
        {
            return NotFound();
        }

        var nodes = await _context.ProcedureNodes
            .Where(x => x.ManualId == manualId)
            .OrderBy(x => x.Title)
            .Select(x => new ProcedureNodeDto
            {
                Id = x.Id,
                ManualId = x.ManualId,
                ParentNodeId = x.ParentNodeId,
                NodeType = x.NodeType,
                NodeTypeName = x.NodeType.ToString(),
                Title = x.Title,
                Url = x.Url,
                IsActive = x.IsActive
            })
            .ToListAsync();

        return Ok(nodes);
    }

    /// <summary>
    /// Gets a single procedure node by ID.
    /// </summary>
    [HttpGet("nodes/{id}")]
    public async Task<ActionResult<ProcedureNodeDto>> GetNodeById(Guid id)
    {
        var node = await _context.ProcedureNodes.FindAsync(id);

        if (node == null)
        {
            return NotFound();
        }

        return Ok(new ProcedureNodeDto
        {
            Id = node.Id,
            ManualId = node.ManualId,
            ParentNodeId = node.ParentNodeId,
            NodeType = node.NodeType,
            NodeTypeName = node.NodeType.ToString(),
            Title = node.Title,
            Url = node.Url,
            IsActive = node.IsActive
        });
    }

    /// <summary>
    /// Creates a new procedure node.
    /// </summary>
    [HttpPost("{manualId}/nodes")]
    public async Task<ActionResult<ProcedureNodeDto>> CreateNode(Guid manualId, [FromBody] CreateProcedureNodeDto dto)
    {
        var manualExists = await _context.Manuals.AnyAsync(x => x.Id == manualId);
        if (!manualExists)
        {
            return NotFound(new { message = "Manual not found." });
        }

        if (dto.ParentNodeId.HasValue)
        {
            var parentExists = await _context.ProcedureNodes.AnyAsync(x => x.Id == dto.ParentNodeId.Value);
            if (!parentExists)
            {
                return BadRequest(new { message = "Invalid parent node ID." });
            }
        }

        var node = new ProcedureNode
        {
            Id = Guid.NewGuid(),
            ManualId = manualId,
            ParentNodeId = dto.ParentNodeId,
            NodeType = dto.NodeType,
            Title = dto.Title,
            Url = dto.Url,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.ProcedureNodes.Add(node);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetNodeById), new { id = node.Id }, new ProcedureNodeDto
        {
            Id = node.Id,
            ManualId = node.ManualId,
            ParentNodeId = node.ParentNodeId,
            NodeType = node.NodeType,
            NodeTypeName = node.NodeType.ToString(),
            Title = node.Title,
            Url = node.Url,
            IsActive = node.IsActive
        });
    }

    /// <summary>
    /// Updates a procedure node.
    /// </summary>
    [HttpPut("nodes/{id}")]
    public async Task<ActionResult<ProcedureNodeDto>> UpdateNode(Guid id, [FromBody] UpdateProcedureNodeDto dto)
    {
        var node = await _context.ProcedureNodes.FindAsync(id);

        if (node == null)
        {
            return NotFound();
        }

        if (dto.Title != null) node.Title = dto.Title;
        if (dto.Url != null) node.Url = dto.Url;
        if (dto.NodeType.HasValue) node.NodeType = dto.NodeType.Value;
        if (dto.ParentNodeId.HasValue)
        {
            // Prevent circular references
            if (dto.ParentNodeId.Value == id)
            {
                return BadRequest(new { message = "A node cannot be its own parent." });
            }
            node.ParentNodeId = dto.ParentNodeId;
        }

        node.ModifiedAtUtc = DateTime.UtcNow;
        node.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return Ok(new ProcedureNodeDto
        {
            Id = node.Id,
            ManualId = node.ManualId,
            ParentNodeId = node.ParentNodeId,
            NodeType = node.NodeType,
            NodeTypeName = node.NodeType.ToString(),
            Title = node.Title,
            Url = node.Url,
            IsActive = node.IsActive
        });
    }

    /// <summary>
    /// Deactivates a procedure node.
    /// </summary>
    [HttpDelete("nodes/{id}")]
    public async Task<IActionResult> DeactivateNode(Guid id)
    {
        var node = await _context.ProcedureNodes.FindAsync(id);

        if (node == null)
        {
            return NotFound();
        }

        node.IsActive = false;
        node.ModifiedAtUtc = DateTime.UtcNow;
        node.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Private Helpers

    /// <summary>
    /// Recursively builds a tree structure from flat node list.
    /// </summary>
    private ProcedureNodeTreeDto BuildNodeTree(ProcedureNode node, List<ProcedureNode> allNodes)
    {
        var children = allNodes
            .Where(x => x.ParentNodeId == node.Id)
            .Select(x => BuildNodeTree(x, allNodes))
            .ToList();

        return new ProcedureNodeTreeDto
        {
            Id = node.Id,
            ManualId = node.ManualId,
            ParentNodeId = node.ParentNodeId,
            NodeType = node.NodeType,
            NodeTypeName = node.NodeType.ToString(),
            Title = node.Title,
            Url = node.Url,
            IsActive = node.IsActive,
            Children = children
        };
    }

    #endregion
}

// DTOs for Manuals
public record ManualDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Code { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}

public record ManualDetailDto
{
    public Guid Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Code { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public List<ProcedureNodeTreeDto> Nodes { get; init; } = new();
}

public record CreateManualDto
{
    public string Title { get; init; } = string.Empty;
    public string? Code { get; init; }
}

public record UpdateManualDto
{
    public string? Title { get; init; }
    public string? Code { get; init; }
}

public record ProcedureNodeDto
{
    public Guid Id { get; init; }
    public Guid ManualId { get; init; }
    public Guid? ParentNodeId { get; init; }
    public ProcedureNodeType NodeType { get; init; }
    public string NodeTypeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Url { get; init; }
    public bool IsActive { get; init; }
}

public record ProcedureNodeTreeDto
{
    public Guid Id { get; init; }
    public Guid ManualId { get; init; }
    public Guid? ParentNodeId { get; init; }
    public ProcedureNodeType NodeType { get; init; }
    public string NodeTypeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Url { get; init; }
    public bool IsActive { get; init; }
    public List<ProcedureNodeTreeDto> Children { get; init; } = new();
}

public record CreateProcedureNodeDto
{
    public Guid? ParentNodeId { get; init; }
    public ProcedureNodeType NodeType { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Url { get; init; }
}

public record UpdateProcedureNodeDto
{
    public Guid? ParentNodeId { get; init; }
    public ProcedureNodeType? NodeType { get; init; }
    public string? Title { get; init; }
    public string? Url { get; init; }
}
