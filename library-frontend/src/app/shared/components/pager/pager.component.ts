import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pager.component.html',
  styleUrls: ['./pager.component.scss']
})
export class PagerComponent {
  @Input() page = 1;
  @Input() limit = 10;
  @Input() length = 0; // items on current page
  @Input() total?: number; // total items (optional)
  @Input() pages?: number; // total pages (optional)

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  get totalPages(): number | undefined {
    if (this.pages && this.pages > 0) return this.pages;
    if (this.total && this.limit > 0) return Math.max(1, Math.ceil(this.total / this.limit));
    return undefined;
  }

  get canPrev(): boolean { return this.page > 1; }
  get canNext(): boolean {
    const tp = this.totalPages;
    if (tp) return this.page < tp;
    // fallback: if items on page are less than limit, likely last page
    return this.length >= this.limit;
  }
}
