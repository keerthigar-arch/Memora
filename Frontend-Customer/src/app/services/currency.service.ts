
// currency.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// ROOT CAUSE OF THE BUG:
//   Your old COUNTRY_CURRENCY_MAP used 2-letter codes as keys: 'US', 'GB', 'LK'
//   But your dropdown sends full names:  'USA', 'United Kingdom', 'Sri Lanka'
//   So getCurrencyForCountry('Sri Lanka') returned null → fell back to £ forever.
//
// THE FIX:
//   Keys are now the EXACT strings from your <option value="..."> dropdown.
// ─────────────────────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  rateFromUSD: number;   // 1 USD = X of this currency
}

// Keys EXACTLY match your dropdown <option value="..."> strings
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyInfo> = {
  'Afghanistan':             { code: 'AFN', symbol: '؋',    name: 'Afghan Afghani',        rateFromUSD: 71.0    },
  'Albania':                 { code: 'ALL', symbol: 'L',     name: 'Albanian Lek',           rateFromUSD: 93.0    },
  'Algeria':                 { code: 'DZD', symbol: 'دج',   name: 'Algerian Dinar',         rateFromUSD: 134.0   },
  'Andorra':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Angola':                  { code: 'AOA', symbol: 'Kz',   name: 'Angolan Kwanza',         rateFromUSD: 830.0   },
  'Argentina':               { code: 'ARS', symbol: '$',    name: 'Argentine Peso',         rateFromUSD: 870.0   },
  'Armenia':                 { code: 'AMD', symbol: '֏',    name: 'Armenian Dram',          rateFromUSD: 387.0   },
  'Australia':               { code: 'AUD', symbol: 'A$',   name: 'Australian Dollar',      rateFromUSD: 1.52    },
  'Austria':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Azerbaijan':              { code: 'AZN', symbol: '₼',    name: 'Azerbaijani Manat',      rateFromUSD: 1.70    },
  'Bahamas':                 { code: 'BSD', symbol: 'B$',   name: 'Bahamian Dollar',        rateFromUSD: 1.00    },
  'Bahrain':                 { code: 'BHD', symbol: 'BD',   name: 'Bahraini Dinar',         rateFromUSD: 0.376   },
  'Bangladesh':              { code: 'BDT', symbol: '৳',    name: 'Bangladeshi Taka',       rateFromUSD: 110.0   },
  'Belarus':                 { code: 'BYN', symbol: 'Br',   name: 'Belarusian Ruble',       rateFromUSD: 3.25    },
  'Belgium':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Belize':                  { code: 'BZD', symbol: 'BZ$',  name: 'Belize Dollar',          rateFromUSD: 2.00    },
  'Benin':                   { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',       rateFromUSD: 603.0   },
  'Bhutan':                  { code: 'BTN', symbol: 'Nu',   name: 'Bhutanese Ngultrum',     rateFromUSD: 83.0    },
  'Bolivia':                 { code: 'BOB', symbol: 'Bs',   name: 'Bolivian Boliviano',     rateFromUSD: 6.91    },
  'Bosnia and Herzegovina':  { code: 'BAM', symbol: 'KM',   name: 'Bosnia Mark',            rateFromUSD: 1.80    },
  'Botswana':                { code: 'BWP', symbol: 'P',    name: 'Botswana Pula',          rateFromUSD: 13.5    },
  'Brazil':                  { code: 'BRL', symbol: 'R$',   name: 'Brazilian Real',         rateFromUSD: 4.97    },
  'Brunei':                  { code: 'BND', symbol: 'B$',   name: 'Brunei Dollar',          rateFromUSD: 1.34    },
  'Bulgaria':                { code: 'BGN', symbol: 'лв',   name: 'Bulgarian Lev',          rateFromUSD: 1.80    },
  'Burkina Faso':            { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',       rateFromUSD: 603.0   },
  'Burundi':                 { code: 'BIF', symbol: 'Fr',   name: 'Burundian Franc',        rateFromUSD: 2850.0  },
  'Cambodia':                { code: 'KHR', symbol: '៛',    name: 'Cambodian Riel',         rateFromUSD: 4100.0  },
  'Cameroon':                { code: 'XAF', symbol: 'CFA',  name: 'Central African CFA',    rateFromUSD: 603.0   },
  'Canada':                  { code: 'CAD', symbol: 'CA$',  name: 'Canadian Dollar',        rateFromUSD: 1.36    },
  'Chad':                    { code: 'XAF', symbol: 'CFA',  name: 'Central African CFA',    rateFromUSD: 603.0   },
  'Chile':                   { code: 'CLP', symbol: '$',    name: 'Chilean Peso',           rateFromUSD: 930.0   },
  'China':                   { code: 'CNY', symbol: '¥',    name: 'Chinese Yuan',           rateFromUSD: 7.24    },
  'Colombia':                { code: 'COP', symbol: '$',    name: 'Colombian Peso',         rateFromUSD: 3900.0  },
  'Congo':                   { code: 'CDF', symbol: 'Fr',   name: 'Congolese Franc',        rateFromUSD: 2750.0  },
  'Costa Rica':              { code: 'CRC', symbol: '₡',    name: 'Costa Rican Colón',      rateFromUSD: 515.0   },
  'Croatia':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Cuba':                    { code: 'CUP', symbol: '$',    name: 'Cuban Peso',             rateFromUSD: 24.0    },
  'Cyprus':                  { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Czech Republic':          { code: 'CZK', symbol: 'Kč',   name: 'Czech Koruna',           rateFromUSD: 23.0    },
  'Denmark':                 { code: 'DKK', symbol: 'kr',   name: 'Danish Krone',           rateFromUSD: 6.88    },
  'Djibouti':                { code: 'DJF', symbol: 'Fr',   name: 'Djiboutian Franc',       rateFromUSD: 177.0   },
  'Dominican Republic':      { code: 'DOP', symbol: 'RD$',  name: 'Dominican Peso',         rateFromUSD: 58.0    },
  'Ecuador':                 { code: 'USD', symbol: '$',    name: 'US Dollar',              rateFromUSD: 1.00    },
  'Egypt':                   { code: 'EGP', symbol: '£',    name: 'Egyptian Pound',         rateFromUSD: 48.0    },
  'El Salvador':             { code: 'USD', symbol: '$',    name: 'US Dollar',              rateFromUSD: 1.00    },
  'Estonia':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Ethiopia':                { code: 'ETB', symbol: 'Br',   name: 'Ethiopian Birr',         rateFromUSD: 57.0    },
  'Finland':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'France':                  { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Gabon':                   { code: 'XAF', symbol: 'CFA',  name: 'Central African CFA',    rateFromUSD: 603.0   },
  'Georgia':                 { code: 'GEL', symbol: '₾',    name: 'Georgian Lari',          rateFromUSD: 2.70    },
  'Germany':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Ghana':                   { code: 'GHS', symbol: '₵',    name: 'Ghanaian Cedi',          rateFromUSD: 15.5    },
  'Greece':                  { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Guatemala':               { code: 'GTQ', symbol: 'Q',    name: 'Guatemalan Quetzal',     rateFromUSD: 7.75    },
  'Guinea':                  { code: 'GNF', symbol: 'Fr',   name: 'Guinean Franc',          rateFromUSD: 8600.0  },
  'Haiti':                   { code: 'HTG', symbol: 'G',    name: 'Haitian Gourde',         rateFromUSD: 133.0   },
  'Honduras':                { code: 'HNL', symbol: 'L',    name: 'Honduran Lempira',       rateFromUSD: 24.7    },
  'Hungary':                 { code: 'HUF', symbol: 'Ft',   name: 'Hungarian Forint',       rateFromUSD: 357.0   },
  'Iceland':                 { code: 'ISK', symbol: 'kr',   name: 'Icelandic Króna',        rateFromUSD: 138.0   },
  'India':                   { code: 'INR', symbol: '₹',    name: 'Indian Rupee',           rateFromUSD: 83.0    },
  'Indonesia':               { code: 'IDR', symbol: 'Rp',   name: 'Indonesian Rupiah',      rateFromUSD: 15800.0 },
  'Iran':                    { code: 'IRR', symbol: '﷼',    name: 'Iranian Rial',           rateFromUSD: 42000.0 },
  'Iraq':                    { code: 'IQD', symbol: 'ع.د',  name: 'Iraqi Dinar',            rateFromUSD: 1310.0  },
  'Ireland':                 { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Israel':                  { code: 'ILS', symbol: '₪',    name: 'Israeli Shekel',         rateFromUSD: 3.70    },
  'Italy':                   { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Jamaica':                 { code: 'JMD', symbol: 'J$',   name: 'Jamaican Dollar',        rateFromUSD: 155.0   },
  'Japan':                   { code: 'JPY', symbol: '¥',    name: 'Japanese Yen',           rateFromUSD: 149.0   },
  'Jordan':                  { code: 'JOD', symbol: 'JD',   name: 'Jordanian Dinar',        rateFromUSD: 0.709   },
  'Kazakhstan':              { code: 'KZT', symbol: '₸',    name: 'Kazakhstani Tenge',      rateFromUSD: 448.0   },
  'Kenya':                   { code: 'KES', symbol: 'KSh',  name: 'Kenyan Shilling',        rateFromUSD: 130.0   },
  'Kuwait':                  { code: 'KWD', symbol: 'KD',   name: 'Kuwaiti Dinar',          rateFromUSD: 0.307   },
  'Kyrgyzstan':              { code: 'KGS', symbol: 'с',    name: 'Kyrgystani Som',         rateFromUSD: 89.0    },
  'Laos':                    { code: 'LAK', symbol: '₭',    name: 'Laotian Kip',            rateFromUSD: 20800.0 },
  'Latvia':                  { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Lebanon':                 { code: 'LBP', symbol: 'ل.ل',  name: 'Lebanese Pound',         rateFromUSD: 89500.0 },
  'Libya':                   { code: 'LYD', symbol: 'LD',   name: 'Libyan Dinar',           rateFromUSD: 4.84    },
  'Lithuania':               { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Luxembourg':              { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Madagascar':              { code: 'MGA', symbol: 'Ar',   name: 'Malagasy Ariary',        rateFromUSD: 4500.0  },
  'Malaysia':                { code: 'MYR', symbol: 'RM',   name: 'Malaysian Ringgit',      rateFromUSD: 4.70    },
  'Maldives':                { code: 'MVR', symbol: 'Rf',   name: 'Maldivian Rufiyaa',      rateFromUSD: 15.4    },
  'Mali':                    { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',       rateFromUSD: 603.0   },
  'Malta':                   { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Mexico':                  { code: 'MXN', symbol: '$',    name: 'Mexican Peso',           rateFromUSD: 17.0    },
  'Moldova':                 { code: 'MDL', symbol: 'L',    name: 'Moldovan Leu',           rateFromUSD: 17.7    },
  'Monaco':                  { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Mongolia':                { code: 'MNT', symbol: '₮',    name: 'Mongolian Tögrög',       rateFromUSD: 3400.0  },
  'Montenegro':              { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Morocco':                 { code: 'MAD', symbol: 'د.م',  name: 'Moroccan Dirham',        rateFromUSD: 10.0    },
  'Mozambique':              { code: 'MZN', symbol: 'MT',   name: 'Mozambican Metical',     rateFromUSD: 63.5    },
  'Myanmar':                 { code: 'MMK', symbol: 'K',    name: 'Myanmar Kyat',           rateFromUSD: 2100.0  },
  'Namibia':                 { code: 'NAD', symbol: 'N$',   name: 'Namibian Dollar',        rateFromUSD: 18.6    },
  'Nepal':                   { code: 'NPR', symbol: '₨',    name: 'Nepalese Rupee',         rateFromUSD: 133.0   },
  'Netherlands':             { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'New Zealand':             { code: 'NZD', symbol: 'NZ$',  name: 'New Zealand Dollar',     rateFromUSD: 1.63    },
  'Nicaragua':               { code: 'NIO', symbol: 'C$',   name: 'Nicaraguan Córdoba',     rateFromUSD: 36.7    },
  'Niger':                   { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',       rateFromUSD: 603.0   },
  'Nigeria':                 { code: 'NGN', symbol: '₦',    name: 'Nigerian Naira',         rateFromUSD: 1580.0  },
  'North Korea':             { code: 'KPW', symbol: '₩',    name: 'North Korean Won',       rateFromUSD: 900.0   },
  'Norway':                  { code: 'NOK', symbol: 'kr',   name: 'Norwegian Krone',        rateFromUSD: 10.5    },
  'Oman':                    { code: 'OMR', symbol: 'ر.ع',  name: 'Omani Rial',             rateFromUSD: 0.385   },
  'Pakistan':                { code: 'PKR', symbol: '₨',    name: 'Pakistani Rupee',        rateFromUSD: 278.0   },
  'Panama':                  { code: 'PAB', symbol: 'B/.',   name: 'Panamanian Balboa',      rateFromUSD: 1.00    },
  'Paraguay':                { code: 'PYG', symbol: '₲',    name: 'Paraguayan Guaraní',     rateFromUSD: 7300.0  },
  'Peru':                    { code: 'PEN', symbol: 'S/',    name: 'Peruvian Sol',           rateFromUSD: 3.73    },
  'Philippines':             { code: 'PHP', symbol: '₱',    name: 'Philippine Peso',        rateFromUSD: 56.5    },
  'Poland':                  { code: 'PLN', symbol: 'zł',   name: 'Polish Złoty',           rateFromUSD: 3.97    },
  'Portugal':                { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Qatar':                   { code: 'QAR', symbol: 'ر.ق',  name: 'Qatari Riyal',           rateFromUSD: 3.64    },
  'Romania':                 { code: 'RON', symbol: 'lei',  name: 'Romanian Leu',           rateFromUSD: 4.58    },
  'Russia':                  { code: 'RUB', symbol: '₽',    name: 'Russian Ruble',          rateFromUSD: 92.0    },
  'Rwanda':                  { code: 'RWF', symbol: 'Fr',   name: 'Rwandan Franc',          rateFromUSD: 1290.0  },
  'Saudi Arabia':            { code: 'SAR', symbol: '﷼',    name: 'Saudi Riyal',            rateFromUSD: 3.75    },
  'Senegal':                 { code: 'XOF', symbol: 'CFA',  name: 'West African CFA',       rateFromUSD: 603.0   },
  'Serbia':                  { code: 'RSD', symbol: 'din',  name: 'Serbian Dinar',          rateFromUSD: 108.0   },
  'Singapore':               { code: 'SGD', symbol: 'S$',   name: 'Singapore Dollar',       rateFromUSD: 1.34    },
  'Slovakia':                { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Slovenia':                { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  'Somalia':                 { code: 'SOS', symbol: 'Sh',   name: 'Somali Shilling',        rateFromUSD: 571.0   },
  'South Africa':            { code: 'ZAR', symbol: 'R',    name: 'South African Rand',     rateFromUSD: 18.6    },
  'South Korea':             { code: 'KRW', symbol: '₩',    name: 'South Korean Won',       rateFromUSD: 1320.0  },
  'Spain':                   { code: 'EUR', symbol: '€',    name: 'Euro',                   rateFromUSD: 0.92    },
  // ★ Sri Lanka — key is exactly 'Sri Lanka' matching your dropdown
  'Sri Lanka':               { code: 'LKR', symbol: 'Rs',   name: 'Sri Lankan Rupee',       rateFromUSD: 305.0   },
  'Sudan':                   { code: 'SDG', symbol: 'ج.س',  name: 'Sudanese Pound',         rateFromUSD: 600.0   },
  'Sweden':                  { code: 'SEK', symbol: 'kr',   name: 'Swedish Krona',          rateFromUSD: 10.3    },
  'Switzerland':             { code: 'CHF', symbol: 'Fr',   name: 'Swiss Franc',            rateFromUSD: 0.896   },
  'Syria':                   { code: 'SYP', symbol: '£',    name: 'Syrian Pound',           rateFromUSD: 13000.0 },
  'Taiwan':                  { code: 'TWD', symbol: 'NT$',  name: 'New Taiwan Dollar',      rateFromUSD: 31.7    },
  'Tanzania':                { code: 'TZS', symbol: 'Sh',   name: 'Tanzanian Shilling',     rateFromUSD: 2520.0  },
  'Thailand':                { code: 'THB', symbol: '฿',    name: 'Thai Baht',              rateFromUSD: 35.0    },
  'Tunisia':                 { code: 'TND', symbol: 'د.ت',  name: 'Tunisian Dinar',         rateFromUSD: 3.10    },
  'Turkey':                  { code: 'TRY', symbol: '₺',    name: 'Turkish Lira',           rateFromUSD: 32.0    },
  'Uganda':                  { code: 'UGX', symbol: 'Sh',   name: 'Ugandan Shilling',       rateFromUSD: 3780.0  },
  'Ukraine':                 { code: 'UAH', symbol: '₴',    name: 'Ukrainian Hryvnia',      rateFromUSD: 38.0    },
  'United Arab Emirates':    { code: 'AED', symbol: 'د.إ',  name: 'UAE Dirham',             rateFromUSD: 3.67    },
  'United Kingdom':          { code: 'GBP', symbol: '£',    name: 'British Pound',          rateFromUSD: 0.79    },
  // ★ USA — key is exactly 'USA' matching your dropdown (NOT 'United States')
  'USA':                     { code: 'USD', symbol: '$',    name: 'US Dollar',              rateFromUSD: 1.00    },
  'Uruguay':                 { code: 'UYU', symbol: '$U',   name: 'Uruguayan Peso',         rateFromUSD: 39.0    },
  'Uzbekistan':              { code: 'UZS', symbol: 'soʻm', name: 'Uzbekistani Som',        rateFromUSD: 12700.0 },
  'Venezuela':               { code: 'VES', symbol: 'Bs.S', name: 'Venezuelan Bolívar',     rateFromUSD: 36.5    },
  'Vietnam':                 { code: 'VND', symbol: '₫',    name: 'Vietnamese Dong',        rateFromUSD: 24500.0 },
  'Yemen':                   { code: 'YER', symbol: '﷼',    name: 'Yemeni Rial',            rateFromUSD: 1700.0  },
  'Zambia':                  { code: 'ZMW', symbol: 'ZK',   name: 'Zambian Kwacha',         rateFromUSD: 26.0    },
  'Zimbabwe':                { code: 'ZWL', symbol: 'Z$',   name: 'Zimbabwean Dollar',      rateFromUSD: 322.0   },
  'Other':                   { code: 'USD', symbol: '$',    name: 'US Dollar',              rateFromUSD: 1.00    },
};

// Currencies that display without decimal places
const NO_DECIMAL_CURRENCIES = new Set([
  'JPY','KRW','IDR','VND','LAK','IRR','SYP','MMK','GNF','COP',
  'PYG','UGX','TZS','MGA','MNT','KHR','LBP','CDF','BIF','RWF',
  'SOS','NGN','KPW'
]);

@Injectable({ providedIn: 'root' })
export class CurrencyService {

  /**
   * Look up currency by full country name.
   * Must exactly match the <option value="..."> in your dropdown.
   * e.g. 'Sri Lanka' → LKR, 'USA' → USD, 'United Kingdom' → GBP
   */
  getCurrencyForCountry(countryName: string): CurrencyInfo | null {
    return COUNTRY_CURRENCY_MAP[countryName] ?? null;
  }

  /**
   * Convert a USD price to the local currency.
   * e.g. $0.99 × 305 = Rs301.95 for Sri Lanka
   */
  convertFromUSD(usdPrice: number, currency: CurrencyInfo): number {
    return usdPrice * currency.rateFromUSD;
  }

  /**
   * Format an amount with the correct symbol and decimal places.
   * e.g. Rs301.95  |  $0.99  |  ¥148  |  £0.78
   */
  formatPrice(amount: number, currency: CurrencyInfo): string {
    const decimals = NO_DECIMAL_CURRENCIES.has(currency.code) ? 0 : 2;
    return `${currency.symbol}${amount.toFixed(decimals)}`;
  }

  /**
   * Format a per-day label.
   * e.g. Rs301.95/day
   */
  formatPricePerDay(totalAmount: number, days: number, currency: CurrencyInfo): string {
    const perDay = days > 0 ? totalAmount / days : 0;
    return `${this.formatPrice(perDay, currency)}/day`;
  }
}