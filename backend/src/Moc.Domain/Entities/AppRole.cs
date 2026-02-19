using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Application role used for workflow routing and authorization checks.
/// We model roles explicitly so we can later swap from stub auth to real Identity/JWT without schema churn.
/// </summary>
public class AppRole : AuditableEntity
{
    /// <summary>
    /// Stable role key used in code (e.g. "Originator", "DepartmentManager").
    /// </summary>
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly display name (e.g. "Department Manager").
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag for admin maintenance (rare for roles, but kept consistent).
    /// </summary>
    public bool IsActive { get; set; } = true;
}

