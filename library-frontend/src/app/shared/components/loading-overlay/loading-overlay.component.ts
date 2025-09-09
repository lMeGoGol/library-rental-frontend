import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-backdrop" *ngIf="loading$ | async">
      <div class="spinner"></div>
    </div>
  `,
  styleUrls: ['./loading-overlay.component.scss']
})

export class LoadingOverlayComponent {
  constructor(private loadingService: LoadingService) {}
  get loading$(): Observable<boolean> { return this.loadingService.loading$; }
}
