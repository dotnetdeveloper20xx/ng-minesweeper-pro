import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="panel">
    <h2>About</h2>
    <p>
      This demo showcases advanced Angular front-end patterns:
      standalone components, reactive state via RxJS BehaviorSubject, router-driven layout,
      a11y-friendly keyboard controls, localStorage persistence, and polished CSS Grid UI.
    </p>
    <ul>
      <li>First-click safety & flood-fill reveal</li>
      <li>Number-click <em>chording</em> (auto-reveal neighbors)</li>
      <li>Best times persisted per difficulty</li>
      <li>Hints (3 per game)</li>
    </ul>
  </div>
  `
})
export class AboutComponent {}
