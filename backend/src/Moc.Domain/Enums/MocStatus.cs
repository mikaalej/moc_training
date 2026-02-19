namespace Moc.Domain.Enums;

/// <summary>
/// Lifecycle status independent of stage, used for list segmentation (Active/Inactive/Closed/etc.).
/// </summary>
public enum MocStatus
{
    Draft = 1,
    Submitted = 2,
    Active = 3,
    Inactive = 4,
    Approved = 5,
    ForRestoration = 6,
    Restored = 7,
    Closed = 8,
    Cancelled = 9
}

