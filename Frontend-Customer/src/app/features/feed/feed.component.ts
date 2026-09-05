import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventListDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe, DatePickerComponent],
  template: `
    <section class="filters-wrap">
      <div class="container filters">
        <div class="find-card panel">
          <header class="find-card-head">
            <h2 class="find-title">{{ 'feed.findTitle' | t }}</h2>
          </header>

          <div class="search-row">
            <label class="search-input-wrap" [attr.aria-label]="'feed.searchAria' | t">
              <span class="search-icon" aria-hidden="true">⌕</span>
              <input
                type="text"
                class="search-input"
                [placeholder]="'feed.searchPlaceholder' | t"
                [(ngModel)]="searchTerm"
                (keyup.enter)="onSearch()"
              />
            </label>
            <button type="button" class="btn btn-primary search-action" (click)="onSearch()">{{ 'feed.search' | t }}</button>
          </div>

          <div class="filter-groups">
            <div class="group">
              <span class="group-label">{{ 'feed.eventType' | t }}</span>
              <div class="filter-row filter-row-scroll" role="group" [attr.aria-label]="'feed.eventType' | t">
                <button type="button" class="filter-btn" [class.active]="!filter()" (click)="setFilter('')">{{ 'feed.type.all' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Birthday'" (click)="setFilter('Birthday')">{{ 'feed.type.birthdays' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Puberty Ceremony'" (click)="setFilter('Puberty Ceremony')">{{ 'feed.type.puberty' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Wedding'" (click)="setFilter('Wedding')">{{ 'feed.type.weddings' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Anniversary'" (click)="setFilter('Anniversary')">{{ 'feed.type.anniversaries' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Obituary'" (click)="setFilter('Obituary')">{{ 'feed.type.obituaries' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Remembrance'" (click)="setFilter('Remembrance')">{{ 'feed.type.remembrance' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="filter() === 'Other'" (click)="setFilter('Other')">{{ 'feed.type.others' | t }}</button>
              </div>
            </div>

            <div class="group">
              <span class="group-label">{{ 'feed.dateRange' | t }}</span>
              <div class="filter-row filter-row-scroll" role="group" [attr.aria-label]="'feed.dateRange' | t">
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'all'" (click)="setDateRange('all')">{{ 'feed.date.allTime' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'thisYear'" (click)="setDateRange('thisYear')">{{ 'feed.date.thisYear' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'lastYear'" (click)="setDateRange('lastYear')">{{ 'feed.date.lastYear' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'custom'" (click)="toggleCustomDatePicker()">{{ 'feed.date.custom' | t }}</button>
              </div>
              @if (showCustomDatePicker()) {
                <div class="date-inputs custom-picker">
                  <label class="date-field">
                    <span>{{ 'feed.date.from' | t }}</span>
                    <app-date-picker
                      [(ngModel)]="fromDate"
                      name="fromDate"
                      [placeholder]="'feed.date.placeholder' | t"
                      [ariaLabel]="('feed.date.from' | t)"
                      (ngModelChange)="onCustomDateChange($event, 'from')"
                    ></app-date-picker>
                  </label>
                  <label class="date-field">
                    <span>{{ 'feed.date.to' | t }}</span>
                    <app-date-picker
                      [(ngModel)]="toDate"
                      name="toDate"
                      [placeholder]="'feed.date.placeholder' | t"
                      [ariaLabel]="('feed.date.to' | t)"
                      (ngModelChange)="onCustomDateChange($event, 'to')"
                    ></app-date-picker>
                  </label>
                  <button type="button" class="btn btn-outline btn-sm-picker" (click)="clearCustomDates()">{{ 'feed.date.clear' | t }}</button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="feed">
      <div class="feed-layout container">
        <div class="feed-main">
          @if (error()) {
            <div class="error-state">
              <p>{{ 'feed.error' | t }}</p>
            </div>
          } @else if (loading() && events().length === 0) {
            <div class="loading"><div class="spinner"></div><p>{{ 'feed.loadingStories' | t }}</p></div>
          } @else if (events().length === 0) {
            <div class="empty-state">
              <span class="empty-mark" aria-hidden="true">✦</span>
              <h3>{{ 'feed.emptyTitle' | t }}</h3>
              <p class="empty-lede">{{ 'feed.emptyHint' | t }}</p>
              <div class="empty-actions">
                <button type="button" class="btn btn-primary" (click)="exploreEvents()">{{ 'feed.exploreEvents' | t }}</button>
                <a routerLink="/my-events/create" class="btn btn-outline">{{ 'feed.createMemory' | t }}</a>
              </div>
            </div>
          } @else {
            <div class="event-grid">
              @for (ev of events(); track ev.id) {
                <a [routerLink]="['/event', ev.id]" class="event-card">
                  <div class="card-image event-card-thumb">
                    @if (ev.mainImageUrl) {
                      <img class="event-card-thumb__img" [src]="ev.mainImageUrl" [alt]="ev.title" loading="lazy" decoding="async" />
                    }
                    <span class="event-type-badge" [ngClass]="getEventTypeClass(ev.eventType)">
                      {{ i18n.eventTypeLabel(ev.eventType) }}
                    </span>
                  </div>
                  <div class="card-content">
                    <h3>{{ ev.title }}</h3>
                    <p>{{ ev.description }}</p>
                    <div class="meta-row">
                      <span class="meta-pill">{{ ev.eventDate | date:'mediumDate':'':i18n.dateLocale() }}</span>
                      <span class="meta-pill">💝 {{ 'feed.wishesCount' | t:{ n: ev.wishCount } }}</span>
                    </div>
                    @if (
                      (ev.eventType === 'Obituary' || ev.eventType === 'Funeral' || ev.eventType === 'Remembrance') &&
                      ev.birthDate &&
                      ev.deathDate
                    ) {
                      <p class="dates">{{
                        'feed.bornPassed'
                          | t:{
                              born: (ev.birthDate | date:'mediumDate':'':i18n.dateLocale()) ?? '',
                              passed: (ev.deathDate | date:'mediumDate':'':i18n.dateLocale()) ?? ''
                            }
                      }}</p>
                    }
                    <div class="card-footer">
                      <span class="author">{{ ev.createdBy }}</span>
                      <span class="time-ago" [title]="ev.createdAt | date:'medium':'':i18n.dateLocale()">{{
                        i18n.formatTimeAgo(ev.createdAt)
                      }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>

            @if (loading() && events().length > 0) {
              <div class="feed-loading-more" aria-live="polite">
                <div class="spinner spinner-inline"></div>
                <span>{{ 'feed.loadingMore' | t }}</span>
              </div>
            }
            @if (hasMore()) {
              <div class="feed-scroll-sentinel" #feedScrollSentinel aria-hidden="true"></div>
            }
          }
        </div>
      </div>
    </section>

  `,
  styles: [`
    .filters-wrap {
      background: linear-gradient(180deg, #f6f9f7 0%, #fbfcfb 100%);
      border-bottom: 1px solid #e5eee9;
    }
    .filters {
      padding: 0.65rem 1.5rem 0.75rem;
    }
    .panel {
      background: #fff;
      border: 1px solid #e0ebe5;
      border-radius: 16px;
      box-shadow: 0 6px 20px rgba(13, 61, 50, 0.05);
    }
    .find-card {
      padding: 0.85rem 1rem 0.95rem;
      display: grid;
      gap: 0.7rem;
    }
    .find-card-head {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .find-title {
      margin: 0;
      font-family: var(--font-display, inherit);
      font-size: 1.05rem;
      font-weight: 700;
      color: #0d3d32;
      letter-spacing: 0.01em;
    }
    .search-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.55rem;
      align-items: center;
    }
    .search-input-wrap {
      min-height: 44px;
      border: 1px solid #d5e2dc;
      border-radius: 10px;
      padding: 0 0.78rem;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: #fbfcfc;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }
    .search-input-wrap:focus-within {
      border-color: #1a5f4a;
      box-shadow: 0 0 0 4px rgba(26, 95, 74, 0.12);
      background: #fff;
    }
    .search-icon {
      color: #6b857c;
      font-size: 1rem;
      line-height: 1;
    }
    .search-input {
      min-height: 42px;
      border: none;
      padding: 0;
      font-size: 0.95rem;
      background: transparent;
      width: 100%;
      color: #0f172a;
    }
    .search-input:focus {
      outline: none;
    }
    .search-action { min-width: 110px; padding: 0.65rem 1.1rem; }
    .filter-groups {
      display: grid;
      gap: 0.55rem;
    }
    .group {
      min-width: 0;
    }
    .group-label {
      display: block;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #5f746c;
      margin-bottom: 0.32rem;
    }
    .filter-row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      border: 1px solid #d5e0db;
      border-radius: 999px;
      background: #fff;
      color: #3d534c;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.28rem 0.68rem;
      cursor: pointer;
      transition: all 0.18s ease;
      letter-spacing: 0.01em;
      white-space: nowrap;
      flex: 0 0 auto;
    }
    .filter-btn:hover:not(.active) {
      border-color: #1a5f4a;
      color: #1a5f4a;
      background: #f7fcfa;
    }
    .filter-btn.active {
      background: #1a5f4a;
      color: #fff;
      border-color: #1a5f4a;
      box-shadow: 0 4px 10px rgba(26, 95, 74, 0.22);
    }
    .date-inputs {
      margin-top: 0.45rem;
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.42rem;
      align-items: end;
    }
    .custom-picker {
      padding: 0.4rem;
      border: 1px solid #e2ebe6;
      border-radius: 10px;
      background: #f9fcfb;
    }
    .date-field {
      display: grid;
      gap: 0.2rem;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #64748b;
    }
    .btn-sm-picker { min-height: 36px; padding: 0.45rem 0.75rem; font-size: 0.8rem; }

    .feed { padding: 0.7rem 0 2.2rem; }
    .feed-layout {
      display: block;
    }
    .feed-main { min-width: 0; }
    .event-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.15rem;
    }
    .event-card {
      display: block;
      text-decoration: none;
      color: inherit;
      border: 1px solid #e4e8ef;
      border-radius: 16px;
      overflow: hidden;
      background: #fff;
      box-shadow: 0 8px 22px rgba(16, 24, 40, 0.05);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .event-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(16, 24, 40, 0.09); }
    .card-image {
      position: relative;
    }
    .event-type-badge {
      position: absolute;
      left: 0.75rem;
      top: 0.75rem;
      border-radius: 999px;
      padding: 0.3rem 0.65rem;
      font-size: 0.74rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      color: #fff;
      background: rgba(0,0,0,0.45);
    }
    .event-type-badge.birthday { background: linear-gradient(135deg, #4f46e5, #3730a3); }
    .event-type-badge.puberty { background: linear-gradient(135deg, #6366f1, #4338ca); }
    .event-type-badge.wedding { background: linear-gradient(135deg, #db2777, #831843); }
    .event-type-badge.anniversary { background: linear-gradient(135deg, #db2777, #9d174d); }
    .event-type-badge.obituary { background: linear-gradient(135deg, #475569, #1f2937); }
    .event-type-badge.remembrance { background: linear-gradient(135deg, #5b577a, #3d3554); }
    .event-type-badge.other { background: linear-gradient(135deg, #0891b2, #155e75); }
    .card-content { padding: 0.95rem; }
    .card-content h3 {
      margin: 0;
      color: #111827;
      font-size: 1.03rem;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-content p {
      margin: 0.55rem 0 0.65rem;
      color: #5f6b7f;
      font-size: 0.88rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .meta-pill {
      border: 1px solid #e2e7ef;
      border-radius: 999px;
      background: #f8fafc;
      color: #445166;
      padding: 0.2rem 0.55rem;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .dates {
      margin: 0.55rem 0 0;
      color: #6a7586;
      font-size: 0.78rem;
      line-height: 1.4;
    }
    .card-footer { margin-top: 0.7rem; padding-top: 0.45rem; display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.78rem; color: #647084; }
    .author {
      font-weight: 600;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .loading, .error-state, .empty-state {
      text-align: center;
      border: 1px solid #e3ece8;
      border-radius: 16px;
      background: linear-gradient(180deg, #ffffff 0%, #f8fbf9 100%);
      padding: 2.25rem 1.35rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e3e7ee;
      border-top-color: #1a5f4a;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.7rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 50%;
      margin: 0 auto 0.75rem;
      font-size: 1.15rem;
      color: #1a5f4a;
      background: #e8f4ef;
      border: 1px solid #cfe4db;
    }
    .empty-state h3 {
      margin: 0 0 0.4rem;
      font-family: var(--font-display, inherit);
      font-size: 1.2rem;
      color: #0d3d32;
    }
    .empty-lede {
      margin: 0 auto 1.15rem;
      max-width: 28rem;
      color: #5f746c;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .empty-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
      justify-content: center;
    }
    .empty-actions .btn {
      text-decoration: none;
      min-width: 9.5rem;
    }
    .feed-loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      margin-top: 1.35rem;
      color: #647084;
      font-size: 0.875rem;
    }
    .feed-loading-more .spinner-inline {
      width: 22px;
      height: 22px;
      border-width: 3px;
      margin: 0;
    }
    .feed-scroll-sentinel {
      height: 1px;
      width: 100%;
      margin-top: 0.5rem;
      pointer-events: none;
      opacity: 0;
    }

    @media (max-width: 768px) {
      .search-row { grid-template-columns: 1fr; }
      .search-action { width: 100%; min-width: 0; }
      .filters { padding: 0.55rem var(--container-pad, 1rem) 0.65rem; }
      .find-card { padding: 0.75rem 0.8rem 0.85rem; }
      .filter-row-scroll {
        flex-wrap: nowrap;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        padding-bottom: 0.2rem;
        margin-inline: -0.1rem;
        padding-inline: 0.1rem;
      }
      .filter-row-scroll::-webkit-scrollbar {
        height: 4px;
      }
      .filter-row-scroll::-webkit-scrollbar-thumb {
        background: #c5d8d0;
        border-radius: 999px;
      }
    }
    @media (max-width: 480px) {
      .date-inputs { grid-template-columns: 1fr; }
      .filter-btn {
        font-size: 0.74rem;
        padding: 0.26rem 0.58rem;
      }
      .group-label {
        font-size: 0.64rem;
      }
      .event-grid {
        gap: 0.75rem;
      }
      .empty-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .empty-actions .btn {
        width: 100%;
      }
    }
  `]
})
export class FeedComponent implements OnDestroy {
  events = signal<EventListDto[]>([]);
  loading = signal(false);
  error = signal(false);
  page = signal(1);
  total = signal(0);
  filter = signal('');
  dateRange = signal<'all' | 'thisYear' | 'lastYear' | 'custom'>('all');
  showCustomDatePicker = signal(false);
  searchTerm = '';
  /** API query format yyyy-MM-dd */
  fromDate = '';
  toDate = '';
  pageSize = 12;

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  private intersectionObserver: IntersectionObserver | null = null;

  @ViewChild('feedScrollSentinel')
  set feedScrollSentinel(el: ElementRef<HTMLElement> | undefined) {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
    const node = el?.nativeElement;
    if (!node) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          if (!this.hasMore() || this.loading()) continue;
          this.ngZone.run(() => this.loadMore());
        }
      },
      { root: null, rootMargin: '180px 0px', threshold: 0 }
    );
    this.intersectionObserver.observe(node);
  }

  constructor(
    private api: ApiService,
    private stats: EventStatsService,
    public i18n: LanguageService,
    private ngZone: NgZone
  ) {
    effect(
      () => {
        this.stats.selectedCountry();
        untracked(() => {
          this.page.set(1);
          this.events.set([]);
          this.loadEvents();
        });
      },
      { allowSignalWrites: true }
    );
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;
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

  /** Reset filters so guests can browse the full public feed again. */
  exploreEvents() {
    this.searchTerm = '';
    this.filter.set('');
    this.showCustomDatePicker.set(false);
    this.setDateRange('all');
  }

  setDateRange(range: 'all' | 'thisYear' | 'lastYear' | 'custom') {
    this.dateRange.set(range);
    if (range !== 'custom') this.showCustomDatePicker.set(false);
    const year = new Date().getFullYear();
    const lastYear = year - 1;
    if (range === 'all') {
      this.fromDate = '';
      this.toDate = '';
    } else if (range === 'thisYear') {
      // Full calendar year (not through today), so upcoming events this year still match.
      this.fromDate = `${year}-01-01`;
      this.toDate = `${year}-12-31`;
    } else if (range === 'lastYear') {
      this.fromDate = `${lastYear}-01-01`;
      this.toDate = `${lastYear}-12-31`;
    }
    this.page.set(1);
    this.events.set([]);
    this.loadEvents();
  }

  onDatePickerChange() {
    this.dateRange.set('custom');
    this.showCustomDatePicker.set(true);
    this.page.set(1);
    this.events.set([]);
    this.loadEvents();
  }

  toggleCustomDatePicker() {
    const next = !this.showCustomDatePicker();
    this.showCustomDatePicker.set(next);
    if (next) {
      this.dateRange.set('custom');
    }
  }

  clearCustomDates() {
    this.fromDate = '';
    this.toDate = '';
    this.setDateRange('all');
  }

  onCustomDateChange(value: string | null, which: 'from' | 'to') {
    const next = value || '';
    if (which === 'from') this.fromDate = next;
    else this.toDate = next;
    this.onDatePickerChange();
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

  loadEvents() {
    this.error.set(false);
    this.loading.set(true);
    const evType = this.filter() || undefined;
    const search = this.searchTerm?.trim() || undefined;
    const from = this.fromDate || undefined;
    const to = this.toDate || undefined;
    const country = this.stats.selectedCountry()?.trim() || undefined;
    this.api.getEvents(this.page(), this.pageSize, evType, search, from, to, country).subscribe({
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
        this.stats.loadFromApi();
        this.loading.set(false);
      }
    });
  }

  loadMore() {
    this.page.update((p) => p + 1);
    this.loadEvents();
  }
}

