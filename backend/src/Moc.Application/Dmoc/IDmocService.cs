using Moc.Domain.Enums;

namespace Moc.Application.Dmoc;

/// <summary>
/// Application service for DMOC operations. Validation and authorization enforced server-side.
/// </summary>
public interface IDmocService
{
    /// <summary>
    /// Creates a new DMOC draft. DmocNumber remains null until submit.
    /// </summary>
    Task<DmocDto> CreateDraftAsync(CreateDmocDraftCommand command, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing draft. Fails if status is not Draft.
    /// </summary>
    Task<DmocDto> UpdateDraftAsync(Guid id, UpdateDmocDraftCommand command, CancellationToken cancellationToken = default);

    /// <summary>
    /// Submits a draft: generates DMOC number and sets Status = Submitted.
    /// </summary>
    Task<DmocDto> SubmitAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Department approver approves the DMOC (Status = Approved).
    /// </summary>
    Task<DmocDto> ApproveAsync(Guid id, string? remarks, CancellationToken cancellationToken = default);

    /// <summary>
    /// Department approver rejects the DMOC (Status = Rejected).
    /// </summary>
    Task<DmocDto> RejectAsync(Guid id, string? remarks, CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets a single DMOC by id.
    /// </summary>
    Task<DmocDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// Lists DMOCs with optional filter and paging.
    /// </summary>
    Task<PagedDmocResult> ListAsync(ListDmocsQuery query, CancellationToken cancellationToken = default);
}
