using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: department within a division.
/// Used in request classification and for routing/notifications.
/// </summary>
public class Department : AuditableEntity
{
    /// <summary>
    /// FK to the owning division.
    /// </summary>
    public Guid DivisionId { get; set; }

    /// <summary>
    /// Short code displayed in dropdowns and filters (e.g. "DEP-MAINT").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly department name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag (inactive values remain referenced by historical requests).
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation to parent division.
    /// </summary>
    public Division Division { get; set; } = null!;

    /// <summary>
    /// Navigation: sections under this department.
    /// </summary>
    public ICollection<Section> Sections { get; set; } = new List<Section>();
}

