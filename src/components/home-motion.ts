const clamp = (value: number, max = 1) => Math.min(max, Math.max(0, value));

function mountCrafts(crafts: HTMLElement, motion: MediaQueryList) {
  const dots = [...crafts.querySelectorAll<HTMLButtonElement>('[data-craft-dot]')];
  const copies = [...crafts.querySelectorAll<HTMLElement>('[data-craft-copy]')];
  const play = crafts.querySelector<HTMLButtonElement>('[data-craft-play]')!;
  const controls = crafts.querySelector<HTMLElement>('.sk-craft-controls')!;
  controls.hidden = false;
  let active = 0;
  let elapsed = 0;
  let last = 0;
  let frame = 0;
  let visible = false;
  let paused = motion.matches;
  let hover = false;
  const duration = 6500;

  function show(index: number) {
    active = index;
    elapsed = 0;
    dots.forEach((dot, n) => {
      dot.setAttribute('aria-pressed', String(n === index));
      copies[n].hidden = n !== index;
    });
    crafts.style.setProperty('--craft-angle', paused || motion.matches ? '360deg' : '0deg');
  }
  function animate(now: number) {
    if (last) elapsed += Math.min(now - last, 150);
    last = now;
    if (elapsed >= duration) show((active + 1) % dots.length);
    crafts.style.setProperty('--craft-angle', (360 * elapsed / duration).toFixed(1) + 'deg');
    frame = requestAnimationFrame(animate);
  }
  function refresh() {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    const label = paused ? '播放自动切换' : '暂停自动切换';
    play.setAttribute('aria-label', label);
    play.title = label;
    play.querySelector('span')!.textContent = paused ? '▷' : 'Ⅱ';
    if (visible && !paused && !hover && !document.hidden) frame = requestAnimationFrame(animate);
  }
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => show(i));
    dot.addEventListener('keydown', event => {
      let next = i;
      if (event.key === 'ArrowRight') next = (i + 1) % dots.length;
      else if (event.key === 'ArrowLeft') next = (i - 1 + dots.length) % dots.length;
      else return;
      event.preventDefault();
      dots[next].focus();
      show(next);
    });
  });
  play.addEventListener('click', () => { paused = !paused; refresh(); });
  crafts.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hover = true; refresh(); } });
  crafts.addEventListener('pointerleave', () => { hover = false; refresh(); });
  motion.addEventListener('change', () => { paused = motion.matches; show(active); refresh(); });
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; refresh(); }).observe(crafts);
  document.addEventListener('visibilitychange', refresh);
  show(0);
  refresh();
}

export function mountHome() {
  const root = document.querySelector<HTMLElement>('.sky-home');
  if (!root) return;
  root.querySelectorAll<HTMLDialogElement>('[data-work-dialog]').forEach(dialog => {
    const close = dialog.querySelector<HTMLButtonElement>('.sk-summary-close')!;
    root.querySelectorAll<HTMLAnchorElement>(`[data-work-preview="${dialog.dataset.workDialog}"]`).forEach(link => {
      link.setAttribute('aria-haspopup', 'dialog');
      link.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        dialog.showModal();
        close.focus({ preventScroll: true });
      });
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const crafts = root.querySelector<HTMLElement>('[data-crafts]')!;
  mountCrafts(crafts, motion);

  const hero = root.querySelector<HTMLElement>('[data-hero]')!;
  const facts = root.querySelector<HTMLElement>('[data-facts]')!;
  const projects = root.querySelector<HTMLElement>('[data-projects]')!;
  const factItems = [...facts.querySelectorAll<HTMLElement>('[data-fact-item]')];
  const factImages = [...facts.querySelectorAll<HTMLElement>('[data-fact-image]')];
  const factButtons = [...facts.querySelectorAll<HTMLButtonElement>('[data-fact-select]')];
  const track = projects.querySelector<HTMLElement>('[data-projects-track]')!;
  const viewport = projects.querySelector<HTMLElement>('[data-projects-viewport]')!;
  const cards = [...track.querySelectorAll<HTMLElement>('[data-work-card]')];
  const controls = projects.querySelector<HTMLElement>('.sk-project-controls')!;
  const prev = controls.querySelector<HTMLButtonElement>('[data-project-prev]')!;
  const next = controls.querySelector<HTMLButtonElement>('[data-project-next]')!;
  const count = controls.querySelector<HTMLElement>('[data-project-counter]')!;
  const sections = [hero, facts, projects].map(section => ({
    section, pin: section.firstElementChild as HTMLElement, distance: 0, inset: 66,
  }));
  let cardStops: number[] = [];
  let currentCard = 0;
  let scrub = false;
  let frame = 0;

  function selectFact(position: number) {
    const selected = Math.round(position);
    factItems.forEach((item, index) => {
      const proximity = Math.max(0, 1 - Math.abs(position - index));
      item.style.setProperty('--fact-scale', (.83 + .17 * proximity).toFixed(3));
      item.style.setProperty('--fact-opacity', (.43 + .57 * proximity).toFixed(3));
      item.classList.toggle('is-current', selected === index);
      factImages[index].classList.toggle('is-current', selected === index);
      factButtons[index].setAttribute('aria-pressed', String(selected === index));
    });
  }

  function draw() {
    frame = 0;
    if (!scrub) return;
    const progress = sections.map(({section, distance, inset}) => clamp((inset - section.getBoundingClientRect().top) / distance));
    hero.style.setProperty('--banner-shift', (progress[0] * -8).toFixed(2) + 'px');
    hero.style.setProperty('--banner-scale', (1 + .075 * progress[0]).toFixed(4));
    selectFact(progress[1] * (factItems.length - 1));
    const shift = progress[2] * sections[2].distance;
    track.style.transform = `translate3d(${-shift}px,0,0)`;
    currentCard = cardStops.reduce((closest, stop, i) => Math.abs(stop - shift) < Math.abs(cardStops[closest] - shift) ? i : closest, 0);
    count.textContent = String(currentCard + 1).padStart(2, '0') + ' / ' + String(cards.length).padStart(2, '0');
    prev.disabled = currentCard === 0;
    next.disabled = currentCard === cards.length - 1;
  }
  function requestDraw() { if (!frame) frame = requestAnimationFrame(draw); }
  function measure() {
    scrub = !motion.matches && window.innerHeight >= 445;
    controls.hidden = !scrub;
    factButtons.forEach(button => { button.hidden = !scrub; });
    sections.forEach(({section}) => section.toggleAttribute('data-scrub', scrub));
    if (!scrub) {
      sections.forEach(({section}) => section.style.removeProperty('height'));
      hero.style.removeProperty('--banner-shift');
      hero.style.removeProperty('--banner-scale');
      track.style.removeProperty('transform');
      selectFact(0);
      return;
    }
    const vh = window.innerHeight;
    const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 66;
    selectFact(0);
    const travel = Math.max(1, track.scrollWidth - viewport.clientWidth);
    const first = cards[0].offsetLeft;
    cardStops = cards.map(card => clamp(card.offsetLeft - first, travel));
    cardStops[cardStops.length - 1] = travel;
    const distances = [Math.max(120, vh * .28), Math.max(500, vh * 1.12), travel];
    sections.forEach((item, index) => {
      item.inset = Math.min(headerHeight, vh - item.pin.offsetHeight);
      item.distance = distances[index];
      item.section.style.setProperty('--sk-pin-top', item.inset + 'px');
      item.section.style.height = Math.ceil(item.pin.offsetHeight + item.distance) + 'px';
    });
    draw();
  }
  function jump(sectionIndex: number, distance: number, smooth: boolean) {
    if (!scrub) return;
    const item = sections[sectionIndex];
    const y = window.scrollY + item.section.getBoundingClientRect().top - item.inset + distance;
    window.scrollTo({ top: y, behavior: smooth && !motion.matches ? 'smooth' : 'instant' });
  }
  function goCard(index: number) { jump(2, cardStops[clamp(index, cards.length - 1)], true); }
  prev.addEventListener('click', () => goCard(currentCard - 1));
  next.addEventListener('click', () => goCard(currentCard + 1));
  factButtons.forEach((button, i) => button.addEventListener('click', () => jump(1, sections[1].distance * i / (factButtons.length - 1), true)));
  cards.forEach((card, i) => {
    card.addEventListener('focusin', event => {
      const target = event.target as HTMLElement;
      if (scrub && target.matches(':focus-visible')) jump(2, cardStops[i], false);
    });
  });
  window.addEventListener('scroll', requestDraw, { passive: true });
  let resizeFrame = 0;
  function remeasure() { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(measure); }
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', remeasure);
  document.fonts?.ready.then(remeasure);
  motion.addEventListener('change', remeasure);
  measure();
}
