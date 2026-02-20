using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for DmocRequest entity. Isolated table; no changes to MocRequests.
/// </summary>
public class DmocRequestConfiguration : IEntityTypeConfiguration<DmocRequest>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<DmocRequest> builder)
    {
        builder.ToTable("DmocRequests");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.DmocNumber)
            .IsUnique()
            .HasFilter("[DmocNumber] IS NOT NULL");

        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAtUtc);
        builder.HasIndex(x => x.AreaOrDepartmentId);
        builder.HasIndex(x => x.ChangeOriginatorUserId);

        builder.Property(x => x.DmocNumber)
            .HasMaxLength(50);

        builder.Property(x => x.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.ChangeOriginatorName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(x => x.OriginatorPosition)
            .HasMaxLength(200);

        builder.Property(x => x.AreaOrDepartmentName)
            .HasMaxLength(200);

        builder.Property(x => x.DescriptionOfChange)
            .IsRequired();

        builder.Property(x => x.ReasonForChange)
            .IsRequired();

        builder.Property(x => x.AffectedEquipment)
            .HasMaxLength(1000);

        builder.Property(x => x.AttachmentsOrReferenceLinks)
            .HasMaxLength(2000);

        builder.Property(x => x.AdditionalRemarks)
            .HasMaxLength(-1);

        // Optional FK to Department (no navigation required)
        builder.HasOne<Department>()
            .WithMany()
            .HasForeignKey(x => x.AreaOrDepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
