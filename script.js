Promise.all([
  d3.csv("data/housing_bayarea_2010_2025.csv"),
  d3.csv("data/nasdaq_monthly_2010_2025.csv")
  ]).then( ([housingData, nasdaqData]) => {
    housingData.forEach(row => {
      row.Date = d3.timeParse("%Y-%m-%d")(row.Date);
      row.ZHVI = +row.ZHVI;
    });
    nasdaqData.forEach(row => {
      row.Date = d3.timeParse("%Y-%m-%d")(row.Date);
      row.Close = +row.Close;
    });
    console.log("Housing:", housingData);
    console.log("nasdaq:", nasdaqData;
  
    let selectedCounty = "Santa Clara County";
    let selectedCountyData = housingData.filter(row => {
      return row.County === selectedCounty;
    });
    
    // Create SVG
    const width = 800;
    const height = 500;
    const margin = {
      top: 40,
      right: 30,
      bottom: 50,
      left: 80  
      };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const svg = d3.select("#chart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);
    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Create scales    
    const xScale = d3.scaleTime()
      .domain(d3.extent(selectedCountyData, row => row.Date))
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(selectedCountyData, row => row.ZHVI))
      .range([innerHeight, 0]);
    // Create axes    
    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));

   const yAxisGroup = chart.append("g")
      .call(d3.axisLeft(yScale));
    
    // Draw line
    const line = d3.line()
      .x(d => xScale(d.Date))
      .y(d => yScale(d.ZHVI))
    
    const housingPath = chart.append("path")
      .datum(selectedCountyData)
      .attr("class", "housing-line")
      .attr("d", line)
    
     // change county and path
    d3.select("#county-select")
      .on("change", function () {
          selectedCounty = this.value;
        
          selectedCountyData = housingData.filter(row => {
            return row.County === selectedCounty;
          });
          // change yScale
          yScale.domain(
            d3.extent(selectedCountyData, row => row.ZHVI))
            .nice();
          yAxisGroup.call(d3.axisLeft(yScale));
        
          housingPath
            .datum(selectedCountyData)
            .attr("d", line);
      });   
    
    // Axis labels
    chart.append("text")
      .attr("class", "axis-label")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + 45)
      .attr("text-anchor", "middle")
      .text("Year");
    chart.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", -55)
      .attr("text-anchor", "middle")
      .text("Median Home Value ($)");
    
  });
