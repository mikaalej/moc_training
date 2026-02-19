using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: section within a department.
/// Used for classification, filters, and role routing (e.g., section-level concurrence).
/// </summary>
public class Section : AuditableEntity
{
    /// <summary>
    /// FK to the owning department.
    /// </summary>
    public Guid DepartmentId { get; set; }

    /// <summary>
    /// Short code displayed in dropdowns and filters (e.g. "SEC-MECH").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly section name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag for admin screens.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation to parent department.
    /// </summary>
    public Department Department { get; set; } = null!;
}

