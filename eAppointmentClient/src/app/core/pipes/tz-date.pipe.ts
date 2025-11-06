import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'tzDate',
    standalone: true
})
export class TzDatePipe implements PipeTransform {
    transform(value: Date | string | number | null | undefined, timeZone: string = 'Europe/Istanbul', options?: Intl.DateTimeFormatOptions): string {
        if (value === null || value === undefined) return '';
        const date = value instanceof Date ? value : new Date(value);
        if (isNaN(date.getTime())) return '';

        const fmtOptions: Intl.DateTimeFormatOptions = options ?? {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        };
        return new Intl.DateTimeFormat('tr-TR', { ...fmtOptions, timeZone }).format(date).replace(',', '');
    }
}


