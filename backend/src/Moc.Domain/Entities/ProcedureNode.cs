using System;
using Moc.Domain.Common;
using Moc.Domain.Enums;

namespace Moc.Domain.Entities;

/// <summary>
/// Represents a node in the Manuals/Procedures hierarchy.
/// Nodes can represent procedures, work instructions, forms, and attachments and can nest via ParentNodeId.
/// </summary>
public class ProcedureNode : AuditableEntity
{
    /// <summary>
    /// FK to owning manual.
    /// </summary>
    public Guid ManualId { get; set; }

    /// <summary>
    /// Optional FK to parent node to build a tree (procedure -> work instruction -> form -> attachment).
    /// </summary>
    public Guid? ParentNodeId { get; set; }

    /// <summary>
    /// Node type controls rendering and behavior in UI.
    /// </summary>
    public ProcedureNodeType NodeType { get; set; }

    /// <summary>
    /// Display title of the node.
    /// </summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>
    /// Optional link or storage pointer to content. For now this is a URL; later can be integrated with file storage.
    /// </summary>
    public string? Url { get; set; }

    /// <summary>
    /// Soft delete flag.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Navigation to manual.
    /// </summary>
    public Manual Manual { get; set; } = null!;

    /// <summary>
    /// Navigation to parent node (optional).
    /// </summary>
    public ProcedureNode? ParentNode { get; set; }

    /// <summary>
    /// Navigation to children.
    /// </summary>
    public ICollection<ProcedureNode> Children { get; set; } = new List<ProcedureNode>();
}

