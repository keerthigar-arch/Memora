import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {
    // Component initialization logic
  }
}
