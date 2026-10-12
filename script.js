(function () {
  var root = document.documentElement;
  root.classList.add("js");

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  /* ---------- Theme ---------- */
  var saved = null;
  try { saved = localStorage.getItem("portfolio-theme"); } catch (e) {}
  if (saved === "light" || saved === "dark") {
    root.setAttribute("data-theme", saved);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    root.setAttribute("data-theme", "dark");
  }

  var themeBtn = document.getElementById("theme");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("portfolio-theme", next); } catch (e) {}
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "dark" ? "#0e1116" : "#ffffff");
      if (fx.onTheme) fx.onTheme();
    });
  }

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  if (burger && nav) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Scroll progress + topbar + to-top + parallax ---------- */
  var progress = document.getElementById("progress");
  var toTop = document.getElementById("toTop");
  var heroInner = document.getElementById("heroInner");
  var hero = document.querySelector(".hero");

  function onScroll() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var y = window.pageYOffset || doc.scrollTop;
    var p = max > 0 ? Math.min(y / max, 1) : 0;
    if (progress) progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
    if (toTop) toTop.classList.toggle("is-on", y > 400);
    if (heroInner && !reduce) {
      var shift = Math.min(y * 0.25, 120);
      heroInner.style.transform = "translateY(" + shift.toFixed(1) + "px)";
      heroInner.style.opacity = String(Math.max(1 - y / 620, 0));
    }
  }
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }, { passive: true });
  onScroll();

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* ---------- Scrollspy ---------- */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a[data-spy]"));
  if (spyLinks.length && "IntersectionObserver" in window) {
    var spyMap = {};
    spyLinks.forEach(function (a) { spyMap[a.getAttribute("data-spy")] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          spyLinks.forEach(function (a) { a.classList.remove("is-active"); });
          var link = spyMap[en.target.id];
          if (link) link.classList.add("is-active");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ["about", "skills", "projects", "contact"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(".section, .card, .chips, .stats");
  Array.prototype.forEach.call(document.querySelectorAll(".card"), function (el, i) {
    el.style.setProperty("--i", i);
  });
  Array.prototype.forEach.call(document.querySelectorAll(".chips li"), function (el, i) {
    el.style.setProperty("--i", i);
  });

  if (reduce || !("IntersectionObserver" in window)) {
    Array.prototype.forEach.call(revealTargets, function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    Array.prototype.forEach.call(revealTargets, function (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add("is-in");
      } else {
        el.classList.add("reveal");
        io.observe(el);
      }
    });
  }

  /* ---------- Animated counters ---------- */
  var counters = document.querySelectorAll(".stats dt");
  function runCounter(el) {
    var raw = (el.textContent || "").trim();
    var match = raw.match(/^(\d+)(.*)$/);
    if (!match) return;
    var target = parseInt(match[1], 10);
    var suffix = match[2] || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var start = null;
    var dur = 900;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (!("IntersectionObserver" in window) || reduce) {
    Array.prototype.forEach.call(counters, runCounter);
  } else {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { runCounter(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });
    Array.prototype.forEach.call(counters, function (el) { cio.observe(el); });
  }

  /* ---------- Card tilt + pointer glow ---------- */
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-tilt]"), function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        var rx = (0.5 - y) * 10;
        var ry = (x - 0.5) * 12;
        card.style.transform = "perspective(700px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Magnetic buttons + ripple ---------- */
  if (fine && !reduce) {
    Array.prototype.forEach.call(document.querySelectorAll(".magnetic"), function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.18).toFixed(1) + "px," + (y * 0.28 - 2).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }
  Array.prototype.forEach.call(document.querySelectorAll(".btn"), function (btn) {
    btn.addEventListener("click", function (e) {
      if (reduce) return;
      var r = btn.getBoundingClientRect();
      var s = document.createElement("span");
      var d = Math.max(r.width, r.height);
      s.className = "ripple";
      s.style.width = s.style.height = d + "px";
      s.style.left = (e.clientX - r.left - d / 2) + "px";
      s.style.top = (e.clientY - r.top - d / 2) + "px";
      btn.appendChild(s);
      setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 650);
    });
  });

  /* ---------- Cursor glow ---------- */
  var glow = document.getElementById("cursorGlow");
  if (glow && fine && !reduce) {
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;
    window.addEventListener("pointermove", function (e) {
      gx = e.clientX; gy = e.clientY;
      glow.classList.add("is-on");
    }, { passive: true });
    document.addEventListener("pointerleave", function () { glow.classList.remove("is-on"); });
    (function loop() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Hero particle constellation ---------- */
  var fx = {};
  (function particles() {
    var canvas = document.getElementById("fx");
    if (!canvas || !hero || reduce) return;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [];
    var w = 0, h = 0;
    var running = false, visible = true;
    var rgb = "47,107,255";

    function readAccent() {
      var c = getComputedStyle(root).getPropertyValue("--accent").trim();
      if (c.charAt(0) === "#") {
        var hex = c.slice(1);
        if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        var n = parseInt(hex, 16);
        rgb = ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
      } else if (c.indexOf("rgb") === 0) {
        rgb = c.replace(/[^0-9,]/g, "");
      }
    }
    fx.onTheme = function () { readAccent(); };

    function resize() {
      var r = hero.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.round(Math.min(90, (w * h) / 16000));
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.6 + 0.8
        });
      }
    }

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      var i, j, p, q, dx, dy, dist;
      for (i = 0; i < pts.length; i++) {
        p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + rgb + ",0.55)";
        ctx.fill();
        for (j = i + 1; j < pts.length; j++) {
          q = pts[j];
          dx = p.x - q.x; dy = p.y - q.y;
          dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(" + rgb + "," + (0.16 * (1 - dist / 130)).toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }

    function start() {
      if (running || document.hidden) return;
      running = true;
      requestAnimationFrame(frame);
    }
    function stop() { running = false; }
    fx.start = start;

    readAccent();
    resize();
    window.addEventListener("resize", resize);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else stop();
      }, { threshold: 0 }).observe(hero);
    } else {
      visible = true;
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (visible) start();
    });
    start();
  })();

  /* ---------- Year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
