import { Pipe, PipeTransform } from '@angular/core';
import type { User, UserProfile } from '../models/user.model';
import { getDisplayName } from '../models/user.model';

@Pipe({
  name: 'userDisplayName',
  standalone: true,
  pure: true
})
export class UserDisplayNamePipe implements PipeTransform {
  transform(value: User | UserProfile | null | undefined, maxLength?: number): string {
    if (!value) {
      return '';
    }
    const firstName: string = ((value as any).firstName || '').toString();
    const lastName: string = ((value as any).lastName || '').toString();
    const name = getDisplayName({ firstName, lastName });
    if (!maxLength || maxLength <= 0 || name.length <= maxLength) {
      return name;
    }
    if (maxLength === 1) {
      return (firstName.trim().charAt(0) || lastName.trim().charAt(0) || '').toUpperCase();
    }
    if (maxLength === 2) {
      const f = firstName.trim().charAt(0) || '';
      const l = lastName.trim().charAt(0) || '';
      return (f + l).toUpperCase();
    }
    return name.slice(0, Math.max(1, maxLength - 1)).trimEnd() + '…';
  }
}


