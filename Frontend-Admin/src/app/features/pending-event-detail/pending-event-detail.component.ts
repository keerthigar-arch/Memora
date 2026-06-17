import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService, CustomerDraftDetailDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-pending-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="detail-hero">
      <div class="container hero-inner">
        <a routerLink="/events" class="back-link">← Back to events</a>
        @if (draft()) {
          <span class="status-pill">Awaiting offline approval</span>
          <h1>{{ draft()!.title }}</h1>
          <p class="hero-meta">
            Submitted by {{ draft()!.ownerDisplayName || draft()!.createdBy }}
            @if (draft()!.offlineSubmittedAt) {
              · {{ draft()!.offlineSubmittedAt | date: 'medium' }}
            }
          </p>
        }
      </div>
    </section>

    @if (loading()) {
      <div class="container state-box"><div class="spinner"></div><p>Loading event details…</p></div>
    } @else if (error()) {
      <div class="container state-box">
        <p>{{ error() }}</p>
        <a routerLink="/events" class="btn btn-primary">Back to events</a>
      </div>
    } @else if (draft()) {
      <div class="container detail-layout">
        <div class="detail-main card">
          @if (draft()!.mainImageUrl) {
            <div class="hero-image" [style.background-image]="'url(' + draft()!.mainImageUrl + ')'"></div>
          }
          <div class="detail-body">
            <div class="badges">
              <span class="type-badge">{{ draft()!.eventType }}</span>
              <span class="pay-badge">Offline payment</span>
            </div>
            <p class="description">{{ draft()!.description }}</p>

            <dl class="meta-grid">
              <div><dt>Event date</dt><dd>{{ draft()!.eventDate | date: 'fullDate' }}</dd></div>
              @if (draft()!.birthDate) {
                <div><dt>Birth date</dt><dd>{{ draft()!.birthDate | date: 'fullDate' }}</dd></div>
              }
              @if (draft()!.deathDate) {
                <div><dt>Date of passing</dt><dd>{{ draft()!.deathDate | date: 'fullDate' }}</dd></div>
              }
              @if (draft()!.weddingDate) {
                <div><dt>Wedding date</dt><dd>{{ draft()!.weddingDate | date: 'fullDate' }}</dd></div>
              }
              @if (draft()!.location) {
                <div><dt>Location</dt><dd>{{ draft()!.location }}</dd></div>
              }
              @if (draft()!.country) {
                <div><dt>Country</dt><dd>{{ draft()!.country }}</dd></div>
              }
              <div><dt>Visibility</dt><dd>{{ draft()!.visibility }}</dd></div>
              <div><dt>Display plan</dt><dd>{{ periodLabel(draft()!.displayDays) }}</dd></div>
              <div><dt>Amount</dt><dd>{{ formatUsd(draft()!.amountPaid) }}</dd></div>
              @if (draft()!.ownerEmail) {
                <div><dt>Customer email</dt><dd>{{ draft()!.ownerEmail }}</dd></div>
              }
            </dl>
          </div>
        </div>

        <aside class="detail-aside card">
          <h2>Review &amp; publish</h2>
          <p class="aside-copy">
            This customer event was submitted with offline payment. Approve to publish it on the public feed.
          </p>
          @if (draft()!.awaitingOfflineApproval) {
            <button
              type="button"
              class="btn btn-primary btn-block"
              (click)="approve()"
              [disabled]="busy()"
            >
              {{ busy() ? 'Publishing…' : 'Approve & publish' }}
            </button>
          } @else {
            <p class="aside-note">This draft is no longer awaiting approval.</p>
          }
        </aside>
      </div>
    }
  `,
  styles: [
    `
      .detail-hero {
        background: linear-gradient(135deg, #1e4a72 0%, #2563eb 100%);
        color: #fff;
        padding: 1.5rem 0 1.75rem;
      }
      .hero-inner { max-width: 960px; }
      .back-link {
        display: inline-block;
        margin-bottom: 0.75rem;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 600;
      }
      .back-link:hover { color: #fff; text-decoration: underline; }
      .status-pill {
        display: inline-block;
        margin-bottom: 0.5rem;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .detail-hero h1 {
        margin: 0 0 0.35rem;
        font-size: clamp(1.35rem, 3vw, 1.85rem);
        line-height: 1.25;
      }
      .hero-meta {
        margin: 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.88rem;
      }
      .state-box {
        text-align: center;
        padding: 4rem 1rem;
      }
      .detail-layout {
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 1.25rem;
        padding: 1.5rem 1rem 2.5rem;
        align-items: start;
      }
      .card {
        background: #fff;
        border: 1px solid #e3ece8;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(8, 38, 30, 0.06);
      }
      .hero-image {
        height: 260px;
        background-size: cover;
        background-position: center;
      }
      .detail-body { padding: 1.25rem 1.35rem 1.5rem; }
      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin-bottom: 0.85rem;
      }
      .type-badge,
      .pay-badge {
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.22rem 0.55rem;
        border-radius: 999px;
      }
      .type-badge {
        background: rgba(13, 61, 50, 0.1);
        color: #0d3d32;
      }
      .pay-badge {
        background: rgba(180, 83, 9, 0.12);
        color: #b45309;
      }
      .description {
        margin: 0 0 1.25rem;
        line-height: 1.6;
        color: #334841;
        white-space: pre-wrap;
      }
      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 0.85rem 1rem;
        margin: 0;
      }
      .meta-grid div { margin: 0; }
      .meta-grid dt {
        margin: 0 0 0.15rem;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6f8079;
      }
      .meta-grid dd {
        margin: 0;
        font-size: 0.92rem;
        color: #0f2922;
        font-weight: 500;
      }
      .detail-aside {
        padding: 1.15rem 1.2rem;
        position: sticky;
        top: 5.5rem;
      }
      .detail-aside h2 {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: #0f2922;
      }
      .aside-copy,
      .aside-note {
        margin: 0 0 1rem;
        font-size: 0.86rem;
        line-height: 1.45;
        color: #5a6f68;
      }
      .btn-block { width: 100%; }
      .spinner {
        width: 44px;
        height: 44px;
        border: 4px solid var(--border);
        border-top-color: var(--primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 1rem;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 860px) {
        .detail-layout { grid-template-columns: 1fr; }
        .detail-aside { position: static; }
      }
    `
  ]
})
export class PendingEventDetailComponent implements OnInit {
  draft = signal<CustomerDraftDetailDto | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  busy = signal(false);
  private draftId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private stats: EventStatsService,
    private notifications: NotificationService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.draftId = Number(params.get('draftId'));
      if (!this.draftId) {
        this.error.set('Invalid event reference.');
        this.loading.set(false);
        return;
      }
      this.loadDraft();
    });
  }

  loadDraft() {
    this.loading.set(true);
    this.error.set(null);
    this.api.getOfflineDraftDetail(this.draftId).subscribe({
      next: (d) => {
        this.draft.set(d);
        this.loading.set(false);
      },
      error: () => {
        this.draft.set(null);
        this.error.set('This event was not found. It may have already been published.');
        this.loading.set(false);
      }
    });
  }

  periodLabel(days: number): string {
    const map: Record<number, string> = {
      30: '1 Month',
      90: '3 Months',
      180: '6 Months',
      365: '12 Months'
    };
    return map[days] ?? `${days} days`;
  }

  formatUsd(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  }

  approve() {
    const d = this.draft();
    if (!d || !confirm(`Approve "${d.title}" and publish to the feed?`)) return;
    this.busy.set(true);
    this.api.approveOfflineDraft(d.id).subscribe({
      next: (ev) => {
        this.busy.set(false);
        this.stats.loadFromApi();
        this.notifications.loadUnreadCount().subscribe({ error: () => {} });
        this.router.navigate(['/event', ev.id, 'edit']);
      },
      error: (err) => {
        this.busy.set(false);
        alert(err.error?.message || 'Could not approve event.');
      }
    });
  }
}
