import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CurrencyService, Currency } from '../../services/currency.service';

@Component({
  selector: 'app-currency-selector',
  templateUrl: './currency-selector.component.html',
  styleUrls: ['./currency-selector.component.css']
})
export class CurrencySelectorComponent implements OnInit {
  currencies: Currency[] = [];
  selectedCurrency: Currency;
  @Output() currencyChanged = new EventEmitter<Currency>();

  constructor(private currencyService: CurrencyService) {
    this.selectedCurrency = this.currencyService.getSelectedCurrency();
  }

  ngOnInit(): void {
    this.currencyService.currencies$.subscribe(currencies => {
      this.currencies = currencies;
    });
  }

  onCurrencyChange(currency: Currency): void {
    this.selectedCurrency = currency;
    this.currencyService.setSelectedCurrency(currency);
    this.currencyChanged.emit(currency);
  }

  trackByCode(index: number, currency: Currency): string {
    return currency.code;
  }
}