const cardFactory = (game) => {
  return `
    <article class="information [ card ]">
        <h2 class="title">${game.title}</h2>
        <p class="info">Played at ${game.venue.name} in ${game.venue.city} (${game.vanue.state})</p>
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
