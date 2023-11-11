const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getStorage, getDownloadURL } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");
const axios = require("axios");
const NodeCache = require("node-cache");
const webPush = require("web-push");
const express = require("express");
const cors = require("cors");

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
      return difference <= 8;
    })
    .sort((a, b) => {
      // sort by the difference in score
      const awayScoreA = a.scoreboard.score.away;
      const homeScoreA = a.scoreboard.score.home;
      const differenceA = Math.abs(awayScoreA - homeScoreA);
      const awayScoreB = b.scoreboard.score.away;
      const homeScoreB = b.scoreboard.score.home;
      const differenceB = Math.abs(awayScoreB - homeScoreB);
      return differenceA - differenceB;
    })
    .map((game) => {
      // add difference in score to the game object
      const awayScore = game.scoreboard.score.away;
      const homeScore = game.scoreboard.score.home;
      const difference = Math.abs(awayScore - homeScore);
      return { ...game, difference };
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
      difference: game.difference,
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

const app = express();

app.use(cors({ origin: true }));

app.get("/nba/games", (request, response) => {
  return getNbaGames(request.query.date)
    .then((data) => {
      response.json(data);
    })
    .catch((error) => {
      logger.info({ msg: "Error getting NBA games", error });
      response.status(500).json({ msg: error.message });
    });
});

app.post("/nba/push-register", (req, res) => {
  myCache.set(`subscription-${JSON.stringify(req.body.subscription)}`, req.body.subscription, 0);
  res.sendStatus(201);
});

exports.nbaApi = onRequest(app);

exports.sendNbaPushNotifications = onSchedule("every day 10:00", async () => {
  webPush.setVapidDetails("https://nba.simoncodes.be", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return getNbaGames()
    .then(async (data) => {
      if (data.length === 0) {
        logger.info({ msg: "No need to send push notifications. No interesting games found." });
        return;
      }
      for (const key of myCache.keys()) {
        if (!key.startsWith("subscription-")) return;
        const subscription = myCache.get(key);
        await webPush.sendNotification(subscription, `Found ${data.length} games worth watching.`).catch(() => {
          logger.info({ msg: "Error sending push notifiication to following subscription.", subscription });
        });
      }
    })
    .catch((error) => {
      logger.info({ msg: "Error getting NBA games on schedule", error });
    });
});
