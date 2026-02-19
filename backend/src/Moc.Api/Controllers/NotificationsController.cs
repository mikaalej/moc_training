using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;
using Moc.Domain.Enums;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for notification management.
/// Supports listing, marking as read, and dismissing notifications.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly MocDbContext _context;

    public NotificationsController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all notifications with optional filtering.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetAll(
        [FromQuery] NotificationStatus? status = null,
        [FromQuery] string? recipientRoleKey = null,
        [FromQuery] Guid? recipientUserId = null,
        [FromQuery] Guid? mocRequestId = null)
    {
        var query = _context.Notifications
            .Include(x => x.MocRequest)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(x => x.Status == status.Value);

        if (!string.IsNullOrWhiteSpace(recipientRoleKey))
            query = query.Where(x => x.RecipientRoleKey == recipientRoleKey);

        if (recipientUserId.HasValue)
            query = query.Where(x => x.RecipientUserId == recipientUserId.Value);

        if (mocRequestId.HasValue)
            query = query.Where(x => x.MocRequestId == mocRequestId.Value);

        var notifications = await query
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new NotificationDto
            {
                Id = x.Id,
                Type = x.Type,
                Message = x.Message,
                MocRequestId = x.MocRequestId,
                MocControlNumber = x.MocRequest != null ? x.MocRequest.ControlNumber : null,
                RecipientRoleKey = x.RecipientRoleKey,
                RecipientUserId = x.RecipientUserId,
                Status = x.Status,
                StatusName = x.Status.ToString(),
                ReadAtUtc = x.ReadAtUtc,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(notifications);
    }

    /// <summary>
    /// Gets unread notifications.
    /// </summary>
    [HttpGet("unread")]
    public async Task<ActionResult<IEnumerable<NotificationDto>>> GetUnread(
        [FromQuery] string? recipientRoleKey = null,
        [FromQuery] Guid? recipientUserId = null)
    {
        return await GetAll(NotificationStatus.Unread, recipientRoleKey, recipientUserId, null);
    }

    /// <summary>
    /// Gets the count of unread notifications.
    /// </summary>
    [HttpGet("unread/count")]
    public async Task<ActionResult<int>> GetUnreadCount(
        [FromQuery] string? recipientRoleKey = null,
        [FromQuery] Guid? recipientUserId = null)
    {
        var query = _context.Notifications
            .Where(x => x.Status == NotificationStatus.Unread);

        if (!string.IsNullOrWhiteSpace(recipientRoleKey))
            query = query.Where(x => x.RecipientRoleKey == recipientRoleKey);

        if (recipientUserId.HasValue)
            query = query.Where(x => x.RecipientUserId == recipientUserId.Value);

        var count = await query.CountAsync();

        return Ok(count);
    }

    /// <summary>
    /// Gets a single notification by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<NotificationDto>> GetById(Guid id)
    {
        var notification = await _context.Notifications
            .Include(x => x.MocRequest)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (notification == null)
        {
            return NotFound();
        }

        return Ok(new NotificationDto
        {
            Id = notification.Id,
            Type = notification.Type,
            Message = notification.Message,
            MocRequestId = notification.MocRequestId,
            MocControlNumber = notification.MocRequest?.ControlNumber,
            RecipientRoleKey = notification.RecipientRoleKey,
            RecipientUserId = notification.RecipientUserId,
            Status = notification.Status,
            StatusName = notification.Status.ToString(),
            ReadAtUtc = notification.ReadAtUtc,
            CreatedAtUtc = notification.CreatedAtUtc
        });
    }

    /// <summary>
    /// Creates a new notification.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<NotificationDto>> Create([FromBody] CreateNotificationDto dto)
    {
        if (dto.MocRequestId.HasValue)
        {
            var mocExists = await _context.MocRequests.AnyAsync(x => x.Id == dto.MocRequestId.Value);
            if (!mocExists)
            {
                return BadRequest(new { message = "Invalid MOC request ID." });
            }
        }

        var notification = new Notification
        {
            Id = Guid.NewGuid(),
            Type = dto.Type,
            Message = dto.Message,
            MocRequestId = dto.MocRequestId,
            RecipientRoleKey = dto.RecipientRoleKey,
            RecipientUserId = dto.RecipientUserId,
            Status = NotificationStatus.Unread,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = notification.Id }, await GetById(notification.Id));
    }

    /// <summary>
    /// Marks a notification as read.
    /// </summary>
    [HttpPost("{id}/read")]
    public async Task<ActionResult<NotificationDto>> MarkAsRead(Guid id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
        {
            return NotFound();
        }

        if (notification.Status == NotificationStatus.Unread)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAtUtc = DateTime.UtcNow;
            notification.ModifiedAtUtc = DateTime.UtcNow;
            notification.ModifiedBy = "system";

            await _context.SaveChangesAsync();
        }

        return await GetById(id);
    }

    /// <summary>
    /// Marks all notifications as read for a user/role.
    /// </summary>
    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead(
        [FromQuery] string? recipientRoleKey = null,
        [FromQuery] Guid? recipientUserId = null)
    {
        var query = _context.Notifications
            .Where(x => x.Status == NotificationStatus.Unread);

        if (!string.IsNullOrWhiteSpace(recipientRoleKey))
            query = query.Where(x => x.RecipientRoleKey == recipientRoleKey);

        if (recipientUserId.HasValue)
            query = query.Where(x => x.RecipientUserId == recipientUserId.Value);

        var notifications = await query.ToListAsync();

        foreach (var notification in notifications)
        {
            notification.Status = NotificationStatus.Read;
            notification.ReadAtUtc = DateTime.UtcNow;
            notification.ModifiedAtUtc = DateTime.UtcNow;
            notification.ModifiedBy = "system";
        }

        await _context.SaveChangesAsync();

        return Ok(new { count = notifications.Count });
    }

    /// <summary>
    /// Dismisses a notification.
    /// </summary>
    [HttpPost("{id}/dismiss")]
    public async Task<ActionResult<NotificationDto>> Dismiss(Guid id)
    {
        var notification = await _context.Notifications.FindAsync(id);

        if (notification == null)
        {
            return NotFound();
        }

        notification.Status = NotificationStatus.Dismissed;
        notification.ModifiedAtUtc = DateTime.UtcNow;
        notification.ModifiedBy = "system";

        await _context.SaveChangesAsync();

        return await GetById(id);
    }
}

// DTOs for Notifications
public record NotificationDto
{
    public Guid Id { get; init; }
    public string Type { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Guid? MocRequestId { get; init; }
    public string? MocControlNumber { get; init; }
    public string RecipientRoleKey { get; init; } = string.Empty;
    public Guid? RecipientUserId { get; init; }
    public NotificationStatus Status { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public DateTime? ReadAtUtc { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}

public record CreateNotificationDto
{
    public string Type { get; init; } = string.Empty;
    public string Message { get; init; } = string.Empty;
    public Guid? MocRequestId { get; init; }
    public string RecipientRoleKey { get; init; } = string.Empty;
    public Guid? RecipientUserId { get; init; }
}
