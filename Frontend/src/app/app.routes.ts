import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/customer-layout/customer-layout.component').then((m) => m.CustomerLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/feed/feed.component').then((m) => m.FeedComponent)
      },
      {
        path: 'event/:id',
        loadComponent: () =>
          import('./features/event-detail/event-detail.component').then((m) => m.EventDetailComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/register/register.component').then((m) => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'create-event' },
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
