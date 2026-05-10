import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, EventDetailDto } from '../../services/api.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container">
      <a routerLink="/" class="back-link">← Back to Feed</a>

      @if (loading()) {
        <div class="loading"><div class="spinner"></div><p>Loading...</p></div>
      } @else if (event()) {
        <article class="event-detail">
          <div class="event-header">
            <span class="event-type-badge" [ngClass]="getEventTypeClass(event()!.eventType)">{{ getEventTypeLabel(event()!.eventType) }}</span>
            <h1>{{ event()!.title }}</h1>
            <p class="event-meta">{{ event()!.createdBy }} · {{ event()!.eventDate | date:'longDate' }}</p>
          </div>

          @if (event()!.mainImageUrl) {
            <div class="main-image" [style.background-image]="'url(' + event()!.mainImageUrl + ')'"></div>
          }

          <div class="event-body">
            @if (
              (event()!.eventType === 'Obituary' ||
                event()!.eventType === 'Funeral' ||
                event()!.eventType === 'Remembrance') &&
              (event()!.birthDate || event()!.deathDate)
            ) {
              <div class="life-dates">
                @if (event()!.birthDate) {
                  <span>Born: {{ event()!.birthDate | date:'longDate' }}</span>
                }
                @if (event()!.birthDate && event()!.deathDate) {
                  <span class="separator">–</span>
                }
                @if (event()!.deathDate) {
                  <span>Passed: {{ event()!.deathDate | date:'longDate' }}</span>
                }
              </div>
            }
            @if ((event()!.eventType === 'Anniversary' || event()!.eventType === 'Wedding') && event()!.weddingDate) {
              <div class="life-dates">
                <span>{{ event()!.eventType === 'Wedding' ? 'Wedding' : 'Anniversary' }}: {{ event()!.weddingDate | date:'longDate' }}</span>
              </div>
            }
            <p class="description">{{ event()!.description }}</p>
            @if (event()!.location) {
              <p class="location">📍 {{ event()!.location }}</p>
            }
          </div>

          @if (galleryUrls().length) {
            <div class="gallery">
              <h3>Gallery</h3>
              <div class="gallery-grid">
                @for (url of galleryUrls(); track url) {
                  <div class="gallery-item" [style.background-image]="'url(' + url + ')'" (click)="openImage(url)"></div>
                }
              </div>
            </div>
          }

          <section class="wishes">
            <div class="wishes-header">
              <h3>{{ getWishesSectionTitle() }} ({{ event()!.wishes.length }})</h3>
              @if (event()!.isOwner) {
                <div class="event-actions">
                  <a [href]="organizerEditUrl(event()!.id)" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Edit</a>
                  <button type="button" class="btn btn-outline btn-sm btn-danger" (click)="confirmDelete()">Delete</button>
                </div>
              }
            </div>

            <form class="wish-form" (ngSubmit)="submitWish()">
              <div class="form-group">
                <input [(ngModel)]="senderName" name="sender" [placeholder]="getSenderPlaceholder()" required />
              </div>
              <div class="form-group">
                <textarea [(ngModel)]="wishMessage" name="message" [placeholder]="getMessagePlaceholder()" required></textarea>
              </div>
              @if (wishMediaPreview()) {
                <div class="form-group">
                  <img [src]="wishMediaPreview()" alt="Preview" class="wish-media-preview" />
                </div>
              }
              <div class="form-group">
                <label class="file-label">
                  <input type="file" accept="image/*" (change)="onWishMediaChange($event)" hidden />
                  Add photo (optional)
                </label>
              </div>
              <button type="submit" class="btn btn-primary" [disabled]="saving() || !senderName.trim() || !wishMessage.trim()">
                {{ saving() ? 'Sending...' : getSubmitButtonLabel() }}
              </button>
            </form>

            @if (event()!.wishes.length) {
              <div class="wish-list">
                @for (w of event()!.wishes; track w.id) {
                  <div class="wish-card">
                    <strong>{{ w.senderName }}</strong>
                    <p>{{ w.message }}</p>
                    @if (w.mediaUrl) {
                      <div class="wish-media">
                        <a [href]="w.mediaUrl" target="_blank" rel="noopener">
                          <img [src]="w.mediaUrl" alt="Attachment" />
                        </a>
                      </div>
                    }
                    <span class="wish-date">{{ w.createdAt | date:'medium' }}</span>
                  </div>
                }
              </div>
            }
          </section>
        </article>
      } @else {
        <div class="not-found">
          <h2>Event not found</h2>
          <a routerLink="/" class="btn btn-primary">Back to Feed</a>
        </div>
      }
    </div>
  `,
  styles: [`
    .back-link { display: inline-block; margin-bottom: 1.5rem; color: var(--text-muted); font-weight: 500; }
    .back-link:hover { color: var(--primary); }

    .event-detail { max-width: 800px; margin: 0 auto; }
    .event-header { margin-bottom: 1.5rem; }
    .event-header h1 { margin: 0.5rem 0 0.25rem; }
    .event-meta { color: var(--text-muted); font-size: 0.95rem; margin: 0; }
    .main-image {
      aspect-ratio: 16/9;
      background-size: cover;
      background-position: center;
      border-radius: var(--radius);
      margin-bottom: 2rem;
      background-color: var(--border);
    }
    .event-body { margin-bottom: 2rem; }
    .life-dates {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      background: var(--bg);
      border-radius: var(--radius);
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .life-dates .separator { color: var(--primary); font-weight: 600; }
    .description { font-size: 1.1rem; line-height: 1.7; white-space: pre-wrap; }
    .location { color: var(--text-muted); font-size: 0.95rem; margin-top: 1rem; }

    .gallery { margin-bottom: 2rem; }
    .gallery h3 { margin-bottom: 1rem; }
    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 0.75rem;
    }
    .gallery-item {
      aspect-ratio: 1;
      background-size: cover;
      background-position: center;
      border-radius: var(--radius);
      cursor: pointer;
      transition: transform 0.2s ease;
      &:hover { transform: scale(1.02); }
    }

    .wishes {
      background: white;
      padding: 2rem;
      border-radius: var(--radius);
      box-shadow: var(--shadow);
    }
    .wishes-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .wishes-header h3 { margin: 0; }
    .event-actions { display: flex; gap: 0.5rem; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
    .btn-danger { color: #c53030; border-color: #c53030; }
    .btn-danger:hover { background: #c53030; color: white; }
    .wish-media-preview { max-width: 120px; max-height: 90px; border-radius: var(--radius); object-fit: cover; }
    .file-label {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: var(--bg);
      border-radius: var(--radius);
      cursor: pointer;
      font-size: 0.9rem;
    }
    .file-label:hover { background: var(--border); }
    .wish-media img { max-width: 200px; max-height: 150px; border-radius: var(--radius); object-fit: cover; }
    .wish-form { margin-bottom: 2rem; }
    .wish-form .form-group { margin-bottom: 1rem; }
    .wish-list { display: flex; flex-direction: column; gap: 1rem; }
    .wish-card {
      padding: 1rem 1.25rem;
      background: var(--bg);
      border-radius: var(--radius);
    }
    .wish-card strong { color: var(--primary); }
    .wish-card p { margin: 0.35rem 0; }
    .wish-date { font-size: 0.8rem; color: var(--text-muted); }

    .loading, .not-found { text-align: center; padding: 4rem 2rem; }
    .spinner {
      width: 48px; height: 48px;
      border: 4px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class EventDetailComponent implements OnInit {
  event = signal<EventDetailDto | null>(null);
  loading = signal(true);
  saving = signal(false);
  senderName = '';
  wishMessage = '';
  wishMediaFile: File | null = null;
  wishMediaPreview = signal<string | null>(null);
  id = 0;

  galleryUrls = signal<string[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getEvent(this.id).subscribe({
      next: (ev) => {
        this.event.set(ev);
        try {
          const urls = ev.galleryUrls ? JSON.parse(ev.galleryUrls) : [];
          this.galleryUrls.set(Array.isArray(urls) ? urls : []);
        } catch { this.galleryUrls.set([]); }
        this.loading.set(false);
      },
      error: () => {
        this.event.set(null);
        this.loading.set(false);
      }
    });
  }

  getEventTypeClass(type: string): string {
    const t = type.toLowerCase();
    if (t === 'obituary' || t === 'funeral') return 'obituary';
    if (t === 'remembrance') return 'remembrance';
    if (t === 'anniversary') return 'anniversary';
    if (t === 'wedding') return 'wedding';
    if (t === 'puberty ceremony') return 'puberty';
    if (t === 'other') return 'other';
    if (t === 'birthday') return 'birthday';
    return 'other';
  }

  getEventTypeLabel(type: string): string {
    if (type === 'Funeral') return 'Obituary';
    const map: Record<string, string> = {
      Birthday: 'Birthday',
      'Puberty Ceremony': 'Puberty Ceremony',
      Wedding: 'Wedding',
      Anniversary: 'Anniversary',
      Obituary: 'Obituary',
      Remembrance: 'Remembrance',
      Other: 'Other'
    };
    return map[type] ?? type;
  }

  getWishesSectionTitle(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Tributes & Condolences';
    return 'Wishes';
  }

  getSenderPlaceholder(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral') return 'Your name';
    return 'Your name';
  }

  getMessagePlaceholder(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Share a memory or offer condolences...';
    return 'Your wish or congratulatory message...';
  }

  getSubmitButtonLabel(): string {
    const t = this.event()?.eventType?.toLowerCase();
    if (t === 'obituary' || t === 'funeral' || t === 'remembrance') return 'Post Tribute';
    return 'Send Wish';
  }

  onWishMediaChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.wishMediaFile = file;
      const reader = new FileReader();
      reader.onload = () => this.wishMediaPreview.set(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  submitWish() {
    if (!this.senderName.trim() || !this.wishMessage.trim()) return;
    this.saving.set(true);
    const doAdd = (mediaUrl?: string) => {
      this.api.addWish(this.id, this.senderName.trim(), this.wishMessage.trim(), mediaUrl).subscribe({
        next: (w) => {
          this.event.update(ev => ev ? { ...ev, wishes: [w, ...ev.wishes] } : ev);
          this.senderName = '';
          this.wishMessage = '';
          this.wishMediaFile = null;
          this.wishMediaPreview.set(null);
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      });
    };
    if (this.wishMediaFile) {
      this.api.uploadWishMedia(this.id, this.wishMediaFile).subscribe({
        next: (res) => doAdd(res.url),
        error: () => this.saving.set(false)
      });
    } else {
      doAdd();
    }
  }

  confirmDelete() {
    if (confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      this.api.deleteEvent(this.id).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => alert('Failed to delete event.')
      });
    }
  }

  openImage(url: string) {
    window.open(url, '_blank');
  }

  organizerEditUrl(eventId: number): string {
    return `${environment.adminPortalUrl}/event/${eventId}/edit`;
  }
}
