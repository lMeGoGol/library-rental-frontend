import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { HasRoleDirective } from '../../directives/has-role.directive';


@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, RouterModule, HasRoleDirective],
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss']
})

export class HeaderComponent {
    user$;

    constructor(
        private auth: AuthService,
        private router: Router,
        public theme: ThemeService
    ) {
    this.user$ = this.auth.user$;
    }

    logout() {
        this.auth.logout();
        this.router.navigate(['/login']);
    }

    toggleTheme() {
        this.theme.toggle();
        this.theme.persistCurrent();
    }

    displayName(user: any): string {
        if (!user) return '';
        const hasNames = (user.firstName && user.firstName.trim()) || (user.lastName && user.lastName.trim());
        if (hasNames) {
            const ln = (user.lastName || '').trim();
            const fn = (user.firstName || '').trim();
            return [ln, fn].filter(Boolean).join(' ');
        }
        return user.username || '';
    }
}