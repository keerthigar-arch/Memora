import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

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
        path: 'pricing',
        loadComponent: () =>
          import('./features/pricing-obituary/pricing-obituary.component').then((m) => m.PricingObituaryComponent)
      },
      {
        path: 'pricing/obituary/srilanka',
        redirectTo: 'pricing',
        pathMatch: 'full'
      },
      {
        path: 'pricing/order',
        loadComponent: () =>
          import('./features/pricing-order/pricing-order.component').then((m) => m.PricingOrderComponent)
      },
      {
        path: 'pricing/order-success',
        loadComponent: () =>
          import('./features/pricing-order-success/pricing-order-success.component').then(
            (m) => m.PricingOrderSuccessComponent
          )
      },
      {
        path: 'pricing/order-cancelled',
        loadComponent: () =>
          import('./features/pricing-order-cancelled/pricing-order-cancelled.component').then(
            (m) => m.PricingOrderCancelledComponent
          )
      },
      {
        path: 'pricing/:category/:country',
        redirectTo: 'pricing',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/register/register.component').then((m) => m.RegisterComponent)
      },
      {
        path: 'my-events',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/my-events/my-events.component').then((m) => m.MyEventsComponent)
      },
      {
        path: 'my-events/create',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/my-events/create-my-event.component').then((m) => m.CreateMyEventComponent)
      },
      {
        path: 'my-events/payment/:draftId',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/my-events/my-event-payment.component').then((m) => m.MyEventPaymentComponent)
      },
      {
        path: 'my-events/payment-success',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/my-events/my-event-payment-success.component').then(
            (m) => m.MyEventPaymentSuccessComponent
          )
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
