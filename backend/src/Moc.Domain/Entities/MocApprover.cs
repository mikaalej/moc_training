using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Defines an approver chain entry for a request.
/// This stores "by role" routing rather than binding to a specific person, per requirements.
/// </summary>
public class MocApprover : AuditableEntity
{
    /// <summary>
    /// FK to the owning request aggregate.
    /// </summary>
    public Guid MocRequestId { get; set; }

    /// <summary>
    /// Role key that must act on this approver slot (e.g., "DepartmentManager").
    /// </summary>
    public string RoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Indicates whether this approver slot has been acted upon.
    /// </summary>
    public bool IsCompleted { get; set; }

    /// <summary>
    /// Approval decision recorded by the role occupant.
    /// </summary>
    public bool? IsApproved { get; set; }

    /// <summary>
    /// Remarks captured during approve/disapprove/concern.
    /// </summary>
    public string? Remarks { get; set; }

    /// <summary>
    /// Timestamp when the slot was completed.
    /// </summary>
    public DateTime? CompletedAtUtc { get; set; }

    /// <summary>
    /// Identifier of who completed the slot (usually a user name for now).
    /// </summary>
    public string? CompletedBy { get; set; }

    /// <summary>
    /// Navigation to parent request.
    /// </summary>
    public MocRequest MocRequest { get; set; } = null!;
}

