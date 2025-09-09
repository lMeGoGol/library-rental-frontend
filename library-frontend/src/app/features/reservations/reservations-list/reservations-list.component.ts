import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../core/services/reservation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Reservation } from '../../../core/models/reservation.model';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-reservations-list',
  standalone: true,
  imports: [CommonModule, RouterModule, PagerComponent],
  templateUrl: './reservations-list.component.html',
  styleUrls: ['./reservations-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationsListComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  limit = 10;
  total = 0;
  pages = 1;
  status: '' | 'pending' | 'fulfilled' | 'cancelled' = 'pending';

  constructor(private reservationsSvc: ReservationService, private router: Router, private notify: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = null;
    this.reservationsSvc.getAll({ page: this.page, limit: this.limit, status: this.status || undefined }).subscribe({
      next: res => {
        this.reservations = res.items;
        this.total = Number(res.total || res.items.length);
        this.pages = Number(res.pages || 1);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Помилка завантаження';
        this.reservations = [];
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.pages) { this.page++; this.load(); } }

  setStatus(s: string) { this.status = (s as any) || ''; this.page = 1; this.load(); }

  issue(r: Reservation) {
    if (r.status !== 'pending') return;
    const userObj: any = r.reader;
    const bookObj: any = r.book;
    const userId = typeof userObj === 'string' ? userObj : (userObj?.id || userObj?._id || '');
    const bookId = typeof bookObj === 'string' ? bookObj : (bookObj?.id || bookObj?._id || '');
    const valid24 = /^[a-fA-F0-9]{24}$/;
    if (!valid24.test(userId) || !valid24.test(bookId)) {
      this.notify.error('Некоректні ідентифікатори броні');
      return;
    }
    this.router.navigate(['/loans/issue'], { queryParams: { userId, bookId, days: r.desiredDays, reservationId: r.id } });
  }

  cancel(r: Reservation) {
    if (r.status !== 'pending') return;
    if (!confirm('Скасувати бронювання?')) return;
    this.reservationsSvc.cancel(r.id).subscribe({
      next: () => this.load()
    });
  }

  trackById(_: number, r: Reservation) { return r.id; }

  // Template helpers (type guards)
  // Accept objects that may come populated from backend with either id or _id
  isObj(v: any): v is { id?: string; _id?: string; username?: string } { return v && typeof v === 'object'; }
  getId(v: any): string { return this.isObj(v) ? (v.id || v._id || '') : (typeof v === 'string' ? v : ''); }
  getUsername(v: any): string { return this.isObj(v) ? (v.username || v.id || v._id || '') : (typeof v === 'string' ? v : ''); }
}
