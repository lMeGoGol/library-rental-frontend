import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../../core/services/reservation.service';
import { Reservation } from '../../../core/models/reservation.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-reservations-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './reservations-admin.component.html',
  styleUrls: ['./reservations-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReservationsAdminComponent {
  status: '' | 'pending' | 'fulfilled' | 'cancelled' = 'pending';
  q = '';
  page = 1;
  pages = 1;
  total = 0;
  limit = 15;
  loading = false;
  reservations: Reservation[] = [];
  selected: Reservation | null = null;
  cancelReason = '';
  showCancel = false;

  constructor(private api: ReservationService, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getAll({ page: this.page, limit: this.limit, status: this.status || undefined, q: this.q || undefined }).subscribe({
      next: res => { this.reservations = res.items; this.total = Number(res.total||this.reservations.length); this.pages = Number(res.pages||1); },
      error: () => { this.reservations = []; },
      complete: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }
  setStatus(s: string) { this.status = (s as any) || ''; this.page = 1; this.load(); }
  prev() { if (this.page>1) { this.page--; this.load(); } }
  next() { if (this.page<this.pages) { this.page++; this.load(); } }
  trackById(_: number, r: Reservation) { return r.id; }

  openCancel(r: Reservation) { this.selected = r; this.cancelReason=''; this.showCancel = true; }
  closeCancel() { this.showCancel = false; this.selected = null; this.cancelReason=''; }
  confirmCancel() {
    if (!this.selected) return; if (!confirm('Підтвердити скасування?')) return;
    this.api.cancel(this.selected.id, this.cancelReason || undefined).subscribe({
      next: () => { this.closeCancel(); this.load(); },
      error: () => { this.closeCancel(); }
    });
  }
  issue(r: Reservation) {
    if (r.status !== 'pending') return;
    const reader: any = r.reader;
    const book: any = r.book;
    const userId = typeof reader === 'string' ? reader : (reader?.id || reader?._id || '');
    const bookId = typeof book === 'string' ? book : (book?.id || book?._id || '');
    const valid24 = /^[a-fA-F0-9]{24}$/;
    if (!valid24.test(userId) || !valid24.test(bookId)) {
      return; // silently ignore or could alert
    }
    window.location.href = `/loans/issue?userId=${userId}&bookId=${bookId}&days=${r.desiredDays}&reservationId=${r.id}`;
  }

  userName(r: Reservation) { return typeof r.reader === 'string' ? r.reader : (r.reader?.username || ''); }
  bookTitle(r: Reservation) { return typeof r.book === 'string' ? r.book : (r.book?.title || ''); }
}
