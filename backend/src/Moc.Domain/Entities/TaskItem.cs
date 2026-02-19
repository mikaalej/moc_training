using System;
using Moc.Domain.Common;
using Moc.Domain.Enums;

namespace Moc.Domain.Entities;

/// <summary>
/// Represents a workflow task that appears in "My Tasks".
/// Tasks are assigned to a role (and optionally a specific demo user) to keep routing flexible.
/// </summary>
public class TaskItem : AuditableEntity
{
    /// <summary>
    /// FK to the related request so the UI can navigate from task to request detail.
    /// </summary>
    public Guid MocRequestId { get; set; }

    /// <summary>
    /// Role key responsible for performing this task (e.g., "Supervisor", "DepartmentManager").
    /// This supports "approver chain by role" and makes it easy to swap to real auth later.
    /// </summary>
    public string AssignedRoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Optional specific assignee for demo purposes. In real auth, assignment can be derived from role membership.
    /// </summary>
    public Guid? AssignedUserId { get; set; }

    /// <summary>
    /// Task type used for grouping in UI and reporting (Evaluation/Documentation/etc.).
    /// </summary>
    public TaskType TaskType { get; set; } = TaskType.General;

    /// <summary>
    /// Short title shown in task lists.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional long description providing context to the task owner.
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Due date used for overdue indicators.
    /// </summary>
    public DateTime? DueDateUtc { get; set; }

    /// <summary>
    /// Status of the task itself.
    /// </summary>
    public MocTaskStatus Status { get; set; } = MocTaskStatus.Open;

    /// <summary>
    /// Remarks captured when completing the task.
    /// </summary>
    public string? CompletionRemarks { get; set; }

    /// <summary>
    /// Timestamp when the task was completed.
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Identifier of the user who completed the task.
    /// </summary>
    public string? CompletedBy { get; set; }

    /// <summary>
    /// Navigation to request.
    /// </summary>
    public MocRequest MocRequest { get; set; } = null!;

    /// <summary>
    /// Navigation to demo user (optional).
    /// </summary>
    public AppUser? AssignedUser { get; set; }
}

