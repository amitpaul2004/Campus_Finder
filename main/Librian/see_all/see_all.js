document.addEventListener('DOMContentLoaded', () => {
    fetchItems();
});

// --- FETCH DATA FROM BACKEND ---
async function fetchItems() {
    try {
        const response = await fetch('http://localhost:5000/api/items');
        const result = await response.json();

        if (result.success && result.data) {
            renderTable(result.data);
        } else {
            showError("Failed to load records from database.");
        }
    } catch (error) {
        console.error("Error fetching items:", error);
        showError("Server Connection Error. Ensure Backend is running.");
    }
}

function showError(msg) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = `<tr class="visible"><td colspan="6" style="text-align:center; padding: 30px; color: red; font-weight:bold;">${msg}</td></tr>`;
}

function renderTable(items) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = ''; // Clear loading

    if (items.length === 0) {
        document.getElementById('noRecords').style.display = 'block';
        return;
    }

    try {
        items.forEach((item, index) => {
            const isLost = (item.type || '').toLowerCase() === 'lost';
            const iconClass = isLost ? 'fa-circle-exclamation' : 'fa-circle-check';
            const iconColor = isLost ? 'orange' : 'green';
            
            // Ensure status mapping (e.g., 'Pending' to 'pending')
            let rawStatus = (item.status || 'new').toLowerCase();
            if (rawStatus === 'resolved') rawStatus = 'returned';
            
            const dateObj = new Date(item.dateReported || Date.now());
            const friendlyDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
            
            // Generate pseudo ref-id safely
            const safeId = (item._id || 'unknown').toString();
            const refId = item.refId || `#CLM-${dateObj.getFullYear()}-${safeId.substring(Math.max(0, safeId.length-4)).toUpperCase()}`;
            const safeName = (item.collectorName || 'Unknown User');
            const initials = safeName.substring(0,2).toUpperCase();

            const tr = document.createElement('tr');
            tr.setAttribute('data-status', rawStatus);
            tr.id = safeId; // Set real DB ID to the row

        // Action Button Layout based on status
        let actionHTML = `<button class="action-btn" onclick="openEditModal('${item._id}')"><i class="fa-solid fa-pen"></i></button>`;
        if (rawStatus === 'returned') {
            actionHTML = `<button class="action-btn" style="color: green;" onclick="openEditModal('${item._id}')"><i class="fa-solid fa-check-double"></i></button>`;
        } else if (rawStatus === 'expired') {
            actionHTML = `<button class="action-btn delete" onclick="deleteRow('${item._id}')"><i class="fa-solid fa-trash"></i></button>`;
        }

        // Status pill label formatting
        let pillText = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
        if (rawStatus === 'pending') pillText = 'Verify';

        tr.innerHTML = `
            <td>
                <div class="item-meta">
                    <div class="icon-box ${iconColor}"><i class="fa-solid ${iconClass}"></i></div>
                    <div>
                        <div class="item-name">${item.itemName}</div>
                        <div class="ref-id">${refId}</div>
                    </div>
                </div>
            </td>
            <td><div class="user-cell"><div class="avatar">${initials}</div><span>${item.collectorName}</span></div></td>
            <td>${friendlyDate}</td>
            <td>${item.location}</td>
            <td><span class="status-pill st-${rawStatus}">${pillText}</span></td>
            <td>${actionHTML}</td>
        `;

            setTimeout(() => tr.classList.add('visible'), index * 100);
            tableBody.appendChild(tr);
        });

        document.querySelector('.showing-text').textContent = `Showing 1-${items.length} of ${items.length} entries`;
    } catch(err) {
        console.error("Render Loop Error:", err);
        showError("Render Error: " + err.message);
    }
}

// --- FILTER & SEARCH ---
function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#tableBody tr');
    let hasVisibleRow = false;

    rows.forEach(row => {
        if (!row.querySelector('.item-name')) return; // skip loaders

        const itemName = row.querySelector('.item-name').innerText.toLowerCase();
        const refId = row.querySelector('.ref-id').innerText.toLowerCase();
        const userName = row.querySelector('.user-cell span').innerText.toLowerCase();
        const rowStatus = row.getAttribute('data-status');

        const matchesSearch = itemName.includes(searchInput) || refId.includes(searchInput) || userName.includes(searchInput);
        const matchesStatus = statusFilter === 'all' || rowStatus === statusFilter;

        if (matchesSearch && matchesStatus) {
            row.style.display = "";
            row.style.animation = 'none'; row.offsetHeight; row.style.animation = null; 
            hasVisibleRow = true;
        } else {
            row.style.display = "none";
        }
    });

    document.getElementById('noRecords').style.display = hasVisibleRow ? "none" : "block";
}

// --- EDIT MODAL LOGIC ---
let currentRowId = null;

function openEditModal(rowId) {
    currentRowId = rowId;
    const row = document.getElementById(rowId);
    const refId = row.querySelector('.ref-id').innerText;
    
    document.getElementById('modalRefId').innerText = refId;
    
    // Pre-select current status
    let currentStatus = row.getAttribute('data-status');
    if (currentStatus === 'pending') currentStatus = 'pending'; // verify check
    
    document.getElementById('modalStatusSelect').value = currentStatus;

    const modal = document.getElementById('editModal');
    modal.classList.add('active'); 
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentRowId = null;
}

// Triggered by "Save Changes" button in modal
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
        
        const result = await response.json();
        if (response.ok) {
            // Update UI
            updateRowUI(currentRowId, newStatus);
            closeEditModal();
        } else {
            alert('Failed to update status: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error while saving.');
    } finally {
        saveBtn.innerText = originalText;
    }
}

function updateRowUI(rowId, newStatus) {
    const row = document.getElementById(rowId);
    if(!row) return;

    const pill = row.querySelector('.status-pill');
    const actionBtn = row.querySelector('.action-btn');

    // Update Pill Text
    let pillText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    if (newStatus === 'pending') pillText = 'Verify';
    pill.innerText = pillText;

    pill.className = `status-pill st-${newStatus}`;
    row.setAttribute('data-status', newStatus);

    // Update Action Button Automically
    actionBtn.style.color = ""; 
    actionBtn.className = 'action-btn';

    if (newStatus === 'expired') {
        actionBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        actionBtn.classList.add('delete'); 
        actionBtn.setAttribute('onclick', `deleteRow('${rowId}')`);
    } 
    else if (newStatus === 'returned') {
        actionBtn.innerHTML = '<i class="fa-solid fa-check-double"></i>';
        actionBtn.style.color = "green"; 
        actionBtn.setAttribute('onclick', `openEditModal('${rowId}')`);
    } 
    else {
        actionBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        actionBtn.setAttribute('onclick', `openEditModal('${rowId}')`);
    }
}

// --- DELETE ROW LOGIC ---
async function deleteRow(rowId) {
    if(confirm("Are you sure you want to PERMANENTLY delete this item from the database?")) {
        const row = document.getElementById(rowId);
        
        try {
            const response = await fetch(`http://localhost:5000/api/items/${rowId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from DOM safely
                row.style.transition = "all 0.5s";
                row.style.transform = "translateX(100px)";
                row.style.opacity = "0";
                setTimeout(() => {
                    row.remove();
                    // Refilter to check if empty
                    filterTable();
                }, 500);
            } else {
                alert("Failed to delete item.");
            }
        } catch(err) {
            console.error(err);
            alert("Server connection error while deleting.");
        }
    }
}

// --- EXPORT CSV WITH DATE & TIME ---
function exportTableToCSV(filename) {
    const csv = [];
    
    // 1. ADD EXPORT TIMESTAMP AT THE TOP
    const now = new Date();
    const timestamp = "Export Generated on: " + now.toLocaleString();
    csv.push(['"' + timestamp + '"']); // Add Timestamp Row
    csv.push([]); // Add Empty Row for spacing

    // 2. Add Headers
    const rows = document.querySelectorAll("#activityTable tbody tr");
    const headers = ["Item Name", "Ref ID", "Reported By", "Date", "Location", "Status"];
    csv.push(headers.join(","));

    // 3. Loop Rows
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.style.display !== 'none' && !row.id.includes('loadingRow')) {
            const cols = row.querySelectorAll("td");
            if (cols.length < 6) continue;

            const rowData = [];
            
            // Name & ID
            rowData.push('"' + cols[0].querySelector(".item-name").innerText + '"');
            rowData.push('"' + cols[0].querySelector(".ref-id").innerText + '"');
            // User
            rowData.push('"' + cols[1].querySelector("span").innerText + '"');
            // Date, Loc, Status
            rowData.push('"' + cols[2].innerText + '"');
            rowData.push('"' + cols[3].innerText + '"');
            rowData.push('"' + cols[4].innerText + '"');
            
            csv.push(rowData.join(","));
        }
    }

    // 4. Download File
    const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(csvFile);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}