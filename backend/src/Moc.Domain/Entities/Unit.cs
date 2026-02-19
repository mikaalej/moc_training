using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Lookup entity: plant/process unit affected by changes.
/// Kept as a lookup so filters are consistent across modules.
/// </summary>
public class Unit : AuditableEntity
{
    /// <summary>
    /// Short code for the unit (e.g. "U-100").
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Human-friendly unit name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Soft delete flag so old requests remain referentially intact.
    /// </summary>
    public bool IsActive { get; set; } = true;
}

