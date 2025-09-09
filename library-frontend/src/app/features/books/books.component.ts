import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../core/services/book.service';
import { Book } from '../../core/models/book.model';
import { NotificationService } from '../../core/services/notification.service';
import { Router, RouterModule } from '@angular/router';
import { HasRoleDirective } from '../../shared/directives/has-role.directive';
import { PagerComponent } from '../../shared/components/pager/pager.component';
import { ReservationService } from '../../core/services/reservation.service';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';


@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, RouterModule, HasRoleDirective, PagerComponent],
  templateUrl: './books.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class BooksComponent implements OnInit, OnDestroy {
  books: Book[] = [];
  q = '';
  page = 1;
  pageSize = 10;
  total = 0;
  totalPages = 1;
  loading = false;
  error: string | null = null;
  sortBy: 'title' | 'author' | 'rentPrice' | 'createdAt' = 'title';
  sortDir: 'asc' | 'desc' = 'asc';
  private auth = inject(AuthService);
  // how to shorten IDs in the list: 'first' or 'last'
  private idShortMode: 'first' | 'last' = 'last';
  constructor(private bookService: BookService, private reservations: ReservationService, private notify: NotificationService, private router: Router, private cdr: ChangeDetectorRef) {}
  ngOnInit() {
    this.load();
    this.startCountdownTicker();
  }
  private tickerId: any;
  private startCountdownTicker() {
    this.tickerId = setInterval(() => {
      const anyReserved = this.books.some(b => b.isReserved && b.reservedUntil);
      if (anyReserved) this.cdr.markForCheck();
  }, 30000); // update every 30s for smoother countdown
  }
  ngOnDestroy() { if (this.tickerId) clearInterval(this.tickerId); }

  delete(book: Book) {
    if (!confirm(`Видалити книгу "${book.title}"?`)) return;
    this.bookService.remove(book.id).subscribe({
      next: () => { this.notify.success('Книгу видалено'); this.load(); },
      error: () => this.notify.error('Не вдалося видалити')
    });
  }

  trackById(_: number, b: Book) { return b.id; }

  onSearch(value: string) {
    this.q = value.trim();
    this.page = 1;
    this.load();
  }

  nextPage() {
    if (this.page < this.totalPages) { this.page++; this.load(); }
  }

  prevPage() {
    if (this.page > 1) { this.page--; this.load(); }
  }

  private load() {
    this.loading = true;
    this.error = null;
  const params: any = { page: this.page, limit: this.pageSize, q: this.q || undefined, sortBy: this.sortBy, order: this.sortDir };
  // Show ALL books to readers (grey out unavailable in UI); keep existing filtering for performance? We keep all.
    this.bookService
      .page(params)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
      next: (res) => {
        this.books = res.items;
        this.total = Number(res.total || this.books.length);
        this.totalPages = Number(res.pages || Math.max(1, Math.ceil((this.total || 0) / this.pageSize)));
          this.cdr.markForCheck();
      },
      error: (e) => {
        this.error = (e?.error?.error?.message) || 'Помилка завантаження книг';
        this.notify.error(this.error || 'Помилка завантаження книг');
        this.books = [];
        this.cdr.markForCheck();
      },
    });
  }

  setSort(by: string) {
    const allowed = ['title','author','rentPrice','createdAt'];
    if (!allowed.includes(by)) return;
    this.sortBy = by as any;
    this.page = 1;
    this.load();
  }

  toggleDir() {
    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    this.page = 1;
    this.load();
  }

  get isEditor() { return this.auth.hasRole(['admin','librarian']); }
  onRowClick(book: Book, ev: MouseEvent) {
    if (!this.isEditor) return;
    // If click originated from an interactive element, skip (buttons/links already handle it)
    const target = ev.target as HTMLElement;
    const interactive = target.closest('a,button,input,select,textarea');
    if (interactive) return;
    this.router.navigate(['/books/edit', book.id]);
  }

  reserve(book: Book) {
    const input = prompt(`Скільки днів хочете забронювати «${book.title}»?`, '7');
    if (!input) return;
    const desiredDays = Number(input);
    if (!Number.isInteger(desiredDays) || desiredDays <= 0) {
      this.notify.error('Некоректна кількість днів');
      return;
    }
    this.reservations.create({ bookId: book.id, desiredDays }).subscribe({
      next: () => this.notify.success('Додано в чергу бронювання'),
      error: (e) => {
        const msg = (e?.error?.error?.message) || 'Не вдалося забронювати';
        this.notify.error(msg);
      }
    });
  }

  formatId(id: string | undefined | null): string {
    const s = (id || '').toString();
    if (!s) return '';
    if (s.length <= 5) return s;
    return this.idShortMode === 'first' ? `${s.slice(0, 5)}…` : `…${s.slice(-5)}`;
  }

  copyId(ev: MouseEvent, id: string) {
    ev.stopPropagation();
    if (!id) return;
    try {
      navigator.clipboard.writeText(id);
      this.notify.success?.('ID скопійовано');
    } catch {
    }
  }

  getReserveRemaining(iso: string): string {
    try {
      const end = new Date(iso).getTime();
      const now = Date.now();
      if (isNaN(end) || end <= now) return 'менше хвилини';
      const diffMs = end - now;
      const mins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(mins / 60);
      const remMin = mins % 60;
      if (hrs > 0) return `${hrs}г ${remMin}хв`;
      if (mins < 60) {
        const secs = Math.floor((diffMs % 60000) / 1000);
        if (mins < 1) return `${secs} с`;
        return `${mins}хв ${secs}s`;
      }
      return `${remMin} хв`;
    } catch { return ''; }
  }

  release(book: Book) {
    if (!confirm('Звільнити бронь для цієї книги?')) return;
    this.bookService.releaseReservation(book.id).subscribe({
      next: res => { this.notify.success('Бронь знято'); this.load(); },
      error: e => this.notify.error(e?.error?.error?.message || 'Не вдалося')
    });
  }
}