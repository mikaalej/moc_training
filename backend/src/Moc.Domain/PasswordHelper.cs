using System.Security.Cryptography;
using System.Text;

namespace Moc.Domain;

/// <summary>
/// Simple password hashing for stub auth (dev/test). Uses SHA256; for production use ASP.NET Core Identity or similar.
/// </summary>
public static class PasswordHelper
{
    public static string Hash(string password)
    {
        if (string.IsNullOrEmpty(password))
            throw new ArgumentException("Password cannot be empty.", nameof(password));
        var bytes = Encoding.UTF8.GetBytes(password);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash);
    }

    public static bool Verify(string password, string? passwordHash)
    {
        if (string.IsNullOrEmpty(passwordHash))
            return false;
        var computed = Hash(password);
        return string.Equals(computed, passwordHash, StringComparison.Ordinal);
    }
}
