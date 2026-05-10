import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pricing-order-cancelled',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="container">
        <section class="lift-card">
          <h1>Checkout cancelled</h1>
          <p>You left Stripe Checkout before completing payment. No charge was made.</p>
          <div class="actions">
            <a routerLink="/pricing/obituary/srilanka" class="btn-primary">Back to pricing</a>
            <a routerLink="/" class="btn-outline">Home</a>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        min-height: 100%;
        padding: 2rem 0;
      }
      .lift-card {
        border-radius: 16px;
        border: 1px solid rgba(26, 95, 74, 0.12);
        background: rgba(255, 255, 255, 0.94);
        padding: 1.35rem 1.25rem;
        box-shadow: 0 10px 28px rgba(13, 61, 50, 0.06);
        max-width: 520px;
        margin: 0 auto;
      }
      h1 {
        margin: 0 0 0.5rem;
        font-size: 1.2rem;
        color: #14352e;
      }
      p {
        margin: 0 0 1rem;
        font-size: 0.9rem;
        line-height: 1.55;
        color: #4a5e58;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .btn-primary,
      .btn-outline {
        display: inline-block;
        border-radius: 999px;
        padding: 0.48rem 1.1rem;
        font-size: 0.82rem;
        font-weight: 700;
        text-decoration: none;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: linear-gradient(145deg, #1a5f4a, #2d8f73);
        color: #fff;
      }
      .btn-outline {
        background: transparent;
        border-color: rgba(26, 95, 74, 0.28);
        color: #1a5f4a;
      }
    `
  ]
})
export class PricingOrderCancelledComponent {}
