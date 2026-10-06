import { Component, ElementRef, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppDialogService } from '../../services/app-dialog.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialogs.request(); as req) {
      <div class="dialog-backdrop" (click)="dialogs.choose(false)">
        <div
          class="dialog-card"
          [class.dialog-card--danger]="req.tone === 'danger'"
          [class.dialog-card--warning]="req.tone === 'warning'"
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          aria-describedby="app-dialog-message"
          (click)="$event.stopPropagation()"
          (keydown.escape)="onEscape($event)"
        >
          <div class="dialog-mark" aria-hidden="true">
            @if (req.tone === 'danger') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <path d="M12 8v5" stroke-linecap="round"/>
                <circle cx="12" cy="16.5" r="0.8" fill="currentColor" stroke="none"/>
                <path d="M10.3 4.8 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0Z" stroke-linejoin="round"/>
              </svg>
            } @else if (req.tone === 'warning') {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 8v5" stroke-linecap="round"/>
                <circle cx="12" cy="16.2" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
            } @else {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 11v5" stroke-linecap="round"/>
                <circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
            }
          </div>
          <h2 id="app-dialog-title">{{ req.title }}</h2>
          <p id="app-dialog-message">{{ req.message }}</p>
          <div class="dialog-actions">
            @if (req.cancelLabel) {
              <button type="button" class="dialog-btn dialog-btn--ghost" (click)="dialogs.choose(false)">
                {{ req.cancelLabel }}
              </button>
            }
            <button
              #confirmBtn
              type="button"
              class="dialog-btn"
              [class.dialog-btn--danger]="req.tone === 'danger'"
              (click)="dialogs.choose(true)"
            >
              {{ req.confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .dialog-backdrop {
      position: fixed;
      inset: 0;
      z-index: 4000;
      display: grid;
      place-items: center;
      padding: 1.25rem;
      background: rgba(15, 28, 24, 0.46);
      backdrop-filter: blur(3px);
    }
    .dialog-card {
      width: min(100%, 440px);
      background: #fff;
      border-radius: 18px;
      padding: 1.5rem 1.5rem 1.25rem;
      box-shadow: 0 24px 60px rgba(13, 40, 32, 0.22);
      border: 1px solid rgba(26, 95, 74, 0.12);
    }
    .dialog-mark {
      width: 44px;
      height: 44px;
      border-radius: 14px;
      display: grid;
      place-items: center;
      margin-bottom: 0.85rem;
      background: #e8f4ef;
      color: #1a5f4a;
    }
    .dialog-mark svg { width: 22px; height: 22px; }
    .dialog-card--danger .dialog-mark { background: #fdecec; color: #9f1239; }
    .dialog-card--warning .dialog-mark { background: #fff6e8; color: #9a6700; }
    h2 {
      margin: 0 0 0.4rem;
      font-family: var(--font-display, Georgia, serif);
      font-size: 1.35rem;
      line-height: 1.25;
      color: #14241e;
    }
    p {
      margin: 0;
      color: #4d5c56;
      font-size: 0.95rem;
      line-height: 1.55;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.6rem;
      margin-top: 1.25rem;
    }
    .dialog-btn {
      border: none;
      border-radius: 999px;
      min-height: 42px;
      padding: 0.5rem 1.05rem;
      font: inherit;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      background: #1a5f4a;
      color: #fff;
    }
    .dialog-btn:hover { background: #0d3d32; }
    .dialog-btn--ghost {
      background: #fff;
      color: #1a3a30;
      border: 1px solid #d5e0db;
    }
    .dialog-btn--ghost:hover { background: #f4f8f6; }
    .dialog-btn--danger { background: #9f1239; }
    .dialog-btn--danger:hover { background: #881337; }
    @media (max-width: 520px) {
      .dialog-actions { flex-direction: column-reverse; }
      .dialog-btn { width: 100%; }
    }
  `]
})
export class AppDialogComponent {
  private readonly confirmBtn = viewChild<ElementRef<HTMLButtonElement>>('confirmBtn');

  constructor(readonly dialogs: AppDialogService) {
    effect((onCleanup) => {
      const open = this.dialogs.request();
      if (!open) return;
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const timer = window.setTimeout(() => this.confirmBtn()?.nativeElement.focus(), 0);
      onCleanup(() => {
        window.clearTimeout(timer);
        document.body.style.overflow = previous;
      });
    });
  }

  onEscape(event: Event): void {
    event.stopPropagation();
    this.dialogs.choose(false);
  }
}
