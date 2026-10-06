import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { IdleSessionService } from './services/idle-session.service';
import { AppDialogComponent } from './components/app-dialog/app-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AppDialogComponent],
  template: `<router-outlet></router-outlet><app-dialog></app-dialog>`,
  styles: []
})
export class AppComponent {
  constructor(idle: IdleSessionService) {
    void idle;
  }
}
