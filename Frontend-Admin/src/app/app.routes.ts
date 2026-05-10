import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { mustChangePasswordGuard } from './guards/must-change-password.guard';
import { firstLoginPasswordGuard } from './guards/first-login-password.guard';
import { FirstLoginPasswordComponent } from './features/first-login-password/first-login-password.component';
import { ForgotPasswordComponent } from './features/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/reset-password/reset-password.component';
import { PricingPaymentsComponent } from './features/pricing-payments/pricing-payments.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
  },
  /** Eager imports so dev/browsers do not keep an old lazy chunk with placeholder UI. */
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent
  },
  {
    path: 'first-login-password',
    component: FirstLoginPasswordComponent,
    canActivate: [firstLoginPasswordGuard]
  },
  {
    path: '',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard, mustChangePasswordGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'events' },
      {
        path: 'events',
        loadComponent: () =>
          import('./features/event-management/event-management.component').then((m) => m.EventManagementComponent)
      },
      /** Eager reference so `pricing-payments.component.ts` must exist and resolves like other static imports. */
      {
        path: 'payments',
        component: PricingPaymentsComponent
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/user-management/user-management.component').then((m) => m.UserManagementComponent)
      },
      {
        path: 'create-event',
        loadComponent: () =>
          import('./features/create-event/create-event.component').then((m) => m.CreateEventComponent)
      },
      {
        path: 'create-event/payment/:draftId',
        loadComponent: () => import('./features/payment/payment.component').then((m) => m.PaymentComponent)
      },
      {
        path: 'create-event/success',
        loadComponent: () =>
          import('./features/payment-success/payment-success.component').then((m) => m.PaymentSuccessComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent)
      },
      {
        path: 'event/:id/edit',
        loadComponent: () => import('./features/edit-event/edit-event.component').then((m) => m.EditEventComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
