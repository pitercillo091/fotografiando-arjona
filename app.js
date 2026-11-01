import { photos } from './data/photos.js';

const $ = (selector, root = document) => root.querySelector(selector);
const imagePath = (photo) => `images/${photo.file.toLowerCase().endsWith('.avif') ? `optimized/${photo.file.replace(/\.avif$/i, '')}-fallback.jpg` : photo.file}`;
const responsiveSources = (photo) => photo.width > 800 ? `images/optimized/${photo.file.replace(/\.[^.]+$/, '')}-640.jpg 640w, ${imagePath(photo)} ${photo.width}w` : imagePath(photo);
const labels = {paisaje: 'Horizontales', patrimonio: 'Verticales', detalles: 'Cuadradas'};
const featured = Array.from({length: Math.min(12, photos.length)}, (_, index) => photos[Math.round(index * (photos.length - 1) / (Math.min(12, photos.length) - 1))]);
let currentStoryIndex = -1;
let currentPhotoIndex = 0;
let lastFocus = null;
let scrollFrame = 0;
const galleryPageSize = 30;
let galleryFilter = 'all';
let galleryLimit = galleryPageSize;
let renderedPhotoCount = 0;

function photoAlt(photo) { return photo.alt || `Fotografía de Arjona, Jaén. ${photo.caption || 'Descripción pendiente de identificación visual'}.`; }
function photoTitle(photo) { return photo.titleText || `Arjona · Fotografía ${photo.id.slice(-3)}`; }

function setStory(index) {
  const usable = featured;
  const safeIndex = Math.max(0, Math.min(index, usable.length - 1));
  if (safeIndex === currentStoryIndex) return;
  currentStoryIndex = safeIndex;
  const photo = usable[safeIndex];
  const copy = [photoTitle(photo), photo.caption || `Fotografía ${safeIndex + 1} de ${photos.length} · Arjona, Jaén`];
  const image = $('#story-image');
  image.src = imagePath(photo); image.srcset = responsiveSources(photo); image.sizes = '(max-width: 800px) 88vw, 62vw'; image.alt = photoAlt(photo); image.width = photo.width; image.height = photo.height;
  $('#story-title').textContent = copy[0]; $('#story-caption-text').textContent = copy[1]; $('#story-number').textContent = String(safeIndex + 1).padStart(2, '0');
  image.style.transform = 'scale(1.025)';
  $('#open-story').onclick = () => openLightbox(photo, copy[0], copy[1]);
  $('#story-meter').innerHTML = usable.map((item, itemIndex) => `<button type="button" class="story-dot${itemIndex === safeIndex ? ' is-active' : ''}" data-story-index="${itemIndex}" aria-label="Ir a la fotografía ${itemIndex + 1}" aria-current="${itemIndex === safeIndex ? 'step' : 'false'}"></button>`).join('');
  $('#story-meter').querySelectorAll('button').forEach((button) => button.addEventListener('click', () => document.querySelector(`.story-step[data-index="${button.dataset.storyIndex}"]`)?.scrollIntoView({behavior: 'smooth', block: 'center'})));
}

function updateStoryFromScroll() {
  scrollFrame = 0;
  const section = $('.story');
  if (!section) return;
  const travel = Math.max(1, section.offsetHeight - window.innerHeight);
  const progress = Math.max(0, Math.min(0.999, -section.getBoundingClientRect().top / travel));
  setStory(Math.floor(progress * (featured.length - 1)));
}

function renderStory() {
  const steps = $('#story-steps');
  const usable = featured;
  $('.story').style.height = `${usable.length * (window.innerWidth <= 800 ? 72 : 100)}vh`;
  steps.innerHTML = usable.map((photo, index) => `<div class="story-step" data-index="${index}"><span aria-hidden="true"></span></div>`).join('');
  setStory(0);
  window.addEventListener('scroll', () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(updateStoryFromScroll); }, {passive: true});
}

function renderGallery(filter = 'all', append = false) {
  const grid = $('#gallery-grid');
  const matches = filter === 'all' ? photos : photos.filter((photo) => photo.category === filter);
  const visible = matches.slice(0, galleryLimit);
  const start = append ? renderedPhotoCount : 0;
  galleryFilter = filter;
  if (!append) {
    grid.replaceChildren();
    renderedPhotoCount = 0;
  }
  $('#gallery-count').textContent = `Mostrando ${visible.length} de ${matches.length} fotografías`;
  $('#gallery-more').hidden = visible.length >= matches.length;
  const gallerySizes = '(max-width: 800px) 48vw, (max-width: 1200px) 50vw, 42vw';
  grid.insertAdjacentHTML('beforeend', visible.slice(start).map((photo, offset) => {
    const priority = offset < 4;
    return `<article class="gallery-card" style="--ratio:${photo.width}/${photo.height}"><button type="button" data-photo="${photo.id}" aria-label="Ampliar ${photoAlt(photo)}"><figure><picture><source srcset="${responsiveSources(photo)}" sizes="${gallerySizes}" media="(min-width: 1px)"><img src="${imagePath(photo)}" srcset="${responsiveSources(photo)}" sizes="${gallerySizes}" alt="${photoAlt(photo)}" width="${photo.width}" height="${photo.height}" loading="${priority ? 'eager' : 'lazy'}"${offset === 0 ? ' fetchpriority="high"' : ''} decoding="async"></picture><figcaption><span>${labels[photo.category]}</span>${photo.caption || photoTitle(photo)}</figcaption></figure></button></article>`;
  }).join(''));
  renderedPhotoCount = visible.length;
  grid.querySelectorAll('[data-photo]:not([data-bound])').forEach((button) => {
    button.dataset.bound = 'true';
    button.addEventListener('click', () => { const index = photos.findIndex((item) => item.id === button.dataset.photo); openPhotoAt(index, button); });
  });
}

function openPhotoAt(index, focusTarget = null, updateUrl = true) {
  const photo = photos[index]; if (!photo) return;
  currentPhotoIndex = index; lastFocus = focusTarget || document.activeElement;
  openLightbox(photo, photoTitle(photo), photo.caption || `Fotografía de Juan Martínez Gómez · Arjona, Jaén · ${labels[photo.category]}.`, updateUrl);
}

function openLightbox(photo, title, caption, updateUrl = true) {
  const image = $('#lightbox-image');
  image.src = imagePath(photo); image.srcset = responsiveSources(photo); image.sizes = '92vw'; image.alt = photoAlt(photo);
  $('#lightbox-title').textContent = title; $('#lightbox-caption').textContent = caption; $('#lightbox-category').textContent = labels[photo.category];
  $('#lightbox').showModal(); document.body.classList.add('lightbox-open'); $('#close-lightbox').focus();
  if (updateUrl) history.replaceState(null, '', `#foto=${photo.id}`);
}

function closeLightbox() { const dialog = $('#lightbox'); if (dialog.open) dialog.close(); }
function stepPhoto(direction) { const next = (currentPhotoIndex + direction + photos.length) % photos.length; openPhotoAt(next, null, true); }

const dialog = $('#lightbox');
$('#close-lightbox').addEventListener('click', closeLightbox);
$('#lightbox-prev').addEventListener('click', () => stepPhoto(-1));
$('#lightbox-next').addEventListener('click', () => stepPhoto(1));
$('#share-photo').addEventListener('click', async () => { const button = $('#share-photo'); try { await navigator.clipboard.writeText(location.href); button.textContent = 'Enlace copiado'; } catch { button.textContent = 'Copia la URL del navegador'; } setTimeout(() => { button.textContent = 'Copiar enlace'; }, 1800); });
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeLightbox(); });
dialog.addEventListener('close', () => { document.body.classList.remove('lightbox-open'); history.replaceState(null, '', location.pathname + location.search); lastFocus?.focus?.({preventScroll: true}); });
dialog.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') stepPhoto(-1); if (event.key === 'ArrowRight') stepPhoto(1); });
let touchStartX = 0;
$('#lightbox-media').addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, {passive: true});
$('#lightbox-media').addEventListener('touchend', (event) => { const delta = event.changedTouches[0].clientX - touchStartX; if (Math.abs(delta) > 50) stepPhoto(delta < 0 ? 1 : -1); }, {passive: true});

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.filter').forEach((item) => { item.classList.remove('is-active'); item.removeAttribute('aria-current'); }); button.classList.add('is-active'); button.setAttribute('aria-current', 'page'); galleryLimit = galleryPageSize; renderGallery(button.dataset.filter); }));
$('#gallery-more').addEventListener('click', () => { galleryLimit += galleryPageSize; renderGallery(galleryFilter, true); });
document.querySelectorAll('[data-filter-link]').forEach((link) => link.addEventListener('click', () => { const target = $(`.filter[data-filter="${link.dataset.filterLink}"]`); target?.click(); }));
const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); } }), {threshold: .02});
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
function revealHashTarget() {
  const target = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
  if (!target) return;
  if (target.classList.contains('reveal')) {
    target.classList.add('is-visible');
    revealObserver.unobserve(target);
  }
  requestAnimationFrame(() => target.scrollIntoView({behavior: 'instant', block: 'start'}));
}
window.addEventListener('hashchange', revealHashTarget);
revealHashTarget();

renderStory(); renderGallery();
const hashPhoto = location.hash.startsWith('#foto=') ? location.hash.slice(6) : '';
if (hashPhoto) { const index = photos.findIndex((photo) => photo.id === hashPhoto); if (index >= 0) openPhotoAt(index, null, false); }

const music = $('#site-music');
const musicToggle = $('#music-toggle');
function updateMusicControl() {
  const playing = !music.paused && !music.muted;
  musicToggle.textContent = playing ? 'Silenciar música' : 'Activar música';
  musicToggle.setAttribute('aria-label', playing ? 'Silenciar música' : 'Activar música');
  musicToggle.setAttribute('aria-pressed', String(!playing));
}
musicToggle.addEventListener('click', async () => {
  if (music.paused || music.muted) {
    music.muted = false;
    try { await music.play(); } catch { musicToggle.textContent = 'No se pudo reproducir'; }
  } else {
    music.muted = true;
  }
  updateMusicControl();
});
music.addEventListener('play', updateMusicControl);
music.addEventListener('pause', updateMusicControl);
music.addEventListener('volumechange', updateMusicControl);
async function startMusicAfterGesture(event) {
  if (event.target === musicToggle || (!music.paused && !music.muted)) return;
  music.muted = false;
  try {
    await music.play();
    document.removeEventListener('pointerdown', startMusicAfterGesture, true);
    document.removeEventListener('keydown', startMusicAfterGesture, true);
    updateMusicControl();
  } catch { updateMusicControl(); }
}
document.addEventListener('pointerdown', startMusicAfterGesture, true);
document.addEventListener('keydown', startMusicAfterGesture, true);
music.play().then(updateMusicControl).catch(() => {
  musicToggle.textContent = 'Activar música';
  musicToggle.setAttribute('aria-label', 'Activar música');
});
