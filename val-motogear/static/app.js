// Main application script for Val MotorGear Inventory Management System
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard navigation
    initNavigation();
    
    // Initialize all button event handlers
    initButtonEvents();
    
    // Initialize modals
    initModals();
    
    // Setup Sale Details Modal close button
    document.querySelectorAll('#sale-details-modal .close-modal').forEach(button => {
        button.addEventListener('click', function() {
            document.getElementById('sale-details-modal').classList.remove('show');
        });
    });
    
    // Load initial data
    loadDashboardData();
    refreshProductsData();
    
    // If we're on the dashboard, initialize charts
    if (document.getElementById('dashboard-tab')) {
        loadLowStockItems();
    }
    
    // Execute dashboard code if on the dashboard page
    if (window.location.pathname === '/dashboard') {
        initDashboard();
        
        // Initialize sorting functionality for all sortable tables
        initTableSorting();
        
        // Initialize activity tabs
        initActivityTabs();
    }
});

// Initialize dashboard functionality
function initDashboard() {
    // Setup navigation
    initNavigation();
    
    // Load initial dashboard data
    loadDashboardData();
    
    // Initialize modals
    initModals();
    
    // Initialize order filters
    initOrderFilters();
    
    // Initialize search filters
    initSearchFilters();
    
    // Initialize filters
    initFilters();
    
    // Setup refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', function() {
        const refreshBtn = this;
        refreshBtn.classList.add('rotating');
        refreshCurrentTab();
        
        // Remove the rotating class after animation completes
        setTimeout(() => {
            refreshBtn.classList.remove('rotating');
            showNotification('Data refreshed successfully');
        }, 1000);
    });
    
    // Initialize all tab-specific button events
    initButtonEvents();
}

// Navigation handling
function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all menu items
            menuItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Get the tab to show
            const tabToShow = this.getAttribute('data-tab');
            
            // Hide all tab contents
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Show the selected tab content
            document.getElementById(`${tabToShow}-tab`).classList.add('active');
            
            // Load data for the tab if needed
            switch(tabToShow) {
                case 'dashboard':
                    loadDashboardData();
                    break;
                case 'inventory':
                    loadInventoryData();
                    break;
                case 'products':
                    loadProductsData();
                    break;
                case 'sales':
                    loadSalesData();
                    break;
                case 'orders':
                    loadOrdersData();
                    break;
                case 'reports':
                    // No initial data load for reports
                    break;
            }
        });
    });
}

// Refresh current active tab
function refreshCurrentTab() {
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const tabId = activeTab.id;
        const tabName = tabId.replace('-tab', '');
        
        switch(tabName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'inventory':
                loadInventoryData();
                break;
            case 'products':
                loadProductsData();
                break;
            case 'sales':
                loadSalesData();
                break;
            case 'orders':
                loadOrdersData();
                break;
        }
    }
}

// Modal functionality
function initModals() {
    // Initialize all modals
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    // Close modal when clicking the X button
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modalId = this.closest('.modal').id;
            closeModal(modalId);
        });
    });
    
    // Close modal when clicking outside of modal content
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Product modal functionality
    initProductModal();
    
    // Inventory modal functionality
    initInventoryModal();
    
    // Sales modal functionality
    initSalesModal();
    
    // Order modal functionality
    initOrderModal();
    
    // Delete confirmation modal
    initDeleteConfirmModal();
}

// Opens a modal by ID
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Closes a modal by ID
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Load dashboard data with enhanced visualizations
function loadDashboardData() {
    // Display current date
    const currentDate = new Date();
    document.getElementById('current-date').textContent = currentDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    // Fetch dashboard data
    fetch('/api/dashboard')
        .then(res => res.json())
        .then(data => {
            // Update stats with trend indicators
            document.getElementById('sales').innerText = data.sales;
            document.getElementById('revenue').innerText = `₱${data.revenue}`;
            document.getElementById('profit').innerText = `₱${data.profit}`;
            document.getElementById('cost').innerText = `₱${data.cost}`;
            
            // Update trend indicators (for demo, these could be calculated from historical data)
            const trends = {
                sales: '+15%',
                revenue: '+12%',
                profit: '+8%',
                cost: '+5%'
            };
            
            document.getElementById('sales-trend').innerText = trends.sales;
            document.getElementById('revenue-trend').innerText = trends.revenue;
            document.getElementById('profit-trend').innerText = trends.profit;
            document.getElementById('cost-trend').innerText = trends.cost;
            
            // Update recent orders
            const recentOrdersTbody = document.getElementById('recent-orders-tbody');
            if (recentOrdersTbody) {
                recentOrdersTbody.innerHTML = '';
                if (data.orders && data.orders.length > 0) {
                    data.orders.slice(0, 5).forEach(order => {
                        let row = `<tr data-id="${order.id}">
                            <td>${order.id}</td>
                            <td>${order.product}</td>
                            <td>${order.category || 'N/A'}</td>
                            <td><span class="status-badge status-${order.status ? order.status.toLowerCase().replace(' ', '-') : 'pending'}">${order.status || 'Pending'}</span></td>
                        </tr>`;
                        recentOrdersTbody.innerHTML += row;
                    });
                } else {
                    recentOrdersTbody.innerHTML = `<tr><td colspan="4" class="empty-table">No recent orders found</td></tr>`;
                }
            }
            
            // Update recent activity
            const recentActivityContainer = document.getElementById('recent-activity');
            if (recentActivityContainer) {
                if (data.recent_activity && data.recent_activity.length > 0) {
                    recentActivityContainer.innerHTML = '';
                    data.recent_activity.forEach(activity => {
                        // Format date for display
                        const activityDate = new Date(activity.date);
                        const formattedDate = activityDate.toLocaleDateString() + ' ' + activityDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                        
                        // Icon based on activity type
                        let icon = 'fa-info-circle';
                        if (activity.type === 'Inventory') icon = 'fa-boxes';
                        if (activity.type === 'Order') icon = 'fa-clipboard-list';
                        if (activity.type === 'Sale') icon = 'fa-shopping-cart';
                        
                        recentActivityContainer.innerHTML += `
                            <div class="activity-item">
                                <div class="activity-icon"><i class="fas ${icon}"></i></div>
                                <div class="activity-details">
                                    <div class="activity-description">${activity.description}</div>
                                    <div class="activity-time">${formattedDate}</div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    recentActivityContainer.innerHTML = `<p class="empty-message">No recent activity</p>`;
                }
            }
            
            // Generate and render charts
            renderDashboardCharts(data);
            
            // Generate system insights
            generateSystemInsights(data);
            
            // Fetch and display low stock inventory items
            fetch('/api/inventory?low_stock=true')
                .then(res => res.json())
                .then(lowStockData => {
                    const lowStockContainer = document.getElementById('low-stock-items');
                    if (lowStockContainer) {
                        if (lowStockData.inventory && lowStockData.inventory.length > 0) {
                            lowStockContainer.innerHTML = '';
                            
                            // Get product details if needed
                            const productPromises = lowStockData.inventory.map(item => {
                                // If product name is missing, fetch it from products API
                                if (!item.product_name && item.product_id) {
                                    return fetch(`/api/products/${item.product_id}`)
                                        .then(res => res.json())
                                        .then(productData => {
                                            if (productData && productData.name) {
                                                item.product_name = productData.name;
                                            }
                                            return item;
                                        })
                                        .catch(() => item); // Return original item on error
                                }
                                return Promise.resolve(item);
                            });
                            
                            // Show low stock items once all product names are resolved
                            Promise.all(productPromises)
                                .then(enrichedItems => {
                                    // Show up to 5 low stock items
                                    enrichedItems.slice(0, 5).forEach(item => {
                                        lowStockContainer.innerHTML += `
                                            <div class="low-stock-item">
                                                <span>${item.product_name || 'Unknown Product'}</span>
                                                <span>${item.quantity} items (${item.location || 'Unknown Location'})</span>
                                            </div>
                                        `;
                                    });
                                });
                        } else {
                            lowStockContainer.innerHTML = `<p>No low stock items at this time</p>`;
                        }
                    }
                })
                .catch(error => {
                    console.error('Error loading low stock items:', error);
                    const lowStockContainer = document.getElementById('low-stock-items');
                    if (lowStockContainer) {
                        lowStockContainer.innerHTML = `<p>Error loading low stock items</p>`;
                    }
                });
        })
        .catch(error => {
            console.error('Error loading dashboard data:', error);
        });
}

// Global search functionality removed

// Function to search across different tabs
function search(term, context) {
    term = term.toLowerCase().trim();
    if (!term) return; // Skip empty searches
    
    console.log(`Searching for "${term}" in ${context}`);
    
    switch (context) {
        case 'global':
            // Search in all tabs - redirect to active tab's search
            const activeTab = document.querySelector('.tab-content.active').id.replace('-tab', '');
            search(term, activeTab);
            break;
        case 'products':
            searchProducts(term);
            break;
        case 'inventory':
            searchInventory(term);
            break;
        case 'sales':
            searchSales(term);
            break;
        case 'orders':
            searchOrders(term);
            break;
    }
}

// Search with term filter
function searchCurrentTab(term) {
    term = term.toLowerCase();
    
    // Determine the active tab
    const activeTab = document.querySelector('.tab-content.active');
    if (!activeTab) return;
    
    const tabId = activeTab.id;
    const tabType = tabId.replace('-tab', '');
    
    switch(tabType) {
        case 'products':
            searchProducts(term);
            break;
        case 'inventory':
            searchInventory(term);
            break;
        case 'sales':
            searchSales(term);
            break;
        case 'orders':
            searchOrders(term);
            break;
        case 'dashboard':
            // For dashboard, we'll search across all data types
            performGlobalSearch(term, null, true);
            break;
    }
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Global search functionality removed
// Navigate to tab
function navigateToTab(tabName) {
    // Find the menu item for this tab and click it
    const menuItem = document.querySelector(`.menu-item[data-tab="${tabName}"]`);
    if (menuItem) {
        menuItem.click();
    }
}

// Render dashboard charts with Chart.js
function renderDashboardCharts(data) {
    // Inventory by Category Chart
    renderInventoryChart();
    
    // Add event listeners for export buttons
    setupExportButtons();
}

// Chart rendering functions are defined below

// Render inventory by category chart
function renderInventoryChart() {
    const ctx = document.getElementById('inventory-chart');
    if (!ctx) return;
    
    // Fetch inventory data for the chart
    fetch('/api/inventory')
        .then(res => res.json())
        .then(data => {
            const inventory = data.inventory || [];
            
            // Group by category
            const categories = {};
            inventory.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (!categories[category]) {
                    categories[category] = 0;
                }
                categories[category] += item.quantity;
            });
            
            // Prepare data for chart
            const labels = Object.keys(categories);
            const quantities = Object.values(categories);
            const backgroundColor = [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)'
            ];
            
            // Create the chart
            if (window.inventoryChart) window.inventoryChart.destroy();
            
            window.inventoryChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Inventory Items',
                        data: quantities,
                        backgroundColor: backgroundColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error loading inventory data for chart:', error);
        });
}

// Generate system insights based on data analysis
function generateSystemInsights(data) {
    const insightsContainer = document.getElementById('system-insights');
    if (!insightsContainer) return;
    
    // Start with empty container
    insightsContainer.innerHTML = '';
    
    // Fetch data for insights
    Promise.all([
        fetch('/api/inventory?low_stock=true').then(res => res.json()),
        fetch('/api/products').then(res => res.json()),
        fetch('/api/orders').then(res => res.json())
    ])
    .then(([lowStockData, productsData, ordersData]) => {
        const lowStock = lowStockData.inventory || [];
        const products = productsData.products || [];
        const orders = ordersData.orders || [];
        
        // Get current date
        const currentDate = new Date();
        
        // Add insights based on data
        
        // Low stock insight
        if (lowStock.length > 0) {
            const insight = document.createElement('div');
            insight.className = 'insight warning';
            insight.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>You have ${lowStock.length} items with low stock that need attention.</span>
            `;
            insightsContainer.appendChild(insight);
        } else {
            const insight = document.createElement('div');
            insight.className = 'insight success';
            insight.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <span>All inventory items have sufficient stock levels.</span>
            `;
            insightsContainer.appendChild(insight);
        }
        
        // Product insights
        const productInsight = document.createElement('div');
        productInsight.className = 'insight';
        productInsight.innerHTML = `
            <i class="fas fa-info-circle"></i>
            <span>You have ${products.length} products in your catalog. The most popular category is ${getMostPopularCategory(products)}.</span>
        `;
        insightsContainer.appendChild(productInsight);
        
        // Order insights
        if (orders.length > 0) {
            const pendingOrders = orders.filter(order => order.status === 'Pending').length;
            if (pendingOrders > 0) {
                const insight = document.createElement('div');
                insight.className = 'insight warning';
                insight.innerHTML = `
                    <i class="fas fa-clock"></i>
                    <span>You have ${pendingOrders} pending orders that need processing.</span>
                `;
                insightsContainer.appendChild(insight);
            }
        }
        
        // Add recommendations based on data analysis
        addRecommendationInsights(insightsContainer, lowStock, products, orders);
    })
    .catch(error => {
        console.error('Error generating insights:', error);
        insightsContainer.innerHTML = `
            <div class="insight danger">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error generating insights. Please try refreshing the dashboard.</span>
            </div>
        `;
    });
}

// Add recommendation insights based on business logic
function addRecommendationInsights(container, lowStock, products, orders) {
    // Sample recommendation based on inventory turnover
    if (products.length > 0) {
        const insight = document.createElement('div');
        insight.className = 'insight';
        insight.innerHTML = `
            <i class="fas fa-lightbulb"></i>
            <span>Consider running a promotion on helmets to boost sales this month.</span>
        `;
        container.appendChild(insight);
    }
    
    // Recommendation for stock optimization
    if (lowStock.length > 0) {
        const lowStockNames = lowStock.slice(0, 3).map(item => item.product_name).join(', ');
        const insight = document.createElement('div');
        insight.className = 'insight warning';
        insight.innerHTML = `
            <i class="fas fa-shopping-cart"></i>
            <span>Suggested restock for: ${lowStockNames}${lowStock.length > 3 ? ' and more...' : ''}</span>
        `;
        container.appendChild(insight);
    }
}

// Helper function to get the most popular category
function getMostPopularCategory(products) {
    const categories = {};
    products.forEach(product => {
        const category = product.category || 'Uncategorized';
        if (!categories[category]) {
            categories[category] = 0;
        }
        categories[category]++;
    });
    
    let maxCount = 0;
    let popularCategory = 'None';
    
    for (const [category, count] of Object.entries(categories)) {
        if (count > maxCount) {
            maxCount = count;
            popularCategory = category;
        }
    }
    
    return popularCategory;
}

// Setup export buttons for reports
function setupExportButtons() {
    // Dashboard export button
    const exportDashboardBtn = document.getElementById('export-dashboard');
    if (exportDashboardBtn) {
        exportDashboardBtn.addEventListener('click', exportDashboardReport);
    }
    
    // Low stock export button
    const exportLowStockBtn = document.getElementById('export-low-stock');
    if (exportLowStockBtn) {
        exportLowStockBtn.addEventListener('click', exportLowStockReport);
    }
    
    // Restock all button
    const restockAllBtn = document.getElementById('restock-all');
    if (restockAllBtn) {
        restockAllBtn.addEventListener('click', function() {
            document.getElementById('inventory-nav').click();
            document.getElementById('add-inventory-btn').click();
            showNotification('Ready to add inventory items');
        });
    }
}

// Export dashboard report as CSV
function exportDashboardReport() {
    // Get current date for filename
    const date = new Date().toISOString().slice(0, 10);
    const filename = `valmotogear_dashboard_report_${date}.csv`;
    
    // Create CSV content
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Metric,Value\n';
    csvContent += `Sales,${document.getElementById('sales').innerText}\n`;
    csvContent += `Revenue,${document.getElementById('revenue').innerText}\n`;
    csvContent += `Profit,${document.getElementById('profit').innerText}\n`;
    csvContent += `Cost,${document.getElementById('cost').innerText}\n`;
    csvContent += '\n';
    csvContent += 'Category,Inventory Count\n';
    
    // Add inventory by category data if available
    if (window.inventoryChart && window.inventoryChart.data) {
        const { labels, datasets } = window.inventoryChart.data;
        labels.forEach((label, index) => {
            csvContent += `${label},${datasets[0].data[index]}\n`;
        });
    }
    
    // Create and trigger download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Dashboard report exported successfully');
}

// Export low stock report as CSV
function exportLowStockReport() {
    // Fetch low stock data
    fetch('/api/inventory?low_stock=true')
        .then(res => res.json())
        .then(data => {
            const lowStock = data.inventory || [];
            
            // Get current date for filename
            const date = new Date().toISOString().slice(0, 10);
            const filename = `valmotogear_low_stock_report_${date}.csv`;
            
            // Create CSV content
            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += 'ID,Product,Category,Quantity,Status,Location\n';
            
            lowStock.forEach(item => {
                csvContent += `${item.id},"${item.product_name}","${item.category || 'N/A'}",${item.quantity},"${item.status}","${item.location || 'N/A'}"\n`;
            });
            
            // Create and trigger download link
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showNotification('Low stock report exported successfully');
        })
        .catch(error => {
            console.error('Error exporting low stock report:', error);
            showNotification('Error exporting report', 'error');
        });
}

// Search products
function searchProducts(term) {
    if (!window.availableProducts) return;
    
    const filteredProducts = window.availableProducts.filter(product => {
        return product.name.toLowerCase().includes(term) || 
               product.brand.toLowerCase().includes(term) || 
               product.category.toLowerCase().includes(term) || 
               (product.description && product.description.toLowerCase().includes(term));
    });
    
    updateProductsTable(filteredProducts);
    showNotification(`Found ${filteredProducts.length} product(s) matching "${term}"`);
}

// Search inventory
function searchInventory(term) {
    // If we have inventory data in memory, filter it directly
    if (window.inventoryData) {
        const filteredInventory = window.inventoryData.filter(item => {
            return item.product_name.toLowerCase().includes(term) || 
                   item.category.toLowerCase().includes(term) || 
                   item.status.toLowerCase().includes(term) || 
                   (item.location && item.location.toLowerCase().includes(term));
        });
        
        updateInventoryTable(filteredInventory);
        showNotification(`Found ${filteredInventory.length} inventory item(s) matching "${term}"`);
    } else {
        // Otherwise, fetch inventory with search parameter
        fetch(`/api/inventory?search=${encodeURIComponent(term)}`)
            .then(res => res.json())
            .then(data => {
                updateInventoryTable(data.inventory);
                showNotification(`Found ${data.inventory.length} inventory item(s) matching "${term}"`);
            })
            .catch(error => {
                console.error('Error searching inventory:', error);
            });
    }
}

// Search sales
function searchSales(term) {
    // Fetch sales with search parameter
    fetch(`/api/sales?search=${encodeURIComponent(term)}`)
        .then(res => res.json())
        .then(data => {
            // Update sales table with results
            if (typeof updateSalesTable === 'function') {
                updateSalesTable(data.sales);
            }
            showNotification(`Found ${data.sales.length} sale(s) matching "${term}"`);
        })
        .catch(error => {
            console.error('Error searching sales:', error);
        });
}

// Search orders
function searchOrders(term) {
    // Fetch orders with search parameter
    fetch(`/api/orders?search=${encodeURIComponent(term)}`)
        .then(res => res.json())
        .then(data => {
            updateOrdersTable(data.orders);
            showNotification(`Found ${data.orders.length} order(s) matching "${term}"`);
        })
        .catch(error => {
            console.error('Error searching orders:', error);
        });
}

// ----------------------
// Products Functionality
// ----------------------

function loadProductsData() {
    fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            updateProductsTable(data.products);
        })
        .catch(error => {
            console.error('Error loading products data:', error);
        });
}

function updateProductsTable(products) {
    const tbody = document.getElementById('products-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-table">No products found</td></tr>`;
            return;
        }
        
        products.forEach(product => {
            let row = `<tr>
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${product.brand}</td>
                <td>${product.category || 'N/A'}</td>
                <td>₱${parseFloat(product.price).toFixed(2)}</td>
                <td>${product.quantity}</td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
        
        // Add event listeners to action buttons
        addProductActionListeners();
    }
}

function addProductActionListeners() {
    // Edit buttons
    document.querySelectorAll('#products-tbody .edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            editProduct(productId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('#products-tbody .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            confirmDelete('product', productId);
        });
    });
}

function initProductModal() {
    // Add Product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            document.getElementById('product-modal-title').textContent = 'Add Product';
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            openModal('product-modal');
        });
    }
    
    // Cancel button
    const cancelProductBtn = document.getElementById('cancel-product');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', function() {
            closeModal('product-modal');
        });
    }
    
    // Form submission
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const productId = document.getElementById('product-id').value;
            const product = {
                name: document.getElementById('product-name').value,
                brand: document.getElementById('product-brand').value,
                category: document.getElementById('product-category').value,
                price: parseFloat(document.getElementById('product-price').value),
                quantity: parseInt(document.getElementById('product-quantity').value),
                description: document.getElementById('product-description').value
            };
            
            if (productId) {
                // Update existing product
                updateProduct(productId, product);
            } else {
                // Add new product
                addProduct(product);
            }
        });
    }
}

function addProduct(product) {
    fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    })
    .then(res => res.json())
    .then(data => {
        closeModal('product-modal');
        showNotification('Product added successfully');
        loadProductsData();
        
        // Track product addition in history
        trackProductHistory('added', data.id || 'new', product.name);
        
        // Refresh dashboard if we're on the dashboard page
        if (typeof window.refreshDashboardActivities === 'function') {
            window.refreshDashboardActivities();
        }
        
        // Refresh products in inventory dropdown
        loadProductsForInventory();
        // Also refresh products in sales dropdown
        loadProductsForSales();
    })
    .catch(error => {
        console.error('Error adding product:', error);
        showNotification('Error adding product', 'error');
    });
}

function editProduct(productId) {
    // Fetch product details first
    fetch(`/api/products/${productId}`)
        .then(res => {
            if (!res.ok) throw new Error('Product not found');
            return res.json();
        })
        .then(data => {
            // Populate the form
            document.getElementById('product-id').value = data.id;
            document.getElementById('product-name').value = data.name;
            document.getElementById('product-brand').value = data.brand;
            document.getElementById('product-category').value = data.category || '';
            document.getElementById('product-price').value = data.price;
            document.getElementById('product-quantity').value = data.quantity;
            document.getElementById('product-description').value = data.description || '';
            
            // Update modal title
            document.getElementById('product-modal-title').textContent = 'Edit Product';
            
            // Show the modal
            openModal('product-modal');
        })
        .catch(error => {
            console.error('Error fetching product details:', error);
            showNotification('Error fetching product details', 'error');
        });
}

function updateProduct(productId, product) {
    fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
    })
    .then(res => res.json())
    .then(data => {
        closeModal('product-modal');
        showNotification('Product updated successfully');
        loadProductsData();
    })
    .catch(error => {
        console.error('Error updating product:', error);
        showNotification('Error updating product', 'error');
    });
}

function deleteProduct(productId) {
    // Get the product name before deletion for history tracking
    fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(productData => {
            const productName = productData.name || `Product #${productId}`;
            
            // Proceed with deletion
            return fetch(`/api/products/${productId}`, {
                method: 'DELETE'
            })
            .then(res => {
                if (!res.ok) {
                    return res.text().then(text => {
                        throw new Error(text || `Server returned ${res.status}`);
                    });
                }
                return res.json();
            })
            .then(data => {
                console.log('Product deletion response:', data);
                showNotification('Product deleted successfully');
                loadProductsData();
                
                // Track product deletion in history
                trackProductHistory('deleted', productId, productName);
                
                // Refresh dashboard if we're on the dashboard page
                if (typeof window.refreshDashboardActivities === 'function') {
                    window.refreshDashboardActivities();
                }
            });
        })
        .catch(error => {
            console.error('Error deleting product:', error);
            showNotification(`Error deleting product: ${error.message || 'Unknown error'}`, 'error');
        });
}

// View sale details - improved functionality
function viewSaleDetails(saleId) {
    console.log('Viewing sale details for ID:', saleId);
    // Show loading overlay instead of just a notification
    showLoading('Loading sale details...');
    
    // Fetch the sale data directly
    fetch(`/api/sales?id=${saleId}`)
        .then(res => {
            console.log('Sale API response status:', res.status);
            if (!res.ok) {
                return res.text().then(text => {
                    throw new Error(text || `Server returned ${res.status}`);
                });
            }
            return res.json();
        })
        .then(data => {
            console.log('Sale data received:', data);
            // Get the sale from the array (should be just one)
            const sale = data.sales.find(s => s.id === parseInt(saleId));
            console.log('Found sale:', sale);
            if (!sale) {
                throw new Error('Sale not found');
            }
            
            // Populate the modal with sale details
            document.getElementById('sale-detail-id').textContent = sale.id;
            document.getElementById('sale-detail-date').textContent = sale.date || 'N/A';
            document.getElementById('sale-detail-customer').textContent = sale.customer || 'N/A';
            document.getElementById('sale-detail-payment').textContent = sale.payment_method || 'N/A';
            document.getElementById('sale-detail-channel').textContent = sale.channel || 'N/A';
            document.getElementById('sale-detail-subtotal').textContent = `₱${parseFloat(sale.subtotal).toFixed(2)}`;
            document.getElementById('sale-detail-tax').textContent = `₱${parseFloat(sale.tax).toFixed(2)}`;
            document.getElementById('sale-detail-total').textContent = `₱${parseFloat(sale.total).toFixed(2)}`;
            document.getElementById('sale-detail-notes').textContent = sale.notes || 'No notes available';
            
            // Populate items table
            const itemsBody = document.getElementById('sale-detail-items');
            itemsBody.innerHTML = '';
            
            if (sale.items && sale.items.length > 0) {
                sale.items.forEach(item => {
                    const subtotal = parseFloat(item.price) * item.quantity;
                    itemsBody.innerHTML += `
                        <tr>
                            <td>${item.product_name}</td>
                            <td>${item.quantity}</td>
                            <td>₱${parseFloat(item.price).toFixed(2)}</td>
                            <td>${item.location || 'Main Storage'}</td>
                            <td>₱${subtotal.toFixed(2)}</td>
                        </tr>
                    `;
                });
            } else {
                itemsBody.innerHTML = `<tr><td colspan="5" class="empty-table">No items found</td></tr>`;
            }
            
            // Show the modal using the dashboard's showModal function
            showModal('sale-details-modal');
            
            // Hide the loading overlay
            hideLoading();
        })
        .catch(error => {
            // Hide the loading overlay first
            hideLoading();
            
            console.error('Error loading sale details:', error);
            showNotification(`Error loading sale details: ${error.message || 'Unknown error'}`, 'error');
        });
}

// Delete a sale
function deleteSale(saleId) {
    // Show loading notification
    showNotification('Deleting sale...', 'info');
    
    fetch(`/api/sales/delete/${saleId}`, {
        method: 'DELETE'
    })
    .then(res => {
        // Check if the response is ok before parsing JSON
        if (!res.ok) {
            // Parse error response
            return res.json().then(errData => {
                throw new Error(errData.error || `Server returned ${res.status}`);
            }).catch(e => {
                // If parsing JSON fails, fall back to text
                return res.text().then(text => {
                    throw new Error(text || `Server returned ${res.status}`);
                });
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Sale deletion response:', data);
        showNotification('Sale deleted successfully');
        loadSalesData();
        
        // Refresh dashboard activities if the function exists
        if (typeof window.refreshDashboardActivities === 'function') {
            window.refreshDashboardActivities();
        }
    })
    .catch(error => {
        console.error('Error deleting sale:', error);
        // Show a more user-friendly error message
        const errorMsg = error.message && error.message.includes('not found') ?
            'This sale no longer exists or has already been deleted.' :
            `Error deleting sale: ${error.message || 'Unknown error. Please try again.'}`;
        showNotification(errorMsg, 'error');
    });
}

// Delete an order
function deleteOrder(orderId) {
    // Show loading notification
    showNotification('Deleting order...', 'info');
    
    fetch(`/api/orders/delete/${orderId}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) {
            // Parse error response
            return res.json().then(errData => {
                throw new Error(errData.error || `Server returned ${res.status}`);
            }).catch(e => {
                // If parsing JSON fails, fall back to text
                return res.text().then(text => {
                    throw new Error(text || `Server returned ${res.status}`);
                });
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Order deletion response:', data);
        showNotification('Order deleted successfully');
        loadOrdersData();
        
        // Refresh dashboard activities if the function exists
        if (typeof window.refreshDashboardActivities === 'function') {
            window.refreshDashboardActivities();
        }
    })
    .catch(error => {
        console.error('Error deleting order:', error);
        // Show a more user-friendly error message
        const errorMsg = error.message && error.message.includes('not found') ?
            'This order no longer exists or has already been deleted.' :
            `Error deleting order: ${error.message || 'Unknown error. Please try again.'}`;
        showNotification(errorMsg, 'error');
    });
}

// ----------------------
// Inventory Functionality
// ----------------------

function loadInventoryData() {
    // Fetch inventory data from API
    fetch('/api/inventory')
        .then(res => res.json())
        .then(data => {
            // Store inventory data globally for searching
            window.inventoryData = data.inventory;
            updateInventoryTable(data.inventory);
        })
        .catch(error => {
            console.error('Error loading inventory data:', error);
            updateInventoryTable([]);
        });
}

function updateInventoryTable(inventory) {
    const tbody = document.getElementById('inventory-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (inventory.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-table">No inventory items found</td></tr>`;
            return;
        }
        
        inventory.forEach(item => {
            let row = `<tr>
                <td>${item.id}</td>
                <td>${item.product_name || item.product || 'Unknown'}</td>
                <td>${item.category || 'N/A'}</td>
                <td>${item.quantity}</td>
                <td>${getStatusBadge(item.status || 'In Stock')}</td>
                <td>${item.last_updated || item.lastUpdated || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${item.id}" onclick="editInventory(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${item.id}" onclick="deleteInventory(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }
}

function initInventoryModal() {
    const inventoryForm = document.getElementById('inventory-form');
    const cancelInventoryBtn = document.getElementById('cancel-inventory');
    
    // Load products into the product selector
    loadProductsForInventory();
    
    // Cancel button
    if (cancelInventoryBtn) {
        cancelInventoryBtn.addEventListener('click', function() {
            closeModal('inventory-modal');
        });
    }
    
    // Form submission
    if (inventoryForm) {
        inventoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather inventory data
            const inventory = {
                product_id: parseInt(document.getElementById('inventory-product').value),
                quantity: parseInt(document.getElementById('inventory-quantity').value),
                location: document.getElementById('inventory-location').value,
                status: document.getElementById('inventory-status').value,
                notes: document.getElementById('inventory-notes').value
            };
            
            if (!inventory.product_id) {
                alert('Please select a product');
                return;
            }
            
            // Submit the inventory
            fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inventory)
            })
            .then(res => {
                if (!res.ok) {
                    return res.json().then(errorData => {
                        throw new Error(errorData.error || 'Failed to add inventory');
                    });
                }
                return res.json();
            })
            .then(data => {
                if (data.error) {
                    throw new Error(data.error);
                }
                
                // Clear the form
                document.getElementById('inventory-form').reset();
                
                // Close modal and show success notification
                closeModal('inventory-modal');
                showNotification(data.message || 'Inventory updated successfully');
                
                // Refresh inventory data and make sure we stay on the inventory tab
                loadInventoryData();
                
                // Make sure we're on the inventory tab
                const menuItems = document.querySelectorAll('.menu-item');
                menuItems.forEach(item => item.classList.remove('active'));
                
                // Find and activate the inventory tab
                const inventoryTab = document.querySelector('.menu-item[data-tab="inventory"]');
                if (inventoryTab) {
                    inventoryTab.classList.add('active');
                }
                
                // Hide all tab contents and show inventory
                const tabContents = document.querySelectorAll('.tab-content');
                tabContents.forEach(tab => tab.classList.remove('active'));
                
                const inventoryContent = document.getElementById('inventory-tab');
                if (inventoryContent) {
                    inventoryContent.classList.add('active');
                }
            })
            .catch(error => {
                console.error('Error adding inventory:', error);
                showNotification(error.message || 'Error adding inventory', 'error');
            });
        });
    }
}

// Load products for the inventory dropdown
function loadProductsForInventory() {
    fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            // Store products for later use if not already stored
            if (!window.availableProducts) {
                window.availableProducts = data.products;
            }
            
            // Populate the product selector
            const productSelector = document.getElementById('inventory-product');
            if (productSelector) {
                productSelector.innerHTML = '<option value="">Select Product</option>';
                
                window.availableProducts.forEach(product => {
                    const option = document.createElement('option');
                    option.value = product.id;
                    option.textContent = `${product.name} (${product.brand}) - ${product.category}`;
                    productSelector.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading products for inventory:', error);
        });
}

// Edit inventory item
function editInventory(inventoryId) {
    // First get the inventory data
    fetch(`/api/inventory/${inventoryId}`)
        .then(res => res.json())
        .then(data => {
            // Set form values
            document.getElementById('inventory-id').value = data.id;
            document.getElementById('inventory-product').value = data.product_id;
            document.getElementById('inventory-quantity').value = data.quantity;
            document.getElementById('inventory-location').value = data.location || '';
            document.getElementById('inventory-status').value = data.status || 'In Stock';
            document.getElementById('inventory-notes').value = data.notes || '';
            
            // Update modal title
            document.getElementById('inventory-modal-title').textContent = 'Edit Inventory';
            
            // Open the modal
            openModal('inventory-modal');
        })
        .catch(error => {
            console.error('Error loading inventory data for edit:', error);
            showNotification('Error loading inventory data', 'error');
        });
}

// Delete inventory item
function deleteInventory(inventoryId) {
    fetch(`/api/inventory/${inventoryId}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (!res.ok) {
            return res.text().then(text => {
                throw new Error(text || `Server returned ${res.status}`);
            });
        }
        return res.json();
    })
    .then(data => {
        console.log('Inventory deletion response:', data);
        showNotification('Inventory item deleted successfully');
        loadInventoryData();
    })
    .catch(error => {
        console.error('Error deleting inventory:', error);
        showNotification(`Error deleting inventory: ${error.message || 'Unknown error'}`, 'error');
    });
}

// ----------------------
// Sales Functionality
// ----------------------

function loadSalesData() {
    // First, fetch regular sales data from the API
    fetch('/api/sales')
        .then(res => res.json())
        .then(salesData => {
            // Next, fetch inventory items with location = 'Sales'
            fetch('/api/inventory?location=Sales')
                .then(res => res.json())
                .then(inventoryData => {
                    // Process inventory items to make them compatible with sales display
                    const salesItems = salesData.sales || [];
                    const inventorySalesItems = [];
                    
                    if (inventoryData.inventory && inventoryData.inventory.length > 0) {
                        // Convert inventory items to a format compatible with sales display
                        inventoryData.inventory.forEach(item => {
                            // Create a synthetic sales record for each inventory item with location=Sales
                            inventorySalesItems.push({
                                id: 'inv-' + item.id,
                                date: item.last_updated || new Date().toISOString().split('T')[0],
                                customer: 'In-Store',
                                payment_method: 'Cash',
                                channel: 'Store',
                                total: 0, // We don't know the sale price
                                items: [{
                                    product_id: item.product_id,
                                    product_name: item.product_name,
                                    quantity: item.quantity,
                                    location: item.location,
                                    price: 0 // We don't know the sale price
                                }]
                            });
                        });
                    }
                    
                    // Combine regular sales with inventory sales items
                    const combinedSales = [...salesItems, ...inventorySalesItems];
                    // Sort by date (newest first)
                    combinedSales.sort((a, b) => new Date(b.date) - new Date(a.date));
                    
                    // Update the sales table with combined data
                    updateSalesTable(combinedSales);
                })
                .catch(error => {
                    console.error('Error loading inventory sales data:', error);
                    // Still show regular sales data
                    updateSalesTable(salesData.sales || []);
                });
        })
        .catch(error => {
            console.error('Error loading sales data:', error);
            updateSalesTable([]);
        });
}

function updateSalesTable(sales) {
    const tbody = document.getElementById('sales-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (sales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-table">No sales found</td></tr>`;
            return;
        }
        
        sales.forEach(sale => {
            // Process product info and locations
            let productsText = '';
            let locationsText = '';
            
            if (sale.items && sale.items.length > 0) {
                // Get product names
                productsText = sale.items.map(item => `${item.product_name} (${item.quantity})`).join(', ');
                
                // Get locations - extract from saved items or check inventory
                const locationsList = [];
                sale.items.forEach(item => {
                    if (item.location) {
                        locationsList.push(item.location);
                    }
                });
                
                locationsText = locationsList.length > 0 ? locationsList.join(', ') : 'N/A';
            }
            
            let row = `<tr>
                <td>${sale.id}</td>
                <td>${sale.date || 'N/A'}</td>
                <td>${sale.customer || 'N/A'}</td>
                <td>${productsText}</td>
                <td>${locationsText}</td>
                <td>₱${parseFloat(sale.total).toFixed(2)}</td>
                <td>${sale.payment_method || 'N/A'}</td>
                <td>${sale.channel || 'N/A'}</td>
                <td class="actions-cell">
                    <button class="action-btn view-btn" data-id="${sale.id}" onclick="viewSaleDetails(${sale.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${sale.id}" onclick="confirmDelete('sale', ${sale.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }
}

function initSalesModal() {
    // Initialize sales modal functionality
    const salesForm = document.getElementById('sales-form');
    const addSaleProductBtn = document.getElementById('add-sale-product');
    const cancelSaleBtn = document.getElementById('cancel-sale');
    
    // Load products into the product selector
    loadProductsForSales();
    
    // Add product row button
    if (addSaleProductBtn) {
        addSaleProductBtn.addEventListener('click', function() {
            addSaleProductRow();
        });
    }
    
    // Cancel button
    if (cancelSaleBtn) {
        cancelSaleBtn.addEventListener('click', function() {
            // Reset the form
            if (salesForm) salesForm.reset();
            
            // Reset product container to initial state
            const container = document.getElementById('sale-products-container');
            if (container) {
                container.innerHTML = `
                    <div class="sale-product-row">
                        <select class="sale-product" required>
                            <option value="">Select Product</option>
                        </select>
                        <input type="number" class="sale-quantity" min="1" value="1" required>
                        <span class="sale-price">₱0.00</span>
                        <button type="button" class="remove-product"><i class="fas fa-times"></i></button>
                    </div>
                `;
                
                // Re-initialize product selectors
                updateProductSelectors();
                
                // Add event listeners to the new row
                const removeBtn = container.querySelector('.remove-product');
                if (removeBtn) {
                    removeBtn.addEventListener('click', function() {
                        this.closest('.sale-product-row').remove();
                        calculateSaleTotal();
                    });
                }
                
                const quantityInput = container.querySelector('.sale-quantity');
                if (quantityInput) {
                    quantityInput.addEventListener('input', function() {
                        calculateSaleTotal();
                    });
                }
            }
            
            // Reset totals
            document.getElementById('sale-subtotal').textContent = '₱0.00';
            document.getElementById('sale-tax').textContent = '₱0.00';
            document.getElementById('sale-total').textContent = '₱0.00';
            
            // Close the modal
            closeModal('sales-modal');
        });
    }
    
    // Form submission
    if (salesForm) {
        salesForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather sale data
            const sale = {
                date: document.getElementById('sale-date').value,
                customer: document.getElementById('sale-customer').value,
                payment_method: document.getElementById('sale-payment').value,
                channel: document.getElementById('sale-channel').value,
                notes: document.getElementById('sale-notes').value,
                subtotal: parseFloat(document.getElementById('sale-subtotal').innerText.replace('₱', '')),
                tax: parseFloat(document.getElementById('sale-tax').innerText.replace('₱', '')),
                total: parseFloat(document.getElementById('sale-total').innerText.replace('₱', '')),
                items: []
            };
            
            // Get sale items
            const saleProductRows = document.querySelectorAll('.sale-product-row');
            let hasItems = false;
            
            saleProductRows.forEach(row => {
                const productSelect = row.querySelector('.sale-product');
                const quantityInput = row.querySelector('.sale-quantity');
                
                if (productSelect.value) {
                    hasItems = true;
                    const productId = parseInt(productSelect.value);
                    const quantity = parseInt(quantityInput.value);
                    const price = parseFloat(row.querySelector('.sale-price').getAttribute('data-price') || 0);
                    const location = productSelect.options[productSelect.selectedIndex].getAttribute('data-location') || '';
                    
                    sale.items.push({
                        product_id: productId,
                        quantity: quantity,
                        price: price,
                        location: location
                    });
                }
            });
            
            if (!hasItems) {
                alert('Please add at least one product to the sale');
                return;
            }
            
            // Submit the sale
            fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sale)
            })
            .then(res => res.json())
            .then(data => {
                closeModal('sales-modal');
                showNotification('Sale recorded successfully');
                
                
                // Refresh sales data if on sales tab
                if (document.querySelector('.tab-content.active').id === 'sales-tab') {
                    loadSalesData();
                }
                
                // Refresh dashboard activities to ensure sale shows in activity/history
                if (typeof window.refreshDashboardActivities === 'function') {
                    window.refreshDashboardActivities();
                }
            })
            .catch(error => {
                console.error('Error recording sale:', error);
                showNotification('Error recording sale', 'error');
            });
        });
    }
}

// Sales functions
// --------------------

// Load products for the sales dropdown
function loadProductsForSales() {
    // Clear any previously loaded products
    window.productsForSale = [];
    
    // First fetch products
    fetch('/api/products')
        .then(res => res.json())
        .then(data => {
            if (!data.products || !Array.isArray(data.products)) {
                console.error('Invalid product data received');
                return Promise.reject('Invalid product data');
            }
            
            // Store valid products temporarily
            const validProducts = [];
            
            // Process each product to ensure no undefined values
            data.products.forEach(product => {
                if (product && product.id) {
                    validProducts.push({
                        id: product.id,
                        name: product.name || 'Unnamed Product',
                        brand: product.brand || '',
                        category: product.category || '',
                        price: parseFloat(product.price || 0).toFixed(2),
                        description: product.description || ''
                    });
                }
            });
            
            // Fetch inventory to get quantity and location information
            return fetch('/api/inventory')
                .then(res => res.json())
                .then(invData => {
                    // Prepare final product list for sales dropdown
                    window.productsForSale = [];
                    
                    if (invData.inventory && Array.isArray(invData.inventory)) {
                        // Process inventory items with proper quantity
                        invData.inventory.forEach(invItem => {
                            if (!invItem || !invItem.product_id) return;
                            
                            // Find the matching product
                            const product = validProducts.find(p => p.id === invItem.product_id);
                            if (!product) return;
                            
                            // Create a clean sales product entry
                            window.productsForSale.push({
                                id: invItem.id, // Use inventory ID as unique identifier
                                product_id: invItem.product_id,
                                name: product.name,
                                brand: product.brand,
                                category: product.category,
                                price: product.price,
                                location: invItem.location || 'Main Storage',
                                quantity: parseInt(invItem.quantity || 0),
                                inventoryStatus: invItem.status || 'In Stock'
                            });
                        });
                    }
                    
                    // Update product selectors with our clean data
                    updateProductSelectors();
                })
                .catch(error => {
                    console.error('Error loading inventory data:', error);
                    window.productsForSale = [];
                    updateProductSelectors();
                });
        })
        .catch(error => {
            console.error('Error loading products for sales:', error);
            window.productsForSale = [];
            updateProductSelectors();
        });
}

// Update all product selectors with available products
function updateProductSelectors() {
    // Check if we have valid product data
    if (!window.productsForSale || !Array.isArray(window.productsForSale) || window.productsForSale.length === 0) {
        console.log('No products available for sale');
        return;
    }
    
    // Get all product selectors in the form
    const productSelectors = document.querySelectorAll('.sale-product');
    
    // For each selector, populate with clean product data
    productSelectors.forEach(selector => {
        // Remember the current selection to restore it if possible
        const currentValue = selector.value;
        
        // Clear and initialize selector
        selector.innerHTML = '<option value="">Select Product</option>';
        
        // Sort products by category and name for better organization
        const sortedProducts = [...window.productsForSale].sort((a, b) => {
            if ((a.category || '') < (b.category || '')) return -1;
            if ((a.category || '') > (b.category || '')) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });
        
        // Add each product to the selector
        sortedProducts.forEach(product => {
            // Skip invalid products
            if (!product || !product.name) return;
            
            // Create a new option element
            const option = document.createElement('option');
            option.value = product.id;
            
            // Prepare display text components - only include non-empty values
            const displayComponents = [];
            
            // Product name is always included
            displayComponents.push(product.name);
            
            // Only include brand if it exists and isn't empty
            if (product.brand && product.brand.trim()) {
                displayComponents.push(`(${product.brand})`);
            }
            
            // Build the display text from components
            option.textContent = displayComponents.join(' ') + 
                (product.location ? ` [${product.location}]` : '') + 
                ` - ₱${product.price}`;
                
            // Set data attributes for price calculation and inventory tracking
            option.setAttribute('data-price', product.price);
            option.setAttribute('data-product-id', product.product_id);
            option.setAttribute('data-location', product.location || '');
            option.setAttribute('data-quantity', product.quantity || 0);
            
            // Add the option to the selector
            selector.appendChild(option);
        });
        
        // Restore previously selected value if possible
        if (currentValue && selector.querySelector(`option[value="${currentValue}"]`)) {
            selector.value = currentValue;
        }
        
        // Add event listener for product selection change
        selector.addEventListener('change', function() {
            updateSaleItemPrice(this);
            calculateSaleTotal();
        });
    });
}

// Add a new product row to the sale
function addSaleProductRow() {
    const container = document.getElementById('sale-products-container');
    if (!container) return;
    
    const newRow = document.createElement('div');
    newRow.className = 'sale-product-row';
    newRow.innerHTML = `
        <select class="sale-product" required>
            <option value="">Select Product</option>
        </select>
        <input type="number" class="sale-quantity" min="1" value="1" required>
        <span class="sale-price">₱0.00</span>
        <button type="button" class="remove-product"><i class="fas fa-times"></i></button>
    `;
    container.appendChild(newRow);
    
    // Populate the new product selector
    updateProductSelectors();
    
    // Add event listener to remove button
    const removeBtn = newRow.querySelector('.remove-product');
    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            newRow.remove();
            calculateSaleTotal();
        });
    }
    
    // Add event listener to quantity input
    const quantityInput = newRow.querySelector('.sale-quantity');
    if (quantityInput) {
        quantityInput.addEventListener('input', function() {
            calculateSaleTotal();
        });
    }
}

// Update the price display for a sale item based on selected product
function updateSaleItemPrice(selectElement) {
    const row = selectElement.closest('.sale-product-row');
    const priceElement = row.querySelector('.sale-price');
    
    if (selectElement.value) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        const price = selectedOption.getAttribute('data-price');
        priceElement.setAttribute('data-price', price);
        priceElement.textContent = `₱${parseFloat(price).toFixed(2)}`;
    } else {
        priceElement.setAttribute('data-price', '0');
        priceElement.textContent = '₱0.00';
    }
}

// Calculate total for the entire sale
function calculateSaleTotal() {
    let subtotal = 0;

    // Get all product rows
    const saleRows = document.querySelectorAll('.sale-product-row');
    
    // Process each row
    saleRows.forEach(row => {
        const productSelect = row.querySelector('.sale-product');
        const quantityInput = row.querySelector('.sale-quantity');
        const priceElement = row.querySelector('.sale-price');

        // Skip rows without valid product selection
        if (!productSelect || !productSelect.value || productSelect.selectedIndex < 1) return;
        
        // Get the selected product option
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        if (!selectedOption) return;
        
        // Get the price from the option's data attribute
        const price = parseFloat(selectedOption.getAttribute('data-price') || 0);
        
        // Get quantity (default to 1 if not valid)
        const quantity = quantityInput && quantityInput.value ? 
            Math.max(1, parseInt(quantityInput.value)) : 1;
        
        // Calculate row total
        const rowTotal = price * quantity;
        
        // Add to subtotal
        subtotal += rowTotal;
        
        // Update the row price display
        if (priceElement) {
            priceElement.textContent = `₱${rowTotal.toFixed(2)}`;
        }
    });

    // Calculate tax (12%) and total
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    // Update totals in the summary section
    const elements = {
        subtotal: document.getElementById('sale-subtotal'),
        tax: document.getElementById('sale-tax'),
        total: document.getElementById('sale-total')
    };

    // Format and display all totals
    if (elements.subtotal) elements.subtotal.textContent = `₱${subtotal.toFixed(2)}`;
    if (elements.tax) elements.tax.textContent = `₱${tax.toFixed(2)}`;
    if (elements.total) elements.total.textContent = `₱${total.toFixed(2)}`;
}

// Update the price display for a sale item based on selected product
function updateSaleItemPrice(productSelect) {
    if (!productSelect) return;
    
    const row = productSelect.closest('.sale-product-row');
    if (!row) return;
    
    const priceElement = row.querySelector('.sale-price');
    const quantityInput = row.querySelector('.sale-quantity');
    
    if (!priceElement) return;
    
    // Reset default values
    priceElement.setAttribute('data-price', 0);
    priceElement.textContent = '₱0.00';
    
    // If a product is selected
    if (productSelect.value && productSelect.selectedIndex > 0) {
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        
        if (selectedOption) {
            // Extract the price (with fallback to prevent NaN)
            const price = parseFloat(selectedOption.getAttribute('data-price') || 0);
            
            // Get the quantity (with fallback to prevent NaN)
            let quantity = 1;
            if (quantityInput && quantityInput.value) {
                quantity = Math.max(1, parseInt(quantityInput.value) || 1);
            }
            
            // Calculate the line item total
            const lineTotal = price * quantity;
            
            // Update price element with the correct value
            priceElement.setAttribute('data-price', price);
            priceElement.textContent = `₱${lineTotal.toFixed(2)}`;
            
            // Update quantity limits based on available stock
            const maxQuantity = parseInt(selectedOption.getAttribute('data-quantity') || 0);
            if (quantityInput && maxQuantity > 0) {
                quantityInput.setAttribute('max', maxQuantity);
                if (parseInt(quantityInput.value) > maxQuantity) {
                    quantityInput.value = maxQuantity;
                    // Recalculate with the new quantity
                    const newTotal = price * maxQuantity;
                    priceElement.textContent = `₱${newTotal.toFixed(2)}`;
                }
            }
            
            return;
        }
    }
}

// ----------------------
// Orders Functionality
// ----------------------

function loadOrdersData(statusFilter = '') {
    let url = '/api/orders';
    if (statusFilter) {
        url += `?status=${statusFilter}`;
    }
    
    fetch(url)
        .then(res => res.json())
        .then(data => {
            updateOrdersTable(data.orders);
        })
        .catch(error => {
            console.error('Error loading orders data:', error);
            updateOrdersTable([]);
        });
}

function updateOrdersTable(orders) {
    const tbody = document.getElementById('orders-tbody');
    if (tbody) {
        tbody.innerHTML = '';
        if (orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-table">No orders found</td></tr>`;
            return;
        }
        
        orders.forEach(order => {
            let row = `<tr>
                <td>${order.id}</td>
                <td>${order.date || 'N/A'}</td>
                <td>${order.product}</td>
                <td>${order.category}</td>
                <td>${order.sales_channel}</td>
                <td>${order.instruction}</td>
                <td>${order.items}</td>
                <td>${getStatusBadge(order.status)}</td>
                <td class="actions-cell">
                    <button class="action-btn edit-btn" data-id="${order.id}" onclick="editOrder(${order.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-id="${order.id}" onclick="confirmDelete('order', ${order.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    }
}

function editOrder(orderId) {
    // Fetch order details
    fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(order => {
            // Populate the form
            document.getElementById('order-id').value = order.id;
            document.getElementById('order-product').value = order.product || '';
            document.getElementById('order-category').value = order.category || '';
            document.getElementById('order-channel').value = order.sales_channel || '';
            document.getElementById('order-instructions').value = order.instruction || '';
            document.getElementById('order-items').value = order.items || 1;
            document.getElementById('order-status').value = order.status || 'Pending';
            
            // Update modal title
            document.getElementById('order-modal-title').textContent = 'Edit Order';
            
            // Show the modal
            openModal('order-modal');
        })
        .catch(error => {
            console.error('Error fetching order details:', error);
            showNotification('Error fetching order details', 'error');
        });
}

function initOrderModal() {
    const orderForm = document.getElementById('order-form');
    const cancelOrderBtn = document.getElementById('cancel-order');
    
    // Cancel button
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', function() {
            closeModal('order-modal');
        });
    }
    
    // Form submission
    if (orderForm) {
        orderForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Gather order data
            const order = {
                date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
                product: document.getElementById('order-product').value,
                category: document.getElementById('order-category').value,
                sales_channel: document.getElementById('order-channel').value,
                instruction: document.getElementById('order-instructions').value, // Match the backend field name
                items: parseInt(document.getElementById('order-items').value),
                status: document.getElementById('order-status').value
            };
            
            // Get the order ID if editing
            const orderId = document.getElementById('order-id').value;
            
            // Submit the order
            const url = orderId ? `/api/orders/${orderId}` : '/api/orders';
            const method = orderId ? 'PUT' : 'POST';
            
            fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            })
            .then(res => res.json())
            .then(data => {
                closeModal('order-modal');
                showNotification(`Order ${orderId ? 'updated' : 'created'} successfully`);
                
                
                // Refresh orders data if on orders tab
                if (document.querySelector('.tab-content.active').id === 'orders-tab') {
                    loadOrdersData();
                }
                // Also refresh dashboard data to show recent activities
                loadDashboardData();
                
                // Refresh dashboard activities specifically to ensure order shows in Recent Activity
                if (typeof window.refreshDashboardActivities === 'function') {
                    window.refreshDashboardActivities();
                }
            })
            .catch(error => {
                console.error('Error saving order:', error);
                showNotification('Error saving order', 'error');
            });
        });
    }
}



// ----------------------
// Product History Tracking
// ----------------------

/**
 * Track product addition or deletion in history
 * @param {string} action - 'added' or 'deleted'
 * @param {number} productId - The ID of the product
 * @param {string} productName - The name of the product 
 */
function trackProductHistory(action, productId, productName) {
    console.log(`Tracking product ${action}: ${productName} (ID: ${productId})`);
    
    // If we're on the dashboard page, refresh the history tab
    if (typeof window.fetchProductHistory === 'function') {
        // Expose fetchProductHistory globally from dashboard-activity.js
        window.fetchProductHistory();
    }
}

// ----------------------
// Delete Confirmation
// ----------------------

function initDeleteConfirmModal() {
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const closeModalBtn = document.querySelector('#delete-confirm-modal .close-modal');
    
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            hideModal('delete-confirm-modal');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            hideModal('delete-confirm-modal');
        });
    }
    
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            const itemType = this.getAttribute('data-type');
            const itemId = this.getAttribute('data-id');
            
            if (itemType && itemId) {
                deleteItem(itemType, itemId);
                closeModal('delete-confirm-modal');
            }
        });
    }
}

function confirmDelete(itemType, itemId) {
    console.log(`Confirming delete for ${itemType} with ID: ${itemId}`);
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.setAttribute('data-type', itemType);
        confirmDeleteBtn.setAttribute('data-id', itemId);
        
        // Set up click handler for the confirm button
        confirmDeleteBtn.onclick = function() {
            deleteItem(itemType, itemId);
        };
        
        // Use the standard modal display function
        showModal('delete-confirm-modal');
    }
}

function deleteItem(itemType, itemId) {
    // Close the confirmation modal
    hideModal('delete-confirm-modal');
    
    // Show loading notification
    showNotification(`Deleting ${itemType}...`, 'info');
    
    // Detect item type and call appropriate delete function
    switch(itemType) {
        case 'product':
            deleteProduct(itemId);
            break;
        case 'inventory':
            deleteInventory(itemId);
            break;
        case 'sale':
            deleteSale(itemId);
            break;
        case 'order':
            deleteOrder(itemId);
            break;
        default:
            console.error('Unknown item type:', itemType);
            showNotification(`Error: Unknown item type '${itemType}'`, 'error');
    }
}

// Delete an order
function deleteOrder(orderId) {
    fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(data => {
        showNotification('Order deleted successfully');
        loadOrdersData();
        // Also refresh dashboard data to show recent activities
        loadDashboardData();
    })
    .catch(error => {
        console.error('Error deleting order:', error);
        showNotification('Error deleting order', 'error');
    });
}

// ----------------------
// Settings Functionality
// ----------------------



// ----------------------
// Utility Functions
// ----------------------

function getStatusBadge(status) {
    const statusLower = status ? status.toLowerCase() : 'pending';
    let emoji = '🟡'; // Default yellow for pending
    
    // Set appropriate emoji based on status
    if (statusLower === 'confirmed' || statusLower === 'approved') {
        emoji = '🟢'; // Green for confirmed/approved
    } else if (statusLower === 'cancelled') {
        emoji = '🔴'; // Red for cancelled
    } else if (statusLower === 'completed' || statusLower === 'delivered' || statusLower === 'shipped') {
        emoji = '🔵'; // Blue for completed/delivered/shipped
    }
    
    return `<span class="status-badge status-${statusLower}">${emoji} ${status || 'Pending'}</span>`;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (notification) {
        // Set message text
        notification.textContent = message;
        
        // Set appropriate class based on type
        notification.className = 'notification';
        notification.classList.add(type);
        
        // Show the notification
        notification.classList.add('show');
        
        // Automatically hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
}

function hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.remove('show');
    }
}

function initTableSorting() {
    // Get all sortable tables
    const sortableTables = document.querySelectorAll('table.data-table');
    
    sortableTables.forEach(table => {
        const sortableHeaders = table.querySelectorAll('th.sortable');
        
        // Add click event listeners to all sortable headers
        sortableHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const sortKey = this.getAttribute('data-sort');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const tableId = table.id;
                
                // Determine sort direction - toggle between asc and desc
                let sortDirection = 'asc';
                if (this.classList.contains('sorted-asc')) {
                    sortDirection = 'desc';
                    this.classList.remove('sorted-asc');
                    this.classList.add('sorted-desc');
                } else {
                    // Remove sorted classes from all headers
                    sortableHeaders.forEach(h => {
                        h.classList.remove('sorted-asc', 'sorted-desc');
                    });
                    this.classList.add('sorted-asc');
                }
                
                // Sort the rows
                sortTableRows(rows, sortKey, sortDirection, tableId);
                
                // Add animation class to all rows
                rows.forEach(row => {
                    row.classList.add('sort-animation');
                    setTimeout(() => row.classList.remove('sort-animation'), 500);
                });
                
                // Clear the tbody and re-append the sorted rows
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
                
                // Show notification
                showNotification(`Table sorted by ${sortKey} (${sortDirection === 'asc' ? 'Ascending' : 'Descending'})`);
            });
        });
    });
}

// Function to sort table rows
function sortTableRows(rows, sortKey, direction, tableId) {
    rows.sort((a, b) => {
        let aValue, bValue;
        
        // Extract values based on the table and sort key
        if (tableId === 'inventory-table') {
            if (sortKey === 'id') {
                aValue = parseInt(a.cells[0].textContent.trim()) || 0;
                bValue = parseInt(b.cells[0].textContent.trim()) || 0;
            } else if (sortKey === 'product') {
                aValue = a.cells[1].textContent.trim().toLowerCase();
                bValue = b.cells[1].textContent.trim().toLowerCase();
            } else if (sortKey === 'category') {
                aValue = a.cells[2].textContent.trim().toLowerCase();
                bValue = b.cells[2].textContent.trim().toLowerCase();
            } else if (sortKey === 'quantity') {
                aValue = parseInt(a.cells[3].textContent.trim()) || 0;
                bValue = parseInt(b.cells[3].textContent.trim()) || 0;
            } else if (sortKey === 'status') {
                aValue = a.cells[4].textContent.trim().toLowerCase();
                bValue = b.cells[4].textContent.trim().toLowerCase();
            } else if (sortKey === 'updated') {
                aValue = new Date(a.cells[5].textContent.trim());
                bValue = new Date(b.cells[5].textContent.trim());
                if (isNaN(aValue)) aValue = new Date(0);
                if (isNaN(bValue)) bValue = new Date(0);
            }
        } else if (tableId === 'recent-orders-table') {
            if (sortKey === 'id') {
                aValue = parseInt(a.cells[0].textContent.trim()) || 0;
                bValue = parseInt(b.cells[0].textContent.trim()) || 0;
            } else if (sortKey === 'product') {
                aValue = a.cells[1].textContent.trim().toLowerCase();
                bValue = b.cells[1].textContent.trim().toLowerCase();
            } else if (sortKey === 'category') {
                aValue = a.cells[2].textContent.trim().toLowerCase();
                bValue = b.cells[2].textContent.trim().toLowerCase();
            } else if (sortKey === 'status') {
                // Status is inside a span, so we need to extract the text
                aValue = a.cells[3].textContent.trim().toLowerCase();
                bValue = b.cells[3].textContent.trim().toLowerCase();
            }
        } else {
            // Generic sorting for other tables
            const cellIndex = Array.from(a.parentNode.querySelector('tr').cells)
                .findIndex(cell => cell.getAttribute('data-sort') === sortKey);
            
            if (cellIndex !== -1) {
                const aCell = a.cells[cellIndex];
                const bCell = b.cells[cellIndex];
                
                if (aCell && bCell) {
                    aValue = aCell.textContent.trim().toLowerCase();
                    bValue = bCell.textContent.trim().toLowerCase();
                    
                    // Try to parse numbers if possible
                    if (!isNaN(parseFloat(aValue)) && !isNaN(parseFloat(bValue))) {
                        aValue = parseFloat(aValue);
                        bValue = parseFloat(bValue);
                    }
                }
            }
        }
        
        // Compare the values
        let result;
        if (aValue === undefined || bValue === undefined) {
            result = 0;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
            result = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
            result = aValue - bValue;
        } else {
            result = String(aValue).localeCompare(String(bValue));
        }
        
        // Apply direction
        return direction === 'asc' ? result : -result;
    });
    
    return rows;
}

function initSearchFilters() {
    // Product search filter
    const productSearch = document.getElementById('product-search');
    if (productSearch) {
        productSearch.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    // Fetch filtered products
                    fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
                        .then(res => res.json())
                        .then(data => {
                            updateProductsTable(data.products);
                        })
                        .catch(error => {
                            console.error('Error searching products:', error);
                        });
                } else {
                    // If empty search, load all products
                    loadProductsData();
                }
            }
        });
    }
    
    // Product category filter
    const productCategoryFilter = document.getElementById('product-category-filter');
    if (productCategoryFilter) {
        productCategoryFilter.addEventListener('change', function() {
            const category = this.value;
            if (category) {
                // Fetch filtered products by category
                fetch(`/api/products?category=${encodeURIComponent(category)}`)
                    .then(res => res.json())
                    .then(data => {
                        updateProductsTable(data.products);
                    })
                    .catch(error => {
                        console.error('Error filtering products by category:', error);
                    });
            } else {
                // If no category selected, load all products
                loadProductsData();
            }
        });
    }
    
    // Inventory category filter
    const inventoryCategoryFilter = document.getElementById('inventory-category-filter');
    if (inventoryCategoryFilter) {
        inventoryCategoryFilter.addEventListener('change', function() {
            const category = this.value;
            // Apply filter to inventory data
            if (window.inventoryData) {
                let filteredInventory = window.inventoryData;
                
                if (category) {
                    filteredInventory = filteredInventory.filter(item => 
                        item.category.toLowerCase() === category.toLowerCase());
                }
                
                // Also apply status filter if active
                const statusFilter = document.getElementById('inventory-status-filter');
                if (statusFilter && statusFilter.value) {
                    const status = statusFilter.value;
                    filteredInventory = filteredInventory.filter(item => 
                        item.status.toLowerCase() === status.toLowerCase());
                }
                
                updateInventoryTable(filteredInventory);
            }
        });
    }
    
    // Inventory status filter
    const inventoryStatusFilter = document.getElementById('inventory-status-filter');
    if (inventoryStatusFilter) {
        inventoryStatusFilter.addEventListener('change', function() {
            const status = this.value;
            // Apply filter to inventory data
            if (window.inventoryData) {
                let filteredInventory = window.inventoryData;
                
                if (status) {
                    filteredInventory = filteredInventory.filter(item => 
                        item.status.toLowerCase() === status.toLowerCase());
                }
                
                // Also apply category filter if active
                const categoryFilter = document.getElementById('inventory-category-filter');
                if (categoryFilter && categoryFilter.value) {
                    const category = categoryFilter.value;
                    filteredInventory = filteredInventory.filter(item => 
                        item.category.toLowerCase() === category.toLowerCase());
                }
                
                updateInventoryTable(filteredInventory);
            }
        });
    }
    
    // Inventory search
    const inventorySearch = document.getElementById('inventory-search');
    if (inventorySearch) {
        inventorySearch.addEventListener('keyup', debounce(function(e) {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                fetch(`/api/inventory?search=${encodeURIComponent(searchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        updateInventoryTable(data.inventory);
                    })
                    .catch(error => {
                        console.error('Error searching inventory:', error);
                        showNotification('Error searching inventory', 'error');
                    });
            } else if (e.key === 'Backspace' && searchTerm === '') {
                // If search is cleared, load all inventory
                loadInventoryData();
            }
        }, 300));
    }
    
    // Sales search
    const salesSearch = document.getElementById('sales-search');
    if (salesSearch) {
        salesSearch.addEventListener('keyup', debounce(function(e) {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                fetch(`/api/sales?search=${encodeURIComponent(searchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        updateSalesTable(data.sales);
                    })
                    .catch(error => {
                        console.error('Error searching sales:', error);
                        showNotification('Error searching sales', 'error');
                    });
            } else if (e.key === 'Backspace' && searchTerm === '') {
                // If search is cleared, load all sales
                loadSalesData();
            }
        }, 300));
    }
    
    // Orders search
    const ordersSearch = document.getElementById('orders-search');
    if (ordersSearch) {
        ordersSearch.addEventListener('keyup', debounce(function(e) {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                fetch(`/api/orders?search=${encodeURIComponent(searchTerm)}`)
                    .then(res => res.json())
                    .then(data => {
                        updateOrdersTable(data.orders);
                    })
                    .catch(error => {
                        console.error('Error searching orders:', error);
                        showNotification('Error searching orders', 'error');
                    });
            } else if (e.key === 'Backspace' && searchTerm === '') {
                // If search is cleared, load all orders
                loadOrdersData();
            }
        }, 300));
    }
    
    // Global search handling
    const globalSearch = document.getElementById('global-search');
    if (globalSearch) {
        globalSearch.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    const activeTab = document.querySelector('.tab-content.active');
                    if (activeTab) {
                        const tabId = activeTab.id;
                        const tabName = tabId.replace('-tab', '');
                        
                        // Perform search based on active tab
                        switch(tabName) {
                            case 'products':
                                fetch(`/api/products?search=${encodeURIComponent(searchTerm)}`)
                                    .then(res => res.json())
                                    .then(data => {
                                        updateProductsTable(data.products);
                                    })
                                    .catch(error => {
                                        console.error('Error searching products:', error);
                                    });
                                break;
                            case 'inventory':
                                // Implement when API is ready
                                console.log(`Searching inventory: ${searchTerm}`);
                                break;
                            case 'orders':
                                // Implement when API is ready
                                console.log(`Searching orders: ${searchTerm}`);
                                break;
                            case 'sales':
                                // Implement when API is ready
                                console.log(`Searching sales: ${searchTerm}`);
                                break;
                            default:
                                // Default search behavior
                                console.log(`Searching in ${tabName}: ${searchTerm}`);
                        }
                    }
                }
            }
        });
    }
}

// Initialize all button event listeners
function initButtonEvents() {
    // Add Product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            document.getElementById('product-modal-title').textContent = 'Add Product';
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            openModal('product-modal');
        });
    }
    
    // Add Inventory button
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', function() {
            document.getElementById('inventory-modal-title').textContent = 'Add Inventory';
            document.getElementById('inventory-form').reset();
            document.getElementById('inventory-id').value = '';
            openModal('inventory-modal');
        });
    }
    
    // Add Sale button
    const addSaleBtn = document.getElementById('add-sale-btn');
    if (addSaleBtn) {
        addSaleBtn.addEventListener('click', function() {
            document.getElementById('sales-modal-title').textContent = 'Record Sale';
            document.getElementById('sales-form').reset();
            document.getElementById('sale-id').value = '';
            // Set today's date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('sale-date').value = today;
            openModal('sales-modal');
        });
    }
    
    // Add Order button
    const addOrderBtn = document.getElementById('add-order-btn');
    if (addOrderBtn) {
        addOrderBtn.addEventListener('click', function() {
            document.getElementById('order-modal-title').textContent = 'New Order';
            document.getElementById('order-form').reset();
            document.getElementById('order-id').value = '';
            openModal('order-modal');
        });
    }
    
    // Generate Report button
    const generateReportBtn = document.getElementById('generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            const reportType = document.getElementById('report-type').value;
            const reportPeriod = document.getElementById('report-period').value;
            const reportFormat = document.getElementById('report-format').value;
            
            // For now, just show a message since this feature would require additional backend support
            const reportContent = document.getElementById('report-content');
            if (reportContent) {
                reportContent.innerHTML = `<div class="report-generated">
                    <h3>Report Generated Successfully</h3>
                    <p><strong>Type:</strong> ${reportType}</p>
                    <p><strong>Period:</strong> ${reportPeriod}</p>
                    <p><strong>Format:</strong> ${reportFormat}</p>
                    <div class="report-placeholder">
                        <p><i class="fas fa-file-alt"></i> Your report has been generated and is ready for viewing or download.</p>
                        <p>The data has been processed by our backend system and formatted according to your specifications.</p>
                        <p>In a production environment, this would contain the actual report data, graphs, and analytics.</p>
                    </div>
                </div>`;
            }
        });
    }
    
    // Handle report period change
    const reportPeriod = document.getElementById('report-period');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', function() {
            const customDateRange = document.getElementById('custom-date-range');
            if (customDateRange) {
                customDateRange.style.display = this.value === 'custom' ? 'block' : 'none';
            }
        });
    }
}
