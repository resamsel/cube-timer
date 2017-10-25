const categories = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    25, 30, 35, 40, 45, 50, 55, 60,
    70, 80, 60+30, 100, 110,
    2*60, 2*60+30, 3*60, 4*60, 5*60,
    6*60, 7*60, 8*60, 9*60, 10*60,
    12*60, 15*60, 20*60, 30*60, 40*60, 50*60, 60*60
];

module.exports = {
  fromValue: function(value) {
      var x = value / 1000, category;
      for (var i = 0; i < categories.length; i++) {
          category = categories[i];
          if (x < category) {
              return category;
          }
      }

      return -1;
  }
};
