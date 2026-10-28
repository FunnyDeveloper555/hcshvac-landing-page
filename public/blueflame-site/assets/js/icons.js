const SVG_ICONS_SPRITE = `
<svg id="svgSpriteDefs" style="display:none;" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="icon-fire" viewBox="0 0 24 24">
      <path d="M12 23c-4.97 0-9-4.03-9-9 0-4.12 2.76-7.86 5.86-10.37.78-.63 1.93-.15 2.06.85.22 1.69 1.08 3.19 2.08 4.26.17-2.19 1.13-4.22 2.72-5.74.83-.8 2.2-.28 2.3.87.28 3.09 1.76 5.13 2.98 6.42C22.04 12.43 23 14.15 23 16c0 3.86-3.14 7-7 7h-4zm0-2c3.87 0 7-3.13 7-7 0-1.42-.72-2.77-1.63-3.73-1.47-1.56-2.58-3.69-2.84-6.32-1.07 1.34-1.78 3.03-1.87 4.88-.06 1.1-.92 1.98-2.02 2.03-1.22.06-2.29-.86-2.39-2.08-.03-.39-.12-.76-.24-1.12-2.13 2.03-4.01 4.79-4.01 7.34 0 3.87 3.13 7 7 7zm-1-3c-1.66 0-3-1.34-3-3 0-1.31.84-2.41 2-2.83.55-.2 1.13.25 1.09.83-.07 1.07.78 1.98 1.86 2 .46.01.83.38.83.84 0 1.19-.88 2.16-2.04 2.16h-.74z"/>
    </symbol>

    <symbol id="icon-snowflake" viewBox="0 0 24 24">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93M12 6l2-2m-4 0l2 2m0 12l2 2m-4 0l2-2m-6-6l-2-2m0 4l2-2m12 0l2-2m0 4l-2-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-bolt" viewBox="0 0 24 24">
      <path d="M11 21h-1l1-7H7.5c-.88 0-1.33-1.06-.71-1.69L14.5 3h1l-1 7h3.5c.88 0 1.33 1.06.71 1.69L11 21z"/>
    </symbol>

    <symbol id="icon-shield" viewBox="0 0 24 24">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1.25 14.25l-3.75-3.75 1.41-1.41 2.34 2.34 5.34-5.34 1.41 1.41-6.75 6.75z"/>
    </symbol>

    <symbol id="icon-droplet" viewBox="0 0 24 24">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0L12 2.69zm0 3.83L8.05 10.46a5.5 5.5 0 1 0 7.78 0L12 6.52z"/>
    </symbol>

    <symbol id="icon-sparkles" viewBox="0 0 24 24">
      <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4zm7 13l1.2 2.8L23 19l-2.8 1.2L19 23l-1.2-2.8L15 19l2.8-1.2zM5 16l1 2.5L8.5 19.5 6 20.5 5 23l-1-2.5L1.5 19.5 4 18.5z"/>
    </symbol>

    <symbol id="icon-tools" viewBox="0 0 24 24">
      <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.5 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
    </symbol>

    <symbol id="icon-phone" viewBox="0 0 24 24">
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.2 2.2a15.05 15.05 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.35 8.5 5.16 8.5 3.93 8.5 3.42 8.08 3 7.57 3H4.06C3.55 3 3 3.42 3 3.93 3 13.36 10.64 21 20.01 21c.51 0 .99-.55.99-1.06v-3.56c0-.51-.42-.99-.99-.99z"/>
    </symbol>

    <symbol id="icon-map-pin" viewBox="0 0 24 24">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/>
    </symbol>

    <symbol id="icon-star" viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
    </symbol>

    <symbol id="icon-clock" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="12,7 12,12 15.5,14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-alert" viewBox="0 0 24 24">
      <path d="M12 2L1 21h22L12 2zm0 3.5L20.25 19H3.75L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
    </symbol>

    <symbol id="icon-home" viewBox="0 0 24 24">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
    </symbol>

    <symbol id="icon-package" viewBox="0 0 24 24">
      <path d="M21 16.5l-9 5.2-9-5.2V7.5l9-5.2 9 5.2v9z" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="12" y1="22.08" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
    </symbol>

    <symbol id="icon-tag" viewBox="0 0 24 24">
      <path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/>
    </symbol>

    <symbol id="icon-smartphone" viewBox="0 0 24 24">
      <rect x="5" y="2" width="14" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="10" y1="5" x2="14" y2="5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="12" cy="18" r="1" fill="currentColor"/>
    </symbol>

    <symbol id="icon-dollar" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M12 6v12M15 9.5c0-1.38-1.34-2.5-3-2.5s-3 1.12-3 2.5 1.34 2.5 3 2.5 3 1.12 3 2.5-1.34 2.5-3 2.5-3-1.12-3-2.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-award" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="8.21,13.89 7,22 12,19 17,22 15.79,13.88" fill="none" stroke="currentColor" stroke-width="2"/>
    </symbol>

    <symbol id="icon-volume" viewBox="0 0 24 24">
      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" fill="currentColor"/>
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-refresh" viewBox="0 0 24 24">
      <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l6.73-5.19" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-leaf" viewBox="0 0 24 24">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 0 0 8 20C19 20 22 3 22 3c-1 2-8 2-13 4 5.24 3.73 7 7 7 7s-3-1-6-1c-1 0-2 .1-3 .3C3.5 12 6.5 8 17 8z"/>
    </symbol>

    <symbol id="icon-sun" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" fill="currentColor"/>
      <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-wind" viewBox="0 0 24 24">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-plug" viewBox="0 0 24 24">
      <path d="M9 2v6m6-6v6M6 8h12v5a6 6 0 0 1-12 0V8zm6 11v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-ruler" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="6" y1="7" x2="6" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="10" y1="7" x2="10" y2="10" stroke="currentColor" stroke-width="2"/>
      <line x1="14" y1="7" x2="14" y2="12" stroke="currentColor" stroke-width="2"/>
      <line x1="18" y1="7" x2="18" y2="10" stroke="currentColor" stroke-width="2"/>
    </symbol>

    <symbol id="icon-calendar" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/>
      <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/>
      <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/>
    </symbol>

    <symbol id="icon-search" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" fill="none" stroke="currentColor" stroke-width="2"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-eye" viewBox="0 0 24 24">
      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>
    </symbol>

    <symbol id="icon-check-circle" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="8,12 11,15 16,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-brand-flame-ice" viewBox="0 0 32 32">
      <path d="M12 4c-.3 1.2-1 2.2-1.7 3.2C9.3 8.7 8.6 10.2 8.6 12.1c0 3.5 2.9 6.4 6.4 6.4s6.4-2.9 6.4-6.4c0-2.6-1.3-4.6-2.8-6.1-.2 1-.7 2-1.4 2.7-.9.9-1.5 2.5-1.5 4.1 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.4.6-2.6 1.6-3.6.5-.6 1-1.2 1.4-1.9.5-1.1.6-2.2.3-3.3z" fill="#ff6550"/>
      <path d="M22 12v12m-6-6h12m-9-4l6 8m-6 0l6-8" fill="none" stroke="#00d4ff" stroke-width="2" stroke-linecap="round"/>
    </symbol>

    <symbol id="icon-mail" viewBox="0 0 24 24">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="22,6 12,13 2,6" fill="none" stroke="currentColor" stroke-width="2"/>
    </symbol>

    <symbol id="icon-diamond" viewBox="0 0 24 24">
      <polygon points="12,2 22,12 12,22 2,12" fill="currentColor"/>
    </symbol>

    <symbol id="icon-target" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    </symbol>

    <symbol id="icon-users" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <circle cx="9" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>
      <symbol id="icon-filter" viewBox="0 0 24 24">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </symbol>
    <symbol id="icon-grid" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="3" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="14" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="3" y="14" width="7" height="7" fill="none" stroke="currentColor" stroke-width="2"/>
    </symbol>
    <symbol id="icon-list" viewBox="0 0 24 24">
      <line x1="8" y1="6" x2="21" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="8" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="8" y1="18" x2="21" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="3" y1="6" x2="3.01" y2="6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="3" y1="12" x2="3.01" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      <line x1="3" y1="18" x2="3.01" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </symbol>
  </defs>
</svg>
`;

function ensureSvgSprite() {
  const existingSprite = document.getElementById('svgSpriteDefs');
  if (!existingSprite) {
    const div = document.createElement('div');
    div.innerHTML = SVG_ICONS_SPRITE;
    if (document.body) {
      document.body.insertAdjacentElement('afterbegin', div.firstElementChild);
    }
  } else {
    
    const temp = document.createElement('div');
    temp.innerHTML = SVG_ICONS_SPRITE;
    const defs = existingSprite.querySelector('defs') || existingSprite;
    const newSymbols = temp.querySelectorAll('symbol');
    newSymbols.forEach(sym => {
      if (!existingSprite.querySelector('#' + sym.id)) {
        defs.appendChild(sym.cloneNode(true));
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureSvgSprite);
} else {
  ensureSvgSprite();
}
