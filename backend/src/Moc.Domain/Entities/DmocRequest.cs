using System;
using Moc.Domain.Common;
using Moc.Domain.Enums;

namespace Moc.Domain.Entities;

/// <summary>
/// Departmental Management of Change (DMOC) request.
/// Isolated from MocRequest; simplified workflow for department-level changes.
/// </summary>
public class DmocRequest : AuditableEntity
{
    /// <summary>
    /// Generated on submit only (format DMOC-YYYY-NNNN). Null for drafts.
    /// </summary>
    public string? DmocNumber { get; set; }

    /// <summary>
    /// Short title (required).
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// User account of the change originator (optional until auth is wired).
    /// </summary>
    public Guid? ChangeOriginatorUserId { get; set; }

    /// <summary>
    /// Display name of the originator (required for now).
    /// </summary>
    public string ChangeOriginatorName { get; set; } = string.Empty;

    /// <summary>
    /// Originator position (auto-derived later; stored for display).
    /// </summary>
    public string? OriginatorPosition { get; set; }

    /// <summary>
    /// Area/department (editable by admin); optional FK to Department.
    /// </summary>
    public Guid? AreaOrDepartmentId { get; set; }

    /// <summary>
    /// Area/department name for display.
    /// </summary>
    public string? AreaOrDepartmentName { get; set; }

    /// <summary>
    /// Permanent or temporary change.
    /// </summary>
    public DmocNatureOfChange NatureOfChange { get; set; }

    /// <summary>
    /// Required when NatureOfChange is Temporary.
    /// </summary>
    public DateTime? TargetImplementationDate { get; set; }

    /// <summary>
    /// When temporary; must be within 90 days of TargetImplementationDate.
    /// </summary>
    public DateTime? PlannedEndDate { get; set; }

    /// <summary>
    /// Description of change (required).
    /// </summary>
    public string DescriptionOfChange { get; set; } = string.Empty;

    /// <summary>
    /// Reason for change (required).
    /// </summary>
    public string ReasonForChange { get; set; } = string.Empty;

    /// <summary>
    /// Affected equipment (free text, optional).
    /// </summary>
    public string? AffectedEquipment { get; set; }

    /// <summary>
    /// Attachments or reference links (optional).
    /// </summary>
    public string? AttachmentsOrReferenceLinks { get; set; }

    /// <summary>
    /// Additional remarks (optional).
    /// </summary>
    public string? AdditionalRemarks { get; set; }

    /// <summary>
    /// Current workflow status.
    /// </summary>
    public DmocStatus Status { get; set; } = DmocStatus.Draft;
}
