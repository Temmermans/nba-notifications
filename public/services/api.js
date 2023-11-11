class Api {
  static async getGames() {
    const request = await fetch("https://nbaapi-ihcuq5swpq-uc.a.run.app/nba/games");
    const response = await request.json();
    return response;
  }
}

export default Api;
