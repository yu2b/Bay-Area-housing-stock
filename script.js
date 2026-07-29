d3.csv("data/housing_bayarea_2010_2025.csv")
  .then(data => {
    data.forEach(row => {
      row.Date = d3.timeParse("%Y-%m-%d")(row.Date);
      row.ZHVI = +row.ZHVI;
    });
    const santaClaraData = data.filter( row => {
      return row.County == "Santa Clara County";
    });
    console.log(data);
    console.log(santaClaraData);

});
