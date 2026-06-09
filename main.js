/* BetterTuner landing — lightweight vanilla interactions.
   No framework, no dependencies. Everything degrades gracefully and
   respects prefers-reduced-motion (handled in CSS). */

(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Inline the SVG logo wherever [data-logo] appears ---- */
  const LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 473.12 485.77" aria-hidden="true"><g fill="currentColor"><path d="M243.78,158.1c-74.95,-11.25 -144.23,44.5 -147.91,120.13 -0.13,2.59 -2.5,4.47 -4,4.48 -1.99,0.01 -5.19,-1.4 -5.18,-4.6 0.28,-63.57 39.8,-120.4 99.72,-142.57 37.16,-13.75 77.2,-10.57 113.84,5.5 l-20.97,28.77 c-11.71,-5.91 -22.73,-9.78 -35.5,-11.7Z"/><path d="M350.59,280.81c-0.93,-25.49 -6.96,-48.46 -21.07,-69.41 l14.89,-36.59 c25.73,28.64 41.14,64.98 42.48,103.29 0.38,10.84 -7.1,18.94 -16.5,19.97 -9.6,1.05 -19.37,-5.58 -19.79,-17.26Z"/><path class="logo-stick" d="M331.49,122.86l-128.81,176.94 c-11.99,16.48 -11.36,39.05 5.76,52.09 10.33,7.86 23.17,9.67 35.64,5.51 9.42,-3.14 18.24,-11.13 22.63,-22.57 l30.82,-80.35 67.95,-176.44 -33.99,44.82ZM249.19,330.85c-4.43,11.35 -17.71,13.36 -27.06,9.05 -7.47,-3.45 -14.17,-17.53 -7.45,-26.73 l88.97,-121.94 -54.46,139.62Z"/></g></svg>`;
  document.querySelectorAll("[data-logo]").forEach((el) => { el.innerHTML = LOGO; });

  /* ---- Current year in footer ---- */
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---- Sticky nav background on scroll ---- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile hamburger menu ---- */
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  if (navToggle && navMenu && nav) {
    const setMenu = (open) => {
      navMenu.hidden = !open;
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-menu-open", open);
    };
    navToggle.addEventListener("click", () => setMenu(navMenu.hidden));
    navMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 920) setMenu(false); });
  }

  /* ---- Scroll-reveal with stagger ---- */
  const revealables = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // Stagger siblings within the same grid/row for a cascading feel.
          const siblings = Array.from(el.parentElement?.children || []).filter((c) =>
            c.classList.contains("reveal")
          );
          const idx = Math.max(0, siblings.indexOf(el));
          el.style.transitionDelay = `${Math.min(idx * 80, 320)}ms`;
          el.classList.add("in");
          obs.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add("in"));
  }

  /* ---- Animated count-up for hero stats ---- */
  const counters = document.querySelectorAll("[data-count]");
  const runCounter = (el) => {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const dur = 1100;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver(
      (entries, obs) => entries.forEach((e) => {
        if (e.isIntersecting) { runCounter(e.target); obs.unobserve(e.target); }
      }),
      { threshold: 0.6 }
    );
    counters.forEach((el) => cio.observe(el));
  }

  /* ---- Cycling cents readout on the hero gauge (sells the "lands in tune" idea) ---- */
  const centsEl = document.querySelector("[data-cents]");
  if (centsEl && !reduceMotion) {
    const frames = ["−12 ¢", "−5 ¢", "+3 ¢", "in tune", "in tune"];
    let i = 0;
    setInterval(() => {
      i = (i + 1) % frames.length;
      centsEl.textContent = frames[i];
      centsEl.style.color = frames[i] === "in tune" ? "var(--cyan)" : "var(--text-secondary)";
    }, 800);
  }

  /* ---- Metronome slider (auto-advancing carousel) ---- */
  document.querySelectorAll("[data-mslider]").forEach((slider) => {
    const track = slider.querySelector("[data-track]");
    if (!track) return;
    const viewport = slider.querySelector(".mslider__viewport");
    const slides = track.children;
    const count = slides.length;
    const dots = Array.from(slider.querySelectorAll("[data-go]"));
    let idx = 0;
    let timer = null;

    // Size the viewport to the active slide so shorter slides don't leave a gap.
    const fit = () => { if (viewport && slides[idx]) viewport.style.height = slides[idx].offsetHeight + "px"; };

    const go = (k) => {
      idx = (k + count) % count;
      track.style.transform = `translateX(${-idx * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle("is-active", di === idx));
      fit();
    };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } };
    const start = () => {
      if (reduceMotion) return;
      stop();
      timer = setInterval(() => go(idx + 1), 5000);
    };
    const nudge = (k) => { go(k); start(); };

    slider.querySelector("[data-next]")?.addEventListener("click", () => nudge(idx + 1));
    slider.querySelector("[data-prev]")?.addEventListener("click", () => nudge(idx - 1));
    dots.forEach((d, di) => d.addEventListener("click", () => nudge(di)));
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);

    // Touch swipe (mobile): drag the card horizontally to change slides — the
    // arrows are hidden on small screens, so this is the primary control.
    let tx = 0, ty = 0, tracking = false;
    viewport?.addEventListener("touchstart", (e) => {
      tx = e.touches[0].clientX; ty = e.touches[0].clientY; tracking = true; stop();
    }, { passive: true });
    viewport?.addEventListener("touchend", (e) => {
      if (!tracking) return;
      tracking = false;
      const dx = e.changedTouches[0].clientX - tx;
      const dy = e.changedTouches[0].clientY - ty;
      // Horizontal intent only, and enough travel to count as a swipe.
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) nudge(idx + (dx < 0 ? 1 : -1));
      else start();
    }, { passive: true });
    window.addEventListener("resize", fit);
    window.addEventListener("load", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

    go(0);
    start();
  });

  /* ---- Chords Helper: cycle chords like someone browsing ---- */
  (() => {
    const root = document.querySelector("[data-chords]");
    if (!root) return;

    const PITCH = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
    const GNAMES = ["E", "A", "D", "G", "B", "e"];
    const UNAMES = ["G", "C", "E", "A"];

    // Curated voicings lifted from the app (ChordLibrary). g/u = frets low→high
    // (null = muted, 0 = open); p = triad pitch classes.
    const SEQ = [
      { pc: 0, q: "Major", g: [null, 3, 2, 0, 1, 0], u: [0, 0, 0, 3], p: [0, 4, 7], gpos: "open position" },
      { pc: 7, q: "Major", g: [3, 2, 0, 0, 0, 3], u: [0, 2, 3, 2], p: [7, 11, 2], gpos: "open position" },
      { pc: 9, q: "Minor", g: [null, 0, 2, 2, 1, 0], u: [2, 0, 0, 0], p: [9, 0, 4], gpos: "open position" },
      { pc: 4, q: "Minor", g: [0, 2, 2, 0, 0, 0], u: [0, 4, 3, 2], p: [4, 7, 11], gpos: "open position" },
      { pc: 2, q: "Major", g: [null, null, 0, 2, 3, 2], u: [2, 2, 2, 0], p: [2, 6, 9], gpos: "open position" },
      { pc: 5, q: "Major", g: [1, 3, 3, 2, 1, 1], u: [2, 0, 1, 0], p: [5, 9, 0], gpos: "barre shape" },
    ];

    const qualWord = (q) => (q === "Major" ? "major" : q === "Minor" ? "minor" : q);
    const chordName = (c) => `${PITCH[c.pc]} ${qualWord(c.q)}`;

    // Finger assignment + barre detection, ported from FretboardVoicing.suggestFingering.
    function fingering(frets) {
      const out = new Array(frets.length).fill(null);
      const fretted = [];
      frets.forEach((f, i) => { if (f != null && f > 0) fretted.push([i, f]); });
      if (!fretted.length) return out;
      const byFret = {};
      fretted.forEach(([s, f]) => { (byFret[f] = byFret[f] || []).push(s); });
      const order = Object.keys(byFret).map(Number).sort((a, b) => a - b);
      const minFret = order[0];
      const lowest = byFret[minFret];
      const isBarre = fretted.length > 4 && lowest.length >= 2;
      let nf = 1;
      if (isBarre) {
        lowest.forEach((s) => { out[s] = 1; });
        nf = 2;
        order.filter((f) => f > minFret).forEach((f) => { byFret[f].forEach((s) => { out[s] = Math.min(nf, 4); nf++; }); });
      } else {
        order.forEach((f) => { byFret[f].forEach((s) => { out[s] = Math.min(nf, 4); nf++; }); });
      }
      return out;
    }

    function renderFretboard(frets, names) {
      const n = frets.length;
      const W = 32 + 20 * (n - 1);
      const x = (i) => 16 + 20 * i;
      const X1 = x(n - 1);
      const dotY = (f) => 19 + 22 * f;
      const fingers = fingering(frets);

      let barre = null;
      const grp = {};
      frets.forEach((f, i) => { if (fingers[i] === 1 && f > 0) (grp[f] = grp[f] || []).push(i); });
      for (const f in grp) { if (grp[f].length >= 2) { barre = { fret: +f, strings: grp[f] }; break; } }
      const barreSet = new Set(barre ? barre.strings : []);

      let mk = "", st = "", fr = "", d = "", nm = "";
      frets.forEach((f, i) => {
        if (f === null) mk += `<text x="${x(i)}" y="22">✕</text>`;
        else if (f === 0) mk += `<text x="${x(i)}" y="22">○</text>`;
      });
      for (let i = 0; i < n; i++) st += `<line x1="${x(i)}" y1="30" x2="${x(i)}" y2="140"/>`;
      [52, 74, 96, 118, 140].forEach((y) => { fr += `<line x1="16" y1="${y}" x2="${X1}" y2="${y}"/>`; });

      if (barre) {
        const y = dotY(barre.fret);
        const a = Math.min(...barre.strings), b = Math.max(...barre.strings);
        d += `<rect x="${x(a) - 7.5}" y="${y - 6}" width="${x(b) - x(a) + 15}" height="12" rx="6" fill="var(--cyan)"/>`;
        d += `<text class="fg" x="${(x(a) + x(b)) / 2}" y="${y + 3.5}">1</text>`;
      }
      frets.forEach((f, i) => {
        if (f == null || f <= 0 || barreSet.has(i)) return;
        const y = dotY(f);
        d += `<circle cx="${x(i)}" cy="${y}" r="7.5"/>`;
        if (fingers[i]) d += `<text class="fg" x="${x(i)}" y="${y + 3.5}">${fingers[i]}</text>`;
      });
      names.forEach((nme, i) => { nm += `<text x="${x(i)}" y="156">${nme}</text>`; });

      return `<svg class="fretboard" viewBox="0 0 ${W} 162"><g class="mk">${mk}</g>` +
        `<g class="strings">${st}</g><line class="nut" x1="16" y1="30" x2="${X1}" y2="30"/>` +
        `<g class="frets">${fr}</g><g class="dots">${d}</g><g class="names">${nm}</g></svg>`;
    }

    function renderPiano(pcs) {
      const set = new Set(pcs);
      const whites = [[0, 0], [2, 32], [4, 64], [5, 96], [7, 128], [9, 160], [11, 192]];
      const blacks = [[1, 23], [3, 55], [6, 119], [8, 151], [10, 183]];
      let wk = "", bk = "", pl = "";
      whites.forEach(([pc, xx]) => {
        const hl = set.has(pc);
        wk += `<rect class="${hl ? "hl" : ""}" x="${xx}" y="8" width="32" height="128"/>`;
        if (hl) pl += `<text x="${xx + 16}" y="126">${PITCH[pc]}</text>`;
      });
      blacks.forEach(([pc, xx]) => {
        bk += `<rect class="${set.has(pc) ? "hl" : ""}" x="${xx}" y="8" width="18" height="80"/>`;
      });
      return `<svg class="piano" viewBox="0 0 224 144" preserveAspectRatio="xMidYMid meet">` +
        `<g class="wk">${wk}</g><g class="bk">${bk}</g><g class="pl">${pl}</g></svg>`;
    }

    const rootChips = [...root.querySelectorAll("[data-root]")];
    const qualChips = [...root.querySelectorAll("[data-qual]")];
    const stages = {
      guitar: root.querySelector('[data-fb="guitar"]'),
      ukulele: root.querySelector('[data-fb="ukulele"]'),
      piano: root.querySelector('[data-fb="piano"]'),
    };
    const caps = {
      guitar: root.querySelector('[data-cap="guitar"]'),
      ukulele: root.querySelector('[data-cap="ukulele"]'),
      piano: root.querySelector('[data-cap="piano"]'),
    };

    function setChips(c) {
      rootChips.forEach((el) => el.classList.toggle("is-on", +el.dataset.root === c.pc));
      qualChips.forEach((el) => el.classList.toggle("is-on", el.dataset.qual === c.q));
    }
    function render(c) {
      const name = chordName(c);
      stages.guitar.innerHTML = renderFretboard(c.g, GNAMES);
      stages.ukulele.innerHTML = renderFretboard(c.u, UNAMES);
      stages.piano.innerHTML = renderPiano(c.p);
      caps.guitar.textContent = `${name} · ${c.gpos}`;
      caps.ukulele.textContent = `${name} · re-entrant GCEA`;
      caps.piano.textContent = `${name} · root · third · fifth`;
    }

    setChips(SEQ[0]);
    render(SEQ[0]);

    if (!reduceMotion) {
      let i = 0;
      let timer = null;
      const advance = () => {
        i = (i + 1) % SEQ.length;
        const c = SEQ[i];
        setChips(c);
        const list = Object.values(stages);
        list.forEach((s) => s.classList.add("swap"));
        setTimeout(() => { render(c); list.forEach((s) => s.classList.remove("swap")); }, 240);
      };
      const start = () => { timer = setInterval(advance, 3000); };
      start();
      root.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
      root.addEventListener("mouseleave", start);
    }
  })();

  /* ---- Vocal & Ear Trainer: live, self-playing demos ---- */
  (() => {
    const root = document.querySelector("[data-trainer]");
    if (!root) return;
    const q = (s) => root.querySelector(s);

    // Vocal trainer — sing through an ascending aaroh, locking each swara in tune.
    const SWARAS = [["Sa", 261.6], ["Re", 293.7], ["Ga", 329.6], ["Ma", 349.2], ["Pa", 392.0], ["Dha", 440.0], ["Ni", 493.9], ["Sa'", 523.3]];
    const OFFS = [-12, 9, -15, 7, -18, 11, -8, 6];
    const vSwara = q("[data-vt-swara]"), vHz = q("[data-vt-hz]"), vStep = q("[data-vt-step]"),
      vProg = q("[data-vt-prog]"), vCents = q("[data-vt-cents]"), vHold = q("[data-vt-hold]"),
      vTrace = q(".vt-trace"), vLine = q("[data-vt-line]");

    // Pitch-contour engine — instead of a clean sine, draw a real pitch trace:
    // a near-horizontal line whose height is cents deviation over time. It scoops
    // into each note (a smoothing lag), wavers while the voice hunts for pitch,
    // then settles into the centre band with a gentle vibrato once locked in.
    const N = 72, DX = 300 / (N - 1), CENTER = 40;   // SVG units (viewBox 300×80)
    const buf = new Array(N).fill(CENTER);
    const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
    const pen = { target: CENTER, jitter: 6.5, vib: 0, follow: 0.16 };
    let cur = CENTER, vph = 0;
    const drawLine = () => {
      let d = "M0 " + buf[0].toFixed(1);
      for (let i = 1; i < N; i++) d += "L" + (i * DX).toFixed(1) + " " + buf[i].toFixed(1);
      vLine.setAttribute("d", d);
    };
    function frame() {
      vph += 0.55;                              // vibrato phase
      cur += (pen.target - cur) * pen.follow;   // ease toward target → scoop / glide between notes
      buf.push(clamp(cur + Math.sin(vph) * pen.vib + (Math.random() * 2 - 1) * pen.jitter, 6, 74));
      buf.shift();
      drawLine();
    }

    function vocalStep(i) {
      const [name, hz] = SWARAS[i];
      vSwara.textContent = name;
      vHz.textContent = hz.toFixed(1) + " Hz";
      vStep.textContent = `Step ${i + 1} of 8`;
      vProg.style.width = ((i + 1) / 8 * 100) + "%";
      const off = OFFS[i];
      const flat = off < 0;
      vCents.textContent = flat ? `▲ ${off} ¢` : `▼ +${off} ¢`;
      vCents.className = "vt-cents " + (flat ? "is-flat" : "is-sharp");
      vTrace.className = "vt-trace " + (flat ? "is-flat" : "is-sharp");
      vHold.style.transition = "none";
      vHold.style.width = "0%";
      // Searching: aim above (sharp) / below (flat) the band, unsteady, no vibrato.
      pen.target = CENTER + (flat ? 22 : -20);
      pen.jitter = 6.5; pen.vib = 0; pen.follow = 0.16;
      // Then lock in: glide to the centre band and hold steady with a gentle vibrato.
      setTimeout(() => {
        vCents.textContent = "In tune";
        vCents.className = "vt-cents is-in";
        vTrace.className = "vt-trace is-in";
        pen.target = CENTER; pen.jitter = 1.2; pen.vib = 3.2; pen.follow = 0.1;
        vHold.style.transition = "width 1.15s linear";
        vHold.style.width = "100%";
      }, 1050);
    }

    // Ear trainer — listen, choose, score, repeat.
    const LABELS = ["Re", "Ga", "Pa", "Dha"];
    const choices = [...root.querySelectorAll(".et-choice")];
    const eBanner = q("[data-et-banner]"), eRound = q("[data-et-round]"),
      eScore = q("[data-et-score]"), eStreak = q("[data-et-streak]");
    let phase = 0, round = 1, score = 0, streak = 0, ci = 1, first = true;

    const banner = (t, type) => { eBanner.textContent = t; eBanner.className = "et-banner et-banner--" + type; };
    const stats = () => { eRound.textContent = round; eScore.textContent = score; eStreak.textContent = streak; };

    function earTick() {
      if (phase === 0) {
        if (!first) { round++; if (round > 10) { round = 1; score = 0; streak = 0; } }
        first = false;
        choices.forEach((c) => c.classList.remove("sel", "correct", "wrong"));
        banner("♪  LISTEN…", "cyan");
        stats();
      } else if (phase === 1) {
        banner("WHICH SWARA?", "neutral");
      } else if (phase === 2) {
        choices[ci].classList.add("sel");
      } else {
        choices[ci].classList.remove("sel");
        choices[ci].classList.add("correct");
        score = Math.min(score + 1, 10);
        streak++;
        banner("✓  CORRECT · " + LABELS[ci], "cyan");
        stats();
        ci = (ci + 1) % choices.length;
      }
      phase = (phase + 1) % 4;
    }

    if (reduceMotion) {
      // Rest on a settled "Ga" without any timers — draw one static, steady trace.
      vSwara.textContent = "Ga"; vHz.textContent = "329.6 Hz"; vStep.textContent = "Step 3 of 8";
      vProg.style.width = "37%"; vCents.textContent = "In tune"; vCents.className = "vt-cents is-in";
      vTrace.className = "vt-trace is-in"; vHold.style.width = "100%";
      for (let i = 0; i < N; i++) buf[i] = CENTER + Math.sin(i * 0.5) * 2.2;
      drawLine();
      banner("WHICH SWARA?", "neutral");
      choices[1].classList.add("sel");
      return;
    }

    let vi = 0;
    vocalStep(0);
    drawLine();
    setInterval(frame, 55);
    setInterval(() => { vi = (vi + 1) % SWARAS.length; vocalStep(vi); }, 2400);
    setInterval(earTick, 1100);
  })();

  /* ---- Metronome playheads: a single beat clock steps through each pattern,
     so Teental, the bulería compás and the step sequencer animate the way they
     are actually counted — one moving playhead, hitting each beat in turn.
     (Reduced motion leaves the static, fully-labelled frame untouched.) ---- */
  if (!reduceMotion) {
    // Tala (16 mātrā) + compás (12 beats): one highlight moves beat to beat,
    // in DOM order, which matches the counted order left-to-right.
    document.querySelectorAll(".ms-tala, .ms-compas").forEach((grp) => {
      const dots = [...grp.querySelectorAll(".bdot")];
      if (!dots.length) return;
      const bpm = grp.classList.contains("ms-compas") ? 230 : 190; // visual tempo
      let i = -1;
      setInterval(() => {
        if (i >= 0) dots[i].classList.remove("is-hit");
        i = (i + 1) % dots.length;
        dots[i].classList.add("is-hit");
      }, 60000 / bpm);
    });

    // Step sequencer: one shared clock ticks at the finest subdivision on the
    // grid (the 1/8 hi-hat = 8 ticks/bar). Each lane maps that tick onto its OWN
    // step count, so the hi-hat advances every tick while the 1/4 kick & snare
    // hold each step for two — i.e. the lanes run independently, as they should.
    document.querySelectorAll(".seqgrid").forEach((grid) => {
      const lanes = [...grid.querySelectorAll(".lane")].map((l) => [...l.querySelectorAll(".cell")]);
      if (!lanes.length) return;
      const ticks = Math.max(...lanes.map((cells) => cells.length)); // finest grid
      if (!ticks) return;
      const stepOf = (cells, t) => cells[Math.floor((t * cells.length) / ticks)];
      let t = -1;
      setInterval(() => {
        if (t >= 0) lanes.forEach((cells) => stepOf(cells, t)?.classList.remove("is-step"));
        t = (t + 1) % ticks;
        lanes.forEach((cells) => stepOf(cells, t)?.classList.add("is-step"));
      }, 60000 / 300); // 8 eighth-notes/bar at ~150 BPM (300 eighths/min)
    });
  }

  /* ---- Subtle pointer tilt on the hero device ---- */
  const tilt = document.querySelector("[data-tilt] .phone");
  const tiltWrap = document.querySelector("[data-tilt]");
  if (tilt && tiltWrap && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    tiltWrap.addEventListener("mousemove", (e) => {
      const r = tiltWrap.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.animation = "none";
      tilt.style.transform = `rotateY(${-14 + x * 10}deg) rotateX(${6 - y * 10}deg)`;
    });
    tiltWrap.addEventListener("mouseleave", () => {
      tilt.style.transform = "";
      tilt.style.animation = "";
    });
  }
})();
