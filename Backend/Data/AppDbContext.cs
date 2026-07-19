using LifeEventsHub.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace LifeEventsHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<EventInvite> EventInvites => Set<EventInvite>();
    public DbSet<PendingEvent> PendingEvents => Set<PendingEvent>();
    public DbSet<Wish> Wishes => Set<Wish>();
    public DbSet<ContactSubmission> ContactSubmissions => Set<ContactSubmission>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
    public DbSet<PricingOrder> PricingOrders => Set<PricingOrder>();
    public DbSet<AdminNotification> AdminNotifications => Set<AdminNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(u =>
        {
            u.HasIndex(x => x.Email).IsUnique();
            u.HasIndex(x => x.UserName).IsUnique();
            u.Property(x => x.CreatedAt).AsUtcTimestamp();
        });

        modelBuilder.Entity<Event>(e =>
        {
            e.Property(x => x.AmountGBP).HasColumnType("decimal(18,4)");
            e.Property(x => x.AmountPaid).HasColumnType("decimal(18,4)");
            e.Property(x => x.ExchangeRateUsed).HasColumnType("decimal(18,6)");
            e.Property(x => x.CreatedAt).AsUtcTimestamp();
            e.Property(x => x.DisplayValidityEndDate).AsUtcTimestamp();

            e.HasIndex(x => x.EventType);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => x.Country);
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasIndex(x => new { x.IsPublished, x.CreatedAt });
            e.HasIndex(x => x.DisplayValidityEndDate);
            e.HasIndex(x => new { x.IsPublished, x.Visibility, x.DisplayValidityEndDate, x.CreatedAt });
            e.HasIndex(x => new { x.EventType, x.IsPublished, x.CreatedAt });

            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Wish>(w =>
        {
            w.HasIndex(x => x.EventId);
            w.HasIndex(x => x.CreatedAt);
            w.HasIndex(x => new { x.EventId, x.CreatedAt });
            w.Property(x => x.CreatedAt).AsUtcTimestamp();
            w.HasOne(x => x.Event)
             .WithMany(x => x.Wishes)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventInvite>(ei =>
        {
            ei.Property(x => x.CreatedAt).AsUtcTimestamp();
            ei.HasOne(x => x.Event)
             .WithMany(x => x.Invites)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
            ei.HasIndex(x => new { x.EventId, x.InvitedEmail }).IsUnique();
            ei.HasIndex(x => x.InvitedEmail);
        });

        modelBuilder.Entity<PasswordResetToken>(t =>
        {
            t.HasIndex(x => x.Token).IsUnique();
            t.Property(x => x.ExpiresAt).AsUtcTimestamp();
            t.Property(x => x.CreatedAt).AsUtcTimestamp();
            t.Property(x => x.UsedAt).AsUtcTimestamp();
            t.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PendingEvent>(p =>
        {
            p.Property(x => x.CreatedAt).AsUtcTimestamp();
            p.Property(x => x.OfflineSubmittedAt).AsUtcTimestamp();
            p.HasIndex(x => x.UserId);
            p.HasIndex(x => new { x.AwaitingOfflineApproval, x.CreatedAt });
        });

        modelBuilder.Entity<ContactSubmission>(c =>
        {
            c.Property(x => x.SubmittedAt).AsUtcTimestamp();
        });

        modelBuilder.Entity<PricingOrder>(p =>
        {
            p.HasIndex(x => x.ReferenceCode).IsUnique();
            p.HasIndex(x => x.CreatedAt);
            p.HasIndex(x => new { x.Status, x.CreatedAt });
            p.HasIndex(x => x.StripeSessionId);
            p.Property(x => x.CreatedAt).AsUtcTimestamp();
            p.Property(x => x.CompletedAt).AsUtcTimestamp();
            p.Property(x => x.DirectManualPaymentMarkedAt).AsUtcTimestamp();
        });

        modelBuilder.Entity<AdminNotification>(n =>
        {
            n.HasIndex(x => x.CreatedAt);
            n.HasIndex(x => x.EventId);
            n.HasIndex(x => x.PendingEventId);
            n.HasIndex(x => x.IsRead);
            n.HasIndex(x => new { x.IsRead, x.CreatedAt });
            n.Property(x => x.CreatedAt).AsUtcTimestamp();
            n.Property(x => x.ReadAt).AsUtcTimestamp();
        });
    }
}
