// ARCIS 3D layer: scroll-driven background, WebGL phone, 3D logo, motion-sensor tilt.
(function () {
  if (!window.THREE) return;
  const T = THREE, reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), smooth = x => x * x * (3 - 2 * x), col = t => new T.Color().setHSL(.74 - .25 * t, .8, .68);
  const jobs = [];

  /* Motion-sensor tilt for phones (iOS asks for permission on first tap) */
  window.__tilt = { x: 0, y: 0 };
  const onOri = e => { if (e.gamma == null) return; __tilt.y = clamp(e.gamma / 45, -1, 1) * .5; __tilt.x = clamp((e.beta - 45) / 45, -1, 1) * .4; };
  if (!reduce && "DeviceOrientationEvent" in window && matchMedia("(pointer:coarse)").matches) {
    if (typeof DeviceOrientationEvent.requestPermission === "function")
      addEventListener("click", () => DeviceOrientationEvent.requestPermission().then(r => r === "granted" && addEventListener("deviceorientation", onOri)).catch(() => {}), { once: true });
    else addEventListener("deviceorientation", onOri);
  }

  function renderer(host) {
    const r = new T.WebGLRenderer({ antialias: true, alpha: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 2)); host.appendChild(r.domElement); return r;
  }
  function job(host, r, scene, cam, draw) {
    const rs = () => { const w = host.clientWidth || 1, h = host.clientHeight || 1; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
    new ResizeObserver(rs).observe(host); rs();
    const j = { vis: true, fn: t => { draw(t); r.render(scene, cam); } };
    new IntersectionObserver(([e]) => (j.vis = e.isIntersecting)).observe(host); jobs.push(j); return j;
  }
  function burst(op) {
    const g = new T.Group(), sp = [], N = 15, Y = new T.Vector3(0, 1, 0);
    g.add(new T.Mesh(new T.SphereGeometry(.6, 32, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op })));
    for (let i = 0; i < N; i++) {
      const y = 1 - 2 * (i + .5) / N, r = Math.sqrt(1 - y * y), th = i * 2.39996, dir = new T.Vector3(Math.cos(th) * r, y, Math.sin(th) * r), len = 2.2 + ((i * 37) % 10) / 10 * 1.2, c = col(i / (N - 1));
      const geo = new T.CylinderGeometry(.022, .022, len, 6); geo.translate(0, len / 2, 0);
      const stick = new T.Mesh(geo, new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .75 * op })); stick.quaternion.setFromUnitVectors(Y, dir);
      const node = new T.Mesh(new T.SphereGeometry(i % 2 ? .2 : .12, 16, 16), new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op }));
      g.add(stick, node); sp.push({ stick, node, dir, len });
    }
    g.spread = k => sp.forEach(s => { s.stick.scale.y = k; s.node.position.copy(s.dir).multiplyScalar(s.len * k); });
    g.spread(1); return g;
  }

  /* 1 + 3: full-page 3D background that transforms as you scroll */
  try {
    const host = document.createElement("div"); host.id = "bg3d"; document.body.prepend(host);
    const r = renderer(host), scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, .1, 60); cam.position.z = 9;
    const b = burst(.42); scene.add(b);
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - .5) * 22, (Math.random() - .5) * 40, (Math.random() - .5) * 14 - 2], i * 3);
    const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(pos, 3));
    const dust = new T.Points(dg, new T.PointsMaterial({ color: 0xb9b0ff, size: .05, transparent: true, opacity: .55 })); scene.add(dust);
    const K = [{ x: 3, y: 0, s: 1.1, sp: 1, ry: 0 }, { x: -3.2, y: .6, s: 1.5, sp: 1.5, ry: 1.6 }, { x: 3.2, y: -.6, s: 2, sp: 1.9, ry: 3.2 }, { x: -2.6, y: 0, s: 1.3, sp: .55, ry: 4.8 }, { x: 0, y: 0, s: 2.6, sp: 2.3, ry: 6.4 }];
    job(host, r, scene, cam, t => {
      const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight), f = p * (K.length - 1), i = Math.min(K.length - 2, f | 0), u = smooth(f - i), a = K[i], c = K[i + 1], L = k => a[k] + (c[k] - a[k]) * u;
      const mob = innerWidth < 760 ? .3 : 1, fade = smooth(clamp((p - .03) / .08, 0, 1));
      b.position.set(L("x") * mob, L("y"), 0); b.scale.setScalar(L("s") * fade * (mob < 1 ? .8 : 1)); b.spread(L("sp"));
      b.rotation.set(.3 + __tilt.x, L("ry") + (reduce ? 0 : t * .0001), 0);
      dust.position.y = p * 9; dust.rotation.y = reduce ? 0 : t * .00004;
    });
    host.dataset.ready = 1;
  } catch (e) { console.error("ARCIS bg3d", e); }

  /* 2: real 3D phone with a live screen texture */
  try {
    const stage = $("stage"), chatEl = $("chat"); if (!stage || !chatEl) throw 0;
    const host = document.createElement("div"); host.id = "phone3d"; stage.appendChild(host);
    const r = renderer(host), scene = new T.Scene(), cam = new T.PerspectiveCamera(35, 1, .1, 50); cam.position.z = 9.5;
    const sh = new T.Shape(), w = 1.05, h = 2.1, q = .34;
    sh.moveTo(-w + q, -h); sh.lineTo(w - q, -h); sh.quadraticCurveTo(w, -h, w, -h + q); sh.lineTo(w, h - q); sh.quadraticCurveTo(w, h, w - q, h); sh.lineTo(-w + q, h); sh.quadraticCurveTo(-w, h, -w, h - q); sh.lineTo(-w, -h + q); sh.quadraticCurveTo(-w, -h, -w + q, -h);
    const bg = new T.ExtrudeGeometry(sh, { depth: .22, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 4, curveSegments: 16 }); bg.translate(0, 0, -.11);
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 1024; const x = cv.getContext("2d"), tex = new T.CanvasTexture(cv); tex.anisotropy = 4;
    const phone = new T.Group();
    phone.add(new T.Mesh(bg, new T.MeshStandardMaterial({ color: 0x23274a, metalness: .85, roughness: .32 })));
    const scr = new T.Mesh(new T.PlaneGeometry(1.86, 3.92), new T.MeshBasicMaterial({ map: tex })); scr.position.z = .156; phone.add(scr);
    const notch = new T.Mesh(new T.PlaneGeometry(.46, .07), new T.MeshBasicMaterial({ color: 0 })); notch.position.set(0, 1.82, .158); phone.add(notch);
    scene.add(phone, new T.AmbientLight(0xffffff, .6)); const d = new T.DirectionalLight(0xb9a8ff, 1.2); d.position.set(3, 4, 5); scene.add(d); const pl = new T.PointLight(0x72e6e0, .9); pl.position.set(-4, -2, 3); scene.add(pl);

    const rr = (a, b, c, e, f) => { x.beginPath(); x.moveTo(a + f, b); x.arcTo(a + c, b, a + c, b + e, f); x.arcTo(a + c, b + e, a, b + e, f); x.arcTo(a, b + e, a, b, f); x.arcTo(a, b, a + c, b, f); x.closePath(); };
    const wrap = (t, m) => { const ls = []; let l = ""; t.split(" ").forEach(wd => { const s = l ? l + " " + wd : wd; if (x.measureText(s).width > m && l) { ls.push(l); l = wd; } else l = s; }); ls.push(l); return ls; };
    let msgs = [];
    const paint = cnt => {
      x.fillStyle = "#0c0e18"; x.fillRect(0, 0, 512, 1024);
      x.textAlign = "left"; x.fillStyle = "#fff"; x.font = "700 34px 'Space Grotesk',sans-serif"; x.fillText("ARCIS", 34, 92);
      x.textAlign = "right"; x.fillStyle = "#72e6e0"; x.font = "600 22px 'DM Sans',sans-serif"; x.fillText($("phoneTag").textContent, 478, 90);
      x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(0, 118, 512, 2); x.textAlign = "left";
      let y = 160; x.font = "500 28px 'DM Sans',sans-serif";
      msgs.slice(0, cnt).forEach(m => {
        const ls = wrap(m.t, 330), bw = Math.max(...ls.map(l => x.measureText(l).width)) + 40, bh = ls.length * 38 + 28, bx = m.me ? 478 - bw : 34;
        x.fillStyle = m.me ? "#7f6af0" : "#171a2b"; rr(bx, y, bw, bh, 22); x.fill();
        x.fillStyle = "#fff"; ls.forEach((l, i) => x.fillText(l, bx + 20, y + 42 + i * 38)); y += bh + 22;
      });
      tex.needsUpdate = true;
    };
    const timers = [], sync = () => {
      timers.forEach(clearTimeout); timers.length = 0;
      msgs = [...chatEl.querySelectorAll(".msg")].map(e => ({ me: e.classList.contains("me"), t: e.textContent }));
      paint(Math.min(1, msgs.length)); msgs.slice(1).forEach((_, i) => timers.push(setTimeout(() => paint(i + 2), 600 * (i + 1))));
    };
    new MutationObserver(sync).observe(chatEl, { childList: true }); sync();
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => paint(msgs.length));

    const rot = { x: .08, y: -.35 }, vel = { y: 0 }; let drag = false, lx = 0, hx = 0, hy = 0, inside = false;
    host.addEventListener("pointerdown", e => { drag = true; lx = e.clientX; host.setPointerCapture(e.pointerId); });
    host.addEventListener("pointermove", e => { const b = host.getBoundingClientRect(); hx = (e.clientX - b.left) / b.width - .5; hy = (e.clientY - b.top) / b.height - .5; inside = true; if (drag) { vel.y = (e.clientX - lx) * .008; rot.y += vel.y; lx = e.clientX; } });
    host.addEventListener("pointerup", () => (drag = false)); host.addEventListener("pointerleave", () => (inside = false));
    job(host, r, scene, cam, t => {
      if (!drag) { rot.y += vel.y; vel.y *= .94; if (!inside && !reduce) rot.y += Math.sin(t * .0006) * .0016; }
      phone.rotation.set(rot.x + (inside && !drag ? -hy * .4 : 0) + __tilt.x * .5, rot.y + (inside && !drag ? hx * .6 : 0) + __tilt.y * .6, 0);
      phone.position.y = reduce ? 0 : Math.sin(t * .0012) * .06;
    });
    stage.classList.add("p3d");
  } catch (e) { if (e) console.error("ARCIS phone3d", e); }

  /* 2b: spinning 3D logo above the download button */
  try {
    const inner = document.querySelector(".download-inner"); if (!inner) throw 0;
    const host = document.createElement("div"); host.id = "logo3d"; inner.prepend(host);
    const r = renderer(host), scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, .1, 50); cam.position.z = 9;
    const b = burst(1); b.scale.setScalar(.9); scene.add(b); let hx = 0, hy = 0;
    host.addEventListener("pointermove", e => { const k = host.getBoundingClientRect(); hx = (e.clientX - k.left) / k.width - .5; hy = (e.clientY - k.top) / k.height - .5; });
    job(host, r, scene, cam, t => b.rotation.set(hy * .8 + __tilt.x, (reduce ? 0 : t * .0004) + hx * 1.2 + __tilt.y, 0));
  } catch (e) { if (e) console.error("ARCIS logo3d", e); }

  const loop = t => { requestAnimationFrame(loop); jobs.forEach(j => j.vis && j.fn(t)); };
  requestAnimationFrame(loop);
})();
