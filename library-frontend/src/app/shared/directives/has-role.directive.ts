import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';


@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
  private tpl = inject(TemplateRef<any>);
  private vcr = inject(ViewContainerRef);
  private auth = inject(AuthService);
  private sub?: Subscription;
  private roles: string[] = [];

  @Input('appHasRole') set setRoles(value: string | string[]) {
    this.roles = Array.isArray(value) ? value : [value];
    this.update();
  }

  ngOnInit() {
    this.sub = this.auth.user$.subscribe(() => this.update());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  private update() {
    const user = this.auth.user();
    const allowed = !!user && (this.roles.length === 0 || this.roles.includes(user.role));
    if (allowed) {
      if (!this.vcr.length) this.vcr.createEmbeddedView(this.tpl);
    } else {
      this.vcr.clear();
    }
  }
}
