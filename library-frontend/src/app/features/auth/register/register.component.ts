import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { map, catchError, of } from 'rxjs';


@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})

export class RegisterComponent {
    form!: FormGroup;

    loading = false;
    error: string | null = null;

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private userService: UserService,
        private router: Router
    ) {
        this.form = this.fb.group({
            username: ['', [Validators.required], [this.usernameUnique.bind(this)]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            lastName: ['', Validators.required],
            firstName: ['', Validators.required],
            middleName: ['', Validators.required],
            address: ['', Validators.required],
            phone: ['', [Validators.required, Validators.pattern(/^\+380\d{9}$/)]]
        });
    }

    usernameUnique(control: AbstractControl) {
        if (!control.value) return of(null);
        return this.userService.checkUsername(control.value).pipe(
            map(taken => taken ? { taken: true } : null),
            catchError(() => of(null))
        );
    }

    fieldError(name: string): string | null {
        const c = this.form.get(name);
        if (!c || !c.touched || !c.invalid) return null;
        if (c.errors?.['required']) return 'Обовʼязкове поле';
    if (c.errors?.['minlength']) return `Мін. довжина ${c.errors['minlength'].requiredLength}`;
        if (c.errors?.['pattern']) return 'Невірний формат';
    if (c.errors?.['taken']) return 'Логін зайнятий';
        return 'Невірне значення';
    }

    submit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.error = 'Виправте помилки форми';
            return;
        }

        this.loading = true;
        this.error = null;

        this.auth.register(this.form.value).subscribe({
            next: () => {
                this.loading = false;
                this.router.navigateByUrl('/books');
            },
            error: (err) => {
                this.loading = false;
                const raw = err?.error?.message || '';
                if (/username.*taken/i.test(raw)) this.error = 'Логін зайнятий';
                else this.error = 'Помилка реєстрації';
            }
        });
    }
}