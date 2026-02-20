using Microsoft.AspNetCore.Mvc;
using Moc.Application.Dmoc;
using Moc.Domain.Enums;

namespace Moc.Api.Controllers;

/// <summary>
/// API for DMOC (Departmental Management of Change). All endpoints require EnableDmoc = true; otherwise 404.
/// </summary>
[ApiController]
[Route("api/dmoc")]
public class DmocController : ControllerBase
{
    private const string EnableDmocKey = "EnableDmoc";
    private readonly IDmocService _dmocService;
    private readonly IConfiguration _configuration;

    public DmocController(IDmocService dmocService, IConfiguration configuration)
    {
        _dmocService = dmocService;
        _configuration = configuration;
    }

    /// <summary>
    /// Returns whether DMOC feature is enabled. Does not require EnableDmoc to be true.
    /// </summary>
    [HttpGet("features")]
    [ProducesResponseType(typeof(FeaturesResponse), StatusCodes.Status200OK)]
    public IActionResult GetFeatures()
    {
        var enableDmoc = _configuration.GetValue<bool>(EnableDmocKey);
        return Ok(new FeaturesResponse(enableDmoc));
    }

    /// <summary>
    /// Creates a new DMOC draft.
    /// </summary>
    [HttpPost("drafts")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CreateDraft([FromBody] CreateDmocDraftCommand command, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        try
        {
            var dto = await _dmocService.CreateDraftAsync(command, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = dto.Id }, dto);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Gets a single DMOC by id.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        var dto = await _dmocService.GetByIdAsync(id, cancellationToken);
        if (dto == null)
            return NotFound();
        return Ok(dto);
    }

    /// <summary>
    /// Updates an existing draft. Only allowed when status is Draft.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateDraft(Guid id, [FromBody] UpdateDmocDraftCommand command, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        try
        {
            var dto = await _dmocService.UpdateDraftAsync(id, command, cancellationToken);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound();
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Submits a draft: assigns DMOC number and sets status to Submitted.
    /// </summary>
    [HttpPost("{id:guid}/submit")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Submit(Guid id, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        try
        {
            var dto = await _dmocService.SubmitAsync(id, cancellationToken);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound();
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Approves a submitted DMOC. Optional remarks appended to AdditionalRemarks.
    /// </summary>
    [HttpPost("{id:guid}/approve")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Approve(Guid id, [FromBody] ApproveRejectRequest? body, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        try
        {
            var dto = await _dmocService.ApproveAsync(id, body?.Remarks, cancellationToken);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound();
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Rejects a submitted DMOC. Optional remarks appended to AdditionalRemarks.
    /// </summary>
    [HttpPost("{id:guid}/reject")]
    [ProducesResponseType(typeof(DmocDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Reject(Guid id, [FromBody] ApproveRejectRequest? body, CancellationToken cancellationToken)
    {
        if (!IsDmocEnabled())
            return NotFound();

        try
        {
            var dto = await _dmocService.RejectAsync(id, body?.Remarks, cancellationToken);
            return Ok(dto);
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
                return NotFound();
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Lists DMOCs with optional filter by status and change originator, and paging.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedDmocResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> List(
        [FromQuery] DmocStatus? status,
        [FromQuery] Guid? changeOriginatorUserId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (!IsDmocEnabled())
            return NotFound();

        var query = new ListDmocsQuery(Status: status, ChangeOriginatorUserId: changeOriginatorUserId, Page: page, PageSize: pageSize);
        var result = await _dmocService.ListAsync(query, cancellationToken);
        return Ok(result);
    }

    private bool IsDmocEnabled() => _configuration.GetValue<bool>(EnableDmocKey);
}

/// <summary>
/// Response for GET /api/dmoc/features.
/// </summary>
public record FeaturesResponse(bool EnableDmoc);

/// <summary>
/// Optional body for approve/reject endpoints.
/// </summary>
public record ApproveRejectRequest(string? Remarks);
