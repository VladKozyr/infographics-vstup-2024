document.addEventListener('DOMContentLoaded', function() {
    const data = [
        { label: 'Category A', value: 30 },
        { label: 'Category B', value: 45 },
        { label: 'Category C', value: 25 },
        { label: 'Category D', value: 60 },
        { label: 'Category E', value: 35 }
    ];

    const margin = { top: 40, right: 30, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#main-chart')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);

    const chart = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, width])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(data.map(d => d.label))
        .range(['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']);

    chart.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', -10)
        .text('Sample Bar Chart - Replace with Your Data');

    chart.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .attr('class', 'axis-label');

    chart.append('g')
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .attr('class', 'axis-label');

    chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text('Values');

    chart.append('text')
        .attr('class', 'axis-label')
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
        .style('text-anchor', 'middle')
        .text('Categories');

    // Create bars
    chart.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.label))
        .attr('width', xScale.bandwidth())
        .attr('y', height)
        .attr('height', 0)
        .attr('fill', d => colorScale(d.label))
        .transition()
        .duration(1000)
        .attr('y', d => yScale(d.value))
        .attr('height', d => height - yScale(d.value));

    chart.selectAll('.value-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'value-label')
        .attr('x', d => xScale(d.label) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.value) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#333')
        .text(d => d.value)
        .style('opacity', 0)
        .transition()
        .delay(1000)
        .duration(500)
        .style('opacity', 1);

    chart.selectAll('.bar')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 0.8);
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr('opacity', 1);
        });

    console.log('D3.js placeholder visualization loaded successfully!');
});