import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
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
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService, AdminEventListDto, CustomerDraftListDto } from '../../services/api.service';
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
        <div class="status-switch" role="tablist" [attr.aria-label]="'myEvents.title' | t">
          <button
            type="button"
            role="tab"
            class="status-tab"
            [class.active]="statusTab() === 'published'"
            [attr.aria-selected]="statusTab() === 'published'"
            (click)="setStatusTab('published')"
          >
            <span class="status-tab-icon published-icon" aria-hidden="true"></span>
            <span class="status-tab-label">{{ 'myEvents.tabPublished' | t }}</span>
            <span class="status-tab-count">{{ publishedCount() }}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="status-tab"
            [class.active]="statusTab() === 'pending'"
            [attr.aria-selected]="statusTab() === 'pending'"
            (click)="setStatusTab('pending')"
          >
            <span class="status-tab-icon pending-icon" aria-hidden="true"></span>
            <span class="status-tab-label">{{ 'myEvents.tabPending' | t }}</span>
            <span class="status-tab-count">{{ pendingCount() }}</span>
          </button>
          <span class="status-switch-indicator" [class.pending]="statusTab() === 'pending'"></span>
        </div>

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
          @if (error()) {
            <div class="error-state"><p>{{ 'feed.error' | t }}</p></div>
          } @else if (loading() && events().length === 0 && !hasPendingDraftCards()) {
            <div class="loading"><div class="spinner"></div><p>{{ 'myEvents.loading' | t }}</p></div>
          } @else if (isTabEmpty()) {
            <div class="empty-state">
              <span class="empty-icon">✦</span>
              @if (statusTab() === 'published') {
                <h3>{{ 'myEvents.noPublished' | t }}</h3>
              } @else {
                <h3>{{ 'myEvents.noPending' | t }}</h3>
              }
              <p>{{ 'myEvents.emptyHint' | t }}</p>
              @if (statusTab() === 'pending') {
                <a routerLink="/my-events/create" class="btn btn-primary">{{ 'myEvents.create' | t }}</a>
              }
            </div>
          } @else {
            <div class="event-grid">
              @if (statusTab() === 'pending') {
                @for (d of filteredPaymentDrafts(); track d.id) {
                  <a [routerLink]="['/my-events/payment', d.id]" class="event-card event-card--draft">
                    <div class="card-image event-card-thumb">
                      @if (d.mainImageUrl) {
                        <img class="event-card-thumb__img" [src]="d.mainImageUrl" [alt]="d.title" loading="lazy" decoding="async" />
                      }
                      <span class="event-type-badge" [ngClass]="getEventTypeClass(d.eventType)">
                        {{ lang.eventTypeLabel(d.eventType) }}
                      </span>
                      <span class="status-badge status-badge--pay">{{ 'myEvents.continuePayment' | t }}</span>
                    </div>
                    <div class="card-content">
                      <h3>{{ d.title }}</h3>
                      <div class="meta-row">
                        <span class="meta-pill">{{ d.eventDate | date:'mediumDate':'':lang.dateLocale() }}</span>
                        <span class="meta-pill">{{ formatUsd(d.amountPaid) }}</span>
                      </div>
                      <div class="card-footer">
                        <span class="author">{{ 'myEvents.drafts' | t }}</span>
                        <span class="time-ago">{{ lang.formatTimeAgo(d.createdAt) }}</span>
                      </div>
                    </div>
                  </a>
                }
                @for (d of filteredPendingDrafts(); track d.id) {
                  <div class="event-card event-card--draft event-card--static">
                    <div class="card-image event-card-thumb">
                      @if (d.mainImageUrl) {
                        <img class="event-card-thumb__img" [src]="d.mainImageUrl" [alt]="d.title" loading="lazy" decoding="async" />
                      }
                      <span class="event-type-badge" [ngClass]="getEventTypeClass(d.eventType)">
                        {{ lang.eventTypeLabel(d.eventType) }}
                      </span>
                    </div>
                    <div class="card-content">
                      <h3>{{ d.title }}</h3>
                      <div class="meta-row">
                        <span class="meta-pill">{{ d.eventDate | date:'mediumDate':'':lang.dateLocale() }}</span>
                      </div>
                      <div class="card-footer">
                        <span class="author">{{ 'myEvents.hidden' | t }}</span>
                        <span class="time-ago">{{ lang.formatTimeAgo(d.createdAt) }}</span>
                      </div>
                    </div>
                  </div>
                }
              }
              @for (ev of events(); track ev.id) {
                <a [routerLink]="['/event', ev.id]" [queryParams]="eventLinkQueryParams()" class="event-card">
                  <div class="card-image event-card-thumb">
                    @if (ev.mainImageUrl) {
                      <img class="event-card-thumb__img" [src]="ev.mainImageUrl" [alt]="ev.title" loading="lazy" decoding="async" />
                    }
                    <span class="event-type-badge" [ngClass]="getEventTypeClass(ev.eventType)">
                      {{ lang.eventTypeLabel(ev.eventType) }}
                    </span>
                    @if (statusTab() === 'pending') {
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
                    <div class="card-footer">
                      <span class="author">{{ statusTab() === 'published' ? ('myEvents.live' | t) : ('myEvents.hidden' | t) }}</span>
                      <span class="time-ago">{{ lang.formatTimeAgo(ev.createdAt) }}</span>
                    </div>
                  </div>
                </a>
              }
            </div>

            @if (loading() && (events().length > 0 || hasPendingDraftCards())) {
              <div class="feed-loading-more"><div class="spinner spinner-inline"></div><span>{{ 'feed.loadingMore' | t }}</span></div>
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
    .status-switch {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      max-width: 32rem;
      margin: 0 auto 0.55rem;
      padding: 0.35rem;
      border-radius: 999px;
      background: #eef4f1;
      border: 1px solid rgba(13, 61, 50, 0.1);
      box-shadow: inset 0 1px 2px rgba(13, 61, 50, 0.06);
    }
    .status-switch-indicator {
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
    .status-switch-indicator.pending {
      transform: translateX(calc(100% + 0.35rem));
      background: linear-gradient(135deg, #b45309 0%, #d97706 100%);
      box-shadow: 0 4px 12px rgba(180, 83, 9, 0.25);
    }
    .status-tab {
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
    .status-tab.active { color: #fff; }
    .status-tab-icon {
      width: 0.55rem;
      height: 0.55rem;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .status-tab-icon.published-icon {
      background: #0d3d32;
      box-shadow: 0 0 0 2px rgba(13, 61, 50, 0.15);
    }
    .status-tab.active .status-tab-icon.published-icon {
      background: #fff;
      box-shadow: none;
    }
    .status-tab-icon.pending-icon {
      background: #d97706;
      box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.2);
    }
    .status-tab.active .status-tab-icon.pending-icon {
      background: #fff;
      box-shadow: none;
    }
    .status-tab-count {
      min-width: 1.35rem;
      padding: 0.1rem 0.45rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      background: rgba(13, 61, 50, 0.1);
      color: inherit;
    }
    .status-tab.active .status-tab-count {
      background: rgba(255, 255, 255, 0.22);
    }
    .status-tab-label { white-space: normal; text-align: center; line-height: 1.35; }
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
    .card-image { position: relative; }
    .event-type-badge { position: absolute; left: 0.75rem; top: 0.75rem; border-radius: 999px; padding: 0.3rem 0.65rem; font-size: 0.74rem; font-weight: 700; color: #fff; background: rgba(0,0,0,0.45); }
    .event-type-badge.birthday { background: linear-gradient(135deg, #4f46e5, #3730a3); }
    .event-type-badge.puberty { background: linear-gradient(135deg, #6366f1, #4338ca); }
    .event-type-badge.wedding { background: linear-gradient(135deg, #db2777, #831843); }
    .event-type-badge.anniversary { background: linear-gradient(135deg, #db2777, #9d174d); }
    .event-type-badge.obituary { background: linear-gradient(135deg, #475569, #1f2937); }
    .event-type-badge.remembrance { background: linear-gradient(135deg, #5b577a, #3d3554); }
    .event-type-badge.other { background: linear-gradient(135deg, #0891b2, #155e75); }
    .status-badge {
      position: absolute;
      right: 0.75rem;
      top: 0.75rem;
      border-radius: 999px;
      padding: 0.25rem 0.55rem;
      font-size: 0.68rem;
      font-weight: 700;
      background: rgba(0,0,0,0.55);
      color: #fff;
      text-transform: uppercase;
    }
    .event-card--draft { border-color: rgba(26, 95, 74, 0.22); }
    .event-card--static { cursor: default; }
    .status-badge--pay { background: rgba(13, 61, 50, 0.82); }
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
    @media (max-width: 1024px) { .filter-toolbar { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      .hero-inner {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
      }
      .btn-create {
        width: 100%;
        justify-content: center;
        white-space: normal;
        text-align: center;
      }
      .search-row { grid-template-columns: 1fr; }
      .search-action { width: 100%; min-width: 0; }
      .filters { padding: 0.4rem var(--container-pad, 1rem); }
      .status-switch { max-width: none; }
    }
    @media (max-width: 480px) {
      .date-inputs { grid-template-columns: 1fr; }
      .status-tab {
        padding: 0.5rem 0.45rem;
        font-size: 0.78rem;
        gap: 0.3rem;
      }
      .filter-btn {
        font-size: 0.72rem;
        padding: 0.24rem 0.5rem;
      }
    }
  `]
})
export class MyEventsComponent implements OnInit, OnDestroy {
  events = signal<AdminEventListDto[]>([]);
  drafts = signal<CustomerDraftListDto[]>([]);
  loading = signal(false);
  error = signal(false);
  page = signal(1);
  total = signal(0);
  filter = signal('');
  dateRange = signal<'all' | 'thisYear' | 'lastYear' | 'custom'>('all');
  showCustomDatePicker = signal(false);
  statusTab = signal<'published' | 'pending'>('published');
  publishedCount = signal(0);
  pendingEventsCount = signal(0);
  searchTerm = '';
  fromDate = '';
  toDate = '';
  pageSize = 12;

  paymentDrafts = computed(() => this.drafts().filter((d) => !d.awaitingOfflineApproval));
  pendingDrafts = computed(() => this.drafts().filter((d) => d.awaitingOfflineApproval));

  pendingCount = computed(
    () => this.paymentDrafts().length + this.pendingDrafts().length + this.pendingEventsCount()
  );

  filteredPaymentDrafts = computed(() => this.filterDrafts(this.paymentDrafts()));
  filteredPendingDrafts = computed(() => this.filterDrafts(this.pendingDrafts()));

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  isTabEmpty = computed(() => {
    if (this.loading()) return false;
    if (this.statusTab() === 'published') return this.events().length === 0;
    return this.events().length === 0 && !this.hasPendingDraftCards();
  });

  readonly formatUsd = formatUsd;

  private readonly destroyRef = inject(DestroyRef);
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
    private ngZone: NgZone,
    private route: ActivatedRoute,
    private router: Router
  ) {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'pending') {
      this.statusTab.set('pending');
    }

    effect(
      () => {
        this.stats.selectedCountry();
        untracked(() => {
          this.page.set(1);
          this.events.set([]);
          this.loadTabCounts();
          this.loadEvents();
        });
      },
      { allowSignalWrites: true }
    );
  }

  ngOnInit(): void {
    this.loadDrafts();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const next: 'published' | 'pending' = params.get('tab') === 'pending' ? 'pending' : 'published';
      if (this.statusTab() === next) return;
      this.statusTab.set(next);
      this.page.set(1);
      this.events.set([]);
      this.loadEvents();
    });
  }

  eventLinkQueryParams(): Record<string, string> {
    const params: Record<string, string> = { from: 'my-events' };
    if (this.statusTab() === 'pending') params['tab'] = 'pending';
    return params;
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  setStatusTab(tab: 'published' | 'pending') {
    if (this.statusTab() === tab) return;
    this.statusTab.set(tab);
    this.page.set(1);
    this.events.set([]);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'pending' ? 'pending' : null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
    this.loadEvents();
  }

  hasPendingDraftCards(): boolean {
    return this.statusTab() === 'pending' && (this.filteredPaymentDrafts().length > 0 || this.filteredPendingDrafts().length > 0);
  }

  private filterDrafts(list: CustomerDraftListDto[]): CustomerDraftListDto[] {
    const type = this.filter();
    const term = this.searchTerm.trim().toLowerCase();
    return list.filter((d) => {
      if (type) {
        const types = type === 'Obituary' ? ['Obituary', 'Funeral'] : [type];
        if (!types.includes(d.eventType)) return false;
      }
      if (term && !d.title.toLowerCase().includes(term)) return false;
      return true;
    });
  }

  private loadDrafts() {
    this.api.getMyDrafts().subscribe({
      next: (list) => this.drafts.set(list),
      error: () => this.drafts.set([])
    });
  }

  private loadTabCounts() {
    const country = this.stats.selectedCountry()?.trim() || undefined;
    this.api.getMyEvents(1, 1, undefined, undefined, undefined, undefined, country, true).subscribe({
      next: (res) => this.publishedCount.set(res.total),
      error: () => this.publishedCount.set(0)
    });
    this.api.getMyEvents(1, 1, undefined, undefined, undefined, undefined, country, false).subscribe({
      next: (res) => this.pendingEventsCount.set(res.total),
      error: () => this.pendingEventsCount.set(0)
    });
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
    const published = this.statusTab() === 'published';
    this.api
      .getMyEvents(
        this.page(),
        this.pageSize,
        this.filter() || undefined,
        this.searchTerm?.trim() || undefined,
        this.fromDate || undefined,
        this.toDate || undefined,
        country,
        published
      )
      .subscribe({
        next: (res) => {
          const items = this.page() === 1 ? res.items : [...this.events(), ...res.items];
          this.events.set(items);
          this.total.set(res.total);
          if (published) {
            this.publishedCount.set(res.total);
          } else {
            this.pendingEventsCount.set(res.total);
          }
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
