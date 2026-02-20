using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for Notification entity.
/// </summary>
public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.MocRequestId);
        builder.HasIndex(x => x.RecipientRoleKey);
        builder.HasIndex(x => x.RecipientUserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.CreatedAtUtc);
        builder.HasIndex(x => x.Channel);
        builder.HasIndex(x => x.FollowUpAtUtc);

        builder.HasOne(x => x.MocRequest)
            .WithMany()
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.RecipientUser)
            .WithMany()
            .HasForeignKey(x => x.RecipientUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(x => x.Type)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(x => x.Message)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(x => x.RecipientRoleKey)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Recipient)
            .HasMaxLength(256);

        builder.Property(x => x.Content)
            .HasMaxLength(4000);
    }
}
