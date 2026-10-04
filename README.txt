ORE MINER WEBSITE
=================

Open index.html in a browser to see the site. Nothing needs installing.

Pages
  index.html   Home page with the playable phone, the star-system route and the community section
  play.html    Full-size web demo
  guide.html   Game guide with search and calculators

Things to switch on (all in assets/js/config.js)
  playStoreLive    Set to true once the game is public on Google Play. Every store button then links to it.
  discordUrl       Paste your Discord invite link.
  contactEmail     Simplest way to receive suggestions and news sign-ups (opens the visitor's email app).
  feedbackEndpoint / newsEndpoint
                   Use these instead if you set up a form service, so messages send without leaving the site.
  demoLastSystem   Where the web demo stops (3 = Vega Expanse).

Screenshots
  Save real screenshots as assets/img/screenshot-1.png up to screenshot-6.png.
  The Screenshots section on the home page appears by itself once at least one exists.

Game numbers
  assets/js/data.js holds the upgrade, star-system, achievement and reward values copied from the
  Android game. If you rebalance the game, change them here and the guide and demo both update.

Putting it online
  Upload this whole folder to any static host (GitHub Pages, Netlify, Cloudflare Pages). No server code is needed.
