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

    // 3. NUMBER ANIMATION
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        counter.innerText = '0';
        const updateCounter = () => {
            const target = +counter.getAttribute('data-target');
            const c = +counter.innerText;
            const increment = target / 40; 
            if(c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 25);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });
});

/* ================= ACTION LOGIC (New) ================= */
let currentRowId = null;

function openEditModal(rowId) {
    currentRowId = rowId;
    const row = document.getElementById(rowId);
    const refId = row.querySelector('.ref-id').innerText;
    
    document.getElementById('modalRefId').innerText = refId;
    
    // Pre-select current status
    const currentStatus = row.getAttribute('data-status');
    const select = document.getElementById('modalStatusSelect');
    if(select) select.value = currentStatus;

    document.getElementById('editModal').classList.add('active'); 
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
    const actionBtn = row.querySelector('.icon-btn'); // Note class name check

    // Update Pill Text & Color
    pill.innerText = newStatus;
    pill.classList.remove('st-new', 'st-ready', 'st-pending', 'st-returned', 'st-expired');
    pill.classList.add('st-' + newStatus);
    row.setAttribute('data-status', newStatus);

    // Update Action Button Logic
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

function deleteRow(rowId) {
    if(confirm("Are you sure you want to remove this item?")) {
        const row = document.getElementById(rowId);
        row.style.transition = "all 0.5s";
        row.style.transform = "translateX(100px)";
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 500);
    }
}