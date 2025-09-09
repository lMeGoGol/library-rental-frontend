import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../core/services/reservation.service';
import { RouterModule } from '@angular/router';
import { Reservation } from '../../../core/models/reservation.model';
import { NotificationService } from '../../../core/services/notification.service';
import { BookTitlePipe } from '../../../shared/pipes/book-title.pipe';
import { PagerComponent } from '../../../shared/components/pager/pager.component';


@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [CommonModule, RouterModule, BookTitlePipe, PagerComponent],
  templateUrl: './my-reservations.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  loading = false;
  page = 1;
  limit = 10;
  total = 0;
  showCancelCol = false;

  constructor(private reservationService: ReservationService, private notify: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.reservationService.getMine({ page: this.page, limit: this.limit }).subscribe({
      next: res => {
        this.reservations = res.items;
        this.total = res.total ?? res.items.length;
        this.showCancelCol = this.reservations.some(r => r.status === 'cancelled');
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.reservations = []; this.cdr.markForCheck(); },
    });
  }

  nextPage() { if (this.reservations.length < this.limit) return; this.page++; this.load(); }
  prevPage() { if (this.page <= 1) return; this.page--; this.load(); }

  cancel(r: Reservation) {
    if (r.status !== 'pending') return;
    if (!confirm('Скасувати бронь?')) return;
    this.reservationService.cancel(r.id).subscribe({
      next: () => { this.notify.success('Скасовано'); this.load(); },
      error: () => this.notify.error('Не вдалося скасувати'),
    });
  }

  trackById(_: number, r: Reservation) { return r.id; }

  getBookId(r: Reservation): string {
    const b: any = r.book;
    if (!b) return '';
    if (typeof b === 'string') return b;
    return b.id || b._id || '';
  }

  getRemaining(r: Reservation): string {
    if (r.status !== 'pending') return '—';
    const b: any = r.book;
    const until = b?.reservedUntil;
    if (!until) return '—';
    try {
      const end = new Date(until).getTime();
      const now = Date.now();
      if (isNaN(end) || end <= now) return 'менше хвилини';
      const diff = end - now;
      const mins = Math.floor(diff / 60000);
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      if (hrs > 0) return `${hrs}г ${rem}хв`;
      if (mins >= 1) return `${mins}хв`;
      const secs = Math.floor((diff % 60000)/1000);
      return `${secs}s`;
    } catch { return ''; }
  }
}
