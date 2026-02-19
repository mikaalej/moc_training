using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Enums;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for Dashboard KPIs and Reports.
/// Provides aggregated statistics and metrics for the MOC system.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly MocDbContext _context;

    public DashboardController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all dashboard KPIs with optional date range filter.
    /// </summary>
    [HttpGet("kpis")]
    public async Task<ActionResult<DashboardKpisDto>> GetKpis(
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null,
        [FromQuery] Guid? divisionId = null,
        [FromQuery] Guid? departmentId = null)
    {
        var query = _context.MocRequests.AsQueryable();

        // Apply filters
        if (dateFrom.HasValue)
            query = query.Where(x => x.CreatedAtUtc >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(x => x.CreatedAtUtc <= dateTo.Value);
        if (divisionId.HasValue)
            query = query.Where(x => x.DivisionId == divisionId.Value);
        if (departmentId.HasValue)
            query = query.Where(x => x.DepartmentId == departmentId.Value);

        var allRequests = await query.ToListAsync();
        var now = DateTime.UtcNow;

        // Calculate KPIs
        var totalMocs = allRequests.Count;
        var closedMocs = allRequests.Count(x => x.Status == MocStatus.Closed);
        var activeMocs = allRequests.Count(x => x.Status == MocStatus.Active);
        var draftMocs = allRequests.Count(x => x.Status == MocStatus.Draft);
        var submittedMocs = allRequests.Count(x => x.Status == MocStatus.Submitted);

        var temporaryActive = allRequests.Count(x => x.IsTemporary && x.Status == MocStatus.Active);
        var permanentActive = allRequests.Count(x => !x.IsTemporary && x.Status == MocStatus.Active);

        var overdueTemporary = allRequests.Count(x =>
            x.IsTemporary &&
            x.PlannedRestorationDate.HasValue &&
            x.PlannedRestorationDate.Value < now &&
            x.Status == MocStatus.Active);

        var inactiveOver60Days = allRequests.Count(x =>
            x.Status == MocStatus.Inactive &&
            x.MarkedInactiveAtUtc.HasValue &&
            (now - x.MarkedInactiveAtUtc.Value).TotalDays > 60);

        // Risk level distribution
        var greenRisk = allRequests.Count(x => x.RiskLevel == RiskLevel.Green);
        var yellowRisk = allRequests.Count(x => x.RiskLevel == RiskLevel.Yellow);
        var redRisk = allRequests.Count(x => x.RiskLevel == RiskLevel.Red);

        // Stage distribution
        var stageDistribution = allRequests
            .Where(x => x.Status != MocStatus.Closed && x.Status != MocStatus.Draft)
            .GroupBy(x => x.CurrentStage)
            .Select(g => new StageCountDto { Stage = g.Key.ToString(), Count = g.Count() })
            .ToList();

        // Average days to close (for closed MOCs)
        var closedWithDates = allRequests
            .Where(x => x.Status == MocStatus.Closed && x.ModifiedAtUtc.HasValue)
            .ToList();
        var avgDaysToClose = closedWithDates.Any()
            ? closedWithDates.Average(x => (x.ModifiedAtUtc!.Value - x.CreatedAtUtc).TotalDays)
            : 0;

        // Request type distribution
        var standardEmocs = allRequests.Count(x => x.RequestType == MocRequestType.StandardEmoc);
        var bypassEmocs = allRequests.Count(x => x.RequestType == MocRequestType.BypassEmoc);
        var omocs = allRequests.Count(x => x.RequestType == MocRequestType.Omoc);
        var dmocs = allRequests.Count(x => x.RequestType == MocRequestType.Dmoc);

        // Pending tasks count
        var pendingTasks = await _context.TaskItems.CountAsync(x => x.Status == MocTaskStatus.Open);

        // Unread notifications count
        var unreadNotifications = await _context.Notifications.CountAsync(x => x.Status == NotificationStatus.Unread);

        return Ok(new DashboardKpisDto
        {
            TotalMocs = totalMocs,
            ClosedMocs = closedMocs,
            ActiveMocs = activeMocs,
            DraftMocs = draftMocs,
            SubmittedMocs = submittedMocs,
            TemporaryActive = temporaryActive,
            PermanentActive = permanentActive,
            OverdueTemporary = overdueTemporary,
            InactiveOver60Days = inactiveOver60Days,
            GreenRiskCount = greenRisk,
            YellowRiskCount = yellowRisk,
            RedRiskCount = redRisk,
            StandardEmocCount = standardEmocs,
            BypassEmocCount = bypassEmocs,
            OmocCount = omocs,
            DmocCount = dmocs,
            AverageDaysToClose = Math.Round(avgDaysToClose, 1),
            StageDistribution = stageDistribution,
            PendingTasks = pendingTasks,
            UnreadNotifications = unreadNotifications
        });
    }

    /// <summary>
    /// Gets MOC counts by division.
    /// </summary>
    [HttpGet("by-division")]
    public async Task<ActionResult<IEnumerable<DivisionCountDto>>> GetByDivision()
    {
        var divisions = await _context.Divisions.ToListAsync();
        var requests = await _context.MocRequests.ToListAsync();

        var result = divisions.Select(d => new DivisionCountDto
        {
            DivisionId = d.Id,
            DivisionName = d.Name,
            TotalCount = requests.Count(r => r.DivisionId == d.Id),
            ActiveCount = requests.Count(r => r.DivisionId == d.Id && r.Status == MocStatus.Active),
            ClosedCount = requests.Count(r => r.DivisionId == d.Id && r.Status == MocStatus.Closed)
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Gets MOC counts by category.
    /// </summary>
    [HttpGet("by-category")]
    public async Task<ActionResult<IEnumerable<CategoryCountDto>>> GetByCategory()
    {
        var categories = await _context.Categories.ToListAsync();
        var requests = await _context.MocRequests.ToListAsync();

        var result = categories.Select(c => new CategoryCountDto
        {
            CategoryId = c.Id,
            CategoryName = c.Name,
            TotalCount = requests.Count(r => r.CategoryId == c.Id),
            ActiveCount = requests.Count(r => r.CategoryId == c.Id && r.Status == MocStatus.Active),
            ClosedCount = requests.Count(r => r.CategoryId == c.Id && r.Status == MocStatus.Closed)
        }).ToList();

        return Ok(result);
    }

    /// <summary>
    /// Gets MOC counts by risk level.
    /// </summary>
    [HttpGet("by-risk-level")]
    public async Task<ActionResult<IEnumerable<RiskLevelCountDto>>> GetByRiskLevel()
    {
        var requests = await _context.MocRequests.ToListAsync();

        var result = new List<RiskLevelCountDto>
        {
            new() { RiskLevel = "Green", TotalCount = requests.Count(r => r.RiskLevel == RiskLevel.Green), ActiveCount = requests.Count(r => r.RiskLevel == RiskLevel.Green && r.Status == MocStatus.Active) },
            new() { RiskLevel = "Yellow", TotalCount = requests.Count(r => r.RiskLevel == RiskLevel.Yellow), ActiveCount = requests.Count(r => r.RiskLevel == RiskLevel.Yellow && r.Status == MocStatus.Active) },
            new() { RiskLevel = "Red", TotalCount = requests.Count(r => r.RiskLevel == RiskLevel.Red), ActiveCount = requests.Count(r => r.RiskLevel == RiskLevel.Red && r.Status == MocStatus.Active) },
            new() { RiskLevel = "Not Assessed", TotalCount = requests.Count(r => r.RiskLevel == null), ActiveCount = requests.Count(r => r.RiskLevel == null && r.Status == MocStatus.Active) }
        };

        return Ok(result);
    }

    /// <summary>
    /// Gets monthly MOC creation trend.
    /// </summary>
    [HttpGet("monthly-trend")]
    public async Task<ActionResult<IEnumerable<MonthlyTrendDto>>> GetMonthlyTrend([FromQuery] int months = 12)
    {
        var startDate = DateTime.UtcNow.AddMonths(-months);
        var requests = await _context.MocRequests
            .Where(x => x.CreatedAtUtc >= startDate)
            .ToListAsync();

        var result = requests
            .GroupBy(x => new { x.CreatedAtUtc.Year, x.CreatedAtUtc.Month })
            .Select(g => new MonthlyTrendDto
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                MonthName = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM yyyy"),
                CreatedCount = g.Count(),
                ClosedCount = g.Count(x => x.Status == MocStatus.Closed)
            })
            .OrderBy(x => x.Year)
            .ThenBy(x => x.Month)
            .ToList();

        return Ok(result);
    }

    /// <summary>
    /// Gets task performance metrics.
    /// </summary>
    [HttpGet("task-performance")]
    public async Task<ActionResult<TaskPerformanceDto>> GetTaskPerformance()
    {
        var tasks = await _context.TaskItems.ToListAsync();
        var now = DateTime.UtcNow;

        var totalTasks = tasks.Count;
        var openTasks = tasks.Count(t => t.Status == MocTaskStatus.Open);
        var completedTasks = tasks.Count(t => t.Status == MocTaskStatus.Completed);
        var overdueTasks = tasks.Count(t =>
            t.Status == MocTaskStatus.Open &&
            t.DueDateUtc.HasValue &&
            t.DueDateUtc.Value < now);

        var completedWithDuration = tasks
            .Where(t => t.Status == MocTaskStatus.Completed && t.CompletedAtUtc.HasValue)
            .ToList();
        var avgCompletionDays = completedWithDuration.Any()
            ? completedWithDuration.Average(t => (t.CompletedAtUtc!.Value - t.CreatedAtUtc).TotalDays)
            : 0;

        // Tasks by type
        var tasksByType = tasks
            .GroupBy(t => t.TaskType)
            .Select(g => new TaskTypeCountDto
            {
                TaskType = g.Key.ToString(),
                TotalCount = g.Count(),
                OpenCount = g.Count(t => t.Status == MocTaskStatus.Open),
                CompletedCount = g.Count(t => t.Status == MocTaskStatus.Completed)
            })
            .ToList();

        return Ok(new TaskPerformanceDto
        {
            TotalTasks = totalTasks,
            OpenTasks = openTasks,
            CompletedTasks = completedTasks,
            OverdueTasks = overdueTasks,
            AverageCompletionDays = Math.Round(avgCompletionDays, 1),
            TasksByType = tasksByType
        });
    }
}

// DTOs for Dashboard
public record DashboardKpisDto
{
    public int TotalMocs { get; init; }
    public int ClosedMocs { get; init; }
    public int ActiveMocs { get; init; }
    public int DraftMocs { get; init; }
    public int SubmittedMocs { get; init; }
    public int TemporaryActive { get; init; }
    public int PermanentActive { get; init; }
    public int OverdueTemporary { get; init; }
    public int InactiveOver60Days { get; init; }
    public int GreenRiskCount { get; init; }
    public int YellowRiskCount { get; init; }
    public int RedRiskCount { get; init; }
    public int StandardEmocCount { get; init; }
    public int BypassEmocCount { get; init; }
    public int OmocCount { get; init; }
    public int DmocCount { get; init; }
    public double AverageDaysToClose { get; init; }
    public List<StageCountDto> StageDistribution { get; init; } = new();
    public int PendingTasks { get; init; }
    public int UnreadNotifications { get; init; }
}

public record StageCountDto
{
    public string Stage { get; init; } = string.Empty;
    public int Count { get; init; }
}

public record DivisionCountDto
{
    public Guid DivisionId { get; init; }
    public string DivisionName { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public int ActiveCount { get; init; }
    public int ClosedCount { get; init; }
}

public record CategoryCountDto
{
    public Guid CategoryId { get; init; }
    public string CategoryName { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public int ActiveCount { get; init; }
    public int ClosedCount { get; init; }
}

public record RiskLevelCountDto
{
    public string RiskLevel { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public int ActiveCount { get; init; }
}

public record MonthlyTrendDto
{
    public int Year { get; init; }
    public int Month { get; init; }
    public string MonthName { get; init; } = string.Empty;
    public int CreatedCount { get; init; }
    public int ClosedCount { get; init; }
}

public record TaskPerformanceDto
{
    public int TotalTasks { get; init; }
    public int OpenTasks { get; init; }
    public int CompletedTasks { get; init; }
    public int OverdueTasks { get; init; }
    public double AverageCompletionDays { get; init; }
    public List<TaskTypeCountDto> TasksByType { get; init; } = new();
}

public record TaskTypeCountDto
{
    public string TaskType { get; init; } = string.Empty;
    public int TotalCount { get; init; }
    public int OpenCount { get; init; }
    public int CompletedCount { get; init; }
}
