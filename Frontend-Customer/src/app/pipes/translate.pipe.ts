import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 't',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private readonly lang = inject(LanguageService);

  transform(key: string, params?: Record<string, string | number | null | undefined> | null): string {
    this.lang.lang();
    return this.lang.t(key, params ?? undefined);
  }
}
