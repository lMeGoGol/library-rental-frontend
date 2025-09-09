import { Pipe, PipeTransform } from '@angular/core';
import { Book } from '../../core/models/book.model';

@Pipe({ name: 'bookTitle', standalone: true })
export class BookTitlePipe implements PipeTransform {
  transform(value: string | Book | { id: string; title?: string }): string {
    if (!value) return '';
    return typeof value === 'string' ? value : (value.title ?? value.id);
  }
}
