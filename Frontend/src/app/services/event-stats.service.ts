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

  constructor(private api: ApiService) {
    this.loadFromApi();
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
