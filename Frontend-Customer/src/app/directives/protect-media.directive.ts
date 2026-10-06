import { Directive, ElementRef, HostListener, OnInit } from '@angular/core';

/** Stops the usual browser save, drag, and video-download actions on feed media. */
@Directive({
  selector: 'img[appProtectMedia], video[appProtectMedia]',
  standalone: true,
  host: {
    class: 'media-no-download',
    draggable: 'false',
  },
})
export class ProtectMediaDirective implements OnInit {
  constructor(private el: ElementRef<HTMLImageElement | HTMLVideoElement>) {}

  ngOnInit(): void {
    const node = this.el.nativeElement;
    node.draggable = false;
    if (node instanceof HTMLVideoElement) {
      const existing = node.getAttribute('controlsList') ?? '';
      const flags = new Set(existing.split(/\s+/).filter(Boolean));
      flags.add('nodownload');
      flags.add('noremoteplayback');
      node.setAttribute('controlsList', [...flags].join(' '));
      node.disablePictureInPicture = true;
    }
  }

  @HostListener('contextmenu', ['$event'])
  @HostListener('dragstart', ['$event'])
  block(event: Event): void {
    event.preventDefault();
  }
}
