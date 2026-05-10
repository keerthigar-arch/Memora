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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(u =>
        {
            u.HasIndex(x => x.Email).IsUnique();
            u.HasIndex(x => x.UserName).IsUnique();
        });

         modelBuilder.Entity<Event>(entity =>
            {
                entity.Property(e => e.AmountGBP).HasColumnType("decimal(18,4)");
                entity.Property(e => e.AmountPaid).HasColumnType("decimal(18,4)");
                entity.Property(e => e.ExchangeRateUsed).HasColumnType("decimal(18,6)");
            });

        modelBuilder.Entity<Event>(e =>
        {
            e.HasIndex(x => x.EventType);
            e.HasIndex(x => x.CreatedAt);
            e.HasIndex(x => new { x.UserId, x.CreatedAt });
            e.HasIndex(x => new { x.IsPublished, x.CreatedAt });
            e.HasIndex(x => x.DisplayValidityEndDate);
            e.HasOne(x => x.User)
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Wish>(w =>
        {
            w.HasIndex(x => x.EventId);
            w.HasIndex(x => x.CreatedAt);
            w.HasOne(x => x.Event)
             .WithMany(x => x.Wishes)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<EventInvite>(ei =>
        {
            ei.HasOne(x => x.Event)
             .WithMany(x => x.Invites)
             .HasForeignKey(x => x.EventId)
             .OnDelete(DeleteBehavior.Cascade);
            ei.HasIndex(x => new { x.EventId, x.InvitedEmail }).IsUnique();
        });

        modelBuilder.Entity<PasswordResetToken>(t =>
        {
            t.HasIndex(x => x.Token).IsUnique();
            t.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PricingOrder>(p =>
        {
            p.HasIndex(x => x.ReferenceCode).IsUnique();
            p.HasIndex(x => x.CreatedAt);
        });
    }
}
