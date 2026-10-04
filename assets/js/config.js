/* Ore Miner website settings.
   This is the only file you need to edit to switch things on. */
window.OREMINER_CONFIG = {
  // Google Play listing. Set playStoreLive to true once the game is public,
  // and every "Get it on Google Play" button on the site will start linking here.
  playStoreUrl: "https://play.google.com/store/apps/details?id=com.space.oreminer",
  playStoreLive: false,

  // Paste your Discord invite link here (for example "https://discord.gg/abc123").
  // While this is empty the Discord button shows "Discord coming soon".
  discordUrl: "",

  // Where suggestions and news sign-ups are sent. Use ONE of these two options:
  //  1. contactEmail: visitors' own email app opens with the message filled in.
  //  2. feedbackEndpoint / newsEndpoint: a form service address (for example a
  //     Formspree form URL), so messages are sent without leaving the site.
  contactEmail: "",
  feedbackEndpoint: "https://formspree.io/f/xjykndpj",
  newsEndpoint: "https://formspree.io/f/xjykndpj",

  // The web demo stops at this star system (3 = Vega Expanse) and points
  // players to the full game. Use 10 to make the whole route playable.
  demoLastSystem: 3
};
