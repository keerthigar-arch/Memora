import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventListDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <section class="hero">
      <div class="container">
        <h1>Life Events Memory Keeper</h1>
        <p class="hero-sub">Record, preserve, and share memories — birthdays, anniversaries, and obituaries.</p>
      </div>
    </section>

    <section class="filters container">
      <div class="search-row">
        <input type="text" class="search-input" placeholder="Search events..." [(ngModel)]="searchTerm" (keyup.enter)="onSearch()" />
        <button class="btn btn-primary" (click)="onSearch()">Search</button>
      </div>
      <div class="filter-toolbar">
        <div class="filter-row filter-row-types">
          <button class="filter-btn" [class.active]="!filter()" (click)="setFilter('')">All</button>
          <button class="filter-btn" [class.active]="filter() === 'Birthday'" (click)="setFilter('Birthday')">Birthdays</button>
          <button class="filter-btn" [class.active]="filter() === 'Anniversary'" (click)="setFilter('Anniversary')">Anniversaries</button>
          <button class="filter-btn" [class.active]="filter() === 'Obituary'" (click)="setFilter('Obituary')">Obituaries</button>
        </div>
        <div class="filter-row filter-row-dates">
          <button class="filter-btn" [class.active]="dateRange() === 'all'" (click)="setDateRange('all')">All time</button>
          <button class="filter-btn" [class.active]="dateRange() === 'thisYear'" (click)="setDateRange('thisYear')">This year</button>
          <button class="filter-btn" [class.active]="dateRange() === 'lastYear'" (click)="setDateRange('lastYear')">Last year</button>
          <div class="date-inputs">
            <input type="date" [(ngModel)]="fromDate" name="fromDate" class="date-input" (change)="onDatePickerChange()" />
            <input type="date" [(ngModel)]="toDate" name="toDate" class="date-input" (change)="onDatePickerChange()" />
          </div>
        </div>
      </div>
    </section>

    <section class="feed container">
      @if (error()) {
        <div class="error-state">
          <p>Unable to load events. Make sure the API is running.</p>
        </div>
      } @else if (loading() && events().length === 0) {
        <div class="loading"><div class="spinner"></div><p>Loading events...</p></div>
      } @else if (events().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">✦</span>
          <h3>No events yet</h3>
          <p>Be the first to share a life event.</p>
          @if (auth.isAdmin()) {
            <a routerLink="/admin/create-event" class="btn btn-primary">Create Event</a>
          } @else {
            <p class="empty-hint">Public events will appear here. Organizers sign in via the admin portal.</p>
          }
        </div>
      } @else {
        <div class="event-grid">
          @for (ev of events(); track ev.id) {
            <a [routerLink]="['/event', ev.id]" class="event-card card">
              <div class="card-image" [style.background-image]="'url(' + (ev.mainImageUrl || placeholderImage) + ')'"></div>
              <div class="card-content">
                <span class="event-type-badge" [ngClass]="getEventTypeClass(ev.eventType)">{{ getEventTypeLabel(ev.eventType) }}</span>
                <h3>{{ ev.title }}</h3>
                <p>{{ ev.description }}</p>
                <div class="card-meta">
                  <div class="meta-left">
                    <span>{{ ev.createdBy }}</span>
                    <span class="time-ago" [title]="ev.createdAt | date:'medium'">• {{ getTimeAgo(ev.createdAt) }}</span>
                  </div>
                  <span>{{ ev.eventDate | date:'mediumDate' }}</span>
                  @if ((ev.eventType === 'Obituary' || ev.eventType === 'Funeral') && ev.birthDate && ev.deathDate) {
                    <span class="dates">Born: {{ ev.birthDate | date:'mediumDate' }} – Passed: {{ ev.deathDate | date:'mediumDate' }}</span>
                  }
                  @if ((ev.eventType === 'Anniversary' || ev.eventType === 'Wedding') && ev.weddingDate) {
                    <span class="dates">Wedding: {{ ev.weddingDate | date:'mediumDate' }}</span>
                  }
                  <span>💝 {{ ev.wishCount }} wishes</span>
                </div>
              </div>
            </a>
          }
        </div>
        @if (hasMore()) {
          <div class="load-more">
            <button class="btn btn-outline" (click)="loadMore()" [disabled]="loading()">Load more</button>
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%);
      color: white;
      padding: 4rem 1.5rem;
      text-align: center;
    }
    .hero h1 { color: white; margin-bottom: 0.5rem; }
    .hero-sub { opacity: 0.9; font-size: 1.15rem; max-width: 600px; margin: 0 auto; }

    .filters {
      padding: 1.5rem 1.5rem 0;
      text-align: left;
    }
    .search-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1rem;
      justify-content: center;
    }
    .search-input {
      flex: 1;
      max-width: 400px;
      padding: 0.6rem 1rem;
      border: 2px solid var(--border);
      border-radius: var(--radius);
      font-size: 0.95rem;
    }
    .filter-toolbar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }
    .filter-row-types {
      justify-content: flex-start;
    }
    .filter-row-dates {
      justify-content: flex-end;
    }
    .filter-row-dates .date-inputs {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .filter-row-dates .date-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      font-size: 0.875rem;
      font-family: var(--font-body);
      background: white;
    }
    .filter-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      justify-content: flex-start;
    }
    .filter-btn {
      padding: 0.5rem 1rem;
      font-family: var(--font-body);
      font-size: 0.95rem;
      font-weight: 500;
      border: 2px solid var(--border);
      background: white;
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.2s ease;
      &.active {
        background: var(--primary);
        color: white;
        border-color: var(--primary);
      }
      &:hover:not(.active) {
        border-color: var(--primary);
        color: var(--primary);
      }
    }

    .feed { padding: 2rem 1.5rem; }

    .event-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .event-card {
      text-decoration: none;
      color: inherit;
      display: block;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-hover);
      }
    }
    .card-image {
      aspect-ratio: 16/10;
      background-size: cover;
      background-position: center;
      background-color: var(--border);
    }
    .card-content {
      padding: 1.25rem;
    }
    .card-content h3 {
      font-size: 1.25rem;
      margin: 0.5rem 0 0.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-content p {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin: 0 0 0.75rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .meta-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .time-ago {
      font-style: italic;
      color: var(--text-muted);
    }

    .loading, .error-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 3rem; color: var(--accent); display: block; margin-bottom: 0.5rem; }
    .empty-state h3 { margin-bottom: 0.25rem; }
    .empty-state p { color: var(--text-muted); margin-bottom: 1rem; }
    .empty-hint { font-size: 0.95rem; max-width: 360px; margin-left: auto; margin-right: auto; }
    .load-more { text-align: center; padding: 2rem 0; }
  `]
})
export class FeedComponent implements OnInit {
  events = signal<EventListDto[]>([]);
  loading = signal(false);
  error = signal(false);
  page = signal(1);
  total = signal(0);
  filter = signal('');
  dateRange = signal<'all' | 'thisYear' | 'lastYear' | 'custom'>('all');
  searchTerm = '';
  fromDate = '';
  toDate = '';
  pageSize = 12;

  placeholderImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop';

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  constructor(private api: ApiService, private stats: EventStatsService, public auth: AuthService) {}

  ngOnInit() {
    this.loadEvents();
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

  setDateRange(range: 'all' | 'thisYear' | 'lastYear' | 'custom') {
    this.dateRange.set(range);
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const lastYear = year - 1;
    if (range === 'all') {
      this.fromDate = '';
      this.toDate = '';
    } else if (range === 'thisYear') {
      this.fromDate = `${year}-01-01`;
      this.toDate = todayStr;
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
    this.page.set(1);
    this.events.set([]);
    this.loadEvents();
  }

  getEventTypeClass(type: string): string {
    const t = type.toLowerCase();
    if (t === 'obituary' || t === 'funeral') return 'obituary';
    if (t === 'anniversary' || t === 'wedding') return 'anniversary';
    return 'birthday';
  }

  getEventTypeLabel(type: string): string {
    if (type === 'Wedding') return 'Anniversary';
    if (type === 'Funeral') return 'Obituary';
    return type;
  }

  getTimeAgo(createdAt: string | Date): string {
    if (!createdAt) return '';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'min' : 'mins'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hr' : 'hrs'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${diffInYears === 1 ? 'year' : 'years'} ago`;
  }

  loadEvents() {
    this.error.set(false);
    this.loading.set(true);
    const evType = this.filter() || undefined;
    const search = this.searchTerm?.trim() || undefined;
    const from = this.fromDate || undefined;
    const to = this.toDate || undefined;
    this.api.getEvents(this.page(), this.pageSize, evType, search, from, to).subscribe({
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
    this.page.update(p => p + 1);
    this.loadEvents();
  }
}