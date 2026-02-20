using Moc.Domain.Enums;

namespace Moc.Application.Dmoc;

/// <summary>
/// Result of create/update/get DMOC operations.
/// </summary>
public record DmocDto(
    Guid Id,
    string? DmocNumber,
    string Title,
    Guid? ChangeOriginatorUserId,
    string ChangeOriginatorName,
    string? OriginatorPosition,
    Guid? AreaOrDepartmentId,
    string? AreaOrDepartmentName,
    DmocNatureOfChange NatureOfChange,
    DateTime? TargetImplementationDate,
    DateTime? PlannedEndDate,
    string DescriptionOfChange,
    string ReasonForChange,
    string? AffectedEquipment,
    string? AttachmentsOrReferenceLinks,
    string? AdditionalRemarks,
    DmocStatus Status,
    DateTime CreatedAtUtc,
    string CreatedBy,
    DateTime? ModifiedAtUtc,
    string? ModifiedBy);

/// <summary>
/// Command to create a DMOC draft.
/// </summary>
public record CreateDmocDraftCommand(
    string Title,
    Guid? ChangeOriginatorUserId,
    string ChangeOriginatorName,
    string? OriginatorPosition,
    Guid? AreaOrDepartmentId,
    string? AreaOrDepartmentName,
    DmocNatureOfChange NatureOfChange,
    DateTime? TargetImplementationDate,
    DateTime? PlannedEndDate,
    string DescriptionOfChange,
    string ReasonForChange,
    string? AffectedEquipment,
    string? AttachmentsOrReferenceLinks,
    string? AdditionalRemarks,
    string CreatedBy);

/// <summary>
/// Command to update a DMOC draft (only when Status = Draft).
/// </summary>
public record UpdateDmocDraftCommand(
    string Title,
    Guid? ChangeOriginatorUserId,
    string ChangeOriginatorName,
    string? OriginatorPosition,
    Guid? AreaOrDepartmentId,
    string? AreaOrDepartmentName,
    DmocNatureOfChange NatureOfChange,
    DateTime? TargetImplementationDate,
    DateTime? PlannedEndDate,
    string DescriptionOfChange,
    string ReasonForChange,
    string? AffectedEquipment,
    string? AttachmentsOrReferenceLinks,
    string? AdditionalRemarks,
    string ModifiedBy);

/// <summary>
/// Query filter for listing DMOCs.
/// </summary>
public record ListDmocsQuery(
    DmocStatus? Status = null,
    Guid? ChangeOriginatorUserId = null,
    int Page = 1,
    int PageSize = 20);

/// <summary>
/// Paged list result.
/// </summary>
public record PagedDmocResult(IReadOnlyList<DmocDto> Items, int TotalCount, int Page, int PageSize);
