namespace Moc.Domain.Enums;

/// <summary>
/// DMOC workflow status: Draft, Submitted, Department Approval (Approved/Rejected), Closed.
/// </summary>
public enum DmocStatus
{
    Draft = 0,
    Submitted = 1,
    Approved = 2,
    Rejected = 3,
    Closed = 4
}
