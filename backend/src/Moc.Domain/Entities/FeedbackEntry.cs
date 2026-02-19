using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// User feedback / lessons learned entry.
/// Can be linked to a specific request or be general feedback.
/// </summary>
public class FeedbackEntry : AuditableEntity
{
    /// <summary>
    /// Optional FK to a request; null means general feedback.
    /// </summary>
    public Guid? MocRequestId { get; set; }

    /// <summary>
    /// Short title displayed in list UI.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Full feedback content.
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Indicates this entry is a post-closeout "lesson learned" for reporting and emphasis.
    /// </summary>
    public bool IsLessonLearned { get; set; }

    /// <summary>
    /// Navigation to related request (optional).
    /// </summary>
    public MocRequest? MocRequest { get; set; }
}

