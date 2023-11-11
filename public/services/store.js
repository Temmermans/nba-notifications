const Store = {
  games: [],
};
const proxiedStore = new Proxy(Store, {
  set(target, property, value) {
    target[property] = value;
    if (property == "games") {
      window.dispatchEvent(
        new CustomEvent("gameschanged", {
          detail: {
            games: value,
          },
        })
      );
    }
    return true;
  },
  get(target, property) {
    return target[property];
  },
});
export default proxiedStore;
