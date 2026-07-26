import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  forwardRef,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DayCell {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  iso: string;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="dp" [class.dp-open]="open()" [class.dp-disabled]="disabled">
      <button
        type="button"
        class="dp-trigger"
        [disabled]="disabled"
        [attr.aria-expanded]="open()"
        aria-haspopup="dialog"
        (click)="toggle()"
      >
        <span class="dp-value" [class.dp-placeholder]="!displayLabel()">
          {{ displayLabel() || placeholder }}
        </span>
        <span class="dp-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2.5" />
            <path d="M3 10h18" />
            <path d="M8 3v4M16 3v4" />
            <circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="14.5" r="1" fill="currentColor" stroke="none" />
            <circle cx="15.5" cy="14.5" r="1" fill="currentColor" stroke="none" />
          </svg>
        </span>
      </button>

      @if (open()) {
        <div class="dp-panel" role="dialog" [attr.aria-label]="ariaLabel || 'Choose date'">
          <div class="dp-panel-glow" aria-hidden="true"></div>
          <div class="dp-header">
            <button type="button" class="dp-nav" (click)="shiftMonth(-1)" aria-label="Previous month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div class="dp-title-wrap">
              <button type="button" class="dp-month-btn" (click)="toggleYearPicker()">
                {{ monthLabel() }}
              </button>
              <span class="dp-year">{{ viewYear() }}</span>
            </div>
            <button type="button" class="dp-nav" (click)="shiftMonth(1)" aria-label="Next month">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          @if (yearPicker()) {
            <div class="dp-years">
              <button type="button" class="dp-nav dp-nav-sm" (click)="shiftYearRange(-12)" aria-label="Earlier years">‹</button>
              <div class="dp-year-grid">
                @for (y of yearOptions(); track y) {
                  <button
                    type="button"
                    class="dp-year-cell"
                    [class.active]="y === viewYear()"
                    (click)="pickYear(y)"
                  >{{ y }}</button>
                }
              </div>
              <button type="button" class="dp-nav dp-nav-sm" (click)="shiftYearRange(12)" aria-label="Later years">›</button>
            </div>
          } @else {
            <div class="dp-weekdays">
              @for (d of weekdays; track d) {
                <span>{{ d }}</span>
              }
            </div>
            <div class="dp-grid">
              @for (cell of cells(); track cell.iso + '-' + cell.inMonth) {
                <button
                  type="button"
                  class="dp-day"
                  [class.out]="!cell.inMonth"
                  [class.today]="cell.isToday"
                  [class.selected]="cell.isSelected"
                  (click)="pickDay(cell)"
                >{{ cell.day }}</button>
              }
            </div>
          }

          <div class="dp-footer">
            <button type="button" class="dp-link" (click)="clear()" [disabled]="!valueIso()">Clear</button>
            <button type="button" class="dp-today-btn" (click)="pickToday()">Today</button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; }

    .dp {
      position: relative;
      width: 100%;
    }

    .dp-trigger {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      min-height: 2.85rem;
      padding: 0.7rem 0.95rem;
      border: 1.5px solid var(--border, #e5e2dd);
      border-radius: 12px;
      background:
        linear-gradient(180deg, #ffffff 0%, #fbfaf8 100%);
      color: var(--text, #2c2c2c);
      font-family: var(--font-body, 'DM Sans', system-ui, sans-serif);
      font-size: 0.95rem;
      cursor: pointer;
      transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
      text-align: left;
    }
    .dp-trigger:hover:not(:disabled) {
      border-color: rgba(26, 95, 74, 0.45);
      box-shadow: 0 6px 18px rgba(26, 95, 74, 0.08);
    }
    .dp-open .dp-trigger,
    .dp-trigger:focus-visible {
      outline: none;
      border-color: var(--primary, #1a5f4a);
      box-shadow: 0 0 0 3px rgba(26, 95, 74, 0.16);
    }
    .dp-disabled .dp-trigger {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .dp-value { flex: 1; font-weight: 500; letter-spacing: 0.01em; }
    .dp-placeholder { color: var(--text-muted, #6b6b6b); font-weight: 400; }

    .dp-icon {
      width: 1.35rem;
      height: 1.35rem;
      color: var(--primary, #1a5f4a);
      flex-shrink: 0;
      opacity: 0.9;
    }
    .dp-icon svg { width: 100%; height: 100%; display: block; }

    .dp-panel {
      position: absolute;
      z-index: 40;
      top: calc(100% + 0.45rem);
      left: 0;
      width: min(100%, 320px);
      padding: 0.9rem;
      border-radius: 18px;
      background: #fff;
      border: 1px solid rgba(26, 95, 74, 0.12);
      box-shadow:
        0 18px 40px rgba(15, 31, 26, 0.14),
        0 2px 8px rgba(15, 31, 26, 0.06);
      overflow: hidden;
      animation: dp-in 0.18s ease-out;
    }
    .dp-panel-glow {
      position: absolute;
      inset: 0 0 auto 0;
      height: 72px;
      background: radial-gradient(ellipse at top, rgba(45, 143, 115, 0.14), transparent 70%);
      pointer-events: none;
    }

    @keyframes dp-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .dp-header {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.35rem;
      margin-bottom: 0.75rem;
    }
    .dp-title-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.05rem;
    }
    .dp-month-btn {
      border: 0;
      background: transparent;
      font-family: var(--font-display, 'Playfair Display', Georgia, serif);
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--primary-dark, #0d3d32);
      cursor: pointer;
      padding: 0.1rem 0.4rem;
      border-radius: 8px;
    }
    .dp-month-btn:hover { background: rgba(26, 95, 74, 0.08); }
    .dp-year {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--text-muted, #6b6b6b);
    }

    .dp-nav {
      width: 2rem;
      height: 2rem;
      border-radius: 10px;
      border: 1px solid transparent;
      background: rgba(26, 95, 74, 0.06);
      color: var(--primary, #1a5f4a);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .dp-nav svg { width: 1rem; height: 1rem; }
    .dp-nav:hover {
      background: rgba(26, 95, 74, 0.12);
      border-color: rgba(26, 95, 74, 0.18);
    }
    .dp-nav-sm {
      width: 1.75rem;
      height: 1.75rem;
      font-size: 1rem;
      font-weight: 700;
    }

    .dp-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.15rem;
      margin-bottom: 0.35rem;
    }
    .dp-weekdays span {
      text-align: center;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #8a9590;
      padding: 0.2rem 0;
    }

    .dp-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.2rem;
    }

    .dp-day {
      aspect-ratio: 1;
      border: 0;
      border-radius: 11px;
      background: transparent;
      color: var(--text, #2c2c2c);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease, transform 0.12s ease;
    }
    .dp-day:hover:not(.selected) {
      background: rgba(26, 95, 74, 0.1);
      color: var(--primary-dark, #0d3d32);
    }
    .dp-day.out { color: #b7beb9; }
    .dp-day.today:not(.selected) {
      box-shadow: inset 0 0 0 1.5px rgba(26, 95, 74, 0.45);
      color: var(--primary, #1a5f4a);
      font-weight: 700;
    }
    .dp-day.selected {
      background: linear-gradient(145deg, #2d8f73 0%, #1a5f4a 100%);
      color: #fff;
      font-weight: 700;
      box-shadow: 0 6px 14px rgba(26, 95, 74, 0.28);
      transform: scale(1.04);
    }

    .dp-years {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.35rem;
      align-items: center;
      min-height: 11.5rem;
    }
    .dp-year-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.35rem;
    }
    .dp-year-cell {
      border: 0;
      border-radius: 10px;
      padding: 0.55rem 0.25rem;
      background: rgba(26, 95, 74, 0.05);
      color: var(--text, #2c2c2c);
      font-weight: 600;
      cursor: pointer;
    }
    .dp-year-cell:hover { background: rgba(26, 95, 74, 0.12); }
    .dp-year-cell.active {
      background: linear-gradient(145deg, #2d8f73 0%, #1a5f4a 100%);
      color: #fff;
    }

    .dp-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
      padding-top: 0.65rem;
      border-top: 1px solid rgba(26, 95, 74, 0.1);
    }
    .dp-link {
      border: 0;
      background: transparent;
      color: var(--text-muted, #6b6b6b);
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      border-radius: 8px;
    }
    .dp-link:hover:not(:disabled) { color: var(--primary, #1a5f4a); background: rgba(26, 95, 74, 0.06); }
    .dp-link:disabled { opacity: 0.4; cursor: default; }
    .dp-today-btn {
      border: 0;
      border-radius: 999px;
      padding: 0.4rem 0.9rem;
      background: rgba(26, 95, 74, 0.1);
      color: var(--primary-dark, #0d3d32);
      font-size: 0.8125rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    .dp-today-btn:hover {
      background: var(--primary, #1a5f4a);
      color: #fff;
    }

    @media (max-width: 480px) {
      .dp-panel { width: 100%; }
    }
  `]
})
export class DatePickerComponent implements ControlValueAccessor, OnChanges {
  @Input() placeholder = 'Select a date';
  @Input() ariaLabel = '';
  /** Optional ISO date (yyyy-MM-dd) used only to refresh display if parent resets. */
  @Input() value: string | null = null;

  readonly weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  open = signal(false);
  yearPicker = signal(false);
  viewYear = signal(new Date().getFullYear());
  viewMonth = signal(new Date().getMonth());
  yearAnchor = signal(new Date().getFullYear() - 5);
  valueIso = signal<string | null>(null);
  displayLabel = signal('');
  cells = signal<DayCell[]>([]);
  monthLabel = signal('');
  yearOptions = signal<number[]>([]);

  disabled = false;
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private readonly host: ElementRef<HTMLElement>) {
    this.rebuildCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && this.value !== undefined) {
      this.writeValue(this.value);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(ev.target as Node)) {
      this.open.set(false);
      this.yearPicker.set(false);
      this.onTouched();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.yearPicker.set(false);
    this.onTouched();
  }

  writeValue(value: string | null): void {
    const raw = (value || '').trim();
    const iso = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null;
    this.valueIso.set(iso);
    this.displayLabel.set(iso ? this.formatDisplay(iso) : '');
    if (iso) {
      const [y, m] = iso.split('-').map(Number);
      this.viewYear.set(y);
      this.viewMonth.set(m - 1);
      this.yearAnchor.set(y - 5);
    }
    this.rebuildCalendar();
  }

  registerOnChange(fn: (v: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle(): void {
    if (this.disabled) return;
    const next = !this.open();
    this.open.set(next);
    this.yearPicker.set(false);
    if (next) this.rebuildCalendar();
    if (!next) this.onTouched();
  }

  shiftMonth(delta: number): void {
    let m = this.viewMonth() + delta;
    let y = this.viewYear();
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    this.viewMonth.set(m);
    this.viewYear.set(y);
    this.rebuildCalendar();
  }

  toggleYearPicker(): void {
    const next = !this.yearPicker();
    this.yearPicker.set(next);
    if (next) {
      this.yearAnchor.set(this.viewYear() - 5);
      this.rebuildYearOptions();
    }
  }

  shiftYearRange(delta: number): void {
    this.yearAnchor.set(this.yearAnchor() + delta);
    this.rebuildYearOptions();
  }

  pickYear(year: number): void {
    this.viewYear.set(year);
    this.yearPicker.set(false);
    this.rebuildCalendar();
  }

  pickDay(cell: DayCell): void {
    this.commit(cell.iso);
  }

  pickToday(): void {
    this.commit(this.toIso(new Date()));
  }

  clear(): void {
    this.valueIso.set(null);
    this.displayLabel.set('');
    this.onChange(null);
    this.onTouched();
    this.open.set(false);
    this.yearPicker.set(false);
    this.rebuildCalendar();
  }

  private commit(iso: string): void {
    this.valueIso.set(iso);
    this.displayLabel.set(this.formatDisplay(iso));
    const [y, m] = iso.split('-').map(Number);
    this.viewYear.set(y);
    this.viewMonth.set(m - 1);
    this.onChange(iso);
    this.onTouched();
    this.open.set(false);
    this.yearPicker.set(false);
    this.rebuildCalendar();
  }

  private rebuildCalendar(): void {
    const y = this.viewYear();
    const m = this.viewMonth();
    this.monthLabel.set(this.monthNames[m]);

    const first = new Date(y, m, 1);
    const startPad = first.getDay();
    const start = new Date(y, m, 1 - startPad);
    const selected = this.valueIso();
    const todayIso = this.toIso(new Date());
    const list: DayCell[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = this.toIso(d);
      list.push({
        date: d,
        day: d.getDate(),
        inMonth: d.getMonth() === m,
        isToday: iso === todayIso,
        isSelected: !!selected && iso === selected,
        iso
      });
    }
    this.cells.set(list);
  }

  private rebuildYearOptions(): void {
    const start = this.yearAnchor();
    this.yearOptions.set(Array.from({ length: 12 }, (_, i) => start + i));
  }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDisplay(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
