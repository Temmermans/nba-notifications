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
    return `
      <article class="information [ card ]">
          <h2 class="title">${game.title}</h2>
          <p class="info">Played at ${game.venue.name} in ${game.venue.city} (${game.venue.state})</p>
          <dl class="details">
          <div>
              <dt>${game.awayTeam.name} (${game.awayTeam.abbr})</dt>
              <dd><img src="${game.awayTeam.logo}"/></dd>
          </div>
          <div>
              <dt>${game.homeTeam.name} (${game.homeTeam.abbr})</dt>
              <dd><img src="${game.homeTeam.logo}"/></dd>
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
