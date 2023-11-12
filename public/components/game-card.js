export default class GameCard extends HTMLElement {
  constructor() {
    super();
    this.root = this.attachShadow({ mode: "open" });
    const loadCSS = async () => {
      const request = await fetch("./components/game-card.css");
      const styles = document.createElement("style");
      styles.textContent = await request.text();
      this.root.appendChild(styles);
    };
    loadCSS();
  }

  connectedCallback() {
    window.addEventListener("appmenuchange", () => {
      this.render();
    });
    this.render();
  }

  #template = (game) => {
    const overtime = game.score.awayPeriods.length > 4;
    return `
      <article class="information [ card ] ${game.difference <= 4 || overtime ? "close" : ""}">
          <h2 class="title">${game.title}</h2>
          <p class="info">Played at ${game.venue.name} in ${game.venue.city} (${game.venue.state})</p>
          Some <span style="color: aqua;">notes</span>:
          <ol>
          ${game.notes.map((note) => `<li>${note}</li>`).join("")}
          </ol>
          <dl class="details">
          <div>
              <dt>${game.awayTeam.name} (${game.awayTeam.abbr})</dt>
              <dd><img src="assets/logos/${game.awayTeam.abbr}.png"/></dd>
          </div>
          <div>
              <dt>${game.homeTeam.name} (${game.homeTeam.abbr})</dt>
              <dd><img src="assets/logos/${game.homeTeam.abbr}.png"/></dd>
          </div>
          </dl>
      </article>
      `;
  };

  render() {
    const game = JSON.parse(this.dataset.game);
    this.root.innerHTML = this.#template(game);
  }
}
