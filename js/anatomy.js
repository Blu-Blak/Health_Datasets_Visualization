// ============================================================
// ANATOMY VISUALIZATION - Interactive Human Body Diagram
// ============================================================

// Body system colors (matching CSS variables)
const BODY_COLORS = {
    'Brain/Neurological': '#FF6B6B',
    'Eyes': '#4ECDC4',
    'Ears/Nose/Throat': '#45B7D1',
    'Cardiovascular': '#E74C3C',
    'Respiratory': '#3498DB',
    'Gastrointestinal': '#F39C12',
    'Kidney/Urinary': '#9B59B6',
    'Reproductive': '#E91E63',
    'Musculoskeletal': '#795548',
    'Skin': '#FF9800',
    'Blood/Immune': '#F44336',
    'Endocrine': '#8BC34A',
    'Mental Health': '#673AB7',
};

// Global variables
let bodySystemData = null;
let currentSystem = null;

// Initialize anatomy visualization
async function initAnatomy() {
    try {
        // Load body system stats
        const response = await fetch('data/body_system_stats.json');
        bodySystemData = await response.json();
        
        // Create the SVG body diagram
        await createBodyDiagram();
        
        console.log('Anatomy visualization initialized');
    } catch (error) {
        console.error('Error initializing anatomy:', error);
        showError('anatomy-svg-container', 'Failed to load body system data');
    }
}

// Create SVG body diagram by loading external SVG and adding interactive layers
async function createBodyDiagram() {
    const container = d3.select('#anatomy-svg-container');
    container.html(''); // Clear existing content
    
    try {
        // Load the SVG file
        const svgText = await fetch('assets/human body organ view.svg').then(r => r.text());
        
        // Create a temporary div to parse the SVG
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgText;
        const importedSvg = tempDiv.querySelector('svg');
        
        // Get viewBox from the SVG (129.601 x 464.572)
        const viewBox = importedSvg.getAttribute('viewBox');
        
        // Create our main SVG container
        const svg = container.append('svg')
            .attr('viewBox', viewBox)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .attr('width', '100%')
            .attr('height', '600')
            .style('max-width', '400px')
            .style('margin', '0 auto')
            .style('display', 'block');
        
        // Add the imported SVG content as background
        svg.node().innerHTML = importedSvg.innerHTML;
        
        // Now add interactive overlay regions
        // Based on viewBox: 0 0 129.601 464.572
        const width = 129.601;
        const height = 464.572;
        
        const bodyRegions = [
            // Brain (top of head)
            {
                system: 'Brain/Neurological',
                name: 'Brain',
                shape: 'ellipse',
                cx: 65, cy: 25, rx: 20, ry: 18
            },
            
            // Eyes/ENT (face area)
            {
                system: 'Eyes',
                name: 'Eyes',
                shape: 'rect',
                x: 40, y: 35, width: 30, height: 12
            },

            
            // Throat/Thyroid
            {
                system: 'Ears/Nose/Throat',
                name: 'Throat',
                shape: 'rect',
                x: 55, y: 58, width: 20, height: 15
            },
            //Nose
            {
                system: 'Ears/Nose/Throat',
                name: 'Nose',
                shape: 'ellipse',
                cx: 35, cy: 42, rx: 6, ry: 6
            },

            //Ears
            {
                system: 'Ears/Nose/Throat',
                name: 'Ears',
                shape: 'ellipse',
                cx: 64, cy: 42, rx: 6, ry: 6
            },
            // Thyroid/Endocrine
            {
                system: 'Endocrine',
                name: 'Thyroid',
                shape: 'ellipse',
                cx: 65, cy: 68, rx: 8, ry: 5
            },
            
            // Heart (red heart shape in chest)
            {
                system: 'Cardiovascular',
                name: 'Heart',
                shape: 'ellipse',
                cx: 65, cy: 113, rx: 8, ry: 9
            },
            
            // Left Lung (pink/coral area left chest)
            {
                system: 'Respiratory',
                name: 'Left Lung',
                shape: 'ellipse',
                cx: 48, cy: 115, rx: 15, ry: 28
            },
            
            // Right Lung (pink/coral area right chest)
            {
                system: 'Respiratory',
                name: 'Right Lung',
                shape: 'ellipse',
                cx: 82, cy: 115, rx: 15, ry: 28
            },
            
            // Liver (dark brown/maroon on right side)
            {
                system: 'Gastrointestinal',
                name: 'Liver',
                shape: 'polygon',
                points: '65,125 78,125 88,135 90,150 85,165 75,170 65,168'
            },
            
            // Stomach (pink area left upper abdomen)
            {
                system: 'Gastrointestinal',
                name: 'Stomach',
                shape: 'ellipse',
                cx: 52, cy: 145, rx: 12, ry: 18
            },
            
            // Intestines (coiled pink/tan in lower abdomen)
            {
                system: 'Gastrointestinal',
                name: 'Intestines',
                shape: 'ellipse',
                cx: 65, cy: 185, rx: 20, ry: 25
            },
            

            // Left kidney (pink/coral area left chest)
            {
                system: 'Kidney/Urinary',
                name: 'Left kidney',
                shape: 'ellipse',
                cx: 36, cy: 188, rx: 6, ry: 8
            },
            
            // Right kidney (pink/coral area right chest)
            {
                system: 'Kidney/Urinary',
                name: 'Right kidney',
                shape: 'ellipse',
                cx: 95, cy: 188, rx: 6, ry: 8
            },
            
            // Bladder/Reproductive (lower pelvis pink area)
            {
                system: 'Reproductive',
                name: 'Reproductive',
                shape: 'ellipse',
                cx: 65, cy: 245, rx: 14, ry: 14
            },
            
            // Arms
            {
                system: 'Musculoskeletal',
                name: 'Arms',
                shape: 'rect',
                x: 5, y: 90, width: 20, height: 120
            },
            {
                system: 'Musculoskeletal',
                name: 'Arms',
                shape: 'rect',
                x: 105, y: 90, width: 20, height: 120
            },
            
            // Legs
            {
                system: 'Musculoskeletal',
                name: 'Legs',
                shape: 'rect',
                x: 32, y: 235, width: 25, height: 225
            },
            {
                system: 'Musculoskeletal',
                name: 'Legs',
                shape: 'rect',
                x: 73, y: 235, width: 25, height: 225
            },
            
            // // Blood/Immune (circulatory - near heart)
            // {
            //     system: 'Blood/Immune',
            //     name: 'Circulatory',
            //     shape: 'ellipse',
            //     cx: 65, cy: 100, rx: 8, ry: 12
            // },
            
            // // Skin (full body background)
            // {
            //     system: 'Skin',
            //     name: 'Skin',
            //     shape: 'rect',           
            //     x: 25, y: 0, width: 80, height: 464
            // }
        ];
        
        // Create interactive overlay group
        const interactiveGroup = svg.append('g')
            .attr('class', 'interactive-regions')
            .style('pointer-events', 'all');
        
        // Draw each interactive region
        bodyRegions.forEach((region) => {
            const color = BODY_COLORS[region.system] || '#95A5A6';
            let element;
            
            // Create appropriate shape
            if (region.shape === 'ellipse') {
                element = interactiveGroup.append('ellipse')
                    .attr('cx', region.cx)
                    .attr('cy', region.cy)
                    .attr('rx', region.rx)
                    .attr('ry', region.ry);
            } else if (region.shape === 'rect') {
                element = interactiveGroup.append('rect')
                    .attr('x', region.x)
                    .attr('y', region.y)
                    .attr('width', region.width)
                    .attr('height', region.height)
                    .attr('rx', 3);
            } else if (region.shape === 'polygon') {
                element = interactiveGroup.append('polygon')
                    .attr('points', region.points);
            }
            
            // Apply styling
            if (element) {
                if (region.system === 'Skin') {
                    element
                        .attr('class', 'body-region body-region-skin')
                        .attr('data-system', region.system)
                        .attr('fill', color)
                        .attr('opacity', 0)
                        .attr('stroke', 'none')
                        .style('cursor', 'pointer')
                        .on('mouseenter', function(event) {
                            if (event.target === this) {
                                handleRegionHover(event, region.system, this);
                            }
                        })
                        .on('mouseleave', handleRegionLeave)
                        .on('click', function(event) {
                            handleRegionClick(event, region.system);
                        });
                } else {
                    element
                        .attr('class', 'body-region')
                        .attr('data-system', region.system)
                        .attr('data-name', region.name)
                        .attr('fill', color)
                        .attr('opacity', 0)
                        .attr('stroke', color)
                        .attr('stroke-width', 0)
                        .style('cursor', 'pointer')
                        .on('mouseenter', function(event) {
                            handleRegionHover(event, region.system, this);
                        })
                        .on('mouseleave', handleRegionLeave)
                        .on('click', function(event) {
                            handleRegionClick(event, region.system);
                        });
                }
            }
        });
        
        // Add legend
        createAnatomyLegend(svg, width, height);
        
    } catch (error) {
        console.error('Error loading SVG:', error);
        showError('anatomy-svg-container', 'Failed to load body diagram');
    }
}

// Create legend for anatomy view
function createAnatomyLegend(svg, width, height) {
    // Get the parent container
    const vizContainer = d3.select('#anatomy-svg-container').node().parentElement;
    const parentContainer = d3.select(vizContainer);
    
    // Remove any existing legend
    parentContainer.select('.anatomy-legend').remove();
    
    const legendData = Object.entries(BODY_COLORS).filter(([system]) => 
        bodySystemData && bodySystemData[system]
    );
    
    // Create legend div on the left side
    const legend = parentContainer.insert('div', ':first-child')
        .attr('class', 'anatomy-legend')
        .style('position', 'absolute')
        .style('left', '0')
        .style('top', '0')
        .style('width', '220px')
        .style('padding', '15px')
        .style('background-color', 'rgba(255, 255, 255, 0.95)')
        .style('border-radius', '8px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)')
        .style('max-height', '600px')
        .style('overflow-y', 'auto')
        .style('font-size', '12px');
    
    // Add legend title
    legend.append('div')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('margin-bottom', '12px')
        .style('color', '#333')
        .text('Body Systems');
    
    legendData.forEach(([system, color]) => {
        const count = bodySystemData[system]?.count || 0;
        
        const item = legend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '8px')
            .style('cursor', 'pointer')
            .style('padding', '8px')
            .style('margin-bottom', '4px')
            .style('border-radius', '4px')
            .style('transition', 'all 0.2s')
            .on('click', () => handleRegionClick(null, system))
            .on('mouseenter', function() {
                d3.select(this)
                    .style('background-color', color)
                    .style('color', '#fff')
                    .style('transform', 'translateX(5px)');
            })
            .on('mouseleave', function() {
                d3.select(this)
                    .style('background-color', 'transparent')
                    .style('color', '#333')
                    .style('transform', 'translateX(0)');
            });
        
        item.append('div')
            .style('width', '12px')
            .style('height', '12px')
            .style('background-color', color)
            .style('border-radius', '2px')
            .style('flex-shrink', '0');
        
        item.append('span')
            .style('color', 'inherit')
            .style('font-size', '11px')
            .style('line-height', '1.3')
            .text(`${system} (${count.toLocaleString()})`);
    });
    
    // Adjust the SVG container to make room for legend
    d3.select('#anatomy-svg-container')
        .style('margin-left', '240px');
}

// Handle region hover
function handleRegionHover(event, system, element) {
    // Highlight all regions of the same system
    d3.selectAll(`.body-region[data-system="${system}"]`)
        .attr('opacity', 1)
        .attr('stroke-width', 2);
    
    // Show tooltip
    const stats = bodySystemData[system];
    if (stats) {
        const tooltip = d3.select('#tooltip');
        tooltip.html(`
            <strong>${system}</strong><br/>
            Questions: ${stats.count.toLocaleString()}<br/>
            <em>Click for details</em>
        `)
        .classed('active', true)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    }
}

// Handle region leave
function handleRegionLeave(event) {
    // Reset all regions except active
    d3.selectAll('.body-region').each(function() {
        const elem = d3.select(this);
        if (!elem.classed('active')) {
            elem.attr('opacity', elem.attr('data-system') === 'Skin' ? 0.6 : 0.7)
                .attr('stroke-width', elem.attr('data-system') === 'Skin' ? 4 : 1);
        }
    });
    
    // Hide tooltip
    d3.select('#tooltip').classed('active', false);
}

// Handle region click
function handleRegionClick(event, system) {
    currentSystem = system;
    
    // Remove active class from all regions
    d3.selectAll('.body-region').classed('active', false);
    
    // Add active class to clicked system
    d3.selectAll(`.body-region[data-system="${system}"]`)
        .classed('active', true)
        .attr('opacity', 1);
    
    // Update info panel
    updateInfoPanel(system);
    
    // Hide tooltip
    d3.select('#tooltip').classed('active', false);
}

// Update info panel with system details
function updateInfoPanel(system) {
    const stats = bodySystemData[system];
    if (!stats) return;
    
    const panel = document.getElementById('panel-content');
    const title = document.getElementById('panel-title');
    const closeBtn = document.getElementById('close-panel');
    
    title.textContent = system;
    closeBtn.style.display = 'block';
    
    // Create detailed content
    let html = `
        <div class="detail-section">
            <h4>📊 Overview</h4>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">${stats.count.toLocaleString()}</div>
                    <div class="stat-label">Total Questions</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${stats.top_conditions.length}</div>
                    <div class="stat-label">Conditions</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>🏥 Top Conditions</h4>
            <ul class="detail-list">
                ${stats.top_conditions.slice(0, 10).map((cond, i) => `
                    <li>
                        <strong>${i + 1}.</strong> ${cond.name}
                        <span class="badge" style="background-color: ${BODY_COLORS[system]}; color: white;">
                            ${cond.count}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="detail-section">
            <h4>🩺 Top Symptoms</h4>
            <ul class="detail-list">
                ${stats.top_symptoms.slice(0, 10).map((symp, i) => `
                    <li>
                        <strong>${i + 1}.</strong> ${symp.name}
                        <span class="badge" style="background-color: #95A5A6; color: white;">
                            ${symp.count}
                        </span>
                    </li>
                `).join('')}
            </ul>
        </div>
        
        <div class="detail-section">
            <h4>👥 Age Distribution</h4>
            <div class="detail-list">
                ${Object.entries(stats.age_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([age, count]) => `
                        <li>
                            ${age}: <strong>${count.toLocaleString()}</strong>
                        </li>
                    `).join('')}
            </div>
        </div>
        
        <div class="detail-section">
            <h4>⚧ Gender Distribution</h4>
            <div class="detail-list">
                ${Object.entries(stats.gender_distribution)
                    .sort((a, b) => b[1] - a[1])
                    .map(([gender, count]) => `
                        <li>
                            ${gender}: <strong>${count.toLocaleString()}</strong> 
                            (${((count / stats.count) * 100).toFixed(1)}%)
                        </li>
                    `).join('')}
            </div>
        </div>
        
        ${stats.sample_questions.length > 0 ? `
            <div class="detail-section">
                <h4>📝 Sample Questions</h4>
                <div class="detail-list">
                    ${stats.sample_questions.map((q, i) => `
                        <li style="font-size: 0.85rem; line-height: 1.4;">
                            <em>"${q}"</em>
                        </li>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    panel.innerHTML = html;
    
    // Scroll to top of panel
    panel.scrollTop = 0;
}

// Close panel handler
document.addEventListener('DOMContentLoaded', () => {
    const closeBtn = document.getElementById('close-panel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            // Reset to welcome content
            closeBtn.style.display = 'none';
            document.getElementById('panel-title').textContent = 'Overview';
            
            // Remove active state from regions
            d3.selectAll('.body-region').classed('active', false);
            currentSystem = null;
            
            // Show welcome content
            const panel = document.getElementById('panel-content');
            panel.innerHTML = `
                <div class="welcome-info">
                    <h4>Interactive Body Systems</h4>
                    <p>Click on any body region to explore detailed statistics about medical conditions, symptoms, and demographics.</p>
                    
                    <div class="info-section">
                        <h5>Available Systems:</h5>
                        <ul>
                            ${Object.keys(BODY_COLORS).filter(s => bodySystemData && bodySystemData[s]).map(system => `
                                <li><strong>${system}:</strong> ${bodySystemData[system].count.toLocaleString()} questions</li>
                            `).join('')}
                        </ul>
                    </div>
                </div>
            `;
        });
    }
});

// Show error message
function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #e74c3c;">
            <h3>⚠️ Error</h3>
            <p>${message}</p>
        </div>
    `;
}

// Export for use in main.js
window.initAnatomy = initAnatomy;
