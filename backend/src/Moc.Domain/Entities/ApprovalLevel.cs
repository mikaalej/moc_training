using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Defines one level in the configurable approval chain.
/// Admin can maintain any number of levels (e.g. 5) and assign a role per level.
/// When a MOC is submitted, MocApprover rows are created from these levels in order.
/// </summary>
public class ApprovalLevel : AuditableEntity
{
    /// <summary>
    /// Display order (1-based). Levels are applied in this order when building the approver chain.
    /// </summary>
    public int Order { get; set; }

    /// <summary>
    /// Role key that must approve at this level (e.g. "Supervisor", "DepartmentManager").
    /// Must match an existing AppRole.Key.
    /// </summary>
    public string RoleKey { get; set; } = string.Empty;

    /// <summary>
    /// Whether this level is active. Inactive levels are skipped when building the approver chain.
    /// </summary>
    public bool IsActive { get; set; } = true;
}
