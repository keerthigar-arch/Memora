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
import { ApiService, EventListDto, RecentWishSidebarDto } from '../../services/api.service';
import { EventStatsService } from '../../services/event-stats.service';
import { environment } from '../../../environments/environment';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
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
          <button class="btn btn-primary search-action" (click)="onSearch()">{{ 'feed.browse' | t }}</button>
        </div>

        <div class="filter-toolbar panel">
          <div class="group">
            <span class="group-label">{{ 'feed.eventType' | t }}</span>
            <div class="filter-row filter-row-types">
              <button class="filter-btn" [class.active]="!filter()" (click)="setFilter('')">{{ 'feed.type.all' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Birthday'" (click)="setFilter('Birthday')">{{ 'feed.type.birthdays' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Puberty Ceremony'" (click)="setFilter('Puberty Ceremony')">{{ 'feed.type.puberty' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Wedding'" (click)="setFilter('Wedding')">{{ 'feed.type.weddings' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Anniversary'" (click)="setFilter('Anniversary')">{{ 'feed.type.anniversaries' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Obituary'" (click)="setFilter('Obituary')">{{ 'feed.type.obituaries' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Remembrance'" (click)="setFilter('Remembrance')">{{ 'feed.type.remembrance' | t }}</button>
              <button class="filter-btn" [class.active]="filter() === 'Other'" (click)="setFilter('Other')">{{ 'feed.type.others' | t }}</button>
            </div>
          </div>

          <div class="group">
            <span class="group-label">{{ 'feed.dateRange' | t }}</span>
            <div class="date-range-head">
              <div class="filter-row">
                <button class="filter-btn" [class.active]="dateRange() === 'all'" (click)="setDateRange('all')">{{ 'feed.date.allTime' | t }}</button>
                <button class="filter-btn" [class.active]="dateRange() === 'thisYear'" (click)="setDateRange('thisYear')">{{ 'feed.date.thisYear' | t }}</button>
                <button class="filter-btn" [class.active]="dateRange() === 'lastYear'" (click)="setDateRange('lastYear')">{{ 'feed.date.lastYear' | t }}</button>
                <button class="filter-btn" [class.active]="dateRange() === 'custom'" (click)="toggleCustomDatePicker()">{{ 'feed.date.custom' | t }}</button>
              </div>
            </div>
            @if (showCustomDatePicker()) {
              <div class="date-inputs custom-picker">
                <label class="date-field">
                  <span>{{ 'feed.date.from' | t }}</span>
                  <input
                    type="text"
                    class="date-input"
                    inputmode="numeric"
                    maxlength="10"
                    [placeholder]="'feed.date.placeholder' | t"
                    [(ngModel)]="fromDateDisplay"
                    name="fromDateDisplay"
                    (blur)="onCustomFromBlur()"
                    autocomplete="off"
                    [attr.aria-label]="('feed.date.from' | t) + ' ' + ('feed.date.placeholder' | t)"
                  />
                </label>
                <label class="date-field">
                  <span>{{ 'feed.date.to' | t }}</span>
                  <input
                    type="text"
                    class="date-input"
                    inputmode="numeric"
                    maxlength="10"
                    [placeholder]="'feed.date.placeholder' | t"
                    [(ngModel)]="toDateDisplay"
                    name="toDateDisplay"
                    (blur)="onCustomToBlur()"
                    autocomplete="off"
                    [attr.aria-label]="('feed.date.to' | t) + ' ' + ('feed.date.placeholder' | t)"
                  />
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
            <div class="error-state">
              <p>{{ 'feed.error' | t }}</p>
            </div>
          } @else if (loading() && events().length === 0) {
            <div class="loading"><div class="spinner"></div><p>{{ 'feed.loadingStories' | t }}</p></div>
          } @else if (events().length === 0) {
            <div class="empty-state">
              <span class="empty-icon">✦</span>
              <h3>{{ 'feed.emptyTitle' | t }}</h3>
              <p>{{ 'feed.emptyHint' | t }}</p>
              <p class="empty-hint">
                {{ 'feed.publishPrompt' | t }}
                <a [href]="env.adminPortalUrl" target="_blank" rel="noopener">{{ 'feed.organizerLink' | t }}</a>.
              </p>
            </div>
          } @else {
            <div class="event-grid">
              @for (ev of events(); track ev.id) {
                <a [routerLink]="['/event', ev.id]" class="event-card">
                  <div class="card-image" [style.background-image]="'url(' + (ev.mainImageUrl || placeholderImage) + ')'">
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
                    @if ((ev.eventType === 'Anniversary' || ev.eventType === 'Wedding') && ev.weddingDate) {
                      <p class="dates">{{
                        'feed.weddingDateLine'
                          | t:{
                              kind: i18n.eventTypeLabel(ev.eventType === 'Wedding' ? 'Wedding' : 'Anniversary'),
                              d: (ev.weddingDate | date:'mediumDate':'':i18n.dateLocale()) ?? ''
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

        <aside class="sidebar sidebar-wishes" [attr.aria-label]="'feed.sidebarAria' | t">
          <div class="sidebar-inner">
            <div class="sidebar-card sidebar-card--wishes">
            <div class="sidebar-title-block">
              <h3 class="sidebar-title" id="recent-wishes-heading">
                <span class="sidebar-title-sparkle" aria-hidden="true">✦</span>
                <span class="sidebar-title-text">{{ 'feed.recentWishes' | t }}</span>
                <span class="sidebar-title-sparkle sidebar-title-sparkle--delay" aria-hidden="true">✦</span>
              </h3>
              <div class="sidebar-title-glitter" aria-hidden="true">
                <span class="glitter g1"></span>
                <span class="glitter g2"></span>
                <span class="glitter g3"></span>
                <span class="glitter g4"></span>
                <span class="glitter g5"></span>
              </div>
              <div class="sidebar-title-underline" aria-hidden="true"></div>
            </div>
            @if (!recentWishesLoaded()) {
              <p class="sidebar-muted">{{ 'feed.sidebarLoading' | t }}</p>
            } @else if (recentWishes().length === 0) {
              <p class="sidebar-muted">{{ 'feed.noWishes' | t }}</p>
            } @else {
              <ul class="wish-list">
                @for (w of recentWishes(); track w.id) {
                  <li>
                    <a [routerLink]="['/event', w.eventId]" class="wish-item">
                      <div
                        class="wish-thumb"
                        [style.background-image]="'url(' + (w.eventImageUrl || placeholderImage) + ')'"
                        role="img"
                        [attr.aria-label]="w.eventTitle"
                      ></div>
                      <div class="wish-item-body">
                        <span class="wish-event-title">{{ w.eventTitle }}</span>
                        <span class="wish-sender">{{ w.senderName }}</span>
                        <p class="wish-snippet">{{ w.messagePreview }}</p>
                        <span class="wish-time">{{ i18n.formatTimeAgo(w.createdAt) }}</span>
                      </div>
                    </a>
                  </li>
                }
              </ul>
            }
            </div>

            <div class="sidebar-card sidebar-card--host">
              <h4 class="sidebar-host-title">{{ 'feed.shareMomentTitle' | t }}</h4>
              <p class="sidebar-host-text">{{ 'feed.shareMomentBody' | t }}</p>
              <a [href]="env.adminPortalUrl" target="_blank" rel="noopener" class="sidebar-host-btn">{{ 'feed.openOrganizer' | t }}</a>
              <a routerLink="/contact" class="sidebar-host-link">{{ 'feed.contactUs' | t }}</a>
            </div>

            <div class="sidebar-column-fill" aria-hidden="true">
              <span class="sidebar-fill-mark">✦</span>
              <p class="sidebar-fill-tagline">{{ 'feed.tagline' | t }}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>

  `,
  styles: [`
    .filters-wrap { background: linear-gradient(180deg, #f7f9fc 0%, #fcfdff 100%); border-bottom: 1px solid #e7edf6; }
    .filters {
      padding: 0.45rem 1.5rem 0.4rem;
      display: grid;
      gap: 0.4rem;
    }
    .panel {
      background: #fff;
      border: 1px solid #e2e9f3;
      border-radius: 14px;
      box-shadow: 0 5px 16px rgba(15, 23, 42, 0.04);
    }
    .search-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 0.6rem;
      padding: 0.5rem;
      align-items: center;
    }
    .search-input-wrap {
      min-height: 44px;
      border: 1px solid #d5ddea;
      border-radius: 10px;
      padding: 0 0.78rem;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      background: #fbfcff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
    }
    .search-input-wrap:focus-within {
      border-color: #1f6751;
      box-shadow: 0 0 0 4px rgba(31, 103, 81, 0.12);
      background: #fff;
    }
    .search-icon {
      color: #6b778c;
      font-size: 1rem;
      line-height: 1;
    }
    .search-input {
      min-height: 46px;
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
    .search-action { min-width: 128px; padding: 0.65rem 1rem; }
    .filter-toolbar {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.55rem;
      padding: 0.55rem;
    }
    .group {
      border: 1px solid #e8edf5;
      border-radius: 11px;
      padding: 0.52rem 0.55rem;
      background: linear-gradient(180deg, #fbfcfe 0%, #f7f9fc 100%);
    }
    .group-label {
      display: block;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #5f6c80;
      margin-bottom: 0.35rem;
    }
    .filter-row {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }
    .date-range-head {
      display: flex;
      align-items: center;
      justify-content: flex-start;
    }
    .filter-btn {
      border: 1px solid #d3dbea;
      border-radius: 999px;
      background: #fff;
      color: #334155;
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.26rem 0.62rem;
      cursor: pointer;
      transition: all 0.2s ease;
      letter-spacing: 0.01em;
    }
    .filter-btn:hover:not(.active) {
      border-color: #1f6751;
      color: #1f6751;
      background: #f7fdf9;
    }
    .filter-btn.active {
      background: #1f6751;
      color: #fff;
      border-color: #1f6751;
      box-shadow: 0 6px 12px rgba(31, 103, 81, 0.25);
    }
    .date-inputs {
      margin-top: 0.45rem;
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 0.42rem;
      align-items: end;
    }
    .custom-picker {
      padding: 0.35rem;
      border: 1px solid #e2e8f2;
      border-radius: 10px;
      background: #fbfdff;
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
    .date-input {
      min-height: 36px;
      border: 1px solid #d4ddec;
      border-radius: 10px;
      padding: 0 0.72rem;
      background: #fff;
      color: #1e293b;
    }
    .date-input:focus {
      outline: none;
      border-color: #1f6751;
      box-shadow: 0 0 0 3px rgba(31, 103, 81, 0.12);
    }
    .btn-sm-picker { min-height: 36px; padding: 0.45rem 0.75rem; font-size: 0.8rem; }

    .feed { padding: 0.7rem 0 2.2rem; }
    .feed-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
      gap: 1.25rem;
      align-items: stretch;
    }
    .sidebar-inner {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      min-height: 100%;
    }
    .sidebar-card {
      background: #fff;
      border: 1px solid #e4e9f1;
      border-radius: 14px;
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
      padding: 0.85rem 0.95rem;
    }
    .sidebar-card--wishes {
      position: sticky;
      top: 5.5rem;
      z-index: 1;
    }
    .sidebar-card--host {
      padding: 1rem 0.95rem;
    }
    .sidebar-host-title {
      margin: 0 0 0.45rem;
      font-size: 0.88rem;
      font-weight: 800;
      color: #0f2922;
      letter-spacing: 0.02em;
    }
    .sidebar-host-text {
      margin: 0 0 0.75rem;
      font-size: 0.8rem;
      line-height: 1.45;
      color: #5c6f6a;
    }
    .sidebar-host-btn {
      display: block;
      text-align: center;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%);
      box-shadow: 0 4px 12px rgba(13, 61, 50, 0.2);
      margin-bottom: 0.5rem;
    }
    .sidebar-host-btn:hover {
      filter: brightness(1.05);
    }
    .sidebar-host-link {
      display: block;
      text-align: center;
      font-size: 0.78rem;
      font-weight: 600;
      color: #1a5f4a;
    }
    .sidebar-column-fill {
      flex: 1 1 auto;
      min-height: 4rem;
      margin-top: 0.15rem;
      border-radius: 14px;
      border: 1px solid rgba(26, 95, 74, 0.12);
      background:
        linear-gradient(165deg, rgba(232, 247, 241, 0.95) 0%, rgba(255, 255, 255, 0.4) 45%, rgba(240, 250, 245, 0.6) 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 1.25rem 0.75rem;
    }
    .sidebar-fill-mark {
      font-size: 1.25rem;
      color: rgba(26, 95, 74, 0.35);
      line-height: 1;
    }
    .sidebar-fill-tagline {
      margin: 0;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(39, 77, 67, 0.55);
      text-align: center;
    }
    .sidebar-title-block {
      position: relative;
      margin: 0 0 0.75rem;
      padding: 0.4rem 0.35rem 0.55rem;
      border-radius: 12px;
      overflow: visible;
    }
    .sidebar-title-block::before {
      content: '';
      position: absolute;
      inset: -4px -2px;
      border-radius: 14px;
      background:
        radial-gradient(ellipse 120% 80% at 15% 20%, rgba(255, 214, 120, 0.22) 0%, transparent 55%),
        radial-gradient(ellipse 100% 70% at 85% 75%, rgba(63, 144, 119, 0.18) 0%, transparent 50%),
        radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.45) 0%, transparent 38%);
      pointer-events: none;
      animation: sidebarTitleGlow 5s ease-in-out infinite;
      z-index: 0;
    }
    @keyframes sidebarTitleGlow {
      0%, 100% { opacity: 0.75; filter: saturate(0.95); }
      50% { opacity: 1; filter: saturate(1.15); }
    }
    .sidebar-title {
      position: relative;
      z-index: 1;
      margin: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.35rem;
      font-family: var(--font-display, inherit);
      font-size: clamp(0.82rem, 1.5vw, 0.95rem);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      line-height: 1.25;
    }
    .sidebar-title-text {
      display: inline-block;
      background: linear-gradient(
        110deg,
        #0d3d32 0%,
        #1a5f4a 18%,
        #3d9b7a 32%,
        #e8b91a 48%,
        #3d9b7a 62%,
        #1a5f4a 78%,
        #0d3d32 100%
      );
      background-size: 220% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: sidebarTitleShimmer 4s ease-in-out infinite;
      text-shadow: 0 0 28px rgba(63, 144, 119, 0.15);
    }
    @keyframes sidebarTitleShimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .sidebar-title-sparkle {
      display: inline-block;
      font-size: 0.72em;
      color: #d4a012;
      text-shadow: 0 0 8px rgba(232, 185, 26, 0.7);
      animation: sidebarSparkle 2.2s ease-in-out infinite;
    }
    .sidebar-title-sparkle--delay {
      animation-delay: 1.1s;
    }
    @keyframes sidebarSparkle {
      0%, 100% { opacity: 0.4; transform: scale(0.88) rotate(-8deg); }
      50% { opacity: 1; transform: scale(1.12) rotate(8deg); }
    }
    .sidebar-title-glitter {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      overflow: visible;
    }
    .sidebar-title-glitter .glitter {
      position: absolute;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 0 6px 1px rgba(255, 230, 150, 0.9), 0 0 10px 2px rgba(63, 144, 119, 0.35);
      animation: glitterTwinkle 2.5s ease-in-out infinite;
    }
    .g1 { left: 8%; top: 18%; animation-delay: 0s; }
    .g2 { left: 22%; top: 8%; animation-delay: 0.4s; }
    .g3 { right: 18%; top: 22%; animation-delay: 0.8s; }
    .g4 { right: 8%; top: 10%; animation-delay: 1.2s; }
    .g5 { left: 48%; top: 4%; animation-delay: 1.6s; }
    @keyframes glitterTwinkle {
      0%, 100% { opacity: 0; transform: scale(0.3); }
      15% { opacity: 1; }
      30% { opacity: 0.35; }
      45% { opacity: 0.9; }
      60%, 100% { opacity: 0; transform: scale(1); }
    }
    .sidebar-title-underline {
      position: relative;
      z-index: 1;
      height: 3px;
      margin-top: 0.45rem;
      border-radius: 999px;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(26, 95, 74, 0.35) 15%,
        rgba(232, 185, 26, 0.65) 50%,
        rgba(26, 95, 74, 0.35) 85%,
        transparent
      );
      background-size: 180% 100%;
      animation: underlineShimmer 3.5s ease-in-out infinite;
    }
    @keyframes underlineShimmer {
      0%, 100% { background-position: 0% 0%; }
      50% { background-position: 100% 0%; }
    }
    @media (prefers-reduced-motion: reduce) {
      .sidebar-title-block::before,
      .sidebar-title-text,
      .sidebar-title-sparkle,
      .sidebar-title-glitter .glitter,
      .sidebar-title-underline {
        animation: none !important;
      }
      .sidebar-title-text {
        color: #1a5f4a;
        background: none;
        -webkit-background-clip: unset;
        background-clip: unset;
      }
      .sidebar-title-sparkle { opacity: 0.85; transform: none; }
      .sidebar-title-glitter .glitter { opacity: 0.4; }
    }
    .sidebar-muted {
      margin: 0;
      font-size: 0.82rem;
      color: #64748b;
      line-height: 1.45;
    }
    .feed-main { min-width: 0; }
    .wish-list {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .wish-list li {
      border-bottom: 1px solid #eef2f7;
    }
    .wish-list li:last-child {
      border-bottom: none;
    }
    .wish-item {
      display: flex;
      gap: 0.65rem;
      padding: 0.65rem 0.45rem;
      margin: 0 -0.45rem;
      border-radius: 11px;
      text-decoration: none;
      color: inherit;
      align-items: flex-start;
      transition: background-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }
    @media (hover: hover) {
      .wish-item:hover {
        background: linear-gradient(100deg, rgba(236, 246, 241, 0.95) 0%, rgba(248, 252, 250, 0.98) 100%);
        box-shadow: 0 4px 16px rgba(26, 95, 74, 0.09);
        transform: translateY(-1px);
      }
      .wish-item:hover .wish-thumb {
        transform: scale(1.06);
        border-color: #9fc9b8;
        box-shadow: 0 3px 10px rgba(26, 95, 74, 0.18);
      }
      .wish-item:hover .wish-event-title {
        color: #145a47;
      }
      .wish-item:hover .wish-sender {
        color: #0f4d3c;
      }
    }
    .wish-item:focus-visible {
      outline: 2px solid #1a5f4a;
      outline-offset: 2px;
      background: rgba(236, 246, 241, 0.6);
    }
    .wish-thumb {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      flex-shrink: 0;
      background-size: cover;
      background-position: center;
      background-color: #e2e8f0;
      border: 1px solid #e2e8f0;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .wish-item-body { min-width: 0; flex: 1; }
    .wish-event-title {
      font-size: 0.82rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.1rem;
      transition: color 0.2s ease;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .wish-sender {
      font-size: 0.76rem;
      font-weight: 600;
      color: var(--primary, #1a5f4a);
      transition: color 0.2s ease;
    }
    .wish-snippet {
      margin: 0.15rem 0 0.2rem;
      font-size: 0.78rem;
      color: #64748b;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .wish-time {
      font-size: 0.72rem;
      color: #94a3b8;
    }
    @media (prefers-reduced-motion: reduce) {
      .wish-item,
      .wish-thumb,
      .wish-event-title,
      .wish-sender {
        transition: none !important;
      }
      .wish-item:hover {
        transform: none !important;
      }
      .wish-item:hover .wish-thumb {
        transform: none !important;
      }
    }
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
      aspect-ratio: 16/10;
      background-size: cover;
      background-position: center;
      position: relative;
      background-color: #d7dce4;
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
      border: 1px solid #e4e8ef;
      border-radius: 16px;
      background: #fff;
      padding: 2rem 1rem;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e3e7ee;
      border-top-color: #1f6751;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 0.7rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon {
      font-size: 2rem;
      color: #c9982d;
      display: block;
      margin-bottom: 0.45rem;
    }
    .empty-hint { color: #667083; }
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

    @media (max-width: 900px) {
      .filter-toolbar { grid-template-columns: 1fr; }
    }
    @media (max-width: 1100px) {
      .feed-layout {
        grid-template-columns: 1fr;
        align-items: start;
      }
      .sidebar-inner { min-height: 0; }
      .sidebar-column-fill { display: none; }
      .sidebar-card--wishes { position: static; }
      .feed-main { order: 1; }
      .sidebar-wishes { order: 2; }
    }
    @media (max-width: 600px) {
      .search-row { grid-template-columns: 1fr; }
      .search-action { width: 100%; min-width: 0; }
      .date-inputs { grid-template-columns: 1fr; }
      .filters { padding-top: 0.4rem; }
    }
  `]
})
export class FeedComponent implements OnInit, OnDestroy {
  events = signal<EventListDto[]>([]);
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
  /** API query format yyyy-MM-dd */
  fromDate = '';
  toDate = '';
  /** Shown in custom picker as DD/MM/YYYY */
  fromDateDisplay = '';
  toDateDisplay = '';
  pageSize = 12;

  placeholderImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop';

  hasMore = computed(() => {
    const items = this.events().length;
    const tot = this.total();
    return tot > 0 && items < tot;
  });

  readonly env = environment;

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

  ngOnInit() {
    this.api.getRecentWishes(10).subscribe({
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
    this.syncDisplaysFromIso();
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
      this.syncDisplaysFromIso();
    }
  }

  clearCustomDates() {
    this.fromDate = '';
    this.toDate = '';
    this.fromDateDisplay = '';
    this.toDateDisplay = '';
    this.setDateRange('all');
  }

  private isoToDdMmYyyy(iso: string): string {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  private ddMmYyyyToIso(raw: string): string | null {
    const s = raw.trim();
    if (!s) return null;
    const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const dt = new Date(year, month - 1, day);
    if (dt.getFullYear() !== year || dt.getMonth() !== month - 1 || dt.getDate() !== day) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private syncDisplaysFromIso() {
    this.fromDateDisplay = this.isoToDdMmYyyy(this.fromDate);
    this.toDateDisplay = this.isoToDdMmYyyy(this.toDate);
  }

  onCustomFromBlur() {
    if (this.fromDateDisplay.trim() === '') {
      this.fromDate = '';
      this.onDatePickerChange();
      return;
    }
    const parsed = this.ddMmYyyyToIso(this.fromDateDisplay);
    if (parsed === null) {
      this.fromDateDisplay = this.isoToDdMmYyyy(this.fromDate);
      return;
    }
    this.fromDate = parsed;
    this.onDatePickerChange();
  }

  onCustomToBlur() {
    if (this.toDateDisplay.trim() === '') {
      this.toDate = '';
      this.onDatePickerChange();
      return;
    }
    const parsed = this.ddMmYyyyToIso(this.toDateDisplay);
    if (parsed === null) {
      this.toDateDisplay = this.isoToDdMmYyyy(this.toDate);
      return;
    }
    this.toDate = parsed;
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

