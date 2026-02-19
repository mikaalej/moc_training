using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for ApprovalLevel entity.
/// </summary>
public class ApprovalLevelConfiguration : IEntityTypeConfiguration<ApprovalLevel>
{
    public void Configure(EntityTypeBuilder<ApprovalLevel> builder)
    {
        builder.ToTable("ApprovalLevels");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.Order);

        builder.Property(x => x.RoleKey)
            .HasMaxLength(100)
            .IsRequired();
    }
}
