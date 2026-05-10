import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, AdminEventListDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="hero-kicker">Memora Admin</p>
          <h1>Event Management</h1>
          <p class="hero-sub">
            Your events as they appear on the public site. Update, hide from the public, or delete.
          </p>
        </div>
        <a routerLink="/create-event" class="hero-create">+ Create event</a>
      </div>
    </section>

    <section class="filters container">
      <div class="search-row">
        <input
          type="text"
          class="search-input"
          placeholder="Search your events..."
          [(ngModel)]="searchTerm"
          (keyup.enter)="onSearch()"
        />
        <button type="button" class="btn btn-primary" (click)="onSearch()">Search</button>
      </div>
      <div class="filter-toolbar">
        <div class="filter-row">
          <button type="button" class="filter-btn" [class.active]="!filter()" (click)="setFilter('')">All</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Birthday'" (click)="setFilter('Birthday')">Birthdays</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Puberty Ceremony'" (click)="setFilter('Puberty Ceremony')">Puberty</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Wedding'" (click)="setFilter('Wedding')">Weddings</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Anniversary'" (click)="setFilter('Anniversary')">Anniversaries</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Obituary'" (click)="setFilter('Obituary')">Obituaries</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Remembrance'" (click)="setFilter('Remembrance')">Remembrance</button>
          <button type="button" class="filter-btn" [class.active]="filter() === 'Other'" (click)="setFilter('Other')">Others</button>
        </div>
      </div>
    </section>

    <section class="feed container">
      @if (error()) {
        <div class="error-state"><p>Unable to load events. Is the API running?</p></div>
      } @else if (loading() && events().length === 0) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      } @else if (events().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">✦</span>
          <h3>No events yet</h3>
          <p>Create your first event to see it here.</p>
          <a routerLink="/create-event" class="btn btn-primary">Create event</a>
        </div>
      } @else {
        <div class="event-grid">
          @for (ev of events(); track ev.id) {
            <div class="event-card card">
              @if (ev.isPublished) {
                <a [href]="publicEventUrl(ev.id)" target="_blank" rel="noopener" class="card-image-link">
                  <div class="card-image" [style.background-image]="'url(' + (ev.mainImageUrl || placeholderImage) + ')'"></div>
                </a>
              } @else {
                <div class="card-image" [style.background-image]="'url(' + (ev.mainImageUrl || placeholderImage) + ')'"></div>
              }
              <div class="card-content">
                <div class="badges-row">
                  <span class="event-type-badge" [ngClass]="getEventTypeClass(ev.eventType)">{{ getEventTypeLabel(ev.eventType) }}</span>
                  @if (!ev.isPublished) {
                    <span class="status-badge hidden">Hidden</span>
                  } @else {
                    <span class="status-badge live">Live</span>
                  }
                  @if (isExpired(ev)) {
                    <span class="status-badge expired">Display ended</span>
                  }
                </div>
                <h3>{{ ev.title }}</h3>
                <p>{{ ev.description }}</p>
                <div class="card-meta">
                  <span>{{ ev.eventDate | date: 'mediumDate' }}</span>
                  <span>Payment: {{ ev.paymentReceived ? 'Received' : 'Pending' }}</span>
                  <span>💝 {{ ev.wishCount }} wishes</span>
                </div>
                <div class="actions">
                  <a [routerLink]="['/event', ev.id, 'edit']" class="btn btn-sm btn-primary">Edit</a>
                  @if (ev.isPublished) {
                    <button type="button" class="btn btn-sm btn-outline" (click)="togglePublished(ev, false)" [disabled]="busyId() === ev.id">
                      Hide
                    </button>
                  } @else {
                    <button type="button" class="btn btn-sm btn-outline" (click)="togglePublished(ev, true)" [disabled]="busyId() === ev.id">
                      Show
                    </button>
                  }
                  <button type="button" class="btn btn-sm btn-danger" (click)="deleteEvent(ev)" [disabled]="busyId() === ev.id">Delete</button>
                </div>
              </div>
            </div>
          }
        </div>
        @if (hasMore()) {
          <div class="load-more">
            <button type="button" class="btn btn-outline" (click)="loadMore()" [disabled]="loading()">Load more</button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    /* Green strip: centered copy, primary button on the green only (no inner panel). */
    .hero {
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      background: linear-gradient(135deg, #0d3d32 0%, #1b5f4b 60%, #2f7e66 100%);
      color: #fff;
      padding: 1.35rem 0;
    }
    .hero-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.25rem 1.5rem;
    }
    .hero-copy {
      max-width: 40rem;
    }
    .hero-kicker {
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      font-size: 0.72rem;
      color: rgba(255, 255, 255, 0.82);
    }
    .hero h1 {
      margin: 0 0 0.4rem;
      color: #fff;
      font-size: clamp(1.12rem, 2.3vw, 1.55rem);
      line-height: 1.24;
      font-weight: 700;
    }
    .hero-sub {
      margin: 0 auto;
      color: rgba(255, 255, 255, 0.93);
      font-size: 0.86rem;
      line-height: 1.45;
      max-width: 42ch;
    }
    .hero-create {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-top: 1.15rem;
      border-radius: 999px;
      font: inherit;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      padding: 0.55rem 1.15rem;
      border: 1px solid transparent;
      cursor: pointer;
      color: #fff;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%);
      box-shadow: 0 6px 14px rgba(13, 61, 50, 0.28);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }
    .hero-create:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 16px rgba(13, 61, 50, 0.34);
      color: #fff;
    }
    .hero-create:focus-visible {
      outline: 2px solid #fff;
      outline-offset: 3px;
    }
    .filters { padding: 0.85rem 1.5rem 0; }
    .search-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; justify-content: center; flex-wrap: wrap; }
    .search-input {
      flex: 1; min-width: 200px; max-width: 400px;
      padding: 0.6rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius);
    }
    .filter-row { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
    .filter-btn {
      padding: 0.5rem 1rem;
      font-weight: 500;
      border: 2px solid var(--border);
      background: white;
      border-radius: var(--radius);
      cursor: pointer;
      &.active { background: var(--primary); color: white; border-color: var(--primary); }
    }
    .feed { padding: 2rem 1.5rem; }
    .event-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .event-card {
      display: flex;
      flex-direction: column;
      background: var(--bg-card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .card-image-link { display: block; text-decoration: none; }
    .card-image {
      aspect-ratio: 16/10;
      background-size: cover;
      background-position: center;
      background-color: var(--border);
    }
    .card-content { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
    .badges-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; align-items: center; }
    .event-type-badge {
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      background: var(--border);
      color: var(--text);
    }
    .event-type-badge.birthday { background: #dbeafe; color: #1e40af; }
    .event-type-badge.anniversary { background: #fce7f3; color: #9d174d; }
    .event-type-badge.wedding { background: #fce7f3; color: #831843; }
    .event-type-badge.puberty { background: #e0e7ff; color: #3730a3; }
    .event-type-badge.other { background: #ecfeff; color: #155e75; }
    .event-type-badge.obituary { background: #e5e7eb; color: #374151; }
    .event-type-badge.remembrance { background: #ebe8f4; color: #433e58; }
    .status-badge {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .status-badge.live { background: #d1fae5; color: #065f46; }
    .status-badge.hidden { background: #fef3c7; color: #92400e; }
    .status-badge.expired { background: #f3f4f6; color: #6b7280; }
    .card-content h3 { font-size: 1.2rem; margin: 0.25rem 0 0.5rem; }
    .card-content p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .card-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 0.75rem;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: auto;
      padding-top: 0.5rem;
    }
    .btn-sm { padding: 0.45rem 0.75rem; font-size: 0.875rem; }
    .btn-danger {
      background: #fef2f2;
      color: #b91c1c;
      border: 1px solid #fecaca;
    }
    .btn-danger:hover:not(:disabled) { background: #fee2e2; }
    .loading, .error-state, .empty-state { text-align: center; padding: 3rem 1rem; }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 2.5rem; color: var(--accent); display: block; margin-bottom: 0.5rem; }
    .load-more { text-align: center; padding: 2rem 0; }
    @media (max-width: 960px) {
      .hero {
        padding: 1.1rem 0;
      }
      .hero-inner {
        padding: 1.1rem 1rem;
      }
    }
  `]
})
export class EventManagementComponent implements OnInit {
  events = signal<AdminEventListDto[]>([]);
  loading = signal(false);
  error = signal(false);
  page = signal(1);
  total = signal(0);
  filter = signal('');
  searchTerm = '';
  pageSize = 12;
  busyId = signal<number | null>(null);

  placeholderImage =
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop';

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  constructor(
    private api: ApiService,
    private stats: EventStatsService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  publicEventUrl(id: number): string {
    return `${environment.customerPortalUrl}/event/${id}`;
  }

  isExpired(ev: AdminEventListDto): boolean {
    if (!ev.displayValidityEndDate) return false;
    return new Date(ev.displayValidityEndDate) < new Date();
  }

  setFilter(type: string) {
    this.filter.set(type);
    this.page.set(1);
    this.events.set([]);
    this.loadEvents();
  }

  onSearch() {
    this.page.set(1);
    this.events.set([]);
    this.loadEvents();
  }

  getEventTypeClass(type: string): string {
    const t = type.toLowerCase();
    if (t === 'obituary' || t === 'funeral') return 'obituary';
    if (t === 'remembrance') return 'remembrance';
    if (t === 'anniversary') return 'anniversary';
    if (t === 'wedding') return 'wedding';
    if (t === 'puberty ceremony') return 'puberty';
    if (t === 'other') return 'other';
    if (t === 'birthday') return 'birthday';
    return 'other';
  }

  getEventTypeLabel(type: string): string {
    if (type === 'Funeral') return 'Obituary';
    const map: Record<string, string> = {
      Birthday: 'Birthday',
      'Puberty Ceremony': 'Puberty',
      Wedding: 'Wedding',
      Anniversary: 'Anniversary',
      Obituary: 'Obituary',
      Remembrance: 'Remembrance',
      Other: 'Other'
    };
    return map[type] ?? type;
  }

  loadEvents() {
    this.error.set(false);
    this.loading.set(true);
    const evType = this.filter() || undefined;
    const search = this.searchTerm?.trim() || undefined;
    this.api.getMyEvents(this.page(), this.pageSize, evType, search).subscribe({
      next: (res) => {
        const items = this.page() === 1 ? res.items : [...this.events(), ...res.items];
        this.events.set(items);
        this.total.set(res.total);
        this.stats.loadFromApi();
        this.loading.set(false);
      },
      error: () => {
        this.events.set([]);
        this.total.set(0);
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    this.page.update((p) => p + 1);
    this.loadEvents();
  }

  togglePublished(ev: AdminEventListDto, published: boolean) {
    this.busyId.set(ev.id);
    this.api.setEventPublished(ev.id, published).subscribe({
      next: () => {
        this.events.update((list) =>
          list.map((e) => (e.id === ev.id ? { ...e, isPublished: published } : e))
        );
        this.busyId.set(null);
        this.stats.loadFromApi();
      },
      error: () => {
        this.busyId.set(null);
        alert('Could not update visibility. Try again.');
      }
    });
  }

  deleteEvent(ev: AdminEventListDto) {
    if (!confirm(`Delete "${ev.title}"? This cannot be undone.`)) return;
    this.busyId.set(ev.id);
    this.api.deleteEvent(ev.id).subscribe({
      next: () => {
        this.events.update((list) => list.filter((e) => e.id !== ev.id));
        this.total.update((t) => Math.max(0, t - 1));
        this.busyId.set(null);
        this.stats.loadFromApi();
      },
      error: () => {
        this.busyId.set(null);
        alert('Could not delete event.');
      }
    });
  }
}
