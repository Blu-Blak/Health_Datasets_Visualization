// ============================================================
// MAIN.JS - Navigation and Global Utilities
// ============================================================

// Global state
let currentVisualization = 'anatomy';
let allDataLoaded = false;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Medical Questions Explorer - Initializing...');
    
    // Setup navigation
    setupNavigation();
    
    // Load initial visualization
    loadVisualization('anatomy');
    
    // Setup tooltip
    setupTooltip();
});

// Setup navigation between visualizations
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const vizType = btn.getAttribute('data-viz');
            
            // Update active button
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Load visualization
            loadVisualization(vizType);
        });
    });
}

// Load and display visualization
async function loadVisualization(vizType) {
    console.log(`Loading visualization: ${vizType}`);
    
    // Show loading indicator
    showLoading();
    
    // Hide all visualizations
    document.querySelectorAll('.visualization').forEach(viz => {
        viz.classList.remove('active');
    });
    
    // Show selected visualization
    const targetViz = document.getElementById(`viz-${vizType}`);
    if (targetViz) {
        targetViz.classList.add('active');
    }
    
    // Initialize the appropriate visualization
    try {
        switch(vizType) {
            case 'anatomy':
                if (typeof initAnatomy === 'function') {
                    await initAnatomy();
                } else {
                    console.error('initAnatomy function not found');
                }
                break;
                
            case 'sunburst':
                if (typeof initSunburst === 'function') {
                    await initSunburst();
                } else {
                    console.error('initSunburst function not found');
                }
                break;
                
            default:
                console.error('Unknown visualization type:', vizType);
        }
        
        currentVisualization = vizType;
        
        // Reset info panel to welcome state
        resetInfoPanel();
        
    } catch (error) {
        console.error(`Error loading ${vizType}:`, error);
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Reset info panel to welcome state
function resetInfoPanel() {
    const closeBtn = document.getElementById('close-panel');
    const panelTitle = document.getElementById('panel-title');
    const panelContent = document.getElementById('panel-content');
    
    if (closeBtn) closeBtn.style.display = 'none';
    
    // Show different content based on current visualization
    if (currentVisualization === 'sunburst') {
        if (panelTitle) panelTitle.textContent = 'Demographics Overview';
        if (panelContent) {
            panelContent.innerHTML = `
                <div class="welcome-info">
                    <h4>Patient Demographics Analysis</h4>
                    <p>Explore how medical questions are distributed across <strong>age groups</strong> and <strong>gender</strong> in two different datasets.</p>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">33.9%</div>
                            <div class="stat-label">Age Identified</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">33.0%</div>
                            <div class="stat-label">Gender Identified</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">7</div>
                            <div class="stat-label">Age Groups</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">2</div>
                            <div class="stat-label">Datasets</div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h5>📊 Key Insights:</h5>
                        <ul>
                            <li><strong>Sunburst Chart:</strong> Shows hierarchical breakdown of age and gender distribution</li>
                            <li><strong>Gender by Disease:</strong> Compare male vs female prevalence across medical conditions</li>
                            <li><strong>Age by Disease:</strong> Analyze how conditions vary across different life stages</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>🔍 What You Can Discover:</h5>
                        <ul>
                            <li>Which age groups have the most medical questions</li>
                            <li>Gender disparities in specific health conditions</li>
                            <li>How diseases cluster by demographic factors</li>
                            <li>Compare patterns between two medical datasets</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>🎯 How to Use:</h5>
                        <ul>
                            <li>Hover over sunburst arcs to see percentages</li>
                            <li>Click arcs for detailed breakdown</li>
                            <li>Use "Compare 2" to see side-by-side comparison</li>
                            <li>Use "Show All 4" to view stacked age groups</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    } else {
        // Default: Body Systems / Anatomy view
        if (panelTitle) panelTitle.textContent = 'Overview';
        if (panelContent) {
            panelContent.innerHTML = `
                <div class="welcome-info">
                    <h4>Welcome to Medical Questions Explorer</h4>
                    <p>This interactive visualization explores <strong>40,644 medical questions</strong> from clinical vignettes.</p>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">40,644</div>
                            <div class="stat-label">Questions</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">14</div>
                            <div class="stat-label">Body Systems</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">33.9%</div>
                            <div class="stat-label">Age Identified</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">33.0%</div>
                            <div class="stat-label">Gender Identified</div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h5>📊 Visualizations Available:</h5>
                        <ul>
                            <li><strong>Body Systems:</strong> Interactive anatomy diagram showing conditions by body region</li>
                            <li><strong>Demographics:</strong> Age and gender distribution in sunburst chart</li>
                        </ul>
                    </div>

                    <div class="info-section">
                        <h5>🎯 How to Use:</h5>
                        <ul>
                            <li>Click on body regions to explore medical conditions</li>
                            <li>Hover over elements for quick information</li>
                            <li>Click on elements for detailed analysis in this panel</li>
                            <li>Switch between views using the navigation buttons above</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }
}

// Setup global tooltip
function setupTooltip() {
    const tooltip = d3.select('#tooltip');
    
    // Hide tooltip when clicking anywhere on the page
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.body-region') && 
            !event.target.closest('.sunburst-arc')) {
            tooltip.classed('active', false);
        }
    });
}

// Show loading indicator
function showLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.classList.add('active');
    }
}

// Hide loading indicator
function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.classList.remove('active');
    }
}

// Show error message
function showError(message) {
    alert(`Error: ${message}\n\nPlease check the console for more details.`);
}

// Utility: Format large numbers
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Utility: Get percentage
function getPercentage(part, total) {
    return ((part / total) * 100).toFixed(1) + '%';
}

// Utility: Truncate text
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// Utility: Create color scale for values
function createColorScale(values, colorRange) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return d3.scaleLinear()
        .domain([min, max])
        .range(colorRange);
}

// Export utilities for other modules
window.utils = {
    formatNumber,
    getPercentage,
    truncateText,
    createColorScale,
    showLoading,
    hideLoading,
    showError
};
