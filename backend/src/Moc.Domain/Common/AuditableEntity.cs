using System;

namespace Moc.Domain.Common;

/// <summary>
/// Base class for entities that require audit fields (created/modified).
/// We keep this in Domain so it remains persistence-agnostic and reusable.
/// </summary>
public abstract class AuditableEntity
{
    /// <summary>
    /// Surrogate primary key used by the database. Kept in Domain for consistency.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// UTC timestamp when the row was created.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }

    /// <summary>
    /// Identifier of the user who created the row (from current user provider).
    /// </summary>
    public string CreatedBy { get; set; } = string.Empty;

    /// <summary>
    /// UTC timestamp when the row was last modified (null if never modified).
    /// </summary>
    public DateTime? ModifiedAtUtc { get; set; }

    /// <summary>
    /// Identifier of the user who last modified the row.
    /// </summary>
    public string? ModifiedBy { get; set; }
}

