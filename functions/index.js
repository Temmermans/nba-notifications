const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const NodeCache = require("node-cache");

initializeApp();

function getPreviousDay(date = new Date()) {
  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() - 1);

  return previous;
}

function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
}

function formatDate(date) {
  return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join("-");
}

async function getNbaGames(date) {
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

  if (myCache.get(yesterday)) {
    logger.info({ msg: "Cache hit", date: yesterday });
    return myCache.get(yesterday);
  } else {
    logger.info({ msg: "Cache miss", date: yesterday });
    return axios.request(options).then((response) => {
      return formatGames(determineInterestingGames(response.data.results)).then((data) => {
        myCache.set(yesterday, data, 60 * 60 * 12);
        return data;
      });
    });
  }
}

function determineInterestingGames(games) {
  return games
    .filter((game) => {
      // if the score is more than 12 points, ignore them
      const awayScore = game.scoreboard.score.away;
      const homeScore = game.scoreboard.score.home;
      const difference = Math.abs(awayScore - homeScore);
      return difference <= 10;
    })
    .filter((game) => {
      // determine a score for how close the teams where throughout the game
      const awayPeriods = game.scoreboard.score.awayPeriods;
      const homePeriods = game.scoreboard.score.homePeriods;
      const differences = awayPeriods.map((period, index) => {
        return Math.abs(period - homePeriods[index]);
      });
      // if three of the four periods are close, then it's interesting
      const closePeriods = differences.filter((diff) => diff <= 5);
      return closePeriods.length >= 3;
    });
}

async function formatGames(games) {
  const storage = getStorage();
  const formattedGames = [];

  for (const game of games) {
    const awayUrl = await getDownloadURL(storage.bucket().file(`nba/logos/${game.teams.away.abbreviation}.png`));
    const homeUrl = await getDownloadURL(storage.bucket().file(`nba/logos/${game.teams.home.abbreviation}.png`));
    formattedGames.push({
      title: game.summary,
      awayTeam: { name: game.teams.away.team, abbr: game.teams.away.abbreviation, logo: awayUrl },
      homeTeam: { name: game.teams.home.team, abbr: game.teams.home.abbreviation, logo: homeUrl },
      score: game.scoreboard.score,
      venue: {
        name: game.venue.name,
        city: game.venue.city,
        state: game.venue.state,
      },
    });
  }
  return formattedGames;
}

const myCache = new NodeCache();

exports.getNbaGames = onRequest((request, response) => {
  return getNbaGames(request.query.date)
    .then((data) => {
      response.json(data);
    })
    .catch((error) => {
      logger.info({ msg: "Error getting NBA games", error });
      response.status(500).json({ msg: error.message });
    });
});
