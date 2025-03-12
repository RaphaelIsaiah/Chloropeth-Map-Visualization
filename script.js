// Set up initial SVG dimensions
const width = 960;
const height = 600;

// Create a responsive container for the SVG
d3.select("body")
  .append("div")
  .attr("id", "chart-container")
  .style("width", "90%")
  .style("overflow", "hidden");

// Create SVG canvas inside the container
const svg = d3
  .select("#chart-container")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("preserveAspectRatio", "xMidYMid meet")
  .style("width", "100%")
  .style("height", "auto");

// Load data using Promise.all()
Promise.all([
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json"
  ),
  d3.json(
    "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json"
  ),
]).then(([topoData, educationData]) => {
  // Convert Topojson to GeoJSON
  const counties = topojson.feature(
    topoData,
    topoData.objects.counties
  ).features;

  // Create a color scale
  const colorScale = d3
    .scaleQuantize()
    .domain([0, d3.max(educationData, (d) => d.bachelorsOrHigher)])
    .range(d3.schemeBlues[9]);

  // Create a path generator
  const path = d3.geoPath();

  // Draw the counties
  svg
    .selectAll(".county")
    .data(counties)
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", (d) => {
      const countyData = educationData.find((edu) => edu.fips === d.id);
      return countyData ? colorScale(countyData.bachelorsOrHigher) : "#ccc";
    })
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      const countyData = educationData.find((edu) => edu.fips === d.id);
      return countyData ? countyData.bachelorsOrHigher : 0;
    })
    .on("mouseover", (event, d) => {
      const countyData = educationData.find((edu) => edu.fips === d.id);
      tooltip.transition().duration(200).style("opacity", 0.9);

      // Ensure tooltip stays within SVG boundaries
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      const svgRect = svg.node().getBoundingClientRect();
      let xPos = event.pageX + 20;
      let yPos = event.pageY - 28;

      if (xPos + tooltipWidth > svgRect.right) {
        xPos = event.pageX - tooltipWidth - 10;
      }
      if (yPos < svgRect.top) {
        yPos = event.pageY + 10;
      }

      tooltip
        .html(
          `
        ${countyData.area_name}, ${countyData.state}: ${countyData.bachelorsOrHigher}%
      `
        )
        .attr("data-education", countyData.bachelorsOrHigher)
        .style("left", `${xPos}px`)
        .style("top", `${yPos}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add a legend
  const legend = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", `translate(${width - 300}, 40)`);

  const legendScale = d3
    .scaleLinear()
    .domain(colorScale.domain())
    .range([0, 200]);

  const legendAxis = d3
    .axisBottom(legendScale)
    .ticks(3)
    .tickFormat((d) => `${d}%`);

  legend.append("g").attr("transform", "translate(0, 10)").call(legendAxis);

  legend
    .selectAll("rect")
    .data(colorScale.range())
    .enter()
    .append("rect")
    .attr("x", (d, i) => i * 20)
    .attr("y", 0)
    .attr("width", 41)
    .attr("height", 10)
    .attr("fill", (d) => d);

  // Add a tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  // Make SVG responsive on window resize
  window.addEventListener("resize", () => {
    const container = d3.select("#chart-container").node();
    const newWidth = container.getBoundingClientRect().width;
    const newHeight = (newWidth / width) * height;

    svg.attr("width", newWidth).attr("height", newHeight);
  });
});
