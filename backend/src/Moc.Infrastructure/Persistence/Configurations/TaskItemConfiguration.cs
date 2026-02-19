using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Moc.Domain.Entities;

namespace Moc.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core configuration for TaskItem entity.
/// </summary>
public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("TaskItems");

        builder.HasKey(x => x.Id);

        builder.HasIndex(x => x.MocRequestId);
        builder.HasIndex(x => x.AssignedRoleKey);
        builder.HasIndex(x => x.AssignedUserId);
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.DueDateUtc);

        builder.HasOne(x => x.MocRequest)
            .WithMany()
            .HasForeignKey(x => x.MocRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AssignedUser)
            .WithMany()
            .HasForeignKey(x => x.AssignedUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(x => x.AssignedRoleKey)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(x => x.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Description)
            .HasMaxLength(2000);

        builder.Property(x => x.CompletionRemarks)
            .HasMaxLength(2000);

        builder.Property(x => x.CompletedBy)
            .HasMaxLength(100);
    }
}
