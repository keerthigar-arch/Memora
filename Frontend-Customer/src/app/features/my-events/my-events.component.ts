import {
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  effect,
  signal,
  untracked
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, AdminEventListDto, CustomerDraftListDto, RecentWishSidebarDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LanguageService } from '../../services/language.service';
import { formatUsd, periodLabelForDays } from '../../constants/display-plans';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-my-events',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe, DatePickerComponent],
  template: `
    <section class="page-hero">
      <div class="container hero-inner">
        <div>
          <h1>{{ 'myEvents.title' | t }}</h1>
          <p class="lede">{{ 'myEvents.lede' | t }}</p>
        </div>
        <a routerLink="/my-events/create" class="btn-create">+ {{ 'myEvents.create' | t }}</a>
      </div>
    </section>

    <section class="filters-wrap">
      <div class="container filters">
        <div class="search-row panel">
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
          <button type="button" class="btn btn-primary search-action" (click)="onSearch()">{{ 'feed.browse' | t }}</button>
        </div>

        <div class="filter-toolbar panel">
          <div class="group">
            <span class="group-label">{{ 'feed.eventType' | t }}</span>
            <div class="filter-row filter-row-types">
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
            <div class="date-range-head">
              <div class="filter-row">
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'all'" (click)="setDateRange('all')">{{ 'feed.date.allTime' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'thisYear'" (click)="setDateRange('thisYear')">{{ 'feed.date.thisYear' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'lastYear'" (click)="setDateRange('lastYear')">{{ 'feed.date.lastYear' | t }}</button>
                <button type="button" class="filter-btn" [class.active]="dateRange() === 'custom'" (click)="toggleCustomDatePicker()">{{ 'feed.date.custom' | t }}</button>
              </div>
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
    </section>

    <section class="feed">
      <div class="feed-layout container">
        <div class="feed-main">
          @if (paymentDrafts().length > 0 || pendingDrafts().length > 0) {
            <div class="drafts-strip">
              @if (paymentDrafts().length > 0) {
                <div class="drafts-group">
                  <h2 class="strip-title">{{ 'myEvents.drafts' | t }}</h2>
                  <div class="drafts-row">
                    @for (d of paymentDrafts(); track d.id) {
                      <a [routerLink]="['/my-events/payment', d.id]" class="draft-chip">
                        <span class="draft-chip-title">{{ d.title }}</span>
                        <span class="draft-chip-meta">{{ lang.eventTypeLabel(d.eventType) }} · {{ formatUsd(d.amountPaid) }}</span>
                      </a>
                    }
                  </div>
                </div>
              }
              @if (pendingDrafts().length > 0) {
                <div class="drafts-group">
                  <h2 class="strip-title">{{ 'myEvents.pendingApproval' | t }}</h2>
                  <div class="drafts-row">
                    @for (d of pendingDrafts(); track d.id) {
                      <div class="draft-chip draft-chip--pending">
                        <span class="draft-chip-title">{{ d.title }}</span>
                        <span class="draft-chip-meta">{{ 'myEvents.offlineSubmitted' | t }}</span>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @if (error()) {
            <div class="error-state"><p>{{ 'feed.error' | t }}</p></div>
          } @else if (loading() && events().length === 0) {
            <div class="loading"><div class="spinner"></div><p>{{ 'myEvents.loading' | t }}</p></div>
          } @else if (isEmpty()) {
            <div class="empty-state">
              <span class="empty-icon">✦</span>
              <h3>{{ 'myEvents.noneAvailable' | t }}</h3>
              <p>{{ 'myEvents.emptyHint' | t }}</p>
              <a routerLink="/my-events/create" class="btn btn-primary">{{ 'myEvents.create' | t }}</a>
            </div>
          } @else if (events().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">✦</span>
              <h3>{{ 'myEvents.noPublished' | t }}</h3>
              <p>{{ 'feed.emptyHint' | t }}</p>
            </div>
          } @else {
            <div class="event-grid">
              @for (ev of events(); track ev.id) {
                <a [routerLink]="['/event', ev.id]" [queryParams]="{ from: 'my-events' }" class="event-card">
                  <div class="card-image" [class.has-image]="!!ev.mainImageUrl" [style.background-image]="ev.mainImageUrl ? 'url(' + ev.mainImageUrl + ')' : null">
                    <span class="event-type-badge" [ngClass]="getEventTypeClass(ev.eventType)">
                      {{ lang.eventTypeLabel(ev.eventType) }}
                    </span>
                    @if (!ev.isPublished) {
                      <span class="status-badge">{{ 'myEvents.hidden' | t }}</span>
                    }
                  </div>
                  <div class="card-content">
                    <h3>{{ ev.title }}</h3>
                    <p>{{ ev.description }}</p>
                    <div class="meta-row">
                      <span class="meta-pill">{{ ev.eventDate | date:'mediumDate':'':lang.dateLocale() }}</span>
                      <span class="meta-pill">💝 {{ 'feed.wishesCount' | t:{ n: ev.wishCount } }}</span>
                    </div>
                    @if ((ev.eventType === 'Obituary' || ev.eventType === 'Funeral' || ev.eventType === 'Remembrance') && ev.birthDate && ev.deathDate) {
                      <p class="dates">{{ 'feed.bornPassed' | t:{ born: (ev.birthDate | date:'mediumDate':'':lang.dateLocale()) ?? '', passed: (ev.deathDate | date:'mediumDate':'':lang.dateLocale()) ?? '' } }}</p>
                    }
                    @if ((ev.eventType === 'Anniversary' || ev.eventType === 'Wedding') && ev.weddingDate) {
                      <p class="dates">{{ 'feed.weddingDateLine' | t:{ kind: lang.eventTypeLabel(ev.eventType === 'Wedding' ? 'Wedding' : 'Anniversary'), d: (ev.weddingDate | date:'mediumDate':'':lang.dateLocale()) ?? '' } }}</p>
                    }
                    <div class="card-footer">
                      <span class="author">{{ ev.isPublished ? ('myEvents.live' | t) : ('myEvents.hidden' | t) }}</span>
                      <span class="time-ago">{{ lang.formatTimeAgo(ev.createdAt) }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>

            @if (loading() && events().length > 0) {
              <div class="feed-loading-more"><div class="spinner spinner-inline"></div><span>{{ 'feed.loadingMore' | t }}</span></div>
            }
            @if (hasMore()) {
              <div class="feed-scroll-sentinel" #feedScrollSentinel aria-hidden="true"></div>
            }
          }
        </div>

        <aside class="sidebar sidebar-wishes" [attr.aria-label]="'myEvents.sidebarAria' | t">
          <div class="sidebar-inner">
            <div class="sidebar-card sidebar-card--wishes">
              <div class="sidebar-title-block">
                <h3 class="sidebar-title" id="my-wishes-heading">
                  <span class="sidebar-title-sparkle" aria-hidden="true">✦</span>
                  <span class="sidebar-title-text">{{ 'myEvents.recentWishes' | t }}</span>
                  <span class="sidebar-title-sparkle sidebar-title-sparkle--delay" aria-hidden="true">✦</span>
                </h3>
                <div class="sidebar-title-underline" aria-hidden="true"></div>
              </div>
                @if (!recentWishesLoaded()) {
                  <div class="sidebar-loading">
                    <div class="spinner spinner-inline"></div>
                    <p class="sidebar-muted">{{ 'feed.sidebarLoading' | t }}</p>
                  </div>
                } @else if (recentWishes().length === 0) {
                <p class="sidebar-muted">{{ 'myEvents.noWishes' | t }}</p>
              } @else {
                <ul class="wish-list">
                  @for (w of recentWishes(); track w.id) {
                    <li>
                      <a [routerLink]="['/event', w.eventId]" class="wish-item">
                        <div class="wish-thumb" [class.has-image]="!!w.eventImageUrl" [style.background-image]="w.eventImageUrl ? 'url(' + w.eventImageUrl + ')' : null" role="img" [attr.aria-label]="w.eventTitle"></div>
                        <div class="wish-item-body">
                          <span class="wish-event-title">{{ w.eventTitle }}</span>
                          <span class="wish-sender">{{ w.senderName }}</span>
                          <p class="wish-snippet">{{ w.messagePreview }}</p>
                          <span class="wish-time">{{ lang.formatTimeAgo(w.createdAt) }}</span>
                        </div>
                      </a>
                    </li>
                  }
                </ul>
              }
            </div>

            <div class="sidebar-card sidebar-card--host">
              <h4 class="sidebar-host-title">{{ 'myEvents.createAnother' | t }}</h4>
              <p class="sidebar-host-text">{{ 'myEvents.createAnotherBody' | t }}</p>
              <a routerLink="/my-events/create" class="sidebar-host-btn">{{ 'myEvents.create' | t }}</a>
            </div>
          </div>
        </aside>
      </div>
    </section>
  `,
  styles: [`
    .page-hero {
      background: linear-gradient(135deg, #0d3d32 0%, #2f7e66 100%);
      color: #fff;
      padding: 1.15rem 0;
    }
    .hero-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .page-hero h1 { margin: 0 0 0.25rem; font-family: var(--font-display); font-size: 1.35rem; }
    .lede { margin: 0; opacity: 0.92; font-size: 0.86rem; max-width: 48ch; }
    .btn-create {
      display: inline-flex;
      padding: 0.55rem 1.1rem;
      border-radius: 999px;
      background: #fff;
      color: #0d3d32;
      font-weight: 700;
      text-decoration: none;
      white-space: nowrap;
    }
    .filters-wrap { background: linear-gradient(180deg, #f7f9fc 0%, #fcfdff 100%); border-bottom: 1px solid #e7edf6; }
    .filters { padding: 0.45rem 1.5rem 0.4rem; display: grid; gap: 0.4rem; }
    .panel { background: #fff; border: 1px solid #e2e9f3; border-radius: 14px; box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04); }
    .search-row { display: grid; grid-template-columns: 1fr auto; gap: 0.6rem; padding: 0.5rem; align-items: center; }
    .search-input-wrap { min-height: 44px; border: 1px solid #d5ddea; border-radius: 10px; padding: 0 0.78rem; display: flex; align-items: center; gap: 0.55rem; background: #fbfcff; }
    .search-input-wrap:focus-within { border-color: #1f6751; box-shadow: 0 0 0 4px rgba(31, 103, 81, 0.12); background: #fff; }
    .search-icon { color: #6b778c; }
    .search-input { min-height: 46px; border: none; padding: 0; font-size: 0.95rem; background: transparent; width: 100%; color: #0f172a; }
    .search-input:focus { outline: none; }
    .search-action { min-width: 128px; padding: 0.65rem 1rem; }
    .filter-toolbar { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; padding: 0.55rem; }
    .group { border: 1px solid #e8edf5; border-radius: 11px; padding: 0.52rem 0.55rem; background: linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%); }
    .group-label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #5f6c80; margin-bottom: 0.35rem; }
    .filter-row { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .filter-btn { border: 1px solid #d3dbea; border-radius: 999px; background: #fff; color: #334155; font-size: 0.8rem; font-weight: 600; padding: 0.26rem 0.62rem; cursor: pointer; }
    .filter-btn.active { background: #1f6751; color: #fff; border-color: #1f6751; box-shadow: 0 6px 12px rgba(31, 103, 81, 0.25); }
    .date-inputs { margin-top: 0.45rem; display: grid; grid-template-columns: 1fr 1fr auto; gap: 0.42rem; align-items: end; }
    .custom-picker { padding: 0.35rem; border: 1px solid #e2e8f2; border-radius: 10px; background: #fbfdff; }
    .date-field { display: grid; gap: 0.2rem; font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; }
    .date-input { min-height: 36px; border: 1px solid #d4ddec; border-radius: 10px; padding: 0 0.72rem; background: #fff; }
    .btn-sm-picker { min-height: 36px; padding: 0.45rem 0.75rem; font-size: 0.8rem; }
    .feed { padding: 0.7rem 0 2.2rem; }
    .feed-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(240px, 280px); gap: 1.25rem; align-items: start; }
    .feed-main { min-width: 0; }
    .drafts-strip { margin-bottom: 1rem; display: grid; gap: 0.75rem; }
    .strip-title { margin: 0 0 0.45rem; font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6f68; }
    .drafts-row { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .draft-chip { display: block; padding: 0.55rem 0.75rem; border-radius: 12px; border: 1px solid rgba(26, 95, 74, 0.15); background: #f8fcfa; text-decoration: none; color: inherit; min-width: 10rem; }
    .draft-chip--pending { border-color: rgba(180, 120, 40, 0.35); background: #fffdf8; }
    .draft-chip-title { display: block; font-size: 0.86rem; font-weight: 700; color: #0f2922; }
    .draft-chip-meta { display: block; font-size: 0.72rem; color: #5a6f68; margin-top: 0.15rem; }
    .event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.15rem; }
    .event-card { display: block; text-decoration: none; color: inherit; border: 1px solid #e4e8ef; border-radius: 16px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px rgba(16, 24, 40, 0.05); transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .event-card:hover { transform: translateY(-4px); box-shadow: 0 14px 30px rgba(16, 24, 40, 0.09); }
    .card-image { aspect-ratio: 16/10; background-size: cover; background-position: center; position: relative; background-color: #d7e3de; background-image: linear-gradient(135deg, #d7e3de 0%, #b9cdc5 100%); }
    .event-type-badge { position: absolute; left: 0.75rem; top: 0.75rem; border-radius: 999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; color: #fff; background: rgba(0,0,0,0.45); }
    .event-type-badge.birthday { background: linear-gradient(135deg, #4f46e5, #3730a3); }
    .event-type-badge.puberty { background: linear-gradient(135deg, #6366f1, #4338ca); }
    .event-type-badge.wedding { background: linear-gradient(135deg, #db2777, #831843); }
    .event-type-badge.anniversary { background: linear-gradient(135deg, #db2777, #9d174d); }
    .event-type-badge.obituary { background: linear-gradient(135deg, #475569, #1f2937); }
    .event-type-badge.remembrance { background: linear-gradient(135deg, #5b577a, #3d3554); }
    .event-type-badge.other { background: linear-gradient(135deg, #0891b2, #155e75); }
    .status-badge { position: absolute; right: 0.75rem; top: 0.75rem; border-radius: 999px; padding: 0.25rem 0.55rem; font-size: 0.68rem; font-weight: 700; background: rgba(0,0,0,0.55); color: #fff; text-transform: uppercase; }
    .card-content { padding: 0.95rem; }
    .card-content h3 { margin: 0; font-size: 1.03rem; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .card-content p { margin: 0.55rem 0 0.65rem; color: #5f6b7f; font-size: 0.88rem; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .meta-pill { border: 1px solid #e2e7ef; border-radius: 999px; background: #f8fafc; color: #445166; padding: 0.2rem 0.55rem; font-size: 0.75rem; font-weight: 500; }
    .dates { margin: 0.55rem 0 0; color: #6a7586; font-size: 0.78rem; }
    .card-footer { margin-top: 0.7rem; padding-top: 0.45rem; display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.78rem; color: #647084; }
    .author { font-weight: 600; }
    .loading, .error-state, .empty-state { text-align: center; border: 1px solid #e4e8ef; border-radius: 16px; background: #fff; padding: 2rem 1rem; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e3e7ee; border-top-color: #1f6751; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 0.7rem; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 2rem; color: #c9982d; display: block; margin-bottom: 0.45rem; }
    .feed-loading-more { display: flex; align-items: center; justify-content: center; gap: 0.65rem; margin-top: 1.35rem; color: #647084; font-size: 0.875rem; }
    .spinner-inline { width: 22px; height: 22px; border-width: 3px; margin: 0; }
    .feed-scroll-sentinel { height: 1px; width: 100%; margin-top: 0.5rem; opacity: 0; pointer-events: none; }
    .sidebar-inner { display: flex; flex-direction: column; gap: 1rem; }
    .sidebar-card { background: #fff; border: 1px solid #e4e9f1; border-radius: 14px; box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04); padding: 0.85rem 0.95rem; }
    .sidebar-card--wishes { position: sticky; top: 5.5rem; }
    .sidebar-title-block { margin: 0 0 0.75rem; padding: 0.4rem 0.35rem 0.55rem; }
    .sidebar-title { margin: 0; display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.88rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; }
    .sidebar-title-text { color: #1a5f4a; }
    .sidebar-title-sparkle { color: #d4a012; font-size: 0.72em; }
    .sidebar-title-underline { height: 3px; margin-top: 0.45rem; border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(26, 95, 74, 0.35) 15%, rgba(232, 185, 26, 0.65) 50%, rgba(26, 95, 74, 0.35) 85%, transparent); }
    .sidebar-muted { margin: 0; font-size: 0.82rem; color: #64748b; line-height: 1.45; }
    .sidebar-loading { display: flex; align-items: center; gap: 0.55rem; }
    .wish-list { list-style: none; margin: 0; padding: 0; }
    .wish-list li { border-bottom: 1px solid #eef2f7; }
    .wish-list li:last-child { border-bottom: none; }
    .wish-item { display: flex; gap: 0.65rem; padding: 0.65rem 0.45rem; margin: 0 -0.45rem; border-radius: 11px; text-decoration: none; color: inherit; align-items: flex-start; transition: background-color 0.2s ease; }
    .wish-item:hover { background: rgba(236, 246, 241, 0.95); }
    .wish-thumb { width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0; background-size: cover; background-position: center; background-color: #d7e3de; background-image: linear-gradient(135deg, #d7e3de 0%, #b9cdc5 100%); border: 1px solid #e2e8f0; }
    .wish-item-body { min-width: 0; flex: 1; }
    .wish-event-title { font-size: 0.82rem; font-weight: 700; color: #0f172a; display: block; margin-bottom: 0.1rem; }
    .wish-sender { font-size: 0.76rem; font-weight: 600; color: var(--primary, #1a5f4a); }
    .wish-snippet { margin: 0.15rem 0 0.2rem; font-size: 0.78rem; color: #64748b; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .wish-time { font-size: 0.72rem; color: #94a3b8; }
    .sidebar-host-title { margin: 0 0 0.45rem; font-size: 0.88rem; font-weight: 800; color: #0f2922; }
    .sidebar-host-text { margin: 0 0 0.75rem; font-size: 0.8rem; line-height: 1.45; color: #5c6f6a; }
    .sidebar-host-btn { display: block; text-align: center; padding: 0.5rem 0.75rem; border-radius: 10px; font-size: 0.8rem; font-weight: 700; color: #fff; text-decoration: none; background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%); }
    @media (max-width: 1100px) {
      .feed-layout { grid-template-columns: 1fr; }
      .sidebar-card--wishes { position: static; }
      .feed-main { order: 1; }
      .sidebar-wishes { order: 2; }
    }
    @media (max-width: 900px) { .filter-toolbar { grid-template-columns: 1fr; } }
    @media (max-width: 600px) {
      .search-row { grid-template-columns: 1fr; }
      .search-action { width: 100%; min-width: 0; }
      .date-inputs { grid-template-columns: 1fr; }
    }
  `]
})
export class MyEventsComponent implements OnInit, OnDestroy {
  events = signal<AdminEventListDto[]>([]);
  drafts = signal<CustomerDraftListDto[]>([]);
  recentWishes = signal<RecentWishSidebarDto[]>([]);
  recentWishesLoaded = signal(false);
  loading = signal(false);
  error = signal(false);
  page = signal(1);
  total = signal(0);
  filter = signal('');
  dateRange = signal<'all' | 'thisYear' | 'lastYear' | 'custom'>('all');
  showCustomDatePicker = signal(false);
  searchTerm = '';
  fromDate = '';
  toDate = '';
  pageSize = 12;

  paymentDrafts = computed(() => this.drafts().filter((d) => !d.awaitingOfflineApproval));
  pendingDrafts = computed(() => this.drafts().filter((d) => d.awaitingOfflineApproval));

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  isEmpty = computed(
    () =>
      !this.loading() &&
      this.events().length === 0 &&
      this.paymentDrafts().length === 0 &&
      this.pendingDrafts().length === 0
  );

  readonly formatUsd = formatUsd;

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
    readonly lang: LanguageService,
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

  ngOnInit(): void {
    this.api.getMyDrafts().subscribe({
      next: (list) => this.drafts.set(list),
      error: () => this.drafts.set([])
    });
    this.api.getMyRecentWishes(10).subscribe({
      next: (w) => {
        this.recentWishes.set(w ?? []);
        this.recentWishesLoaded.set(true);
      },
      error: () => {
        this.recentWishes.set([]);
        this.recentWishesLoaded.set(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
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
    if (range !== 'custom') this.showCustomDatePicker.set(false);
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

  onDatePickerChange() {
    this.dateRange.set('custom');
    this.showCustomDatePicker.set(true);
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

  loadEvents() {
    this.error.set(false);
    this.loading.set(true);
    const country = this.stats.selectedCountry()?.trim() || undefined;
    this.api
      .getMyEvents(
        this.page(),
        this.pageSize,
        this.filter() || undefined,
        this.searchTerm?.trim() || undefined,
        this.fromDate || undefined,
        this.toDate || undefined,
        country
      )
      .subscribe({
        next: (res) => {
          const items = this.page() === 1 ? res.items : [...this.events(), ...res.items];
          this.events.set(items);
          this.total.set(res.total);
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
}
