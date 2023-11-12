const { onRequest } = require("firebase-functions/v2/https");
// const { initializeApp } = require("firebase-admin/app");
const logger = require("firebase-functions/logger");
const NodeCache = require("node-cache");
const express = require("express");
const cors = require("cors");
const { NbaApi } = require("./nba");

// initializeApp();

const myCache = new NodeCache();
const Nba = new NbaApi(myCache, logger);

const app = express();

app.use(cors({ origin: true }));

app.get("/nba/games", (request, response) => {
  return Nba.getGames(request.query.date)
    .then((data) => {
      response.json(data);
    })
    .catch((error) => {
      logger.info({ msg: "Error getting NBA games", error });
      response.status(500).json({ msg: error.message });
    });
});

exports.nbaApi = onRequest(app);
