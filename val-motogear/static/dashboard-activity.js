// Dashboard Activity Tabs functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize activity tabs if they exist
    const activityTabs = document.querySelectorAll('.activity-tab');
    if (activityTabs.length > 0) {
        initActivityTabs();
        // Load recent activities on page load
        fetchRecentActivities();
    }
    
    // Setup refresh interval for recent activities
    setInterval(fetchRecentActivities, 30000); // Refresh every 30 seconds
});

// Expose functions globally so they can be called from app.js
window.refreshDashboardActivities = function() {
    // Only call if we're on the dashboard page
    if (document.querySelector('.dashboard-stats') && document.getElementById('recent-orders-tbody')) {
        console.log('Refreshing dashboard activities after data change');
        fetchRecentActivities();
        return true;
    }
    return false;
};

// Initialize activity tabs in the dashboard
function initActivityTabs() {
    const activityTabs = document.querySelectorAll('.activity-tab');
    const activityContents = document.querySelectorAll('.activity-content');
    
    activityTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            activityTabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all content sections
            activityContents.forEach(content => {
                content.classList.add('hidden');
            });
            
            // Show content for selected tab
            const tabName = this.getAttribute('data-tab');
            const contentElement = document.getElementById(tabName + '-content');
            if (contentElement) {
                contentElement.classList.remove('hidden');
                
                // If switching to the history tab, make sure it's loaded
                if (tabName === 'history') {
                    fetchProductHistory();
                }
            }
        });
    });
}

// Function to fetch and display recent activity including orders
function fetchRecentActivities() {
    console.log('Fetching recent activities...');
    
    // Fetch recent orders for the Recent Orders tab
    fetch('/api/orders?limit=5')
        .then(res => res.json())
        .then(data => {
            updateRecentOrders(data.orders || []);
        })
        .catch(error => {
            console.error('Error fetching recent orders:', error);
        });
    
    // Fetch all recent activities for the System Activity tab
    fetchRecentSystemActivities();
    
    // Fetch product history for the Product History tab
    fetchProductHistory();
}

// Expose this function globally for refreshing dashboard activities from other files
window.refreshDashboardActivities = fetchRecentActivities;

// Update the Recent Orders tab with the latest orders
function updateRecentOrders(orders) {
    const recentOrdersTbody = document.getElementById('recent-orders-tbody');
    if (!recentOrdersTbody) return;
    
    if (orders && orders.length > 0) {
        recentOrdersTbody.innerHTML = '';
        orders.forEach(order => {
            const statusClass = order.status ? order.status.toLowerCase().replace(' ', '-') : 'pending';
            let row = `<tr data-id="${order.id}">
                <td>${order.id}</td>
                <td>${order.product || order.product_name || 'N/A'}</td>
                <td>${order.category || 'N/A'}</td>
                <td><span class="status-badge status-${statusClass}">${order.status || 'Pending'}</span></td>
            </tr>`;
            recentOrdersTbody.innerHTML += row;
        });
    } else {
        recentOrdersTbody.innerHTML = `<tr><td colspan="4" class="empty-table">No recent orders found</td></tr>`;
    }
}

// Fetch and update system activities in the System Activity tab
function fetchRecentSystemActivities() {
    fetch('/api/activities')
        .then(res => res.json())
        .then(data => {
            updateSystemActivities(data.activities || []);
        })
        .catch(error => {
            console.error('Error fetching system activities:', error);
            // If the API endpoint doesn't exist, generate some dummy data
            generateDummyActivities();
        });
}

// Update the System Activity tab with activities
function updateSystemActivities(activities) {
    const recentActivityContainer = document.getElementById('recent-activity');
    if (!recentActivityContainer) return;
    
    if (activities && activities.length > 0) {
        recentActivityContainer.innerHTML = '';
        activities.forEach(activity => {
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

// Fetch product history for the Product History tab
function fetchProductHistory() {
    const historyContainer = document.getElementById('product-history');
    if (!historyContainer) return;
    
    // Normally we would fetch from an API endpoint
    // fetch('/api/product-history')
    //     .then(res => res.json())
    //     .then(data => {
    //         updateProductHistory(data.history || []);
    //     })
    //     .catch(error => {
    //         console.error('Error fetching product history:', error);
    //         generateDummyProductHistory();
    //     });
    
    // For now, we'll use dummy data
    generateDummyProductHistory();
}

// Expose the function globally so it can be called from app.js
window.fetchProductHistory = fetchProductHistory;

// Generate dummy product history data
function generateDummyProductHistory() {
    const historyContainer = document.getElementById('product-history');
    if (!historyContainer) return;
    
    // Clear the container
    historyContainer.innerHTML = '';
    
    // Get current date for sample activities
    const now = new Date();
    
    // Create sample product history data
    const productHistory = [
        {
            action: 'added',
            item: 'Racing Helmet XL - Black',
            user: 'Admin',
            timestamp: new Date(now.getTime() - 30 * 60000) // 30 minutes ago
        },
        {
            action: 'deleted',
            item: 'Motorcycle Oil Filter - Old Model',
            user: 'Admin',
            timestamp: new Date(now.getTime() - 2 * 60 * 60000) // 2 hours ago
        },
        {
            action: 'added',
            item: 'Premium Racing Gloves - Size M',
            user: 'Admin',
            timestamp: new Date(now.getTime() - 5 * 60 * 60000) // 5 hours ago
        },
        {
            action: 'added',
            item: 'Motorcycle Chain Lube 250ml',
            user: 'Admin',
            timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60000) // 1 day ago
        },
        {
            action: 'deleted',
            item: 'Discontinued Helmet Visor',
            user: 'Admin',
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60000) // 2 days ago
        }
    ];
    
    // Display each history item
    productHistory.forEach(item => {
        const formattedTime = formatTimeAgo(item.timestamp);
        const isAdded = item.action === 'added';
        
        const historyItem = document.createElement('div');
        historyItem.className = `activity-item ${isAdded ? 'added-item' : 'deleted-item'}`;
        
        historyItem.innerHTML = `
            <div class="activity-icon ${isAdded ? 'added-icon' : 'deleted-icon'}">
                <i class="fas ${isAdded ? 'fa-plus' : 'fa-minus'}"></i>
            </div>
            <div class="activity-details">
                <div class="activity-description">
                    <span class="action-type">${isAdded ? 'Added' : 'Deleted'}</span> product: ${item.item}
                </div>
                <div class="activity-meta">
                    <span class="activity-user">by ${item.user}</span> • 
                    <span class="activity-time">${formattedTime}</span>
                </div>
            </div>
        `;
        
        historyContainer.appendChild(historyItem);
    });
}

// Format timestamp as relative time (e.g., "2 hours ago")
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
        return 'just now';
    } else if (diffMin < 60) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
        return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
        // For older dates, return the formatted date
        return date.toLocaleDateString();
    }
}

// Generate dummy activity data if the API endpoint doesn't exist
function generateDummyActivities() {
    const recentActivityContainer = document.getElementById('recent-activity');
    if (!recentActivityContainer) return;
    
    // Get current date for sample activities
    const now = new Date();
    
    // Create some sample activities including order activities
    const sampleActivities = [
        {
            type: 'Order',
            description: 'New order #1025 was created',
            date: new Date(now.getTime() - 15 * 60000) // 15 minutes ago
        },
        {
            type: 'Inventory',
            description: 'Inventory level for "Racing Helmet XL" updated',
            date: new Date(now.getTime() - 45 * 60000) // 45 minutes ago
        },
        {
            type: 'Sale',
            description: 'Sale #2045 completed for customer "John Smith"',
            date: new Date(now.getTime() - 120 * 60000) // 2 hours ago
        },
        {
            type: 'Order',
            description: 'Order #1024 status changed to "Shipped"',
            date: new Date(now.getTime() - 180 * 60000) // 3 hours ago
        },
        {
            type: 'Inventory',
            description: 'Low stock alert for "Racing Gloves M"',
            date: new Date(now.getTime() - 240 * 60000) // 4 hours ago
        }
    ];
    
    // Update the UI with sample activities
    updateSystemActivities(sampleActivities);
}


