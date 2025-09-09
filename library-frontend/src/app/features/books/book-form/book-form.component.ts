import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { BookService } from '../../../core/services/book.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';


@Component({
  selector: 'app-book-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.scss']
})

export class BookFormComponent implements OnInit {
  form!: FormGroup;
  editing = false;
  id: string | null = null;
  loading = false;
  uploading = false;
  previewUrl: string | null = null;
  readonly genres: string[] = [
    'Авангард','Адаптація','Альманах','Антиутопія','Архітектура','Астрономія','Байки','Бізнес','Біографія','Війна','Дитяча література','Драма','Дизайн','Довідник','Документальна проза','Екологія','Есей','Жахи','Збірка оповідань','Історія','Класика','Комедія','Комікси','Космічна опера','Кримінал','Кулінарія','Лінгвістика','Любовний роман','Мандрівки','Медіцина','Мемуари','Метафізика','Міфологія','Містика','Молодіжна (YA)','Наука','Наукова фантастика','Нон-фікшн','Поезія','Політика','Пригоди','Психологія','Підліткова','Публіцистика','Релігія','Розвиток особистості','Роман','Сатира','Сімейна сага','Соціологія','Спорт','Справжній злочин','Сучасна проза','Техніка','Трилер','Урбан-фентезі','Фантастика','Фентезі','Філософія','Фольклор','Художня література','Химерна проза','Хобі та дозвілля','Шпигунський роман','Юмор'
  ].sort((a,b)=>a.localeCompare(b,'uk'));

  constructor(
    private fb: FormBuilder,
    private bookService: BookService,
    private route: ActivatedRoute,
    private router: Router,
  private notify: NotificationService,
  private location: Location
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      author: ['', [Validators.required]],
      genre: ['', [Validators.required]],
      rentPrice: [1, [Validators.required, Validators.min(0)]],
      deposit: [0, [Validators.required, Validators.min(0)]],
  available: [true],
  thumbnailUrl: ['']
    });
    this.id = this.route.snapshot.paramMap.get('id');
    if (this.id) {
      this.editing = true;
      this.loading = true;
      this.bookService.getById(this.id).subscribe({
        next: book => {
          this.form.patchValue(book);
          this.previewUrl = book.thumbnailUrl || null;
        },
        error: () => this.notify.error('Не вдалося завантажити'),
        complete: () => this.loading = false
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.value;
    if (this.editing && this.id) {
      this.bookService.update(this.id, value).subscribe({
        next: () => {
          this.notify.success('Оновлено');
          this.router.navigate(['/books']);
        },
        error: () => this.notify.error('Помилка оновлення')
      });
    } else {
      this.bookService.create(value).subscribe({
        next: () => {
          this.notify.success('Створено');
          this.router.navigate(['/books']);
        },
        error: () => this.notify.error('Помилка створення')
      });
    }
  }

  fieldError(name: string): string | null {
    const c = this.form.get(name);
    if (!c || !c.touched || !c.invalid) return null;
    if (c.errors?.['required']) return 'Обовʼязкове';
    if (c.errors?.['minlength']) return `Мін. довжина ${c.errors['minlength'].requiredLength}`;
    if (c.errors?.['min']) return 'Має бути ≥ 0';
    return 'Невірне значення';
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
  // Instant local preview
  try { this.previewUrl = URL.createObjectURL(file); } catch {}
    this.uploading = true;
    this.bookService.uploadImage(file).subscribe({
      next: (res) => {
        this.form.patchValue({ thumbnailUrl: res.url });
    this.previewUrl = res.url || this.previewUrl;
      },
      complete: () => this.uploading = false
    });
  }

  goBack() { this.location.back(); }

  confirmDelete() {
    if (!this.editing || !this.id) return;
    const sure = window.confirm('Видалити цю книгу? Дію неможливо скасувати.');
    if (!sure) return;
    this.bookService.remove(this.id).subscribe({
      next: () => {
        this.notify.success('Книгу видалено');
        this.router.navigate(['/books']);
      },
      error: () => this.notify.error('Не вдалося видалити книгу')
    });
  }
}
