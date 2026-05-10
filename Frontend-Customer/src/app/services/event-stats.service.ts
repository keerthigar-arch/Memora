import { Injectable, signal } from '@angular/core';
import { ApiService } from './api.service';

export interface CountryCount {
  country: string;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class EventStatsService {
  countrySummary = signal<CountryCount[]>([]);
  countryStatsLoaded = signal(false);
  /** When set (e.g. from header chips), the public feed is scoped to this country; other filters apply on top. */
  selectedCountry = signal<string | null>(null);

  constructor(private api: ApiService) {
    this.loadFromApi();
  }

  setSelectedCountry(country: string | null) {
    const next = country?.trim() || null;
    this.selectedCountry.set(next);
  }

  loadFromApi() {
    this.countryStatsLoaded.set(false);
    this.api.getCountryStats().subscribe({
      next: (stats) => {
        this.countrySummary.set(stats ?? []);
        this.countryStatsLoaded.set(true);
      },
      error: () => {
        this.countrySummary.set([]);
        this.countryStatsLoaded.set(true);
      }
    });
  }
}
