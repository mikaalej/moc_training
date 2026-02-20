using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain.Entities;
using Moc.Domain;

namespace Moc.Api.Controllers;

/// <summary>
/// API controller for user management. Supports list, create, update, and deactivate.
/// </summary>
[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly MocDbContext _context;

    public UsersController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Gets all users, optionally active only.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetAll([FromQuery] bool? activeOnly = null)
    {
        var query = _context.AppUsers.AsQueryable();
        if (activeOnly == true)
            query = query.Where(x => x.IsActive);

        var users = await query
            .OrderBy(x => x.UserName)
            .Select(x => new UserDto
            {
                Id = x.Id,
                UserName = x.UserName,
                DisplayName = x.DisplayName,
                RoleKey = x.RoleKey,
                IsActive = x.IsActive,
                CreatedAtUtc = x.CreatedAtUtc
            })
            .ToListAsync();

        return Ok(users);
    }

    /// <summary>
    /// Gets a single user by ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var user = await _context.AppUsers.FindAsync(id);
        if (user == null)
            return NotFound();

        return Ok(new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            RoleKey = user.RoleKey,
            IsActive = user.IsActive,
            CreatedAtUtc = user.CreatedAtUtc
        });
    }

    /// <summary>
    /// Creates a new user.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto dto)
    {
        var roleExists = await _context.AppRoles.AnyAsync(x => x.Key == dto.RoleKey && x.IsActive);
        if (!roleExists)
            return BadRequest(new { message = "Invalid or inactive role." });

        var userNameExists = await _context.AppUsers.AnyAsync(x => x.UserName == dto.UserName);
        if (userNameExists)
            return BadRequest(new { message = $"User name '{dto.UserName}' already exists." });

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = dto.UserName,
            DisplayName = dto.DisplayName ?? dto.UserName,
            RoleKey = dto.RoleKey,
            IsActive = dto.IsActive,
            PasswordHash = !string.IsNullOrWhiteSpace(dto.Password) ? PasswordHelper.Hash(dto.Password!) : null,
            CreatedAtUtc = DateTime.UtcNow,
            CreatedBy = "system"
        };

        _context.AppUsers.Add(user);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = user.Id }, new UserDto
        {
            Id = user.Id,
            UserName = user.UserName,
            DisplayName = user.DisplayName,
            RoleKey = user.RoleKey,
            IsActive = user.IsActive,
            CreatedAtUtc = user.CreatedAtUtc
        });
    }

    /// <summary>
    /// Updates an existing user.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto dto)
    {
        var user = await _context.AppUsers.FindAsync(id);
        if (user == null)
            return NotFound();

        if (dto.RoleKey != null)
        {
            var roleExists = await _context.AppRoles.AnyAsync(x => x.Key == dto.RoleKey && x.IsActive);
            if (!roleExists)
                return BadRequest(new { message = "Invalid or inactive role." });
            user.RoleKey = dto.RoleKey;
        }

        if (dto.UserName != null)
        {
            var userNameExists = await _context.AppUsers.AnyAsync(x => x.UserName == dto.UserName && x.Id != id);
            if (userNameExists)
                return BadRequest(new { message = $"User name '{dto.UserName}' already exists." });
            user.UserName = dto.UserName;
        }

        if (dto.DisplayName != null)
            user.DisplayName = dto.DisplayName;

        if (dto.IsActive.HasValue)
            user.IsActive = dto.IsActive.Value;

        if (dto.Password != null)
            user.PasswordHash = string.IsNullOrWhiteSpace(dto.Password) ? null : PasswordHelper.Hash(dto.Password);

        user.ModifiedAtUtc = DateTime.UtcNow;
        user.ModifiedBy = "system";
        await _context.SaveChangesAsync();

        return await GetById(id);
    }

    /// <summary>
    /// Soft-deletes (deactivates) a user.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        var user = await _context.AppUsers.FindAsync(id);
        if (user == null)
            return NotFound();

        user.IsActive = false;
        user.ModifiedAtUtc = DateTime.UtcNow;
        user.ModifiedBy = "system";
        await _context.SaveChangesAsync();

        return NoContent();
    }
}

public record UserDto
{
    public Guid Id { get; init; }
    public string UserName { get; init; } = string.Empty;
    public string DisplayName { get; init; } = string.Empty;
    public string RoleKey { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}

public record CreateUserDto
{
    public string UserName { get; init; } = string.Empty;
    public string? DisplayName { get; init; }
    public string RoleKey { get; init; } = string.Empty;
    public bool IsActive { get; init; } = true;
    /// <summary>Optional password for stub login (hashed before storing).</summary>
    public string? Password { get; init; }
}

public record UpdateUserDto
{
    public string? UserName { get; init; }
    public string? DisplayName { get; init; }
    public string? RoleKey { get; init; }
    public bool? IsActive { get; init; }
    /// <summary>Optional new password (hashed). Set to change user's password; omit to leave unchanged.</summary>
    public string? Password { get; init; }
}
