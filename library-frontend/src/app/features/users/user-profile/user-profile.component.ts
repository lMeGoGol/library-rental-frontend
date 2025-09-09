import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';
import { Reservation } from '../../../core/models/reservation.model';
import { ReservationService } from '../../../core/services/reservation.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})

export class UserProfileComponent implements OnInit {
  private auth = inject(AuthService);
  private userService = inject(UserService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private loansApi = inject(LoanService);
  private notify = inject(NotificationService);
  user = this.auth.user();
  viewer = this.auth.user();
  loading = false;
  form!: FormGroup;
  saving = false;
  saved = false;
  fb = inject(FormBuilder);
  savingDiscount = false;
  savedDiscount = false;
  discountDraft: string | null = null;
  canEditDiscount = false;
  // role edit (staff-only on other users)
  roleDraft: 'reader' | 'librarian' | 'admin' = 'reader';
  savingRole = false;
  savedRole = false;
  // viewer context
  isSelf = false;
  isStaff = false;
  currentPwd = '';
  newPwd = '';
  changingPwd = false;
  pwdChanged = false;
  // history
  history: Loan[] = [];
  showHistory = false;
  // reservations (for staff reviewing reader)
  reservations: Reservation[] = [];
  reservationsLoading = false;
  showReservations = false;
  reservationsStatus: '' | 'pending' | 'fulfilled' | 'cancelled' = 'pending';

  private reservationsApi = inject(ReservationService);

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const targetId = idParam || (this.user?.id ?? 'me');
    this.loading = true;
    this.userService.getProfile(targetId).subscribe({
      next: u => {
        this.user = u;
        this.viewer = this.auth.user();
        this.isSelf = !idParam || (this.viewer?.id && this.viewer.id === this.user?.id) || targetId === 'me';
        const role = this.viewer?.role;
        this.isStaff = role === 'admin' || role === 'librarian';
        this.roleDraft = (this.user?.role as any) || 'reader';
        this.initForm();
  this.loadHistory();
  this.maybeLoadReservations();
      },
      complete: () => this.loading = false
    });
  }

  private initForm() {
    if (!this.user) return;
    this.form = this.fb.group({
      lastName: [this.user.lastName || ''],
      firstName: [this.user.firstName || ''],
      middleName: [this.user.middleName || ''],
      address: [this.user.address || ''],
      phone: [this.user.phone || '']
    });
  this.discountDraft = this.user.discountCategory || 'none';
  // Editable discount only when staff edits a reader's profile
  this.canEditDiscount = (this.isStaff && !this.isSelf && this.user.role === 'reader');
  }

  save() {
    if (!this.user || !this.form) return;
    this.saving = true;
    this.saved = false;
    this.userService.update(this.user.id, this.form.value).subscribe({
      next: u => { this.user = u; this.saving = false; this.saved = true; },
      error: () => { this.saving = false; }
    });
  }

  saveDiscount() {
    if (!this.user || !this.discountDraft) return;
    // Readers cannot edit their own discount; staff can edit others
    if (this.isSelf && this.user.role === 'reader') return;
    this.savingDiscount = true;
    this.savedDiscount = false;
    this.userService.setDiscount(this.user.id, this.discountDraft).subscribe({
      next: (u) => { this.user = u; this.savingDiscount = false; this.savedDiscount = true; },
      error: () => { this.savingDiscount = false; }
    });
  }

  saveRole() {
    if (!this.user) return;
    if (!this.isStaff || this.isSelf) return; // only staff can edit others' roles
    this.savingRole = true;
    this.savedRole = false;
    this.userService.setRole(this.user.id, this.roleDraft).subscribe({
      next: u => {
        this.user = u;
        this.roleDraft = (u?.role as any) || this.roleDraft;
        // Recompute discount editability and draft after role change
        this.canEditDiscount = (this.isStaff && !this.isSelf && this.user?.role === 'reader');
        this.discountDraft = this.user?.discountCategory || this.discountDraft || 'none';
        this.savingRole = false;
        this.savedRole = true;
      },
      error: () => { this.savingRole = false; }
    });
  }

  changePassword() {
    if (!this.newPwd || this.newPwd.length < 6) return;
    this.changingPwd = true;
    this.pwdChanged = false;
    if (this.isSelf) {
      this.userService.changeMyPassword(this.currentPwd, this.newPwd).subscribe({
  next: () => { this.currentPwd = ''; this.newPwd = ''; this.changingPwd = false; this.pwdChanged = true; this.notify.success('Пароль змінено'); },
  error: () => { this.changingPwd = false; this.notify.error('Не вдалося змінити пароль'); }
      });
    } else if (this.isStaff && this.user?.id) {
      this.userService.adminChangePassword(this.user.id, this.newPwd).subscribe({
  next: () => { this.currentPwd = ''; this.newPwd = ''; this.changingPwd = false; this.pwdChanged = true; this.notify.success('Пароль користувача оновлено'); },
  error: () => { this.changingPwd = false; this.notify.error('Не вдалося оновити пароль користувача'); }
      });
    } else {
      this.changingPwd = false;
    }
  }

  goBack() { this.location.back(); }

  private loadHistory() {
    // Show history only for reader profiles (self or when staff views a reader)
    if (!this.user || this.user.role !== 'reader') { this.showHistory = false; this.history = []; return; }
    const params: any = { reader: this.user.id };
    this.loansApi.page(params).subscribe({ next: p => { this.history = p.items; this.showHistory = true; } });
  }

  private maybeLoadReservations() {
    // Show reservations only when staff views a reader (not self as staff) OR staff viewing own profile if also reader? Only meaningful for reader role.
    if (!this.isStaff) return;
    if (!this.user || this.user.role !== 'reader') return;
    this.loadReservations();
  }

  loadReservations() {
    if (!this.user?.id) return;
    this.reservationsLoading = true;
    this.showReservations = true;
    this.reservationsApi.getAll({ reader: this.user.id, status: this.reservationsStatus || undefined, page: 1, limit: 100 }).subscribe({
      next: res => { this.reservations = res.items || []; },
      error: () => { this.reservations = []; },
      complete: () => { this.reservationsLoading = false; }
    });
  }

  setReservationsStatus(s: '' | 'pending' | 'fulfilled' | 'cancelled') {
    this.reservationsStatus = s;
    this.loadReservations();
  }

  issueReservation(r: Reservation) {
    if (r.status !== 'pending') return;
    const userId = typeof r.reader === 'string' ? r.reader : r.reader?.id;
    const bookId = typeof r.book === 'string' ? r.book : r.book?.id;
    // Navigate via anchor in template (routerLink) or just build URL
    // Simpler: location change
  (window as any).location.href = `/loans/issue?userId=${userId}&bookId=${bookId}&days=${r.desiredDays}&reservationId=${r.id}`;
  }

  cancelReservation(r: Reservation) {
    if (r.status !== 'pending') return;
    if (!confirm('Скасувати бронювання?')) return;
    this.reservationsApi.cancel(r.id).subscribe({
      next: () => this.loadReservations()
    });
  }

  // template helpers
  formatId(id: string | undefined | null): string {
    const s = (id || '').toString();
    if (!s) return '';
    return s.length <= 5 ? s : `…${s.slice(-5)}`;
  }
  displayBook(b: Loan['book']) { return typeof b === 'string' ? b : (b?.title || ''); }
}