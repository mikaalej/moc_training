using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Feedback and Lessons Learned management.
/// Supports creating, listing, and viewing feedback entries.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class FeedbackController : ControllerBase
{
    private readonly MocDbContext _context;

    public FeedbackController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all feedback entries with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FeedbackEntryDto>>> GetAll(
        [FromQuery] bool? lessonsLearnedOnly = null,
        [FromQuery] Guid? mocRequestId = null)
    {
        var query = _context.FeedbackEntries
            .Include(x => x.MocRequest)
            .AsQueryable();

        if (lessonsLearnedOnly == true)
            query = query.Where(x => x.IsLessonLearned);

        if (mocRequestId.HasValue)
            query = query.Where(x => x.MocRequestId == mocRequestId.Value);

        var entries = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new FeedbackEntryDto
            {
                Id = x.Id,
                MocRequestId = x.MocRequestId,
                MocControlNumber = x.MocRequest != null ? x.MocRequest.ControlNumber : null,
                Title = x.Title,
                Message = x.Message,
                IsLessonLearned = x.IsLessonLearned,
                CreatedAtUtc = x.CreatedAtUtc,
                CreatedBy = x.CreatedBy
            })
            .ToListAsync();

        return Ok(entries);
    }

    /// <summary>
    /// Gets lessons learned entries only.
    /// </summary>
    [HttpGet("lessons-learned")]
    public async Task<ActionResult<IEnumerable<FeedbackEntryDto>>> GetLessonsLearned()
    {
        return await GetAll(lessonsLearnedOnly: true, mocRequestId: null);
    }

    /// <summary>
    /// Gets feedback entries for a specific MOC request.
    /// </summary>
    [HttpGet("by-request/{mocRequestId}")]
    public async Task<ActionResult<IEnumerable<FeedbackEntryDto>>> GetByMocRequest(Guid mocRequestId)
    {
        return await GetAll(lessonsLearnedOnly: null, mocRequestId: mocRequestId);
    }

    /// <summary>
    /// Gets a single feedback entry by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FeedbackEntryDto>> GetById(Guid id)
    {
        var entry = await _context.FeedbackEntries
            .Include(x => x.MocRequest)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (entry == null)
        {
            return NotFound();
        }

        return Ok(new FeedbackEntryDto
        {
            Id = entry.Id,
            MocRequestId = entry.MocRequestId,
            MocControlNumber = entry.MocRequest?.ControlNumber,
            Title = entry.Title,
            Message = entry.Message,
            IsLessonLearned = entry.IsLessonLearned,
            CreatedAtUtc = entry.CreatedAtUtc,
            CreatedBy = entry.CreatedBy
        });
    }

    /// <summary>
    /// Creates a new feedback entry.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FeedbackEntryDto>> Create([FromBody] CreateFeedbackEntryDto dto)
    {
        if (dto.MocRequestId.HasValue)
        {
            var mocExists = await _context.MocRequests.AnyAsync(x => x.Id == dto.MocRequestId.Value);
            if (!mocExists)
            {
                return BadRequest(new { message = "Invalid MOC request ID." });
            }
        }

        var entry = new FeedbackEntry
        {
            Id = Guid.NewGuid(),
            MocRequestId = dto.MocRequestId,
            Title = dto.Title,
            Message = dto.Message,
            IsLessonLearned = dto.IsLessonLearned,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system" // TODO: Get from current user
        };

        _context.FeedbackEntries.Add(entry);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = entry.Id }, await GetById(entry.Id));
    }

    /// <summary>
    /// Updates an existing feedback entry.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FeedbackEntryDto>> Update(Guid id, [FromBody] UpdateFeedbackEntryDto dto)
    {
        var entry = await _context.FeedbackEntries.FindAsync(id);

        if (entry == null)
        {
            return NotFound();
        }

        if (dto.Title != null) entry.Title = dto.Title;
        if (dto.Message != null) entry.Message = dto.Message;
        if (dto.IsLessonLearned.HasValue) entry.IsLessonLearned = dto.IsLessonLearned.Value;

        entry.ModifiedAtUtc = DateTime.UtcNow;
        entry.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Deletes a feedback entry.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await _context.FeedbackEntries.FindAsync(id);

        if (entry == null)
        {
            return NotFound();
        }

        _context.FeedbackEntries.Remove(entry);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

// DTOs for Feedback
public record FeedbackEntryDto
{
    public Guid Id { get; init; }
    public Guid? MocRequestId { get; init; }
    public string? MocControlNumber { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public bool IsLessonLearned { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
}

public record CreateFeedbackEntryDto
{
    public Guid? MocRequestId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public bool IsLessonLearned { get; init; }
}

public record UpdateFeedbackEntryDto
{
    public string? Title { get; init; }
    public string? Message { get; init; }
    public bool? IsLessonLearned { get; init; }
}
