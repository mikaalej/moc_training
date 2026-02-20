namespace Moc.Domain.Enums;

/// <summary>
/// High-level MOC classification: EMOC (Standard + Bypass), DMOC, OMOC.
/// Used for control number format and reporting; maps from MocRequestType.
/// </summary>
public enum MocType
{
    /// <summary>
    /// Engineering MOC (Standard EMOC or Bypass EMOC).
    /// </summary>
    Emoc = 1,

    /// <summary>
    /// Document Management of Change.
    /// </summary>
    Dmoc = 2,

    /// <summary>
    /// Operational Management of Change.
    /// </summary>
    Omoc = 3
}
