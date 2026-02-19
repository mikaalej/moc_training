using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: top-level organization division.
/// Must support soft delete because old requests reference historical values.
/// </summary>
public class Division : AuditableEntity
{
    /// <summary>
    /// Short code displayed in dropdowns and filters (e.g. "DIV-ENG").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly name displayed across the app.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag for admin maintenance screens.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation: departments under this division.
    /// </summary>
    public ICollection<Department> Departments { get; set; } = new List<Department>();
}

