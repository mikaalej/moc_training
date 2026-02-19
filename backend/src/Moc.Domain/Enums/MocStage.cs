namespace Moc.Domain.Enums;

/// <summary>
/// Workflow stage for a request. Stages drive task queues and determine which screen/actions are available.
/// </summary>
public enum MocStage
{
    Initiation = 1,
    Validation = 2,
    Evaluation = 3,
    FinalApproval = 4,
    PreImplementation = 5,
    Implementation = 6,
    RestorationOrCloseout = 7
}

