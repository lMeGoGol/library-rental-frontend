import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MatCardModule, MatButtonModule, MatInputModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})

export class LoginComponent {
  form!: FormGroup;

  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Обовʼязкове поле';
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

    const raw = this.form.value;
    const creds: { username: string; password: string } = {
        username: String(raw.username ?? ''),
        password: String(raw.password ?? '')
    };

    this.auth.login(creds).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigateByUrl('/books');
      },
      error: err => {
        this.loading = false;
        const raw = err?.error?.message || '';
        if (/invalid/i.test(raw)) this.error = 'Невірний логін або пароль';
        else this.error = 'Помилка входу';
      }
    });
  }
}