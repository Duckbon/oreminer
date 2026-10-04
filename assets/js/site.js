/* Ore Miner website behaviour: navigation, sky, store buttons, home page
   widgets, community forms and the play page read-outs. */
(function () {
  var D = window.OREMINER, C = window.OREMINER_CONFIG || {};
  var fmt = D.format, root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function commas(n) { return Number(n).toLocaleString("en-AU"); }

  /* ---------- navigation ---------- */
  var toggle = $(".nav-toggle"), links = $(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.addEventListener("click", function (e) {
      if (e.target.closest("a")) { links.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- store and Discord buttons follow config.js ---------- */
  $$("[data-store]").forEach(function (a) {
    if (C.playStoreLive && C.playStoreUrl) {
      a.href = C.playStoreUrl; a.target = "_blank"; a.rel = "noopener";
      a.textContent = "Get it on Google Play";
    } else {
      a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link");
      a.textContent = "Coming soon to Google Play";
    }
  });
  if (!(C.playStoreLive && C.playStoreUrl)) document.body.classList.add("store-soon");
  $$("[data-discord]").forEach(function (a) {
    if (C.discordUrl) { a.href = C.discordUrl; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Join the Discord"; }
    else { a.removeAttribute("href"); a.setAttribute("aria-disabled", "true"); a.setAttribute("role", "link"); a.textContent = "Discord coming soon"; }
  });

  /* ---------- the sky ---------- */
  (function sky() {
    var holder = $(".sky"); if (!holder) return;
    var canvas = document.createElement("canvas"); holder.appendChild(canvas);
    var ctx = canvas.getContext("2d"), stars = [], w = 0, h = 0, dpr = 1;
    function seed() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      stars = [];
      var count = Math.round(w * h / 9000);
      for (var i = 0; i < count; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.6 + 0.2, p: Math.random() * 6.28, s: Math.random() * 0.8 + 0.3 });
      }
    }
    function draw(t) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = reduceMotion ? s.a : s.a * (0.65 + 0.35 * Math.sin(s.p + t * 0.001 * s.s));
        ctx.fillStyle = "rgba(241,242,250," + a.toFixed(3) + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
    }
    var last = 0;
    function loop(t) { if (t - last > 66) { last = t; draw(t); } requestAnimationFrame(loop); }
    var lastW = 0;
    window.addEventListener("resize", function () { if (window.innerWidth !== lastW) { lastW = window.innerWidth; seed(); draw(0); } });
    seed(); lastW = w; draw(0);
    if (!reduceMotion) requestAnimationFrame(loop);
  })();

  /* ---------- the game on this page ---------- */
  var gameHost = $("[data-game]"), game = null;
  var pageSystem = 0;
  function tint(index) { pageSystem = index; D.applyTheme(root, index); }
  window.addEventListener("oreminer:system", function (e) { tint(e.detail.index); selectSystem(e.detail.index, true); });
  function selectSystem() {}

  if (gameHost) { game = D.startGame(); }

  /* ---------- home: the route ---------- */
  var route = $(".route"), panel = $(".system-panel");
  if (route && panel) {
    var buttons = [];
    D.systems.forEach(function (s, i) {
      var li = document.createElement("li");
      li.style.setProperty("--dot", s.accent);
      li.style.setProperty("--from", i ? D.systems[i - 1].accent : s.accent);
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("aria-pressed", "false");
      b.innerHTML = "<i></i><span></span>";
      b.lastChild.textContent = s.name;
      var small = document.createElement("small"); small.textContent = "System " + (i + 1); b.lastChild.appendChild(small);
      b.addEventListener("click", function () { tint(i); selectSystem(i); });
      li.appendChild(b); route.appendChild(li); buttons.push(b);
    });
    var pCanvas = $("canvas", panel), pName = $("h3", panel), pSub = $(".sub", panel);
    var pGoalLabel = $("[data-goal-label]", panel), pGoal = $("[data-goal]", panel);
    var pUp = $("[data-upgrade]", panel), pBonus = $("[data-bonus]", panel);
    selectSystem = function (i, quiet) {
      var s = D.systems[i], last = i === D.systems.length - 1;
      buttons.forEach(function (b, n) { b.setAttribute("aria-pressed", n === i ? "true" : "false"); });
      pName.textContent = s.name;
      pSub.textContent = "System " + (i + 1) + " of " + D.systems.length + (i === 0 ? ", where every run starts" : last ? ", the last stop before a rebirth" : "");
      pGoalLabel.textContent = last ? "Ore needed to rebirth" : "Ore needed to launch onward";
      pGoal.innerHTML = ""; pGoal.textContent = commas(s.threshold);
      var gs = document.createElement("small");
      gs.textContent = last ? "Rebirth returns you to Sol Belt with +10% production for good" : "Next stop: " + D.systems[i + 1].name;
      pGoal.appendChild(gs);
      pUp.innerHTML = "";
      var us = document.createElement("small");
      if (s.upgrade) {
        pUp.textContent = s.upgrade.name;
        us.textContent = "+" + commas(s.upgrade.effect) + (s.upgrade.type === "click" ? " ore per tap" : " ore per second") + " each, from " + commas(s.upgrade.baseCost) + " ore";
      } else {
        pUp.textContent = "The starter kit";
        us.textContent = "Better Drill, Mining Drone, Refinery and Idle Collector";
      }
      pUp.appendChild(us);
      var bonus = Math.floor((i + 1) / 2) * 10;
      pBonus.innerHTML = ""; pBonus.textContent = "+" + bonus + "%";
      var bs = document.createElement("small"); bs.textContent = bonus ? "Production boost while you mine here" : "The boosts start at Kepler Reach";
      pBonus.appendChild(bs);
      D.drawAsteroid(pCanvas, s.accent);
      if (!quiet && buttons[i].scrollIntoView && route.scrollWidth > route.clientWidth) {
        route.scrollTo({ left: buttons[i].parentNode.offsetLeft - route.clientWidth / 2 + 52, behavior: reduceMotion ? "auto" : "smooth" });
      }
    };
    window.addEventListener("resize", function () { D.drawAsteroid(pCanvas, D.systems[pageSystem].accent); });
  }

  /* Mount the phone last so its first "system" event reaches the route. */
  if (gameHost) D.mount(gameHost, game);
  else tint(0);

  /* ---------- home: combo pad ---------- */
  var pad = $(".combo-pad");
  if (pad) {
    var out = $(".combo-read output"), bar = $$(".combo-bar span"), stacks = 0, lastTap = 0, decay = null;
    function showCombo() {
      out.textContent = "x" + (1 + stacks * D.rules.comboPerStack).toFixed(1);
      bar.forEach(function (s, i) { s.classList.toggle("is-on", i < stacks); });
    }
    pad.addEventListener("click", function () {
      var now = Date.now();
      stacks = now - lastTap <= D.rules.comboWindowMs ? Math.min(stacks + 1, D.rules.comboMaxStacks) : 0;
      lastTap = now; showCombo();
      clearTimeout(decay);
      decay = setTimeout(function () { stacks = 0; showCombo(); }, D.rules.comboWindowMs);
    });
    showCombo();
  }

  /* ---------- home: daily spin ---------- */
  var wheel = $(".wheel-wrap svg");
  if (wheel) {
    var NS = "http://www.w3.org/2000/svg", segs = [false, true, false, false, true, false];
    var fills = ["#2A3050", "#3ECF8E", "#1A2456", "#2A3050", "#3ECF8E", "#1A2456"];
    segs.forEach(function (isGame, i) {
      var a0 = i * 60 * Math.PI / 180, a1 = (i + 1) * 60 * Math.PI / 180, mid = (a0 + a1) / 2;
      var p = document.createElementNS(NS, "path");
      p.setAttribute("d", "M100 100 L" + (100 + 92 * Math.cos(a0)) + " " + (100 + 92 * Math.sin(a0)) + " A92 92 0 0 1 " + (100 + 92 * Math.cos(a1)) + " " + (100 + 92 * Math.sin(a1)) + " Z");
      p.setAttribute("fill", fills[i]); p.setAttribute("stroke", "#05060F"); p.setAttribute("stroke-width", "1.5");
      wheel.appendChild(p);
      var t = document.createElementNS(NS, "text");
      var x = 100 + 59 * Math.cos(mid), y = 100 + 59 * Math.sin(mid);
      t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", "middle");
      t.setAttribute("transform", "rotate(" + (i * 60 + 30 + 90) + " " + x + " " + y + ")");
      t.setAttribute("fill", isGame ? "#05060F" : "#FFFFFF"); t.setAttribute("font-size", "10"); t.setAttribute("font-weight", "700");
      t.setAttribute("font-family", "Space Grotesk, sans-serif");
      [isGame ? "MINI" : "NO", "GAME"].forEach(function (word, n) {
        var ts = document.createElementNS(NS, "tspan"); ts.setAttribute("x", x); ts.setAttribute("dy", n ? "11" : "-2"); ts.textContent = word; t.appendChild(ts);
      });
      wheel.appendChild(t);
    });
    var ring = document.createElementNS(NS, "circle");
    ring.setAttribute("cx", 100); ring.setAttribute("cy", 100); ring.setAttribute("r", 92); ring.setAttribute("fill", "none"); ring.setAttribute("stroke", "#F2A83C"); ring.setAttribute("stroke-width", "4");
    var hub = document.createElementNS(NS, "circle");
    hub.setAttribute("cx", 100); hub.setAttribute("cy", 100); hub.setAttribute("r", 13); hub.setAttribute("fill", "#F2A83C");
    wheel.appendChild(ring); wheel.appendChild(hub);
    var spinBtn = $("[data-spin]"), spinOut = $(".spin-result"), turn = 0;
    spinBtn.addEventListener("click", function () {
      var target = Math.floor(Math.random() * 6), centre = target * 60 + 30;
      var want = ((270 - centre) % 360 + 360) % 360, have = ((turn % 360) + 360) % 360, delta = want - have;
      if (delta < 0) delta += 360;
      turn += 5 * 360 + delta;
      wheel.style.transform = "rotate(" + turn + "deg)";
      spinBtn.disabled = true; spinBtn.setAttribute("aria-disabled", "true"); spinOut.textContent = "";
      setTimeout(function () {
        spinOut.textContent = segs[target] ? "Mini-game unlocked. In the game, the shooter starts now." : "No mini-game this time. In the game you'd try again tomorrow.";
        spinBtn.disabled = false; spinBtn.removeAttribute("aria-disabled"); spinBtn.textContent = "Spin again";
      }, reduceMotion ? 50 : 2900);
    });
  }

  /* ---------- home: screenshots appear once image files exist ---------- */
  var shots = $(".shots");
  if (shots) {
    var section = shots.closest("section"), names = ["Mining screen", "Upgrades", "Star systems", "Challenges", "Skill tree", "Mini-game"];
    names.forEach(function (label, i) {
      var img = new Image();
      img.alt = "Ore Miner screenshot: " + label; img.loading = "lazy";
      img.onload = function () { shots.appendChild(img); section.hidden = false; };
      img.src = "assets/img/screenshot-" + (i + 1) + ".png";
    });
  }

  /* ---------- community forms ---------- */
  function status(node, text, kind) {
    node.textContent = text; node.classList.remove("is-error", "is-ok");
    if (kind) node.classList.add("is-" + kind);
  }
  function send(endpoint, form, node, okText) {
    status(node, "Sending…");
    fetch(endpoint, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })
      .then(function (r) { if (!r.ok) throw new Error(); form.reset(); status(node, okText, "ok"); })
      .catch(function () { status(node, "That didn't send. Check your connection and send it again.", "error"); });
  }
  var NOT_SET = "This form isn't switched on yet. Add an email or form address in assets/js/config.js.";

  var fb = $("#feedback-form");
  if (fb) {
    var fbStatus = $(".form-status", fb);
    fb.addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = fb.elements.message.value.trim(), kind = fb.elements.kind.value;
      if (msg.length < 10) { status(fbStatus, "Add a bit more detail so the message is clear (10 characters or more).", "error"); fb.elements.message.focus(); return; }
      if (C.feedbackEndpoint) return send(C.feedbackEndpoint, fb, fbStatus, "Sent. Thanks for helping shape Ore Miner.");
      if (C.contactEmail) {
        var name = fb.elements.name.value.trim();
        window.location.href = "mailto:" + C.contactEmail + "?subject=" + encodeURIComponent("Ore Miner: " + kind) +
          "&body=" + encodeURIComponent(msg + (name ? "\n\nFrom: " + name : ""));
        return status(fbStatus, "Your email app should open with the message ready. Press send there to finish.", "ok");
      }
      status(fbStatus, NOT_SET, "error");
    });
  }
  var news = $("#news-form");
  if (news) {
    var newsStatus = $(".form-status", news.parentNode);
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = news.elements.email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status(newsStatus, "Enter an email address like name@example.com.", "error"); news.elements.email.focus(); return; }
      if (C.newsEndpoint) return send(C.newsEndpoint, news, newsStatus, "You're on the list. Updates will land in your inbox.");
      if (C.contactEmail) {
        window.location.href = "mailto:" + C.contactEmail + "?subject=" + encodeURIComponent("Ore Miner: add me to the news list") +
          "&body=" + encodeURIComponent("Please send Ore Miner updates to " + email);
        return status(newsStatus, "Your email app should open. Press send there to join the list.", "ok");
      }
      status(newsStatus, NOT_SET, "error");
    });
  }
  var share = $("[data-share]");
  if (share) {
    var shareStatus = $("[data-share-status]");
    share.addEventListener("click", function () {
      var url = window.location.href.split("#")[0];
      var data = { title: "Ore Miner", text: "Mine ore, launch to new star systems, and build your idle empire.", url: url };
      if (navigator.share) { navigator.share(data).catch(function () {}); return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { status(shareStatus, "Link copied. Paste it anywhere.", "ok"); },
          function () { status(shareStatus, "Copy this link: " + url); });
      } else status(shareStatus, "Copy this link: " + url);
    });
  }

  /* ---------- play page ---------- */
  var readout = $(".readout");
  if (readout && game) {
    var cells = {};
    $$("[data-stat]", readout).forEach(function (n) { cells[n.getAttribute("data-stat")] = n; });
    var legs = $(".legs"), legItems = [];
    for (var i = 0; i <= D.demoLastIndex; i++) {
      var li = document.createElement("li"); li.style.setProperty("--dot", D.systems[i].accent);
      li.innerHTML = "<i></i><span></span><span></span>";
      li.children[1].textContent = D.systems[i].name;
      legs.appendChild(li); legItems.push(li);
    }
    function hrs(secs) { var m = Math.round(secs / 60); return m >= 60 ? (Math.floor(m / 60) + " hr " + (m % 60 ? (m % 60) + " min" : "")).trim() : m + " min"; }
    function paint() {
      cells.tap.textContent = fmt(Math.max(1, Math.floor(game.opc * game.multiplier())));
      cells.sec.textContent = fmt(game.perSecond());
      cells.bonus.textContent = "+" + game.bonusPercent() + "%";
      cells.life.textContent = fmt(game.lifetime);
      cells.taps.textContent = commas(game.clicks);
      cells.offline.textContent = hrs(game.offlineCap()) + " at " + Math.round(game.offlineRate() * 100) + "%";
      legItems.forEach(function (li, n) {
        li.className = n < game.sys ? "is-done" : n === game.sys ? "is-here" : "";
        li.children[2].textContent = n < game.sys ? "Cleared" : n === game.sys
          ? Math.min(100, Math.floor(game.ore / D.systems[n].threshold * 100)) + "% of " + fmt(D.systems[n].threshold) + " ore"
          : "Launch at " + fmt(D.systems[n - 1].threshold) + " ore";
      });
    }
    game.on("change", paint); paint();
    var reset = $("[data-reset]"), armed = null;
    reset.addEventListener("click", function () {
      if (armed) { clearTimeout(armed); armed = null; game.resetAll(); reset.textContent = "Demo progress erased"; setTimeout(function () { reset.textContent = "Reset demo progress"; }, 2000); return; }
      reset.textContent = "Press again to erase everything";
      armed = setTimeout(function () { armed = null; reset.textContent = "Reset demo progress"; }, 4000);
    });
  }

  var year = $("[data-year]"); if (year) year.textContent = new Date().getFullYear();
})();
