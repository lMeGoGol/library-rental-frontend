import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../core/models/user.model';

@Pipe({ name: 'userName', standalone: true })
export class UserNamePipe implements PipeTransform {
  transform(value: string | User | { id: string; username?: string }): string {
    if (!value) return '';
    return typeof value === 'string' ? value : (value.username ?? value.id);
  }
}
