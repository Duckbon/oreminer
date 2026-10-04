/* Game guide: fills the tables from the shared game data, and runs the
   search, the section list and the two calculators. */
(function () {
  var D = window.OREMINER, fmt = D.format;
  function $(s) { return document.querySelector(s); }
  function commas(n) { return Number(n).toLocaleString("en-AU"); }
  function row(table, cells) {
    var tr = document.createElement("tr");
    cells.forEach(function (c) {
      var td = document.createElement("td");
      if (c && c.num) { td.className = "num"; td.textContent = c.text; }
      else if (c && c.dot) { var i = document.createElement("span"); i.className = "dot"; i.style.background = c.dot; td.appendChild(i); td.appendChild(document.createTextNode(c.text)); }
      else td.textContent = c;
      tr.appendChild(td);
    });
    $(table + " tbody").appendChild(tr);
  }
  function gives(u) {
    return u.type === "click" ? "+" + commas(u.effect) + " ore per tap" : u.type === "passive" ? "+" + commas(u.effect) + " ore per second" : "+5 minutes of offline mining";
  }

  D.allUpgrades().forEach(function (u) {
    row("#upgrade-table", [u.name, gives(u), { num: true, text: commas(u.baseCost) }, D.systems[u.system].name]);
    var o = document.createElement("option"); o.textContent = u.name; $("#cost-upgrade").appendChild(o);
  });
  D.systems.forEach(function (s, i) {
    row("#system-table", [{ dot: s.accent, text: (i + 1) + ". " + s.name }, { num: true, text: commas(s.threshold) },
      s.upgrade ? s.upgrade.name : "Starter upgrades", { num: true, text: "+" + Math.floor((i + 1) / 2) * 10 + "%" }]);
    row("#challenge-table", [{ dot: s.accent, text: s.name }, { num: true, text: commas(Math.max(Math.floor(s.threshold / 20), 50)) + " ore" }]);
  });
  D.skillPerks.forEach(function (p) { row("#skill-table", [p.name, p.per, p.max]); });
  D.dailyRewards.forEach(function (r, i) { row("#daily-table", ["Day " + (i + 1), { num: true, text: commas(r) }]); });
  D.achievements.forEach(function (a) { row("#achievement-table", [a.name, a.desc]); });
  D.shop.forEach(function (s) { row("#shop-table", [s.name, s.desc]); });

  /* Upgrade cost calculator */
  var sel = $("#cost-upgrade"), owned = $("#cost-owned"), costOut = $("#cost-out");
  function cost() {
    var u = D.allUpgrades()[sel.selectedIndex], n = Math.max(0, Math.min(400, Math.floor(Number(owned.value) || 0)));
    var next = D.costAt(u, n), ten = 0;
    for (var i = 0; i < 10; i++) ten += D.costAt(u, n + i);
    costOut.innerHTML = "";
    costOut.textContent = "Next " + u.name + ": " + fmt(next) + " ore";
    var s = document.createElement("small");
    s.textContent = "The next ten cost " + fmt(ten) + " ore in total. Exact next price: " + commas(next) + ".";
    costOut.appendChild(s);
  }
  sel.addEventListener("change", cost); owned.addEventListener("input", cost); cost();

  /* Warp Core calculator: accepts plain numbers or the game's suffixes. */
  var coreIn = $("#core-in"), coreOut = $("#core-out");
  var UNIT = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18 };
  function parse(text) {
    var m = /^\s*([\d,]*\.?\d+)\s*(k|m|b|t|qa|qi)?\s*$/i.exec(text);
    if (!m) return NaN;
    return parseFloat(m[1].replace(/,/g, "")) * (m[2] ? UNIT[m[2].toLowerCase()] : 1);
  }
  function core() {
    var v = parse(coreIn.value);
    coreOut.innerHTML = "";
    var s = document.createElement("small");
    if (isNaN(v)) {
      coreOut.textContent = "Enter a number";
      s.textContent = "Use digits, with k, M, B, T, Qa or Qi if you like. For example 4M.";
    } else {
      var n = Math.floor(Math.sqrt(v / D.rules.warpCoreDivisor));
      coreOut.textContent = commas(n) + (n === 1 ? " Warp Core" : " Warp Cores") + ", +" + commas(n * D.rules.percentPerCore) + "% production";
      s.textContent = "The next core arrives at " + commas((n + 1) * (n + 1) * D.rules.warpCoreDivisor) + " lifetime ore.";
    }
    coreOut.appendChild(s);
  }
  coreIn.addEventListener("input", core); core();

  /* Section list, search and "you are here" */
  var sections = Array.prototype.slice.call(document.querySelectorAll(".doc section"));
  var list = $(".toc ol"), empty = $(".toc-empty"), search = $("#guide-search"), links = {};
  sections.forEach(function (sec) {
    var li = document.createElement("li"), a = document.createElement("a");
    a.href = "#" + sec.id; a.textContent = sec.querySelector("h2").textContent;
    li.appendChild(a); list.appendChild(li); links[sec.id] = a;
  });
  search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase(), shown = 0;
    sections.forEach(function (sec) {
      var hit = !q || sec.textContent.toLowerCase().indexOf(q) >= 0;
      sec.hidden = !hit; links[sec.id].parentNode.hidden = !hit;
      if (hit) shown++;
    });
    empty.hidden = shown > 0;
    empty.textContent = shown ? "" : "Nothing in the guide mentions “" + search.value.trim() + "”. Try a shorter word.";
  });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove("is-here"); });
          links[en.target.id].classList.add("is-here");
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach(function (s) { io.observe(s); });
  }
})();
