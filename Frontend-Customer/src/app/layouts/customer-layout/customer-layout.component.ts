import { Component, ElementRef, HostListener, OnInit, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { FooterComponent } from '../../components/footer/footer.component';
import { AuthModalComponent } from '../../components/auth-modal/auth-modal.component';
import { PricingObituaryComponent } from '../../features/pricing-obituary/pricing-obituary.component';
import { ContactComponent } from '../../features/contact/contact.component';
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
    TranslatePipe,
    PricingObituaryComponent,
    ContactComponent
  ],
  template: `
    <div class="top-bar" role="complementary" aria-label="Support line">
      <div class="container top-bar-inner">
        <span class="top-bar-label">24/7 support</span>
        <span class="top-bar-sep" aria-hidden="true">·</span>
        <a href="tel:+442079460123" class="top-bar-phone">+44 20 7946 0123</a>
      </div>
    </div>

    <header class="header">
      <div class="container header-inner">
        <a routerLink="/" class="logo" aria-label="தmileye">
          <span class="logo-glow" aria-hidden="true"></span>
          <img class="brand-mark" src="assets/brand/smileye-logo.png" alt="" />
          <span class="wordmark">
            <span class="wordmark-text">தmileye</span>
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
          <a class="nav-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="enterFeed()">{{
            'nav.feed' | t
          }}</a>
          @if (auth.isLoggedIn()) {
            <a class="nav-link nav-link-emphasis" routerLink="/my-events" routerLinkActive="active">{{
              'nav.myEvents' | t
            }}</a>
          }
          @if (showWelcome()) {
            <a class="nav-link" href="#welcome-pricing" (click)="scrollToSection($event, 'welcome-pricing')">{{ 'nav.pricing' | t }}</a>
            <a class="nav-link" href="#welcome-contact" (click)="scrollToSection($event, 'welcome-contact')">{{ 'nav.contact' | t }}</a>
          } @else {
            <a class="nav-link" routerLink="/pricing" routerLinkActive="active">{{ 'nav.pricing' | t }}</a>
            <a class="nav-link" routerLink="/contact" routerLinkActive="active">{{ 'nav.contact' | t }}</a>
          }
          @if (auth.isLoggedIn()) {
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
                        (click)="logout($event)"
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

    @if (sessionExpired()) {
      <div class="session-banner" role="status">
        <p>{{ 'session.expired' | t }}</p>
        <button type="button" class="session-banner-dismiss" (click)="dismissSessionNotice()">
          {{ 'session.dismiss' | t }}
        </button>
      </div>
    }

    @if (showWelcome()) {
      <div class="welcome-scroll">
      <section class="arrival" aria-labelledby="arrival-title">
        <div class="arrival-collage" aria-hidden="true">
          <svg class="arrival-leaf arrival-leaf--left" viewBox="0 0 140 220" fill="none">
            <path d="M78 208C74 150 48 112 28 62" stroke="#8eaa96" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M70 168c-28-6-46-28-52-52 18 6 34 8 52 4" stroke="#8eaa96" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M66 138c22-10 40-8 58-24-16 14-32 18-52 16" stroke="#7d9a86" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M40 96c-16-18-18-36-10-54 8 16 14 28 22 40" stroke="#8eaa96" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M34 78c-20 2-32 16-36 32 14-6 26-10 38-8" stroke="#9bb5a2" stroke-width="1.1" stroke-linecap="round"/>
          </svg>
          <svg class="arrival-leaf arrival-leaf--right" viewBox="0 0 160 200" fill="none">
            <path d="M36 12c18 48 28 86 22 150" stroke="#8eaa96" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M52 58c26-2 44 12 56 32-20-6-36-4-52 2" stroke="#7d9a86" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M50 96c24 8 36 24 40 46-18-10-32-14-46-10" stroke="#8eaa96" stroke-width="1.2" stroke-linecap="round"/>
            <path d="M46 132c18 16 22 34 16 54-10-16-16-30-20-46" stroke="#9bb5a2" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          <figure class="polaroid polaroid--a">
            <img src="assets/showcase/wedding-2.jpg" alt="" />
          </figure>
          <figure class="polaroid polaroid--b">
            <img src="assets/showcase/hindu-wedding.jpg" alt="" />
          </figure>
          <figure class="polaroid polaroid--c">
            <img src="assets/showcase/birthday-2.jpg" alt="" />
          </figure>
        </div>
        <div class="arrival-copy">
          <p class="arrival-kicker">{{ 'showcase.whoWeAre' | t }}</p>
          <h1 id="arrival-title">{{ 'arrival.title' | t }}</h1>
          <p class="arrival-body">{{ 'showcase.whoWeAre.body' | t }}</p>
          <div class="discover-slot">
            <button type="button" class="arrival-cta" (click)="enterFeed()">
              {{ 'arrival.discover' | t }}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
        <p class="arrival-mantra">
          <span>{{ 'arrival.celebrate' | t }}</span>
          <span class="arrival-dot" aria-hidden="true">·</span>
          <span>{{ 'arrival.preserve' | t }}</span>
          <span class="arrival-dot" aria-hidden="true">·</span>
          <span>{{ 'arrival.remember' | t }}</span>
        </p>
      </section>
      <section id="welcome-pricing" class="welcome-panel" aria-label="Pricing">
        <app-pricing-obituary [embedded]="true" />
      </section>
      <section id="welcome-contact" class="welcome-panel" aria-label="Contact">
        <app-contact />
      </section>
      </div>
    }
    @if (!showWelcome()) {
    @if (!isProfileRoute()) {
    <section class="showcase" [class.showcase--guest]="!auth.isLoggedIn()">
      @if (auth.isLoggedIn()) {
      <div class="showcase-ornament showcase-ornament--left" aria-hidden="true"></div>
      <div class="showcase-ornament showcase-ornament--right" aria-hidden="true"></div>
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
      } @else {
        <div class="container who-we-are">
          <p class="who-label">{{ 'showcase.whoWeAre' | t }}</p>
          <p class="who-title">{{ 'arrival.title' | t }}</p>
          <p class="who-line">{{ 'showcase.whoWeAre.body' | t }}</p>
        </div>
      }
    </section>
    }

    <main class="main">
      <router-outlet></router-outlet>
    </main>
    }
    @if (authUi.panel() !== null) {
      <app-auth-modal />
    }
    <app-footer></app-footer>
  `,
  styles: [`
    .top-bar {
      background: #f4f8f6;
      color: #5a746c;
      padding: 0.18rem 1.5rem;
      font-size: 0.7rem;
      line-height: 1.2;
      border-bottom: 1px solid #e6eeea;
    }
    .top-bar-inner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      flex-wrap: nowrap;
      min-height: 1.35rem;
    }
    .top-bar-label {
      font-weight: 600;
      letter-spacing: 0.02em;
      color: #5f7870;
      white-space: nowrap;
    }
    .top-bar-sep {
      color: #a3b8b0;
      font-weight: 400;
    }
    .top-bar-phone {
      color: #2f5d51;
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;
    }
    .top-bar-phone:hover { text-decoration: underline; }
    .session-banner {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      padding: 0.55rem 1rem;
      background: #f8f4ea;
      color: #5c4a1f;
      border-bottom: 1px solid #eadfc4;
      text-align: center;
    }
    .session-banner p {
      margin: 0;
      font-size: 0.86rem;
      font-weight: 600;
      line-height: 1.4;
    }
    .session-banner-dismiss {
      border: 1px solid #c4b48a;
      background: #fff;
      color: #5c4a1f;
      border-radius: 999px;
      padding: 0.2rem 0.7rem;
      font: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
    }
    .session-banner-dismiss:hover {
      background: #fffaf0;
    }
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
    .brand-mark {
      width: 3.5rem;
      height: 3.5rem;
      object-fit: cover;
      border-radius: 8px;
      margin-right: 0.55rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(13, 61, 50, 0.18);
    }
    .arrival {
      position: relative;
      min-height: calc(100dvh - 7.25rem);
      display: grid;
      grid-template-columns: minmax(260px, 1.05fr) minmax(280px, 0.92fr);
      align-items: center;
      gap: 1.5rem 3rem;
      padding: 2.2rem 4vw 4.75rem;
      background:
        radial-gradient(ellipse 42% 36% at 12% 78%, rgba(176, 196, 168, 0.35), transparent 70%),
        radial-gradient(ellipse 36% 28% at 92% 18%, rgba(212, 196, 168, 0.28), transparent 70%),
        #f6f3ec;
    }
    .arrival-collage {
      position: relative;
      height: min(540px, 66vh);
      min-height: 420px;
    }
    .arrival-leaf {
      position: absolute;
      z-index: 0;
      pointer-events: none;
    }
    .arrival-leaf--left {
      width: 150px;
      left: -8px;
      bottom: 18px;
    }
    .arrival-leaf--right {
      width: 150px;
      right: 0;
      top: 8px;
    }
    .polaroid {
      position: absolute;
      margin: 0;
      background: #fff;
      padding: 0.55rem 0.55rem 1.45rem;
      border-radius: 3px;
      box-shadow: 0 18px 40px rgba(62, 48, 28, 0.14);
      overflow: hidden;
      animation: polaroidIn 0.9s ease both;
    }
    .polaroid img {
      display: block;
      width: 100%;
      height: calc(100% - 0.2rem);
      object-fit: cover;
    }
    .polaroid::after {
      content: '';
      position: absolute;
      left: 0.55rem;
      right: 0.55rem;
      top: 0.55rem;
      bottom: 1.45rem;
      background: linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.55) 50%, transparent 62%);
      transform: translateX(-130%);
      animation: polaroidShine 6.5s ease-in-out infinite;
      pointer-events: none;
    }
    .polaroid--a {
      width: 48%;
      height: 58%;
      left: 4%;
      top: 6%;
      z-index: 1;
      animation: polaroidIn 0.9s ease both, polaroidFloatA 6.4s ease-in-out 0.9s infinite;
    }
    .polaroid--a img { object-position: center 40%; }
    .polaroid--a::after { animation-delay: 0.6s; }
    .polaroid--b {
      width: 46%;
      height: 50%;
      right: 2%;
      top: 0;
      z-index: 2;
      animation: polaroidIn 0.9s ease 0.15s both, polaroidFloatB 7.2s ease-in-out 1.05s infinite;
    }
    .polaroid--b img { object-position: center 45%; }
    .polaroid--b::after { animation-delay: 2.4s; }
    .polaroid--c {
      width: 40%;
      height: 50%;
      left: 30%;
      bottom: 0;
      z-index: 3;
      animation: polaroidIn 0.9s ease 0.28s both, polaroidFloatC 6.8s ease-in-out 1.2s infinite;
    }
    .polaroid--c img { object-position: center 30%; }
    .polaroid--c::after { animation-delay: 4.2s; }
    @keyframes polaroidIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes polaroidFloatA {
      0%, 100% { transform: rotate(-8deg) translateY(0); }
      50% { transform: rotate(-5.5deg) translateY(-12px); }
    }
    @keyframes polaroidFloatB {
      0%, 100% { transform: rotate(7deg) translateY(0); }
      50% { transform: rotate(4.5deg) translateY(-10px); }
    }
    @keyframes polaroidFloatC {
      0%, 100% { transform: rotate(-2deg) translateY(0); }
      50% { transform: rotate(1.5deg) translateY(-11px); }
    }
    @keyframes polaroidShine {
      0%, 62% { transform: translateX(-130%); }
      82%, 100% { transform: translateX(130%); }
    }
    .arrival-copy { position: relative; z-index: 1; max-width: 38rem; }
    .arrival-kicker {
      margin: 0 0 0.7rem;
      color: #1a5f4a;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .arrival-copy h1 {
      margin: 0 0 1rem;
      color: #14382c;
      font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
      font-weight: 600;
      font-size: clamp(2.35rem, 4vw, 3.55rem);
      line-height: 1.08;
      letter-spacing: -0.015em;
    }
    .arrival-body {
      margin: 0 0 1.55rem;
      max-width: 34rem;
      color: #3a4c45;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-weight: 500;
      font-size: clamp(1.12rem, 1.5vw, 1.32rem);
      line-height: 1.65;
    }
    .arrival-cta {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      border: 0;
      border-radius: 999px;
      background: #1b5c48;
      color: #fff;
      font-family: var(--font-body);
      font-size: 0.98rem;
      font-weight: 650;
      letter-spacing: 0.01em;
      padding: 0.85rem 1.35rem 0.85rem 1.45rem;
      cursor: pointer;
      box-shadow: 0 10px 24px rgba(27, 92, 72, 0.22);
    }
    .arrival-cta:hover { background: #144a3a; }
    .welcome-scroll {
      display: grid;
      grid-template-columns: minmax(260px, 1.05fr) minmax(280px, 0.92fr);
      grid-template-rows: minmax(calc(100dvh - 8.2rem), auto) auto auto;
      column-gap: 3rem;
      padding: 1.4rem 4vw 0;
      background:
        radial-gradient(ellipse 42% 36% at 12% 18%, rgba(176, 196, 168, 0.35), transparent 70%),
        radial-gradient(ellipse 36% 28% at 92% 8%, rgba(212, 196, 168, 0.28), transparent 70%),
        linear-gradient(#f6f3ec 0, #f6f3ec calc(100dvh - 6.6rem), var(--bg) calc(100dvh - 6.6rem));
    }
    .welcome-scroll .arrival { display: contents; }
    .welcome-scroll .arrival-collage {
      grid-column: 1;
      grid-row: 1;
      align-self: center;
      height: min(540px, 62vh);
      min-height: 420px;
    }
    .welcome-scroll .arrival-copy {
      grid-column: 2;
      grid-row: 1;
      align-self: center;
    }
    .discover-slot { min-height: 3.2rem; }
    .welcome-scroll .arrival-cta.is-following {
      position: fixed;
      top: 6.4rem;
      right: 1.75rem;
      left: auto;
      z-index: 80;
    }
    .welcome-scroll .arrival-mantra {
      position: relative;
      left: auto;
      right: auto;
      bottom: auto;
      grid-column: 1 / -1;
      grid-row: 1;
      align-self: end;
      padding-bottom: 0.35rem;
      z-index: 2;
    }
    .welcome-panel {
      grid-column: 1 / -1;
      position: relative;
      z-index: 1;
      margin-left: -4vw;
      margin-right: -4vw;
      scroll-margin-top: 6.5rem;
      background: var(--bg);
    }
    #welcome-pricing { grid-row: 2; }
    #welcome-contact { grid-row: 3; }
    .arrival-mantra {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 1.15rem;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.7rem;
      margin: 0;
      color: #6d7f76;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.16em;
      text-transform: uppercase;
    }
    .arrival-dot { color: #1a5f4a; }
    :host-context(html[data-memora-lang='ta']) .arrival-kicker,
    :host-context(html[data-memora-lang='ta']) .arrival-copy h1,
    :host-context(html[data-memora-lang='ta']) .arrival-body,
    :host-context(html[data-memora-lang='ta']) .arrival-mantra {
      font-family: 'Noto Sans Tamil', var(--font-body);
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    :host-context(html[data-memora-lang='ta']) .arrival-copy h1 {
      font-size: clamp(1.8rem, 3.2vw, 2.6rem);
      line-height: 1.25;
    }

    @media (prefers-reduced-motion: reduce) {
      .logo { transition: none; }
      .logo:hover { transform: none; }
      .logo-glow,
      .wordmark-text,
      .wordmark-shine {
        animation: none !important;
      }
      .logo-glow { opacity: 0.5; transform: none; }
      .wordmark-text {
        background: linear-gradient(120deg, #0d3d32 0%, #1a5f4a 55%, #3f9077 100%);
        background-size: 100% auto;
      }
      .wordmark-shine { display: none; }
      .polaroid,
      .polaroid::after {
        animation: none !important;
      }
      .polaroid--a { transform: rotate(-8deg); }
      .polaroid--b { transform: rotate(7deg); }
      .polaroid--c { transform: rotate(-2deg); }
    }
    .showcase {
      position: relative;
      overflow: hidden;
      border-bottom: 1px solid rgba(13, 61, 50, 0.08);
      background: linear-gradient(135deg, #0d3d32 0%, #1b5f4b 60%, #2f7e66 100%);
      padding: 0.55rem 0;
    }
    .showcase-ornament {
      position: absolute;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      pointer-events: none;
      opacity: 0.18;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.55) 0%, transparent 70%);
    }
    .showcase-ornament--left {
      left: -48px;
      top: -56px;
    }
    .showcase-ornament--right {
      right: -40px;
      bottom: -64px;
      width: 160px;
      height: 160px;
      opacity: 0.14;
    }
    /* Profile: keep slideshow grid but tighten copy so light hero below stays the focal band */
    .showcase.showcase--profile {
      padding: 0.5rem 0 0.55rem;
    }
    .showcase.showcase--profile .showcase-copy .showcase-kicker {
      margin-bottom: 0.2rem;
      font-size: 0.65rem;
    }
    .showcase.showcase--profile .showcase-copy h2 {
      margin-bottom: 0.2rem;
      font-size: clamp(1rem, 2vw, 1.28rem);
    }
    .showcase.showcase--profile .showcase-copy p {
      font-size: 0.8rem;
      line-height: 1.4;
    }
    .showcase.showcase--profile .gallery-card {
      width: 140px;
    }
    .showcase-content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
      gap: 0.85rem;
      align-items: center;
      padding: 0.55rem 1.5rem;
      color: #fff;
    }
    .showcase-copy {
      text-align: left;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 0.15rem;
      min-height: 0;
    }
    .showcase-kicker {
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 600;
      font-size: 0.68rem;
      color: rgba(255,255,255,0.82);
    }
    .showcase h2 {
      margin: 0;
      color: #fff;
      font-size: clamp(1.02rem, 2.1vw, 1.38rem);
      line-height: 1.22;
    }
    .showcase p {
      margin: 0;
      color: rgba(255,255,255,0.93);
      font-size: 0.8rem;
      line-height: 1.4;
      max-width: 34rem;
    }
    .showcase--guest {
      background: transparent;
      padding: 1.35rem 0 1.15rem;
    }
    .who-we-are {
      max-width: 46rem;
      margin: 0 auto;
      padding: 0.15rem 1.5rem 0.1rem;
      text-align: center;
    }
    .showcase--guest .who-label {
      margin: 0 0 0.35rem;
      color: #1a5f4a;
      font-family: var(--font-body);
      font-style: normal;
      font-weight: 700;
      font-size: clamp(0.68rem, 1vw, 0.78rem);
      letter-spacing: 0.22em;
      line-height: 1.3;
      text-transform: uppercase;
    }
    .showcase--guest .who-title {
      margin: 0 auto 0.4rem;
      max-width: 36rem;
      color: #14382c;
      font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
      font-style: normal;
      font-weight: 600;
      font-size: clamp(1.28rem, 2.2vw, 1.75rem);
      letter-spacing: -0.015em;
      line-height: 1.15;
    }
    .showcase--guest .who-line {
      margin: 0 auto;
      max-width: 40rem;
      color: #3a4c45;
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic;
      font-weight: 500;
      font-size: clamp(0.98rem, 1.35vw, 1.12rem);
      line-height: 1.6;
    }
    :host-context(html[data-memora-lang='ta']) .showcase--guest .who-label,
    :host-context(html[data-memora-lang='ta']) .showcase--guest .who-title,
    :host-context(html[data-memora-lang='ta']) .showcase--guest .who-line {
      font-family: 'Noto Sans Tamil', var(--font-body);
      font-style: normal;
      letter-spacing: 0;
      text-transform: none;
    }
    :host-context(html[data-memora-lang='ta']) .showcase--guest .who-title {
      font-size: clamp(1.15rem, 2vw, 1.45rem);
      line-height: 1.3;
    }
    :host-context(html[data-memora-lang='ta']) .showcase--guest .who-line {
      font-size: clamp(0.92rem, 1.3vw, 1.02rem);
      line-height: 1.7;
    }
    .gallery-window {
      overflow: hidden;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.22);
      background: rgba(0, 0, 0, 0.12);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18);
      align-self: center;
    }
    .gallery-track {
      display: flex;
      gap: 0.45rem;
      width: max-content;
      padding: 0.4rem;
      animation: galleryMove 35s linear infinite;
    }
    .gallery-window:hover .gallery-track {
      animation-play-state: paused;
    }
    .gallery-card {
      width: 168px;
      aspect-ratio: 4 / 3;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.2);
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
      .nav-link-emphasis:not(.active) {
        color: #0d3d32;
        background: #fff;
        border: 1px solid #c5dcd2;
        box-shadow: 0 2px 8px rgba(26, 95, 74, 0.1);
        font-weight: 700;
      }
      .nav-link-emphasis:not(.active):hover {
        color: #0d3d32;
        background: #f7fcfa;
        border-color: #1a5f4a;
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
    .main { min-height: calc(100vh - 160px); padding: 0.55rem 0 1.6rem; }
    @media (max-width: 1024px) {
      .header-inner {
        flex-direction: column;
        gap: 0.75rem;
        align-items: flex-start;
      }
      .nav {
        width: 100%;
        flex-wrap: wrap;
        justify-content: center;
        border-radius: 16px;
      }
      .profile-chevron {
        display: none;
      }
      .profile-trigger {
        padding: 4px;
      }
      .profile-dropdown {
        width: min(240px, calc(100vw - 2rem));
        right: 0;
      }
      .showcase {
        padding: 0.45rem 0;
      }
      .showcase-content {
        grid-template-columns: 1fr;
        padding: 0.5rem 1rem;
        gap: 0.55rem;
      }
      .showcase-copy {
        text-align: center;
        align-items: center;
      }
      .who-we-are {
        padding: 0.1rem 1rem;
      }
      .showcase--guest .who-title {
        font-size: 1.2rem;
      }
      .showcase--guest .who-line {
        font-size: 0.95rem;
      }
      .gallery-card {
        width: 148px;
      }
    }
    @media (max-width: 768px) {
      .welcome-scroll {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto;
        padding: 1.1rem 1.25rem 0;
        background:
          radial-gradient(ellipse 42% 36% at 12% 8%, rgba(176, 196, 168, 0.35), transparent 70%),
          #f6f3ec;
      }
      .welcome-scroll .arrival-collage,
      .welcome-scroll .arrival-copy,
      .welcome-scroll .arrival-mantra,
      .welcome-panel { grid-column: 1; }
      .welcome-scroll .arrival-collage { grid-row: 1; height: 340px; min-height: 300px; }
      .welcome-scroll .arrival-copy {
        grid-row: 2;
        align-self: start;
        padding-top: 0.25rem;
      }
      .welcome-scroll .arrival-cta.is-following {
        top: auto;
        right: 1rem;
        bottom: 1.1rem;
      }
      .welcome-scroll .arrival-mantra { grid-row: 3; position: relative; padding: 1rem 0 1.25rem; }
      .welcome-panel { margin-left: -1.25rem; margin-right: -1.25rem; }
      #welcome-pricing { grid-row: 4; }
      #welcome-contact { grid-row: 5; }
      .arrival {
        grid-template-columns: 1fr;
        min-height: auto;
        padding: 1.25rem 1.25rem 1.5rem;
        gap: 1.25rem;
      }
      .arrival-collage {
        height: 340px;
        min-height: 300px;
        order: -1;
      }
      .arrival-mantra {
        position: static;
        margin-top: 0.4rem;
      }
      .top-bar {
        padding: 0.14rem 1rem;
        font-size: 0.65rem;
      }
      .top-bar-inner {
        gap: 0.3rem;
      }
      .header-inner {
        padding: 0.65rem var(--container-pad, 1rem);
      }
      .wordmark {
        font-size: 1.4rem;
      }
      .nav .nav-link {
        padding: 0.4rem 0.65rem;
        font-size: 0.8125rem;
      }
      .nav-btn {
        padding: 0.45rem 0.75rem;
        font-size: 0.8125rem;
      }
      .lang-switch {
        margin-inline-end: 0;
      }
      .main {
        min-height: calc(100vh - 140px);
        padding: 0.4rem 0 1.25rem;
      }
    }
    @media (max-width: 480px) {
      .logo {
        padding: 0.1rem 0.2rem;
      }
      .wordmark {
        font-size: 1.25rem;
      }
      .brand-mark {
        width: 2.85rem;
        height: 2.85rem;
        margin-right: 0.4rem;
      }
      .nav {
        gap: 0.3rem;
        padding: 0.3rem;
      }
      .nav .nav-link {
        padding: 0.38rem 0.55rem;
        font-size: 0.75rem;
      }
      .lang-btn {
        font-size: 0.625rem;
        padding: 0.3rem 0.42rem;
      }
      .showcase h2 {
        font-size: clamp(1rem, 4.5vw, 1.22rem);
      }
      .showcase p {
        font-size: 0.8rem;
      }
      .gallery-card {
        width: 140px;
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
  sessionExpired = signal(false);
  profileImageUrl = computed(() => this.auth.currentUser()?.profileImageUrl ?? null);
  userDisplayName = computed(() => this.auth.currentUser()?.displayName?.trim() || '');
  userEmail = computed(() => this.auth.currentUser()?.email || '');

  /** Showcase is hidden on profile; profile has its own hero. */
  readonly isProfileRoute = signal(false);
  readonly isHome = signal(true);
  /** Stays on until a guest chooses the feed during this visit. */
  private readonly enteredFeed = signal(false);
  private wasLoggedIn = false;
  /** Guest landing on a fresh visit, until they open the feed. */
  readonly showWelcome = computed(() => !this.auth.isLoggedIn() && this.isHome() && !this.enteredFeed());

  constructor(
    public auth: AuthService,
    public authUi: AuthUiService,
    public i18n: LanguageService,
    private router: Router,
    private host: ElementRef<HTMLElement>
  ) {
    const syncRoute = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      this.isProfileRoute.set(path === '/profile' || path.startsWith('/profile/'));
      this.isHome.set(path === '/' || path === '');
      this.syncSessionNotice();
    };
    syncRoute();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      syncRoute();
      this.closeProfileMenu();
    });
    effect(() => {
      const loggedIn = this.auth.isLoggedIn();
      if (loggedIn) this.enteredFeed.set(true);
      else if (this.wasLoggedIn) this.enteredFeed.set(false);
      this.wasLoggedIn = loggedIn;
    }, { allowSignalWrites: true });
  }

  @HostListener('window:scroll')
  @HostListener('window:resize')
  placeDiscover(): void {
    const btn = this.host.nativeElement.querySelector('.welcome-scroll .arrival-cta') as HTMLElement | null;
    if (!btn) return;
    const slot = btn.parentElement;
    const contact = this.host.nativeElement.querySelector('#welcome-contact');
    if (!slot || !contact || !this.showWelcome()) {
      btn.classList.remove('is-following');
      return;
    }
    const pinLine = 102;
    const slotTop = slot.getBoundingClientRect().top;
    const contactBottom = contact.getBoundingClientRect().bottom;
    btn.classList.toggle('is-following', slotTop < pinLine && contactBottom > pinLine + 72);
  }

  scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  enterFeed(): void {
    this.enteredFeed.set(true);
    const path = this.router.url.split('?')[0].split('#')[0];
    if (path !== '/' && path !== '') {
      void this.router.navigateByUrl('/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  logout(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.closeProfileMenu();
    this.auth.logout();
  }

  dismissSessionNotice() {
    this.sessionExpired.set(false);
  }

  private syncSessionNotice() {
    const url = this.router.parseUrl(this.router.url);
    if (url.queryParams['session'] !== 'expired') return;
    this.sessionExpired.set(true);
    void this.router.navigate([], {
      queryParams: { session: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
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
