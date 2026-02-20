using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moc.Infrastructure.Persistence;
using Moc.Domain;

namespace Moc.Api.Controllers;

/// <summary>
/// Stub auth for testing: login with username/password returns user info (no JWT yet).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly MocDbContext _context;

    public AuthController(MocDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Login with username and password. Returns user DTO if valid; 401 if invalid.
    /// Use this to "act as" a role when testing approval levels.
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new { message = "Username and password are required." });

        var user = await _context.AppUsers
            .FirstOrDefaultAsync(u => u.UserName == dto.Username.Trim() && u.IsActive);
        if (user == null)
            return Unauthorized(new { message = "Invalid username or password." });

        if (!PasswordHelper.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid username or password." });

        return Ok(new LoginResponseDto
        {
            User = new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                DisplayName = user.DisplayName,
                RoleKey = user.RoleKey,
                IsActive = user.IsActive,
                CreatedAtUtc = user.CreatedAtUtc
            }
        });
    }
}

public record LoginRequestDto
{
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}

public record LoginResponseDto
{
    public UserDto User { get; init; } = null!;
}
