import GameCards from "./components/game-cards.js";
import GameCard from "./components/game-card.js";
import Api from "./services/api.js";
import Store from "./services/store.js";

customElements.define("game-cards", GameCards);
customElements.define("game-card", GameCard);

Notification.requestPermission().then((result) => {
  if (result === "granted") {
    const notifTitle = "Games found notification.";
    const options = {
      body: "We will show you here when we have interesting games to watch",
      icon: "./assets/logo.png",
    };
    new Notification(notifTitle, options);
  }
});

Api.getGames()
  .then((games) => {
    Store.games = games;
  })
  .catch(() => {
    alert("Failed to fetch games.");
  });
