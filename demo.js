(() => {
  const mount = document.getElementById('demo-mount');
  if (!mount) return;

  const NOTES = [
    {
      name: 'Plainnote roadmap',
      folder: 'Projects',
      src: `# Plainnote roadmap

Where the app is heading. #project

## Shipped

- Wikilinks, backlinks, and tags
- Split view and instant search

## Up next

- Quick-capture from the menu bar
- More themes

The full list lives on [GitHub](https://github.com/plainnoteio/app/issues).`,
    },
    {
      name: 'Ideas',
      src: `# Ideas

A scratchpad for whatever comes to mind. #ideas

- Keep a reading log — started one in [[Reading list]]
- Weekly review note, linked from the [[Plainnote roadmap]]
- Try the split view next to [[Welcome]]

> Capture first, tidy later.`,
    },
    {
      name: 'Reading list',
      src: `# Reading list

Books worth the shelf space. #reading

## Now

- *How to Take Smart Notes* — halfway through, lots to steal for [[Ideas]]

## Next

- *The Shallows*
- Re-read *On Writing Well*`,
    },
    {
      name: 'Welcome',
      src: `# Welcome to Plainnote

A clean home for your thoughts. Notes live as plain markdown files on your Mac, so they are always yours.

## The basics

- Write in **markdown** — headings, lists, \`code\`, and more
- Toggle between **Edit** and **Read** with Cmd+E
- Everything saves automatically as you type

## Link your thinking

Connect notes with wikilinks, like [[Ideas]] or the [[Plainnote roadmap]]. Backlinks show every note that points here.

Tag anything with #getting-started and find it again instantly.`,
    },
  ];

  let current = 'Welcome';
  let editMode = true;
  let projectsOpen = true;

  const byName = (name) => NOTES.find((n) => n.name.toLowerCase() === name.toLowerCase());

  // ---------- tiny markdown ----------

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(s) {
    return esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[\[([^\]]+)\]\]/g, (m, name) => {
        const miss = byName(name) ? '' : ' missing';
        return `<a class="wikilink${miss}" data-note="${name}">${name}</a>`;
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/(^|\s)#([\w-]+)/g, '$1<span class="tag" data-tag="$2">#$2</span>');
  }

  // Edit (live) mode: one rendered row per source line, click a row to edit it.
  function renderLive(src) {
    return src.split('\n').map((line, i) => {
      if (!line.trim()) return `<div class="live-line blank" data-i="${i}"></div>`;
      let m;
      if ((m = line.match(/^(#{1,3}) (.*)$/))) {
        const l = m[1].length;
        return `<div class="live-line live-h live-h${l}" data-i="${i}"><h${l}>${inline(m[2])}</h${l}></div>`;
      }
      if ((m = line.match(/^- (.*)$/))) return `<div class="live-line" data-i="${i}"><ul><li>${inline(m[1])}</li></ul></div>`;
      if ((m = line.match(/^> (.*)$/))) return `<div class="live-line" data-i="${i}"><blockquote>${inline(m[1])}</blockquote></div>`;
      return `<div class="live-line" data-i="${i}"><p>${inline(line)}</p></div>`;
    }).join('');
  }

  // Read mode: grouped blocks, no editing affordances.
  function renderRead(src) {
    const out = [];
    let list = null;
    const flush = () => { if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null; } };
    for (const line of src.split('\n')) {
      let m;
      if ((m = line.match(/^- (.*)$/))) { (list = list || []).push(`<li>${inline(m[1])}</li>`); continue; }
      flush();
      if (!line.trim()) continue;
      if ((m = line.match(/^(#{1,3}) (.*)$/))) out.push(`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`);
      else if ((m = line.match(/^> (.*)$/))) out.push(`<blockquote><p>${inline(m[1])}</p></blockquote>`);
      else out.push(`<p>${inline(line)}</p>`);
    }
    flush();
    return out.join('');
  }

  // ---------- shell ----------

  const icon = {
    collapse: '<svg width="15" height="15" viewBox="0 0 15 15"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="5.5" y1="2.5" x2="5.5" y2="12.5" stroke="currentColor" stroke-width="1.2"/></svg>',
    plus: '<svg width="15" height="15" viewBox="0 0 15 15"><path d="M7.5 2v11M2 7.5h11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>',
    folder: '<svg width="15" height="15" viewBox="0 0 15 15"><path d="M1.5 3.5h4l1.5 2h6.5v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-8z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>',
    folderSm: '<svg width="13" height="13" viewBox="0 0 15 15"><path d="M1.5 3.5h4l1.5 2h6.5v6a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1v-8z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linejoin="round"/></svg>',
    reveal: '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    moon: '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    gear: '<svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.56 1.03H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.03z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    chevron: '<svg width="10" height="10" viewBox="0 0 14 14"><path d="M3.5 5l3.5 4 3.5-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    clear: '<svg width="12" height="12" viewBox="0 0 15 15"><path d="M3.5 3.5l8 8M11.5 3.5l-8 8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    split: '<svg width="15" height="15" viewBox="0 0 15 15"><rect x="1.5" y="2.5" width="12" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><line x1="7.5" y1="2.5" x2="7.5" y2="12.5" stroke="currentColor" stroke-width="1.2"/></svg>',
  };

  mount.classList.add('demo');
  mount.innerHTML = `
    <div class="demo-app">
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="side-icon">${icon.collapse}</span>
          <span class="app-name">Plainnote</span>
          <div class="sidebar-actions">
            <span class="side-icon">${icon.plus}</span>
            <span class="side-icon">${icon.folder}</span>
          </div>
        </div>
        <div class="search-wrap">
          <input class="d-search" type="text" placeholder="Search notes…" spellcheck="false" aria-label="Search demo notes">
          <button class="d-search-clear" title="Clear search" hidden>${icon.clear}</button>
        </div>
        <div class="d-tree scroll"></div>
        <div class="tags-section">
          <div class="section-label">Tags</div>
          <div class="d-tags"></div>
        </div>
        <div class="sidebar-footer">
          <span class="vault">${icon.folderSm}<span>plainnote-demo</span></span>
          <span class="side-icon">${icon.reveal}</span>
          <button class="side-icon d-theme" title="Switch theme">${icon.moon}</button>
          <span class="side-icon">${icon.gear}</span>
        </div>
      </aside>
      <div class="pane">
        <div class="pane-header">
          <div class="pane-header-spacer"></div>
          <div class="pane-mode">
            <button class="d-mode-edit active">Edit</button>
            <button class="d-mode-read">Read</button>
          </div>
          <span class="side-icon">${icon.split}</span>
        </div>
        <div class="pane-scroll">
          <div class="d-content markdown"></div>
          <div class="pane-backlinks">
            <div class="section-label">Backlinks</div>
            <div class="d-backlinks backlinks-list"></div>
          </div>
        </div>
      </div>
    </div>`;

  const $ = (sel) => mount.querySelector(sel);
  const treeEl = $('.d-tree');
  const contentEl = $('.d-content');
  const backlinksEl = $('.d-backlinks');
  const tagsEl = $('.d-tags');
  const searchEl = $('.d-search');
  const searchClearEl = $('.d-search-clear');

  const hint = document.createElement('p');
  hint.className = 'demo-hint';
  hint.textContent = 'This is a live demo — open a note, follow a wikilink, or click any line to edit it.';
  mount.after(hint);

  // ---------- rendering ----------

  function renderTree() {
    const q = searchEl.value.trim().toLowerCase();
    if (q) {
      const hits = NOTES.filter((n) => (n.name + '\n' + n.src).toLowerCase().includes(q));
      treeEl.innerHTML = hits.map((n) => {
        const i = n.src.toLowerCase().indexOf(q);
        const snippet = i < 0 ? n.src : n.src.slice(Math.max(0, i - 20), i + 60);
        return `<div class="search-hit" data-note="${esc(n.name)}">
          <div class="hit-name">${esc(n.name)}</div>
          <div class="hit-snippet">${esc(snippet.replace(/\n/g, ' '))}</div>
        </div>`;
      }).join('') || '<div class="search-empty">No matches.</div>';
      return;
    }
    const row = (n) =>
      `<div class="tree-row${n.name === current ? ' active' : ''}" data-note="${esc(n.name)}"><span class="row-name">${esc(n.name)}</span></div>`;
    const children = NOTES.filter((n) => n.folder === 'Projects');
    const root = NOTES.filter((n) => !n.folder);
    treeEl.innerHTML = `
      <div class="tree-row folder-row${projectsOpen ? '' : ' collapsed'}" data-toggle-folder>
        <span class="chevron">${icon.chevron}</span><span class="row-name">Projects</span>
      </div>
      <div class="tree-children"${projectsOpen ? '' : ' hidden'}>${children.map(row).join('')}</div>
      ${root.map(row).join('')}`;
  }

  function renderTags() {
    const counts = {};
    for (const n of NOTES) {
      for (const m of n.src.matchAll(/(?:^|\s)#([\w-]+)/g)) counts[m[1]] = (counts[m[1]] || 0) + 1;
    }
    tagsEl.innerHTML = Object.keys(counts).sort().map(
      (t) => `<span class="tag-pill" data-tag="${t}">#${t}<span class="tag-count">${counts[t]}</span></span>`
    ).join('');
  }

  function renderBody() {
    const note = byName(current);
    contentEl.innerHTML = editMode ? renderLive(note.src) : renderRead(note.src);
    const backlinks = NOTES.filter((n) => n !== note && new RegExp(`\\[\\[${note.name}\\]\\]`, 'i').test(n.src));
    backlinksEl.innerHTML = backlinks.length
      ? backlinks.map((n) => `<span class="backlink-pill" data-note="${esc(n.name)}">${esc(n.name)}</span>`).join('')
      : '<span class="backlinks-empty">No backlinks yet.</span>';
  }

  function openNote(name) {
    const note = byName(name);
    if (!note) return;
    current = note.name;
    searchEl.value = '';
    searchClearEl.hidden = true;
    renderTree();
    renderBody();
  }

  function setMode(edit) {
    editMode = edit;
    $('.d-mode-edit').classList.toggle('active', edit);
    $('.d-mode-read').classList.toggle('active', !edit);
    renderBody();
  }

  // ---------- line editing ----------

  function editLine(lineEl) {
    const note = byName(current);
    const lines = note.src.split('\n');
    const i = +lineEl.dataset.i;
    const ta = document.createElement('textarea');
    ta.className = 'live-editor';
    ta.value = lines[i];
    ta.rows = 1;
    ta.spellcheck = false;
    lineEl.replaceWith(ta);
    const size = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    size();
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    ta.addEventListener('input', size);
    let done = false;
    const commit = (apply) => {
      if (done) return;
      done = true;
      if (apply) {
        lines[i] = ta.value.replace(/\n/g, ' ');
        note.src = lines.join('\n');
      }
      renderBody();
      renderTags();
    };
    ta.addEventListener('blur', () => commit(true));
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      if (e.key === 'Escape') commit(false);
    });
  }

  // ---------- events ----------

  mount.addEventListener('click', (e) => {
    const t = e.target;
    const el = (sel) => t.closest(sel);
    let hit;
    if ((hit = el('[data-toggle-folder]'))) { projectsOpen = !projectsOpen; renderTree(); }
    else if ((hit = el('.tree-row[data-note], .search-hit, .backlink-pill, a.wikilink'))) { e.preventDefault(); openNote(hit.dataset.note); }
    else if ((hit = el('.tag-pill, .tag'))) {
      searchEl.value = '#' + hit.dataset.tag;
      searchClearEl.hidden = false;
      renderTree();
    }
    else if (el('.d-mode-edit')) setMode(true);
    else if (el('.d-mode-read')) setMode(false);
    else if (el('.d-theme')) mount.classList.toggle('theme-dark');
    else if (el('.d-search-clear')) { searchEl.value = ''; searchClearEl.hidden = true; renderTree(); }
    else if (editMode && (hit = el('.live-line'))) editLine(hit);
  });

  searchEl.addEventListener('input', () => {
    searchClearEl.hidden = !searchEl.value;
    renderTree();
  });

  // Cmd+E toggles Edit/Read after the demo has been interacted with, like the app.
  let demoFocused = false;
  document.addEventListener('mousedown', (e) => { demoFocused = mount.contains(e.target); });
  document.addEventListener('keydown', (e) => {
    if (demoFocused && (e.metaKey || e.ctrlKey) && e.key === 'e') {
      e.preventDefault();
      setMode(!editMode);
    }
  });

  renderTree();
  renderTags();
  renderBody();
})();
