import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../../core/services/notification.service';
import { finalize } from 'rxjs';
import { Page } from '../../../core/models/page.model';


@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  limit = 10;
  total = 0;
  pages = 1;
  selected: User | null = null;
  roleDraft: string | null = null; // kept for compatibility but editing disabled
  discountDraft: string | null = null;
  // profile drafts
  firstNameDraft: string = '';
  lastNameDraft: string = '';
  middleNameDraft: string = '';
  addressDraft: string = '';
  phoneDraft: string = '';
  q: string = '';
  roleFilter: '' | 'admin' | 'librarian' | 'reader' = '';
  savedRole = false;
  savedDiscount = false;
  savedProfile = false;

  viewerRole: string | null = null;

  constructor(private userService: UserService, private location: Location, private notify: NotificationService, private cdr: ChangeDetectorRef, private auth: AuthService) {}

  ngOnInit() {
    this.viewerRole = this.auth.user()?.role || null;
    this.load();
  }

  load() {
    this.loading = true;
    this.error = null;
    const params: any = { page: this.page, limit: this.limit };
    if (this.q) params.q = this.q;
    // Librarian can see only readers
    if (this.viewerRole === 'librarian') {
      params.role = 'reader';
    } else if (this.roleFilter) {
      params.role = this.roleFilter;
    }
    this.userService
      .page(params)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe({
        next: (p: Page<User>) => { this.users = p.items; this.total = Number(p.total || this.users.length); this.pages = Number(p.pages || 1); this.cdr.markForCheck(); },
        error: (e) => { this.error = (e?.error?.error?.message) || 'Помилка завантаження'; this.users = []; this.cdr.markForCheck(); },
      });
  }

  prev() { if (this.page > 1) { this.page--; this.load(); } }
  next() { if (this.page < this.pages) { this.page++; this.load(); } }

  select(u: User) {
    this.selected = u;
    this.roleDraft = u.role;
    this.discountDraft = u.discountCategory || 'none';
  this.firstNameDraft = u.firstName || '';
  this.lastNameDraft = u.lastName || '';
  this.middleNameDraft = u.middleName || '';
  this.addressDraft = u.address || '';
  this.phoneDraft = u.phone || '';
    this.savedRole = false;
    this.savedDiscount = false;
  this.savedProfile = false;
  }

  // Role editing disabled per new requirement
  saveRole() { this.notify.info('Зміну ролі вимкнено'); }

  saveDiscount() {
    if (!this.selected || !this.discountDraft) return;
    this.userService.setDiscount(this.selected.id, this.discountDraft).subscribe({
      next: (u) => {
        this.selected = u;
        this.updateLocal(u);
        this.savedDiscount = true;
        this.notify.success('Знижку оновлено ✅');
        this.cdr.markForCheck();
        setTimeout(() => { this.savedDiscount = false; this.cdr.markForCheck(); }, 2000);
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'Не вдалося оновити знижку';
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  saveProfile() {
    if (!this.selected) return;
    const payload: Partial<User> = {
      firstName: this.firstNameDraft?.trim() || undefined,
      lastName: this.lastNameDraft?.trim() || undefined,
      middleName: this.middleNameDraft?.trim() || undefined,
      address: this.addressDraft?.trim() || undefined,
      phone: this.phoneDraft?.trim() || undefined,
    };
    this.userService.update(this.selected.id, payload).subscribe({
      next: (u) => {
        this.selected = u;
        this.updateLocal(u);
        this.savedProfile = true;
        this.notify.success('Профіль збережено ✅');
        this.cdr.markForCheck();
        setTimeout(() => { this.savedProfile = false; this.cdr.markForCheck(); }, 2000);
      },
      error: (err) => {
        const msg = err?.error?.error?.message || 'Не вдалося зберегти профіль';
        this.notify.error(msg);
        this.cdr.markForCheck();
      }
    });
  }

  updateLocal(updated: User) {
    const i = this.users.findIndex(x => x.id === updated.id);
    if (i >= 0) this.users[i] = updated;
  }

  onSearch(value: string) {
    this.q = (value || '').trim();
    this.page = 1;
    this.load();
  }

  onRoleFilterChange(value: string) {
  if (this.viewerRole === 'librarian') return; // ignore changes; forced to readers only
  this.roleFilter = (value as any) || '';
  this.page = 1;
  this.load();
  }

  trackById(_: number, u: User) { return u.id; }

  closeEditor() {
    this.selected = null;
    this.savedRole = false;
    this.savedDiscount = false;
    this.savedProfile = false;
    this.cdr.markForCheck();
  }

  async copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      this.notify.success('ID скопійовано');
    } catch {
      this.notify.error('Не вдалося скопіювати ID');
    }
  }
}
