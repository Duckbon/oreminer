/* Ore Miner web demo: game rules + the phone screen that plays them.
   The rules follow the Android game. The demo leaves out ads, the shop,
   the daily spin, the mini-game, rebirths and the skill tree. */
(function () {
  var D = window.OREMINER, C = window.OREMINER_CONFIG || {};
  var R = D.rules, fmt = D.format;
  var KEY = "oreminer_demo_v1";
  var LAST = Math.max(1, Math.min(D.systems.length, C.demoLastSystem || 3)) - 1;

  /* ---------- colour helpers ---------- */
  function rgb(hex) { var n = parseInt(hex.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function lum(hex) {
    var c = rgb(hex).map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  /* Sets the colour variables for one star system on any element. */
  D.applyTheme = function (el, index) {
    var s = D.systems[index], l = lum(s.accent);
    el.style.setProperty("--accent", s.accent);
    el.style.setProperty("--accent-rgb", rgb(s.accent).join(","));
    el.style.setProperty("--glow", s.glow);
    el.style.setProperty("--accent-ink", l > 0.35 ? "#05060F" : "#FFFFFF");
    el.style.setProperty("--accent-text", l < 0.2 ? s.glow : s.accent);
  };

  function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }
  function blend(a, b, t) { return a.map(function (v, i) { return clamp(v * (1 - t) + b[i] * t); }); }
  function shift(a, amt) { return a.map(function (v) { return clamp(v + amt); }); }
  function css(a, alpha) { return "rgba(" + a.join(",") + "," + (alpha == null ? 1 : alpha) + ")"; }

  /* The cratered asteroid, drawn the same way as the game's mine button. */
  D.drawAsteroid = function (canvas, accentHex, label) {
    var size = canvas.clientWidth || 220, dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = canvas.height = Math.round(size * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    var accent = rgb(accentHex), r = size / 2 * 0.92, cx = size / 2, cy = size / 2;
    var base = blend([107, 111, 120], accent, 0.25), dark = blend([58, 61, 69], accent, 0.2);
    var g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx - r * 0.3, cy - r * 0.3, r * 1.6);
    g.addColorStop(0, css(shift(base, 40))); g.addColorStop(0.5, css(base)); g.addColorStop(1, css(dark));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    [[0.30, 0.28, 0.09], [0.62, 0.20, 0.06], [0.22, 0.55, 0.11], [0.58, 0.60, 0.08], [0.75, 0.45, 0.07], [0.40, 0.78, 0.06]]
      .forEach(function (k) {
        var x = cx - r + k[0] * r * 2, y = cy - r + k[1] * r * 2, kr = k[2] * r * 2;
        ctx.fillStyle = css(shift(dark, -30)); ctx.beginPath(); ctx.arc(x, y, kr, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = css(shift(base, 60)); ctx.lineWidth = kr * 0.18; ctx.stroke();
      });
    ctx.strokeStyle = css(accent, 0.6); ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    if (label) {
      ctx.font = "700 " + Math.round(size * 0.082) + "px 'Space Grotesk', system-ui, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(5,6,15,.8)"; ctx.shadowBlur = 8;
      ctx.fillStyle = "#F1F2FA"; ctx.fillText(label, cx, cy);
      ctx.shadowBlur = 0;
    }
  };

  /* ---------- game rules ---------- */
  function Game() { this.handlers = {}; this.blank(); this.load(); this.ensureChallenges(); }
  var G = Game.prototype;

  G.blank = function () {
    this.ore = 0; this.opc = 1; this.ops = 0; this.lifetime = 0; this.cores = 0;
    this.sys = 0; this.highest = 0; this.rebirths = 0; this.clicks = 0; this.bought = 0;
    this.owned = {}; this.ach = []; this.challenges = []; this.nextId = 0;
    this.combo = 0; this.lastTap = 0; this.offline = null;
  };
  G.on = function (name, fn) { (this.handlers[name] = this.handlers[name] || []).push(fn); };
  G.emit = function (name, arg) { (this.handlers[name] || []).forEach(function (fn) { fn(arg); }); };

  var SAVED = ["ore", "opc", "ops", "lifetime", "cores", "sys", "highest", "clicks", "bought", "owned", "ach", "challenges", "nextId"];
  G.save = function () {
    var out = { lastClose: Date.now() }, self = this;
    SAVED.forEach(function (k) { out[k] = self[k]; });
    try { localStorage.setItem(KEY, JSON.stringify(out)); } catch (e) { /* private window: play without saving */ }
  };
  G.load = function () {
    var raw = null, self = this;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    if (!raw || typeof raw !== "object") return;
    SAVED.forEach(function (k) { if (raw[k] != null) self[k] = raw[k]; });
    this.sys = Math.max(0, Math.min(LAST, this.sys | 0));
    if (raw.lastClose && this.ops > 0) {
      var secs = Math.min(Math.floor((Date.now() - raw.lastClose) / 1000), this.offlineCap());
      if (secs > 0) {
        var earned = Math.floor(this.perSecond() * secs * this.offlineRate());
        this.add(earned);
        if (secs >= 60) this.offline = { earned: earned, secs: secs };
      }
    }
  };
  G.resetAll = function () {
    this.blank(); this.ensureChallenges(); this.save();
    this.emit("system"); this.emit("change");
  };

  G.system = function () { return D.systems[this.sys]; };
  G.upgrades = function () {
    var list = D.baseUpgrades.slice();
    for (var i = 1; i <= this.sys; i++) list.push(D.systems[i].upgrade);
    return list;
  };
  G.ownedOf = function (name) { return this.owned[name] || 0; };
  G.cost = function (u) { return Math.max(1, D.costAt(u, this.ownedOf(u.name))); };
  G.milestonePercent = function () { return Math.floor((this.sys + 1) / 2) * 10; };
  G.bonusPercent = function () {
    return this.cores * R.percentPerCore + this.milestonePercent() + this.rebirths * R.rebirthPercent + this.ach.length;
  };
  G.multiplier = function () { return 1 + this.bonusPercent() / 100; };
  G.comboMultiplier = function () { return 1 + this.combo * R.comboPerStack; };
  G.perTap = function () { return Math.max(1, Math.floor(this.opc * this.multiplier() * this.comboMultiplier())); };
  G.perSecond = function () { return Math.floor(this.ops * this.multiplier()); };
  G.offlineCap = function () { return Math.min(R.baseOfflineCap + this.ownedOf("Idle Collector") * 300, R.maxOfflineCap); };
  G.offlineRate = function () { return this.ownedOf("Idle Collector") >= 1 ? 1 : 0.5; };
  G.potentialCores = function () { return Math.floor(Math.sqrt(this.lifetime / R.warpCoreDivisor)); };
  G.add = function (n) { this.ore += n; this.lifetime += n; };

  G.tap = function () {
    var now = Date.now();
    this.combo = now - this.lastTap <= R.comboWindowMs ? Math.min(this.combo + 1, R.comboMaxStacks) : 0;
    this.lastTap = now;
    var gained = this.perTap();
    this.add(gained); this.clicks++;
    this.checkAchievements(); this.emit("change");
    return gained;
  };
  G.buy = function (u) {
    var cost = this.cost(u);
    if (this.ore < cost) return false;
    this.ore -= cost; this.owned[u.name] = this.ownedOf(u.name) + 1; this.bought++;
    if (u.type === "click") this.opc += u.effect;
    if (u.type === "passive") this.ops += u.effect;
    this.checkAchievements(); this.emit("change");
    return true;
  };
  /* Pays out whole seconds since the last tick, so a background tab still earns. */
  G.tick = function () {
    var now = Date.now(), secs = Math.max(1, Math.floor((now - (this.lastTick || now - 1000)) / 1000));
    this.lastTick = (this.lastTick || now - 1000) + secs * 1000;
    if (this.ops > 0) this.add(this.perSecond() * secs);
    this.refreshChallenges(); this.checkAchievements(); this.emit("change");
  };
  G.canLaunch = function () { return this.ore >= this.system().threshold; };
  G.atDemoEnd = function () { return this.sys >= LAST; };
  G.launch = function () {
    if (!this.canLaunch() || this.atDemoEnd()) return false;
    this.cores = Math.max(this.potentialCores(), this.cores);
    this.sys++; this.highest = Math.max(this.highest, this.sys);
    this.ore = 0; this.opc = 1; this.ops = 0; this.owned = {};
    this.checkAchievements(); this.save();
    this.emit("system"); this.emit("change");
    return true;
  };
  G.checkAchievements = function () {
    var self = this;
    D.achievements.forEach(function (a) {
      if (self.ach.indexOf(a.id) < 0 && a.test(self)) { self.ach.push(a.id); self.emit("achievement", a); }
    });
  };

  /* Timed challenges: three slots, three minutes each. */
  var TYPES = ["earn", "tap", "buy"];
  G.valueFor = function (type) { return type === "earn" ? this.lifetime : type === "tap" ? this.clicks : this.bought; };
  G.makeChallenge = function (type) {
    var target, desc;
    if (type === "earn") {
      var variance = (80 + Math.floor(Math.random() * 71)) / 100;
      target = Math.floor(Math.max(this.perSecond() * 90, this.perTap() * 40, 50) * variance);
      desc = "Earn " + fmt(target) + " ore";
    } else if (type === "tap") {
      target = 30 + Math.floor(Math.random() * 31); desc = "Tap MINE " + target + " times";
    } else {
      target = 1 + Math.floor(Math.random() * 3); desc = "Buy " + target + " upgrade(s)";
    }
    return { id: ++this.nextId, type: type, desc: desc, start: this.valueFor(type), target: target,
             reward: Math.max(Math.floor(this.system().threshold / 20), 50), expires: Date.now() + R.challengeMs };
  };
  G.otherType = function (not) {
    var opts = TYPES.filter(function (t) { return t !== not; });
    return opts[Math.floor(Math.random() * opts.length)];
  };
  G.ensureChallenges = function () {
    if (!Array.isArray(this.challenges) || this.challenges.length !== 3) {
      this.challenges = [this.makeChallenge("earn"), this.makeChallenge("tap"), this.makeChallenge("buy")];
    }
  };
  G.progress = function (c) { return Math.min(this.valueFor(c.type) - c.start, c.target); };
  G.refreshChallenges = function () {
    for (var i = 0; i < this.challenges.length; i++) {
      var c = this.challenges[i];
      if (Date.now() > c.expires && this.progress(c) < c.target) this.challenges[i] = this.makeChallenge(this.otherType(c.type));
    }
  };
  G.claim = function (id) {
    for (var i = 0; i < this.challenges.length; i++) {
      var c = this.challenges[i];
      if (c.id === id && this.progress(c) >= c.target) {
        this.add(c.reward);
        this.challenges[i] = this.makeChallenge(this.otherType(c.type));
        this.save(); this.emit("change");
        return c.reward;
      }
    }
    return 0;
  };
  G.claimable = function () {
    var self = this;
    return this.challenges.filter(function (c) { return self.progress(c) >= c.target; }).length;
  };

  /* ---------- helpers for the screen ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function duration(total) {
    var m = Math.floor(total / 60), h = Math.floor(m / 60); m = m % 60;
    return h > 0 && m > 0 ? h + "hr " + m + "min" : h > 0 ? h + "hr" : m + "min";
  }
  function countdown(ms) {
    var s = Math.max(0, Math.floor(ms / 1000)), sec = s % 60;
    return Math.floor(s / 60) + ":" + (sec < 10 ? "0" : "") + sec;
  }
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the phone screen ---------- */
  D.mount = function (host, game) {
    host.innerHTML = "";
    var screen = el("div", "g-screen");
    var sysName = el("p", "g-system");
    var oreText = el("p", "g-ore"); oreText.setAttribute("aria-live", "off");
    var rateText = el("p", "g-rate");
    var combo = el("p", "g-combo"); combo.setAttribute("aria-hidden", "true");
    var mine = el("button", "g-mine"); mine.type = "button"; mine.setAttribute("aria-label", "Mine ore");
    var canvas = el("canvas"); canvas.setAttribute("aria-hidden", "true"); mine.appendChild(canvas);
    var hint = el("p", "g-hint", "Tap the asteroid to mine ore");
    var cores = el("p", "g-cores");
    var launch = el("button", "g-launch"); launch.type = "button";
    var row = el("div", "g-row");
    var achBtn = el("button", "g-chip", "Achievements"); achBtn.type = "button";
    var chBtn = el("button", "g-chip", "Challenges"); chBtn.type = "button";
    var chBadge = el("span", "g-badge"); chBtn.appendChild(chBadge);
    row.appendChild(achBtn); row.appendChild(chBtn);
    var upHead = el("p", "g-uphead", "Upgrades");
    var upBadge = el("span", "g-badge g-badge-green"); upHead.appendChild(upBadge);
    var upList = el("div", "g-upgrades");
    var top = el("div", "g-topzone");
    [sysName, oreText, rateText, combo, mine, hint, cores, launch, row].forEach(function (n) { top.appendChild(n); });
    var toast = el("p", "g-toast"); toast.setAttribute("role", "status");
    screen.appendChild(top); screen.appendChild(upHead); screen.appendChild(upList); screen.appendChild(toast);
    host.appendChild(screen);

    var rows = [], rowKey = "", comboTimer = null, toastTimer = null, openDialog = null;

    function say(text) {
      toast.textContent = text; toast.classList.add("is-on");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
    }

    function buildRows() {
      upList.innerHTML = ""; rows = [];
      game.upgrades().forEach(function (u) {
        var r = el("div", "g-up"), info = el("div", "g-upinfo");
        var name = el("strong"), detail = el("span");
        info.appendChild(name); info.appendChild(detail);
        var buy = el("button", "g-buy", "Buy"); buy.type = "button";
        buy.addEventListener("click", function () { if (game.buy(u)) say(u.name + " bought"); });
        r.appendChild(info); r.appendChild(buy); upList.appendChild(r);
        rows.push({ u: u, name: name, detail: detail, buy: buy });
      });
    }

    function render() {
      var key = game.sys + ":" + game.upgrades().length;
      if (key !== rowKey) { rowKey = key; buildRows(); }
      var s = game.system(), ready = game.canLaunch();
      sysName.textContent = "SYSTEM " + (game.sys + 1) + ": " + s.name.toUpperCase();
      oreText.textContent = fmt(game.ore) + " ORE";
      rateText.textContent = fmt(game.perSecond()) + " ore/sec";
      cores.textContent = game.cores + " Warp Cores  •  +" + game.bonusPercent() + "% production";
      hint.classList.toggle("is-off", game.clicks > 0);
      launch.disabled = !ready;
      launch.textContent = !ready ? "REACH " + fmt(s.threshold) + " ORE"
        : game.atDemoEnd() ? "CONTINUE IN THE FULL GAME"
        : "LAUNCH TO " + D.systems[game.sys + 1].name.toUpperCase();
      var affordable = 0;
      rows.forEach(function (r) {
        var cost = game.cost(r.u), can = game.ore >= cost;
        if (can) affordable++;
        r.name.textContent = r.u.name + "  (" + game.ownedOf(r.u.name) + ")";
        r.detail.textContent = (r.u.type === "click" ? "+" + r.u.effect + "/click"
          : r.u.type === "passive" ? "+" + r.u.effect + "/sec"
          : "Offline: " + duration(game.offlineCap()) + " @ " + Math.round(game.offlineRate() * 100) + "% rate")
          + " — Cost: " + fmt(cost) + " ore";
        r.buy.disabled = !can;
        r.buy.setAttribute("aria-label", "Buy " + r.u.name + " for " + fmt(cost) + " ore");
      });
      upBadge.textContent = affordable || ""; upBadge.hidden = !affordable;
      var n = game.claimable(); chBadge.textContent = n || ""; chBadge.hidden = !n;
      if (openDialog && openDialog.refresh) openDialog.refresh();
    }

    function theme() {
      D.applyTheme(host, game.sys);
      D.drawAsteroid(canvas, game.system().accent, "MINE");
      window.dispatchEvent(new CustomEvent("oreminer:system", { detail: { index: game.sys } }));
    }

    mine.addEventListener("click", function (e) {
      var gained = game.tap();
      if (game.combo >= 2) {
        combo.textContent = "🔥 COMBO x" + game.comboMultiplier().toFixed(1);
        combo.classList.add("is-on");
        clearTimeout(comboTimer);
        comboTimer = setTimeout(function () { combo.classList.remove("is-on"); }, 600);
      }
      if (reduceMotion) return;
      var box = screen.getBoundingClientRect(), mb = mine.getBoundingClientRect();
      var x = e.clientX ? e.clientX - box.left : mb.left - box.left + mb.width / 2;
      var y = e.clientY ? e.clientY - box.top : mb.top - box.top + mb.height / 3;
      var p = el("span", "g-particle", "+" + fmt(gained));
      p.style.left = x + "px"; p.style.top = y + "px";
      p.style.setProperty("--drift", Math.round(Math.random() * 80 - 40) + "px");
      p.addEventListener("animationend", function () { p.remove(); });
      screen.appendChild(p);
    });

    /* Dialogs live inside the phone, like in the game. */
    function dialog(title, body, buttons, refresh) {
      closeDialog();
      var wrap = el("div", "g-dialog"), card = el("div", "g-card");
      card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-label", title);
      card.appendChild(el("h3", null, title)); card.appendChild(body);
      var foot = el("div", "g-cardfoot"), first = null;
      buttons.forEach(function (b) {
        var btn = b.href ? el("a", "g-dbtn" + (b.quiet ? " is-quiet" : ""), b.label) : el("button", "g-dbtn" + (b.quiet ? " is-quiet" : ""), b.label);
        if (b.href) { btn.href = b.href; if (/^https?:/.test(b.href)) { btn.target = "_blank"; btn.rel = "noopener"; } }
        else { btn.type = "button"; btn.addEventListener("click", function () { closeDialog(); if (b.run) b.run(); }); }
        foot.appendChild(btn); if (!first) first = btn;
      });
      card.appendChild(foot); wrap.appendChild(card); screen.appendChild(wrap);
      wrap.addEventListener("click", function (e) { if (e.target === wrap) closeDialog(); });
      wrap.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDialog(); });
      openDialog = { node: wrap, refresh: refresh, opener: document.activeElement };
      if (first) first.focus({ preventScroll: true });
    }
    function closeDialog() {
      if (!openDialog) return;
      openDialog.node.remove();
      var opener = openDialog.opener; openDialog = null;
      if (opener && opener.focus && host.contains(opener)) opener.focus({ preventScroll: true });
    }

    launch.addEventListener("click", function () {
      if (!game.canLaunch()) return;
      var body = el("div", "g-text");
      if (game.atDemoEnd()) {
        body.appendChild(el("p", null, "You've flown the demo as far as it goes. The full game has " + (D.systems.length - LAST - 1) +
          " more star systems, rebirths, a skill tree, daily rewards and the asteroid shooter mini-game."));
        var live = C.playStoreLive && C.playStoreUrl;
        dialog("END OF THE DEMO", body, [
          live ? { label: "Get it on Google Play", href: C.playStoreUrl } : { label: "Read the game guide", href: "guide.html" },
          { label: "Keep mining here", quiet: true }
        ]);
        return;
      }
      var next = D.systems[game.sys + 1];
      body.appendChild(el("p", null, "You'll reset your ore and upgrades, but unlock " + next.upgrade.name + "."));
      body.appendChild(el("p", null, "Warp Cores: " + game.cores + " → " + Math.max(game.potentialCores(), game.cores)));
      dialog("LAUNCH TO " + next.name.toUpperCase() + "?", body, [
        { label: "Launch", run: function () { game.launch(); say("Warped to " + next.name); } },
        { label: "Cancel", quiet: true }
      ]);
    });

    achBtn.addEventListener("click", function () {
      var list = el("div", "g-list");
      D.achievements.forEach(function (a) {
        var done = game.ach.indexOf(a.id) >= 0, r = el("div", "g-item" + (done ? " is-done" : ""));
        r.appendChild(el("strong", null, (done ? "✓ " : "") + a.name));
        r.appendChild(el("span", null, a.desc + (a.minSystem > LAST ? " (full game)" : "")));
        list.appendChild(r);
      });
      list.appendChild(el("p", "g-note", "Each achievement adds +1% production."));
      dialog("ACHIEVEMENTS", list, [{ label: "Close" }]);
    });

    chBtn.addEventListener("click", function () {
      var list = el("div", "g-list");
      var built = "", parts = [];
      function build() {
        list.innerHTML = ""; parts = [];
        game.challenges.forEach(function (c) {
          var r = el("div", "g-item g-item-row"), info = el("div");
          var status = el("span"), claim = el("button", "g-buy", "Claim");
          info.appendChild(el("strong", null, c.desc));
          info.appendChild(status);
          info.appendChild(el("span", null, "Reward: " + fmt(c.reward) + " ore"));
          claim.type = "button";
          claim.addEventListener("click", function () {
            var got = game.claim(c.id); if (got) say("+" + fmt(got) + " ore");
          });
          r.appendChild(info); r.appendChild(claim); list.appendChild(r);
          parts.push({ c: c, status: status, claim: claim });
        });
      }
      /* Rows are only rebuilt when a challenge is swapped, so a Claim press is never lost. */
      function update() {
        var ids = game.challenges.map(function (c) { return c.id; }).join();
        if (ids !== built) { built = ids; build(); }
        parts.forEach(function (p) {
          var done = game.progress(p.c) >= p.c.target;
          p.status.textContent = fmt(game.progress(p.c)) + " / " + fmt(p.c.target) + " \u2014 " +
            (done ? "ready to claim" : countdown(p.c.expires - Date.now()) + " left");
          p.claim.disabled = !done;
        });
      }
      update();
      dialog("CHALLENGES", list, [{ label: "Close" }], update);
    });

    game.on("change", render);
    game.on("system", function () { rowKey = ""; theme(); });
    game.on("achievement", function (a) { say("★ " + a.name); });

    theme(); render();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { D.drawAsteroid(canvas, game.system().accent, "MINE"); });
    window.addEventListener("resize", function () { D.drawAsteroid(canvas, game.system().accent, "MINE"); });

    if (game.offline) {
      var body = el("div", "g-text");
      body.appendChild(el("p", null, "Your drones kept mining while you were away."));
      body.appendChild(el("p", null, "Earned " + fmt(game.offline.earned) + " ore over " + duration(game.offline.secs) + "."));
      if (game.offlineRate() < 1) body.appendChild(el("p", null, "Running at 50% rate — grab an Idle Collector for full speed."));
      game.offline = null;
      dialog("WELCOME BACK", body, [{ label: "Collect" }]);
    }
    return { say: say };
  };

  /* One shared game per page: starts ticking and saving straight away. */
  D.startGame = function () {
    if (D.game) return D.game;
    var game = D.game = new Game();
    setInterval(function () { game.tick(); }, 1000);
    setInterval(function () { game.save(); }, 5000);
    window.addEventListener("pagehide", function () { game.save(); });
    document.addEventListener("visibilitychange", function () { if (document.hidden) game.save(); });
    return game;
  };
  D.demoLastIndex = LAST;
})();
