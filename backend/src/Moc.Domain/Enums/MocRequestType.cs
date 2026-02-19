namespace Moc.Domain.Enums;

/// <summary>
/// Identifies which type of MOC request a record represents.
/// We use a single request aggregate with a discriminator so all screens can share common behaviors.
/// </summary>
public enum MocRequestType
{
    /// <summary>
    /// Standard Engineering Management of Change.
    /// </summary>
    StandardEmoc = 1,

    /// <summary>
    /// Bypass Engineering Management of Change.
    /// </summary>
    BypassEmoc = 2,

    /// <summary>
    /// Operational Management of Change (placeholder scope for now).
    /// </summary>
    Omoc = 3,

    /// <summary>
    /// Document Management of Change (placeholder scope for now).
    /// </summary>
    Dmoc = 4
}

