import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { NotificationService } from '../../../core/services/notification.service';
import { BookTitlePipe } from '../../../shared/pipes/book-title.pipe';
import { UserNamePipe } from '../../../shared/pipes/user-name.pipe';
import { PagerComponent } from '../../../shared/components/pager/pager.component';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-loan-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BookTitlePipe, UserNamePipe, PagerComponent],
  templateUrl: './loan-list.component.html',
  styleUrls: ['./loan-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class LoanListComponent implements OnInit {
  loans: Loan[] = [];
  loading = false;
  status: 'all' | 'issued' | 'returned' = 'all';
  overdueMode = false;
  page = 1;
  limit = 10;
  total = 0;
  filterReaderId = '';
  filterBookId = '';
  sortBy: 'issueDate' | 'expectedReturnDate' | 'status' = 'issueDate';
  sortDir: 'asc' | 'desc' = 'desc';

  constructor(private loanService: LoanService, private notify: NotificationService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading = true;
    if (this.overdueMode) {
      this.loanService
        .listOverdue({ page: this.page, limit: this.limit })
        .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
        .subscribe({
          next: res => { this.loans = res.items; },
          error: (e) => {
            this.loans = [];
            const msg = e?.error?.error?.message || 'Помилка завантаження прострочених позик';
            this.notify.error(msg);
          }
        });
      return;
    }
    const params: any = {};
    if (this.status !== 'all') params.status = this.status;
    if (this.filterReaderId?.trim()) params.reader = this.filterReaderId.trim();
    if (this.filterBookId?.trim()) params.book = this.filterBookId.trim();
    this.loanService
      .page({ ...params, page: this.page, limit: this.limit, sortBy: this.sortBy, order: this.sortDir })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => { this.loans = res.items; },
        error: (e) => {
          this.loans = [];
          const msg = e?.error?.error?.message || 'Помилка завантаження позик';
          this.notify.error(msg);
        }
      });
  }


  setStatus(value: string) {
    const v = (value || 'all').toLowerCase();
    if (v === this.status) return;
    if (v === 'issued' || v === 'returned' || v === 'all') {
      this.status = v;
      this.overdueMode = false;
  this.page = 1;
      this.load();
    }
  }

  toggleOverdue() {
    this.overdueMode = !this.overdueMode;
  this.page = 1;
    this.load();
  }

  returnLoan(loan: Loan) {
    if (loan.status !== 'issued') return;
    this.loanService.previewReturn(loan.id).subscribe({
      next: prev => {
        if (prev.alreadyReturned) { this.notify.info?.('Вже повернено'); return; }
        const msg = prev.penalty > 0 ? `Повернути книгу? Прострочка: +₴${prev.penalty}` : 'Повернути книгу?';
        if (!confirm(msg)) return;
        this.loanService.returnLoan(loan.id, {}).subscribe({
          next: res => {
            this.notify.success('Повернено');
            this.loans = this.loans.map(l => l.id === loan.id ? res.loan : l);
          },
          error: () => this.notify.error('Не вдалося повернути')
        });
      },
  error: () => this.notify.error('Не вдалося отримати розрахунок')
    });
  }

  renew(loan: Loan) {
    if (loan.status !== 'issued') return;
    const input = prompt('На скільки днів продовжити?', '7');
    if (!input) return;
    const extraDays = Number(input);
    if (!Number.isInteger(extraDays) || extraDays <= 0) {
      this.notify.error('Некоректна кількість днів');
      return;
    }
    this.loanService.renew(loan.id, extraDays).subscribe({
      next: updated => {
        this.notify.success('Продовжено');
        this.loans = this.loans.map(l => l.id === loan.id ? updated : l);
      },
      error: () => this.notify.error('Не вдалося продовжити')
    });
  }

  displayBook(b: Loan['book']) { return typeof b === 'string' ? b : b.title; }
  displayReader(r: Loan['reader']) { return typeof r === 'string' ? r : r.username; }

  nextPage() { if (this.loans.length < this.limit) return; this.page++; this.load(); }
  prevPage() { if (this.page <= 1) return; this.page--; this.load(); }

  applyFilters() { this.page = 1; this.load(); }
  clearFilters() { this.filterReaderId = ''; this.filterBookId = ''; this.page = 1; this.load(); }

  trackById(_: number, l: Loan) { return l.id; }

  setSort(by: string) {
    const allowed = ['issueDate','expectedReturnDate','status'];
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

  formatId(id: string | undefined | null): string {
    const s = (id || '').toString();
    if (!s) return '';
    return s.length <= 5 ? s : `…${s.slice(-5)}`;
  }

  copyId(ev: Event, id?: string | null) {
    ev.stopPropagation();
    if (!id) return;
    try {
      navigator.clipboard.writeText(id);
      this.notify.success?.('ID скопійовано');
    } catch {}
  }

  getBookId(b: Loan['book']): string {
    return typeof b === 'string' ? b : (b?.id || '');
  }

  // Helper type guards for template to avoid TS "never" inference
  isObj(v: any): v is { id: string; username?: string } { return v && typeof v === 'object'; }
  getId(v: any): string { return this.isObj(v) ? (v.id || '') : (typeof v === 'string' ? v : ''); }
  getUsername(v: any): string { return this.isObj(v) ? (v.username || v.id || '') : (typeof v === 'string' ? v : ''); }
}
