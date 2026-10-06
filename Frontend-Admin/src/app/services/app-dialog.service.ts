import { Injectable, signal } from '@angular/core';

export type AppDialogTone = 'default' | 'danger' | 'warning';

export interface AppDialogRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string | null;
  tone: AppDialogTone;
}

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  private readonly current = signal<AppDialogRequest | null>(null);
  private resolver: ((accepted: boolean) => void) | null = null;

  readonly request = this.current.asReadonly();

  confirm(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    tone?: AppDialogTone;
  }): Promise<boolean> {
    this.settle(false);
    return new Promise((resolve) => {
      this.resolver = resolve;
      this.current.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        tone: options.tone ?? 'default'
      });
    });
  }

  alert(options: {
    title: string;
    message: string;
    confirmLabel?: string;
    tone?: AppDialogTone;
  }): Promise<void> {
    this.settle(false);
    return new Promise((resolve) => {
      this.resolver = () => resolve();
      this.current.set({
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel ?? 'OK',
        cancelLabel: null,
        tone: options.tone ?? 'warning'
      });
    });
  }

  choose(accepted: boolean): void {
    this.settle(accepted);
  }

  private settle(accepted: boolean): void {
    const resolve = this.resolver;
    this.resolver = null;
    this.current.set(null);
    resolve?.(accepted);
  }
}
