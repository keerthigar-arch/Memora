

import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="contact-hero">
      <div class="container">
        <h1>Contact Us</h1>
        <p>Have a question or feedback? We'd love to hear from you.</p>
      </div>
    </section>

    <div class="container contact-container">

      <form (ngSubmit)="submit()" class="contact-form">

        <!-- NAME -->
        <div class="form-group">
          <label>Name *</label>
          <input
            [(ngModel)]="name"
            name="name"
            placeholder="Your name"
            required
            #nameInput="ngModel"
            minlength="2"
            maxlength="50"
           
          />
        @if (nameInput.invalid && (nameInput.dirty || nameInput.touched)) {
  <div class="validation-error">
    @if (nameInput.errors?.['required']) {
      <small>Name is required.</small>
    }
    @if (nameInput.errors?.['minlength']) {
      <small>Name must be at least 2 characters.</small>
    }
    @if (nameInput.errors?.['maxlength']) {
      <small>Name cannot exceed 50 characters.</small>
    }
  </div>
}
<div class="character-count" [class.exceed-limit]="name.length > 50">
  {{ name.length }}/50
</div>
        </div>

        <!-- EMAIL -->
           <div class="form-group">
          <label>Email *</label>
          <input
            type="email"
            [(ngModel)]="email"
            name="email"
            #emailInput="ngModel"
            placeholder="your@email.com"
            required
            minlength="5"
            maxlength="100"
            pattern="^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
            [class.invalid]="emailInput.invalid && (emailInput.dirty || emailInput.touched)"
          />
          
           @if (emailInput.invalid && (emailInput.dirty || emailInput.touched)) {
            <div class="validation-error">
              @if (emailInput.errors?.['required']) {
                <small>Email is required.</small>
              }
              @if (emailInput.errors?.['minlength']) {
                <small>Email must be at least 5 characters.</small>
              }
              @if (emailInput.errors?.['maxlength']) {
                <small>Email cannot exceed 100 characters.</small>
              }
              @if (emailInput.errors?.['pattern']) {
                <small>Please enter a valid email address.</small>
              }
            </div>
          }
          <div class="field-hint">
            <span class="char-count" [class.over]="email.length > 100">
              {{ email.length }}/100
            </span>
          </div>
        </div>



         <div class="form-group">
          <label>Subject</label>
          <input
            type="text"
            [(ngModel)]="subject"
            name="subject"
            #subjectInput="ngModel"
            placeholder="What's this about?"
            maxlength="100"
            [class.invalid]="subjectInput.invalid && (subjectInput.dirty || subjectInput.touched)"
          />
          
          @if (subjectInput.invalid && (subjectInput.dirty || subjectInput.touched)) {
            <div class="validation-error">
              @if (subjectInput.errors?.['minlength']) {
                <small>Subject must be at least 2 characters.</small>
              }
              @if (subjectInput.errors?.['maxlength']) {
                <small>Subject cannot exceed 100 characters.</small>
              }
            </div>
          }
          <div class="field-hint">
            <span class="char-count" [class.over]="subject.length > 100">
              {{ subject.length }}/100
            </span>
          </div>
        </div>











        <!-- MESSAGE -->
        <div class="form-group">
          <label>Message *</label>
          <textarea
            [(ngModel)]="message"
            name="message"
            placeholder="Your message..."
            required
            [class.invalid]="fieldErrors['message']"
            (input)="validateField('message')"
          ></textarea>
          <div class="field-hint">
            @if (fieldErrors['message']) {
              <span class="error-inline">{{ fieldErrors['message'] }}</span>
            }
            <span class="char-count" [class.over]="message.length > 1000">{{ message.length }}/1000</span>
          </div>
        </div>

        @if (success()) {
          <div class="success-msg">✓ Thank you! Your message has been sent. We'll get back to you soon.</div>
        }
        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }

        <button type="submit" class="btn btn-primary btn-lg" [disabled]="sending()">
          {{ sending() ? 'Sending...' : 'Send Message' }}
        </button>

      </form>

      <div class="contact-info">
        <h3>Get in Touch</h3>
        <p>Life Events Hub is here to help you share and preserve life's meaningful moments.</p>
      </div>

    </div>
  `,
  styles: [`
    .contact-hero {
      background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
      color: white;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .contact-hero h1 { color: white; margin-bottom: 0.5rem; }
    .contact-hero p { opacity: 0.9; margin: 0; }

    .contact-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 2rem 1.5rem;
      display: grid;
      gap: 2rem;
    }
    .contact-form {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }

    .field-hint {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
      min-height: 18px;
    }
    .error-inline {
      font-size: 0.78rem;
      color: #c53030;
    }
    .char-count {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-left: auto;
    }
    .char-count.over {
      color: #c53030;
      font-weight: 600;
    }

    input.invalid, textarea.invalid {
      border-color: #c53030 !important;
      outline-color: #c53030 !important;
    }

    .success-msg {
      background: #f0fdf4;
      color: #166534;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .error-msg {
      background: #fef2f2;
      color: #c53030;
      padding: 1rem;
      border-radius: var(--radius);
      margin-bottom: 1rem;
    }
    .btn-lg { padding: 1rem 2rem; font-size: 1.05rem; margin-top: 0.5rem; }
    .contact-info {
      text-align: center;
      color: var(--text-muted);
      padding: 2rem;
    }
    .contact-info h3 { color: var(--text); margin-bottom: 0.5rem; }
  `]
})
export class ContactComponent {
  name = '';
  email = '';
  subject = '';
  message = '';
  sending = signal(false);
  success = signal(false);
  error = signal('');

  fieldErrors: Record<string, string> = {};

  private rules: Record<string, { min?: number; max: number; label: string; required?: boolean }> = {
    name:    { min: 2,  max: 50,   label: 'Name',    required: true  },
    email:   { min: 5,  max: 100,  label: 'Email',   required: true  },
    subject: {          max: 100,  label: 'Subject', required: false },
    message: { min: 10, max: 1000, label: 'Message', required: true  },
  };

  constructor(private api: ApiService) {}

  validateField(field: string): void {
    const value: string = (this as any)[field] as string;
    const rule = this.rules[field];
    if (!rule) return;

    if (rule.required && !value.trim()) {
      this.fieldErrors[field] = `${rule.label} is required.`;
    } else if (rule.min && value.trim().length > 0 && value.trim().length < rule.min) {
      this.fieldErrors[field] = `${rule.label} must be at least ${rule.min} characters.`;
    } else if (value.length > rule.max) {
      this.fieldErrors[field] = `${rule.label} cannot exceed ${rule.max} characters.`;
    } else {
      this.fieldErrors[field] = '';
    }
  }

  private validateAll(): boolean {
    ['name', 'email', 'subject', 'message'].forEach(f => this.validateField(f));
    return Object.values(this.fieldErrors).every(e => !e);
  }

  submit() {
    if (!this.validateAll()) {
      this.error.set('Please fix the errors above before submitting.');
      return;
    }

    this.sending.set(true);
    this.success.set(false);
    this.error.set('');

    this.api.submitContact(this.name, this.email, this.subject, this.message).subscribe({
      next: () => {
        this.sending.set(false);
        this.success.set(true);
        this.name = '';
        this.email = '';
        this.subject = '';
        this.message = '';
        this.fieldErrors = {};
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to send message. Please try again.');
        this.sending.set(false);
      }
    });
  }
}