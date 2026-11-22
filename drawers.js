// ARCIS interactions: drawers, command palette, quick-actions menu, toasts, settings, FAQ search.
(function () {
  const $ = id => document.getElementById(id), mk = (t, c, h) => { const e = document.createElement(t); e.className = c; if (h) e.innerHTML = h; return e; };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const go = id => $(id).scrollIntoView({ behavior: "smooth" });
  const REPO = "https://github.com/" + ARCIS_CONFIG.repo;

  /* preferences */
  let ST = {}; try { ST = JSON.parse(localStorage.getItem("arcis-prefs") || "{}"); } catch (e) {}
  const apply = () => { const c = document.documentElement.classList; c.toggle("no-bg", ST.bg === false); c.toggle("no-glow", ST.glow === false); c.toggle("calm", !!ST.calm); };
  const save = () => { try { localStorage.setItem("arcis-prefs", JSON.stringify(ST)); } catch (e) {} }; apply();

  /* toast */
  const tEl = mk("div", "toast"); tEl.setAttribute("role", "status"); document.body.appendChild(tEl); let tt;
  const toast = m => { tEl.textContent = m; tEl.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => tEl.classList.remove("show"), 2200); };
  const copy = (t, m) => (navigator.clipboard ? navigator.clipboard.writeText(t).then(() => toast(m), () => toast("Copy failed")) : toast("Copy not supported here"));
  const copyLink = () => copy($("downloadButton").href, "Download link copied");
  const share = () => (navigator.share ? navigator.share({ title: document.title, url: location.href.split("#")[0] }).catch(() => {}) : copy(location.href.split("#")[0], "Page link copied"));

  /* drawer */
  const scrim = mk("div", "scrim"), dr = mk("aside", "drawer", '<button class="d-close" aria-label="Close panel">×</button><div id="dBody"></div>');
  dr.setAttribute("role", "dialog"); dr.setAttribute("aria-modal", "true"); dr.setAttribute("aria-labelledby", "dTitle"); dr.tabIndex = -1;
  document.body.append(scrim, dr);
  let last = null, cur = -1;
  const open = html => { if (!dr.classList.contains("open")) last = document.activeElement; $("dBody").innerHTML = html; dr.classList.add("open"); scrim.classList.add("open"); document.body.style.overflow = "hidden"; dr.scrollTop = 0; dr.focus(); };
  const close = () => { dr.classList.remove("open"); scrim.classList.remove("open"); document.body.style.overflow = ""; cur = -1; last && last.focus && last.focus(); };
  const panel = (tag, title, inner) => `<p class="d-tag">${tag}</p><h3 id="dTitle">${title}</h3>${inner}`;
  scrim.onclick = close; dr.querySelector(".d-close").onclick = close;

  const DET = [["STAYS ON DEVICE", "Core conversations use on-device AI. Which models work depends on your device.", "l"], ["CHECK PRIVACY INFO", "Availability depends on the selected model, device capability and connected services. Check the app's privacy information.", "c"], ["STAYS ON DEVICE", "Image processing is done locally on your device. Availability depends on the selected model and device capability.", "l"], ["EXTERNAL SERVICE", "Your prompt is sent to the configured image service to generate the image.", "e"], ["EXTERNAL PROVIDER", "Relevant queries are sent to a search provider to fetch current results.", "e"], ["CHECK PRIVACY INFO", "How chats are kept depends on the app. Check the app's privacy information.", "c"]];
  window.openFeature = i => {
    const n = CAPS.length; i = (i + n) % n; cur = i; const c = CAPS[i], d = DET[i];
    open(panel(c.tag, c.n, `<p class="d-lead">${c.t}</p><ul class="d-list">${c.b.map(x => `<li>${x}</li>`).join("")}</ul><div class="d-note ${d[2]}"><b>${d[0]}</b><span>${d[1]}</span></div><div class="d-actions"><button class="btn-sm" data-a="preview">See it in the phone</button></div><div class="d-nav"><button class="btn-ghost" data-a="prev">← ${CAPS[(i + n - 1) % n].n}</button><button class="btn-ghost" data-a="next">${CAPS[(i + 1) % n].n} →</button></div><div class="d-dots">${CAPS.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>`));
  };
  const openPrivacy = () => open(panel("PRIVACY", "Designed with privacy in mind", `<p class="d-lead">ARCIS is built around on-device AI for core conversations.</p><div class="d-note l"><b>STAYS ON DEVICE</b><span>Chatting with supported local models and processing images.</span></div><div class="d-note e"><b>MAY LEAVE YOUR DEVICE</b><span>Online search queries and image-generation prompts go to external providers.</span></div><p class="d-lead">Check the app's privacy information before using optional online features.</p><div class="d-actions"><button class="btn-sm" data-a="flow">Try the data-flow switch</button></div>`));
  const openAbout = () => open(panel("ABOUT", "The idea behind ARCIS", `<p class="d-lead">ARCIS is an Android AI assistant project focused on a practical, flexible AI experience with local processing at its foundation. It is independently developed by Prabhanshu.</p><div class="d-actions"><a class="btn-sm" href="${REPO}" target="_blank" rel="noopener">View on GitHub</a><a class="btn-ghost" href="${REPO}/releases" target="_blank" rel="noopener">All releases</a></div>`));
  const openInstall = () => open(panel("INSTALL", "Install help", `<ol class="d-steps"><li><b>Download the APK</b>Use the Download button. It always fetches the newest GitHub release.</li><li><b>Open the file</b>Tap the download in your browser or Files app.</li><li><b>Allow the install</b>Android may ask to let your browser install apps. Only do this for apps you trust.</li><li><b>Open ARCIS</b>Launch it and follow the setup inside the app.</li></ol><p class="d-lead">Requires Android 8.0 or newer. On a computer? Use the QR code near the download button to open this page on your phone.</p><div class="d-actions"><button class="btn-sm" data-a="dl">Go to download</button><button class="btn-ghost" data-a="copy">Copy download link</button></div>`));
  const sw = (k, t, d) => `<label class="d-row"><span><b>${t}</b><small>${d}</small></span><span class="switch"><input type="checkbox" data-k="${k}" ${(k === "calm" ? ST.calm : ST[k] !== false) ? "checked" : ""}><span class="track"><i></i></span></span></label>`;
  const openSettings = () => open(panel("SETTINGS", "Make it yours", `${sw("bg", "3D background", "The scroll-driven scene behind the page")}${sw("glow", "Cursor glow", "A soft light that follows your pointer")}${sw("calm", "Calm mode", "Turns off page animations")}<p class="d-tag" style="margin-top:26px">SHORTCUTS</p><ul class="d-list"><li><kbd>Ctrl</kbd> / <kbd>⌘</kbd> + <kbd>K</kbd> or <kbd>/</kbd> opens search</li><li><kbd>Esc</kbd> closes panels</li><li><kbd>←</kbd> <kbd>→</kbd> switch capability in a panel</li></ul><div class="d-actions"><button class="btn-ghost" data-a="reset">Reset settings</button></div>`));
  window.openRelease = i => { const r = (window.__rel || [])[i]; if (!r) return; const apk = (r.assets || []).find(a => /\.apk$/i.test(a.name)); open(panel("RELEASE", esc(r.name || r.tag_name), `<p class="d-tag">${new Date(r.published_at || r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p><p class="d-lead pre">${esc((r.body || "No release notes.").slice(0, 4000))}</p><div class="d-actions">${apk ? `<a class="btn-sm" href="${esc(apk.browser_download_url)}">Download APK (${fmtSize(apk.size)})</a>` : ""}<a class="btn-ghost" href="${esc(r.html_url)}" target="_blank" rel="noopener">View on GitHub</a></div>`)); };

  const ACT = { preview: () => { const i = cur; close(); showCap(i); go("explore"); }, prev: () => openFeature(cur - 1), next: () => openFeature(cur + 1), flow: () => { close(); go("dataflow"); }, dl: () => { close(); go("download"); }, copy: copyLink, reset: () => { ST = {}; save(); apply(); openSettings(); toast("Settings reset"); } };
  dr.addEventListener("click", e => { const b = e.target.closest("[data-a]"); if (b && ACT[b.dataset.a]) ACT[b.dataset.a](); });
  dr.addEventListener("change", e => { const k = e.target.dataset.k; if (!k) return; ST[k] = e.target.checked; save(); apply(); });
  const OPEN = { privacy: openPrivacy, about: openAbout, install: openInstall };
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]"); if (o) return OPEN[o.dataset.open]();
    const r = e.target.closest(".rel"); if (r && !e.target.closest("a")) openRelease(+r.dataset.i);
  });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.matches && e.target.matches(".rel")) { e.preventDefault(); openRelease(+e.target.dataset.i); } });

  /* inject triggers */
  const addBtn = (sel, key, label) => { const p = document.querySelector(sel); if (p) p.insertAdjacentHTML("beforeend", `<button class="btn-sm" data-open="${key}" style="margin-top:22px">${label}</button>`); };
  addBtn(".privacy-copy", "privacy", "Read the privacy details"); addBtn(".about-copy", "about", "Meet the developer"); addBtn("#install", "install", "Open install help");
  document.querySelectorAll(".feature-card").forEach((c, i) => {
    c.tabIndex = 0; c.setAttribute("role", "button"); c.setAttribute("aria-label", "Open details: " + c.querySelector("h3").textContent); c.insertAdjacentHTML("beforeend", '<em class="more">Details +</em>');
    c.addEventListener("click", () => openFeature(i)); c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFeature(i); } });
  });

  /* command palette */
  const SEC = [["Features", "features"], ["Phone preview", "explore"], ["Privacy", "privacy"], ["Data flow", "dataflow"], ["Install", "install"], ["Version history", "releases"], ["FAQ", "faq"], ["Download", "download"]];
  const CMD = () => [...SEC.map(s => ({ n: "Go to " + s[0], f: () => go(s[1]) })), ...CAPS.map((c, i) => ({ n: "Open: " + c.n, f: () => openFeature(i) })), { n: "Privacy details", f: openPrivacy }, { n: "Install help", f: openInstall }, { n: "About the developer", f: openAbout }, { n: "Settings", f: openSettings }, { n: "Copy download link", f: copyLink }, { n: "Share this page", f: share }];
  const pal = mk("div", "pal", '<div class="pal-box"><input id="palIn" type="text" placeholder="Search sections, capabilities, actions…" aria-label="Search" autocomplete="off"><ul id="palList"></ul></div>'); document.body.appendChild(pal);
  let items = [], sel = 0;
  const draw = () => { const q = $("palIn").value.toLowerCase(); items = CMD().filter(c => c.n.toLowerCase().includes(q)); sel = Math.min(sel, Math.max(0, items.length - 1)); $("palList").innerHTML = items.length ? items.map((c, i) => `<li data-i="${i}" class="${i === sel ? "on" : ""}">${c.n}</li>`).join("") : '<li class="none">No matches</li>'; };
  const openPal = () => { pal.classList.add("open"); $("palIn").value = ""; sel = 0; draw(); $("palIn").focus(); };
  const closePal = () => pal.classList.remove("open");
  const run = i => { const c = items[i]; if (!c) return; closePal(); c.f(); };
  $("palIn").addEventListener("input", () => { sel = 0; draw(); });
  $("palList").addEventListener("click", e => { const l = e.target.closest("li[data-i]"); if (l) run(+l.dataset.i); });
  pal.addEventListener("click", e => { if (e.target === pal) closePal(); });
  document.addEventListener("keydown", e => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) { e.preventDefault(); openPal(); return; }
    if (pal.classList.contains("open")) {
      if (e.key === "Escape") closePal(); else if (e.key === "ArrowDown") { e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); draw(); } else if (e.key === "ArrowUp") { e.preventDefault(); sel = (sel + items.length - 1) % Math.max(1, items.length); draw(); } else if (e.key === "Enter") run(sel);
      return;
    }
    if (!dr.classList.contains("open")) return;
    if (e.key === "Escape") close();
    else if (cur >= 0 && e.key === "ArrowRight") openFeature(cur + 1); else if (cur >= 0 && e.key === "ArrowLeft") openFeature(cur - 1);
    else if (e.key === "Tab") { const f = [...dr.querySelectorAll("a[href],button,input")], a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
  });

  /* quick-actions menu */
  const fab = mk("div", "fab", `<div class="fab-items"><button data-f="pal">Search <span>⌕</span></button><button data-f="set">Settings <span>⚙</span></button><button data-f="share">Share <span>↗</span></button><button data-f="top">Top <span>↑</span></button></div><button class="fab-main" aria-expanded="false" aria-label="Quick actions">+</button>`); document.body.appendChild(fab);
  const fm = fab.querySelector(".fab-main"), setFab = o => { fab.classList.toggle("open", o); fm.setAttribute("aria-expanded", o); };
  fm.onclick = () => setFab(!fab.classList.contains("open"));
  fab.addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (!b) return; setFab(false); ({ pal: openPal, set: openSettings, share, top: () => scrollTo({ top: 0, behavior: "smooth" }) })[b.dataset.f](); });
  document.addEventListener("click", e => { if (!fab.contains(e.target)) setFab(false); });

  /* FAQ search */
  const fl = $("faqList");
  if (fl) {
    fl.insertAdjacentHTML("beforebegin", '<input class="faq-search" type="search" id="faqSearch" placeholder="Search the questions" aria-label="Search the FAQ"><p class="empty" id="faqNone" hidden>No matching questions. Try the search (press /) or check the version history.</p>');
    $("faqSearch").addEventListener("input", e => { const q = e.target.value.toLowerCase(); let n = 0; [...fl.children].forEach(d => { const m = d.textContent.toLowerCase().includes(q); d.hidden = !m; if (m) n++; }); $("faqNone").hidden = n > 0; });
  }

  /* scroll spy */
  const links = [...document.querySelectorAll("#mainNav a[href^='#']")];
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("act", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" }); ["features", "explore", "privacy", "faq"].forEach(id => { const el = $(id); if (el) spy.observe(el); });
})();
