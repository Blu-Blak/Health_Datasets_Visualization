// ============================================================
// TREEMAP / WORD CLOUD VISUALIZATION - MedTrinity-25M Data
// ============================================================

let medtrinityData = null;

/**
 * Initialize the treemap/wordcloud visualization
 */
async function initTreemap() {
    try {
        console.log('Loading MedTrinity-25M data...');
        
        const response = await fetch('data/medtrinity_data.json');
        medtrinityData = await response.json();
        
        console.log('MedTrinity data loaded successfully');
        
        // Create the visualization
        createSpecialtiesView();
        
    } catch (error) {
        console.error('Error loading MedTrinity data:', error);
        document.getElementById('treemap-container').innerHTML = 
            '<p style="color: #e74c3c; text-align: center; padding: 40px;">Error loading data. Please check console for details.</p>';
    }
}

/**
 * Create the complete specialties view with wordcloud only
 */
function createSpecialtiesView() {
    const container = d3.select('#treemap-container');
    container.selectAll('*').remove();
    
    container.html(`
        <div class="specialties-wrapper">
            <div id="wordcloud-view" class="specialty-chart"></div>
        </div>
    `);
    
    // Create word cloud visualization
    createWordCloud();
}

/**
 * Setup toggle between wordcloud and treemap views
 */
function setupViewToggle() {
    const toggleBtns = document.querySelectorAll('.specialties-wrapper .toggle-btn');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.dataset.view;
            document.getElementById('wordcloud-view').style.display = view === 'wordcloud' ? 'flex' : 'none';
            document.getElementById('treemap-view').style.display = view === 'treemap' ? 'flex' : 'none';
        });
    });
}

/**
 * Create Word Cloud visualization
 */
function createWordCloud() {
    const container = d3.select('#wordcloud-view');
    
    const width = 1700;
    const height = 850;
    
    // Word data from medtrinity
    const wordData = medtrinityData.wordcloud_data;
    
    const words = Object.entries(wordData).map(([text, freq]) => ({
        text: text,
        size: freq
    }));
    
    words.sort((a, b) => b.size - a.size);
    
    // Colors matching anatomical regions
    const colors = [
        '#FF6B35', '#F7931E', '#FDC830', '#4CAF50', 
        '#2196F3', '#9C27B0', '#E91E63', '#00BCD4',
        '#8BC34A', '#FF9800', '#673AB7', '#3F51B5',
        '#FF5722', '#CDDC39', '#009688', '#795548'
    ];
    
    const maxFreq = Math.max(...words.map(w => w.size));
    const minFreq = Math.min(...words.map(w => w.size));
    
    function getFontSize(freq) {
        const powerFreq = Math.pow(freq, 0.38);
        const powerMax = Math.pow(maxFreq, 0.38);
        const powerMin = Math.pow(minFreq, 0.38);
        const normalized = (powerFreq - powerMin) / (powerMax - powerMin);
        return 20 + normalized * 120;
    }
    
    function getPadding(fontSize) {
        const minPadding = 4;
        const maxPadding = 10;
        const ratio = (fontSize - 20) / (140 - 20);
        return minPadding + ratio * (maxPadding - minPadding);
    }
    
    const wordsWithSize = words.map((d, index) => {
        const fontSize = getFontSize(d.size);
        return {
            text: d.text,
            size: fontSize,
            freq: d.size,
            padding: getPadding(fontSize),
            rank: index
        };
    });
    
    // Create tooltip
    let tooltip = d3.select('body').select('.wordcloud-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body').append('div')
            .attr('class', 'wordcloud-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px 14px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', 'white')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');
    }
    
    // D3 cloud layout
    const layout = d3.layout.cloud()
        .size([width, height])
        .words(wordsWithSize)
        .padding(d => d.padding)
        .rotate(() => 0)
        .fontSize(d => d.size)
        .spiral('rectangular')
        .on('end', draw);
    
    function draw(words) {
        container.selectAll('svg').remove();
        
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', '#fff')
            .style('border-radius', '10px')
            .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');
        
        const cloud = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);
        
        cloud.selectAll('text')
            .data(words)
            .enter().append('text')
            .attr('class', 'word')
            .style('font-size', d => d.size + 'px')
            .style('font-family', 'Arial, Helvetica, sans-serif')
            .style('font-weight', 'bold')
            .style('fill', (d, i) => colors[i % colors.length])
            .style('cursor', 'pointer')
            .attr('text-anchor', 'middle')
            .attr('transform', d => `translate(${d.x},${d.y})`)
            .text(d => d.text)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .style('opacity', 0.7);
                
                tooltip
                    .style('opacity', 1)
                    .html(`
                        <strong style="color: #4ECDC4; font-size: 14px;">${d.text}</strong><br>
                        <span style="color: #ccc;">Count:</span> ${d.freq.toLocaleString()}<br>
                        <span style="color: #ccc;">Rank:</span> ${d.rank + 1} / ${words.length}
                    `)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(150)
                    .style('opacity', 1);
                tooltip.style('opacity', 0);
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            });
    }
    
    layout.start();
}

/**
 * Create Treemap visualization showing anatomical regions
 */
function createTreemapChart() {
    const container = d3.select('#treemap-view');
    
    const width = 900;
    const height = 550;
    
    // Prepare hierarchical data
    const hierarchyData = {
        name: 'MedTrinity-25M',
        children: medtrinityData.anatomical_regions.map(region => ({
            name: region.name,
            children: region.structures.slice(0, 15).map(s => ({
                name: s.name,
                value: s.count
            }))
        }))
    };
    
    // Color scale for regions
    const regionColors = {
        'H&N (Head & Neck)': '#E74C3C',
        'Thorax': '#3498DB',
        'Other': '#9B59B6',
        'Abdomen': '#F39C12',
        'Pelvic': '#E91E63'
    };
    
    const svg = container.append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('width', '100%')
        .style('max-width', width + 'px')
        .style('height', 'auto')
        .style('background', '#fff')
        .style('border-radius', '10px')
        .style('box-shadow', '0 2px 10px rgba(0,0,0,0.1)');
    
    // Create tooltip
    let tooltip = d3.select('body').select('.treemap-tooltip');
    if (tooltip.empty()) {
        tooltip = d3.select('body').append('div')
            .attr('class', 'treemap-tooltip')
            .style('position', 'absolute')
            .style('padding', '10px 14px')
            .style('background', 'rgba(0,0,0,0.9)')
            .style('color', 'white')
            .style('border-radius', '6px')
            .style('font-size', '13px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 12px rgba(0,0,0,0.3)');
    }
    
    // Create treemap layout
    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value);
    
    d3.treemap()
        .size([width, height])
        .padding(2)
        .paddingTop(20)
        (root);
    
    // Draw region groups
    const regionGroups = svg.selectAll('.region-group')
        .data(root.children)
        .enter().append('g')
        .attr('class', 'region-group');
    
    // Region background
    regionGroups.append('rect')
        .attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => d.y1 - d.y0)
        .attr('fill', d => regionColors[d.data.name] || '#95A5A6')
        .attr('opacity', 0.2)
        .attr('stroke', d => regionColors[d.data.name] || '#95A5A6')
        .attr('stroke-width', 2);
    
    // Region labels
    regionGroups.append('text')
        .attr('x', d => d.x0 + 5)
        .attr('y', d => d.y0 + 14)
        .text(d => d.data.name)
        .attr('fill', d => regionColors[d.data.name] || '#333')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold');
    
    // Draw structure cells
    const cells = svg.selectAll('.cell')
        .data(root.leaves())
        .enter().append('g')
        .attr('class', 'cell')
        .attr('transform', d => `translate(${d.x0},${d.y0})`);
    
    cells.append('rect')
        .attr('width', d => Math.max(0, d.x1 - d.x0 - 1))
        .attr('height', d => Math.max(0, d.y1 - d.y0 - 1))
        .attr('fill', d => {
            const parentName = d.parent.data.name;
            const baseColor = d3.color(regionColors[parentName] || '#95A5A6');
            return baseColor.brighter(0.5);
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('opacity', 0.8);
            
            tooltip
                .style('opacity', 1)
                .html(`
                    <strong style="color: #4ECDC4; font-size: 14px;">${d.data.name}</strong><br>
                    <span style="color: #ccc;">Region:</span> ${d.parent.data.name}<br>
                    <span style="color: #ccc;">Count:</span> ${d.data.value.toLocaleString()}
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            d3.select(this)
                .transition()
                .duration(150)
                .attr('opacity', 1);
            tooltip.style('opacity', 0);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        });
    
    // Add labels to cells
    cells.append('text')
        .attr('x', 4)
        .attr('y', 14)
        .text(d => {
            const width = d.x1 - d.x0;
            if (width > 50) return d.data.name;
            if (width > 30) return d.data.name.substring(0, 4);
            return '';
        })
        .attr('fill', '#333')
        .attr('font-size', d => {
            const width = d.x1 - d.x0;
            return width > 70 ? '11px' : '9px';
        })
        .attr('font-weight', '500')
        .style('pointer-events', 'none');
    
    // Add count labels
    cells.append('text')
        .attr('x', 4)
        .attr('y', 26)
        .text(d => {
            const width = d.x1 - d.x0;
            if (width > 60) {
                if (d.data.value >= 1000000) return (d.data.value / 1000000).toFixed(1) + 'M';
                if (d.data.value >= 1000) return (d.data.value / 1000).toFixed(0) + 'K';
                return d.data.value;
            }
            return '';
        })
        .attr('fill', '#666')
        .attr('font-size', '9px')
        .style('pointer-events', 'none');
}

// Make sure to load d3-cloud library
(function loadD3Cloud() {
    if (typeof d3.layout === 'undefined' || typeof d3.layout.cloud === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/d3-cloud@1.2.5/build/d3.layout.cloud.min.js';
        script.onload = () => console.log('d3-cloud loaded');
        document.head.appendChild(script);
    }
})();
