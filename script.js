// Set up SVG dimensions
const width = 960;
const height = 600;

// Create SVG canvas
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Load data using Promise.all
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
    .range(d3.schemeBlues[9]); // Use a color scheme like Blues

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
      tooltip
        .html(
          `
        ${countyData.area_name}, ${countyData.state}: ${countyData.bachelorsOrHigher}%
      `
        )
        .attr("data-education", countyData.bachelorsOrHigher)
        .style("left", `${event.pageX + 20}px`)
        .style("top", `${event.pageY - 28}px`);
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
});
