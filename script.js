// ARCIS site: live GitHub release lookup, 3D hero, card tilt.
const ARCIS_CONFIG = { repo: "Prabhanshu-developer/arcis-website" };
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Latest release from GitHub ---------- */
async function loadRelease() {
  const key = "arcis-latest";
  try { const c = JSON.parse(sessionStorage.getItem(key) || "null"); if (c && Date.now() - c.t < 6e5) return c.d; } catch (e) {}
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 6000);
  const r = await fetch(`https://api.github.com/repos/${ARCIS_CONFIG.repo}/releases/latest`, { headers: { Accept: "application/vnd.github+json" }, signal: ctl.signal });
  clearTimeout(to);
  if (!r.ok) throw new Error("GitHub " + r.status);
  const j = await r.json();
  const a = (j.assets || []).filter(x => /\.apk$/i.test(x.name)).sort((x, y) => /arcis/i.test(y.name) - /arcis/i.test(x.name))[0];
  if (!a) throw new Error("No APK in latest release");
  const d = { version: j.tag_name.replace(/^v/i, ""), url: a.browser_download_url, size: a.size, date: j.published_at, page: j.html_url };
  try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
  return d;
}
const fmtSize = b => b >= 1e9 ? (b / 1e9).toFixed(1) + " GB" : Math.round(b / 1e6) + " MB";
loadRelease().then(d => {
  document.querySelectorAll("[data-version]").forEach(n => (n.textContent = d.version));
  document.getElementById("downloadButton").href = d.url;
  document.getElementById("dlSize").textContent = fmtSize(d.size);
  document.getElementById("releaseDate").textContent = "Latest release: v" + d.version + ", " + new Date(d.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  document.getElementById("allReleases").href = d.page.replace(/\/tag\/.*/, "");
}).catch(() => {
  // Fallback link in the HTML always points at the newest release's arcis.apk.
  document.getElementById("releaseDate").textContent = "Downloads the newest release from GitHub.";
});

/* ---------- Page basics ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
const menuToggle = document.getElementById("menuToggle"), mainNav = document.getElementById("mainNav");
menuToggle.addEventListener("click", () => {
  const o = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(o));
  menuToggle.setAttribute("aria-label", o ? "Close navigation" : "Open navigation");
});
mainNav.querySelectorAll("a").forEach(l => l.addEventListener("click", () => { mainNav.classList.remove("open"); menuToggle.setAttribute("aria-expanded", "false"); }));

/* ---------- Card tilt ---------- */
if (matchMedia("(hover:hover)").matches && !reduceMotion) {
  document.querySelectorAll(".feature-card,.about-panel").forEach(el => {
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", (x - .5) * 10 + "deg"); el.style.setProperty("--rx", (.5 - y) * 10 + "deg");
      el.style.setProperty("--gx", x * 100 + "%"); el.style.setProperty("--gy", y * 100 + "%");
    });
    el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
  });
}

/* ---------- 3D hero: the ARCIS burst ---------- */
(function () { try {
  const host = document.getElementById("hero3d"), label = document.getElementById("nodeLabel");
  if (!host || !window.THREE) return;
  const T = THREE;
  let renderer;
  try { renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, 1, .1, 50);
  camera.position.z = 9;
  const burst = new T.Group(); scene.add(burst);

  const NAMES = ["On-device AI", "Work with files", "Image understanding", "Image generation", "Online search", "Conversation history"];
  const FEAT = [1, 3, 6, 8, 11, 13], N = 15, Y = new T.Vector3(0, 1, 0);
  const col = t => new T.Color().setHSL(.74 - .25 * t, .8, .68);

  burst.add(new T.Mesh(new T.SphereGeometry(.6, 32, 32), new T.MeshBasicMaterial({ color: 0xffffff })));
  burst.add(new T.Mesh(new T.SphereGeometry(1.1, 32, 32), new T.MeshBasicMaterial({ color: 0x9b7cff, transparent: true, opacity: .14, depthWrite: false })));

  const nodes = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = i * 2.39996;
    const dir = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r), len = 2.2 + ((i * 37) % 10) / 10 * 1.2, c = col(i / (N - 1));
    const geo = new T.CylinderGeometry(.022, .022, len, 6); geo.translate(0, len / 2, 0);
    const stick = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .75 }));
    stick.quaternion.setFromUnitVectors(Y, dir); burst.add(stick);
    const f = FEAT.indexOf(i);
    const node = new T.Mesh(new T.SphereGeometry(f >= 0 ? .24 : .1, 20, 20), new T.MeshBasicMaterial({ color: c }));
    node.position.copy(dir).multiplyScalar(len); node.userData = { f, s: 1, ph: i }; burst.add(node); nodes.push(node);
  }
  const hits = nodes.filter(n => n.userData.f >= 0);

  const pos = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) {
    const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, q = Math.sqrt(1 - u * u), m = 4 + Math.random() * 2.5; pos.set([q * Math.cos(a) * m, u * m, q * Math.sin(a) * m], i * 3);
  }
  const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
  const dust = new T.Points(dg, new T.PointsMaterial({ color: 0xb9b0ff, size: .04, transparent: true, opacity: .6 })); scene.add(dust);
  const rings = [[3.7, 0x9b7cff, 1.2], [4.4, 0x72e6e0, -.5]].map(([rad, c, rx]) => {
    const m = new T.Mesh(new T.TorusGeometry(rad, .008, 8, 120), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .3 }));
    m.rotation.x = rx; scene.add(m); return m;
  });

  const rot = { x: .25, y: 0 }, vel = { x: 0, y: 0 }, tilt = { x: 0, y: 0 }, idle = reduceMotion ? 0 : .0025;
  let drag = false, moved = 0, lx = 0, ly = 0, px = 0, py = 0, inside = false, hover = null, W = 1, H = 1;
  const v3 = new T.Vector3();
  const screen = n => { n.getWorldPosition(v3); v3.project(camera); return [(v3.x + 1) / 2 * W, (1 - v3.y) / 2 * H]; };
  const pick = () => { let best = null, bd = 34; hits.forEach(n => { const [x, y] = screen(n), d = Math.hypot(x - px, y - py); if (d < bd) { bd = d; best = n; } }); return best; };
  const local = e => { const r = host.getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; };

  host.addEventListener("pointerdown", e => { local(e); drag = true; moved = 0; lx = e.clientX; ly = e.clientY; host.setPointerCapture(e.pointerId); });
  host.addEventListener("pointermove", e => {
    local(e); inside = true;
    if (!drag) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    rot.y += dx * .006; rot.x = Math.max(-1.2, Math.min(1.2, rot.x + dy * .006)); vel.y = dx * .006; vel.x = dy * .006;
  });
  host.addEventListener("pointerup", e => {
    local(e); drag = false;
    const n = moved < 8 && pick();
    if (n) {
      const card = document.querySelectorAll(".feature-card")[n.userData.f];
      if (card) { card.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => { card.classList.remove("flash"); void card.offsetWidth; card.classList.add("flash"); }, 600); }
    }
  });
  host.addEventListener("pointerleave", () => { inside = false; });

  const resize = () => { W = host.clientWidth || 1; H = host.clientHeight || 1; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  new ResizeObserver(resize).observe(host); resize();

  let run = true, raf = 0;
  const frame = t => {
    raf = requestAnimationFrame(frame); t *= .001;
    if (!drag) { rot.y += vel.y; rot.x = Math.max(-1.2, Math.min(1.2, rot.x + vel.x)); vel.y += (idle - vel.y) * .03; vel.x *= .94; }
    const tx = inside && !drag ? (py / H - .5) * .4 : 0, ty = inside && !drag ? (px / W - .5) * .5 : 0;
    tilt.x += (tx - tilt.x) * .06; tilt.y += (ty - tilt.y) * .06;
    burst.rotation.set(rot.x + tilt.x + (window.__tilt ? __tilt.x : 0), rot.y + tilt.y + (window.__tilt ? __tilt.y : 0), Math.min(scrollY, 800) * .0006);
    rings[0].rotation.z = t * .15; rings[1].rotation.z = -t * .1; dust.rotation.y = t * .02;
    hover = inside && !drag ? pick() : null;
    host.style.cursor = hover ? "pointer" : "";
    nodes.forEach(n => {
      const want = n === hover ? 1.6 : 1 + (reduceMotion ? 0 : .12 * Math.sin(t * 2 + n.userData.ph));
      n.userData.s += (want - n.userData.s) * .15; n.scale.setScalar(n.userData.s);
    });
    if (hover) { const [x, y] = screen(hover); label.textContent = NAMES[hover.userData.f]; label.style.left = x + "px"; label.style.top = y + "px"; label.classList.add("show"); }
    else label.classList.remove("show");
    renderer.render(scene, camera);
  };
  new IntersectionObserver(([en]) => { if (en.isIntersecting && !raf) frame(performance.now()); else if (!en.isIntersecting) { cancelAnimationFrame(raf); raf = 0; } }).observe(host);
  document.documentElement.classList.add("webgl");
} catch (err) { console.error("ARCIS 3D hero failed:", err); }
})();

/* ---------- Rebuild: progress, explorer, data flow, FAQ ---------- */
const $ = id => document.getElementById(id);
addEventListener("scroll", () => { $("progress").style.width = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) * 100 + "%"; }, { passive: true });

const CAPS = [
  { n: "On-device AI", tag: "LOCAL", t: "Chat and reason with supported local language models running on your Android device.", b: ["Core conversations are built around on-device AI", "Which models work depends on your device"], c: [["me", "Explain recursion simply."], ["ai", "Recursion is when a function solves a problem by calling itself on a smaller piece of it."]] },
  { n: "Work with files", tag: "FILES", t: "Understand supported documents and create useful file outputs.", b: ["Read supported documents", "Create file outputs from a conversation"], c: [["me", "Summarize this document."], ["ai", "Here are the three main points from the file you shared."]] },
  { n: "Image understanding", tag: "VISION", t: "Submit images for AI-assisted interpretation and analysis.", b: ["Ask questions about an image", "Availability depends on the selected model and device"], c: [["me", "What is in this photo?"], ["ai", "I can describe the scene and answer questions about it."]] },
  { n: "Image generation", tag: "CREATE", t: "Turn prompts into generated images using the configured image service.", b: ["Uses an external image service", "Your prompt is sent to that service"], c: [["me", "Draw a neon city at night."], ["ai", "Generating your image with the configured service."]] },
  { n: "Online search", tag: "SEARCH", t: "Use web search when an answer needs current information or external sources.", b: ["For up-to-date answers", "Relevant queries go to a search provider"], c: [["me", "What happened today in tech?"], ["ai", "Searching the web for current sources."]] },
  { n: "Conversation history", tag: "HISTORY", t: "Keep separate conversations and return to previous chats.", b: ["Separate chats per topic", "Pick up where you left off"], c: [["me", "Back to my study plan chat."], ["ai", "Opened your earlier conversation."]] }
];
const tabs = $("tabs");
function showCap(i) {
  const c = CAPS[i];
  tabs.querySelectorAll(".tab").forEach((b, j) => b.setAttribute("aria-selected", j === i));
  $("phoneTag").textContent = c.tag;
  $("chat").innerHTML = c.c.map((m, k) => `<div class="msg ${m[0]}" style="animation-delay:${k * .25}s">${m[1]}</div>`).join("");
  $("detail").innerHTML = `<h3>${c.n}</h3><p>${c.t}</p><ul>${c.b.map(x => `<li>${x}</li>`).join("")}</ul>`;
}
CAPS.forEach((c, i) => { const b = document.createElement("button"); b.className = "tab"; b.role = "tab"; b.textContent = c.n; b.onclick = () => showCap(i); tabs.appendChild(b); });
showCap(0);
const stage = $("stage"), phone = $("phone");
if (!reduceMotion) {
  stage.addEventListener("pointermove", e => { const r = stage.getBoundingClientRect(); phone.style.setProperty("--py", ((e.clientX - r.left) / r.width - .5) * 40 + "deg"); phone.style.setProperty("--px", (.5 - (e.clientY - r.top) / r.height) * 24 + "deg"); });
  stage.addEventListener("pointerleave", () => { phone.style.setProperty("--py", "-14deg"); phone.style.setProperty("--px", "6deg"); });
}

const FLOW = [
  ["Chat with local models", "Core conversations run on supported models on your device.", "STAYS ON DEVICE", false],
  ["Online search", "Relevant queries are sent to a search provider to fetch current results.", "EXTERNAL PROVIDER", true],
  ["Image generation", "Your prompt is sent to the configured image service.", "EXTERNAL PROVIDER", true]
];
$("flowGrid").innerHTML = FLOW.map(f => `<div class="flow ${f[3] ? "ext off" : "on"}"><h3>${f[0]}</h3><p>${f[1]}</p><span class="chip">${f[2]}</span></div>`).join("");
$("onlineToggle").addEventListener("change", e => {
  $("switchText").textContent = "Online features: " + (e.target.checked ? "on" : "off");
  $("flowGrid").querySelectorAll(".ext").forEach(n => { n.classList.toggle("on", e.target.checked); n.classList.toggle("off", !e.target.checked); });
});

const FAQ = [
  ["What is ARCIS?", "An Android AI assistant with on-device AI at its core, built to give you a practical, flexible experience."],
  ["Does ARCIS need the internet?", "Core conversations use on-device AI. Online search and cloud image generation need a connection and send relevant data to external providers."],
  ["Which Android versions are supported?", "Android 8.0 or newer."],
  ["Why is the download large?", "The latest file size is shown next to the download button, so you can check it before you start."],
  ["How do I get updates?", "Download again from this page. The button always points to the newest GitHub release."],
  ["Is it safe to install an APK?", "Android may ask you to allow installs from your browser. Only install apps from sources you trust."],
  ["Who makes ARCIS?", "ARCIS is independently developed by Prabhanshu."]
];
$("faqList").innerHTML = FAQ.map((f, i) => `<div><button aria-expanded="false" aria-controls="a${i}">${f[0]}<span>+</span></button><div class="a" id="a${i}"><p>${f[1]}</p></div></div>`).join("");
$("faqList").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const open = b.getAttribute("aria-expanded") !== "true";
  b.setAttribute("aria-expanded", open); b.nextElementSibling.classList.toggle("open", open);
});

/* ---------- Engagement layer ---------- */
(function () {
  const spot = document.createElement("div"); spot.className = "spot"; document.body.prepend(spot);
  addEventListener("pointermove", e => { spot.style.setProperty("--mx", e.clientX + "px"); spot.style.setProperty("--my", e.clientY + "px"); }, { passive: true });

  const m = $("manifesto"), words = m.textContent.split(" ");
  m.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
  const ws = m.querySelectorAll(".w");
  const paint = () => {
    const r = m.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
    ws.forEach((w, i) => w.classList.toggle("lit", reduceMotion || i / ws.length < p));
  };
  addEventListener("scroll", paint, { passive: true }); paint();

  const PILL = [
    ["Your AI", "A flexible assistant in one Android app: chat, files, images, search and conversation history, all in one place.", "#8e70f7"],
    ["Your Control", "On-device AI is the foundation. Online search and cloud image generation are optional, and you can see what each one involves.", "#23c9c1"],
    ["Your Intelligence", "Core conversations run on supported local models on your device, so useful intelligence stays in your hands.", "#6c91ec"]
  ];
  const pl = $("pillarList");
  pl.innerHTML = PILL.map((p, i) => `<button class="pillar${i ? "" : " active"}" style="--c:${p[2]}"><h3>${p[0]}</h3><p>${p[1]}</p></button>`).join("");
  const ps = pl.querySelectorAll(".pillar"), act = b => ps.forEach(x => x.classList.toggle("active", x === b));
  ps.forEach(b => { b.addEventListener("mouseenter", () => matchMedia("(hover:hover)").matches && act(b)); b.addEventListener("click", () => act(b)); b.addEventListener("focus", () => act(b)); });

  const IDEAS = [
    ["Study and learn", "Ask for explanations, summaries and practice questions from on-device AI.", 0],
    ["Make sense of documents", "Share a supported file and ask for the key points.", 1],
    ["Understand what you see", "Submit an image and ask questions about it.", 2],
    ["Stay current", "Use web search when an answer needs fresh sources.", 4]
  ];
  $("ideaGrid").innerHTML = IDEAS.map((d, i) => `<button class="idea" data-i="${i}"><b>${d[0]}</b><span>${d[1]}</span><em>SEE IT IN THE PREVIEW ↑</em></button>`).join("");
  $("ideaGrid").addEventListener("click", e => {
    const b = e.target.closest(".idea"); if (!b) return;
    showCap(IDEAS[b.dataset.i][2]); $("explore").scrollIntoView({ behavior: "smooth" });
  });

  const fl = $("floatDl"); let past = false, atDl = false;
  const upd = () => fl.classList.toggle("show", past && !atDl);
  addEventListener("scroll", () => { past = scrollY > 700; upd(); }, { passive: true });
  new IntersectionObserver(([en]) => { atDl = en.isIntersecting; upd(); }).observe($("download"));

  const dl = $("downloadButton");
  if (matchMedia("(hover:hover)").matches && !reduceMotion) {
    dl.addEventListener("pointermove", e => { const r = dl.getBoundingClientRect(); dl.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .15}px,${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    dl.addEventListener("pointerleave", () => { dl.style.transform = ""; });
  }
})();
