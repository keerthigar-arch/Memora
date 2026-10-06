import { Injectable, effect, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

const ACTIVITY_EVENTS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart'] as const;
/** Ignore repeat pointer noise so the idle clock still advances. */
const ACTIVITY_THROTTLE_MS = 1000;
const POLL_MS = 5000;

/**
 * Signs the current user out after a stretch with no typing, clicks, or pointer movement.
 * Started once from the root component. Guests are not watched.
 */
@Injectable({ providedIn: 'root' })
export class IdleSessionService {
  private readonly auth = inject(AuthService);
  private lastActivity = Date.now();
  private lastRecorded = 0;
  private armed = false;
  private pollId: number | null = null;

  constructor() {
    this.bindActivity();
    effect(() => {
      if (this.auth.isLoggedIn()) this.arm();
      else this.disarm();
    });
  }

  private bindActivity() {
    if (typeof window === 'undefined') return;
    const note = () => this.noteActivity();
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, note, { capture: true, passive: true });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkExpired();
    });
    window.addEventListener('focus', () => this.checkExpired());
  }

  private noteActivity() {
    if (!this.armed) return;
    const now = Date.now();
    if (now - this.lastRecorded < ACTIVITY_THROTTLE_MS) return;
    this.lastRecorded = now;
    this.lastActivity = now;
  }

  private arm() {
    if (this.armed) return;
    this.armed = true;
    this.lastActivity = Date.now();
    this.lastRecorded = this.lastActivity;
    this.pollId = window.setInterval(() => this.checkExpired(), POLL_MS);
  }

  private disarm() {
    this.armed = false;
    if (this.pollId != null) {
      window.clearInterval(this.pollId);
      this.pollId = null;
    }
  }

  private checkExpired() {
    if (!this.armed || !this.auth.isLoggedIn()) return;
    if (Date.now() - this.lastActivity < environment.idleTimeoutMs) return;
    this.disarm();
    this.auth.logout('idle');
  }
}
