// ARCIS extras: stats, 3D ring, scroll journey, finder, release timeline, QR.
(function () {
  const safe = f => { try { f(); } catch (e) { console.error("ARCIS extras:", e); } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ICONS = ["⌘", "▤", "◈", "✧", "⌕", "◷"];
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const toCap = i => { showCap(i); $("explore").scrollIntoView({ behavior: "smooth" }); };

  safe(() => { // stats with count-up
    const S = [["6", "capabilities in one app"], ["8.0+", "Android required"], ["1", "APK to install"], ["Local", "first, by design"]];
    const box = $("stats"); box.innerHTML = S.map(s => `<div class="stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join("");
    const b = box.querySelector("b");
    new IntersectionObserver(([e], o) => { if (!e.isIntersecting) return; o.disconnect(); if (reduceMotion) return; const t0 = performance.now(); (function f(t) { const k = clamp((t - t0) / 900, 0, 1); b.textContent = Math.max(1, Math.round(6 * k)); if (k < 1) requestAnimationFrame(f); })(t0); }).observe(box);
  });

  safe(() => { // 3D ring
    const ring = $("ring"), scene = $("ringScene"), n = CAPS.length, R = 290;
    ring.innerHTML = CAPS.map((c, i) => `<button class="rc" style="transform:rotateY(${i * 360 / n}deg) translateZ(${R}px)"><i>${ICONS[i]}</i><b>${c.n}</b><span>${c.t}</span></button>`).join("");
    ring.querySelectorAll(".rc").forEach((b, i) => b.addEventListener("click", () => { if (moved < 8) (window.openFeature ? openFeature(i) : toCap(i)); }));
    let a = 0, v = 0, drag = false, lx = 0, moved = 0, vis = true; const idle = reduceMotion ? 0 : .15;
    scene.addEventListener("pointerdown", e => { drag = true; moved = 0; lx = e.clientX; });
    addEventListener("pointermove", e => { if (!drag) return; const d = e.clientX - lx; lx = e.clientX; moved += Math.abs(d); a += d * .4; v = d * .4; });
    addEventListener("pointerup", () => (drag = false));
    new IntersectionObserver(([e]) => (vis = e.isIntersecting)).observe(scene);
    (function f() { requestAnimationFrame(f); if (!vis) return; if (!drag) { a += v; v += (idle - v) * .03; } ring.style.transform = `rotateY(${a}deg)`; })();
  });

  safe(() => { // pinned horizontal journey
    const J = [["Ask", "Start a chat with supported on-device AI and reason through anything.", "ON-DEVICE AI"], ["Share", "Bring in supported documents and images for AI-assisted understanding.", "FILES AND VISION"], ["Create", "Turn prompts into generated images and produce useful file outputs.", "IMAGES AND FILES"], ["Stay current", "Search the web for fresh sources, then return to any earlier conversation.", "SEARCH AND HISTORY"]];
    const sec = $("journey"), tr = $("jTrack"), dots = $("jDots");
    tr.innerHTML = J.map((j, i) => `<div class="j-panel"><span class="j-n">${i + 1}</span><h3>${j[0]}</h3><p>${j[1]}</p><em>${j[2]}</em></div>`).join("");
    dots.innerHTML = J.map(() => "<i></i>").join(""); const ds = dots.children;
    const upd = () => { const r = sec.getBoundingClientRect(), p = clamp(-r.top / (sec.offsetHeight - innerHeight), 0, 1); tr.style.transform = `translateX(${-p * (J.length - 1) * 100}vw)`; [...ds].forEach((d, i) => d.classList.toggle("on", i === Math.round(p * (J.length - 1)))); };
    addEventListener("scroll", upd, { passive: true }); addEventListener("resize", upd); upd();
  });

  safe(() => { // finder
    const F = [["Privacy first", 0], ["Documents", 1], ["Photos", 2], ["Creative work", 3], ["Fresh information", 4], ["Keep my chats", 5]], on = new Set();
    const chips = $("chips"), out = $("matches");
    chips.innerHTML = F.map((f, i) => `<button class="chip2" aria-pressed="false" data-i="${i}">${f[0]}</button>`).join("");
    const draw = () => { out.innerHTML = on.size ? [...on].map(i => { const c = CAPS[F[i][1]]; return `<div class="match"><b>${c.n}</b><span>${c.t}</span></div>`; }).join("") : '<p class="empty">Pick what matters to you to see your matches.</p>'; };
    chips.addEventListener("click", e => { const b = e.target.closest(".chip2"); if (!b) return; const i = +b.dataset.i, p = !on.has(i); p ? on.add(i) : on.delete(i); b.setAttribute("aria-pressed", p); draw(); });
    out.addEventListener("click", e => { const m = e.target.closest(".match"); if (m) { const k = CAPS.findIndex(c => c.n === m.querySelector("b").textContent); window.openFeature ? openFeature(k) : toCap(k); }; });
    draw();
  });

  safe(() => { // release timeline from GitHub
    const box = $("relList"), fail = () => (box.innerHTML = '<p class="empty">Release history appears here once releases are published on GitHub.</p>');
    fetch(`https://api.github.com/repos/${ARCIS_CONFIG.repo}/releases?per_page=6`, { headers: { Accept: "application/vnd.github+json" } }).then(r => r.ok ? r.json() : Promise.reject()).then(list => {
      list = list.filter(r => !r.draft); if (!list.length) return fail(); window.__rel = list;
      box.innerHTML = list.map((r, i) => {
        const apk = (r.assets || []).find(a => /\.apk$/i.test(a.name)), notes = (r.body || "").replace(/[#*`>_]/g, "").trim().slice(0, 300);
        return `<article class="rel${i === 0 ? " latest" : ""}" data-i="${i}" tabindex="0" role="button"><h3>${esc(r.name || r.tag_name)}${i === 0 ? " (latest)" : ""}</h3><small>${new Date(r.published_at || r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}${r.prerelease ? " · PRE-RELEASE" : ""}</small><p>${esc(notes || "No release notes.")}</p>${apk ? `<a href="${esc(apk.browser_download_url)}">Download APK (${fmtSize(apk.size)})</a>` : ""}</article>`;
      }).join("");
    }).catch(fail);
  });

  safe(() => { // QR for desktop visitors
    const box = $("qrBox");
    if (!window.qrcode || !/^https?:/.test(location.protocol) || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    const q = qrcode(0, "M"); q.addData(location.href.split("#")[0]); q.make();
    box.innerHTML = q.createSvgTag(4, 0); box.hidden = false;
    box.insertAdjacentHTML("afterend", '<p class="qr-cap">On a computer? Scan to open this page on your Android phone.</p>');
  });
})();
