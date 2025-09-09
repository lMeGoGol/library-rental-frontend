import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { BooksComponent } from './features/books/books.component';
import { guestGuard } from './core/guards/guest.guard';
import { authRoleGuard } from './core/guards/auth-role.guard';
import { ROLES_ALL, ROLES_STAFF, ROLES_READER } from './core/models/constants';
import { UserEditComponent } from './features/users/user-edit/user-edit.component';
import { UserListComponent } from './features/users/user-list/user-list.component';
import { LoanListComponent } from './features/loans/loan-list/loan-list.component';
import { MyLoansComponent } from './features/loans/my-loans/my-loans.component';
import { LoanIssueComponent } from './features/loans/loan-issue/loan-issue.component';
import { LoanReturnComponent } from './features/loans/loan-return/loan-return.component';
import { BookFormComponent } from './features/books/book-form/book-form.component';
import { ForbiddenComponent } from './shared/components/forbidden.component';
import { UserProfileComponent } from './features/users/user-profile/user-profile.component';
import { MyReservationsComponent } from './features/reservations/my-reservations/my-reservations.component';
import { ReservationsListComponent } from './features/reservations/reservations-list/reservations-list.component';
import { ReservationsAdminComponent } from './features/reservations/reservations-admin/reservations-admin.component';


export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
    { path: 'books', component: BooksComponent, canActivate: [authRoleGuard], data: { roles: ROLES_ALL } },
    { path: 'books/new', component: BookFormComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'books/edit/:id', component: BookFormComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'users', component: UserListComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'users/:id/edit', component: UserEditComponent, canActivate: [authRoleGuard], data: { roles: ['admin'] } },
    { path: 'loans', component: LoanListComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'loans/mine', component: MyLoansComponent, canActivate: [authRoleGuard], data: { roles: ROLES_READER } },
    { path: 'reservations/mine', component: MyReservationsComponent, canActivate: [authRoleGuard], data: { roles: ROLES_READER } },
    { path: 'reservations', component: ReservationsListComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'reservations/admin', component: ReservationsAdminComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'loans/issue', component: LoanIssueComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'loans/return', component: LoanReturnComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'profile', component: UserProfileComponent, canActivate: [authRoleGuard], data: { roles: ROLES_ALL } },
    { path: 'users/:id/profile', component: UserProfileComponent, canActivate: [authRoleGuard], data: { roles: ROLES_STAFF } },
    { path: 'forbidden', component: ForbiddenComponent },
    { path: '**', redirectTo: 'login' }
];
