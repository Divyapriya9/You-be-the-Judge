import { layout, NW, COL, PAD } from './tree.js';

const app = document.getElementById('app');
const S = { c: null, ruling: null, reasons: new Set(), conf: 50, rely: new Set(), notes: '' };
const HZ = ['Your ruling', 'Immediately', 'In a month', 'In a year', 'Long term'];
const WEIGHT = { high: 1, medium: 0.6, low: 0.3 };

// Tiny DOM helper. Text always goes in as text nodes, so user content can never inject HTML.
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v);
  }
  kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};
const go = fn => { app.replaceChildren(fn()); app.focus(); window.scrollTo(0, 0); };
const rise = (delay, el) => { el.classList.add('rise'); el.style.animationDelay = delay + 's'; return el; };

const landing = () => h('section', { class: 'center' },
  rise(0, h('div', { class: 'icon', 'aria-hidden': 'true' }, '⚖')),
  rise(0.3, h('h1', {}, 'You be the judge.')),
  rise(0.9, h('p', {}, 'Hear the case. Make your ruling. See what follows.')),
  rise(1.5, h('button', { class: 'btn', onclick: () => go(briefing) }, 'Are you ready?')));

const briefing = () => h('section', {},
  rise(0, h('h2', {}, 'Before you take the bench')),
  rise(0.6, h('p', {}, 'You’ll hear the facts.')),
  rise(1.2, h('p', {}, 'You’ll rule, and say why.')),
  rise(1.8, h('p', {}, 'Then you’ll see what your reasoning set in motion.')),
  rise(2.4, h('div', { class: 'grid' },
    h('button', { class: 'card', onclick: () => go(caseFile) }, h('strong', {}, 'Hear a case'), h('br'), 'Start with a prepared case.'),
    h('button', { class: 'card', disabled: true }, h('strong', {}, 'Write your own case'), h('br'), 'Coming in the next build.'),
    h('button', { class: 'card', disabled: true }, h('strong', {}, 'Community cases'), h('br'), 'Coming in a later build.'))));

const evCard = e => {
  const body = h('p', { hidden: true }, e.text);
  const btn = h('button', { class: 'ev', 'aria-expanded': 'false',
    onclick: () => { const opening = body.hidden; body.hidden = !opening; btn.setAttribute('aria-expanded', String(opening)); } },
    `${e.label} (${e.reliability} reliability)`);
  const cb = h('input', { type: 'checkbox', id: 'rl-' + e.id, onchange: x => x.target.checked ? S.rely.add(e.id) : S.rely.delete(e.id) });
  if (S.rely.has(e.id)) cb.checked = true;
  return h('div', {}, btn, body, h('label', { for: 'rl-' + e.id, style: 'font:.9rem/24px sans-serif' }, cb, ' I’m relying on this'));
};

const caseFile = () => {
  const c = S.c;
  return h('article', {},
    h('div', { class: 'paper' },
      h('span', { class: 'stamp' }, 'Case ' + c.no), h('h2', {}, c.title),
      h('h3', {}, 'The facts'), h('ul', {}, c.facts.map(f => h('li', {}, f))),
      h('h3', {}, 'The parties'), h('ul', {}, c.parties.map(p => h('li', {}, h('strong', {}, p.name), `, ${p.role}. Wants: ${p.wants}.`))),
      h('h3', {}, 'The evidence'), c.evidence.map(evCard),
      h('h3', {}, 'The rules in play'), h('ul', {}, c.rules.map(r => h('li', {}, r)))),
    h('label', { class: 'notes' }, 'Your notes (private, kept in this tab only)',
      h('textarea', { rows: 3, oninput: e => { S.notes = e.target.value; } }, S.notes)),
    h('button', { class: 'btn', onclick: () => go(bench) }, 'I’m ready to rule'));
};

const bench = () => {
  const c = S.c;
  const deliver = h('button', { class: 'btn', disabled: true, onclick: () => go(() => tree(S.ruling)) }, 'Deliver your ruling');
  const sync = () => { deliver.disabled = !(S.ruling && S.reasons.size); };
  const rulings = c.rulings.map(r => h('button', { class: 'card', role: 'radio', 'aria-checked': String(S.ruling === r.id),
    onclick: () => { S.ruling = r.id; rulings.forEach((b, i) => b.setAttribute('aria-checked', String(c.rulings[i].id === S.ruling))); sync(); } }, r.text));
  const reasons = c.reasons.map(r => h('button', { class: 'card', role: 'checkbox', 'aria-checked': String(S.reasons.has(r.id)),
    onclick: () => {
      if (S.reasons.has(r.id)) S.reasons.delete(r.id); else if (S.reasons.size < 3) S.reasons.add(r.id);
      reasons.forEach((b, i) => b.setAttribute('aria-checked', String(S.reasons.has(c.reasons[i].id)))); sync();
    } }, r.text));
  const out = h('output', {}, ' ' + S.conf + '%');
  const slider = h('input', { type: 'range', min: 0, max: 100, value: S.conf, 'aria-label': 'Your confidence',
    oninput: e => { S.conf = +e.target.value; out.textContent = ' ' + S.conf + '%'; } });
  sync();
  return h('section', {},
    h('h2', {}, 'What do you say?'),
    h('div', { class: 'grid', role: 'radiogroup', 'aria-label': 'Your ruling' }, rulings),
    h('h3', {}, 'Because… (choose up to three)'),
    h('div', { class: 'grid', role: 'group', 'aria-label': 'Your reasons' }, reasons),
    h('h3', {}, 'How confident are you?'), slider, out, h('p', {}, deliver));
};

const outline = n => h('ul', {}, h('li', {}, n.label + (n.detail ? ': ' + n.detail : ''), n.children && n.children.length ? n.children.map(outline) : null));

const tree = rid => {
  const c = S.c, r = c.rulings.find(x => x.id === rid);
  const L = layout(structuredClone(r.tree));
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('width', L.w); svg.setAttribute('height', L.h); svg.setAttribute('aria-hidden', 'true');
  L.links.forEach(([p, n]) => {
    const x1 = p._x + NW, y1 = p._y, x2 = n._x, y2 = n._y, m = (x1 + x2) / 2;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', `M${x1},${y1} C${m},${y1} ${m},${y2} ${x2},${y2}`);
    path.setAttribute('class', 'link'); path.style.animationDelay = (n._d * 0.9 - 0.5) + 's';
    svg.append(path);
  });
  const inner = h('div', { style: `position:relative;width:${L.w}px;height:${L.h}px` }, svg);
  for (let d = 0; d <= L.maxD; d++) inner.append(h('span', { class: 'hz', style: `left:${PAD + d * COL}px` }, HZ[d] || ''));
  const detail = h('div', { class: 'detail', 'aria-live': 'polite' }, 'Select any step to read why it follows.');
  L.nodes.forEach(n => {
    const cls = n.valence > 0 ? 'pos' : n.valence < 0 ? 'neg' : '';
    inner.append(h('button', { class: 'node ' + cls, 'data-g': n.valence > 0 ? '+' : n.valence < 0 ? '−' : '?',
      style: `left:${n._x}px;top:${n._y}px;animation-delay:${n._d * 0.9}s`,
      onclick: () => detail.replaceChildren(h('strong', {}, n.label), h('p', {}, n.detail || ''),
        n.affected ? h('small', {}, `Affects: ${n.affected}. Likelihood: ${n.likelihood}.`) : null) }, n.label));
  });
  return h('section', {},
    h('h2', {}, 'What your ruling set in motion'),
    h('p', {}, 'Your ruling: ', h('strong', {}, r.text)),
    h('div', { class: 'tree' }, inner), detail,
    h('details', {}, h('summary', {}, 'Read the tree as a text outline'), outline(L.root)),
    h('p', {}, h('button', { class: 'btn', onclick: () => go(reasoning) }, 'Explain my reasoning'),
      c.rulings.filter(x => x.id !== rid).map(o => h('button', { class: 'btn', onclick: () => go(() => tree(o.id)) }, 'See the tree if you had ruled: ' + o.text))));
};

const reasoning = () => {
  const c = S.c, r = c.rulings.find(x => x.id === S.ruling);
  const nodes = []; (function w(n) { nodes.push(n); (n.children || []).forEach(w); })(r.tree);
  const net = {}; let uncertain = 0, rated = 0;
  nodes.forEach(n => {
    if (!n.affected) return;
    net[n.affected] = (net[n.affected] || 0) + n.valence * (WEIGHT[n.likelihood] || 0.5);
    rated++; if (n.likelihood !== 'high') uncertain++;
  });
  const share = rated ? uncertain / rated : 0;
  const calib = S.conf >= 75 && share >= 0.5 ? 'You were very sure, but most of what followed was uncertain. That gap is worth noticing.'
    : S.conf <= 35 && share < 0.35 ? 'You doubted yourself, yet most effects were fairly predictable.'
    : 'Your confidence roughly matched how uncertain the outcome was.';
  const weak = c.evidence.filter(e => S.rely.has(e.id) && e.reliability === 'low');
  return h('section', {},
    h('h2', {}, 'Your reasoning, explained'),
    S.reasons.size ? [...S.reasons].map(id => {
      const q = c.reasons.find(x => x.id === id);
      return h('article', { class: 'paper' }, h('h3', {}, '“' + q.text + '”'),
        ...[['Lens', q.lens], ['Hidden assumption', q.assumption], ['Fails when', q.failsWhen],
            ['Strongest objection', q.objection], ['A real-world echo', q.echo], ['A different approach', q.alternative]]
          .map(([k, v]) => h('p', {}, h('strong', {}, k + ': '), v)));
    }) : null,
    h('h3', {}, 'Net effect of your ruling, by who it touches'),
    Object.entries(net).map(([k, v]) => h('div', { class: 'bar' }, h('span', {}, k), h('meter', { min: -4, max: 4, value: v, 'aria-label': k + ' net effect' }), h('span', {}, v.toFixed(1)))),
    h('h3', {}, 'Confidence check'), h('p', {}, calib),
    weak.length ? h('p', {}, 'You relied on weak evidence: ' + weak.map(e => e.label).join(', ') + '.') : null,
    h('p', {}, h('button', { class: 'btn', onclick: () => go(bench) }, 'Rule differently'),
      h('button', { class: 'btn', onclick: () => { S.ruling = null; S.reasons.clear(); S.rely.clear(); S.notes = ''; S.conf = 50; go(landing); } }, 'Start over')));
};

fetch('data/case-001.json').then(r => r.json()).then(c => { S.c = c; go(landing); })
  .catch(() => { app.textContent = 'Could not load the case. Run a local server (see README) or deploy to GitHub Pages.'; });
