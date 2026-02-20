using Microsoft.EntityFrameworkCore;
using Moc.Application.Dmoc;
using Moc.Domain.Entities;
using Moc.Domain.Enums;
using Moc.Infrastructure.Persistence;

namespace Moc.Infrastructure.Dmoc;

/// <summary>
/// DMOC application service. All validation server-side with explicit error messages.
/// </summary>
public class DmocService : IDmocService
{
    private const int MaxTemporaryDays = 90;
    private readonly MocDbContext _context;

    public DmocService(MocDbContext context)
    {
        _context = context;
    }

    /// <inheritdoc />
    public async Task<DmocDto> CreateDraftAsync(CreateDmocDraftCommand command, CancellationToken cancellationToken = default)
    {
        ValidateDraftPayload(command.Title, command.ChangeOriginatorName, command.NatureOfChange, command.TargetImplementationDate, command.PlannedEndDate, command.DescriptionOfChange, command.ReasonForChange);

        var entity = new DmocRequest
        {
            Id = Guid.NewGuid(),
            Title = command.Title,
            ChangeOriginatorUserId = command.ChangeOriginatorUserId,
            ChangeOriginatorName = command.ChangeOriginatorName,
            OriginatorPosition = command.OriginatorPosition,
            AreaOrDepartmentId = command.AreaOrDepartmentId,
            AreaOrDepartmentName = command.AreaOrDepartmentName,
            NatureOfChange = command.NatureOfChange,
            TargetImplementationDate = command.TargetImplementationDate,
            PlannedEndDate = command.PlannedEndDate,
            DescriptionOfChange = command.DescriptionOfChange,
            ReasonForChange = command.ReasonForChange,
            AffectedEquipment = command.AffectedEquipment,
            AttachmentsOrReferenceLinks = command.AttachmentsOrReferenceLinks,
            AdditionalRemarks = command.AdditionalRemarks,
            Status = DmocStatus.Draft,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = command.CreatedBy,
        };

        if (command.AreaOrDepartmentId.HasValue)
        {
            var dept = await _context.Departments.FindAsync(new object[] { command.AreaOrDepartmentId.Value }, cancellationToken);
            if (dept != null)
                entity.AreaOrDepartmentName = dept.Name;
        }

        _context.DmocRequests.Add(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<DmocDto> UpdateDraftAsync(Guid id, UpdateDmocDraftCommand command, CancellationToken cancellationToken = default)
    {
        ValidateDraftPayload(command.Title, command.ChangeOriginatorName, command.NatureOfChange, command.TargetImplementationDate, command.PlannedEndDate, command.DescriptionOfChange, command.ReasonForChange);

        var entity = await _context.DmocRequests.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new InvalidOperationException("DMOC not found.");

        if (entity.Status != DmocStatus.Draft)
            throw new InvalidOperationException("Only draft DMOCs can be updated.");

        entity.Title = command.Title;
        entity.ChangeOriginatorUserId = command.ChangeOriginatorUserId;
        entity.ChangeOriginatorName = command.ChangeOriginatorName;
        entity.OriginatorPosition = command.OriginatorPosition;
        entity.AreaOrDepartmentId = command.AreaOrDepartmentId;
        entity.NatureOfChange = command.NatureOfChange;
        entity.TargetImplementationDate = command.TargetImplementationDate;
        entity.PlannedEndDate = command.PlannedEndDate;
        entity.DescriptionOfChange = command.DescriptionOfChange;
        entity.ReasonForChange = command.ReasonForChange;
        entity.AffectedEquipment = command.AffectedEquipment;
        entity.AttachmentsOrReferenceLinks = command.AttachmentsOrReferenceLinks;
        entity.AdditionalRemarks = command.AdditionalRemarks;
        entity.ModifiedAtUtc = DateTime.UtcNow;
        entity.ModifiedBy = command.ModifiedBy;

        if (command.AreaOrDepartmentId.HasValue)
        {
            var dept = await _context.Departments.FindAsync(new object[] { command.AreaOrDepartmentId.Value }, cancellationToken);
            entity.AreaOrDepartmentName = dept?.Name;
        }
        else
            entity.AreaOrDepartmentName = null;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<DmocDto> SubmitAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.DmocRequests.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new InvalidOperationException("DMOC not found.");

        if (entity.Status != DmocStatus.Draft)
            throw new InvalidOperationException("Only draft DMOCs can be submitted.");

        ValidateDraftPayload(entity.Title, entity.ChangeOriginatorName ?? "", entity.NatureOfChange, entity.TargetImplementationDate, entity.PlannedEndDate, entity.DescriptionOfChange, entity.ReasonForChange);

        entity.DmocNumber = await GenerateDmocNumberAsync(cancellationToken);
        entity.Status = DmocStatus.Submitted;
        entity.ModifiedAtUtc = DateTime.UtcNow;
        entity.ModifiedBy = "system";

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<DmocDto> ApproveAsync(Guid id, string? remarks, CancellationToken cancellationToken = default)
    {
        var entity = await _context.DmocRequests.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new InvalidOperationException("DMOC not found.");

        if (entity.Status != DmocStatus.Submitted)
            throw new InvalidOperationException("Only submitted DMOCs can be approved.");

        entity.Status = DmocStatus.Approved;
        entity.ModifiedAtUtc = DateTime.UtcNow;
        entity.ModifiedBy = "system";
        if (!string.IsNullOrWhiteSpace(remarks))
            entity.AdditionalRemarks = (entity.AdditionalRemarks ?? "") + "\n[Approval] " + remarks;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<DmocDto> RejectAsync(Guid id, string? remarks, CancellationToken cancellationToken = default)
    {
        var entity = await _context.DmocRequests.FindAsync(new object[] { id }, cancellationToken)
            ?? throw new InvalidOperationException("DMOC not found.");

        if (entity.Status != DmocStatus.Submitted)
            throw new InvalidOperationException("Only submitted DMOCs can be rejected.");

        entity.Status = DmocStatus.Rejected;
        entity.ModifiedAtUtc = DateTime.UtcNow;
        entity.ModifiedBy = "system";
        if (!string.IsNullOrWhiteSpace(remarks))
            entity.AdditionalRemarks = (entity.AdditionalRemarks ?? "") + "\n[Rejection] " + remarks;

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<DmocDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _context.DmocRequests.FindAsync(new object[] { id }, cancellationToken);
        return entity == null ? null : MapToDto(entity);
    }

    /// <inheritdoc />
    public async Task<PagedDmocResult> ListAsync(ListDmocsQuery query, CancellationToken cancellationToken = default)
    {
        var q = _context.DmocRequests.AsNoTracking();

        if (query.Status.HasValue)
            q = q.Where(x => x.Status == query.Status.Value);
        if (query.ChangeOriginatorUserId.HasValue)
            q = q.Where(x => x.ChangeOriginatorUserId == query.ChangeOriginatorUserId.Value);

        var total = await q.CountAsync(cancellationToken);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var page = Math.Max(1, query.Page);
        var items = await q
            .OrderByDescending(x => x.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedDmocResult(items.Select(MapToDto).ToList(), total, page, pageSize);
    }

    private static void ValidateDraftPayload(
        string title,
        string changeOriginatorName,
        DmocNatureOfChange natureOfChange,
        DateTime? targetImplementationDate,
        DateTime? plannedEndDate,
        string descriptionOfChange,
        string reasonForChange)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("Title is required.");
        if (string.IsNullOrWhiteSpace(changeOriginatorName))
            throw new InvalidOperationException("Change originator name is required.");
        if (string.IsNullOrWhiteSpace(descriptionOfChange))
            throw new InvalidOperationException("Description of change is required.");
        if (string.IsNullOrWhiteSpace(reasonForChange))
            throw new InvalidOperationException("Reason for change is required.");

        if (natureOfChange == DmocNatureOfChange.Temporary)
        {
            if (!targetImplementationDate.HasValue)
                throw new InvalidOperationException("Target implementation date is required for temporary changes.");
            if (!plannedEndDate.HasValue)
                throw new InvalidOperationException("Planned end date is required for temporary changes.");
            if (plannedEndDate.Value < targetImplementationDate.Value)
                throw new InvalidOperationException("Planned end date must be on or after target implementation date.");
            var days = (plannedEndDate.Value - targetImplementationDate.Value).TotalDays;
            if (days > MaxTemporaryDays)
                throw new InvalidOperationException($"Temporary change must be within {MaxTemporaryDays} days of implementation.");
        }
    }

    private async Task<string> GenerateDmocNumberAsync(CancellationToken cancellationToken)
    {
        var year = DateTime.UtcNow.Year;
        var prefix = $"DMOC-{year}-";
        var count = await _context.DmocRequests
            .Where(x => x.DmocNumber != null && x.DmocNumber.StartsWith(prefix))
            .CountAsync(cancellationToken);
        return $"{prefix}{(count + 1):D4}";
    }

    private static DmocDto MapToDto(DmocRequest e) => new(
        e.Id,
        e.DmocNumber,
        e.Title,
        e.ChangeOriginatorUserId,
        e.ChangeOriginatorName,
        e.OriginatorPosition,
        e.AreaOrDepartmentId,
        e.AreaOrDepartmentName,
        e.NatureOfChange,
        e.TargetImplementationDate,
        e.PlannedEndDate,
        e.DescriptionOfChange,
        e.ReasonForChange,
        e.AffectedEquipment,
        e.AttachmentsOrReferenceLinks,
        e.AdditionalRemarks,
        e.Status,
        e.CreatedAtUtc,
        e.CreatedBy,
        e.ModifiedAtUtc,
        e.ModifiedBy);
}
