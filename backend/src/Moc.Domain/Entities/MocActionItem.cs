using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Action item raised during risk assessment, evaluation, approvals, or implementation planning.
/// Action items are stored under the request and may be surfaced as workflow tasks.
/// </summary>
public class MocActionItem : AuditableEntity
{
    /// <summary>
    /// FK to the owning request.
    /// </summary>
    public Guid MocRequestId { get; set; }

    /// <summary>
    /// Human-readable text describing what needs to be done.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Due date used to drive overdue indicators in the UI.
    /// </summary>
    public DateTime DueDate { get; set; }

    /// <summary>
    /// Whether the action item has been completed.
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Timestamp when the action item was completed.
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Navigation to parent request.
    /// </summary>
    public MocRequest MocRequest { get; set; } = null!;
}

