using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Audit log entry for a MOC request: who did what, when, and optional before/after JSON snapshots.
/// Additive entity for compliance and traceability; no workflow logic in this layer.
/// </summary>
public class ActivityLog : AuditableEntity
{
    /// <summary>
    /// FK to the MOC request this log entry belongs to.
    /// </summary>
    public Guid MocRequestId { get; set; }

    /// <summary>
    /// Action identifier (e.g. "Submitted", "StageAdvanced", "Approved").
    /// </summary>
    public string Action { get; set; } = string.Empty;

    /// <summary>
    /// User who performed the action (when user id is available).
    /// </summary>
    public Guid? ActorUserId { get; set; }

    /// <summary>
    /// Actor identity when user id is not available (e.g. email or display name).
    /// </summary>
    public string? ActorEmail { get; set; }

    /// <summary>
    /// UTC timestamp when the action occurred (logical action time).
    /// </summary>
    public DateTime TimestampUtc { get; set; }

    /// <summary>
    /// Client IP address when the action was performed (optional).
    /// </summary>
    public string? IPAddress { get; set; }

    /// <summary>
    /// Client device or user-agent info (optional).
    /// </summary>
    public string? DeviceInfo { get; set; }

    /// <summary>
    /// JSON snapshot of relevant entity state before the action (optional).
    /// </summary>
    public string? BeforeSnapshot { get; set; }

    /// <summary>
    /// JSON snapshot of relevant entity state after the action (optional).
    /// </summary>
    public string? AfterSnapshot { get; set; }

    /// <summary>
    /// Navigation to the MOC request.
    /// </summary>
    public MocRequest MocRequest { get; set; } = null!;
}
