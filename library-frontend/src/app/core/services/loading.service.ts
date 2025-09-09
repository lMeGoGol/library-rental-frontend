import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class LoadingService {
  private activeRequests = 0;
  private readonly _loading$ = new BehaviorSubject<boolean>(false);

  get loading$(): Observable<boolean> { return this._loading$.asObservable(); }

  start() {
    this.activeRequests++;
    if (this.activeRequests === 1) this._loading$.next(true);
  }

  stop() {
    if (this.activeRequests > 0) this.activeRequests--;
    if (this.activeRequests === 0) this._loading$.next(false);
  }

  reset() {
    this.activeRequests = 0;
    this._loading$.next(false);
  }
}
