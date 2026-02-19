using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;
using Moc.Domain.Enums;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for workflow task management.
/// Supports task queues, completion, and assignment operations.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly MocDbContext _context;

    public TasksController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all tasks with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItemDto>>> GetAll(
        [FromQuery] MocTaskStatus? status = null,
        [FromQuery] TaskType? taskType = null,
        [FromQuery] string? assignedRoleKey = null,
        [FromQuery] Guid? assignedUserId = null,
        [FromQuery] Guid? mocRequestId = null)
    {
        var query = _context.TaskItems
            .Include(x => x.MocRequest)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);

        if (taskType.HasValue)
            query = query.Where(x => x.TaskType == taskType.Value);

        if (!string.IsNullOrWhiteSpace(assignedRoleKey))
            query = query.Where(x => x.AssignedRoleKey == assignedRoleKey);

        if (assignedUserId.HasValue)
            query = query.Where(x => x.AssignedUserId == assignedUserId.Value);

        if (mocRequestId.HasValue)
            query = query.Where(x => x.MocRequestId == mocRequestId.Value);

        var tasks = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new TaskItemDto
            {
                Id = x.Id,
                MocRequestId = x.MocRequestId,
                MocControlNumber = x.MocRequest.ControlNumber,
                MocTitle = x.MocRequest.Title,
                MocRiskLevel = x.MocRequest.RiskLevel,
                AssignedRoleKey = x.AssignedRoleKey,
                AssignedUserId = x.AssignedUserId,
                TaskType = x.TaskType,
                TaskTypeName = x.TaskType.ToString(),
                Title = x.Title,
                Description = x.Description,
                DueDateUtc = x.DueDateUtc,
                Status = x.Status,
                StatusName = x.Status.ToString(),
                CompletionRemarks = x.CompletionRemarks,
                CompletedAtUtc = x.CompletedAtUtc,
                CompletedBy = x.CompletedBy,
                CreatedAtUtc = x.CreatedAtUtc,
                IsOverdue = x.DueDateUtc.HasValue && x.DueDateUtc.Value < DateTime.UtcNow && x.Status == MocTaskStatus.Open
            })
            .ToListAsync();

        return Ok(tasks);
    }

    /// <summary>
    /// Gets open tasks (task queue).
    /// </summary>
    [HttpGet("open")]
    public async Task<ActionResult<IEnumerable<TaskItemDto>>> GetOpenTasks(
        [FromQuery] string? assignedRoleKey = null,
        [FromQuery] Guid? assignedUserId = null)
    {
        return await GetAll(MocTaskStatus.Open, null, assignedRoleKey, assignedUserId, null);
    }

    /// <summary>
    /// Gets completed tasks.
    /// </summary>
    [HttpGet("completed")]
    public async Task<ActionResult<IEnumerable<TaskItemDto>>> GetCompletedTasks(
        [FromQuery] string? assignedRoleKey = null,
        [FromQuery] Guid? assignedUserId = null)
    {
        return await GetAll(MocTaskStatus.Completed, null, assignedRoleKey, assignedUserId, null);
    }

    /// <summary>
    /// Gets tasks by type (Evaluation, Approval, etc.).
    /// </summary>
    [HttpGet("by-type/{taskType}")]
    public async Task<ActionResult<IEnumerable<TaskItemDto>>> GetByType(TaskType taskType)
    {
        return await GetAll(null, taskType, null, null, null);
    }

    /// <summary>
    /// Gets a single task by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<TaskItemDto>> GetById(Guid id)
    {
        var task = await _context.TaskItems
            .Include(x => x.MocRequest)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (task == null)
        {
            return NotFound();
        }

        return Ok(new TaskItemDto
        {
            Id = task.Id,
            MocRequestId = task.MocRequestId,
            MocControlNumber = task.MocRequest.ControlNumber,
            MocTitle = task.MocRequest.Title,
            MocRiskLevel = task.MocRequest.RiskLevel,
            AssignedRoleKey = task.AssignedRoleKey,
            AssignedUserId = task.AssignedUserId,
            TaskType = task.TaskType,
            TaskTypeName = task.TaskType.ToString(),
            Title = task.Title,
            Description = task.Description,
            DueDateUtc = task.DueDateUtc,
            Status = task.Status,
            StatusName = task.Status.ToString(),
            CompletionRemarks = task.CompletionRemarks,
            CompletedAtUtc = task.CompletedAtUtc,
            CompletedBy = task.CompletedBy,
            CreatedAtUtc = task.CreatedAtUtc,
            IsOverdue = task.DueDateUtc.HasValue && task.DueDateUtc.Value < DateTime.UtcNow && task.Status == MocTaskStatus.Open
        });
    }

    /// <summary>
    /// Creates a new task.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TaskItemDto>> Create([FromBody] CreateTaskDto dto)
    {
        var mocRequest = await _context.MocRequests.FindAsync(dto.MocRequestId);
        if (mocRequest == null)
        {
            return BadRequest(new { message = "Invalid MOC request ID." });
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            MocRequestId = dto.MocRequestId,
            AssignedRoleKey = dto.AssignedRoleKey,
            AssignedUserId = dto.AssignedUserId,
            TaskType = dto.TaskType,
            Title = dto.Title,
            Description = dto.Description,
            DueDateUtc = dto.DueDateUtc,
            Status = MocTaskStatus.Open,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.TaskItems.Add(task);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = task.Id }, await GetById(task.Id));
    }

    /// <summary>
    /// Completes a task.
    /// </summary>
    [HttpPost("{id}/complete")]
    public async Task<ActionResult<TaskItemDto>> Complete(Guid id, [FromBody] CompleteTaskDto dto)
    {
        var task = await _context.TaskItems.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        if (task.Status != MocTaskStatus.Open)
        {
            return BadRequest(new { message = "Task is not open." });
        }

        task.Status = MocTaskStatus.Completed;
        task.CompletionRemarks = dto.Remarks;
        task.CompletedAtUtc = DateTime.UtcNow;
        task.CompletedBy = "system"; // TODO: Get from current user
        task.ModifiedAtUtc = DateTime.UtcNow;
        task.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Cancels a task.
    /// </summary>
    [HttpPost("{id}/cancel")]
    public async Task<ActionResult<TaskItemDto>> Cancel(Guid id)
    {
        var task = await _context.TaskItems.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        if (task.Status != MocTaskStatus.Open)
        {
            return BadRequest(new { message = "Task is not open." });
        }

        task.Status = MocTaskStatus.Cancelled;
        task.ModifiedAtUtc = DateTime.UtcNow;
        task.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Reassigns a task to a different user.
    /// </summary>
    [HttpPost("{id}/reassign")]
    public async Task<ActionResult<TaskItemDto>> Reassign(Guid id, [FromBody] ReassignTaskDto dto)
    {
        var task = await _context.TaskItems.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        if (task.Status != MocTaskStatus.Open)
        {
            return BadRequest(new { message = "Cannot reassign a completed or cancelled task." });
        }

        if (dto.AssignedUserId.HasValue)
        {
            var userExists = await _context.AppUsers.AnyAsync(x => x.Id == dto.AssignedUserId.Value);
            if (!userExists)
            {
                return BadRequest(new { message = "Invalid user ID." });
            }
            task.AssignedUserId = dto.AssignedUserId;
        }

        if (!string.IsNullOrWhiteSpace(dto.AssignedRoleKey))
        {
            task.AssignedRoleKey = dto.AssignedRoleKey;
        }

        task.ModifiedAtUtc = DateTime.UtcNow;
        task.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }
}

// DTOs for Tasks
public record TaskItemDto
{
    public Guid Id { get; init; }
    public Guid MocRequestId { get; init; }
    public string MocControlNumber { get; init; } = string.Empty;
    public string MocTitle { get; init; } = string.Empty;
    public RiskLevel? MocRiskLevel { get; init; }
    public string AssignedRoleKey { get; init; } = string.Empty;
    public Guid? AssignedUserId { get; init; }
    public TaskType TaskType { get; init; }
    public string TaskTypeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime? DueDateUtc { get; init; }
    public MocTaskStatus Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public string? CompletionRemarks { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
    public string? CompletedBy { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public bool IsOverdue { get; init; }
}

public record CreateTaskDto
{
    public Guid MocRequestId { get; init; }
    public string AssignedRoleKey { get; init; } = string.Empty;
    public Guid? AssignedUserId { get; init; }
    public TaskType TaskType { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public DateTime? DueDateUtc { get; init; }
}

public record CompleteTaskDto
{
    public string? Remarks { get; init; }
}

public record ReassignTaskDto
{
    public string? AssignedRoleKey { get; init; }
    public Guid? AssignedUserId { get; init; }
}
