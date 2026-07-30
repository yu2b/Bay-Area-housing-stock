d3.csv("data/housing_bayarea_2010_2025.csv")
  .then(data => {
    data.forEach(row => {
      row.Date = d3.timeParse("%Y-%m-%d")(row.Date);
      row.ZHVI = +row.ZHVI;
    });

    const santaClaraData = data.filter(row => {
      return row.County === "Santa Clara County";
    });

    console.log(data);
    console.log(santaClaraData);
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
      .domain(d3.extent(santaClaraData, row => row.Date))
      .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
      .domain(d3.extent(santaClaraData, row => row.ZHVI))
      .range([innerHeight, 0]);
    // Create axes    
    chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));

    chart.append("g")
      .call(d3.axisLeft(yScale));
    
    // Draw line
    const line = d3.line()
      .x(d => xScale(d.Date))
      .y(d => yScale(d.ZHVI))
    
    chart.append("path")
      .datum(santaClaraData)
      .attr("d", line);
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-width", 2);
  });
