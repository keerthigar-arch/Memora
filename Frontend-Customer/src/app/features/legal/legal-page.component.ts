import { Component, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <article class="legal-page">
      <header class="legal-hero">
        <div class="container hero-wrap">
          <div class="hero-band">
            <div class="hero-glow" aria-hidden="true"></div>
            <div class="hero-inner">
              <p class="hero-kicker">
                <span class="hero-kicker-rule" aria-hidden="true"></span>
                தmileye
                <span class="hero-kicker-rule" aria-hidden="true"></span>
              </p>
              <h1>{{ titleKey() | t }}</h1>
              <p class="hero-lede">{{ ledeKey() | t }}</p>
              <p class="hero-updated">{{ 'legal.updated' | t }}</p>
            </div>
          </div>
        </div>
      </header>

      <div class="container legal-body">
        @for (n of sections; track n) {
          <section class="legal-section">
            <h2>{{ sectionTitle(n) | t }}</h2>
            <p>{{ sectionBody(n) | t }}</p>
          </section>
        }
      </div>
    </article>
  `,
  styles: [`
    .legal-page {
      min-height: 100%;
      padding-bottom: 2.75rem;
    }

    .legal-hero {
      padding: 0.35rem 0 0;
      margin-bottom: 1.5rem;
    }

    .container {
      max-width: 760px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }

    .hero-wrap {
      display: flex;
      justify-content: center;
    }

    .hero-band {
      position: relative;
      overflow: hidden;
      width: 100%;
      padding: 1.15rem 1.5rem 1.2rem;
      border-radius: 18px;
      background: linear-gradient(152deg, #0e3a30 0%, #164d40 38%, #1f6a53 72%, #287860 100%);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow:
        0 4px 6px rgba(13, 61, 50, 0.06),
        0 18px 38px rgba(13, 61, 50, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }

    .hero-glow {
      position: absolute;
      inset: -35% 10% auto -15%;
      height: 140%;
      background: radial-gradient(ellipse 55% 48% at 78% 18%, rgba(255, 255, 255, 0.14) 0%, transparent 58%);
      pointer-events: none;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
      text-align: center;
    }

    .hero-kicker {
      margin: 0 0 0.4rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-size: 0.62rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.78);
    }

    .hero-kicker-rule {
      display: inline-block;
      width: 1.35rem;
      height: 2px;
      border-radius: 2px;
      background: linear-gradient(90deg, transparent, rgba(212, 165, 116, 0.85), transparent);
    }

    h1 {
      margin: 0 0 0.45rem;
      font-family: var(--font-display);
      font-size: clamp(1.45rem, 3vw, 1.9rem);
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.02em;
      line-height: 1.2;
    }

    .hero-lede {
      margin: 0 auto;
      max-width: 46ch;
      font-size: 0.92rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.84);
    }

    .hero-updated {
      margin: 0.7rem 0 0;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      color: rgba(255, 255, 255, 0.62);
    }

    .legal-body {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .legal-section {
      background: var(--bg-card, #fff);
      border: 1px solid rgba(26, 95, 74, 0.1);
      border-radius: 16px;
      padding: 1.15rem 1.25rem 1.2rem;
      box-shadow: 0 4px 18px rgba(13, 61, 50, 0.05);
    }

    h2 {
      margin: 0 0 0.45rem;
      font-family: var(--font-display);
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--primary, #1a5f4a);
      line-height: 1.3;
    }

    p {
      margin: 0;
      font-size: 0.95rem;
      line-height: 1.65;
      color: #3d4a45;
    }
  `]
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly sections = [1, 2, 3, 4];

  readonly page = toSignal(
    this.route.data.pipe(map((data) => String(data['page'] ?? 'privacy'))),
    { initialValue: 'privacy' }
  );

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    });
  }

  titleKey(): string {
    return `legal.${this.page()}.title`;
  }

  ledeKey(): string {
    return `legal.${this.page()}.lede`;
  }

  sectionTitle(n: number): string {
    return `legal.${this.page()}.s${n}.title`;
  }

  sectionBody(n: number): string {
    return `legal.${this.page()}.s${n}.body`;
  }
}
