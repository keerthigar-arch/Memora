import { Component, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventDetailDto } from '../../services/api.service';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="detail-page">
      @if (loading()) {
        <div class="state-block">
          <div class="spinner"></div>
          <p>Loading this moment…</p>
        </div>
      } @else if (event()) {
        <header class="hero" [class.hero-has-image]="!!event()!.mainImageUrl">
          @if (event()!.mainImageUrl) {
            <div
              class="hero-media"
              [style.background-image]="'url(' + event()!.mainImageUrl + ')'"
              role="img"
              [attr.aria-label]="event()!.title"
            ></div>
            <div class="hero-scrim" aria-hidden="true"></div>
          } @else {
            <div class="hero-fallback" aria-hidden="true"></div>
          }

          <div class="container hero-content">
            <a href="#" class="back-link" (click)="goBack($event)">{{ backLabel() }}</a>
            <span class="event-type-badge" [ngClass]="getEventTypeClass(event()!.eventType)">
              {{ getEventTypeLabel(event()!.eventType) }}
            </span>
            <h1>{{ event()!.title }}</h1>
            <p class="hero-meta">
              <span>{{ event()!.createdBy }}</span>
              <span class="dot" aria-hidden="true">·</span>
              <span>{{ event()!.eventDate | date: 'longDate' }}</span>
              @if (event()!.location) {
                <span class="dot" aria-hidden="true">·</span>
                <span>{{ event()!.location }}</span>
              }
            </p>
            @if (event()!.mainImageUrl) {
              <button type="button" class="view-cover-btn" (click)="openLightbox(event()!.mainImageUrl!)">
                View cover photo
              </button>
            }
          </div>
        </header>

        <div class="container detail-shell">
          <article class="story-panel">
            @if (
              (event()!.eventType === 'Obituary' ||
                event()!.eventType === 'Funeral' ||
                event()!.eventType === 'Remembrance') &&
              (event()!.birthDate || event()!.deathDate)
            ) {
              <div class="life-dates">
                @if (event()!.birthDate) {
                  <div class="life-date">
                    <span class="life-label">Born</span>
                    <span class="life-value">{{ event()!.birthDate | date: 'longDate' }}</span>
                  </div>
                }
                @if (event()!.birthDate && event()!.deathDate) {
                  <span class="life-rule" aria-hidden="true"></span>
                }
                @if (event()!.deathDate) {
                  <div class="life-date">
                    <span class="life-label">Passed</span>
                    <span class="life-value">{{ event()!.deathDate | date: 'longDate' }}</span>
                  </div>
                }
              </div>
            }
            @if ((event()!.eventType === 'Anniversary' || event()!.eventType === 'Wedding') && event()!.weddingDate) {
              <div class="life-dates">
                <div class="life-date">
                  <span class="life-label">{{ event()!.eventType === 'Wedding' ? 'Wedding' : 'Anniversary' }}</span>
                  <span class="life-value">{{ event()!.weddingDate | date: 'longDate' }}</span>
                </div>
              </div>
            }

            <h2 class="section-title">The story</h2>
            <p class="description">{{ event()!.description }}</p>
          </article>

          @if (event()!.mainImageUrl || galleryUrls().length || videoUrls().length) {
            <section class="media-panel" aria-labelledby="media-heading">
              <div class="section-head">
                <h2 id="media-heading" class="section-title">Photos &amp; videos</h2>
                <p class="section-lede">Every image and video shared with this event.</p>
              </div>

              @if (event()!.mainImageUrl) {
                <div class="featured-block">
                  <p class="media-kicker">Cover</p>
                  <button
                    type="button"
                    class="featured-cover"
                    (click)="openLightbox(event()!.mainImageUrl!)"
                    [attr.aria-label]="'Open cover photo for ' + event()!.title"
                  >
                    <img [src]="event()!.mainImageUrl" [alt]="event()!.title" />
                    <span class="featured-hint">Click to enlarge</span>
                  </button>
                </div>
              }

              @if (galleryUrls().length) {
                <div class="gallery-block">
                  <div class="media-row-head">
                    <p class="media-kicker">Gallery</p>
                    <span class="media-count">{{ galleryUrls().length }} photo{{ galleryUrls().length === 1 ? '' : 's' }}</span>
                  </div>
                  <div class="gallery-grid">
                    @for (url of galleryUrls(); track url; let i = $index) {
                      <button
                        type="button"
                        class="gallery-item"
                        (click)="openLightbox(url, i)"
                        [attr.aria-label]="'Open gallery photo ' + (i + 1)"
                      >
                        <span class="gallery-thumb" [style.background-image]="'url(' + url + ')'"></span>
                      </button>
                    }
                  </div>
                </div>
              }

              @if (videoUrls().length) {
                <div class="video-block">
                  <div class="media-row-head">
                    <p class="media-kicker">Videos</p>
                    <span class="media-count">{{ videoUrls().length }} video{{ videoUrls().length === 1 ? '' : 's' }}</span>
                  </div>
                  <div class="video-grid">
                    @for (url of videoUrls(); track url; let i = $index) {
                      <figure class="video-card">
                        <video
                          class="video-item"
                          controls
                          playsinline
                          preload="metadata"
                          (play)="ensureVideoAudible($event)"
                          (loadedmetadata)="ensureVideoAudible($event)"
                        >
                          <source [src]="url" [type]="guessVideoMime(url)" />
                        </video>
                        <figcaption>Video {{ i + 1 }}</figcaption>
                      </figure>
                    }
                  </div>
                </div>
              }
            </section>
          }

          <section class="wishes-panel" aria-labelledby="wishes-heading">
            <div class="section-head">
              <h2 id="wishes-heading" class="section-title">
                {{ getWishesSectionTitle() }}
                <span class="wish-count">{{ event()!.wishes.length }}</span>
              </h2>
              <p class="section-lede">{{ getWishesIntro() }}</p>
            </div>

            <form class="wish-form" (ngSubmit)="submitWish()">
              <div class="form-row">
                <label class="field">
                  <span class="field-label">Your name</span>
                  <input [(ngModel)]="senderName" name="sender" [placeholder]="getSenderPlaceholder()" required />
                </label>
              </div>
              <label class="field">
                <span class="field-label">Message</span>
                <textarea
                  [(ngModel)]="wishMessage"
                  name="message"
                  rows="4"
                  [placeholder]="getMessagePlaceholder()"
                  required
                ></textarea>
              </label>

              <div class="wish-media-row">
                @if (wishMediaPreview()) {
                  <div class="wish-preview-wrap">
                    <img [src]="wishMediaPreview()" alt="Wish photo preview" class="wish-media-preview" />
                    <button type="button" class="wish-preview-remove" (click)="clearWishMedia()">Remove</button>
                  </div>
                }
                <label class="file-chip">
                  <input type="file" accept="image/*" (change)="onWishMediaChange($event)" hidden />
                  <span aria-hidden="true">+</span>
                  Add photo
                </label>
              </div>

              <button
                type="submit"
                class="btn btn-primary wish-submit"
                [disabled]="saving() || !senderName.trim() || !wishMessage.trim()"
              >
                {{ saving() ? 'Sending…' : getSubmitButtonLabel() }}
              </button>
            </form>

            @if (event()!.wishes.length) {
              <div class="wish-list">
                @for (w of event()!.wishes; track w.id) {
                  <article class="wish-card">
                    <header class="wish-card-head">
                      <strong>{{ w.senderName }}</strong>
                      <time [attr.datetime]="w.createdAt">{{ w.createdAt | date: 'mediumDate' }}</time>
                    </header>
                    <p>{{ w.message }}</p>
                    @if (w.mediaUrl) {
                      <button type="button" class="wish-attach" (click)="openLightbox(w.mediaUrl!)">
                        <img [src]="w.mediaUrl" alt="Attachment from {{ w.senderName }}" />
                      </button>
                    }
                  </article>
                }
              </div>
            } @else {
              <p class="wish-empty">Be the first to leave a message.</p>
            }
          </section>
        </div>
      } @else {
        <div class="state-block">
          <h2>Event not found</h2>
          <p>This page may have been removed or is no longer public.</p>
          <a routerLink="/" class="btn btn-primary">Back to Feed</a>
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
      --detail-ink: #0f2922;
      --detail-muted: #5c726b;
      --detail-edge: rgba(13, 61, 50, 0.12);
      --detail-radius: 16px;
    }

    .detail-page {
      padding-bottom: 3.5rem;
      animation: pageIn 0.45s ease both;
    }
    @keyframes pageIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: none; }
    }

    .state-block {
      text-align: center;
      padding: 5rem 1.5rem;
      color: var(--detail-muted);
    }
    .state-block h2 {
      color: var(--detail-ink);
      margin-bottom: 0.5rem;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 3px solid rgba(26, 95, 74, 0.15);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hero {
      position: relative;
      min-height: clamp(280px, 48vw, 420px);
      display: flex;
      align-items: flex-end;
      color: #fff;
      overflow: hidden;
      margin-bottom: 0;
    }
    .hero-media,
    .hero-fallback {
      position: absolute;
      inset: 0;
    }
    .hero-media {
      background-size: cover;
      background-position: center;
      transform: scale(1.02);
      animation: heroZoom 12s ease-out both;
    }
    @keyframes heroZoom {
      from { transform: scale(1.08); }
      to { transform: scale(1.02); }
    }
    .hero-fallback {
      background:
        radial-gradient(ellipse 80% 70% at 70% 20%, rgba(45, 143, 115, 0.45), transparent 55%),
        linear-gradient(145deg, #0d3d32 0%, #1a5f4a 55%, #2d8f73 100%);
    }
    .hero-scrim {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, rgba(8, 28, 24, 0.25) 0%, rgba(8, 28, 24, 0.55) 45%, rgba(8, 28, 24, 0.88) 100%);
    }
    .hero:not(.hero-has-image) .hero-content {
      padding-top: 3rem;
    }
    .hero-content {
      position: relative;
      z-index: 1;
      width: 100%;
      padding: 2rem 0 2.25rem;
      max-width: 920px;
      margin: 0 auto;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 1rem;
      color: rgba(255, 255, 255, 0.88);
      font-size: 0.875rem;
      font-weight: 600;
    }
    .back-link:hover { color: #fff; }
    .hero-content .event-type-badge {
      margin-bottom: 0.75rem;
    }
    .hero-content h1 {
      margin: 0 0 0.65rem;
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 4.5vw, 2.75rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.15;
      color: #fff;
      text-wrap: balance;
    }
    .hero-meta {
      margin: 0;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.35rem 0.45rem;
      font-size: 0.9375rem;
      color: rgba(255, 255, 255, 0.88);
    }
    .dot { opacity: 0.65; }
    .view-cover-btn {
      margin-top: 1.15rem;
      border: 1px solid rgba(255, 255, 255, 0.35);
      background: rgba(255, 255, 255, 0.12);
      color: #fff;
      border-radius: 999px;
      padding: 0.45rem 1rem;
      font: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background 0.2s ease, border-color 0.2s ease;
    }
    .view-cover-btn:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: rgba(255, 255, 255, 0.55);
    }

    .detail-shell {
      max-width: 920px;
      margin: -1.5rem auto 0;
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding-bottom: 1rem;
    }

    .story-panel,
    .media-panel,
    .wishes-panel {
      background: #fff;
      border: 1px solid var(--detail-edge);
      border-radius: var(--detail-radius);
      box-shadow: 0 10px 36px rgba(13, 61, 50, 0.06);
      padding: clamp(1.35rem, 3vw, 2rem);
    }

    .section-head { margin-bottom: 1.25rem; }
    .section-title {
      margin: 0 0 0.35rem;
      font-family: var(--font-display);
      font-size: 1.35rem;
      color: var(--detail-ink);
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }
    .section-lede {
      margin: 0;
      color: var(--detail-muted);
      font-size: 0.9375rem;
      line-height: 1.5;
    }

    .life-dates {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: 1rem 1.25rem;
      margin-bottom: 1.35rem;
      padding: 1rem 1.15rem;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(26, 95, 74, 0.06), rgba(26, 95, 74, 0.02));
      border: 1px solid rgba(26, 95, 74, 0.1);
    }
    .life-date { display: grid; gap: 0.15rem; }
    .life-label {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .life-value {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--detail-ink);
    }
    .life-rule {
      width: 1px;
      align-self: stretch;
      background: rgba(26, 95, 74, 0.18);
    }

    .description {
      margin: 0;
      font-size: 1.0625rem;
      line-height: 1.75;
      color: #2f3f39;
      white-space: pre-wrap;
    }

    .media-kicker {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--primary);
    }
    .media-row-head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .media-count {
      font-size: 0.8125rem;
      color: var(--detail-muted);
      font-weight: 600;
    }

    .featured-block { margin-bottom: 1.5rem; }
    .featured-block .media-kicker { margin-bottom: 0.65rem; }
    .featured-cover {
      position: relative;
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      border-radius: 14px;
      overflow: hidden;
      cursor: zoom-in;
      background: #0f2922;
      box-shadow: 0 12px 32px rgba(15, 41, 34, 0.18);
    }
    .featured-cover img {
      display: block;
      width: 100%;
      max-height: min(62vh, 520px);
      object-fit: cover;
      transition: transform 0.45s ease;
    }
    .featured-cover:hover img { transform: scale(1.03); }
    .featured-hint {
      position: absolute;
      left: 1rem;
      bottom: 1rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(8, 28, 24, 0.72);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 600;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }
    .featured-cover:hover .featured-hint,
    .featured-cover:focus-visible .featured-hint {
      opacity: 1;
      transform: none;
    }

    .gallery-block { margin-bottom: 1.5rem; }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.65rem;
    }
    .gallery-item {
      padding: 0;
      border: none;
      border-radius: 12px;
      overflow: hidden;
      cursor: zoom-in;
      background: #e8eeeb;
      aspect-ratio: 1;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .gallery-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 24px rgba(13, 61, 50, 0.14);
    }
    .gallery-thumb {
      display: block;
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1rem;
    }
    .video-card {
      margin: 0;
      border-radius: 14px;
      overflow: hidden;
      background: #0f2922;
      border: 1px solid rgba(26, 95, 74, 0.16);
    }
    .video-item {
      display: block;
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      background: #000;
    }
    .video-card figcaption {
      padding: 0.55rem 0.85rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.78);
      background: linear-gradient(180deg, #16362d, #0f2922);
    }

    .wish-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.6rem;
      height: 1.6rem;
      padding: 0 0.4rem;
      border-radius: 999px;
      background: rgba(26, 95, 74, 0.12);
      color: var(--primary-dark);
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .wish-form {
      margin-bottom: 1.75rem;
      padding: 1.15rem 1.2rem 1.25rem;
      border-radius: 14px;
      background: linear-gradient(180deg, #f7faf8 0%, #fff 100%);
      border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .field { display: grid; gap: 0.35rem; margin-bottom: 0.9rem; }
    .field-label {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #46675f;
    }
    .wish-form input,
    .wish-form textarea {
      width: 100%;
      box-sizing: border-box;
      border: 1px solid #d7e4de;
      border-radius: 10px;
      padding: 0.7rem 0.85rem;
      font: inherit;
      background: #fff;
      color: var(--detail-ink);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .wish-form input:focus,
    .wish-form textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.12);
    }
    .wish-media-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      border: 1px dashed rgba(26, 95, 74, 0.35);
      background: #fff;
      color: var(--primary-dark);
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
    }
    .file-chip:hover { border-color: var(--primary); background: rgba(26, 95, 74, 0.04); }
    .wish-preview-wrap {
      display: flex;
      align-items: center;
      gap: 0.55rem;
    }
    .wish-media-preview {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 10px;
      border: 1px solid var(--detail-edge);
    }
    .wish-preview-remove {
      border: none;
      background: transparent;
      color: #b91c1c;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }
    .wish-submit { min-width: 9.5rem; }

    .wish-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .wish-card {
      padding: 1rem 1.15rem;
      border-radius: 12px;
      background: #f7faf8;
      border: 1px solid rgba(26, 95, 74, 0.08);
    }
    .wish-card-head {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      align-items: baseline;
      margin-bottom: 0.35rem;
    }
    .wish-card-head strong { color: var(--primary-dark); }
    .wish-card-head time {
      font-size: 0.78rem;
      color: var(--detail-muted);
      white-space: nowrap;
    }
    .wish-card p {
      margin: 0;
      line-height: 1.55;
      color: #33443e;
    }
    .wish-attach {
      margin-top: 0.75rem;
      padding: 0;
      border: none;
      background: transparent;
      cursor: zoom-in;
      display: block;
    }
    .wish-attach img {
      display: block;
      max-width: min(100%, 280px);
      max-height: 200px;
      border-radius: 10px;
      object-fit: cover;
    }
    .wish-empty {
      margin: 0;
      color: var(--detail-muted);
      font-size: 0.9375rem;
    }

    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 1200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: rgba(8, 28, 24, 0.88);
      backdrop-filter: blur(6px);
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .lightbox-img {
      max-width: min(96vw, 1100px);
      max-height: 88vh;
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
      animation: zoomIn 0.25s ease;
    }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: none; }
    }
    .lightbox-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }
    .lightbox-close:hover { background: rgba(255, 255, 255, 0.28); }
    .lightbox-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 2.75rem;
      height: 2.75rem;
      border: none;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      font-size: 1.75rem;
      cursor: pointer;
    }
    .lightbox-nav:hover { background: rgba(255, 255, 255, 0.28); }
    .lightbox-prev { left: 1rem; }
    .lightbox-next { right: 1rem; }

    @media (max-width: 767px) {
      .detail-shell { margin-top: -1rem; gap: 1rem; }
      .gallery-grid { grid-template-columns: repeat(2, 1fr); }
      .life-rule { display: none; }
      .lightbox-nav { display: none; }
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

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit() {
    this.fromMyEvents =
      (this.route.snapshot.queryParamMap.get('from') || '').toLowerCase() === 'my-events' ||
      (typeof document !== 'undefined' && (document.referrer || '').includes('/my-events'));
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

  backLabel(): string {
    return this.fromMyEvents ? '← Back to My Events' : '← Back to Feed';
  }

  goBack(event: Event): void {
    event.preventDefault();
    if (this.fromMyEvents) {
      void this.router.navigateByUrl('/my-events');
      return;
    }
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/');
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
      'Puberty Ceremony': 'Puberty Ceremony',
      Wedding: 'Wedding',
      Anniversary: 'Anniversary',
      Obituary: 'Obituary',
      Remembrance: 'Remembrance',
      Other: 'Other'
    };
    return map[type] ?? type;
  }

  getWishesSectionTitle(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Tributes & Condolences';
    return 'Wishes';
  }

  getWishesIntro(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') {
      return 'Share a memory or offer condolences for the family.';
    }
    return 'Leave a warm message for everyone celebrating this moment.';
  }

  getSenderPlaceholder(): string {
    return 'Your name';
  }

  getMessagePlaceholder(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Share a memory or offer condolences…';
    return 'Your wish or congratulatory message…';
  }

  getSubmitButtonLabel(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Post Tribute';
    return 'Send Wish';
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
