/* Ore Miner game data. Mirrors the values in the Android game (MainActivity.kt)
   so the guide and the web demo always show the same numbers. */
(function () {
  var baseUpgrades = [
    { name: "Better Drill",   baseCost: 10,  mult: 1.15, type: "click",   effect: 1,   system: 0 },
    { name: "Mining Drone",   baseCost: 25,  mult: 1.15, type: "passive", effect: 1,   system: 0 },
    { name: "Refinery",       baseCost: 100, mult: 1.15, type: "passive", effect: 5,   system: 0 },
    { name: "Idle Collector", baseCost: 200, mult: 1.3,  type: "idle",    effect: 300, system: 0 }
  ];

  var systems = [
    { name: "Sol Belt",         threshold: 50000,       accent: "#F2A83C", glow: "#4FD8E0", upgrade: null },
    { name: "Kepler Reach",     threshold: 200000,      accent: "#7EC8E3", glow: "#C6F1FF", upgrade: { name: "Cryo Extractor",        baseCost: 3000,       mult: 1.15, type: "passive", effect: 15 } },
    { name: "Vega Expanse",     threshold: 1000000,     accent: "#B18CFF", glow: "#6C4AB6", upgrade: { name: "Quantum Drill",         baseCost: 15000,      mult: 1.15, type: "click",   effect: 10 } },
    { name: "Nova Drift",       threshold: 5000000,     accent: "#FF6F59", glow: "#FFB37E", upgrade: { name: "Fusion Reactor",        baseCost: 75000,      mult: 1.15, type: "passive", effect: 100 } },
    { name: "Andromeda Rift",   threshold: 25000000,    accent: "#6EE7B7", glow: "#34D399", upgrade: { name: "Graviton Drill",        baseCost: 400000,     mult: 1.15, type: "click",   effect: 50 } },
    { name: "Nebula's Edge",    threshold: 125000000,   accent: "#FF6EC7", glow: "#C86DD7", upgrade: { name: "Singularity Core",      baseCost: 2000000,    mult: 1.15, type: "passive", effect: 750 } },
    { name: "Titan's Reach",    threshold: 625000000,   accent: "#FFD93D", glow: "#FFF3B0", upgrade: { name: "Plasma Drill",          baseCost: 10000000,   mult: 1.15, type: "click",   effect: 250 } },
    { name: "Orion Deep",       threshold: 3000000000,  accent: "#5B5F97", glow: "#9A9FC7", upgrade: { name: "Dark Matter Collector", baseCost: 50000000,   mult: 1.15, type: "passive", effect: 5000 } },
    { name: "Cosmic Frontier",  threshold: 15000000000, accent: "#FF3860", glow: "#FF8FA3", upgrade: { name: "Void Drill",            baseCost: 250000000,  mult: 1.15, type: "click",   effect: 1500 } },
    { name: "The Omega System", threshold: 75000000000, accent: "#FFFFFF", glow: "#F2A83C", upgrade: { name: "Star Forge",            baseCost: 1200000000, mult: 1.15, type: "passive", effect: 40000 } }
  ];
  systems.forEach(function (s, i) { if (s.upgrade) s.upgrade.system = i; });

  var achievements = [
    { id: "first_steps",   name: "First Steps",   desc: "Mine your first ore",           test: function (g) { return g.lifetime >= 1; } },
    { id: "thousandaire",  name: "Thousandaire",  desc: "Earn 1,000 lifetime ore",       test: function (g) { return g.lifetime >= 1000; } },
    { id: "driller",       name: "Driller",       desc: "Own 10 Better Drills",          test: function (g) { return g.ownedOf("Better Drill") >= 10; } },
    { id: "automation",    name: "Automation",    desc: "Own 5 Mining Drones",           test: function (g) { return g.ownedOf("Mining Drone") >= 5; } },
    { id: "refined",       name: "Refined",       desc: "Own 5 Refineries",              test: function (g) { return g.ownedOf("Refinery") >= 5; } },
    { id: "idle_master",   name: "Idle Master",   desc: "Buy an Idle Collector",         test: function (g) { return g.ownedOf("Idle Collector") >= 1; } },
    { id: "first_launch",  name: "First Launch",  desc: "Reach Kepler Reach",            test: function (g) { return g.highest >= 1; } },
    { id: "deep_space",    name: "Deep Space",    desc: "Reach Andromeda Rift",          test: function (g) { return g.highest >= 4; }, minSystem: 4 },
    { id: "system_master", name: "System Master", desc: "Reach The Omega System",        test: function (g) { return g.highest >= 9; }, minSystem: 9 },
    { id: "reborn",        name: "Reborn",        desc: "Complete your first Rebirth",   test: function (g) { return g.rebirths >= 1; }, minSystem: 10 }
  ];

  var skillPerks = [
    { name: "Golden Touch",     per: "+4% ore per tap",          max: "+20% ore per tap" },
    { name: "Auto Collector",   per: "+4% ore per second",       max: "+20% ore per second" },
    { name: "Efficient Drones", per: "+10% offline efficiency",  max: "+50% offline efficiency" },
    { name: "Deep Pockets",     per: "+2 hours offline cap",     max: "+10 hours offline cap" },
    { name: "Bargain Hunter",   per: "-3% upgrade cost",         max: "-15% upgrade cost" }
  ];

  var shop = [
    { name: "Remove Ads",       desc: "Removes all banner and full-screen ads permanently. Optional reward ads stay available." },
    { name: "Small Ore Pack",   desc: "Instantly gain 50k ore." },
    { name: "Medium Ore Pack",  desc: "Instantly gain 500k ore." },
    { name: "Large Ore Pack",   desc: "Instantly gain 5M ore." },
    { name: "Skip Requirement", desc: "Instantly launch or rebirth, regardless of how much ore you have." }
  ];

  window.OREMINER = {
    baseUpgrades: baseUpgrades,
    systems: systems,
    achievements: achievements,
    skillPerks: skillPerks,
    shop: shop,
    dailyRewards: [100, 250, 500, 1000, 2500, 5000, 15000],
    rules: {
      warpCoreDivisor: 1000000, percentPerCore: 2, rebirthPercent: 10,
      comboWindowMs: 900, comboMaxStacks: 10, comboPerStack: 0.10,
      baseOfflineCap: 300, maxOfflineCap: 86400,
      challengeMs: 180000, skillMaxLevel: 5
    },
    allUpgrades: function () {
      return baseUpgrades.concat(systems.filter(function (s) { return s.upgrade; }).map(function (s) { return s.upgrade; }));
    },
    /* Same number format as the game: full digits under 100,000, then k, M, B, T, Qa, Qi. */
    format: function (value) {
      value = Math.floor(value);
      if (value < 100000) return String(value);
      var units = ["", "k", "M", "B", "T", "Qa", "Qi"], n = value, i = 0;
      while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
      return (n === Math.floor(n) ? String(n) : n.toFixed(1)) + units[i];
    },
    costAt: function (upgrade, owned) {
      return Math.floor(upgrade.baseCost * Math.pow(upgrade.mult, owned));
    }
  };
})();
