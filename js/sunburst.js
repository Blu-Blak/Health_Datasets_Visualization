// sunburst.js - Demographics Visualization combining multiple datasets

let sunburstData = null;
let genderDiseaseData = null;
let ageDiseaseData = null;

/**
 * Initialize the demographics visualization
 * Shows data from TWO datasets:
 * 1. medical-o1-verifiable-problem (Sunburst)
 * 2. medical-o1-reasoning-SFT (Gender & Age charts)
 */
async function initSunburst() {
    try {
        console.log('Loading demographics data...');
        
        // Load all three datasets
        const [demographics, genderDisease, ageDisease] = await Promise.all([
            d3.json('data/demographics.json'),
            d3.json('data/gender_disease.json'),
            d3.json('data/age_disease.json')
        ]);
        
        sunburstData = demographics;
        genderDiseaseData = genderDisease;
        ageDiseaseData = ageDisease;
        
        console.log('Demographics data loaded successfully');
        
        // Create the combined demographics view
        createDemographicsView();
        
    } catch (error) {
        console.error('Error loading demographics data:', error);
        document.getElementById('sunburst-container').innerHTML = 
            '<p style="color: #e74c3c; text-align: center; padding: 40px;">Error loading demographics data. Please check console for details.</p>';
    }
}

/**
 * Create the complete demographics view with multiple visualizations
 */
function createDemographicsView() {
    const container = d3.select('#sunburst-container');
    container.selectAll('*').remove();
    
    // Create dataset sections
    container.html(`
        <div class="demographics-wrapper">
            <!-- Dataset 1: medical-o1-verifiable-problem -->
            <div class="dataset-section">
                <div class="dataset-header">
                    <h3>Dataset 1: Medical Questions Analysis</h3>
                    <p class="dataset-source">Source: FreedomIntelligence/medical-o1-verifiable-problem</p>
                    <p class="dataset-desc">Age and Gender distribution from 40,644 clinical vignettes</p>
                </div>
                <div id="sunburst-chart"></div>
            </div>
            
            <!-- Dataset 2: medical-o1-reasoning-SFT -->
            <div class="dataset-section">
                <div class="dataset-header">
                    <h3>Dataset 2: Medical Reasoning Analysis</h3>
                    <p class="dataset-source">Source: FreedomIntelligence/medical-o1-reasoning-SFT</p>
                    <p class="dataset-desc">Disease patterns across demographics</p>
                </div>
                
                <!-- Toggle between Gender and Age charts -->
                <div class="chart-toggle">
                    <button class="toggle-btn active" data-chart="gender">
                        👥 Gender Distribution
                    </button>
                    <button class="toggle-btn" data-chart="age">
                        📊 Age Groups
                    </button>
                </div>
                
                <div id="gender-chart" class="demographic-chart"></div>
                <div id="age-chart" class="demographic-chart" style="display: none;"></div>
            </div>
        </div>
    `);
    
    // Setup toggle functionality
    setupChartToggle();
    
    // Create visualizations
    createSunburstChart();
    createGenderChart();
    createAgeChart();
}

/**
 * Setup toggle between gender and age charts
 */
function setupChartToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = btn.getAttribute('data-chart');
            
            // Update button states
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide charts
            if (chartType === 'gender') {
                document.getElementById('gender-chart').style.display = 'block';
                document.getElementById('age-chart').style.display = 'none';
            } else {
                document.getElementById('gender-chart').style.display = 'none';
                document.getElementById('age-chart').style.display = 'block';
            }
        });
    });
}

/**
 * Create Sunburst Chart for Dataset 1 (medical-o1-verifiable-problem)
 */
function createSunburstChart() {
    const container = d3.select('#sunburst-chart');
    const width = 500;
    const height = 500;
    const radius = Math.min(width, height) / 2;
    
    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('max-width', '500px')
        .style('height', 'auto')
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);
    
    // Create color scale
    const color = d3.scaleOrdinal()
        .domain(['Elderly (80+)', 'Senior (60-79)', 'Middle Age (40-59)', 'Young Adult (20-39)', 'Adolescent (13-19)', 'Child (2-12)', 'Infant (0-1)', 'Unknown'])
        .range(['#8B4513', '#CD853F', '#9370DB', '#50C878', '#FFD700', '#FF69B4', '#FFB6C1', '#999999']);
    
    const genderColor = d3.scaleOrdinal()
        .domain(['Male', 'Female', 'Unknown'])
        .range(['#4A90E2', '#E85D75', '#999999']);
    
    // Create partition layout
    const partition = d3.partition()
        .size([2 * Math.PI, radius]);
    
    // Filter out "Unknown" age groups and genders
    const filteredData = {
        name: sunburstData.name,
        children: sunburstData.children
            .filter(ageGroup => ageGroup.name !== 'Unknown')
            .map(ageGroup => ({
                name: ageGroup.name,
                children: ageGroup.children.filter(gender => gender.name !== 'Unknown')
            }))
            .filter(ageGroup => ageGroup.children.length > 0)
    };
    
    const root = d3.hierarchy(filteredData)
        .sum(d => d.value || 0)
        .sort((a, b) => b.value - a.value);
    
    partition(root);
    
    // Create arc generator
    const arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => d.y0)
        .outerRadius(d => d.y1);
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'sunburst-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', '#fff')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    
    // Draw arcs
    const path = svg.selectAll('path')
        .data(root.descendants().filter(d => d.depth > 0))
        .enter().append('path')
        .attr('d', arc)
        .style('fill', d => {
            if (d.depth === 1) return color(d.data.name);
            return genderColor(d.data.name);
        })
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('opacity', 0.8)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .style('opacity', 1)
                .style('stroke-width', 3);
            
            const percentage = ((d.value / root.value) * 100).toFixed(1);
            tooltip.html(`
                <strong>${d.data.name}</strong><br>
                Count: ${d.value.toLocaleString()}<br>
                Percentage: ${percentage}%
            `)
            .style('visibility', 'visible');
        })
        .on('mousemove', function(event) {
            tooltip
                .style('top', (event.pageY - 10) + 'px')
                .style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .style('opacity', 0.8)
                .style('stroke-width', 2);
            tooltip.style('visibility', 'hidden');
        });
    
    // Add center label
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-0.5em')
        .style('font-size', '24px')
        .style('font-weight', 'bold')
        .style('fill', '#333')
        .text(root.value.toLocaleString());
    
    svg.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '1em')
        .style('font-size', '14px')
        .style('fill', '#666')
        .text('Total Patients');
    
    // Add legend
    const legend = container.append('div')
        .attr('class', 'sunburst-legend')
        .style('margin-top', '20px')
        .style('text-align', 'center');
    
    const ageGroups = ['Elderly (80+)', 'Senior (60-79)', 'Middle Age (40-59)', 'Young Adult (20-39)', 'Adolescent (13-19)', 'Child (2-12)', 'Infant (0-1)'];
    
    const legendItems = legend.selectAll('.legend-item')
        .data(ageGroups)
        .enter().append('div')
        .style('display', 'inline-block')
        .style('margin', '5px 10px')
        .style('font-size', '11px');
    
    legendItems.append('span')
        .style('display', 'inline-block')
        .style('width', '12px')
        .style('height', '12px')
        .style('background-color', d => color(d))
        .style('margin-right', '5px')
        .style('border-radius', '2px');
    
    legendItems.append('span')
        .text(d => d);
}

/**
 * Create Gender Distribution Chart for Dataset 2 (medical-o1-reasoning-SFT)
 */
function createGenderChart() {
    const container = d3.select('#gender-chart');
    const margin = {top: 40, right: 80, bottom: 80, left: 200};
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('max-width', '900px')
        .style('height', 'auto')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Extract diseases
    const diseases = genderDiseaseData.map(d => d.disease);
    
    // Color scale for genders
    const color = d3.scaleOrdinal()
        .domain(['Male', 'Female'])
        .range(['#60a5fa', '#f472b6']);
    
    // Scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(genderDiseaseData, d => Math.max(d.Male || 0, d.Female || 0)) * 1.1])
        .range([0, width]);
    
    const y = d3.scaleBand()
        .domain(diseases)
        .range([0, height])
        .padding(0.3);
    
    // Add X axis
    svg.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(6))
        .selectAll('text')
        .style('fill', '#333');
    
    svg.selectAll('.x-axis path, .x-axis line')
        .style('stroke', '#ccc');
    
    // Add Y axis
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('fill', '#333')
        .style('font-size', '12px')
        .style('font-weight', '500');
    
    svg.selectAll('.y-axis path, .y-axis line')
        .style('stroke', '#ccc');
    
    // Create bar groups
    const barHeight = y.bandwidth() / 2;
    
    // Male bars
    svg.selectAll('.bar-male')
        .data(genderDiseaseData)
        .enter().append('rect')
        .attr('class', 'bar-male')
        .attr('x', 0)
        .attr('y', d => y(d.disease))
        .attr('width', d => x(d.Male || 0))
        .attr('height', barHeight - 2)
        .attr('fill', color('Male'))
        .attr('rx', 4)
        .style('opacity', 0.8)
        .on('mouseover', function() {
            d3.select(this).style('opacity', 1);
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 0.8);
        });
    
    // Female bars
    svg.selectAll('.bar-female')
        .data(genderDiseaseData)
        .enter().append('rect')
        .attr('class', 'bar-female')
        .attr('x', 0)
        .attr('y', d => y(d.disease) + barHeight)
        .attr('width', d => x(d.Female || 0))
        .attr('height', barHeight - 2)
        .attr('fill', color('Female'))
        .attr('rx', 4)
        .style('opacity', 0.8)
        .on('mouseover', function() {
            d3.select(this).style('opacity', 1);
        })
        .on('mouseout', function() {
            d3.select(this).style('opacity', 0.8);
        });
    
    // Add value labels
    svg.selectAll('.label-male')
        .data(genderDiseaseData)
        .enter().append('text')
        .attr('class', 'label-male')
        .attr('x', d => x(d.Male || 0) + 5)
        .attr('y', d => y(d.disease) + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#333')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(d => d.Male || 0);
    
    svg.selectAll('.label-female')
        .data(genderDiseaseData)
        .enter().append('text')
        .attr('class', 'label-female')
        .attr('x', d => x(d.Female || 0) + 5)
        .attr('y', d => y(d.disease) + barHeight + barHeight / 2)
        .attr('dy', '0.35em')
        .style('fill', '#333')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .text(d => d.Female || 0);
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - 120}, -20)`);
    
    ['Male', 'Female'].forEach((gender, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('rect')
            .attr('width', 16)
            .attr('height', 16)
            .attr('fill', color(gender))
            .attr('rx', 3);
        
        legendItem.append('text')
            .attr('x', 22)
            .attr('y', 12)
            .style('fill', '#333')
            .style('font-size', '12px')
            .text(gender);
    });
    
    // Add axis label
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('text-anchor', 'middle')
        .style('fill', '#666')
        .style('font-size', '12px')
        .text('Number of Mentions');
}

/**
 * Create Age Groups Chart for Dataset 2 (medical-o1-reasoning-SFT)
 * Dual mode: Butterfly Compare + Stacked All (from teammate's implementation)
 */
function createAgeChart() {
    const container = d3.select('#age-chart');
    const margin = {top: 80, right: 200, bottom: 70, left: 180};
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    
    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('max-width', '900px')
        .style('height', 'auto')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    const ageGroups = ["Adult (41-65)", "Pediatric (0-18)", "Senior (65+)", "Young Adult (19-40)"];
    const diseases = ageDiseaseData.map(d => d.disease);
    
    // Colors for age groups
    const color = d3.scaleOrdinal()
        .domain(ageGroups)
        .range(["#38bdf8", "#fbbf24", "#fb923c", "#f43f5e"]);
    
    // State
    let leftGroup = "Adult (41-65)";
    let rightGroup = "Young Adult (19-40)";
    let viewMode = "compare"; // "compare" or "stacked"
    
    const y = d3.scaleBand()
        .domain(diseases)
        .range([0, height])
        .padding(0.25);
    
    const maxVal = d3.max(ageDiseaseData, d => 
        Math.max(...ageGroups.map(ag => d[ag] || 0))
    );
    
    const maxTotal = d3.max(ageDiseaseData, d => 
        ageGroups.reduce((sum, ag) => sum + (d[ag] || 0), 0)
    );
    
    const centerX = width / 2;
    
    // Scales for butterfly mode
    const xLeft = d3.scaleLinear()
        .domain([0, maxVal * 1.2])
        .range([centerX - 10, 0]);
    
    const xRight = d3.scaleLinear()
        .domain([0, maxVal * 1.2])
        .range([centerX + 10, width]);
    
    // Scale for stacked mode
    const xStacked = d3.scaleLinear()
        .domain([0, maxTotal * 1.1])
        .range([0, width]);
    
    // Y Axis
    const yAxisGroup = svg.append('g')
        .attr('class', 'axis y-axis')
        .call(d3.axisLeft(y).tickSize(0));
    
    yAxisGroup.select('.domain').attr('stroke', '#ccc');
    
    yAxisGroup.selectAll('text')
        .attr('fill', '#333')
        .style('font-size', '12px')
        .style('font-weight', '500');
    
    // Center divider line (for butterfly mode)
    const centerLine = svg.append('line')
        .attr('class', 'center-line')
        .attr('x1', centerX)
        .attr('y1', -10)
        .attr('x2', centerX)
        .attr('y2', height + 10)
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4');
    
    // X Axes container
    const xAxisLeft = svg.append('g')
        .attr('class', 'axis x-axis-left')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xLeft).ticks(5));
    
    const xAxisRight = svg.append('g')
        .attr('class', 'axis x-axis-right')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xRight).ticks(5));
    
    const xAxisStacked = svg.append('g')
        .attr('class', 'axis x-axis-stacked')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xStacked).ticks(8))
        .style('opacity', 0);
    
    // Style axes
    svg.selectAll('.axis path, .axis line')
        .style('stroke', '#ccc');
    svg.selectAll('.axis text')
        .style('fill', '#333');
    
    // X Axis Labels
    const leftLabel = svg.append('text')
        .attr('x', centerX / 2)
        .attr('y', height + 40)
        .attr('fill', color(leftGroup))
        .attr('text-anchor', 'middle')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('class', 'left-label')
        .text(`← ${leftGroup}`);
    
    const rightLabel = svg.append('text')
        .attr('x', centerX + (width - centerX) / 2)
        .attr('y', height + 40)
        .attr('fill', color(rightGroup))
        .attr('text-anchor', 'middle')
        .attr('font-size', '13px')
        .attr('font-weight', '600')
        .attr('class', 'right-label')
        .text(`${rightGroup} →`);
    
    const stackedLabel = svg.append('text')
        .attr('x', width / 2)
        .attr('y', height + 40)
        .attr('fill', '#666')
        .attr('text-anchor', 'middle')
        .attr('font-size', '13px')
        .attr('class', 'stacked-label')
        .text('Number of Mentions (Frequency)')
        .style('opacity', 0);
    
    // Create bar groups
    const barGroups = svg.selectAll('.bar-group')
        .data(ageDiseaseData)
        .enter().append('g')
        .attr('class', 'bar-group')
        .attr('transform', d => `translate(0,${y(d.disease)})`);
    
    // Left bars (butterfly mode)
    barGroups.append('rect')
        .attr('class', 'left-bar')
        .attr('x', d => xLeft(d[leftGroup] || 0))
        .attr('y', 0)
        .attr('width', d => centerX - 10 - xLeft(d[leftGroup] || 0))
        .attr('height', y.bandwidth())
        .attr('fill', color(leftGroup))
        .attr('rx', 4);
    
    // Right bars (butterfly mode)
    barGroups.append('rect')
        .attr('class', 'right-bar')
        .attr('x', centerX + 10)
        .attr('y', 0)
        .attr('width', d => xRight(d[rightGroup] || 0) - centerX - 10)
        .attr('height', y.bandwidth())
        .attr('fill', color(rightGroup))
        .attr('rx', 4);
    
    // Stacked bars (hidden initially)
    ageGroups.forEach((ag, i) => {
        barGroups.append('rect')
            .attr('class', `stacked-bar stacked-bar-${i}`)
            .attr('x', d => {
                let offset = 0;
                for (let j = 0; j < i; j++) {
                    offset += xStacked(d[ageGroups[j]] || 0);
                }
                return offset;
            })
            .attr('y', 0)
            .attr('width', d => xStacked(d[ag] || 0))
            .attr('height', y.bandwidth())
            .attr('fill', color(ag))
            .attr('rx', 2)
            .style('opacity', 0);
        
        // Labels inside each stacked segment
        barGroups.append('text')
            .attr('class', `bar-label stacked-segment-label stacked-label-${i}`)
            .attr('x', d => {
                let offset = 0;
                for (let j = 0; j < i; j++) {
                    offset += xStacked(d[ageGroups[j]] || 0);
                }
                return offset + xStacked(d[ag] || 0) / 2;
            })
            .attr('y', y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .attr('fill', '#fff')
            .attr('font-weight', '600')
            .attr('font-size', '10px')
            .text(d => (d[ag] || 0) > 0 ? (d[ag] || 0) : '')
            .style('opacity', 0);
    });
    
    // Total labels at the end of stacked bars
    barGroups.append('text')
        .attr('class', 'bar-label total-value')
        .attr('x', d => {
            const total = ageGroups.reduce((sum, ag) => sum + (d[ag] || 0), 0);
            return xStacked(total) + 8;
        })
        .attr('y', y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', '#333')
        .attr('font-weight', '700')
        .attr('font-size', '12px')
        .text(d => ageGroups.reduce((sum, ag) => sum + (d[ag] || 0), 0))
        .style('opacity', 0);
    
    // Left value labels
    barGroups.append('text')
        .attr('class', 'bar-label left-value')
        .attr('x', d => xLeft(d[leftGroup] || 0) - 6)
        .attr('y', y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', '#333')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d => d[leftGroup] || 0);
    
    // Right value labels
    barGroups.append('text')
        .attr('class', 'bar-label right-value')
        .attr('x', d => xRight(d[rightGroup] || 0) + 6)
        .attr('y', y.bandwidth() / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', '#333')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d => d[rightGroup] || 0);
    
    // Function to switch to Compare mode
    function showCompareMode() {
        viewMode = 'compare';
        
        centerLine.transition().duration(400).style('opacity', 1);
        xAxisLeft.transition().duration(400).style('opacity', 1);
        xAxisRight.transition().duration(400).style('opacity', 1);
        leftLabel.transition().duration(400).style('opacity', 1);
        rightLabel.transition().duration(400).style('opacity', 1);
        
        xAxisStacked.transition().duration(400).style('opacity', 0);
        stackedLabel.transition().duration(400).style('opacity', 0);
        
        barGroups.selectAll('.left-bar')
            .transition().duration(500)
            .style('opacity', 1)
            .attr('x', d => xLeft(d[leftGroup] || 0))
            .attr('width', d => centerX - 10 - xLeft(d[leftGroup] || 0))
            .attr('fill', color(leftGroup));
        
        barGroups.selectAll('.right-bar')
            .transition().duration(500)
            .style('opacity', 1)
            .attr('width', d => xRight(d[rightGroup] || 0) - centerX - 10)
            .attr('fill', color(rightGroup));
        
        barGroups.selectAll('.stacked-bar')
            .transition().duration(400)
            .style('opacity', 0);
        
        barGroups.selectAll('.left-value')
            .transition().duration(500)
            .style('opacity', 1)
            .attr('x', d => xLeft(d[leftGroup] || 0) - 6)
            .text(d => d[leftGroup] || 0);
        
        barGroups.selectAll('.right-value')
            .transition().duration(500)
            .style('opacity', 1)
            .attr('x', d => xRight(d[rightGroup] || 0) + 6)
            .text(d => d[rightGroup] || 0);
        
        barGroups.selectAll('.stacked-segment-label, .total-value')
            .transition().duration(400)
            .style('opacity', 0);
        
        leftLabel.transition().duration(300)
            .attr('fill', color(leftGroup))
            .text(`← ${leftGroup}`);
        rightLabel.transition().duration(300)
            .attr('fill', color(rightGroup))
            .text(`${rightGroup} →`);
        
        updateLegendState();
    }
    
    // Function to switch to Stacked mode
    function showStackedMode() {
        viewMode = 'stacked';
        
        centerLine.transition().duration(400).style('opacity', 0);
        xAxisLeft.transition().duration(400).style('opacity', 0);
        xAxisRight.transition().duration(400).style('opacity', 0);
        leftLabel.transition().duration(400).style('opacity', 0);
        rightLabel.transition().duration(400).style('opacity', 0);
        
        xAxisStacked.transition().duration(400).style('opacity', 1);
        stackedLabel.transition().duration(400).style('opacity', 1);
        
        barGroups.selectAll('.left-bar')
            .transition().duration(400)
            .style('opacity', 0);
        
        barGroups.selectAll('.right-bar')
            .transition().duration(400)
            .style('opacity', 0);
        
        ageGroups.forEach((ag, i) => {
            barGroups.selectAll(`.stacked-bar-${i}`)
                .transition().duration(500).delay(i * 100)
                .style('opacity', 1)
                .attr('x', d => {
                    let offset = 0;
                    for (let j = 0; j < i; j++) {
                        offset += xStacked(d[ageGroups[j]] || 0);
                    }
                    return offset;
                })
                .attr('width', d => xStacked(d[ag] || 0));
        });
        
        barGroups.selectAll('.left-value, .right-value')
            .transition().duration(400)
            .style('opacity', 0);
        
        ageGroups.forEach((ag, i) => {
            barGroups.selectAll(`.stacked-label-${i}`)
                .transition().duration(500).delay(i * 100 + 200)
                .style('opacity', 1)
                .attr('x', d => {
                    let offset = 0;
                    for (let j = 0; j < i; j++) {
                        offset += xStacked(d[ageGroups[j]] || 0);
                    }
                    return offset + xStacked(d[ag] || 0) / 2;
                });
        });
        
        barGroups.selectAll('.total-value')
            .transition().duration(500).delay(500)
            .style('opacity', 1);
        
        updateLegendState();
    }
    
    function updateLegendState() {
        legendItems.select('rect')
            .attr('stroke', d => {
                if (viewMode === 'stacked') return 'transparent';
                return (d === leftGroup || d === rightGroup) ? '#fff' : 'transparent';
            })
            .attr('stroke-width', d => {
                if (viewMode === 'stacked') return 0;
                return (d === leftGroup || d === rightGroup) ? 2 : 0;
            });
        
        legendItems.select('.side-indicator')
            .text(d => {
                if (viewMode === 'stacked') return '';
                return d === leftGroup ? '◀ LEFT' : d === rightGroup ? 'RIGHT ▶' : '';
            });
        
        modeButtons.selectAll('rect')
            .attr('fill', (d, i) => {
                if (i === 0 && viewMode === 'compare') return '#6366f1';
                if (i === 1 && viewMode === 'stacked') return '#6366f1';
                return '#e5e7eb';
            });
        
        modeButtons.selectAll('text')
            .filter((d, i, nodes) => i > 0) // Skip the "View Mode:" label
            .attr('fill', function() {
                const parent = d3.select(this.parentNode);
                const rect = parent.select('rect');
                return rect.attr('fill') === '#6366f1' ? '#fff' : '#374151';
            });
    }
    
    // MODE TOGGLE BUTTONS
    const modeButtons = svg.append('g')
        .attr('transform', `translate(0, -60)`);
    
    modeButtons.append('text')
        .attr('x', 0)
        .attr('y', 0)
        .attr('fill', '#333')
        .attr('font-size', '12px')
        .attr('font-weight', '600')
        .text('View Mode:');
    
    // Compare button
    const compareBtn = modeButtons.append('g')
        .attr('transform', 'translate(85, -12)')
        .style('cursor', 'pointer')
        .on('click', showCompareMode);
    
    compareBtn.append('rect')
        .attr('width', 120)
        .attr('height', 28)
        .attr('rx', 14)
        .attr('fill', '#6366f1');
    
    compareBtn.append('text')
        .attr('x', 60)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text('🔄 Compare 2');
    
    // Stacked button
    const stackedBtn = modeButtons.append('g')
        .attr('transform', 'translate(215, -12)')
        .style('cursor', 'pointer')
        .on('click', showStackedMode);
    
    stackedBtn.append('rect')
        .attr('width', 120)
        .attr('height', 28)
        .attr('rx', 14)
        .attr('fill', '#e5e7eb');
    
    stackedBtn.append('text')
        .attr('x', 60)
        .attr('y', 18)
        .attr('text-anchor', 'middle')
        .attr('fill', '#374151')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .text('📊 Show All 4');
    
    // Interactive Legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width + 20}, -40)`);
    
    legend.append('rect')
        .attr('x', -15)
        .attr('y', -35)
        .attr('width', 175)
        .attr('height', ageGroups.length * 45 + 55)
        .attr('fill', '#f9fafb')
        .attr('rx', 10)
        .attr('stroke', '#ddd');
    
    legend.append('text')
        .attr('x', 0)
        .attr('y', -15)
        .attr('fill', '#333')
        .attr('font-weight', '600')
        .attr('font-size', '13px')
        .text('Age Demographics');
    
    legend.append('text')
        .attr('x', 0)
        .attr('y', 2)
        .attr('fill', '#666')
        .attr('font-size', '10px')
        .text('Click to select (Compare mode)');
    
    let clickCount = 0;
    
    const legendItems = legend.selectAll('.legend-item')
        .data(ageGroups)
        .enter().append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 45 + 20})`)
        .style('cursor', 'pointer')
        .on('click', function(event, d) {
            if (viewMode === 'compare') {
                clickCount++;
                if (clickCount % 2 === 1) {
                    leftGroup = d;
                } else {
                    rightGroup = d;
                }
                showCompareMode();
            }
        })
        .on('mouseover', function() {
            d3.select(this).select('rect')
                .transition()
                .duration(150)
                .attr('transform', 'scale(1.1)');
        })
        .on('mouseout', function() {
            d3.select(this).select('rect')
                .transition()
                .duration(150)
                .attr('transform', 'scale(1)');
        });
    
    legendItems.append('rect')
        .attr('width', 24)
        .attr('height', 24)
        .attr('fill', d => color(d))
        .attr('rx', 6)
        .attr('stroke', d => (d === leftGroup || d === rightGroup) ? '#fff' : 'transparent')
        .attr('stroke-width', d => (d === leftGroup || d === rightGroup) ? 2 : 0);
    
    legendItems.append('text')
        .attr('x', 32)
        .attr('y', 12)
        .attr('fill', '#333')
        .attr('font-size', '11px')
        .attr('dy', '0.35em')
        .text(d => d);
    
    legendItems.append('text')
        .attr('class', 'side-indicator')
        .attr('x', 32)
        .attr('y', 28)
        .attr('fill', '#666')
        .attr('font-size', '9px')
        .attr('font-weight', '600')
        .text(d => d === leftGroup ? '◀ LEFT' : d === rightGroup ? 'RIGHT ▶' : '');
}
