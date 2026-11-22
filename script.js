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
(function () {
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
    const v = new T.Vector3().randomDirection().multiplyScalar(4 + Math.random() * 2.5); pos.set([v.x, v.y, v.z], i * 3);
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
    burst.rotation.set(rot.x + tilt.x, rot.y + tilt.y, Math.min(scrollY, 800) * .0006);
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
})();
