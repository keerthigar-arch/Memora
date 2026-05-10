import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CurrencyService, Currency, PriceInfo } from '../../services/currency.service';

@Component({
  selector: 'app-display-duration',
  templateUrl: './display-duration.component.html',
  styleUrls: ['./display-duration.component.css']
})
export class DisplayDurationComponent implements OnInit {
  @Output() durationSelected = new EventEmitter<any>();
  
  prices: PriceInfo[] = [];
  selectedDuration: number | null = null;
  selectedCurrency: Currency;
  loading = false;

  constructor(private currencyService: CurrencyService) {
    this.selectedCurrency = this.currencyService.getSelectedCurrency();
  }

  ngOnInit(): void {
    this.loadPrices(this.selectedCurrency.code);
    
    this.currencyService.selectedCurrency$.subscribe(currency => {
      this.selectedCurrency = currency;
      this.loadPrices(currency.code);
    });
  }

  loadPrices(currencyCode: string): void {
    this.loading = true;
    this.currencyService.getPrices(currencyCode).subscribe({
      next: (prices) => {
        this.prices = prices;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading prices:', error);
        this.loading = false;
      }
    });
  }

  selectDuration(duration: number): void {
    this.selectedDuration = duration;
    const selectedPrice = this.prices.find(p => p.duration === duration);
    
    this.durationSelected.emit({
      duration: duration,
      amount: selectedPrice?.amount,
      currency: this.selectedCurrency,
      formattedAmount: selectedPrice?.formattedAmount
    });
  }

  isSelected(duration: number): boolean {
    return this.selectedDuration === duration;
  }

  getDailyRateClass(price: PriceInfo): string {
    return price.dailyRate < 1 ? 'good-value' : '';
  }
}