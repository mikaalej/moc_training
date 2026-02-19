namespace Moc.Domain.Enums;

/// <summary>
/// Tracks whether a notification is still unread or has been acknowledged by the UI.
/// This is intentionally simple so we can later plug in email/Teams delivery without changing the DB shape.
/// </summary>
public enum NotificationStatus
{
    Unread = 1,
    Read = 2,
    Dismissed = 3
}

