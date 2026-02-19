using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lightweight user record for demo seeding and workflow routing.
/// This is NOT a full identity implementation; it exists to support deterministic demo data and task assignment.
/// </summary>
public class AppUser : AuditableEntity
{
    /// <summary>
    /// Stable username/login used by the stub current-user provider.
    /// </summary>
    public string UserName { get; set; } = string.Empty;

    /// <summary>
    /// Display name shown in UI lists/details.
    /// </summary>
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>
    /// Role key used for authorization checks in the app (stored here for the stub auth path).
    /// In a real auth integration, this would come from claims or an identity store.
    /// </summary>
    public string RoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Whether this user is active (soft delete).
    /// </summary>
    public bool IsActive { get; set; } = true;
}

