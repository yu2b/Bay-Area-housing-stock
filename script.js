Promise.all([
  d3.csv("data/housing_bayarea_2010_2025.csv"),
  d3.csv("data/nasdaq_monthly_2010_2025.csv")
]).then(([housingData, nasdaqData]) => {
    const parseDate = d3.timeParse("%Y-%m-%d");

    housingData.forEach(row => {
      row.Date = parseDate(row.Date);
      row.ZHVI = +row.ZHVI;
    });

    nasdaqData.forEach(row => {
      row.Date = parseDate(row.Date);
      row.Close = +row.NASDAQCOM;
    });

    // Bay Area average data
    const bayAverageHousingMap =
      d3.group(housingData, d => d.Date.getTime());

    const bayAverageHousing = [];

    for (const [date, rows] of bayAverageHousingMap) {
      bayAverageHousing.push({
        Date: new Date(+date),
        ZHVI: d3.mean(rows, d => d.ZHVI)
      });
    }

    bayAverageHousing.sort((a, b) => a.Date - b.Date);

    let selectedCounty = "Santa Clara County";
    let currentScene = 1;
    let housingSeriesLabel = "Bay Area Average Housing Price";
    const totalScenes = 3;
    const formatDate = d3.timeFormat("%b. %Y");
    const formatHousing = d3.format("$,.0f");
    const formatNasdaq = d3.format(",.2f");
    const formatPercent = d3.format(".0f");
    
    // Create SVG
    const width = 800;
    const height = 560;
    const margin = {
      top: 40,
      right: 80,
      bottom: 100,
      left: 120  
    };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    const svg = d3.select("#chart")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("role", "img")
      .attr("aria-label", "Bay Area housing prices and NASDAQ Composite Index over time");

    const chart = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Create scales    
    const xScale = d3.scaleTime()
      .domain(d3.extent(bayAverageHousing, row => row.Date))
      .range([0, innerWidth]);
    
    const housingYScale = d3.scaleLinear()
      .domain(d3.extent(bayAverageHousing, row => row.ZHVI))
      .nice()
      .range([innerHeight, 0]);
  
    const nasdaqYScale = d3.scaleLinear()
      .domain(d3.extent(nasdaqData, row => row.Close))
      .nice()
      .range([innerHeight, 0]);
  
    // Create axes    
    const xAxisGroup = chart.append("g")
      .attr("transform", `translate(0, ${innerHeight})`)
      .call(d3.axisBottom(xScale));
  
    const housingYAxis = d3.axisLeft(housingYScale)
      .tickFormat(d3.format("$.2s"));

    const housingYAxisGroup = chart.append("g")
      .call(housingYAxis);
  
    const nasdaqYAxisGroup = chart.append("g")
      .attr("transform", `translate(${innerWidth}, 0)`)
      .call(d3.axisRight(nasdaqYScale)
        .tickFormat(d3.format(".2s")));
    
    const housingLine = d3.line()
      .x(d => xScale(d.Date))
      .y(d => housingYScale(d.ZHVI));
  
    const nasdaqLine = d3.line()
      .x(d => xScale(d.Date))
      .y(d => nasdaqYScale(d.Close));
    
    const housingPath = chart.append("path")
      .datum(bayAverageHousing)
      .attr("class", "housing-line")
      .attr("d", housingLine);

    const nasdaqPath = chart.append("path")
      .datum(nasdaqData)
      .attr("class", "nasdaq-line")
      .attr("d", nasdaqLine);

    // Wider invisible paths make both thin lines easier to hover.
    const housingHitPath = chart.append("path")
      .datum(bayAverageHousing)
      .attr("class", "line-hit-area")
      .attr("d", housingLine);

    const nasdaqHitPath = chart.append("path")
      .datum(nasdaqData)
      .attr("class", "line-hit-area")
      .attr("d", nasdaqLine);

    const housingHoverPoint = chart.append("circle")
      .attr("class", "hover-point housing-hover-point")
      .attr("r", 5)
      .style("display", "none");

    const nasdaqHoverPoint = chart.append("circle")
      .attr("class", "hover-point nasdaq-hover-point")
      .attr("r", 5)
      .style("display", "none");

    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "chart-tooltip")
      .attr("role", "status")
      .style("display", "none");

    function hideLine(path) {
      const length = path.node().getTotalLength();

      path
        .attr("stroke-dasharray", length)
        .attr("stroke-dashoffset", length);
    }

    function drawLine(path, duration = 2500) {
      return path
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }

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
      .text("Median Home Value (USD)");
    chart.append("text")
      .attr("class", "axis-label")
      .attr("transform", "rotate(-90)")
      .attr("x", -innerHeight / 2)
      .attr("y", innerWidth + 65)
      .attr("text-anchor", "middle")
      .text("NASDAQ Composite Index");

    // legend
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width / 2 - 210}, ${height - 35})`);

    legend.append("line")
      .attr("x1", 0)
      .attr("x2", 30)
      .attr("y1", 10)
      .attr("y2", 10)
      .attr("class", "housing-line");

    legend.append("text")
      .attr("x", 40)
      .attr("y", 15)
      .text("Bay Area Average Housing Price");
  
    legend.append("line")
      .attr("x1", 240)
      .attr("x2", 270)
      .attr("y1", 10)
      .attr("y2", 10)
      .attr("class", "nasdaq-line");

    legend.append("text")
      .attr("x", 280)
      .attr("y", 15)
      .text("NASDAQ Composite");

    function setCountyControlVisible(visible) {
      d3.select("#county-control").property("hidden", !visible);
    }

    function countyData(county) {
      return housingData
        .filter(d => d.County === county)
        .sort((a, b) => a.Date - b.Date);
    }

    function nearestPoint(data, targetDate) {
      return d3.least(data, d => Math.abs(d.Date - targetDate));
    }

    function addNarrativeText(lines, x = 45, y = 35) {
      const annotation = chart.append("g")
        .attr("class", "annotation annotation-text");

      annotation.selectAll("text")
        .data(lines)
        .join("text")
        .attr("x", x)
        .attr("y", (_, index) => y + index * 21)
        .text(d => d);

      return annotation;
    }

    function addPointHighlight({
      point,
      yScale,
      valueText,
      dateText,
      seriesClass,
      labelSide,
      labelOffsetY = -30,
      labelOffsetX = 48,
      pointRadius = 6,
  
    }) {
      const pointX = xScale(point.Date);
      const pointY = yScale(point.value);
      const side = labelSide || (pointX < innerWidth * 0.55 ? "right" : "left");
      const direction = side === "center" ? 0 : side === "right" ? 1 : -1;
      const leaderX = pointX + direction * Math.max(8, labelOffsetX - 6);
      const labelX = pointX + direction * labelOffsetX;
      const labelY = Math.max(18, Math.min(innerHeight - 12, pointY + labelOffsetY));
      const annotation = chart.append("g")
        .attr("class", "annotation point-annotation");

      annotation.append("circle")
        .attr("class", `annotation-point ${seriesClass}`)
        .attr("cx", pointX)
        .attr("cy", pointY)
        .attr("r", pointRadius);

      // first line, date
      annotation.append("text")
        .attr("class", "annotation-value")
        .attr("x", labelX)
        .attr("y", labelY)
        .attr("text-anchor", "middle")
        .text(dateText);

      // second line, value
      annotation.append("text")
        .attr("class", "annotation-value")
        .attr("x", labelX)
        .attr("y", labelY + 17)
        .attr("text-anchor", "middle")
        .text(valueText);
    }

    function showLineTooltip(event, data, valueKey, seriesLabel, formatter, yScale, hoverPoint) {
      const [mouseX] = d3.pointer(event, chart.node());
      const date = xScale.invert(mouseX);
      const index = d3.bisector(d => d.Date).center(data, date);
      const point = data[index];

      hoverPoint
        .attr("cx", xScale(point.Date))
        .attr("cy", yScale(point[valueKey]))
        .style("display", null);

      tooltip
        .html(
          `${seriesLabel}<br>` +
          `${formatDate(point.Date)}<br>` +
          `${formatter(point[valueKey])}`
        )
        .style("left", `${event.clientX + 14}px`)
        .style("top", `${event.clientY + 14}px`)
        .style("display", "block");
    }

    function hideTooltip(hoverPoint) {
      tooltip.style("display", "none");
      hoverPoint.style("display", "none");
    }

    housingHitPath
      .on("pointermove", function (event, data) {
        showLineTooltip(
          event,
          data,
          "ZHVI",
          housingSeriesLabel,
          formatHousing,
          housingYScale,
          housingHoverPoint
        );
      })
      .on("pointerleave", () => hideTooltip(housingHoverPoint));

    nasdaqHitPath
      .on("pointermove", function (event, data) {
        showLineTooltip(
          event,
          data,
          "Close",
          "NASDAQ Composite",
          formatNasdaq,
          nasdaqYScale,
          nasdaqHoverPoint
        );
      })
      .on("pointerleave", () => hideTooltip(nasdaqHoverPoint));

    function clearScene() {
      housingPath.interrupt();
      nasdaqPath.interrupt();
      housingHitPath.interrupt();
      housingYAxisGroup.interrupt();
      chart.selectAll(".annotation").remove();
      hideTooltip(housingHoverPoint);
      hideTooltip(nasdaqHoverPoint);

      housingPath
        .attr("stroke-dasharray", null)
        .attr("stroke-dashoffset", null);

      nasdaqPath
        .attr("stroke-dasharray", null)
        .attr("stroke-dashoffset", null);
    }

    function updateHousingSeries(data, label, duration = 900) {
      housingYScale
        .domain(d3.extent(data, d => d.ZHVI))
        .nice();

      housingSeriesLabel = label;

      if (duration === 0) {
        housingYAxisGroup.call(housingYAxis);
        housingPath.datum(data).attr("d", housingLine);
        housingHitPath.datum(data).attr("d", housingLine);
      } else {
        housingYAxisGroup
          .transition()
          .duration(duration)
          .call(housingYAxis);

        housingPath
          .datum(data)
          .transition()
          .duration(duration)
          .attr("d", housingLine);

        housingHitPath
          .datum(data)
          .transition()
          .duration(duration)
          .attr("d", housingLine);
      }

      legend.select("text")
        .text(label);
    }

    function showScene1() {
      setCountyControlVisible(false);
      updateHousingSeries(
        bayAverageHousing,
        "Bay Area Average Housing Price",
        0
      );

      const housingPeak2022 = d3.greatest(
        bayAverageHousing.filter(d => d.Date.getFullYear() === 2022),
        d => d.ZHVI
      );
      const nasdaqPeak2021 = d3.greatest(
        nasdaqData.filter(d => d.Date.getFullYear() === 2021),
        d => d.Close
      );
      const housingEnd = d3.greatest(bayAverageHousing, d => d.Date);
      const nasdaqEnd = d3.greatest(nasdaqData, d => d.Date);
      const housingRecovery =
        (housingEnd.ZHVI / housingPeak2022.ZHVI - 1) * 100;
      const nasdaqRecovery =
        (nasdaqEnd.Close / nasdaqPeak2021.Close - 1) * 100;

      addNarrativeText([
        "Both series surged during the pandemic recovery.",
        "NASDAQ peaked in Dec. 2021; housing in Jun. 2022.",
        "Both then declined.",
        `By Dec. 2025, NASDAQ was ${formatPercent(nasdaqRecovery)}% above its prior peak,`,
        `while housing remained ${formatPercent(Math.abs(housingRecovery))}% below its peak.`
      ], 25, 25);

      addPointHighlight({
        point: {Date: housingPeak2022.Date, value: housingPeak2022.ZHVI},
        yScale: housingYScale,
        dateText:"Jun. 2022",
        valueText: formatHousing(housingPeak2022.ZHVI),
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: 20,
        labelOffsetX: 50,
        pointRadius: 8,
      });

      addPointHighlight({
        point: {Date: nasdaqPeak2021.Date, value: nasdaqPeak2021.Close},
        yScale: nasdaqYScale,
        dateText:"Dec. 2021",
        valueText: formatNasdaq(nasdaqPeak2021.Close),
        seriesClass: "nasdaq-annotation-point",
        labelSide: "left",
        labelOffsetY: 20,
        labelOffsetX: 50,
        pointRadius: 8,
      });

      addPointHighlight({
        point: {Date: nasdaqEnd.Date, value: nasdaqEnd.Close},
        yScale: nasdaqYScale,
        dateText:"Dec. 2025", 
        valueText: formatNasdaq(nasdaqEnd.Close),
        seriesClass: "nasdaq-annotation-point",
        labelSide: "left",
        labelOffsetY: -50,
        labelOffsetX: 50,
        pointRadius: 8,
      });

      addPointHighlight({
        point: {Date: housingEnd.Date, value: housingEnd.ZHVI},
        yScale: housingYScale,
        dateText:"Dec. 2025",
        valueText: formatHousing(housingEnd.ZHVI),
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: 20,
        labelOffsetX: 50,
        pointRadius: 8,
      });

      hideLine(housingPath);
      hideLine(nasdaqPath);

      drawLine(nasdaqPath, 1400)
        .on("end", () => drawLine(housingPath, 1400));
    }

    function showScene2() {
      setCountyControlVisible(false);
      selectedCounty = "Santa Clara County";
      d3.select("#county-select").property("value", selectedCounty);

      updateHousingSeries(
        countyData(selectedCounty),
        `${selectedCounty} Housing Price`
      );

      const santaClaraData = countyData(selectedCounty);
      const santaClaraPeak2022 = d3.greatest(
        santaClaraData.filter(d => d.Date.getFullYear() === 2022),
        d => d.ZHVI
      );
      const santaClaraPeak2025 = d3.greatest(
        santaClaraData.filter(d => d.Date.getFullYear() === 2025),
        d => d.ZHVI
      );
      const bayPeak2022 = d3.greatest(
        bayAverageHousing.filter(d => d.Date.getFullYear() === 2022),
        d => d.ZHVI
      );
      const bayAverageAtSantaClaraPeak = nearestPoint(
        bayAverageHousing,
        santaClaraPeak2025.Date
      );
      const santaClaraRecovery =
        (santaClaraPeak2025.ZHVI / santaClaraPeak2022.ZHVI - 1) * 100;
      const bayRecovery =
        (bayAverageAtSantaClaraPeak.ZHVI / bayPeak2022.ZHVI - 1) * 100;

      addNarrativeText([
        "Santa Clara recovered more strongly after the downturn.",
        `It reached a new ${formatHousing(santaClaraPeak2025.ZHVI)} peak in ${formatDate(santaClaraPeak2025.Date)},`,
        `${formatPercent(santaClaraRecovery)}% above its 2022 peak. At that date, `
        ,`the Bay Area average remained ${formatPercent(Math.abs(bayRecovery))}% below its 2022 peak.`
      ], 25, 25);

      addPointHighlight({
        point: {Date: santaClaraPeak2022.Date, value: santaClaraPeak2022.ZHVI},
        yScale: housingYScale,
        dateText:"2022 peak:",
        valueText: ` ${formatHousing(santaClaraPeak2022.ZHVI)}`,
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: 0,
        labelOffsetX: 40,
        pointRadius: 8,
      });

      addPointHighlight({
        point: {Date: santaClaraPeak2025.Date, value: santaClaraPeak2025.ZHVI},
        yScale: housingYScale,
        dateText:"New peak:",
        valueText: ` ${formatHousing(santaClaraPeak2025.ZHVI)}`,
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: 0,
        labelOffsetX: 40,
        pointRadius: 8,
      });
    }

    function showScene3() {
      setCountyControlVisible(true);

      const selectedData = countyData(selectedCounty);

      updateHousingSeries(
        selectedData,
        `${selectedCounty} Housing Price`
      );

      const data2022 = selectedData.filter(
        d => d.Date.getFullYear() === 2022
      );
      const peak2022 = d3.greatest(data2022, d => d.ZHVI);
      const end2025 = d3.greatest(selectedData, d => d.Date);
      const recoveryPercent =
        (end2025.ZHVI / peak2022.ZHVI - 1) * 100;
      const recoveryDirection =
        recoveryPercent >= 0 ? "above" : "below";

      addNarrativeText([
        "County recovery diverged after the 2022 peak.",
        "By Dec. 2025, Santa Clara was the only selected",
        "county above its 2022 peak.",
        "Select a county to compare its recovery."
      ], 25, 25);

      chart.append("line")
        .attr("class", "annotation annotation-recovery-line")
        .attr("x1", xScale(peak2022.Date))
        .attr("y1", housingYScale(peak2022.ZHVI))
        .attr("x2", xScale(end2025.Date))
        .attr("y2", housingYScale(end2025.ZHVI));

      addPointHighlight({
        point: {Date: peak2022.Date, value: peak2022.ZHVI},
        yScale: housingYScale,
        dateText:"2022 peak:",
        valueText: ` ${formatHousing(peak2022.ZHVI)}`,
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: -32,
      });

      addPointHighlight({
        point: {Date: end2025.Date, value: end2025.ZHVI},
        yScale: housingYScale,
        
        dateText:
          `${formatPercent(Math.abs(recoveryPercent))}% ${recoveryDirection} `,
        valueText:"2022 peak:",
        seriesClass: "housing-annotation-point",
        labelSide: "left",
        labelOffsetY: 30,
  
      });
    }

    function updateSceneButtons() {
      d3.selectAll(".scene-button")
        .classed("active", function () {
          return +this.dataset.scene === currentScene;
        })
        .attr("aria-pressed", function () {
          return +this.dataset.scene === currentScene;
        });

      d3.select("#next-button")
        .property("disabled", currentScene === totalScenes)
        .text(currentScene === totalScenes ? "END" : "NEXT ›");
    }

    function switchScene(sceneNumber) {
      if (sceneNumber < 1 || sceneNumber > totalScenes) return;

      clearScene();
      currentScene = sceneNumber;

      if (currentScene === 1) showScene1();
      if (currentScene === 2) showScene2();
      if (currentScene === 3) showScene3();

      updateSceneButtons();
    }

    d3.selectAll(".scene-button")
      .on("click", function () {
        switchScene(+this.dataset.scene);
      });

    d3.select("#next-button")
      .on("click", () => {
        switchScene(currentScene + 1);
      });

    d3.select("#county-select")
      .on("change", function () {
        selectedCounty = this.value;

        if (currentScene === 3) {
          clearScene();
          showScene3();
        }
      });

    switchScene(1);
}).catch(error => {
  console.error("Unable to load visualization data:", error);

  d3.select("#chart")
    .append("p")
    .attr("class", "error-message")
    .text("The visualization could not load. Run the project from a local web server and check the data files.");
});
