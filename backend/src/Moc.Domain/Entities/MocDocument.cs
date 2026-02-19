using System;
using Moc.Domain.Common;

namespace Moc.Domain.Entities;

/// <summary>
/// Stores a document reference for a request. This supports both file uploads and external links.
/// Physical storage is handled later; for now we store metadata and a pointer.
/// </summary>
public class MocDocument : AuditableEntity
{
    /// <summary>
    /// FK to the owning request.
    /// </summary>
    public Guid MocRequestId { get; set; }

    /// <summary>
    /// Logical grouping (e.g., "RiskAssessment", "PreImplementation", "PostImplementation").
    /// This helps the UI render documents under the correct tab/section.
    /// </summary>
    public string DocumentGroup { get; set; } = string.Empty;

    /// <summary>
    /// Document type label; supports custom document types per requirements.
    /// </summary>
    public string DocumentType { get; set; } = string.Empty;

    /// <summary>
    /// Original file name (if uploaded) or friendly name (if link).
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// If true, this is an external link; otherwise it references a stored blob/file path.
    /// </summary>
    public bool IsLink { get; set; }

    /// <summary>
    /// URL for link documents (when IsLink is true).
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Storage pointer for uploaded files (path/key). Implementation is deferred.
    /// </summary>
    public string? StoragePath { get; set; }

    /// <summary>
    /// Navigation to parent request.
    /// </summary>
    public MocRequest MocRequest { get; set; } = null!;
}

