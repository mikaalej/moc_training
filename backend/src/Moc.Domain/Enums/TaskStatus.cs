namespace Moc.Domain.Enums;

/// <summary>
/// Current status of an actionable task in the workflow.
/// Task status is separate from request status because tasks can be completed while a request remains active.
/// </summary>
public enum MocTaskStatus
{
    Open = 1,
    Completed = 2,
    Cancelled = 3
}

