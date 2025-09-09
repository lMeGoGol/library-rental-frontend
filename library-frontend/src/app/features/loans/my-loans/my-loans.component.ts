import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { finalize, filter, take } from 'rxjs';
import { Loan } from '../../../core/models/loan.model';


@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyLoansComponent implements OnInit {
  loans: Loan[] = [];
  loading = false;
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  constructor(private loanService: LoanService) {}

  ngOnInit() {
    // Wait until we are sure we have a user id (handles edge case when component init happens before token decoded/enriched)
    this.auth.user$.pipe(
      filter(u => !!u?.id),
      take(1)
    ).subscribe(() => {
  this.loadLoans();
    });

    // Safety fallback: if no emission within short time (very unlikely) still attempt
  setTimeout(() => { if (!this.loans.length && !this.loading) { this.loadLoans(); } }, 600);
  }

  private loadLoans() {
    this.loading = true;
    const userId = this.auth.user()?.id;
    const params: any = { page: 1, limit: 100 };
    if (userId) params.reader = userId;
    this.loanService.page(params)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: res => { this.loans = res.items || []; this.cdr.markForCheck(); },
        error: () => { this.loans = []; this.cdr.markForCheck(); }
      });
  }


  displayBook(b: Loan['book']) { return typeof b === 'string' ? b : b.title; }

  trackById(_: number, l: Loan) { return l.id; }

  formatId(id: string | undefined | null): string {
    const s = (id || '').toString();
    if (!s) return '';
    return s.length <= 5 ? s : `…${s.slice(-5)}`;
  }

  copyId(ev: Event, id?: string | null) {
    ev.stopPropagation();
    if (!id) return;
    try { navigator.clipboard.writeText(id); } catch {}
  }

  getBookId(b: Loan['book']): string {
    return typeof b === 'string' ? b : (b?.id || '');
  }

}
