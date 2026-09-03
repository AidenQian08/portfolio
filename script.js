// ---------------------------------------------------------------------------
// Navigation Menu
// ---------------------------------------------------------------------------
const menuToggle = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');
const menuClose = document.querySelector('.menu-close');
const menuLinks = document.querySelectorAll('.menu-link');

function closeMenu() {
  menuPanel.classList.remove('open');
  menuToggle.style.display = '';
}

function toggleMenu() {
  menuPanel.classList.toggle('open');
  if (menuPanel.classList.contains('open')) {
    menuToggle.style.display = 'none';
  } else {
    menuToggle.style.display = '';
  }
}

menuToggle.addEventListener('click', toggleMenu);
menuClose.addEventListener('click', closeMenu);

// Close menu when clicking a link
menuLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    closeMenu();
    // Let the browser handle the anchor scroll via the href
  });
});

// Close menu when clicking outside it
document.addEventListener('click', (e) => {
  if (!menuPanel.contains(e.target) && !menuToggle.contains(e.target)) {
    closeMenu();
  }
});

// ---------------------------------------------------------------------------
// IntersectionObserver for scroll-triggered animations
// ---------------------------------------------------------------------------
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
    }
  });
}, observerOptions);

// Observe all elements with animate-on-scroll class and children with animation classes
document.querySelectorAll('.animate-on-scroll').forEach(el => {
  observer.observe(el);

  // Also observe child elements with animation classes
  el.querySelectorAll('.fly-left, .fade-up').forEach(child => {
    observer.observe(child);
  });
});

// Animate project list items in as they scroll into view, staggered by order
document.querySelectorAll('.project-item').forEach((item, index) => {
  item.style.transitionDelay = `${index * 0.15}s`;
  observer.observe(item);
});

// Accordion: click a project title to reveal/hide its details
document.querySelectorAll('.project-header').forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.project-item');
    const isOpen = item.classList.contains('open');
    item.classList.toggle('open', !isOpen);
    header.setAttribute('aria-expanded', String(!isOpen));
    // The accordion changes document height once its expand/collapse transition
    // finishes, so the flight path needs to be redrawn against the new layout.
    setTimeout(rebuildFlightPath, 450);
  });
});

// Observe project title
const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  observer.observe(projectsTitle);
}

// Observe contact title and elements
const contactTitle = document.querySelector('.contact-title');
if (contactTitle) {
  observer.observe(contactTitle);
}

const resumeSection = document.querySelector('.resume-section');
if (resumeSection) {
  observer.observe(resumeSection);
}

const contactIcons = document.querySelector('.contact-icons');
if (contactIcons) {
  observer.observe(contactIcons);
}

// ---------------------------------------------------------------------------
// Decorative flight path: a dashed line runs the full length of the page and
// a small plane glides along it in sync with scroll position. The whole
// layer sits at z-index -1 (see .flight-path-layer in style.css) so it can
// never sit on top of, or interfere with, readable content.
// ---------------------------------------------------------------------------

const flightLayer = document.querySelector('.flight-path-layer');
const flightSvg = document.querySelector('.flight-path-svg');
const flightPath = document.querySelector('.flight-path');
const planeIcon = document.querySelector('.airplane-icon');
const heroH = document.getElementById('hero-h');

function getDocRect(el) {
  const r = el.getBoundingClientRect();
  return {
    top: r.top + window.scrollY,
    left: r.left + window.scrollX,
    width: r.width,
    height: r.height,
    bottom: r.top + window.scrollY + r.height,
    right: r.left + window.scrollX + r.width
  };
}

// Catmull-Rom-style smoothing: turns a list of waypoints into one flowing
// cubic-bezier path, so the line curves naturally instead of hitting each
// waypoint at a sharp angle.
function smoothPathFromPoints(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y} `;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y} `;
  }
  return d;
}

function pointsAroundCircle(cx, cy, r, startDeg, endDeg, count) {
  const pts = [];
  for (let i = 0; i <= count; i++) {
    const deg = startDeg + ((endDeg - startDeg) * i) / count;
    const rad = (deg * Math.PI) / 180;
    pts.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
  }
  return pts;
}

function pointsSpiral(cx, cy, startRadius, turns, pointsPerTurn) {
  const pts = [];
  const totalPoints = turns * pointsPerTurn;
  for (let i = 0; i <= totalPoints; i++) {
    const t = i / totalPoints;
    const deg = t * turns * 360;
    const rad = (deg * Math.PI) / 180;
    const radius = startRadius * (1 - t * 0.75);
    pts.push({ x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) });
  }
  return pts;
}

function rebuildFlightPath() {
  if (!flightLayer || !flightSvg || !flightPath || !heroH) return;

  const docWidth = document.documentElement.clientWidth;
  const docHeight = document.documentElement.scrollHeight;
  flightLayer.style.height = `${docHeight}px`;
  flightSvg.setAttribute('viewBox', `0 0 ${docWidth} ${docHeight}`);
  flightSvg.setAttribute('width', docWidth);
  flightSvg.setAttribute('height', docHeight);

  const heroSection = document.querySelector('.hero');
  const aboutSection = document.querySelector('.about');
  const aboutPhoto = document.querySelector('.about-photo-wrapper');
  const projectsSection = document.querySelector('.projects');
  const contactSection = document.querySelector('.contact');
  const contactIconsEl = document.querySelector('.contact-icons');

  const heroR = getDocRect(heroSection);
  const aboutR = getDocRect(aboutSection);
  const photoR = aboutPhoto ? getDocRect(aboutPhoto) : null;
  const projR = getDocRect(projectsSection);
  const contR = getDocRect(contactSection);
  const iconsR = contactIconsEl ? getDocRect(contactIconsEl) : null;

  const hRect = heroH.getBoundingClientRect();
  const startX = hRect.left + window.scrollX + hRect.width * 0.3;
  const startY = hRect.top + window.scrollY + hRect.height * 0.45;

  const points = [
    { x: startX, y: startY },
    // Swoop up and to the right out of the "H" (northeast heading)
    { x: docWidth * 0.68, y: heroR.top + heroR.height * 0.2 },
    { x: docWidth * 0.85, y: heroR.top + heroR.height * 0.55 },
    { x: docWidth * 0.55, y: heroR.bottom - 50 },
    { x: docWidth * 0.2, y: aboutR.top + 50 }
  ];

  // Loop around the About photo before continuing down the page
  if (photoR) {
    const cx = photoR.left + photoR.width / 2;
    const cy = photoR.top + photoR.height / 2;
    const r = photoR.width / 2 + 55;
    points.push(...pointsAroundCircle(cx, cy, r, 200, 560, 6));
  }

  points.push(
    { x: docWidth * 0.82, y: aboutR.bottom - 60 },
    { x: docWidth * 0.18, y: projR.top + projR.height * 0.15 },
    { x: docWidth * 0.8, y: projR.top + projR.height * 0.45 },
    { x: docWidth * 0.2, y: projR.top + projR.height * 0.75 },
    { x: docWidth * 0.65, y: projR.bottom - 30 },
    { x: docWidth * 0.35, y: contR.top + contR.height * 0.2 }
  );

  // Spiral inward toward the contact icons to finish the journey
  if (iconsR) {
    const cx = iconsR.left + iconsR.width / 2;
    const cy = iconsR.top - 60;
    points.push(...pointsSpiral(cx, cy, 90, 1.4, 8));
    points.push({ x: iconsR.left + iconsR.width / 2, y: iconsR.top + iconsR.height / 2 });
  }

  flightPath.setAttribute('d', smoothPathFromPoints(points));
}

function updatePlanePosition() {
  if (!flightPath || !planeIcon) return;
  const len = flightPath.getTotalLength();
  if (!len) return;

  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0;
  const dist = progress * len;

  const p1 = flightPath.getPointAtLength(dist);
  const p2 = flightPath.getPointAtLength(Math.min(dist + 2, len));
  const angleDeg = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

  planeIcon.style.transform = `translate(${p1.x - 15}px, ${p1.y - 15}px) rotate(${angleDeg}deg)`;
}

function rebuildAndAnimateFlightPath() {
  rebuildFlightPath();
  updatePlanePosition();
}

rebuildAndAnimateFlightPath();
window.addEventListener('load', rebuildAndAnimateFlightPath);

let flightResizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(flightResizeTimeout);
  flightResizeTimeout = setTimeout(rebuildAndAnimateFlightPath, 200);
});

window.addEventListener('scroll', () => {
  requestAnimationFrame(updatePlanePosition);
});
