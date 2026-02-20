using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;
using Moc.Domain.Enums;
using System.Text;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for MOC Request management.
/// Supports CRUD operations, list views with filtering/pagination, workflow actions, and export.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class MocRequestsController : ControllerBase
{
    private readonly MocDbContext _context;

    public MocRequestsController(MocDbContext context)
    {
        _context = context;
    }

    #region List Endpoints

    /// <summary>
    /// Gets a paginated list of MOC requests with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetAll([FromQuery] MocRequestFilterDto filter)
    {
        var query = _context.MocRequests.AsQueryable();

        // Apply filters
        query = ApplyFilters(query, filter);

        // Get total count before pagination
        var totalCount = await query.CountAsync();

        // Apply sorting
        query = ApplySorting(query, filter.SortBy, filter.SortDescending);

        // Apply pagination
        var pageSize = filter.PageSize ?? 20;
        var page = filter.Page ?? 1;
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => MapToListItem(x))
            .ToListAsync();

        return Ok(new PagedResult<MocRequestListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        });
    }

    /// <summary>
    /// Gets in-progress MOC requests (Status = Submitted or Active). Newly submitted requests appear here.
    /// </summary>
    [HttpGet("active")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetActive([FromQuery] MocRequestFilterDto filter)
    {
        filter.StatusIn = new List<MocStatus> { MocStatus.Submitted, MocStatus.Active };
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets inactive MOC requests (Status = Inactive).
    /// </summary>
    [HttpGet("inactive")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetInactive([FromQuery] MocRequestFilterDto filter)
    {
        filter.Status = MocStatus.Inactive;
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets approved MOC requests (Status = Approved).
    /// </summary>
    [HttpGet("approved")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetApproved([FromQuery] MocRequestFilterDto filter)
    {
        filter.Status = MocStatus.Approved;
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets closed MOC requests (Status = Closed).
    /// </summary>
    [HttpGet("closed")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetClosed([FromQuery] MocRequestFilterDto filter)
    {
        filter.Status = MocStatus.Closed;
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets MOC requests pending restoration (temporary MOCs past restoration date).
    /// </summary>
    [HttpGet("for-restoration")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetForRestoration([FromQuery] MocRequestFilterDto filter)
    {
        filter.ForRestoration = true;
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets Bypass EMOC requests with optional status filter.
    /// </summary>
    [HttpGet("bypass")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetBypassEmocs([FromQuery] MocRequestFilterDto filter)
    {
        filter.RequestType = MocRequestType.BypassEmoc;
        return await GetAll(filter);
    }

    /// <summary>
    /// Gets draft MOC requests for the current user.
    /// </summary>
    [HttpGet("drafts")]
    public async Task<ActionResult<PagedResult<MocRequestListItemDto>>> GetDrafts([FromQuery] MocRequestFilterDto filter)
    {
        filter.Status = MocStatus.Draft;
        // TODO: Filter by current user when auth is implemented
        return await GetAll(filter);
    }

    #endregion

    #region CRUD Endpoints

    /// <summary>
    /// Gets a single MOC request by ID with full details.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<MocRequestDetailDto>> GetById(Guid id)
    {
        var request = await _context.MocRequests
            .Include(x => x.ActionItems)
            .Include(x => x.Documents)
            .Include(x => x.Approvers)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (request == null)
        {
            return NotFound();
        }

        // Get lookup names
        var division = await _context.Divisions.FindAsync(request.DivisionId);
        var department = await _context.Departments.FindAsync(request.DepartmentId);
        var section = await _context.Sections.FindAsync(request.SectionId);
        var category = await _context.Categories.FindAsync(request.CategoryId);
        var subcategory = await _context.Subcategories.FindAsync(request.SubcategoryId);

        return Ok(new MocRequestDetailDto
        {
            Id = request.Id,
            ControlNumber = request.ControlNumber,
            RequestType = request.RequestType,
            RequestTypeName = request.RequestType.ToString(),
            Title = request.Title,
            Originator = request.Originator,
            DivisionId = request.DivisionId,
            DivisionName = division?.Name ?? "",
            DepartmentId = request.DepartmentId,
            DepartmentName = department?.Name ?? "",
            SectionId = request.SectionId,
            SectionName = section?.Name ?? "",
            CategoryId = request.CategoryId,
            CategoryName = category?.Name ?? "",
            SubcategoryId = request.SubcategoryId,
            SubcategoryName = subcategory?.Name ?? "",
            UnitsAffected = request.UnitsAffected,
            EquipmentTag = request.EquipmentTag,
            IsTemporary = request.IsTemporary,
            TargetImplementationDate = request.TargetImplementationDate,
            PlannedRestorationDate = request.PlannedRestorationDate,
            ScopeDescription = request.ScopeDescription,
            RiskToolUsed = request.RiskToolUsed,
            RiskLevel = request.RiskLevel,
            RiskLevelName = request.RiskLevel?.ToString(),
            CurrentStage = request.CurrentStage,
            CurrentStageName = request.CurrentStage.ToString(),
            Status = request.Status,
            StatusName = request.Status.ToString(),
            BypassDurationDays = request.BypassDurationDays,
            IsBypassEmergency = request.IsBypassEmergency,
            BypassType = request.BypassType,
            MarkedInactiveAtUtc = request.MarkedInactiveAtUtc,
            CreatedAtUtc = request.CreatedAtUtc,
            CreatedBy = request.CreatedBy,
            ModifiedAtUtc = request.ModifiedAtUtc,
            ModifiedBy = request.ModifiedBy,
            ActionItems = request.ActionItems.Select(a => new MocActionItemDto
            {
                Id = a.Id,
                Description = a.Description,
                DueDate = a.DueDate,
                IsCompleted = a.IsCompleted,
                CompletedAtUtc = a.CompletedAtUtc
            }).ToList(),
            Documents = request.Documents.Select(d => new MocDocumentDto
            {
                Id = d.Id,
                DocumentGroup = d.DocumentGroup,
                DocumentType = d.DocumentType,
                Name = d.Name,
                IsLink = d.IsLink,
                Url = d.Url
            }).ToList(),
            Approvers = request.Approvers.Select(ap => new MocApproverDto
            {
                Id = ap.Id,
                RoleKey = ap.RoleKey,
                IsCompleted = ap.IsCompleted,
                IsApproved = ap.IsApproved,
                Remarks = ap.Remarks,
                CompletedAtUtc = ap.CompletedAtUtc,
                CompletedBy = ap.CompletedBy
            }).ToList()
        });
    }

    /// <summary>
    /// Creates a new MOC request.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<MocRequestDetailDto>> Create([FromBody] CreateMocRequestDto dto)
    {
        // Validate lookups exist
        if (!await _context.Divisions.AnyAsync(x => x.Id == dto.DivisionId))
            return BadRequest(new { message = "Invalid division ID." });
        if (!await _context.Departments.AnyAsync(x => x.Id == dto.DepartmentId))
            return BadRequest(new { message = "Invalid department ID." });
        if (!await _context.Sections.AnyAsync(x => x.Id == dto.SectionId))
            return BadRequest(new { message = "Invalid section ID." });
        if (!await _context.Categories.AnyAsync(x => x.Id == dto.CategoryId))
            return BadRequest(new { message = "Invalid category ID." });
        if (!await _context.Subcategories.AnyAsync(x => x.Id == dto.SubcategoryId))
            return BadRequest(new { message = "Invalid subcategory ID." });

        // Generate control number
        var controlNumber = await GenerateControlNumber(dto.RequestType);

        var request = new MocRequest
        {
            Id = Guid.NewGuid(),
            ControlNumber = controlNumber,
            RequestType = dto.RequestType,
            Title = dto.Title,
            Originator = dto.Originator ?? "system", // TODO: Get from current user
            DivisionId = dto.DivisionId,
            DepartmentId = dto.DepartmentId,
            SectionId = dto.SectionId,
            CategoryId = dto.CategoryId,
            SubcategoryId = dto.SubcategoryId,
            UnitsAffected = dto.UnitsAffected ?? "",
            EquipmentTag = dto.EquipmentTag ?? "",
            IsTemporary = dto.IsTemporary,
            TargetImplementationDate = dto.TargetImplementationDate,
            PlannedRestorationDate = dto.PlannedRestorationDate,
            ScopeDescription = dto.ScopeDescription ?? "",
            RiskToolUsed = dto.RiskToolUsed,
            RiskLevel = dto.RiskLevel,
            CurrentStage = MocStage.Initiation,
            Status = dto.SaveAsDraft ? MocStatus.Draft : MocStatus.Submitted,
            BypassDurationDays = dto.BypassDurationDays,
            IsBypassEmergency = dto.IsBypassEmergency,
            BypassType = dto.BypassType,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system" // TODO: Get from current user
        };

        _context.MocRequests.Add(request);
        await _context.SaveChangesAsync();

        // When submitting (not draft), build approver chain from configured approval levels
        if (!dto.SaveAsDraft)
        {
            await EnsureApproversForRequestAsync(request.Id);
        }

        // Return the created resource as the response body (DTO, not ActionResult) so the client receives id and can navigate
        var detailResult = await GetById(request.Id);
        return CreatedAtAction(nameof(GetById), new { id = request.Id }, detailResult.Value);
    }

    /// <summary>
    /// Updates an existing MOC request.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<MocRequestDetailDto>> Update(Guid id, [FromBody] UpdateMocRequestDto dto)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        // Only allow updates to draft or submitted requests
        if (request.Status != MocStatus.Draft && request.Status != MocStatus.Submitted)
        {
            return BadRequest(new { message = "Cannot update a request that is already in progress." });
        }

        // Update fields if provided
        if (dto.Title != null) request.Title = dto.Title;
        if (dto.DivisionId.HasValue) request.DivisionId = dto.DivisionId.Value;
        if (dto.DepartmentId.HasValue) request.DepartmentId = dto.DepartmentId.Value;
        if (dto.SectionId.HasValue) request.SectionId = dto.SectionId.Value;
        if (dto.CategoryId.HasValue) request.CategoryId = dto.CategoryId.Value;
        if (dto.SubcategoryId.HasValue) request.SubcategoryId = dto.SubcategoryId.Value;
        if (dto.UnitsAffected != null) request.UnitsAffected = dto.UnitsAffected;
        if (dto.EquipmentTag != null) request.EquipmentTag = dto.EquipmentTag;
        if (dto.IsTemporary.HasValue) request.IsTemporary = dto.IsTemporary.Value;
        if (dto.TargetImplementationDate.HasValue) request.TargetImplementationDate = dto.TargetImplementationDate.Value;
        if (dto.PlannedRestorationDate.HasValue) request.PlannedRestorationDate = dto.PlannedRestorationDate;
        if (dto.ScopeDescription != null) request.ScopeDescription = dto.ScopeDescription;
        if (dto.RiskToolUsed != null) request.RiskToolUsed = dto.RiskToolUsed;
        if (dto.RiskLevel.HasValue) request.RiskLevel = dto.RiskLevel;
        if (dto.BypassDurationDays.HasValue) request.BypassDurationDays = dto.BypassDurationDays;
        if (dto.IsBypassEmergency.HasValue) request.IsBypassEmergency = dto.IsBypassEmergency;
        if (dto.BypassType != null) request.BypassType = dto.BypassType;

        request.ModifiedAtUtc = DateTime.UtcNow;
        request.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Deletes a draft MOC request (hard delete for drafts only).
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        // Only allow deletion of drafts
        if (request.Status != MocStatus.Draft)
        {
            return BadRequest(new { message = "Only draft requests can be deleted." });
        }

        _context.MocRequests.Remove(request);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    #endregion

    #region Workflow Actions

    /// <summary>
    /// Submits a draft request for processing.
    /// </summary>
    [HttpPost("{id}/submit")]
    public async Task<ActionResult<MocRequestDetailDto>> Submit(Guid id)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != MocStatus.Draft)
        {
            return BadRequest(new { message = "Only draft requests can be submitted." });
        }

        request.Status = MocStatus.Submitted;
        request.CurrentStage = MocStage.Validation;
        request.ModifiedAtUtc = DateTime.UtcNow;
        request.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        // Build approver chain from configured approval levels (idempotent if already present)
        await EnsureApproversForRequestAsync(id);

        return await GetById(id);
    }

    /// <summary>
    /// Records an approver's decision (approve or reject) for their slot.
    /// Only the approver slot for this request can be completed; once completed it cannot be changed.
    /// Does not advance the stage; use advance-stage after required approvers have completed.
    /// </summary>
    [HttpPost("{id}/approvers/{approverId}/complete")]
    public async Task<ActionResult<MocRequestDetailDto>> CompleteApprover(Guid id, Guid approverId, [FromBody] CompleteApproverDto dto)
    {
        var request = await _context.MocRequests.FindAsync(id);
        if (request == null)
            return NotFound();

        var approver = await _context.MocApprovers
            .FirstOrDefaultAsync(a => a.Id == approverId && a.MocRequestId == id);
        if (approver == null)
            return NotFound();

        if (approver.IsCompleted)
            return BadRequest(new { message = "This approver slot has already been completed." });

        approver.IsCompleted = true;
        approver.IsApproved = dto.Approved;
        approver.Remarks = dto.Remarks;
        approver.CompletedAtUtc = DateTime.UtcNow;
        approver.CompletedBy = dto.CompletedBy ?? "system";
        approver.ModifiedAtUtc = DateTime.UtcNow;
        approver.ModifiedBy = dto.CompletedBy ?? "system";

        await _context.SaveChangesAsync();
        return await GetById(id);
    }

    /// <summary>
    /// Advances the request to the next workflow stage.
    /// For Validation and FinalApproval stages, all required approvers for that stage must have completed and approved before advancing.
    /// </summary>
    [HttpPost("{id}/advance-stage")]
    public async Task<ActionResult<MocRequestDetailDto>> AdvanceStage(Guid id, [FromBody] AdvanceStageDto dto)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        // Determine next stage based on current stage
        var nextStage = GetNextStage(request.CurrentStage);
        if (nextStage == null)
        {
            return BadRequest(new { message = "Request is already at the final stage." });
        }

        // Gate: require all approvers for the current stage (per Standard EMOC process) to have approved before advancing
        var requiredRoles = GetRequiredApproverRolesForStage(request.CurrentStage);
        if (requiredRoles.Count > 0)
        {
            var approvers = await _context.MocApprovers
                .Where(a => a.MocRequestId == id && requiredRoles.Contains(a.RoleKey))
                .ToListAsync();
            if (approvers.Count > 0)
            {
                var notCompleted = approvers.Where(a => !a.IsCompleted || a.IsApproved != true).ToList();
                if (notCompleted.Count > 0)
                {
                    var rolesMissing = notCompleted.Select(a => a.RoleKey).Distinct().ToList();
                    return BadRequest(new
                    {
                        message = "Cannot advance: the following approver(s) must approve before advancing: " + string.Join(", ", rolesMissing) + ".",
                        requiredRoles = rolesMissing
                    });
                }
            }
        }

        request.CurrentStage = nextStage.Value;
        
        // Update status based on stage
        if (nextStage == MocStage.Implementation)
        {
            request.Status = MocStatus.Active;
        }
        else if (nextStage == MocStage.RestorationOrCloseout)
        {
            request.Status = MocStatus.Closed;
        }

        request.ModifiedAtUtc = DateTime.UtcNow;
        request.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Marks a request as inactive.
    /// </summary>
    [HttpPost("{id}/mark-inactive")]
    public async Task<ActionResult<MocRequestDetailDto>> MarkInactive(Guid id)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        request.Status = MocStatus.Inactive;
        request.MarkedInactiveAtUtc = DateTime.UtcNow;
        request.ModifiedAtUtc = DateTime.UtcNow;
        request.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Reactivates an inactive request.
    /// </summary>
    [HttpPost("{id}/reactivate")]
    public async Task<ActionResult<MocRequestDetailDto>> Reactivate(Guid id)
    {
        var request = await _context.MocRequests.FindAsync(id);

        if (request == null)
        {
            return NotFound();
        }

        if (request.Status != MocStatus.Inactive)
        {
            return BadRequest(new { message = "Only inactive requests can be reactivated." });
        }

        request.Status = MocStatus.Active;
        request.MarkedInactiveAtUtc = null;
        request.ModifiedAtUtc = DateTime.UtcNow;
        request.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    #endregion

    #region Export

    /// <summary>
    /// Exports MOC requests to CSV format.
    /// </summary>
    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportToCsv([FromQuery] MocRequestFilterDto filter)
    {
        var query = _context.MocRequests.AsQueryable();
        query = ApplyFilters(query, filter);
        query = ApplySorting(query, filter.SortBy, filter.SortDescending);

        var requests = await query.ToListAsync();

        var csv = new StringBuilder();
        csv.AppendLine("Control Number,Title,Request Type,Status,Stage,Risk Level,Division,Department,Section,Category,Equipment Tag,Is Temporary,Target Date,Created Date");

        foreach (var r in requests)
        {
            var division = await _context.Divisions.FindAsync(r.DivisionId);
            var department = await _context.Departments.FindAsync(r.DepartmentId);
            var section = await _context.Sections.FindAsync(r.SectionId);
            var category = await _context.Categories.FindAsync(r.CategoryId);

            csv.AppendLine($"\"{r.ControlNumber}\",\"{r.Title}\",\"{r.RequestType}\",\"{r.Status}\",\"{r.CurrentStage}\",\"{r.RiskLevel}\",\"{division?.Name}\",\"{department?.Name}\",\"{section?.Name}\",\"{category?.Name}\",\"{r.EquipmentTag}\",\"{r.IsTemporary}\",\"{r.TargetImplementationDate:yyyy-MM-dd}\",\"{r.CreatedAtUtc:yyyy-MM-dd}\"");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"moc-requests-{DateTime.UtcNow:yyyyMMdd}.csv");
    }

    #endregion

    #region Private Helpers

    /// <summary>
    /// Applies filter criteria to the query.
    /// </summary>
    private IQueryable<MocRequest> ApplyFilters(IQueryable<MocRequest> query, MocRequestFilterDto filter)
    {
        if (filter.RequestType.HasValue)
            query = query.Where(x => x.RequestType == filter.RequestType.Value);

        if (filter.StatusIn != null && filter.StatusIn.Count > 0)
            query = query.Where(x => filter.StatusIn!.Contains(x.Status));
        else if (filter.Status.HasValue)
            query = query.Where(x => x.Status == filter.Status.Value);

        if (filter.Stage.HasValue)
            query = query.Where(x => x.CurrentStage == filter.Stage.Value);

        if (filter.RiskLevel.HasValue)
            query = query.Where(x => x.RiskLevel == filter.RiskLevel.Value);

        if (filter.DivisionId.HasValue)
            query = query.Where(x => x.DivisionId == filter.DivisionId.Value);

        if (filter.DepartmentId.HasValue)
            query = query.Where(x => x.DepartmentId == filter.DepartmentId.Value);

        if (filter.SectionId.HasValue)
            query = query.Where(x => x.SectionId == filter.SectionId.Value);

        if (filter.CategoryId.HasValue)
            query = query.Where(x => x.CategoryId == filter.CategoryId.Value);

        if (filter.SubcategoryId.HasValue)
            query = query.Where(x => x.SubcategoryId == filter.SubcategoryId.Value);

        if (filter.IsTemporary.HasValue)
            query = query.Where(x => x.IsTemporary == filter.IsTemporary.Value);

        if (filter.DateFrom.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= filter.DateFrom.Value);

        if (filter.DateTo.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= filter.DateTo.Value);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(x =>
                x.ControlNumber.ToLower().Contains(search) ||
                x.Title.ToLower().Contains(search) ||
                x.EquipmentTag.ToLower().Contains(search));
        }

        // Special filter for restoration
        if (filter.ForRestoration == true)
        {
            query = query.Where(x =>
                x.IsTemporary &&
                x.PlannedRestorationDate.HasValue &&
                x.PlannedRestorationDate.Value < DateTime.UtcNow &&
                x.Status == MocStatus.Active);
        }

        // Filter for inactive > 60 days
        if (filter.InactiveOver60Days == true)
        {
            var cutoff = DateTime.UtcNow.AddDays(-60);
            query = query.Where(x =>
                x.Status == MocStatus.Inactive &&
                x.MarkedInactiveAtUtc.HasValue &&
                x.MarkedInactiveAtUtc.Value < cutoff);
        }

        return query;
    }

    /// <summary>
    /// Applies sorting to the query.
    /// </summary>
    private IQueryable<MocRequest> ApplySorting(IQueryable<MocRequest> query, string? sortBy, bool? descending)
    {
        var isDescending = descending ?? false;

        return sortBy?.ToLower() switch
        {
            "controlnumber" => isDescending ? query.OrderByDescending(x => x.ControlNumber) : query.OrderBy(x => x.ControlNumber),
            "title" => isDescending ? query.OrderByDescending(x => x.Title) : query.OrderBy(x => x.Title),
            "status" => isDescending ? query.OrderByDescending(x => x.Status) : query.OrderBy(x => x.Status),
            "stage" => isDescending ? query.OrderByDescending(x => x.CurrentStage) : query.OrderBy(x => x.CurrentStage),
            "risklevel" => isDescending ? query.OrderByDescending(x => x.RiskLevel) : query.OrderBy(x => x.RiskLevel),
            "targetdate" => isDescending ? query.OrderByDescending(x => x.TargetImplementationDate) : query.OrderBy(x => x.TargetImplementationDate),
            _ => isDescending ? query.OrderByDescending(x => x.CreatedAtUtc) : query.OrderBy(x => x.CreatedAtUtc)
        };
    }

    /// <summary>
    /// Maps a MocRequest entity to a list item DTO.
    /// </summary>
    private static MocRequestListItemDto MapToListItem(MocRequest x) => new()
    {
        Id = x.Id,
        ControlNumber = x.ControlNumber,
        RequestType = x.RequestType,
        RequestTypeName = x.RequestType.ToString(),
        Title = x.Title,
        Status = x.Status,
        StatusName = x.Status.ToString(),
        CurrentStage = x.CurrentStage,
        CurrentStageName = x.CurrentStage.ToString(),
        RiskLevel = x.RiskLevel,
        RiskLevelName = x.RiskLevel?.ToString(),
        IsTemporary = x.IsTemporary,
        TargetImplementationDate = x.TargetImplementationDate,
        PlannedRestorationDate = x.PlannedRestorationDate,
        CreatedAtUtc = x.CreatedAtUtc,
        MarkedInactiveAtUtc = x.MarkedInactiveAtUtc,
        IsOverdue = x.IsTemporary && x.PlannedRestorationDate.HasValue && x.PlannedRestorationDate.Value < DateTime.UtcNow && x.Status == MocStatus.Active,
        DaysInactive = x.MarkedInactiveAtUtc.HasValue ? (int)(DateTime.UtcNow - x.MarkedInactiveAtUtc.Value).TotalDays : null
    };

    /// <summary>
    /// Generates a unique control number for a new request.
    /// </summary>
    /// <summary>
    /// Ensures the request has an approver chain from configured ApprovalLevels.
    /// Creates one MocApprover per active level in order; no-op if approvers already exist.
    /// </summary>
    private async Task EnsureApproversForRequestAsync(Guid mocRequestId)
    {
        var existingCount = await _context.MocApprovers.CountAsync(x => x.MocRequestId == mocRequestId);
        if (existingCount > 0)
        {
            return;
        }

        var levels = await _context.ApprovalLevels
            .Where(x => x.IsActive)
            .OrderBy(x => x.Order)
            .ToListAsync();

        var utcNow = DateTime.UtcNow;
        var createdBy = "system";
        foreach (var level in levels)
        {
            _context.MocApprovers.Add(new MocApprover
            {
                Id = Guid.NewGuid(),
                MocRequestId = mocRequestId,
                RoleKey = level.RoleKey,
                IsCompleted = false,
                IsApproved = null,
                Remarks = null,
                CompletedAtUtc = null,
                CompletedBy = null,
                CreatedAtUtc = utcNow,
                CreatedBy = createdBy
            });
        }

        await _context.SaveChangesAsync();
    }

    private async Task<string> GenerateControlNumber(MocRequestType requestType)
    {
        var prefix = requestType switch
        {
            MocRequestType.StandardEmoc => "EMOC",
            MocRequestType.BypassEmoc => "BYPASS",
            MocRequestType.Omoc => "OMOC",
            MocRequestType.Dmoc => "DMOC",
            _ => "MOC"
        };

        var year = DateTime.UtcNow.Year;
        var count = await _context.MocRequests
            .Where(x => x.RequestType == requestType && x.CreatedAtUtc.Year == year)
            .CountAsync();

        return $"{prefix}-{year}-{(count + 1):D4}";
    }

    /// <summary>
    /// Gets the next workflow stage.
    /// </summary>
    private static MocStage? GetNextStage(MocStage currentStage)
    {
        return currentStage switch
        {
            MocStage.Initiation => MocStage.Validation,
            MocStage.Validation => MocStage.Evaluation,
            MocStage.Evaluation => MocStage.FinalApproval,
            MocStage.FinalApproval => MocStage.PreImplementation,
            MocStage.PreImplementation => MocStage.Implementation,
            MocStage.Implementation => MocStage.RestorationOrCloseout,
            MocStage.RestorationOrCloseout => null,
            _ => null
        };
    }

    /// <summary>
    /// Returns role keys that must have completed and approved before leaving this stage (Standard EMOC process).
    /// Validation: CO Dept Manager (DepartmentManager). FinalApproval: CO Div Manager (DivisionManager).
    /// Other stages have no approval gate so advancement is allowed when user triggers advance.
    /// </summary>
    private static IReadOnlyList<string> GetRequiredApproverRolesForStage(MocStage stage)
    {
        return stage switch
        {
            MocStage.Validation => new[] { "DepartmentManager" },
            MocStage.FinalApproval => new[] { "DivisionManager" },
            _ => Array.Empty<string>()
        };
    }

    #endregion
}

#region DTOs

/// <summary>
/// Filter parameters for MOC request queries.
/// </summary>
public class MocRequestFilterDto
{
    public MocRequestType? RequestType { get; set; }
    public MocStatus? Status { get; set; }
    /// <summary>When set, filter by any of these statuses (e.g. Active tab uses Submitted + Active).</summary>
    public List<MocStatus>? StatusIn { get; set; }
    public MocStage? Stage { get; set; }
    public RiskLevel? RiskLevel { get; set; }
    public Guid? DivisionId { get; set; }
    public Guid? DepartmentId { get; set; }
    public Guid? SectionId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? SubcategoryId { get; set; }
    public bool? IsTemporary { get; set; }
    public DateTime? DateFrom { get; set; }
    public DateTime? DateTo { get; set; }
    public string? Search { get; set; }
    public bool? ForRestoration { get; set; }
    public bool? InactiveOver60Days { get; set; }
    public string? SortBy { get; set; }
    public bool? SortDescending { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }
}

/// <summary>
/// Paginated result wrapper.
/// </summary>
public record PagedResult<T>
{
    public IEnumerable<T> Items { get; init; } = Enumerable.Empty<T>();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages { get; init; }
}

/// <summary>
/// MOC request list item DTO for grid/list views.
/// </summary>
public record MocRequestListItemDto
{
    public Guid Id { get; init; }
    public string ControlNumber { get; init; } = string.Empty;
    public MocRequestType RequestType { get; init; }
    public string RequestTypeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public MocStatus Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public MocStage CurrentStage { get; init; }
    public string CurrentStageName { get; init; } = string.Empty;
    public RiskLevel? RiskLevel { get; init; }
    public string? RiskLevelName { get; init; }
    public bool IsTemporary { get; init; }
    public DateTime TargetImplementationDate { get; init; }
    public DateTime? PlannedRestorationDate { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public DateTime? MarkedInactiveAtUtc { get; init; }
    public bool IsOverdue { get; init; }
    public int? DaysInactive { get; init; }
}

/// <summary>
/// Full MOC request detail DTO.
/// </summary>
public record MocRequestDetailDto
{
    public Guid Id { get; init; }
    public string ControlNumber { get; init; } = string.Empty;
    public MocRequestType RequestType { get; init; }
    public string RequestTypeName { get; init; } = string.Empty;
    public string Title { get; init; } = string.Empty;
    public string Originator { get; init; } = string.Empty;
    public Guid DivisionId { get; init; }
    public string DivisionName { get; init; } = string.Empty;
    public Guid DepartmentId { get; init; }
    public string DepartmentName { get; init; } = string.Empty;
    public Guid SectionId { get; init; }
    public string SectionName { get; init; } = string.Empty;
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public Guid SubcategoryId { get; init; }
    public string SubcategoryName { get; init; } = string.Empty;
    public string UnitsAffected { get; init; } = string.Empty;
    public string EquipmentTag { get; init; } = string.Empty;
    public bool IsTemporary { get; init; }
    public DateTime TargetImplementationDate { get; init; }
    public DateTime? PlannedRestorationDate { get; init; }
    public string ScopeDescription { get; init; } = string.Empty;
    public string? RiskToolUsed { get; init; }
    public RiskLevel? RiskLevel { get; init; }
    public string? RiskLevelName { get; init; }
    public MocStage CurrentStage { get; init; }
    public string CurrentStageName { get; init; } = string.Empty;
    public MocStatus Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public int? BypassDurationDays { get; init; }
    public bool? IsBypassEmergency { get; init; }
    public string? BypassType { get; init; }
    public DateTime? MarkedInactiveAtUtc { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime? ModifiedAtUtc { get; init; }
    public string? ModifiedBy { get; init; }
    public List<MocActionItemDto> ActionItems { get; init; } = new();
    public List<MocDocumentDto> Documents { get; init; } = new();
    public List<MocApproverDto> Approvers { get; init; } = new();
}

/// <summary>
/// DTO for creating a new MOC request.
/// </summary>
public record CreateMocRequestDto
{
    public MocRequestType RequestType { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Originator { get; init; }
    public Guid DivisionId { get; init; }
    public Guid DepartmentId { get; init; }
    public Guid SectionId { get; init; }
    public Guid CategoryId { get; init; }
    public Guid SubcategoryId { get; init; }
    public string? UnitsAffected { get; init; }
    public string? EquipmentTag { get; init; }
    public bool IsTemporary { get; init; }
    public DateTime TargetImplementationDate { get; init; }
    public DateTime? PlannedRestorationDate { get; init; }
    public string? ScopeDescription { get; init; }
    public string? RiskToolUsed { get; init; }
    public RiskLevel? RiskLevel { get; init; }
    public int? BypassDurationDays { get; init; }
    public bool? IsBypassEmergency { get; init; }
    public string? BypassType { get; init; }
    public bool SaveAsDraft { get; init; }
}

/// <summary>
/// DTO for updating an existing MOC request.
/// </summary>
public record UpdateMocRequestDto
{
    public string? Title { get; init; }
    public Guid? DivisionId { get; init; }
    public Guid? DepartmentId { get; init; }
    public Guid? SectionId { get; init; }
    public Guid? CategoryId { get; init; }
    public Guid? SubcategoryId { get; init; }
    public string? UnitsAffected { get; init; }
    public string? EquipmentTag { get; init; }
    public bool? IsTemporary { get; init; }
    public DateTime? TargetImplementationDate { get; init; }
    public DateTime? PlannedRestorationDate { get; init; }
    public string? ScopeDescription { get; init; }
    public string? RiskToolUsed { get; init; }
    public RiskLevel? RiskLevel { get; init; }
    public int? BypassDurationDays { get; init; }
    public bool? IsBypassEmergency { get; init; }
    public string? BypassType { get; init; }
}

/// <summary>
/// DTO for advancing workflow stage.
/// </summary>
public record AdvanceStageDto
{
    public string? Remarks { get; init; }
}

/// <summary>
/// DTO for completing an approver slot (approve or reject).
/// </summary>
public record CompleteApproverDto
{
    public bool Approved { get; init; }
    public string? Remarks { get; init; }
    public string? CompletedBy { get; init; }
}

/// <summary>
/// Action item DTO.
/// </summary>
public record MocActionItemDto
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public DateTime DueDate { get; init; }
    public bool IsCompleted { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
}

/// <summary>
/// Document DTO.
/// </summary>
public record MocDocumentDto
{
    public Guid Id { get; init; }
    public string DocumentGroup { get; init; } = string.Empty;
    public string DocumentType { get; init; } = string.Empty;
    public string Name { get; init; } = string.Empty;
    public bool IsLink { get; init; }
    public string? Url { get; init; }
}

/// <summary>
/// Approver DTO.
/// </summary>
public record MocApproverDto
{
    public Guid Id { get; init; }
    public string RoleKey { get; init; } = string.Empty;
    public bool IsCompleted { get; init; }
    public bool? IsApproved { get; init; }
    public string? Remarks { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
    public string? CompletedBy { get; init; }
}

#endregion
