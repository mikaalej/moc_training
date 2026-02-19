using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: subcategory within a category.
/// </summary>
public class Subcategory : AuditableEntity
{
    /// <summary>
    /// FK to the owning category.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Short code for subcategory.
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly subcategory name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation to parent category.
    /// </summary>
    public Category Category { get; set; } = null!;
}

