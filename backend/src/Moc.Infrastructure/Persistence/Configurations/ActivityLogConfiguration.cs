using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for ActivityLog entity.
/// </summary>
public class ActivityLogConfiguration : IEntityTypeConfiguration<ActivityLog>
{
    /// <inheritdoc />
    public void Configure(EntityTypeBuilder<ActivityLog> builder)
    {
        builder.ToTable("ActivityLogs");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.MocRequestId);
        builder.HasIndex(x => x.TimestampUtc);
        builder.HasIndex(x => x.Action);

        builder.HasOne(x => x.MocRequest)
            .WithMany(x => x.ActivityLogs)
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Property(x => x.Action)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.ActorEmail)
            .HasMaxLength(256);

        builder.Property(x => x.IPAddress)
            .HasMaxLength(50);

        builder.Property(x => x.DeviceInfo)
            .HasMaxLength(500);

        // JSON snapshots stored as nvarchar(max)
        builder.Property(x => x.BeforeSnapshot)
            .HasMaxLength(-1);

        builder.Property(x => x.AfterSnapshot)
            .HasMaxLength(-1);
    }
}
