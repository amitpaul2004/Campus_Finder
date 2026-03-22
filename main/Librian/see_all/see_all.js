document.addEventListener('DOMContentLoaded', () => {
    // Trigger Staggered Animations
    const rows = document.querySelectorAll('#tableBody tr');
    rows.forEach((row, index) => {
        setTimeout(() => row.classList.add('visible'), index * 100);
    });
});

// --- FILTER & SEARCH ---
function filterTable() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#tableBody tr');
    let hasVisibleRow = false;

    rows.forEach(row => {
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
    const currentStatus = row.getAttribute('data-status');
    document.getElementById('modalStatusSelect').value = currentStatus;

    const modal = document.getElementById('editModal');
    modal.classList.add('active'); 
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentRowId = null;
}

function saveStatusChange() {
    if (!currentRowId) return;

    const newStatus = document.getElementById('modalStatusSelect').value;
    const row = document.getElementById(currentRowId);
    const pill = row.querySelector('.status-pill');
    const actionBtn = row.querySelector('.action-btn');

    // Update Pill
    pill.innerText = newStatus;
    pill.classList.remove('st-new', 'st-ready', 'st-pending', 'st-returned', 'st-expired');
    pill.classList.add('st-' + newStatus);
    row.setAttribute('data-status', newStatus);

    // Update Action Button Automically
    actionBtn.style.color = ""; 
    actionBtn.classList.remove('delete');

    if (newStatus === 'expired') {
        actionBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        actionBtn.classList.add('delete'); 
        actionBtn.setAttribute('onclick', `deleteRow('${currentRowId}')`);
    } 
    else if (newStatus === 'returned') {
        actionBtn.innerHTML = '<i class="fa-solid fa-check-double"></i>';
        actionBtn.style.color = "green"; 
        actionBtn.setAttribute('onclick', `openEditModal('${currentRowId}')`);
    } 
    else {
        actionBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        actionBtn.setAttribute('onclick', `openEditModal('${currentRowId}')`);
    }

    closeEditModal();
}

// --- DELETE ROW LOGIC ---
function deleteRow(rowId) {
    if(confirm("Are you sure you want to PERMANENTLY remove this expired item?")) {
        const row = document.getElementById(rowId);
        row.style.transition = "all 0.5s";
        row.style.transform = "translateX(100px)";
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 500);
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
        if (row.style.display !== 'none') {
            const cols = row.querySelectorAll("td");
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