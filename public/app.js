import GameCards from "./components/game-cards.js";
import GameCard from "./components/game-card.js";
import Api from "./services/api.js";
import Store from "./services/store.js";
import "./register-sw.js";

customElements.define("game-cards", GameCards);
customElements.define("game-card", GameCard);

Api.getGames()
  .then((games) => {
    Store.games = games;
  })
  .catch(() => {
    alert("Failed to fetch games.");
  });
