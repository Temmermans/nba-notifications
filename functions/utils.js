exports.getPreviousDay = function getPreviousDay(date = new Date()) {
  const previous = new Date(date.getTime());
  previous.setDate(date.getDate() - 1);

  return previous;
};

padTo2Digits = function padTo2Digits(num) {
  return num.toString().padStart(2, "0");
};

exports.formatDate = function formatDate(date) {
  return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join("-");
};
