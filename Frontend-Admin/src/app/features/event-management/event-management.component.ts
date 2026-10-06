import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, AdminEventListDto, CustomerDraftListDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { AppDialogService } from '../../services/app-dialog.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="hero">
      <div class="container hero-inner">
        <div class="hero-copy">
          <p class="hero-kicker">தmileye Admin</p>
          <h1>Event Management</h1>
          <p class="hero-sub">
            Manage admin-created and customer-submitted events in separate views.
          </p>
        </div>
        <a routerLink="/create-event" class="hero-create">+ Create event</a>
      </div>
    </section>

    <section class="filters container">
      <div class="source-switch" role="tablist" aria-label="Event source">
        <button
          type="button"
          role="tab"
          class="source-tab"
          [class.active]="sourceTab() === 'admin'"
          [attr.aria-selected]="sourceTab() === 'admin'"
          (click)="setSourceTab('admin')"
        >
          <span class="source-tab-icon admin-icon" aria-hidden="true"></span>
          <span class="source-tab-label">Admin events</span>
          <span class="source-tab-count">{{ adminCount() }}</span>
        </button>
        <button
          type="button"
          role="tab"
          class="source-tab"
          [class.active]="sourceTab() === 'customer'"
          [attr.aria-selected]="sourceTab() === 'customer'"
          (click)="setSourceTab('customer')"
        >
          <span class="source-tab-icon customer-icon" aria-hidden="true"></span>
          <span class="source-tab-label">Customer events</span>
          <span class="source-tab-count">{{ customerCount() }}</span>
        </button>
        <span class="source-switch-indicator" [class.customer]="sourceTab() === 'customer'"></span>
      </div>

      <div class="search-row">
        <input
          type="text"
          class="search-input"
          [placeholder]="sourceTab() === 'admin' ? 'Search admin events...' : 'Search customer events...'"
          [(ngModel)]="searchTerm"
          (keyup.enter)="onSearch()"
        />
        <button type="button" class="btn btn-primary" (click)="onSearch()">Search</button>
      </div>
      <div class="filter-toolbar">
        <div class="filter-row">
          <button type="button" class="filter-btn tone-all" [class.active]="!filter()" (click)="setFilter('')">All</button>
          <button type="button" class="filter-btn tone-birthday" [class.active]="filter() === 'Birthday'" (click)="setFilter('Birthday')">Birthdays</button>
          <button type="button" class="filter-btn tone-puberty" [class.active]="filter() === 'Puberty Ceremony'" (click)="setFilter('Puberty Ceremony')">Puberty</button>
          <button type="button" class="filter-btn tone-wedding" [class.active]="filter() === 'Wedding'" (click)="setFilter('Wedding')">Weddings</button>
          <button type="button" class="filter-btn tone-anniversary" [class.active]="filter() === 'Anniversary'" (click)="setFilter('Anniversary')">Anniversaries</button>
          <button type="button" class="filter-btn tone-obituary" [class.active]="filter() === 'Obituary'" (click)="setFilter('Obituary')">Obituaries</button>
          <button type="button" class="filter-btn tone-remembrance" [class.active]="filter() === 'Remembrance'" (click)="setFilter('Remembrance')">Remembrance</button>
          <button type="button" class="filter-btn tone-other" [class.active]="filter() === 'Other'" (click)="setFilter('Other')">Others</button>
        </div>
      </div>
    </section>

    <section class="feed container">
      @if (error()) {
        <div class="error-state"><p>Unable to load events. Is the API running?</p></div>
      } @else if (loading() && events().length === 0 && pendingDrafts().length === 0) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      } @else if (events().length === 0 && pendingDrafts().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">✦</span>
          @if (sourceTab() === 'admin') {
            <h3>No admin events yet</h3>
            <p>Events you create from the admin portal appear here.</p>
            <a routerLink="/create-event" class="btn btn-primary">Create event</a>
          } @else {
            <h3>No customer events yet</h3>
            <p>Pending and published events created by customers through My Events appear here.</p>
          }
        </div>
      } @else {
        @if (sourceTab() === 'customer' && pendingDrafts().length > 0) {
          <h2 class="section-label">Pending — not yet published</h2>
          <div class="event-grid pending-grid">
            @for (d of pendingDrafts(); track 'draft-' + d.id) {
              <div class="event-card card customer-event">
                <div class="card-image event-card-thumb">
                  @if (d.mainImageUrl) {
                    <img class="event-card-thumb__img" [src]="d.mainImageUrl" [alt]="d.title" loading="lazy" decoding="async" />
                  }
                </div>
                <div class="card-content">
                  <div class="badges-row">
                    <span class="owner-badge customer">Customer</span>
                    <span class="event-type-badge" [ngClass]="getEventTypeClass(d.eventType)">{{ getEventTypeLabel(d.eventType) }}</span>
                    <span class="status-badge hidden">{{ d.awaitingOfflineApproval ? 'Awaiting publish' : 'Awaiting payment' }}</span>
                  </div>
                  <h3>{{ d.title }}</h3>
                  <div class="card-meta">
                    <span>{{ d.eventDate | date: 'mediumDate' }}</span>
                    @if (d.ownerDisplayName) {
                      <span>By {{ d.ownerDisplayName }}</span>
                    }
                    <span>Payment: {{ d.paymentReceived ? 'Received' : 'Pending' }}</span>
                  </div>
                  <div class="actions">
                    <a [routerLink]="['/pending-event', d.id, 'edit']" class="btn btn-sm btn-primary">Edit</a>
                    <a [routerLink]="['/pending-event', d.id]" class="btn btn-sm btn-outline">Review</a>
                    <button type="button" class="btn btn-sm btn-danger" (click)="deleteDraft(d)" [disabled]="busyDraftId() === d.id">
                      @if (busyDraftId() === d.id) {
                        <span class="btn-spinner" aria-hidden="true"></span>
                      }
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
          @if (events().length > 0) {
            <h2 class="section-label">Published customer events</h2>
          }
        }
        <div class="event-grid">
          @for (ev of events(); track ev.id) {
            <div class="event-card card" [class.customer-event]="ev.ownerRole === 'Customer'">
              @if (ev.isPublished) {
                <a [href]="publicEventUrl(ev.id)" class="card-image-link">
                  <div class="card-image event-card-thumb">
                    @if (ev.mainImageUrl) {
                      <img class="event-card-thumb__img" [src]="ev.mainImageUrl" [alt]="ev.title" loading="lazy" decoding="async" />
                    }
                  </div>
                </a>
              } @else {
                <div class="card-image event-card-thumb">
                  @if (ev.mainImageUrl) {
                    <img class="event-card-thumb__img" [src]="ev.mainImageUrl" [alt]="ev.title" loading="lazy" decoding="async" />
                  }
                </div>
              }
              <div class="card-content">
                <div class="badges-row">
                  <span class="owner-badge" [class.admin]="ev.ownerRole !== 'Customer'" [class.customer]="ev.ownerRole === 'Customer'">
                    {{ ev.ownerRole === 'Customer' ? 'Customer' : 'Admin' }}
                  </span>
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
                  @if (ev.ownerRole === 'Customer' && ev.ownerDisplayName) {
                    <span>By {{ ev.ownerDisplayName }}</span>
                  }
                  <span>Payment: {{ ev.paymentReceived ? 'Received' : 'Pending' }}</span>
                  <span>💝 {{ ev.wishCount }} wishes</span>
                </div>
                <div class="actions">
                  <a [routerLink]="['/event', ev.id, 'edit']" class="btn btn-sm btn-primary">Edit</a>
                  @if (ev.isPublished) {
                    <button type="button" class="btn btn-sm btn-outline" (click)="togglePublished(ev, false)" [disabled]="busyId() === ev.id">
                      @if (busyId() === ev.id && busyAction() === 'toggle') {
                        <span class="btn-spinner" aria-hidden="true"></span>
                      }
                      Hide
                    </button>
                  } @else {
                    <button type="button" class="btn btn-sm btn-outline" (click)="togglePublished(ev, true)" [disabled]="busyId() === ev.id">
                      @if (busyId() === ev.id && busyAction() === 'toggle') {
                        <span class="btn-spinner" aria-hidden="true"></span>
                      }
                      Show
                    </button>
                  }
                  <button type="button" class="btn btn-sm btn-danger" (click)="deleteEvent(ev)" [disabled]="busyId() === ev.id">
                    @if (busyId() === ev.id && busyAction() === 'delete') {
                      <span class="btn-spinner" aria-hidden="true"></span>
                    }
                    Delete
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
        @if (hasMore()) {
          <div class="load-more">
            <button type="button" class="btn btn-outline" (click)="loadMore()" [disabled]="loading()">
              @if (loading()) {
                <span class="btn-spinner" aria-hidden="true"></span>
                Loading…
              } @else {
                Load more
              }
            </button>
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
    .filters { padding: 0.85rem var(--container-pad, 1.5rem) 0; }
    .source-switch {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      max-width: 32rem;
      margin: 0 auto 1.25rem;
      padding: 0.35rem;
      border-radius: 999px;
      background: #eef4f1;
      border: 1px solid rgba(13, 61, 50, 0.1);
      box-shadow: inset 0 1px 2px rgba(13, 61, 50, 0.06);
    }
    .source-switch-indicator {
      position: absolute;
      top: 0.35rem;
      left: 0.35rem;
      width: calc(50% - 0.35rem);
      height: calc(100% - 0.7rem);
      border-radius: 999px;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%);
      box-shadow: 0 4px 12px rgba(13, 61, 50, 0.22);
      transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
      z-index: 0;
    }
    .source-switch-indicator.customer {
      transform: translateX(calc(100% + 0.35rem));
      background: linear-gradient(135deg, #1e4a72 0%, #2563eb 100%);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
    }
    .source-tab {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.65rem 0.85rem;
      border: none;
      border-radius: 999px;
      background: transparent;
      color: #4b635c;
      font: inherit;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      transition: color 180ms ease;
    }
    .source-tab.active {
      color: #fff;
    }
    .source-tab-icon {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .source-tab-icon.admin-icon {
      background: #0d3d32;
      box-shadow: 0 0 0 2px rgba(13, 61, 50, 0.15);
    }
    .source-tab.active .source-tab-icon.admin-icon {
      background: #fff;
      box-shadow: none;
    }
    .source-tab-icon.customer-icon {
      background: #2563eb;
      box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
    }
    .source-tab.active .source-tab-icon.customer-icon {
      background: #fff;
      box-shadow: none;
    }
    .source-tab-count {
      min-width: 1.35rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(13, 61, 50, 0.1);
      color: inherit;
    }
    .source-tab.active .source-tab-count {
      background: rgba(255, 255, 255, 0.22);
    }
    .source-tab-label {
      white-space: nowrap;
    }
    .search-row { display: flex; gap: 0.75rem; margin-bottom: 1rem; justify-content: center; flex-wrap: wrap; }
    .search-input {
      flex: 1; min-width: 0; max-width: 400px; width: 100%;
      padding: 0.6rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius);
    }
    .filter-row { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; }
    .filter-btn {
      --tone: #334155;
      padding: 0.5rem 1rem;
      font-weight: 600;
      border: 2px solid var(--border);
      background: white;
      color: #334155;
      border-radius: 999px;
      cursor: pointer;
      transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      &.tone-all { --tone: #334155; }
      &.tone-birthday { --tone: #1d4ed8; }
      &.tone-puberty { --tone: #4338ca; }
      &.tone-wedding { --tone: #be185d; }
      &.tone-anniversary { --tone: #92400e; }
      &.tone-obituary { --tone: #374151; }
      &.tone-remembrance { --tone: #5b21b6; }
      &.tone-other { --tone: #0f766e; }
      &:hover:not(.active) {
        border-color: var(--tone);
        color: var(--tone);
        background: color-mix(in srgb, var(--tone) 8%, #fff);
      }
      &:focus-visible {
        outline: 2px solid var(--tone);
        outline-offset: 2px;
      }
      &.active {
        background: var(--tone);
        color: white;
        border-color: var(--tone);
        box-shadow: 0 4px 12px color-mix(in srgb, var(--tone) 32%, transparent);
      }
    }
    .feed { padding: 2rem var(--container-pad, 1.5rem); }
    .event-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
      gap: 1.5rem;
    }
    .pending-grid { margin-bottom: 1.75rem; }
    .section-label {
      margin: 0 0 0.85rem;
      font-size: 0.82rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #5c726b;
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
      position: relative;
    }
    .card-content { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; }
    .badges-row { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-bottom: 0.5rem; align-items: center; }
    .owner-badge {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
    }
    .owner-badge.admin {
      background: rgba(13, 61, 50, 0.12);
      color: #0d3d32;
    }
    .owner-badge.customer {
      background: rgba(37, 99, 235, 0.12);
      color: #1d4ed8;
    }
    .event-card.customer-event {
      border-left: 3px solid #2563eb;
    }
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
    /* Tablet Landscape and below */
    @media (max-width: 1199px) {
      .event-grid {
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
        gap: 1.25rem;
      }
    }

    /* Tablet Portrait and below */
    @media (max-width: 991px) {
      .hero {
        padding: 1.1rem 0;
      }
      .hero-inner {
        padding: 1.1rem var(--container-pad, 1rem);
      }
      .filters { padding: 0.85rem var(--container-pad, 1rem) 0; }
      .feed { padding: 1.5rem var(--container-pad, 1rem); }
    }

    /* Mobile Large and below */
    @media (max-width: 767px) {
      .event-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .source-switch {
        max-width: 100%;
      }
      .filter-btn {
        padding: 0.45rem 0.75rem;
        font-size: 0.85rem;
      }
      .actions .btn-sm {
        flex: 1 1 auto;
        min-width: calc(50% - 0.5rem);
        justify-content: center;
      }
    }

    /* Mobile Small */
    @media (max-width: 480px) {
      .source-tab {
        padding: 0.55rem 0.45rem;
        font-size: 0.8rem;
        gap: 0.3rem;
      }
      .source-tab-label { font-size: 0.78rem; white-space: normal; text-align: center; line-height: 1.3; }
      .source-tab-count {
        min-width: 1.15rem;
        padding: 0.08rem 0.35rem;
        font-size: 0.68rem;
      }
      .hero-create {
        width: 100%;
        max-width: 18rem;
      }
      .card-content { padding: 1rem; }
      .actions .btn-sm {
        min-width: 100%;
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
  busyAction = signal<'toggle' | 'delete' | null>(null);
  sourceTab = signal<'admin' | 'customer'>('admin');
  adminCount = signal(0);
  customerCount = signal(0);
  pendingDrafts = signal<CustomerDraftListDto[]>([]);
  busyDraftId = signal<number | null>(null);

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  constructor(
    private api: ApiService,
    private stats: EventStatsService,
    private route: ActivatedRoute,
    private dialogs: AppDialogService
  ) {}

  ngOnInit() {
    this.loadManageStats();
    this.route.queryParamMap.subscribe((params) => {
      const source = params.get('source');
      if (source === 'admin' || source === 'customer') {
        this.sourceTab.set(source);
      }
      this.page.set(1);
      this.events.set([]);
      this.loadEvents();
    });
  }

  loadManageStats() {
    this.api.getManageEventStats().subscribe({
      next: (stats) => {
        this.adminCount.set(stats.adminCount);
        this.customerCount.set(stats.customerCount);
      },
      error: () => {
        this.adminCount.set(0);
        this.customerCount.set(0);
      }
    });
  }

  setSourceTab(tab: 'admin' | 'customer') {
    if (this.sourceTab() === tab) return;
    this.sourceTab.set(tab);
    this.page.set(1);
    this.events.set([]);
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
    this.api.getManageEvents(this.page(), this.pageSize, evType, search, this.sourceTab()).subscribe({
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
    if (this.sourceTab() === 'customer' && this.page() === 1) {
      this.api.getManagePendingDrafts().subscribe({
        next: (list) => {
          const type = (evType || '').trim();
          const q = (search || '').trim().toLowerCase();
          this.pendingDrafts.set(
            list.filter((d) => {
              if (type && d.eventType !== type && !(type === 'Obituary' && d.eventType === 'Funeral')) return false;
              if (q && !(`${d.title} ${d.ownerDisplayName || ''} ${d.ownerEmail || ''}`.toLowerCase().includes(q))) {
                return false;
              }
              return true;
            })
          );
        },
        error: () => this.pendingDrafts.set([])
      });
    } else if (this.sourceTab() !== 'customer') {
      this.pendingDrafts.set([]);
    }
  }

  loadMore() {
    this.page.update((p) => p + 1);
    this.loadEvents();
  }

  togglePublished(ev: AdminEventListDto, published: boolean) {
    if (published && ev.paymentReceived !== true) {
      void this.dialogs.alert({
        title: 'Payment not received',
        message: 'Mark payment as received before publishing this event.',
        confirmLabel: 'Close'
      });
      return;
    }

    this.busyId.set(ev.id);
    this.busyAction.set('toggle');
    this.api.setEventPublished(ev.id, published).subscribe({
      next: () => {
        this.events.update((list) =>
          list.map((e) => (e.id === ev.id ? { ...e, isPublished: published } : e))
        );
        this.busyId.set(null);
        this.busyAction.set(null);
        this.stats.loadFromApi();
      },
      error: (err) => {
        this.busyId.set(null);
        this.busyAction.set(null);
        const msg =
          err?.error?.message ||
          (published && ev.paymentReceived !== true
            ? 'Payment is not received. Mark payment received before publishing this event.'
            : 'Could not update visibility. Try again.');
        void this.dialogs.alert({
          title: 'Could not update visibility',
          message: msg,
          confirmLabel: 'Close'
        });
      }
    });
  }

  deleteEvent(ev: AdminEventListDto) {
    void this.dialogs.confirm({
      title: 'Delete this event?',
      message: `“${ev.title}” will be permanently removed from the feed. This cannot be undone.`,
      confirmLabel: 'Delete event',
      cancelLabel: 'Keep event',
      tone: 'danger'
    }).then((ok) => {
      if (ok) this.runDeleteEvent(ev);
    });
  }

  private runDeleteEvent(ev: AdminEventListDto): void {
    this.busyId.set(ev.id);
    this.busyAction.set('delete');
    this.api.deleteEvent(ev.id).subscribe({
      next: () => {
        this.events.update((list) => list.filter((e) => e.id !== ev.id));
        this.total.update((t) => Math.max(0, t - 1));
        this.busyId.set(null);
        this.busyAction.set(null);
        this.loadManageStats();
        this.stats.loadFromApi();
      },
      error: () => {
        this.busyId.set(null);
        this.busyAction.set(null);
        void this.dialogs.alert({
          title: 'Could not delete event',
          message: 'This event could not be deleted. Please try again.',
          confirmLabel: 'Close'
        });
      }
    });
  }

  deleteDraft(d: CustomerDraftListDto) {
    void this.dialogs.confirm({
      title: 'Delete this draft?',
      message: `“${d.title}” will be permanently removed. This cannot be undone.`,
      confirmLabel: 'Delete draft',
      cancelLabel: 'Keep draft',
      tone: 'danger'
    }).then((ok) => {
      if (ok) this.runDeleteDraft(d);
    });
  }

  private runDeleteDraft(d: CustomerDraftListDto): void {
    this.busyDraftId.set(d.id);
    this.api.deleteDraft(d.id).subscribe({
      next: () => {
        this.pendingDrafts.update((list) => list.filter((x) => x.id !== d.id));
        this.busyDraftId.set(null);
        this.loadManageStats();
      },
      error: () => {
        this.busyDraftId.set(null);
        void this.dialogs.alert({
          title: 'Could not delete draft',
          message: 'This draft could not be deleted. Please try again.',
          confirmLabel: 'Close'
        });
      }
    });
  }
}
