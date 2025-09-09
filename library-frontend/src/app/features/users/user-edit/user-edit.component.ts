import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { LoggerService } from '../../../core/services/logger.service';


@Component({
    selector: 'app-user-edit',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-edit.component.html',
    styleUrls: ['./user-edit.component.scss']
})

export class UserEditComponent {
    private auth = inject(AuthService);
    private userService = inject(UserService);
    private route = inject(ActivatedRoute)
    private location = inject(Location);
    private logger = inject(LoggerService);

    targetUserId: string | null = null;

    constructor() {
        this.targetUserId = this.route.snapshot.paramMap.get('id');
    }

    changeRole(newRole: string) {
        if (!this.targetUserId) return;

        if (!this.auth.hasRole('admin')) {
            alert('Тільки адміністратор може змінювати ролі!');
            return;
        }

        this.userService.setRole(this.targetUserId, newRole).subscribe({
            next: () => {
                alert('Роль успішно змінена ✅');
            },
            error: (err: any) => {
                this.logger.error('UserEdit', 'Помилка при зміні ролі:', err);
                alert('Не вдалося змінити роль ❌');
            }
        });
    }

    goBack() { this.location.back(); }
}

