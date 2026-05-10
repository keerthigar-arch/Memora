import { Injectable, computed, signal } from '@angular/core';
import { Lang, MESSAGES } from '../i18n/customer-messages';

const STORAGE_KEY = 'memora_customer_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(this.readInitial());

  /** Angular `DatePipe` locale id */
  readonly dateLocale = computed(() => (this.lang() === 'ta' ? 'ta-IN' : 'en-GB'));

  private readInitial(): Lang {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      return v === 'ta' ? 'ta' : 'en';
    } catch {
      return 'en';
    }
  }

  constructor() {
    this.applyDocumentLang(this.lang());
  }

  setLang(next: Lang): void {
    this.lang.set(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    this.applyDocumentLang(next);
  }

  private applyDocumentLang(code: Lang): void {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = code === 'ta' ? 'ta' : 'en';
    document.documentElement.setAttribute('data-memora-lang', code);
  }

  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    let template = MESSAGES[this.lang()]?.[key] ?? MESSAGES.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        template = template.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v ?? ''));
      }
    }
    return template;
  }

  eventTypeLabel(apiType: string): string {
    if (apiType === 'Funeral') return this.t('eventType.Obituary');
    const map: Record<string, string> = {
      Birthday: 'eventType.Birthday',
      'Puberty Ceremony': 'eventType.PubertyCeremony',
      Wedding: 'eventType.Wedding',
      Anniversary: 'eventType.Anniversary',
      Obituary: 'eventType.Obituary',
      Remembrance: 'eventType.Remembrance',
      Other: 'eventType.Other'
    };
    const msgKey = map[apiType];
    return msgKey ? this.t(msgKey) : apiType;
  }

  pricingSlugLabel(slug: string): string {
    const key = `pricing.slug.${slug}`;
    const localized = MESSAGES[this.lang()]?.[key] ?? MESSAGES.en[key];
    return localized ?? slug;
  }

  wishesSectionTitle(eventType: string | undefined): string {
    const t = eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return this.t('wishes.sectionTributes');
    return this.t('wishes.sectionGeneric');
  }

  wishSenderPlaceholder(eventType: string | undefined): string {
    const t = eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return this.t('wish.placeholder.nameMemorial');
    return this.t('wish.placeholder.nameDefault');
  }

  wishMessagePlaceholder(eventType: string | undefined): string {
    const t = eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return this.t('wish.placeholder.msgMemorial');
    return this.t('wish.placeholder.msgDefault');
  }

  wishSubmitLabel(eventType: string | undefined): string {
    const t = eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return this.t('wish.submitTribute');
    return this.t('wish.submitWish');
  }

  formatTimeAgo(createdAt: string | Date): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diffInSeconds < 60) return this.t('time.justNow');

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      const unit =
        diffInMinutes === 1 ? this.t('time.min', { n: 1 }) : this.t('time.mins', { n: diffInMinutes });
      return this.t('time.ago', { unit });
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      const unit = diffInHours === 1 ? this.t('time.hr', { n: 1 }) : this.t('time.hrs', { n: diffInHours });
      return this.t('time.ago', { unit });
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      const unit = diffInDays === 1 ? this.t('time.day', { n: 1 }) : this.t('time.days', { n: diffInDays });
      return this.t('time.ago', { unit });
    }

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      const unit =
        diffInMonths === 1 ? this.t('time.month', { n: 1 }) : this.t('time.months', { n: diffInMonths });
      return this.t('time.ago', { unit });
    }

    const diffInYears = Math.floor(diffInDays / 365);
    const unit = diffInYears === 1 ? this.t('time.year', { n: 1 }) : this.t('time.years', { n: diffInYears });
    return this.t('time.ago', { unit });
  }
}
