import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { Book } from '../../../core/models/book.model';
import { User } from '../../../core/models/user.model';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-loan-return',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './loan-return.component.html',
  styleUrls: ['../loan-issue/loan-issue.component.scss']
})
export class LoanReturnComponent implements OnInit {
  returnForm!: FormGroup;
  activeLoans: Loan[] = [];
  selectedLoan: Loan | null = null;
  activeLoading = false;
  activePage = 1;
  activeLimit = 10;
  activePages = 1;
  activeTotal = 0;

  previewPenaltyNow = 0;
  showReturnTotal = false;
  damageLevels: Array<{ value: 'none'|'minor'|'moderate'|'severe'; label: string; fee: number }> = [
    { value: 'none', label: 'Немає', fee: 0 },
  ];

  constructor(private fb: FormBuilder, private loanService: LoanService, private notify: NotificationService) {}

  ngOnInit(): void {
    this.returnForm = this.fb.group({
      loanId: ['', Validators.required],
      damageLevel: ['none', Validators.required],
    });

    this.loanService.getDamageLevels().subscribe(levels => {
      if (levels?.length) this.damageLevels = levels as any;
    });
    this.loadActiveLoans();
  }

  // Active loans pagination
  loadActiveLoans() {
    this.activeLoading = true;
    this.loanService.page({ status: 'issued', page: this.activePage, limit: this.activeLimit }).subscribe({
      next: p => {
        this.activeLoans = p.items || [];
        this.activeTotal = p.total || this.activeLoans.length || 0;
        this.activePages = p.pages || 1;
      },
      error: () => { this.activeLoans = []; this.activeTotal = 0; this.activePages = 1; },
      complete: () => this.activeLoading = false,
    });
  }
  prevActive() { if (this.activePage > 1) { this.activePage--; this.loadActiveLoans(); } }
  nextActive() { if (this.activePage < this.activePages) { this.activePage++; this.loadActiveLoans(); } }

  pickLoan(l: Loan) { this.selectedLoan = l; }
  clearSelected() { this.selectedLoan = null; }

  formatId(id?: string) { return (id || '').slice(-6); }
  getBookTitle(book: Book | string) { return typeof book === 'string' ? book : `${book.title}`; }
  getUserName(user: User | string) { return typeof user === 'string' ? user : `${user.username}`; }

  private currentDamageFee(): number {
    const level = (this.returnForm.value.damageLevel as 'none'|'minor'|'moderate'|'severe') || 'none';
    return this.damageLevels.find(d => d.value === level)?.fee ?? 0;
  }
  get baseWithoutOverdue(): number {
    const fee = this.currentDamageFee();
    const deposit = this.selectedLoan?.deposit ?? 0;
    return Math.max(0, fee - deposit);
  }
  get totalToPay(): number {
    const fee = this.currentDamageFee();
    const deposit = this.selectedLoan?.deposit ?? 0;
    const penalty = this.previewPenaltyNow || 0;
    return Math.max(0, fee + penalty - deposit);
  }

  private daysLeft(date: string | Date): number {
    const due = new Date(date);
    const now = new Date();
    const ms = due.getTime() - now.getTime();
    return Math.floor(ms / (1000 * 60 * 60 * 24));
  }
  dueClass(date: string | Date): 'ok'|'warn'|'danger' {
    const d = this.daysLeft(date);
    if (d < 0) return 'danger';
    if (d <= 1) return 'warn';
    return 'ok';
  }

  previewReturn() {
    const id = (this.selectedLoan?.id || this.returnForm.value.loanId)?.trim();
    if (!id) return;
    this.loanService.previewReturn(id).subscribe({
      next: prev => {
        this.previewPenaltyNow = prev.alreadyReturned ? 0 : (prev.penalty || 0);
        this.showReturnTotal = true;
        const msg = prev.alreadyReturned
          ? 'Вже повернено'
          : (prev.penalty > 0 ? `Прострочка на сьогодні: +₴${prev.penalty}` : 'Прострочки немає');
        this.notify.info?.(msg);
      },
      error: () => this.notify.error('Не вдалося отримати розрахунок')
    });
  }

  doReturn() {
    const id = (this.selectedLoan?.id || this.returnForm.value.loanId)?.trim();
    if (!id) return;
    const level = (this.returnForm.value.damageLevel as 'none'|'minor'|'moderate'|'severe') || 'none';
    const fee = this.damageLevels.find(d => d.value === level)?.fee ?? 0;
    const damaged = level !== 'none';
    const damageFee = fee;
    this.loanService.returnLoan(id, { damaged, damageFee, damageLevel: level } as any).subscribe({
      next: res => {
        const s = res.settlement;
        const msg = `Повернено. Пеня: ₴${s.penalty || 0}. Шкода: ₴${s.damageFee || 0}. До повернення депозиту: ₴${s.depositReturned || 0}. Досплата: ₴${s.extraToPay || 0}.`;
        this.notify.success(msg);
        this.returnForm.reset({ loanId: '', damageLevel: 'none' });
        this.selectedLoan = null;
        this.previewPenaltyNow = 0;
        this.showReturnTotal = false;
        this.loadActiveLoans();
      },
      error: () => this.notify.error('Не вдалося повернути')
    });
  }
}