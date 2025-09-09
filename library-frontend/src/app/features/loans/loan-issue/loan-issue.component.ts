import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { LoanService } from '../../../core/services/loan.service';
import { UserService } from '../../../core/services/user.service';
import { BookService } from '../../../core/services/book.service';
import { User } from '../../../core/models/user.model';
import { Book } from '../../../core/models/book.model';
import { NotificationService } from '../../../core/services/notification.service';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ReservationService } from '../../../core/services/reservation.service';
import { LOAN_MAX_DAYS, LOAN_MIN_DAYS, PAGE_DEFAULT_LIMIT } from '../../../core/models/constants';


@Component({
  selector: 'app-loan-issue',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './loan-issue.component.html',
  styleUrls: ['./loan-issue.component.scss']
})

export class LoanIssueComponent implements OnInit {
  users: User[] = [];
  books: Book[] = [];
  issuing = false;
  loadingRef = true;
  // Issue-only component now
  issueMode: 'date' | 'days' = 'date';
  selectedDays: number | null = null;
  daysInputError: string | null = null;
  quickDays: number[] = [3,5,7,10,14,21,30,45,LOAN_MAX_DAYS];

  form!: FormGroup;

  minDueDate = '';
  previewDays = 0;
  previewDiscount = 0;
  previewTotalRent = 0;
  previewDeposit = 0;
  previewPayableNow = 0;
  baseRent = 0; // орендна вартість без знижки (розрахована)
  // (Return logic removed)

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private userService: UserService,
    private bookService: BookService,
  private notify: NotificationService,
  private location: Location,
  private route: ActivatedRoute,
  private auth: AuthService,
  private reservationService: ReservationService
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      userId: ['', Validators.required],
      bookId: ['', Validators.required],
      dueDate: ['', [Validators.required]]
    });

    this.minDueDate = this.tomorrowISO();
    // Only readers can receive loans now
    this.userService.getAll({ role: 'reader' }).subscribe(users => {
      this.users = users.filter(u => u.role === 'reader');
      this.updateLoadingRef();
    });
  this.bookService.list().subscribe((books: Book[]) => {
      this.books = books.filter((b: Book) => b.available);
      this.updateLoadingRef();
    });

  // Keep equal page sizes for visual parity
  this.booksLimit = this.readersLimit;

  // load readers and available books lists (for quick picking)
  this.loadReaders();
  this.loadAvailableBooks();


  this.form.valueChanges.subscribe(() => this.updatePreview());

    // prefill from query params (reservation)
    const qp = this.route.snapshot.queryParamMap;
    const userId = qp.get('userId');
    const bookId = qp.get('bookId');
    const daysStr = qp.get('days');
    const days = daysStr ? Number(daysStr) : undefined;
    const reservationId = qp.get('reservationId');
    if (reservationId) {
      // store for potential auto-cancel use
      (this as any)._reservationId = reservationId;
    }
    if (userId || bookId) {
      this.form.patchValue({ userId: userId || '', bookId: bookId || '' });
      // Prefetch and inject user / book so they appear even if not on current page
      if (userId) {
        this.userService.getById(userId).subscribe(u => {
          if (u.role === 'reader' && !this.readers.find(r => r.id === u.id)) {
            this.readers = [u, ...this.readers];
          }
        });
      }
      if (bookId) {
        this.bookService.getById(bookId).subscribe(b => {
          const exists = this.booksAvail.find(x => x.id === b.id);
          // Always surface the preselected book so that the form reflects it, even if currently unavailable
          if (!exists) {
            this.booksAvail = [b, ...this.booksAvail];
          }
        });
      }
    }
    // if days provided, set dueDate from days
    if (days && Number.isInteger(days) && days > 0) {
      this.issueMode = 'days';
      this.selectedDays = Math.min(60, Math.max(1, days));
      // due date will be computed in updatePreview
      this.updatePreview();
    }
  }

  private isValidObjectId(id?: string): boolean {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id.trim());
  }

  private setIdError(ctrlName: 'userId'|'bookId', value: string) {
    const ctrl = this.form.get(ctrlName);
    if (!ctrl) return;
    const errors = { ...(ctrl.errors || {}) } as any;
    delete errors.invalidId;
    const v = (value || '').trim();
    if (v && !this.isValidObjectId(v)) {
      errors.invalidId = true;
      ctrl.setErrors(errors);
    } else {
      // if there are other errors, keep them; else clear
      const hasOther = Object.keys(errors).length > 0;
      ctrl.setErrors(hasOther ? errors : null);
    }
  }

  private updateLoadingRef() {
    if (this.users.length >= 0 && this.books.length >= 0) this.loadingRef = false;
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Обовʼязкове поле';
    if (c.errors?.['min']) return 'Занадто мало';
    if (c.errors?.['max']) return 'Занадто багато';
    return 'Невірне значення';
  }

  private tomorrowISO() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private updatePreview() {
  const { userId, bookId } = this.form.value as { userId: string; bookId: string; dueDate: string };
    let dueDate = this.form.value.dueDate as string;
  // validate ids locally to avoid backend CastError
  const userOk = this.isValidObjectId(userId);
  const bookOk = this.isValidObjectId(bookId);
  this.setIdError('userId', userId);
  this.setIdError('bookId', bookId);
    // derive dueDate from selected days if needed
    if (this.issueMode === 'days') {
      const dCount = Number(this.selectedDays || 0);
  if (userId && bookId && Number.isInteger(dCount) && dCount >= LOAN_MIN_DAYS && dCount <= LOAN_MAX_DAYS) {
        const d = new Date();
        d.setDate(d.getDate() + dCount);
        dueDate = d.toISOString().slice(0, 10);
        if (this.form.value.dueDate !== dueDate) {
          this.form.patchValue({ dueDate }, { emitEvent: false });
        }
      } else {
        dueDate = '' as any;
        if (this.form.value.dueDate) {
          this.form.patchValue({ dueDate: '' }, { emitEvent: false });
        }
      }
    }
  if (!userOk || !bookOk || !userId || !bookId || !dueDate) { this.previewDays = this.previewDiscount = this.previewTotalRent = this.previewDeposit = this.previewPayableNow = 0; return; }
    this.loanService.issuePreview({ userId, bookId, dueDate }).subscribe({
      next: p => {
        this.previewDays = p.days;
        this.previewDiscount = p.discountPercent;
        this.previewTotalRent = p.totalRent;
        // Вирахуємо базову оренду без знижки (якщо є знижка)
        if (p.discountPercent && p.discountPercent > 0) {
          const denom = (100 - p.discountPercent) / 100;
          this.baseRent = Math.round(p.totalRent / (denom || 1));
        } else {
          this.baseRent = p.totalRent;
        }
        this.previewDeposit = p.deposit;
        this.previewPayableNow = p.payableNow;
      },
      error: () => { this.previewDays = this.previewDiscount = this.previewTotalRent = this.previewDeposit = this.previewPayableNow = this.baseRent = 0; }
    });
  }

  // helper to render blank rows to keep table heights equal
  fillRows(current: number, limit: number) {
    const n = Math.max(0, (limit || 0) - (current || 0));
    return Array(n).fill(0);
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  const { userId, bookId } = this.form.value as { userId: string; bookId: string; dueDate: string };
  if (!this.isValidObjectId(userId) || !this.isValidObjectId(bookId)) {
      this.setIdError('userId', userId);
      this.setIdError('bookId', bookId);
      return;
    }
  const days = this.issueMode === 'days' ? Number(this.selectedDays || 0) : this.previewDays;
    if (!Number.isInteger(days) || days < LOAN_MIN_DAYS || days > LOAN_MAX_DAYS) {
      this.notify.error('Оберіть коректну дату повернення (1–60 днів)');
      return;
    }
  // Переконаємось що попередній розрахунок актуальний
  this.updatePreview();
  this.issuing = true;
    const reservationId = (this as any)._reservationId as string | undefined;
    this.loanService.issue({ userId, bookId, days } as any).subscribe({
      next: res => {
        this.notify.success('Видано. До оплати зараз: ' + res.payableNow + '₴');
        this.form.reset({ userId: '', bookId: '', dueDate: '' });
        this.updatePreview();
        if (reservationId) {
          // clear stored id after success
          (this as any)._reservationId = undefined;
        }
      },
      error: (e) => {
        const msg = (e?.error?.error?.message || e?.error?.message || '').toString();
        // Detect book unavailability / already issued scenario
        const conflict = /недоступ/i.test(msg) || /unavailable/i.test(msg) || /вже видан/i.test(msg) || /issued/i.test(msg);
        if (conflict && reservationId) {
          this.reservationService.autoCancel(reservationId, 'Книга вже видана або недоступна').subscribe({
            next: () => this.notify.error('Бронювання скасовано: книга недоступна'),
            error: () => this.notify.error('Книга недоступна. Не вдалося авто-скасувати бронювання')
          });
          (this as any)._reservationId = undefined;
        } else {
          this.notify.error('Не вдалося видати');
        }
      },
      complete: () => this.issuing = false
    });
  }

  // UI helpers
  setDays(d: number) {
    this.issueMode = 'days';
    this.selectedDays = d;
    // clear manual date to avoid confusion
    this.form.patchValue({ dueDate: '' });
    this.updatePreview();
  }

  onDaysInput(value: string) {
    this.issueMode = 'days';
    const v = Number(value);
    if (!value) {
      this.daysInputError = null;
      this.selectedDays = null;
      this.updatePreview();
      return;
    }
  if (!Number.isInteger(v) || v < LOAN_MIN_DAYS || v > LOAN_MAX_DAYS) {
      this.daysInputError = '1–60';
      this.selectedDays = null;
      this.updatePreview();
      return;
    }
    this.daysInputError = null;
    this.selectedDays = v;
    this.form.patchValue({ dueDate: '' });
    this.updatePreview();
  }

  switchMode(mode: 'date' | 'days') {
    this.issueMode = mode;
    if (mode === 'date') {
      this.selectedDays = null;
    }
  if (mode === 'days' && (!this.selectedDays || this.selectedDays < LOAN_MIN_DAYS)) {
      // sensible default to keep the form valid once reader & book are chosen
      this.selectedDays = 7;
    }
    this.updatePreview();
  }

  goBack() { this.location.back(); }


  // helpers for table rendering
  formatId(id?: string) { return (id || '').slice(-6); }
  getBookTitle(book: Book | string) { return typeof book === 'string' ? book : `${book.title}`; }
  getUserName(user: User | string) { return typeof user === 'string' ? user : `${user.username}`; }



  // Readers list (only readers)
  readers: User[] = [];
  readersLoading = false;
  readersPage = 1;
  readersPages = 1;
  readersTotal = 0;
  readersLimit = PAGE_DEFAULT_LIMIT;
  readersQ = '';
  loadReaders() {
    this.readersLoading = true;
    this.userService.page({ role: 'reader', page: this.readersPage, limit: this.readersLimit, q: this.readersQ || undefined }).subscribe({
      next: p => {
        this.readers = p.items || [];
        this.readersTotal = p.total || this.readers.length || 0;
        this.readersPages = p.pages || 1;
      },
      error: () => { this.readers = []; this.readersTotal = 0; this.readersPages = 1; },
      complete: () => this.readersLoading = false,
    });
  }
  setReadersSearch(q: string) { this.readersQ = (q || '').trim(); this.readersPage = 1; this.loadReaders(); }
  prevReaders() { if (this.readersPage > 1) { this.readersPage--; this.loadReaders(); } }
  nextReaders() { if (this.readersPage < this.readersPages) { this.readersPage++; this.loadReaders(); } }
  pickReader(u: User) {
    const prev = this.form.value.userId;
    if (prev !== u.id) {
      this.form.patchValue({ userId: u.id, bookId: '', dueDate: '' });
      this.issueMode = 'date';
      this.selectedDays = null;
      this.previewDays = this.previewDiscount = this.previewTotalRent = this.previewDeposit = this.previewPayableNow = 0;
    }
    this.updatePreview();
  }

  // Available books list
  booksAvail: Book[] = [];
  booksLoading = false;
  booksPage = 1;
  booksPages = 1;
  booksTotal = 0;
  booksLimit = PAGE_DEFAULT_LIMIT;
  booksQ = '';
  loadAvailableBooks() {
    this.booksLoading = true;
    this.bookService.page({ available: true, page: this.booksPage, limit: this.booksLimit, q: this.booksQ || undefined }).subscribe({
      next: p => {
  const items = p.items || [];
  // Extra safety: hide items that have no available copies
  this.booksAvail = items.filter(b => (b.available ?? true) && ((b.availableCount ?? (b.available ? 1 : 0)) > 0));
        this.booksTotal = p.total || this.booksAvail.length || 0;
        this.booksPages = p.pages || 1;
      },
      error: () => { this.booksAvail = []; this.booksTotal = 0; this.booksPages = 1; },
      complete: () => this.booksLoading = false,
    });
  }
  setBooksSearch(q: string) { this.booksQ = (q || '').trim(); this.booksPage = 1; this.loadAvailableBooks(); }
  prevBooks() { if (this.booksPage > 1) { this.booksPage--; this.loadAvailableBooks(); } }
  nextBooks() { if (this.booksPage < this.booksPages) { this.booksPage++; this.loadAvailableBooks(); } }
  pickBook(b: Book) {
    this.form.patchValue({ bookId: b.id });
    if (this.issueMode === 'date') {
      // keep user-selected date; no change
    } else {
      // ensure dueDate is derived from days
      this.form.patchValue({ dueDate: '' });
    }
    this.updatePreview();
  }
}
