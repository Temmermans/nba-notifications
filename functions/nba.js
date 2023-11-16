const axios = require("axios");
const { formatDate, getPreviousDay } = require("./utils");

class NbaApi {
  #cache;
  #logger;

  constructor(cache, logger) {
    this.#cache = cache;
    this.#logger = logger;
  }

  #formatGames(games) {
    return games
      .sort((a, b) => {
        const awayScoreA = a.scoreboard.score.away;
        const homeScoreA = a.scoreboard.score.home;
        const differenceA = Math.abs(awayScoreA - homeScoreA);
        const awayScoreB = b.scoreboard.score.away;
        const homeScoreB = b.scoreboard.score.home;
        const differenceB = Math.abs(awayScoreB - homeScoreB);

        if (a.scoreboard.currentPeriod > 4 || b.scoreboard.currentPeriod > 4) {
          return -1;
        }

        return differenceA - differenceB;
      })
      .map((game) => ({
        title: game.summary,
        notes: game.notes,
        difference: game.difference,
        awayTeam: { name: game.teams.away.team, abbr: game.teams.away.abbreviation },
        homeTeam: { name: game.teams.home.team, abbr: game.teams.home.abbreviation },
        score: game.scoreboard.score,
        venue: {
          name: game.venue.name,
          city: game.venue.city,
          state: game.venue.state,
        },
      }));
  }

  #analyzeGames(games) {
    games.forEach((game) => {
      const awayScore = game.scoreboard.score.away;
      const homeScore = game.scoreboard.score.home;
      const awayPeriods = game.scoreboard.score.awayPeriods;
      const homePeriods = game.scoreboard.score.homePeriods;
      const difference = Math.abs(awayScore - homeScore);

      game.notes = [];
      game.difference = difference;

      if (game.difference <= 8) {
        game.notes.push("Close game.");
      }

      let closePeriods = 0;
      for (let i = 0; i < awayPeriods.length; i++) {
        if (Math.abs(awayPeriods[i] - homePeriods[i]) <= 5) {
          closePeriods++;
        }
      }
      game.notes.push(`${closePeriods} close periods.`);

      if (Math.abs(awayPeriods[0] - homePeriods[0]) > 8) {
        game.notes.push("A team had a great 1st quarter.");
      }

      if (Math.abs(awayPeriods[3] - homePeriods[3]) > 8) {
        game.notes.push("A team had a great 4th quarter.");
      }
    });
    return games;
  }

  getGames(date) {
    this.#logger.info({ msg: date });
    const yesterday = formatDate(getPreviousDay());

    const options = {
      method: "GET",
      url: "https://sportspage-feeds.p.rapidapi.com/games",
      params: {
        status: "final",
        league: "NBA",
        date: date || yesterday,
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API_KEY,
        "X-RapidAPI-Host": "sportspage-feeds.p.rapidapi.com",
      },
    };

    if (this.#cache.get(yesterday)) {
      this.#logger.info({ msg: "Cache hit", date: yesterday });
      return Promise.resolve(this.#cache.get(yesterday));
    } else {
      this.#logger.info({ msg: "Cache miss", date: yesterday });
      return axios.request(options).then((response) => {
        const games = this.#formatGames(this.#analyzeGames(response.data.results));
        this.#cache.set(yesterday, games, 60 * 60 * 12);
        return games;
      });
    }
  }
}

module.exports = { NbaApi };
