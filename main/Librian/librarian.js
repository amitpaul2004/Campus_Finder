document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SMART GREETING LOGIC
    const updateGreeting = () => {
        const hour = new Date().getHours();
        const greetingElement = document.getElementById('greeting-text');
        
        if (greetingElement) {
            if (hour < 12) greetingElement.innerText = "Good Morning, Admin";
            else if (hour < 17) greetingElement.innerText = "Good Afternoon, Admin";
            else greetingElement.innerText = "Good Evening, Admin";
        }
    };
    updateGreeting();

    // 2. LIVE DATE
    const dateEl = document.getElementById('current-date');
    if(dateEl) {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.innerText = new Date().toLocaleDateString('en-US', options);
    }

    // 3. FETCH LIVE DATA
    fetchDashboardData();
});

async function fetchDashboardData() {
    try {
        const response = await fetch('http://localhost:5000/api/items');
        const result = await response.json();

        if(result.success && result.data) {
            calculateStats(result.data);
            renderRecentActivity(result.data.slice(0, 5)); // First 5 items newest
        } else {
            document.getElementById('dashboardTableBody').innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Failed to load data.</td></tr>`;
        }
    } catch(err) {
        console.error("Dashboard Fetch Error:", err);
        document.getElementById('dashboardTableBody').innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Server Offline. Ensure backend is running.</td></tr>`;
    }
}

// --- CALC STATS ---
function calculateStats(items) {
    let newCount = 0;
    let pendingCount = 0;
    let returnedCount = 0;
    const totalCount = items.length;

    items.forEach(item => {
        let status = (item.status || 'new').toLowerCase();
        if(status === 'new') newCount++;
        if(status === 'pending') pendingCount++;
        if(status === 'returned' || status === 'resolved') returnedCount++;
    });

    animateCounter('count-new', newCount);
    animateCounter('count-pending', pendingCount);
    animateCounter('count-returned', returnedCount);
    animateCounter('count-total', totalCount);
}

function animateCounter(elementId, target) {
    const counter = document.getElementById(elementId);
    if (!counter) return;
    
    counter.innerText = '0';
    let current = 0;
    
    // Smooth fast animation
    const increment = Math.max(1, Math.ceil(target / 30)); 
    
    const update = () => {
        if(current < target) {
            current += increment;
            if(current > target) current = target;
            counter.innerText = current;
            setTimeout(update, 25);
        } else {
            counter.innerText = target;
        }
    };
    if (target > 0) update();
}

// --- RENDER RECENT ACTIVITY ---
function renderRecentActivity(items) {
    const tableBody = document.getElementById('dashboardTableBody');
    tableBody.innerHTML = '';
    
    if (items.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: #64748b;">No recent activity.</td></tr>`;
        return;
    }

    try {
        items.forEach((item, index) => {
            let rawStatus = (item.status || 'new').toLowerCase();
            if (rawStatus === 'resolved') rawStatus = 'returned';
            
            const dateObj = new Date(item.dateReported || Date.now());
            // Use time ago relative logic for dashboard coolness
            const diffTime = Math.abs(Date.now() - dateObj);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            
            let dateDisplay = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
            if (diffDays === 1) dateDisplay = "Today";
            else if (diffDays === 2) dateDisplay = "Yesterday";

            const safeId = (item._id || 'unknown').toString();
            const refId = item.refId || `#CLM-${dateObj.getFullYear()}-${safeId.substring(Math.max(0, safeId.length-4)).toUpperCase()}`;
            const safeName = (item.collectorName || 'Unknown User');
            const initials = safeName.substring(0,2).toUpperCase();

            // Status Pill formatting
            let pillText = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
            if (rawStatus === 'pending') pillText = 'Verify';

            // Action button
            let actionHTML = `<button class="icon-btn" onclick="openEditModal('${safeId}')"><i class="fa-solid fa-pen"></i></button>`;
            if (rawStatus === 'returned') actionHTML = `<button class="icon-btn" style="color: green;" onclick="openEditModal('${safeId}')"><i class="fa-solid fa-check-double"></i></button>`;
            if (rawStatus === 'expired') actionHTML = `<button class="icon-btn" style="color: #ef4444;" onclick="deleteItem('${safeId}')"><i class="fa-solid fa-trash"></i></button>`;

            const tr = document.createElement('tr');
            tr.setAttribute('data-status', rawStatus);
            tr.id = safeId;
            
            tr.innerHTML = `
                <td>
                    <div class="item-name" style="font-weight: 700; color: #0d1b3d;">${item.itemName}</div>
                    <div class="ref-id" style="font-size: 12px; color: #94a3b8;">${refId}</div>
                </td>
                <td><div class="user-cell" style="display:flex; align-items:center; gap:10px;"><div class="avatar" style="width:30px;height:30px;background:#e2e8f0;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:bold;">${initials}</div><span>${item.collectorName}</span></div></td>
                <td>${dateDisplay}</td>
                <td><span class="status-pill st-${rawStatus}">${pillText}</span></td>
                <td>${actionHTML}</td>
            `;

            // Setup fade in
            tr.style.opacity = '0';
            tr.style.transform = 'translateY(15px)';
            tr.style.transition = 'all 0.4s ease-out';
            tableBody.appendChild(tr);

            setTimeout(() => {
                tr.style.opacity = '1';
                tr.style.transform = 'translateY(0)';
            }, index * 100);
        });

    } catch (err) {
        console.error("Dashboard Render Error:", err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: red;">Render Error: ${err.message}</td></tr>`;
    }
}

/* ================= ACTION LOGIC (Database Integrated) ================= */
let currentRowId = null;

function openEditModal(rowId) {
    currentRowId = rowId;
    const row = document.getElementById(rowId);
    if(!row) return;

    const refId = row.querySelector('.ref-id').innerText;
    document.getElementById('modalRefId').innerText = refId;
    
    // Pre-select current status
    let currentStatus = row.getAttribute('data-status');
    const select = document.getElementById('modalStatusSelect');
    if(select) select.value = currentStatus;

    document.getElementById('editModal').classList.add('active'); 
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentRowId = null;
}

// Triggered by Save Changes button
async function saveStatusChange() {
    if (!currentRowId) return;

    const newStatus = document.getElementById('modalStatusSelect').value;
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.innerText;
    saveBtn.innerText = "Saving...";

    try {
        const response = await fetch(`http://localhost:5000/api/items/${currentRowId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            // Success! We must update the dashboard locally to fake the refresh (or just refetch)
            closeEditModal();
            fetchDashboardData();  // Automatically redraws counters and updates rows so counters stay perfectly synced!!
        } else {
            alert('Failed to update status.');
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error while saving.');
    } finally {
        saveBtn.innerText = originalText;
    }
}

// --- DELETE ITEM LOGIC ---
async function deleteItem(rowId) {
    if(confirm("Are you sure you want to PERMANENTLY delete this expired item from the database?")) {
        try {
            const response = await fetch(`http://localhost:5000/api/items/${rowId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Instantly sync the dashboard metrics and table correctly!
                fetchDashboardData();
            } else {
                alert("Failed to delete item.");
            }
        } catch(err) {
            console.error(err);
            alert("Server connection error while deleting.");
        }
    }
}