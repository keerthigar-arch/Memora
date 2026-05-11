import { Component, signal } from '@angular/core';
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
        <a href="tel:+18001234567" class="top-bar-phone">+1 800-123-4567</a>
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
          <a class="nav-link" routerLink="/pricing/obituary/srilanka" routerLinkActive="active">{{ 'nav.pricing' | t }}</a>
          <a class="nav-link" routerLink="/contact" routerLinkActive="active">{{ 'nav.contact' | t }}</a>
          @if (auth.isLoggedIn()) {
            <a class="nav-link" routerLink="/profile" routerLinkActive="active">{{ 'nav.profile' | t }}</a>
            <button type="button" class="nav-btn nav-btn-ghost" (click)="auth.logout()">{{ 'nav.logout' | t }}</button>
          } @else {
            <button type="button" class="nav-link nav-link-muted nav-auth-btn" (click)="authUi.openLogin()">
              {{ 'nav.login' | t }}
            </button>
            <button type="button" class="nav-btn nav-btn-primary" (click)="authUi.openRegister()">{{ 'nav.register' | t }}</button>
          }
        </nav>
      </div>
    </header>

    <section class="showcase" [class.showcase--profile]="isProfileRoute()">
      <div class="container showcase-content">
        <div class="showcase-copy">
          <p class="showcase-kicker">{{ 'showcase.kicker' | t }}</p>
          <h2>{{ 'showcase.title' | t }}</h2>
          <p>{{ 'showcase.subtitle' | t }}</p>
        </div>
        <div class="gallery-window" aria-hidden="true">
          <div class="gallery-track">
            <span class="gallery-card i1"></span>
            <span class="gallery-card i2"></span>
            <span class="gallery-card i3"></span>
            <span class="gallery-card i4"></span>
            <span class="gallery-card i5"></span>
            <span class="gallery-card i6"></span>
            <span class="gallery-card i8"></span>
            <span class="gallery-card i4"></span>
            <span class="gallery-card i2"></span>
            <span class="gallery-card i6"></span>
            <span class="gallery-card i1"></span>
            <span class="gallery-card i7"></span>
            <span class="gallery-card i5"></span>
            <span class="gallery-card i3"></span>
            <span class="gallery-card i5"></span>
            <span class="gallery-card i2"></span>
            <span class="gallery-card i7"></span>
            <span class="gallery-card i1"></span>
            <span class="gallery-card i4"></span>
            <span class="gallery-card i8"></span>
            <span class="gallery-card i3"></span>
            <span class="gallery-card i6"></span>
          </div>
        </div>
      </div>
    </section>

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
      width: 174px;
      aspect-ratio: 4 / 3;
      border-radius: 11px;
      background-size: cover;
      background-position: center;
      border: 1px solid rgba(255, 255, 255, 0.35);
      box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
      flex: 0 0 auto;
      position: relative;
      overflow: hidden;
    }
    .i1 { background-image: url('/assets/Indian+Wedding+Couple+Photoshoot+_+Mint+Room+Studios+Toronto-30.webp'); } /* wedding */
    .i2 { background-image: url('/assets/Pre+wedding+Photoshoot+Chennai+local+Train+Vintage+vibe.webp'); } /* wedding */
    .i3 { background-image: url('/assets/Oonjal_-_pinterest_480x480.webp'); } /* wedding */
    .i4 { background-image: url('/assets/relationship-romantic-birthday-cakes-for-boyfriend_1245d4fc-1e47-4dcb-8a41-5eb0a88b5d38.webp'); } /* birthday */
    .i5 { background-image: url('/assets/pngtree-couple-celebrating-birthday-with-cake-outdoors-during-golden-sunset-image_18416861.webp'); } /* birthday */
    .i6 { background-image: url('/assets/free-photos-a-lovely-moment-of-a-couple-celebrating-a-birthday-together-they-are-both-smiling-and-sitting-at-a-d-th-100374893.jpg'); } /* birthday */
    .i7 { background-image: url('/assets/obituary-card-1.png'); } /* obituary */
    .i8 { background-image: url('/assets/obituary-card-2.png'); } /* obituary */
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
        width: 150px;
      }
    }
  `]
})
export class CustomerLayoutComponent {
  readonly env = environment;

  /** Country chips are feed-only; slideshow showcase stays visible on profile too. */
  readonly isProfileRoute = signal(false);

  constructor(
    public stats: EventStatsService,
    public auth: AuthService,
    public authUi: AuthUiService,
    public i18n: LanguageService,
    private router: Router
  ) {
    const syncRoute = () => {
      const path = this.router.url.split('?')[0].split('#')[0];
      this.isProfileRoute.set(path === '/profile' || path.startsWith('/profile/'));
    };
    syncRoute();
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(syncRoute);
  }
}
