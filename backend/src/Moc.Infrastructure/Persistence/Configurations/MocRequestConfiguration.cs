using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for MocRequest entity.
/// Defines table name, indexes, and relationships to child entities.
/// </summary>
public class MocRequestConfiguration : IEntityTypeConfiguration<MocRequest>
{
    /// <summary>
    /// Configures the MocRequest entity mapping, including indexes for common query patterns.
    /// </summary>
    public void Configure(EntityTypeBuilder<MocRequest> builder)
    {
        builder.ToTable("MocRequests");

        // Primary key
        builder.HasKey(x => x.Id);

        // Indexes for common filters and searches
        builder.HasIndex(x => x.ControlNumber).IsUnique();
        builder.HasIndex(x => x.RequestType);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CurrentStage);
        builder.HasIndex(x => x.ModifiedAtUtc);
        builder.HasIndex(x => x.RiskLevel);
        builder.HasIndex(x => x.EquipmentTag);
        builder.HasIndex(x => new { x.DivisionId, x.DepartmentId, x.SectionId });
        builder.HasIndex(x => x.TargetImplementationDate);
        builder.HasIndex(x => x.PlannedRestorationDate);

        // Foreign key constraints to lookup tables (no navigation properties in domain model)
        builder.HasOne<Division>()
            .WithMany()
            .HasForeignKey(x => x.DivisionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Department>()
            .WithMany()
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Section>()
            .WithMany()
            .HasForeignKey(x => x.SectionId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<Subcategory>()
            .WithMany()
            .HasForeignKey(x => x.SubcategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        // Child collections
        builder.HasMany(x => x.ActionItems)
            .WithOne(x => x.MocRequest)
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Documents)
            .WithOne(x => x.MocRequest)
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.Approvers)
            .WithOne(x => x.MocRequest)
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(x => x.ActivityLogs)
            .WithOne(x => x.MocRequest)
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        // Property configurations
        builder.Property(x => x.ControlNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Originator)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.EquipmentTag)
            .HasMaxLength(100);

        builder.Property(x => x.UnitsAffected)
            .HasMaxLength(200);

        builder.Property(x => x.ScopeDescription)
            .HasMaxLength(4000);

        builder.Property(x => x.RiskToolUsed)
            .HasMaxLength(100);

        builder.Property(x => x.BypassType)
            .HasMaxLength(100);

        builder.Property(x => x.ControlNumberArea)
            .HasMaxLength(50);

        builder.Property(x => x.ControlNumberCategory)
            .HasMaxLength(50);

        builder.Property(x => x.ControlNumberCode)
            .HasMaxLength(50);
    }
}
