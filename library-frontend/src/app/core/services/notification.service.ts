import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';


@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snack = inject(MatSnackBar);

  success(message: string, action = 'OK', duration = 3000) {
    this.snack.open(message, action, { duration, panelClass: ['snack-success'] });
  }
  error(message: string, action = 'Close', duration = 5000) {
    this.snack.open(message, action, { duration, panelClass: ['snack-error'] });
  }
  info(message: string, action = 'Close', duration = 3000) {
    this.snack.open(message, action, { duration, panelClass: ['snack-info'] });
  }
}
