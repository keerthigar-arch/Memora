import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventDetailDto } from '../../services/api.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslatePipe],
  template: `
    <div class="detail-page">
      @if (loading()) {
        <div class="state-block container">
          <div class="spinner"></div>
          <p>{{ 'detail.loadingMoment' | t }}</p>
        </div>
      } @else if (event()) {
        <section class="detail-hero">
          <div class="container">
            <a href="#" class="back-link" (click)="goBack($event)">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ 'nav.back' | t }}
            </a>

            <div class="hero-layout">
              <div class="hero-photo-col">
                @if (event()!.mainImageUrl) {
                  <figure class="hero-photo-card">
                    <button
                      type="button"
                      class="hero-photo-btn"
                      (click)="openLightbox(event()!.mainImageUrl!)"
                      [attr.aria-label]="('detail.viewCover' | t) + ' — ' + event()!.title"
                    >
                      <img
                        class="hero-photo-img"
                        [src]="event()!.mainImageUrl"
                        [alt]="event()!.title"
                        decoding="async"
                      />
                      <span class="hero-photo-zoom" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" stroke-linecap="round" />
                        </svg>
                      </span>
                    </button>
                  </figure>
                } @else {
                  <div class="hero-photo-card hero-photo-card--empty" aria-hidden="true"></div>
                }
              </div>

              <div class="hero-info-col">
                <span class="type-badge" [ngClass]="getEventTypeClass(event()!.eventType)">
                  {{ lang.eventTypeLabel(event()!.eventType) }}
                </span>
                <h1 class="hero-title">{{ event()!.title }}</h1>

                @if (isMemorial(event()!) && (event()!.birthDate || event()!.deathDate)) {
                  <div class="life-ribbon">
                    @if (event()!.birthDate) {
                      <span class="life-span">
                        <em>{{ 'life.born' | t }}</em>
                        {{ event()!.birthDate | date: 'longDate':undefined:lang.dateLocale() }}
                      </span>
                    }
                    @if (event()!.birthDate && event()!.deathDate) {
                      <span class="life-dot" aria-hidden="true">✦</span>
                    }
                    @if (event()!.deathDate) {
                      <span class="life-span">
                        <em>{{ 'life.passed' | t }}</em>
                        {{ event()!.deathDate | date: 'longDate':undefined:lang.dateLocale() }}
                      </span>
                    }
                  </div>
                }

                <div class="hero-meta">
                  <div class="meta-chip">
                    <span class="meta-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                      </svg>
                    </span>
                    <span class="meta-text">{{ event()!.eventDate | date: 'longDate':undefined:lang.dateLocale() }}</span>
                  </div>
                  @if (event()!.location) {
                    <div class="meta-chip">
                      <span class="meta-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
                        </svg>
                      </span>
                      <span class="meta-text">{{ event()!.location }}</span>
                    </div>
                  }
                  @if (event()!.mobileNumber) {
                    <div class="meta-chip">
                      <span class="meta-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
                        </svg>
                      </span>
                      <span class="meta-text">{{ event()!.mobileNumber }}</span>
                    </div>
                  }
                  <div class="meta-chip">
                    <span class="meta-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                      </svg>
                    </span>
                    <span class="meta-text">{{ event()!.createdBy }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div class="container body-wrap">
          <div class="body-grid">
            <main class="main-col">
              <article class="content-card story-card">
                <header class="card-head">
                  <div class="card-head-icon" aria-hidden="true">✦</div>
                  <div>
                    <h2>{{ 'detail.story' | t }}</h2>
                  </div>
                </header>
                <div class="prose">{{ event()!.description }}</div>
              </article>

              @if (galleryUrls().length || videoUrls().length) {
                <article class="content-card media-card" aria-labelledby="media-heading">
                  <header class="card-head">
                    <div class="card-head-icon card-head-icon--media" aria-hidden="true">◈</div>
                    <div>
                      <h2 id="media-heading">{{ 'detail.mediaTitle' | t }}</h2>
                      <p class="card-sub">{{ 'detail.mediaLede' | t }}</p>
                    </div>
                  </header>

                  @if (galleryUrls().length) {
                    <div class="media-block">
                      <div class="media-label-row">
                        <h3>{{ 'detail.gallery' | t }}</h3>
                        <span class="media-badge">
                          @if (galleryUrls().length === 1) {
                            {{ 'detail.photoCountOne' | t }}
                          } @else {
                            {{ 'detail.photoCount' | t:{ n: galleryUrls().length } }}
                          }
                        </span>
                      </div>
                      <div class="photo-mosaic" [attr.data-count]="galleryUrls().length">
                        @for (url of galleryUrls(); track url; let i = $index) {
                          <button
                            type="button"
                            class="mosaic-cell event-media-frame event-media-frame--thumb"
                            (click)="openLightbox(url, i)"
                            [attr.aria-label]="('detail.gallery' | t) + ' ' + (i + 1)"
                          >
                            <img class="event-media-frame__img" [src]="url" alt="" loading="lazy" decoding="async" />
                            <span class="mosaic-hover" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.35-4.35" />
                              </svg>
                            </span>
                          </button>
                        }
                      </div>
                    </div>
                  }

                  @if (videoUrls().length) {
                    <div class="media-block">
                      <div class="media-label-row">
                        <h3>{{ 'detail.videos' | t }}</h3>
                        <span class="media-badge">
                          @if (videoUrls().length === 1) {
                            {{ 'detail.videoCountOne' | t }}
                          } @else {
                            {{ 'detail.videoCount' | t:{ n: videoUrls().length } }}
                          }
                        </span>
                      </div>
                      <div class="video-list">
                        @for (url of videoUrls(); track url; let i = $index) {
                          <figure class="video-frame">
                            <div class="event-media-frame event-media-frame--video">
                              <video
                                class="event-media-frame__video"
                                controls
                                playsinline
                                preload="metadata"
                                (play)="ensureVideoAudible($event)"
                                (loadedmetadata)="ensureVideoAudible($event)"
                              >
                                <source [src]="url" [type]="guessVideoMime(url)" />
                              </video>
                            </div>
                            <figcaption>{{ 'detail.videoCaption' | t:{ n: i + 1 } }}</figcaption>
                          </figure>
                        }
                      </div>
                    </div>
                  }
                </article>
              }

              <article class="content-card wishes-card" aria-labelledby="wishes-heading">
                <header class="card-head">
                  <div class="card-head-icon card-head-icon--wishes" aria-hidden="true">♥</div>
                  <div>
                    <h2 id="wishes-heading">
                      {{ lang.wishesSectionTitle(event()!.eventType) }}
                      <span class="wish-count">{{ event()!.wishes.length }}</span>
                    </h2>
                    <p class="card-sub">{{ lang.t(wishesIntroKey(event()!.eventType)) }}</p>
                  </div>
                </header>

                <form class="wish-compose" (ngSubmit)="submitWish()">
                  <div class="compose-grid">
                    <label class="compose-field">
                      <span>{{ 'detail.wishYourName' | t }}</span>
                      <input
                        [(ngModel)]="senderName"
                        name="sender"
                        [placeholder]="lang.wishSenderPlaceholder(event()!.eventType)"
                        required
                      />
                    </label>
                    <label class="compose-field compose-field--full">
                      <span>{{ 'detail.wishYourMessage' | t }}</span>
                      <textarea
                        [(ngModel)]="wishMessage"
                        name="message"
                        rows="4"
                        [placeholder]="lang.wishMessagePlaceholder(event()!.eventType)"
                        required
                      ></textarea>
                    </label>
                  </div>
                  <div class="compose-actions">
                    <div class="compose-tools">
                      @if (wishMediaPreview()) {
                        <div class="attach-preview">
                          <img [src]="wishMediaPreview()" alt="" />
                          <button type="button" class="attach-remove" (click)="clearWishMedia()">
                            {{ 'detail.wishRemovePhoto' | t }}
                          </button>
                        </div>
                      }
                      <label class="attach-link">
                        <input type="file" accept="image/*" (change)="onWishMediaChange($event)" hidden />
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                          <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                        </svg>
                        {{ 'detail.addPhoto' | t }}
                      </label>
                    </div>
                    <button
                      type="submit"
                      class="btn btn-primary wish-send"
                      [disabled]="saving() || !senderName.trim() || !wishMessage.trim()"
                    >
                      @if (saving()) {
                        <span class="btn-spinner" aria-hidden="true"></span>
                        {{ 'detail.sending' | t }}
                      } @else {
                        {{ lang.wishSubmitLabel(event()!.eventType) }}
                      }
                    </button>
                  </div>
                </form>

                @if (event()!.wishes.length) {
                  <ul class="wish-list">
                    @for (w of event()!.wishes; track w.id) {
                      <li class="wish-item">
                        <div class="wish-avatar" aria-hidden="true">{{ wishInitials(w.senderName) }}</div>
                        <div class="wish-body">
                          <header class="wish-head">
                            <strong>{{ w.senderName }}</strong>
                            <time [attr.datetime]="w.createdAt">{{ lang.formatTimeAgo(w.createdAt) }}</time>
                          </header>
                          <p class="wish-msg">{{ w.message }}</p>
                          @if (w.mediaUrl) {
                            <button
                              type="button"
                              class="wish-photo event-media-frame event-media-frame--thumb"
                              (click)="openLightbox(w.mediaUrl!)"
                            >
                              <img class="event-media-frame__img" [src]="w.mediaUrl" alt="" loading="lazy" decoding="async" />
                            </button>
                          }
                        </div>
                      </li>
                    }
                  </ul>
                } @else {
                  <div class="wish-empty">
                    <span class="wish-empty-icon" aria-hidden="true">♥</span>
                    <p>{{ 'detail.wishEmpty' | t }}</p>
                  </div>
                }
              </article>
            </main>

            <aside class="side-col" [attr.aria-label]="'detail.atAGlance' | t">
              <div class="side-panel">
                <div class="side-panel-top">
                  <h3>{{ 'detail.atAGlance' | t }}</h3>
                </div>
                <div class="side-panel-body">
                  <ul class="info-list">
                    <li>
                      <span class="info-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                        </svg>
                      </span>
                      <div>
                        <span class="info-label">{{ 'detail.eventDate' | t }}</span>
                        <span class="info-value">{{ event()!.eventDate | date: 'longDate':undefined:lang.dateLocale() }}</span>
                      </div>
                    </li>
                    @if (event()!.location) {
                      <li>
                        <span class="info-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
                          </svg>
                        </span>
                        <div>
                          <span class="info-label">{{ 'detail.location' | t }}</span>
                          <span class="info-value">{{ event()!.location }}</span>
                        </div>
                      </li>
                    }
                    @if (event()!.mobileNumber) {
                      <li>
                        <span class="info-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" />
                          </svg>
                        </span>
                        <div>
                          <span class="info-label">{{ 'detail.mobile' | t }}</span>
                          <span class="info-value">{{ event()!.mobileNumber }}</span>
                        </div>
                      </li>
                    }
                    @if (event()!.country) {
                      <li>
                        <span class="info-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                        </span>
                        <div>
                          <span class="info-label">{{ 'myEvents.country' | t }}</span>
                          <span class="info-value">{{ event()!.country }}</span>
                        </div>
                      </li>
                    }
                    <li>
                      <span class="info-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                        </svg>
                      </span>
                      <div>
                        <span class="info-label">{{ 'detail.hostedBy' | t }}</span>
                        <span class="info-value">{{ event()!.createdBy }}</span>
                      </div>
                    </li>
                  </ul>

                  <div class="stat-row">
                    @if (galleryUrls().length) {
                      <div class="stat-box">
                        <span class="stat-num">{{ galleryUrls().length }}</span>
                        <span class="stat-label">{{ 'detail.gallery' | t }}</span>
                      </div>
                    }
                    @if (videoUrls().length) {
                      <div class="stat-box">
                        <span class="stat-num">{{ videoUrls().length }}</span>
                        <span class="stat-label">{{ 'detail.videos' | t }}</span>
                      </div>
                    }
                    <div class="stat-box stat-box--accent">
                      <span class="stat-num">{{ event()!.wishes.length }}</span>
                      <span class="stat-label">{{ lang.wishesSectionTitle(event()!.eventType) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      } @else {
        <div class="state-block container">
          <h2>{{ 'detail.notFound' | t }}</h2>
          <p>{{ 'detail.notFoundLede' | t }}</p>
          <a routerLink="/" class="btn btn-primary">{{ 'detail.backHome' | t }}</a>
        </div>
      }
    </div>

    @if (lightboxUrl()) {
      <div class="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" (click)="closeLightbox()">
        <button type="button" class="lightbox-close" (click)="closeLightbox()" aria-label="Close">×</button>
        @if (lightboxHasPrev()) {
          <button type="button" class="lightbox-nav lightbox-prev" (click)="lightboxPrev($event)" aria-label="Previous photo">‹</button>
        }
        <img [src]="lightboxUrl()!" alt="Enlarged photo" class="lightbox-img" (click)="$event.stopPropagation()" />
        @if (lightboxHasNext()) {
          <button type="button" class="lightbox-nav lightbox-next" (click)="lightboxNext($event)" aria-label="Next photo">›</button>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .detail-page {
      min-height: 100%;
      padding-bottom: 3rem;
    }

    .state-block {
      text-align: center;
      padding: 6rem 1.5rem;
      color: var(--text-muted);
    }
    .state-block h2 {
      font-family: var(--font-display);
      color: var(--text);
      margin-bottom: 0.5rem;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(26, 95, 74, 0.12);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Hero: framed photo + info side-by-side ── */
    .detail-hero {
      padding: 0.5rem 0 1.75rem;
      background:
        linear-gradient(180deg, rgba(26, 95, 74, 0.05) 0%, transparent 70%);
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 1rem;
      padding: 0.4rem 0.85rem 0.4rem 0.6rem;
      border-radius: 999px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
    }
    .back-link:hover {
      color: var(--primary);
      border-color: rgba(26, 95, 74, 0.25);
      transform: translateX(-2px);
    }
    .hero-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
      align-items: center;
    }
    .hero-photo-col {
      width: 100%;
      max-width: 520px;
      margin: 0 auto;
    }
    .hero-photo-card {
      margin: 0;
      border-radius: 16px;
      overflow: hidden;
      background: #f3f0ea;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
    }
    .hero-photo-card--empty {
      min-height: 280px;
      background:
        radial-gradient(ellipse 80% 60% at 25% 30%, rgba(212, 165, 116, 0.35) 0%, transparent 55%),
        radial-gradient(ellipse 70% 50% at 80% 70%, rgba(45, 143, 115, 0.3) 0%, transparent 50%),
        linear-gradient(155deg, #0a2e26 0%, #1a5f4a 45%, #0d3d32 100%);
    }
    .hero-photo-btn {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 280px;
      max-height: min(72vh, 620px);
      padding: 0.75rem;
      border: none;
      background: #f3f0ea;
      cursor: zoom-in;
    }
    .hero-photo-img {
      display: block;
      width: auto;
      height: auto;
      max-width: 100%;
      max-height: min(68vh, 580px);
      object-fit: contain;
      object-position: center center;
      border-radius: 8px;
    }
    .hero-photo-zoom {
      position: absolute;
      right: 1rem;
      bottom: 1rem;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      color: var(--primary-dark);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .hero-photo-btn:hover .hero-photo-zoom,
    .hero-photo-btn:focus-visible .hero-photo-zoom {
      opacity: 1;
      transform: scale(1.05);
    }
    .hero-info-col {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      text-align: center;
    }
    .type-badge {
      display: inline-block;
      align-self: center;
      margin-bottom: 0.15rem;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #fff;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    }
    .type-badge.birthday { background: linear-gradient(135deg, #6366f1, #4338ca); }
    .type-badge.puberty { background: linear-gradient(135deg, #7c3aed, #5b21b6); }
    .type-badge.wedding { background: linear-gradient(135deg, #ec4899, #9d174d); }
    .type-badge.anniversary { background: linear-gradient(135deg, #db2777, #831843); }
    .type-badge.obituary,
    .type-badge.funeral { background: linear-gradient(135deg, #64748b, #1e293b); }
    .type-badge.remembrance { background: linear-gradient(135deg, #7c6b9a, #4a3f5c); }
    .type-badge.other { background: linear-gradient(135deg, #0891b2, #155e75); }

    .hero-title {
      margin: 0;
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      font-weight: 600;
      line-height: 1.15;
      letter-spacing: -0.02em;
      color: var(--text);
      text-wrap: balance;
    }
    .life-ribbon {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.5rem 1rem;
      margin: 0.35rem 0;
      padding: 0.65rem 1rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(26, 95, 74, 0.06), rgba(212, 165, 116, 0.12));
      border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .life-span {
      font-size: 0.875rem;
      color: var(--text);
    }
    .life-span em {
      display: block;
      font-size: 0.625rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
      font-style: normal;
      margin-bottom: 0.1rem;
    }
    .life-dot {
      color: var(--accent);
      font-size: 0.75rem;
      opacity: 0.85;
    }
    .hero-meta {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    .meta-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      max-width: 100%;
    }
    .meta-icon {
      flex-shrink: 0;
      color: var(--primary);
      display: flex;
    }
    .meta-text {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text);
      line-height: 1.35;
    }

    /* ── Body layout ── */
    .body-wrap {
      padding-bottom: 1rem;
    }
    .body-grid {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: 1.5rem;
      align-items: start;
    }

    /* ── Content cards ── */
    .content-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 1.5rem 1.65rem;
      margin-bottom: 1.25rem;
      position: relative;
      overflow: hidden;
      animation: cardIn 0.5s ease both;
    }
  .content-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 50%, var(--primary-light) 100%);
    }
    @keyframes cardIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .story-card { animation-delay: 0.05s; }
    .media-card { animation-delay: 0.1s; }
    .wishes-card { animation-delay: 0.15s; }

    .card-head {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }
    .card-head-icon {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      font-size: 1.1rem;
      background: linear-gradient(135deg, rgba(26, 95, 74, 0.12), rgba(212, 165, 116, 0.2));
      color: var(--primary);
      border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .card-head-icon--media { color: #0891b2; background: linear-gradient(135deg, rgba(8, 145, 178, 0.1), rgba(212, 165, 116, 0.15)); }
    .card-head-icon--wishes { color: #db2777; background: linear-gradient(135deg, rgba(219, 39, 119, 0.1), rgba(212, 165, 116, 0.15)); }

    .card-head h2 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--text);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .card-sub {
      margin: 0.35rem 0 0;
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .wish-count {
      font-family: var(--font-body);
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      border-radius: 999px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      color: #fff;
    }

    .prose {
      font-size: 1.0625rem;
      line-height: 1.85;
      color: #3d4a47;
      white-space: pre-wrap;
    }

    /* ── Media ── */
    .media-block + .media-block {
      margin-top: 1.75rem;
      padding-top: 1.75rem;
      border-top: 1px solid var(--border);
    }
    .media-label-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .media-label-row h3 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 700;
      color: var(--text);
    }
    .media-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
      background: rgba(26, 95, 74, 0.08);
      color: var(--primary);
    }

    .photo-mosaic {
      display: grid;
      gap: 0.65rem;
      grid-template-columns: repeat(3, 1fr);
    }
    .photo-mosaic[data-count='1'] {
      grid-template-columns: 1fr;
    }
    .photo-mosaic[data-count='2'] {
      grid-template-columns: repeat(2, 1fr);
    }
    .photo-mosaic[data-count='1'] .mosaic-cell:first-child {
      aspect-ratio: 16 / 9;
    }
    .photo-mosaic[data-count='3'] .mosaic-cell:first-child {
      grid-column: span 2;
      grid-row: span 2;
    }
    .mosaic-cell {
      position: relative;
      padding: 0;
      border: none;
      border-radius: 10px;
      overflow: hidden;
      cursor: zoom-in;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .mosaic-cell:hover {
      transform: translateY(-3px) scale(1.02);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
    }
    .mosaic-hover {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(13, 61, 50, 0.45);
      color: #fff;
      opacity: 0;
      transition: opacity 0.25s ease;
    }
    .mosaic-cell:hover .mosaic-hover {
      opacity: 1;
    }

    .video-list {
      display: grid;
      gap: 1rem;
    }
    .video-frame {
      margin: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
      background: #0f1a17;
    }
    .video-frame figcaption {
      padding: 0.65rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.7);
      background: linear-gradient(180deg, #1a2e28, #0f1a17);
    }

    /* ── Wishes ── */
    .wish-compose {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      border-radius: 12px;
      background: linear-gradient(165deg, #f8f6f3 0%, #fff 50%, #f0faf6 100%);
      border: 1px solid var(--border);
    }
    .compose-grid {
      display: grid;
      gap: 1rem;
    }
    .compose-field {
      display: grid;
      gap: 0.4rem;
    }
    .compose-field span {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .compose-field input,
    .compose-field textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 0.7rem 0.85rem;
      font: inherit;
      font-size: 0.9375rem;
      background: #fff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .compose-field input:focus,
    .compose-field textarea:focus {
      outline: none;
      border-color: var(--primary-light);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .compose-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 1rem;
    }
    .compose-tools {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
    }
    .attach-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--primary);
      cursor: pointer;
      transition: color 0.15s ease;
    }
    .attach-link:hover { color: var(--primary-dark); }
    .attach-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .attach-preview img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 8px;
      border: 2px solid var(--border);
    }
    .attach-remove {
      border: none;
      background: none;
      font-size: 0.75rem;
      font-weight: 600;
      color: #dc2626;
      cursor: pointer;
      padding: 0;
    }
    .wish-send {
      min-width: 11rem;
      box-shadow: 0 4px 14px rgba(26, 95, 74, 0.25);
    }

    .wish-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.85rem;
    }
    .wish-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.85rem;
      padding: 1.1rem 1.15rem;
      border-radius: 12px;
      background: linear-gradient(135deg, #faf9f7 0%, #fff 100%);
      border: 1px solid var(--border);
      border-left: 3px solid var(--accent);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .wish-item:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
      transform: translateX(2px);
    }
    .wish-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 55%, var(--accent) 100%);
      box-shadow: 0 4px 12px rgba(26, 95, 74, 0.25);
      flex-shrink: 0;
    }
    .wish-head {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 0.35rem 0.75rem;
      margin-bottom: 0.35rem;
    }
    .wish-head strong {
      font-size: 0.9375rem;
      color: var(--text);
    }
    .wish-head time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .wish-msg {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.65;
      color: #3d4a47;
    }
    .wish-photo {
      margin-top: 0.75rem;
      padding: 0;
      border: none;
      background: transparent;
      cursor: zoom-in;
      width: min(100%, 220px);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    }
    .wish-empty {
      text-align: center;
      padding: 2.5rem 1.5rem;
      border-radius: 12px;
      background: linear-gradient(165deg, #f8f6f3, #fff);
      border: 1px dashed rgba(26, 95, 74, 0.2);
    }
    .wish-empty-icon {
      display: block;
      font-size: 2rem;
      color: var(--accent);
      margin-bottom: 0.5rem;
      opacity: 0.6;
    }
    .wish-empty p {
      margin: 0;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }

    /* ── Sidebar ── */
    .side-col {
      display: none;
    }
    .side-panel {
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      background: var(--bg-card);
    }
    .side-panel-top {
      padding: 1.25rem 1.35rem;
      background: linear-gradient(135deg, #0d3d32 0%, #1a5f4a 50%, #2d8f73 100%);
      position: relative;
    }
    .side-panel-top::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 1.35rem;
      right: 1.35rem;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }
    .side-panel-top h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 600;
      color: #fff;
    }
    .side-panel-body {
      padding: 1.15rem 1.35rem 1.35rem;
    }
    .info-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 0.85rem;
    }
    .info-list li {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .info-icon {
      flex-shrink: 0;
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      background: rgba(26, 95, 74, 0.08);
      color: var(--primary);
    }
    .info-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.15rem;
    }
    .info-value {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
      line-height: 1.4;
      word-break: break-word;
    }
    .stat-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
      gap: 0.5rem;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
    }
    .stat-box {
      text-align: center;
      padding: 0.75rem 0.5rem;
      border-radius: 10px;
      background: linear-gradient(165deg, #f8f6f3, #fff);
      border: 1px solid var(--border);
    }
    .stat-box--accent {
      background: linear-gradient(165deg, rgba(26, 95, 74, 0.1), rgba(212, 165, 116, 0.12));
      border-color: rgba(26, 95, 74, 0.15);
    }
    .stat-num {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      font-family: var(--font-display);
      color: var(--primary-dark);
      line-height: 1.2;
    }
    .stat-label {
      display: block;
      margin-top: 0.2rem;
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      line-height: 1.3;
    }

    /* ── Lightbox ── */
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: rgba(8, 16, 14, 0.94);
      backdrop-filter: blur(14px);
      animation: fadeIn 0.25s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .lightbox-img {
      max-width: min(94vw, 1200px);
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    }
    .lightbox-close {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      width: 46px;
      height: 46px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    .lightbox-close:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.05);
    }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 50px;
      height: 50px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 1.5rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .lightbox-nav:hover { background: rgba(255, 255, 255, 0.2); }
    .lightbox-prev { left: 1.25rem; }
    .lightbox-next { right: 1.25rem; }

  @media (min-width: 960px) {
      .hero-layout {
        grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
        gap: 2rem;
        align-items: center;
      }
      .hero-photo-col {
        max-width: none;
        margin: 0;
      }
      .hero-info-col {
        text-align: left;
        align-items: flex-start;
        padding: 0.5rem 0;
      }
      .type-badge {
        align-self: flex-start;
      }
      .life-ribbon {
        justify-content: flex-start;
      }
      .hero-meta {
        justify-content: flex-start;
      }
      .body-grid {
        grid-template-columns: minmax(0, 1fr) 300px;
        gap: 1.75rem;
      }
      .side-col {
        display: block;
      }
      .side-panel {
        position: sticky;
        top: 5.5rem;
      }
      .compose-grid {
        grid-template-columns: 1fr 1fr;
      }
      .compose-field--full {
        grid-column: 1 / -1;
      }
    }

    @media (min-width: 1100px) {
      .body-grid {
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 2rem;
      }
      .content-card {
        padding: 1.75rem 2rem;
      }
    }

    @media (max-width: 768px) {
      .hero-photo-btn {
        min-height: 240px;
        max-height: min(55vh, 480px);
        padding: 0.5rem;
      }
      .hero-photo-img {
        max-height: min(50vh, 440px);
      }
      .hero-title {
        font-size: 1.65rem;
      }
      .content-card {
        padding: 1.25rem 1.15rem;
      }
      .photo-mosaic {
        grid-template-columns: repeat(2, 1fr);
      }
      .photo-mosaic[data-count='3'] .mosaic-cell:first-child {
        grid-column: span 2;
        grid-row: span 1;
      }
      .wish-send {
        width: 100%;
        min-width: 0;
      }
      .compose-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .lightbox-nav { display: none; }
    }

    @media (max-width: 480px) {
      .hero-photo-card--empty {
        min-height: 220px;
      }
      .photo-mosaic {
        grid-template-columns: 1fr 1fr;
        gap: 0.45rem;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .content-card,
      .lightbox {
        animation: none;
      }
      .mosaic-cell:hover,
      .wish-item:hover {
        transform: none;
      }
    }
  `]
})
export class EventDetailComponent implements OnInit {
  event = signal<EventDetailDto | null>(null);
  loading = signal(true);
  saving = signal(false);
  senderName = '';
  wishMessage = '';
  wishMediaFile: File | null = null;
  wishMediaPreview = signal<string | null>(null);
  id = 0;

  galleryUrls = signal<string[]>([]);
  videoUrls = signal<string[]>([]);
  lightboxUrl = signal<string | null>(null);
  lightboxIndex = signal(-1);
  private fromMyEvents = false;
  private myEventsTab: 'published' | 'pending' = 'published';

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private location: Location,
    private router: Router,
    readonly lang: LanguageService
  ) {}

  ngOnInit() {
    this.fromMyEvents =
      (this.route.snapshot.queryParamMap.get('from') || '').toLowerCase() === 'my-events' ||
      (typeof document !== 'undefined' && (document.referrer || '').includes('/my-events'));
    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    this.myEventsTab = tabParam === 'pending' ? 'pending' : 'published';
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(this.id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        try {
          const urls = ev.galleryUrls ? JSON.parse(ev.galleryUrls) : [];
          this.galleryUrls.set(Array.isArray(urls) ? urls.filter(Boolean) : []);
        } catch {
          this.galleryUrls.set([]);
        }
        try {
          const vids = ev.videoUrls ? JSON.parse(ev.videoUrls) : [];
          this.videoUrls.set(Array.isArray(vids) ? vids.filter(Boolean) : []);
        } catch {
          this.videoUrls.set([]);
        }
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
  }

  goBack(event: Event): void {
    event.preventDefault();
    if (this.fromMyEvents) {
      void this.router.navigate(['/my-events'], {
        queryParams: this.myEventsTab === 'pending' ? { tab: 'pending' } : {}
      });
      return;
    }
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
  }

  isMemorial(ev: EventDetailDto): boolean {
    const t = ev.eventType?.toLowerCase();
    return t === 'obituary' || t === 'funeral' || t === 'remembrance';
  }

  wishInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? '';
      const b = parts[parts.length - 1][0] ?? '';
      return (a + b).toUpperCase();
    }
    return name.trim().slice(0, 2).toUpperCase() || '?';
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

  wishesIntroKey(eventType: string | undefined): string {
    const t = eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'wishes.introMemorial';
    return 'wishes.introCelebration';
  }

  onWishMediaChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.wishMediaFile = file;
      const reader = new FileReader();
      reader.onload = () => this.wishMediaPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  clearWishMedia(): void {
    this.wishMediaFile = null;
    this.wishMediaPreview.set(null);
  }

  submitWish() {
    if (!this.senderName.trim() || !this.wishMessage.trim()) return;
    this.saving.set(true);
    const doAdd = (mediaUrl?: string) => {
      this.api.addWish(this.id, this.senderName.trim(), this.wishMessage.trim(), mediaUrl).subscribe({
        next: (w) => {
          this.event.update((ev) => (ev ? { ...ev, wishes: [w, ...ev.wishes] } : ev));
          this.senderName = '';
          this.wishMessage = '';
          this.wishMediaFile = null;
          this.wishMediaPreview.set(null);
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    };
    if (this.wishMediaFile) {
      this.api.uploadWishMedia(this.id, this.wishMediaFile).subscribe({
        next: (res) => doAdd(res.url),
        error: () => this.saving.set(false)
      });
    } else {
      doAdd();
    }
  }

  lightboxSources(): string[] {
    const cover = this.event()?.mainImageUrl;
    const gallery = this.galleryUrls();
    const all = [...(cover ? [cover] : []), ...gallery];
    return all.filter((url, index, arr) => !!url && arr.indexOf(url) === index);
  }

  openLightbox(url: string, galleryIndex?: number): void {
    const sources = this.lightboxSources();
    let index = sources.indexOf(url);
    if (index < 0 && galleryIndex != null && this.event()?.mainImageUrl) {
      index = galleryIndex + 1;
    } else if (index < 0 && galleryIndex != null) {
      index = galleryIndex;
    }
    this.lightboxIndex.set(index >= 0 ? index : 0);
    this.lightboxUrl.set(url);
  }

  closeLightbox(): void {
    this.lightboxUrl.set(null);
    this.lightboxIndex.set(-1);
  }

  lightboxHasPrev(): boolean {
    return this.lightboxIndex() > 0;
  }

  lightboxHasNext(): boolean {
    const i = this.lightboxIndex();
    return i >= 0 && i < this.lightboxSources().length - 1;
  }

  lightboxPrev(event: Event): void {
    event.stopPropagation();
    const i = this.lightboxIndex();
    if (i <= 0) return;
    const next = i - 1;
    this.lightboxIndex.set(next);
    this.lightboxUrl.set(this.lightboxSources()[next] ?? null);
  }

  lightboxNext(event: Event): void {
    event.stopPropagation();
    const sources = this.lightboxSources();
    const i = this.lightboxIndex();
    if (i < 0 || i >= sources.length - 1) return;
    const next = i + 1;
    this.lightboxIndex.set(next);
    this.lightboxUrl.set(sources[next] ?? null);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.lightboxUrl()) this.closeLightbox();
  }

  @HostListener('document:keydown.arrowleft', ['$event'])
  onArrowLeft(event: Event): void {
    if (!this.lightboxUrl()) return;
    this.lightboxPrev(event);
  }

  @HostListener('document:keydown.arrowright', ['$event'])
  onArrowRight(event: Event): void {
    if (!this.lightboxUrl()) return;
    this.lightboxNext(event);
  }

  ensureVideoAudible(event: Event): void {
    const video = event.target as HTMLVideoElement | null;
    if (!video || video.tagName !== 'VIDEO') return;
    video.muted = false;
    video.defaultMuted = false;
    if (video.volume === 0) {
      video.volume = 1;
    }
  }

  guessVideoMime(url: string): string {
    const path = url.split('?')[0].toLowerCase();
    if (path.endsWith('.webm')) return 'video/webm';
    if (path.endsWith('.mov')) return 'video/quicktime';
    return 'video/mp4';
  }
}
