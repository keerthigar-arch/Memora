import { Component, ElementRef, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import { EventStatsService } from '../../services/event-stats.service';
import { AuthService } from '../../services/auth.service';
import { AuthUiService } from '../../services/auth-ui.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FooterComponent,
    AuthModalComponent,
    TranslatePipe
  ],
  template: `
    <div class="top-bar">
      <div class="container">
        <span class="top-bar-24">24/7</span>
        <a href="tel:+442079460123" class="top-bar-phone">+44 20 7946 0123</a>
      </div>
    </div>

    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="logo" aria-label="Memora">
          <span class="logo-glow" aria-hidden="true"></span>
          <span class="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 11.2c-2-4.5-5.9-6.1-9.2-5 0 3.8 2.5 7.3 6.8 7.8 1 .1 1.8-.1 2.4-.5Z"/>
              <path d="M12 11.2c2-4.5 5.9-6.1 9.2-5 0 3.8-2.5 7.3-6.8 7.8-1 .1-1.8-.1-2.4-.5Z"/>
              <path d="M12 11.9c-1.8 3.7-4.9 5-7.4 4.3 0 2.9 2 5.5 5.2 5.8 1 .1 1.8-.2 2.2-.7Z"/>
              <path d="M12 11.9c1.8 3.7 4.9 5 7.4 4.3 0 2.9-2 5.5-5.2 5.8-1 .1-1.8-.2-2.2-.7Z"/>
            </svg>
          </span>
          <span class="wordmark">
            <span class="wordmark-text">Memora</span>
            <span class="wordmark-shine" aria-hidden="true"></span>
          </span>
        </a>

        <nav class="nav" aria-label="Primary">
          <div class="lang-switch" role="group" [attr.aria-label]="'lang.switchLabel' | t">
            <button type="button" class="lang-btn" [class.active]="i18n.lang() === 'en'" (click)="i18n.setLang('en')">
              {{ 'lang.en' | t }}
            </button>
            <button type="button" class="lang-btn" [class.active]="i18n.lang() === 'ta'" (click)="i18n.setLang('ta')">
              {{ 'lang.ta' | t }}
            </button>
          </div>
          <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">{{
            'nav.feed' | t
          }}</a>
          <a class="nav-link" routerLink="/pricing" routerLinkActive="active">{{ 'nav.pricing' | t }}</a>
          <a class="nav-link" routerLink="/contact" routerLinkActive="active">{{ 'nav.contact' | t }}</a>
          @if (auth.isLoggedIn()) {
            <a class="nav-link" routerLink="/my-events" routerLinkActive="active">{{ 'nav.myEvents' | t }}</a>
            <div class="profile-menu" #profileMenuRoot>
              <button
                type="button"
                class="profile-trigger"
                (click)="toggleProfileMenu($event)"
                [attr.aria-expanded]="profileMenuOpen()"
                aria-haspopup="menu"
                [attr.aria-label]="('nav.myAccount' | t) + ' — ' + (userDisplayName() || '')"
              >
                <span class="profile-avatar" [class.has-photo]="!!profileImageUrl()">
                  @if (profileImageUrl()) {
                    <img [src]="profileImageUrl()!" alt="" />
                  } @else {
                    <span class="profile-initials">{{ userInitials() }}</span>
                  }
                </span>
                <svg class="profile-chevron" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
              </button>

              @if (profileMenuOpen()) {
                <div class="profile-dropdown" role="menu" [attr.aria-label]="'nav.myAccount' | t">
                  <div class="profile-dropdown-header">
                    <span class="profile-dropdown-name">{{ userDisplayName() }}</span>
                    <span class="profile-dropdown-email">{{ userEmail() }}</span>
                  </div>
                  <ul class="profile-dropdown-list">
                    <li>
                      <a
                        class="profile-dropdown-item"
                        role="menuitem"
                        routerLink="/profile"
                        routerLinkActive="is-active"
                        (click)="closeProfileMenu()"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M20 21a8 8 0 1 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                          />
                        </svg>
                        {{ 'nav.myAccount' | t }}
                      </a>
                    </li>
                    <li class="profile-dropdown-divider" role="separator"></li>
                    <li>
                      <button
                        type="button"
                        class="profile-dropdown-item profile-dropdown-item--danger"
                        role="menuitem"
                        (click)="logout()"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="1.75"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                        {{ 'nav.logout' | t }}
                      </button>
                    </li>
                  </ul>
                </div>
              }
            </div>
          } @else {
            <button type="button" class="nav-link nav-link-muted nav-auth-btn" (click)="authUi.openLogin()">
              {{ 'nav.login' | t }}
            </button>
            <button type="button" class="nav-btn nav-btn-primary" (click)="authUi.openRegister()">{{ 'nav.register' | t }}</button>
          }
        </nav>
      </div>
    </header>

    @if (!isProfileRoute()) {
    <section class="showcase">
      <div class="container showcase-content">
        <div class="showcase-copy">
          <p class="showcase-kicker">{{ 'showcase.kicker' | t }}</p>
          <h2>{{ 'showcase.title' | t }}</h2>
          <p>{{ 'showcase.subtitle' | t }}</p>
        </div>
        <div class="gallery-window" aria-hidden="true">
          <div class="gallery-track">
            @for (src of showcaseTrack; track $index) {
              <span class="gallery-card">
                <img [src]="src" alt="" width="400" height="300" decoding="async" loading="lazy" />
              </span>
            }
          </div>
        </div>
      </div>
    </section>
    }

    @if (!isProfileRoute()) {
    <section class="country-summary-bar">
      <div class="container">
        @if (!stats.countryStatsLoaded()) {
          <span class="summary-placeholder">{{ 'country.loading' | t }}</span>
        } @else if (stats.countrySummary().length > 0) {
          <div class="summary-chips" role="group" [attr.aria-label]="'country.filterAria' | t">
            <button
              type="button"
              class="summary-chip"
              [class.active]="!stats.selectedCountry()"
              (click)="stats.setSelectedCountry(null)"
            >
              <strong>{{ 'country.all' | t }}</strong>
            </button>
            @for (item of stats.countrySummary(); track item.country) {
              <button
                type="button"
                class="summary-chip"
                [class.active]="stats.selectedCountry() === item.country"
                (click)="stats.setSelectedCountry(item.country)"
              >
                <strong>{{ item.country }}</strong>
                <span>{{ item.count }} {{ 'country.eventsSuffix' | t }}</span>
              </button>
            }
          </div>
        }
      </div>
    </section>
    }

    <main class="main">
      <router-outlet></router-outlet>
    </main>
    @if (authUi.panel() !== null) {
      <app-auth-modal />
    }
    <app-footer></app-footer>
  `,
  styles: [`
    .top-bar {
      background: #f7faf8;
      color: #456b61;
      padding: 0.35rem 1.5rem;
      font-size: 0.8rem;
      border-bottom: 1px solid #e3ece8;
    }
    .top-bar .container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
    }
    .top-bar-24 {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-weight: 600;
    }
    .top-bar-24::before { content: "🕐 "; }
    .top-bar-phone {
      color: #2f5d51;
      text-decoration: none;
      font-weight: 600;
    }
    .top-bar-phone:hover { text-decoration: underline; }
    .header {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      box-shadow: 0 8px 26px rgba(8, 38, 30, 0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.5rem;
    }
    .logo {
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      text-decoration: none;
      position: relative;
      isolation: isolate;
      padding: 0.15rem 0.35rem 0.2rem 0.2rem;
      margin: -0.15rem -0.35rem -0.2rem -0.2rem;
      border-radius: 12px;
      transition: transform 0.35s ease;
    }
    .logo:hover {
      transform: translateY(-1px);
    }
    .logo:focus-visible {
      outline: 2px solid #1a5f4a;
      outline-offset: 3px;
    }
    .logo-glow {
      position: absolute;
      inset: 0;
      border-radius: 12px;
      background:
        radial-gradient(ellipse 85% 120% at 20% 40%, rgba(63, 144, 119, 0.22) 0%, transparent 55%),
        radial-gradient(ellipse 70% 100% at 85% 60%, rgba(13, 61, 50, 0.12) 0%, transparent 50%);
      opacity: 0.85;
      z-index: -1;
      animation: logoGlowPulse 5s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes logoGlowPulse {
      0%, 100% { opacity: 0.65; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.02); }
    }
    .wordmark {
      position: relative;
      display: inline-block;
      font-size: 1.65rem;
      letter-spacing: 0.02em;
      font-weight: 700;
      line-height: 1;
      overflow: visible;
    }
    .wordmark-text {
      display: inline-block;
      background: linear-gradient(
        115deg,
        #0d3d32 0%,
        #1a5f4a 22%,
        #4aaf8c 42%,
        #1a5f4a 58%,
        #2c8f72 72%,
        #0d3d32 100%
      );
      background-size: 240% auto;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: wordmarkShimmer 6s ease-in-out infinite;
    }
    @keyframes wordmarkShimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .wordmark-shine {
      position: absolute;
      left: -15%;
      top: 0;
      bottom: 0;
      width: 38%;
      background: linear-gradient(
        100deg,
        transparent 0%,
        rgba(255, 255, 255, 0.55) 45%,
        transparent 90%
      );
      transform: skewX(-18deg) translateX(-120%);
      animation: wordmarkSweep 4.5s ease-in-out infinite;
      pointer-events: none;
      mix-blend-mode: soft-light;
      border-radius: 4px;
    }
    @keyframes wordmarkSweep {
      0%, 12% { transform: skewX(-18deg) translateX(-130%); opacity: 0; }
      18% { opacity: 0.9; }
      35%, 100% { transform: skewX(-18deg) translateX(220%); opacity: 0; }
    }
    .brand-icon {
      width: 1.35rem;
      height: 1.35rem;
      display: inline-flex;
      color: #2e7f67;
      margin-right: 0.42rem;
      transform: translateY(-1px);
      animation: brandLeafFloat 5s ease-in-out infinite;
    }
    @keyframes brandLeafFloat {
      0%, 100% { transform: translateY(-1px) rotate(0deg) scale(1); }
      25% { transform: translateY(-3px) rotate(-4deg) scale(1.04); }
      75% { transform: translateY(0) rotate(3deg) scale(1.02); }
    }
    .brand-icon svg {
      width: 100%;
      height: 100%;
      fill: currentColor;
      filter: drop-shadow(0 2px 4px rgba(26, 95, 74, 0.28));
      animation: brandLeafGlow 3.5s ease-in-out infinite;
    }
    @keyframes brandLeafGlow {
      0%, 100% { filter: drop-shadow(0 2px 4px rgba(26, 95, 74, 0.28)); }
      50% { filter: drop-shadow(0 2px 8px rgba(63, 144, 119, 0.55)) drop-shadow(0 0 10px rgba(63, 144, 119, 0.25)); }
    }
    @media (prefers-reduced-motion: reduce) {
      .logo { transition: none; }
      .logo:hover { transform: none; }
      .logo-glow,
      .wordmark-text,
      .wordmark-shine,
      .brand-icon,
      .brand-icon svg {
        animation: none !important;
      }
      .logo-glow { opacity: 0.5; transform: none; }
      .wordmark-text {
        background: linear-gradient(120deg, #0d3d32 0%, #1a5f4a 55%, #3f9077 100%);
        background-size: 100% auto;
      }
      .wordmark-shine { display: none; }
    }
    .showcase {
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      background: linear-gradient(135deg, #0d3d32 0%, #1b5f4b 60%, #2f7e66 100%);
      padding: 0.9rem 0;
    }
    /* Profile: keep slideshow grid but tighten copy so light hero below stays the focal band */
    .showcase.showcase--profile {
      padding: 0.65rem 0 0.75rem;
    }
    .showcase.showcase--profile .showcase-copy .showcase-kicker {
      margin-bottom: 0.25rem;
      font-size: 0.65rem;
    }
    .showcase.showcase--profile .showcase-copy h2 {
      margin-bottom: 0.25rem;
      font-size: clamp(1rem, 2vw, 1.28rem);
    }
    .showcase.showcase--profile .showcase-copy p {
      font-size: 0.8rem;
      line-height: 1.4;
    }
    .showcase.showcase--profile .gallery-card {
      width: 158px;
    }
    .showcase-content {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      gap: 1rem;
      align-items: center;
      padding: 1rem 1.5rem;
      color: #fff;
    }
    .showcase-copy {
      text-align: left;
    }
    .showcase-kicker {
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      font-size: 0.72rem;
      color: rgba(255,255,255,0.82);
    }
    .showcase h2 {
      margin: 0 0 0.4rem;
      color: #fff;
      font-size: clamp(1.12rem, 2.3vw, 1.55rem);
      line-height: 1.24;
    }
    .showcase p {
      margin: 0;
      color: rgba(255,255,255,0.93);
      font-size: 0.86rem;
    }
    .gallery-window {
      overflow: hidden;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(0, 0, 0, 0.12);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
    }
    .gallery-track {
      display: flex;
      gap: 0.55rem;
      width: max-content;
      padding: 0.55rem;
      animation: galleryMove 35s linear infinite;
    }
    .gallery-window:hover .gallery-track {
      animation-play-state: paused;
    }
    .gallery-card {
      width: 200px;
      aspect-ratio: 4 / 3;
      border-radius: 11px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
      flex: 0 0 auto;
      position: relative;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.15);
    }
    .gallery-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    @keyframes galleryMove {
      from { transform: translateX(0); }
      to { transform: translateX(calc(-50% - 0.275rem)); }
    }
    .lang-switch {
      display: inline-flex;
      align-items: center;
      gap: 0.1rem;
      padding: 0.18rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.75);
      border: 1px solid #cfe5dc;
      margin-inline-end: 0.15rem;
    }
    .lang-btn {
      border: none;
      background: transparent;
      font: inherit;
      font-size: 0.68rem;
      font-weight: 700;
      padding: 0.36rem 0.55rem;
      border-radius: 999px;
      cursor: pointer;
      color: #46675f;
      letter-spacing: 0.02em;
      transition:
        background 0.15s ease,
        color 0.15s ease,
        box-shadow 0.15s ease;
    }
    .lang-btn:hover {
      color: #0d3d32;
    }
    .lang-btn.active {
      background: #fff;
      color: #0d3d32;
      box-shadow: 0 1px 5px rgba(13, 61, 50, 0.14);
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem;
      border-radius: 999px;
      background: #f3f7f5;
      border: 1px solid #e3ece8;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9);
      .nav-link {
        font-weight: 600;
        padding: 0.48rem 0.85rem;
        color: #55726a;
        text-decoration: none;
        border-radius: 999px;
        transition: all 160ms ease;
        &:hover {
          color: var(--primary);
          background: #ffffff;
        }
        &.active {
          color: #fff;
          background: linear-gradient(135deg, #1a5f4a 0%, #2f7e66 100%);
          box-shadow: 0 4px 12px rgba(26, 95, 74, 0.3);
        }
      }
      .nav-link-muted:not(.active) {
        color: #46675f;
      }
      button.nav-auth-btn.nav-link {
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        border: none;
        background: transparent;
      }
      .nav-btn {
        border: 1px solid transparent;
        border-radius: 999px;
        font: inherit;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        padding: 0.5rem 0.95rem;
        transition: all 160ms ease;
      }
      .nav-btn-primary {
        color: #fff;
        background: linear-gradient(135deg, #0d3d32 0%, #1f6a53 100%);
        box-shadow: 0 6px 14px rgba(13, 61, 50, 0.28);
      }
      .nav-btn-primary:hover,
      .nav-btn-primary.active {
        transform: translateY(-1px);
        box-shadow: 0 8px 16px rgba(13, 61, 50, 0.34);
      }
      .nav-btn-ghost {
        color: #35584f;
        border-color: #d6e4de;
        background: #fff;
      }
      .nav-btn-ghost:hover {
        color: var(--primary);
        border-color: #c5d8d0;
        background: #f8fcfa;
      }
      .profile-menu {
        position: relative;
      }
      .profile-trigger {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 40px;
        padding: 4px 8px 4px 4px;
        border: 1px solid transparent;
        border-radius: 12px;
        background: transparent;
        cursor: pointer;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .profile-trigger:hover,
      .profile-trigger[aria-expanded='true'] {
        background: #fff;
        border-color: #dce8e3;
      }
      .profile-trigger:focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      .profile-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: linear-gradient(145deg, #e8f3ee 0%, #d4e8df 100%);
        border: 1.5px solid rgba(26, 95, 74, 0.18);
        overflow: hidden;
      }
      .profile-avatar.has-photo {
        background: #fff;
      }
      .profile-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .profile-initials {
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        color: var(--primary);
        line-height: 1;
      }
      .profile-chevron {
        width: 16px;
        height: 16px;
        color: #6b857c;
        flex-shrink: 0;
        transition: transform 0.15s ease;
      }
      .profile-trigger[aria-expanded='true'] .profile-chevron {
        transform: rotate(180deg);
      }
      .profile-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 240px;
        border-radius: 12px;
        border: 1px solid rgba(13, 61, 50, 0.08);
        background: #fff;
        box-shadow: 0 4px 6px rgba(13, 61, 50, 0.04), 0 16px 40px rgba(13, 61, 50, 0.12);
        z-index: 300;
        overflow: hidden;
        animation: dropdownIn 0.15s ease;
      }
      @keyframes dropdownIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .profile-dropdown-header {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding: 12px 16px;
        border-bottom: 1px solid #eef3f0;
        background: #fafcfb;
      }
      .profile-dropdown-name {
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--primary-dark);
        line-height: 1.3;
      }
      .profile-dropdown-email {
        font-size: 0.75rem;
        color: #6b857c;
        word-break: break-word;
      }
      .profile-dropdown-list {
        list-style: none;
        margin: 0;
        padding: 8px;
      }
      .profile-dropdown-item {
        display: flex;
        align-items: center;
        gap: 10px;
        width: 100%;
        padding: 10px 12px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: #2f4a42;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        text-decoration: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.15s ease, color 0.15s ease;
      }
      .profile-dropdown-item svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
        color: #6b857c;
      }
      .profile-dropdown-item:hover,
      .profile-dropdown-item:focus-visible,
      .profile-dropdown-item.is-active {
        background: #f4f8f6;
        color: var(--primary-dark);
        outline: none;
      }
      .profile-dropdown-item:hover svg,
      .profile-dropdown-item:focus-visible svg,
      .profile-dropdown-item.is-active svg {
        color: var(--primary);
      }
      .profile-dropdown-item--danger {
        color: #b42318;
      }
      .profile-dropdown-item--danger svg {
        color: #d92d20;
      }
      .profile-dropdown-item--danger:hover,
      .profile-dropdown-item--danger:focus-visible {
        background: #fef3f2;
        color: #912018;
      }
      .profile-dropdown-divider {
        height: 1px;
        margin: 4px 8px;
        background: #eef3f0;
      }
    }
    .country-summary-bar {
      background: #f8fcfa;
      color: #355c52;
      padding: 0.5rem 1.5rem;
      border-bottom: 1px solid #e3ece8;
    }
    .country-summary-bar .container {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .summary-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .summary-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      background: #ffffff;
      border: 1px solid #d7e7e1;
      border-radius: 999px;
      font-size: 0.82rem;
      font: inherit;
      cursor: pointer;
      color: inherit;
      transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease;
    }
    .summary-chip:hover {
      border-color: #b8d4ca;
      background: #fbfffc;
    }
    .summary-chip.active {
      border-color: #1a5f4a;
      background: #ecf6f2;
      box-shadow: 0 2px 8px rgba(26, 95, 74, 0.1);
    }
    .summary-chip strong { color: #274d43; }
    .main { min-height: calc(100vh - 160px); padding: 0.55rem 0 1.6rem; }
    @media (max-width: 960px) {
      .header-inner {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
      .nav {
        width: 100%;
        flex-wrap: wrap;
        border-radius: 16px;
      }
      .profile-chevron {
        display: none;
      }
      .profile-trigger {
        padding: 4px;
      }
      .showcase {
        padding: 0.75rem 0;
      }
      .showcase-content {
        grid-template-columns: 1fr;
        padding: 0.85rem 1rem;
        gap: 0.7rem;
      }
      .showcase-copy {
        text-align: center;
      }
      .gallery-card {
        width: 168px;
      }
    }
  `]
})
export class CustomerLayoutComponent implements OnInit {
  readonly env = environment;

  private static readonly SHOWCASE_IMAGES = [
    'assets/showcase/wedding-1.jpg',
    'assets/showcase/wedding-2.jpg',
    'assets/showcase/wedding-3.jpg',
    'assets/showcase/hindu-wedding.jpg',
    'assets/showcase/hindu-puberty.jpg',
    'assets/showcase/birthday-1.jpg',
    'assets/showcase/birthday-2.jpg',
    'assets/showcase/celebration-1.jpg',
    'assets/showcase/memorial-1.jpg',
    'assets/showcase/memorial-2.jpg'
  ] as const;

  /** Duplicated for seamless infinite scroll (animation moves -50%). */
  readonly showcaseTrack = [
    ...CustomerLayoutComponent.SHOWCASE_IMAGES,
    ...CustomerLayoutComponent.SHOWCASE_IMAGES
  ];

  profileMenuOpen = signal(false);
  profileImageUrl = computed(() => this.auth.currentUser()?.profileImageUrl ?? null);
  userDisplayName = computed(() => this.auth.currentUser()?.displayName?.trim() || '');
  userEmail = computed(() => this.auth.currentUser()?.email || '');

  /** Country chips and showcase are hidden on profile; profile has its own hero. */
  readonly isProfileRoute = signal(false);

  constructor(
    public stats: EventStatsService,
    public auth: AuthService,
    public authUi: AuthUiService,
    public i18n: LanguageService,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {
    const syncRoute = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      this.isProfileRoute.set(path === '/profile' || path.startsWith('/profile/'));
    };
    syncRoute();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      syncRoute();
      this.closeProfileMenu();
    });
  }

  userInitials(): string {
    const name = this.auth.currentUser()?.displayName?.trim();
    if (!name) return '?';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0] ?? '';
      const b = parts[parts.length - 1][0] ?? '';
      return (a + b).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.auth.refreshProfile().subscribe({ error: () => {} });
    }
  }

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.profileMenuOpen.update((v) => !v);
  }

  closeProfileMenu() {
    this.profileMenuOpen.set(false);
  }

  logout() {
    this.closeProfileMenu();
    this.auth.logout();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.profileMenuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.closeProfileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeProfileMenu();
  }
}
