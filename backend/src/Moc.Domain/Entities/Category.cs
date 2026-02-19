using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: high-level change category.
/// </summary>
public class Category : AuditableEntity
{
    /// <summary>
    /// Short category code.
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Category name displayed in filters and reporting.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation: subcategories under this category.
    /// </summary>
    public ICollection<Subcategory> Subcategories { get; set; } = new List<Subcategory>();
}

