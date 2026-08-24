import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-contact',
  imports: [],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private platformId = inject(PLATFORM_ID);
  protected copied = signal(false);

  async copyMail() {
    const mail = 'mariomedhat899@gmail.com';
    if (isPlatformBrowser(this.platformId)) {
      try {
        await navigator.clipboard.writeText(mail);
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2200);
      } catch {
        this.fallbackCopy(mail);
      }
    }
  }

  private fallbackCopy(text: string) {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); this.copied.set(true); setTimeout(() => this.copied.set(false), 2200); }
    catch { alert(text); }
    ta.remove();
  }
}