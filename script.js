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
      row.Close = +row.NASDAQCOM;
    });
    console.log("Housing:", housingData);
    console.log("nasdaq:", nasdaqData);
  
    let selectedCounty = "Santa Clara County";
    let selectedCountyData = housingData.filter(row => {
      return row.County === selectedCounty;
    });
    
    // Create SVG
    const width = 800;
    const height = 500;
    const margin = {
      top: 40,
      right: 80,
      bottom: 50,
      left: 120  
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
    
    const housingYScale = d3.scaleLinear()
      .domain(d3.extent(selectedCountyData, row => row.ZHVI))
      .range([innerHeight, 0]);
  
    const nasdaqYScale = d3.scaleLinear()
      .domain(d3.extent(nasdaqData, row => row.Close))
      .nice()
      .range([innerHeight, 0]);
  
    // Create axes    
    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));

   const housingYAxisGroup = chart.append("g")
      .call(d3.axisLeft(housingYScale));
  
   const nasdaqYAxisGroup = chart.append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(nasdaqYScale));
    
    // Draw line
    const housingLine = d3.line()
      .x(d => xScale(d.Date))
      .y(d => housingYScale(d.ZHVI))
  
    const nasdaqLine = d3.line()
      .x(d => xScale(d.Date))
      .y(d => nasdaqYScale(d.Close))
    
    const housingPath = chart.append("path")
      .datum(selectedCountyData)
      .attr("class", "housing-line")
      .attr("d", housingLine)
  
    const nasdaqPath = chart.append("path")
      .datum(nasdaqData)
      .attr("class", "nasdaq-line")
      .attr("d", nasdaqLine);
    
    // Transition
    function animateLine(path, duration = 3000) {
      const totalLength = path.node().getTotalLength();

      return path
        .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }
    animateLine(nasdaqPath, 2500)
      .on("end", () => {
        animateLine(housingPath, 2500);
    });
  
  // change county and path
    d3.select("#county-select")
      .on("change", function () {
          selectedCounty = this.value;
        
          selectedCountyData = housingData.filter(row => {
            return row.County === selectedCounty;
          });
          // change housingYScale
          housingYScale.domain(
            d3.extent(selectedCountyData, row => row.ZHVI))
            .nice();
          housingYAxisGroup.call(d3.axisLeft(housingYScale));
        
          housingPath
            .datum(selectedCountyData)
            .attr("d", housingLine);
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
    chart.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", innerWidth + 65)
      .attr("text-anchor", "middle")
      .text("NASDAQ Composite Index");
    // legend
    const legend = chart.append("g")
      .attr("class", "legend")
      .attr("transform", 'translate(80, 20)');
  
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 10)
      .attr("y2", 10)
      .attr("class", "housing-line");

    legend.append("text")
      .attr("x", 40)
      .attr("y", 15)
      .text("Housing Price");
  
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 35)
      .attr("y2", 35)
      .attr("class", "nasdaq-line");

    legend.append("text")
      .attr("x", 40)
      .attr("y", 40)
      .text("NASDAQ Composite");
    
  });
