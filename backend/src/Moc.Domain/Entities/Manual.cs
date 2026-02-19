using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Represents a top-level manual in the Manuals and Procedures module.
/// We keep hierarchy details in ProcedureNode so manuals can contain procedures/work instructions/forms.
/// </summary>
public class Manual : AuditableEntity
{
    /// <summary>
    /// Manual title displayed in list and detail pages.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional short code/number for the manual (enterprise-friendly identifiers).
    /// </summary>
    public string? Code { get; set; }

    /// <summary>
    /// Soft delete flag for admin control while keeping historical references.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation: hierarchical content belonging to the manual.
    /// </summary>
    public ICollection<ProcedureNode> Nodes { get; set; } = new List<ProcedureNode>();
}

