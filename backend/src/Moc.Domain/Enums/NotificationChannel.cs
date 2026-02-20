namespace Moc.Domain.Enums;

/// <summary>
/// Delivery channel for a notification (in-app only or email).
/// </summary>
public enum NotificationChannel
{
    /// <summary>
    /// Shown in the application (bell icon, notifications list).
    /// </summary>
    InApp = 1,

    /// <summary>
    /// Delivered via email (future use).
    /// </summary>
    Email = 2
}
