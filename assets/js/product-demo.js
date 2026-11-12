
(() => {
  const demo = document.querySelector('[data-portal-demo]');
  if (!demo) return;

  const stage = demo.querySelector('.pd-stage');
  const field = name => demo.querySelector(`[data-pd-${name}]`);
  const actions = name => [...stage.querySelectorAll(`[data-pd-action="${name}"]`)];
  const cursor = field('cursor');
  const wizard = field('wizard');
  const wizardBody = field('wizard-body');
  const stepList = field('steps');
  const next = actions('next')[0];
  const opening = field('opening');
  const ending = field('ending');
  const clock = field('clock');
  const narration = field('audio');
  const soundButton = field('sound');
  const captionsButton = field('captions');
  const subtitleBox = field('subtitles');
  const subtitleText = field('subtitle-text');
  const controls = field('controls');
  const play = field('play');
  const progress = controls.querySelector('progress');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');

  const subtitleCues = [
    { start: .10, end: 2.78, text: 'Prijava na tender u trideset dvije sekunde.' },
    { start: 3.56, end: 7.70, text: 'Odaberite tender i pregledajte uslove i tehničku specifikaciju.' },
    { start: 8.52, end: 13.55, text: 'Provjerite dobavljače i potrebnu dokumentaciju, pa započnite pripremu ponude.' },
    { start: 14.30, end: 17.85, text: 'Potvrdite raspoložive stavke i obezbijeđenu nabavku.' },
    { start: 18.60, end: 23.20, text: 'Zatim provjerite ispunjenost uslova i označite potvrde koje su potrebne.' },
    { start: 23.94, end: 28.10, text: 'Pregledajte oba dokumenta i potvrdite da su podaci tačni i potpuni.' },
    { start: 28.58, end: 31.98, text: 'Provjerite ponudu i podatke, pa pošaljite prijavu.' }
  ];

  const tenders = [
    { fit: 96, deadline: 12, amount: '25.000 €', summary: 'Dvije stavke odgovaraju profilu firme. Jedna stavka traži dopunu prije prijave.' },
    { fit: 92, deadline: 8, amount: '42.000 €', summary: 'Raspoložive stavke odgovaraju traženoj specifikaciji. Za jednu stavku je potrebna nabavka.' }
  ];
  const checklists = [
    { heading: 'Potvrda raspoloživih stavki', intro: 'Potvrdite dostupnost i usklađenost stavki.', rows: ['Stavka 1', 'Stavka 2'], caption: 'Raspoloživo i usklađeno sa specifikacijom' },
    { heading: 'Potvrda nabavke nedostajućih stavki', intro: 'Potvrdite da su nedostajuće stavke obezbijeđene.', rows: ['Stavka 3'], caption: 'Nabavljeno preko dobavljača' },
    { heading: 'Provjera uslova i sertifikata', intro: 'Potvrdite ispunjenost uslova i potrebne dokaze.', rows: ['Obavezni uslov 1', 'Sertifikat 1'], caption: 'Potvrđeno važećom dokumentacijom' }
  ];
  const documents = [
    { heading: 'Izjava o ispunjenosti uslova', copy: 'Potvrđuje se ispunjenost uslova navedenih u primjeru tenderske dokumentacije.' },
    { heading: 'Obrazac ponude', copy: 'Obrazac sadrži pregled stavki i dokaza priloženih uz probnu ponudu.' }
  ];
  const reviewed = new Set();
  let wizardStep = 0;
  let activeDoc = 0;

  function announce(message) {
    field('status').textContent = message;
  }

  function showTab(name) {
    stage.querySelectorAll('[data-pd-tab]').forEach(tab => tab.classList.toggle('is-active', tab.dataset.pdTab === name));
    stage.querySelectorAll('[data-pd-panel]').forEach(panel => { panel.hidden = panel.dataset.pdPanel !== name; });
  }

  function selectTender(index) {
    const { fit, deadline, amount, summary } = tenders[index];
    const number = index + 1;
    stage.querySelectorAll('[data-pd-tender]').forEach(row => row.classList.toggle('is-active', Number(row.dataset.pdTender) === number));
    field('tender-number').textContent = `Tender #${number}`;
    field('tender-title').textContent = `Tender ${number}`;
    field('authority').textContent = `Naručilac ${number}`;
    field('fit').textContent = `${fit}% podudarnost`;
    field('deadline').textContent = `Rok: ${deadline} dana`;
    field('time').textContent = `${deadline} dana`;
    field('amount').textContent = amount;
    field('summary').textContent = summary;
    showTab('overview');
  }

  function checkRow(label, caption = '', action = '', checked = false) {
    return `<div class="pd-check${checked ? ' is-checked' : ''}"${action ? ` data-pd-action="${action}"` : ''}><i></i><span><strong>${label}</strong>${caption ? `<small>${caption}</small>` : ''}</span></div>`;
  }

  function checklistBody({ heading, intro, rows, caption }) {
    return `<div class="pd-wizard-heading"><h4>${heading}</h4><div class="pd-check-tools"><span data-pd-count>0 / ${rows.length} potvrđeno</span><span class="pd-button" data-pd-action="check-all">Označi sve</span></div></div>
      <p>${intro}</p><div class="pd-checklist">${rows.map(label => checkRow(label, caption)).join('')}</div>`;
  }

  function documentBody() {
    const doc = documents[activeDoc];
    const tabs = documents.map((_, index) => `<span class="${index === activeDoc ? 'is-active' : ''}" data-pd-action="doc-${index}">${reviewed.has(index) ? '✓ ' : ''}Dokument ${index + 1}</span>`).join('');
    return `<div class="pd-wizard-heading"><h4>Pregled dokumentacije</h4><span class="pd-check-tools">${reviewed.size} / ${documents.length} pregledano</span></div>
      <p>Otvorite i potvrdite svaki Word dokument.</p><div class="pd-doc-tabs">${tabs}</div>
      <div class="pd-document"><div class="pd-paper"><strong>${doc.heading}</strong><p>${doc.copy}</p></div></div>
      ${checkRow('Potvrđujem da je dokument pregledan, tačan i potpun.', '', 'review-doc', reviewed.has(activeDoc))}`;
  }

  function summaryBody() {
    return `<h4>Završni pregled ponude</h4><p>Potvrđene stavke i pregledana dokumentacija.</p>
      <div class="pd-summary"><span>✓ Raspoložive stavke potvrđene</span><span>✓ Nedostajuća stavka obezbijeđena</span><span>✓ Uslovi i sertifikati potvrđeni</span><span>✓ Oba Word dokumenta pregledana</span></div>
      <div class="pd-checklist">
        ${checkRow('Potvrđujem tačnost podataka i sadržaja ponude.', '', 'accuracy')}
        ${checkRow('Potvrđujem da je prijava probna.', '', 'simulation')}
      </div>`;
  }

  function updateFooter() {
    const labels = ['Nastavi →', 'Nastavi →', 'Nastavi →', 'Završni pregled →', 'Pošalji probnu prijavu', 'Završi'];
    const unchecked = wizardBody.querySelector('.pd-check:not(.is-checked)');
    const ready = wizardStep === 5 || (wizardStep === 3 ? reviewed.size === documents.length : !unchecked);
    next.textContent = labels[wizardStep];
    next.toggleAttribute('data-disabled', !ready);
    field('save').textContent = wizardStep === 5 ? 'Probna prijava evidentirana' : 'Izmjene su sačuvane';
  }

  function renderWizard(step) {
    wizardStep = step;
    stepList.hidden = step === 5;
    [...stepList.children].forEach((item, index) => {
      item.classList.toggle('is-active', index === step);
      item.classList.toggle('is-complete', index < step);
      item.firstElementChild.textContent = index < step ? '✓' : index + 1;
    });
    if (step < 3) wizardBody.innerHTML = checklistBody(checklists[step]);
    else if (step === 3) wizardBody.innerHTML = documentBody();
    else if (step === 4) wizardBody.innerHTML = summaryBody();
    else wizardBody.innerHTML = '<div class="pd-success"><div class="pd-success-mark">✓</div><h4>Probna prijava evidentirana</h4><p>Ponuda poslata u demonstraciji.</p><div class="pd-receipt"><small>Potvrda probne prijave</small><strong>DEMO-002</strong><span>Tender 2</span></div></div>';
    updateFooter();
    announce(wizardBody.querySelector('h4').textContent);
  }

  function confirmChecklist() {
    const rows = [...wizardBody.querySelectorAll('.pd-check')];
    rows.forEach(row => row.classList.add('is-checked'));
    field('count').textContent = `${rows.length} / ${rows.length} potvrđeno`;
    actions('check-all')[0].textContent = 'Poništi izbor';
    updateFooter();
  }

  function showDocument(index) {
    activeDoc = index;
    wizardBody.innerHTML = documentBody();
    updateFooter();
  }

  function confirmDocument() {
    reviewed.add(activeDoc);
    showDocument(activeDoc);
  }

  function confirmFinal(name) {
    actions(name)[0].classList.add('is-checked');
    updateFooter();
  }

  function showSubmitted(visible) {
    field('browse').hidden = visible;
    field('submitted').hidden = !visible;
    field('page-title').textContent = visible ? 'Poslate ponude' : 'Tenderi';
    field('tender-nav').classList.toggle('is-active', !visible);
    actions('submitted').forEach(item => item.classList.toggle('is-active', visible));
  }

  function submitDemo() {
    renderWizard(5);
  }

  const sequence = [
    [null, null, 2300],
    [null, () => { opening.hidden = true; announce('Pregled tendera.'); }, 1600],
    ['tender-2', () => { selectTender(1); announce('Odabran je Tender 2.'); }, 1250],
    ['requirements', () => showTab('requirements'), 950],
    ['specification', () => { field('specification').hidden = false; field('spec-icon').textContent = '▴'; }, 1300],
    ['suppliers', () => showTab('suppliers'), 1450],
    ['documents', () => showTab('documents'), 1450],
    ['overview', () => showTab('overview'), 650],
    ['prepare', () => { wizard.hidden = false; renderWizard(0); }, 1050],
    ['check-all', confirmChecklist, 750],
    ['next', () => renderWizard(1), 1000],
    ['check-all', confirmChecklist, 750],
    ['next', () => renderWizard(2), 1000],
    ['check-all', confirmChecklist, 750],
    ['next', () => renderWizard(3), 1400],
    ['review-doc', confirmDocument, 750],
    ['doc-1', () => showDocument(1), 1250],
    ['review-doc', confirmDocument, 750],
    ['next', () => renderWizard(4), 1100],
    ['accuracy', () => confirmFinal('accuracy'), 650],
    ['simulation', () => confirmFinal('simulation'), 650],
    ['next', submitDemo, 2850],
    ['next', () => { wizard.hidden = true; }, 500],
    ['submitted', () => { showSubmitted(true); announce('Tender 2 prikazan je u evidenciji probnih ponuda.'); }, 2300],
    [null, () => { ending.hidden = false; announce(ending.textContent.trim()); }, 1900]
  ];

  const travel = 460;
  const clickLength = 300;
  const durationOf = ([target, , hold]) => hold + (target ? travel : 0);
  const beforeSubmit = sequence.slice(0, sequence.findIndex(([, apply]) => apply === submitDemo));
  const submitTime = beforeSubmit.reduce((total, step) => total + durationOf(step), travel);
  const seconds = Math.round(submitTime / 1000);
  const lastDigit = seconds % 10;
  const isTeen = seconds % 100 >= 11 && seconds % 100 <= 14;
  const unit = isTeen ? 'sekundi' : lastDigit === 1 ? 'sekundu' : lastDigit >= 2 && lastDigit <= 4 ? 'sekunde' : 'sekundi';
  field('runtime').textContent = `${seconds} ${unit}`;
  progress.max = sequence.reduce((total, step) => total + durationOf(step), 0);
  let index = 0;
  let elapsed = 0;
  let completedTime = 0;
  let frame = 0;
  let lastTime = 0;
  let clicked = false;
  let visible = false;
  let paused = motion.matches;
  let done = false;
  let position;
  let origin;
  let narrationEnabled = true;
  let narrationPending = false;
  let narrationAttempt = 0;
  let autoplayBlocked = false;

  function updateSubtitles(played) {
    const time = played / 1000;
    const cue = subtitleCues.find(item => time >= item.start && time < item.end);
    const text = cue?.text || '';
    if (subtitleText.textContent !== text) subtitleText.textContent = text;
  }

  function updateSoundButton() {
    soundButton.textContent = narrationEnabled ? 'Isključi zvuk' : autoplayBlocked ? 'Pokreni sa zvukom' : 'Uključi zvuk';
    soundButton.setAttribute('aria-pressed', String(narrationEnabled));
  }

  function isPlaying() {
    return visible && !paused && !done && !document.hidden;
  }

  function syncNarration() {
    if (!isPlaying() || !narrationEnabled || progress.value >= submitTime) {
      if (!narration.paused) narration.pause();
      return;
    }
    if (!narration.paused || narrationPending) return;
    narration.currentTime = progress.value / 1000;
    narrationPending = true;
    const attempt = ++narrationAttempt;
    narration.play().then(() => {
      if (attempt !== narrationAttempt) return;
      narrationPending = false;
      if (!isPlaying() || !narrationEnabled) narration.pause();
    }).catch(error => {
      if (attempt !== narrationAttempt) return;
      narrationPending = false;
      if (error.name === 'AbortError') return;
      narrationEnabled = false;
      autoplayBlocked = error.name === 'NotAllowedError';
      updateSoundButton();
      if (!autoplayBlocked) {
        soundButton.textContent = 'Zvuk nedostupan';
        soundButton.disabled = true;
      }
      syncPlayback();
    });
  }

  function updateClock(played) {
    const elapsedSeconds = played >= submitTime ? seconds : Math.floor(played / 1000);
    const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const remainder = String(elapsedSeconds % 60).padStart(2, '0');
    const reading = `${minutes}:${remainder}`;
    if (clock.textContent !== reading) {
      clock.textContent = reading;
      clock.dateTime = `PT${elapsedSeconds}S`;
    }
  }

  function moveCursor(x, y, ring = 0) {
    position = { x, y };
    cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
    cursor.style.setProperty('--pd-click', ring);
    cursor.style.setProperty('--pd-ring', 1.65 - ring * .85);
  }

  function targetPosition(name) {
    const target = actions(name).find(item => item.getClientRects().length);
    if (!target) return position;
    const rect = target.getBoundingClientRect();
    const bounds = stage.getBoundingClientRect();
    return { x: rect.left - bounds.left + rect.width * .5, y: rect.top - bounds.top + rect.height * .5 };
  }

  function syncPlayback() {
    const label = done ? 'Pusti ponovo' : paused ? (completedTime + elapsed ? 'Nastavi' : 'Pokreni') : 'Pauziraj';
    if (play.textContent !== label) play.textContent = label;
    syncNarration();
    if (isPlaying()) {
      if (!frame) frame = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  }

  function animate(now) {
    frame = 0;
    const delta = lastTime ? Math.max(0, now - lastTime) : 0;
    lastTime = now;
    const current = completedTime + elapsed;
    const followAudio = narrationEnabled && current < submitTime && !narration.ended;
    const played = Math.min(progress.max, followAudio ? narration.currentTime * 1000 : current + delta);

    while (index < sequence.length) {
      const [target, apply, hold] = sequence[index];
      const movement = target ? travel : 0;
      const duration = movement + hold;
      elapsed = Math.max(0, played - completedTime);
      if (target && !clicked && !motion.matches) {
        const destination = targetPosition(target);
        origin ??= position;
        const amount = Math.min(1, elapsed / movement);
        const ease = amount * amount * (3 - 2 * amount);
        moveCursor(origin.x + (destination.x - origin.x) * ease, origin.y + (destination.y - origin.y) * ease);
      }
      if (!clicked && elapsed >= movement) {
        clicked = true;
        apply?.();
      }
      if (target && clicked && !motion.matches) moveCursor(position.x, position.y, Math.max(0, 1 - (elapsed - movement) / clickLength));
      if (elapsed < duration) break;
      completedTime += duration;
      elapsed -= duration;
      origin = undefined;
      clicked = false;
      index++;
    }
    done = index === sequence.length;
    if (done) cursor.hidden = true;
    progress.value = played;
    updateClock(played);
    updateSubtitles(played);
    syncPlayback();
  }

  function reset() {
    narrationAttempt++;
    narrationPending = false;
    narration.pause();
    narration.currentTime = 0;
    index = 0;
    elapsed = 0;
    completedTime = 0;
    lastTime = 0;
    origin = undefined;
    clicked = false;
    done = false;
    activeDoc = 0;
    reviewed.clear();
    opening.hidden = false;
    ending.hidden = true;
    wizard.hidden = true;
    field('specification').hidden = true;
    field('spec-icon').textContent = '▾';
    showSubmitted(false);
    selectTender(0);
    cursor.hidden = motion.matches;
    moveCursor(stage.clientWidth * .46, stage.clientHeight * .21);
    progress.value = 0;
    updateClock(0);
    updateSubtitles(0);
    announce(opening.textContent.trim());
  }

  controls.hidden = false;
  reset();
  updateSoundButton();
  play.addEventListener('click', () => {
    if (done) { reset(); paused = false; }
    else paused = !paused;
    syncPlayback();
  });
  field('restart').addEventListener('click', () => { reset(); paused = false; syncPlayback(); });
  soundButton.addEventListener('click', () => {
    narrationEnabled = !narrationEnabled;
    if (narrationEnabled && (autoplayBlocked || done)) {
      reset();
      paused = false;
    }
    autoplayBlocked = false;
    updateSoundButton();
    syncPlayback();
  });
  captionsButton.addEventListener('click', () => {
    subtitleBox.hidden = !subtitleBox.hidden;
    captionsButton.setAttribute('aria-pressed', String(!subtitleBox.hidden));
  });
  narration.addEventListener('error', () => {
    narrationEnabled = false;
    updateSoundButton();
    soundButton.textContent = 'Zvuk nedostupan';
    soundButton.disabled = true;
    syncPlayback();
  });
  motion.addEventListener('change', () => {
    cursor.hidden = motion.matches || done;
    if (motion.matches) paused = true;
    syncPlayback();
  });
  document.addEventListener('visibilitychange', syncPlayback);
  const visiblePortion = .55;
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= visiblePortion;
    syncPlayback();
  }, { threshold: visiblePortion }).observe(stage);
  syncPlayback();
})();
