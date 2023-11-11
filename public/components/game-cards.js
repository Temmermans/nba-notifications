export default class GameCards extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const loadCSS = async () => {
      const request = await fetch("./components/game-cards.css");
      const styles = document.createElement("style");
      styles.textContent = await request.text();
      this.root.appendChild(styles);
    };
    loadCSS();
    this.root.innerHTML = `<div class="loader"><i class="gg-spinner-alt"></i></div>`;
  }

  connectedCallback() {
    window.addEventListener("gameschanged", (e) => {
      this.render(e.detail.games);
    });
  }

  render(games) {
    if (games.length === 0) {
      this.root.innerHTML = "<p>No games of interest! 🏀</p>";
    } else {
      this.root.innerHTML = "";
      games.forEach((game) => {
        const gameCard = document.createElement("game-card");
        gameCard.dataset.game = JSON.stringify(game);
        this.root.appendChild(gameCard);
      });
    }
  }
}
