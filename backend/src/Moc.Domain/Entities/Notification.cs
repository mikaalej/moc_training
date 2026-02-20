using System;
using Moc.Domain.Common;
using Moc.Domain.Enums;

namespace Moc.Domain.Entities;

/// <summary>
/// Stored in-app notification to support the bell icon and notifications list.
/// For now notifications are stored/displayed only; later we can add external delivery (email/Teams).
/// </summary>
public class Notification : AuditableEntity
{
    /// <summary>
    /// Notification type key used by UI and reporting (e.g. "Inactivity30Days", "OverdueRestoration").
    /// </summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>
    /// Message displayed to the recipient.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Optional related request for context and navigation.
    /// </summary>
    public Guid? MocRequestId { get; set; }

    /// <summary>
    /// Role key recipient. Using roles makes it easy to route notifications even without full auth.
    /// </summary>
    public string RecipientRoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Optional specific recipient user for demo UX.
    /// </summary>
    public Guid? RecipientUserId { get; set; }

    /// <summary>
    /// Read/unread status used by bell counter and list UI.
    /// </summary>
    public NotificationStatus Status { get; set; } = NotificationStatus.Unread;

    /// <summary>
    /// Timestamp when notification was read.
    /// </summary>
    public DateTime? ReadAtUtc { get; set; }

    /// <summary>
    /// Delivery channel (InApp, Email). Additive; defaults to InApp when not set.
    /// </summary>
    public NotificationChannel? Channel { get; set; }

    /// <summary>
    /// Recipient identifier (e.g. email or user key) when not using role/user id.
    /// </summary>
    public string? Recipient { get; set; }

    /// <summary>
    /// Optional rich content or body (Message remains the primary display text).
    /// </summary>
    public string? Content { get; set; }

    /// <summary>
    /// When the recipient acknowledged the notification (optional).
    /// </summary>
    public DateTime? AcknowledgedAtUtc { get; set; }

    /// <summary>
    /// Optional follow-up date for reminders or escalation.
    /// </summary>
    public DateTime? FollowUpAtUtc { get; set; }

    /// <summary>
    /// Navigation to request (optional).
    /// </summary>
    public MocRequest? MocRequest { get; set; }

    /// <summary>
    /// Navigation to user (optional).
    /// </summary>
    public AppUser? RecipientUser { get; set; }
}

