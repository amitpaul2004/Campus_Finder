// --- DYNAMIC DATABASE ---
const today = new Date();
const currentYear = today.getFullYear();

// Mock Data
const itemsDB = {
    [`CLM-${currentYear}-001`]: {
        name: "Blue Nike Bag",
        student: "Amit Paul",
        date: "Jan 01, " + currentYear,
        location: "Library, 2nd Floor",
        status: "New",
        image: "https://m.media-amazon.com/images/I/51w+jK-6uUL._AC_UY1100_.jpg"
    },
    [`CLM-${currentYear}-002`]: {
        name: "Dell Laptop Charger",
        student: "Rahul K.",
        date: "Dec 28, " + (currentYear-1),
        location: "Canteen",
        status: "Ready",
        image: "https://m.media-amazon.com/images/I/61M40m+fF0L.jpg"
    },
    [`CLM-${currentYear}-003`]: {
        name: "Physics Book",
        student: "Priya S.",
        date: "Jan 02, " + currentYear,
        location: "Lab 3",
        status: "Returned",
        image: "https://m.media-amazon.com/images/I/81GeA+u+y5L._AC_UF1000,1000_QL80_.jpg"
    }
};

let currentId = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').placeholder = `e.g. CLM-${currentYear}-001`;
});

function handleEnter(e) {
    if (e.key === 'Enter') searchItem();
}

function searchItem() {
    const input = document.getElementById('searchInput');
    const id = input.value.trim().toUpperCase();
    const container = document.getElementById('editContainer');

    container.style.display = 'none';

    if(!id) {
        alert("Please enter a Reference ID.");
        return;
    }

    const btn = document.querySelector('.btn-search');
    const originalContent = btn.innerHTML;
    btn.innerHTML = '<span>Scanning...</span>';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerHTML = originalContent;
        btn.disabled = false;

        if(itemsDB[id]) {
            currentId = id;
            populateData(id, itemsDB[id]);
            container.style.display = 'block';
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert(`No item found with ID: ${id}`);
        }
    }, 600);
}

function populateData(id, data) {
    document.getElementById('displayRef').innerText = id;
    document.getElementById('displayName').innerText = data.name;
    document.getElementById('displayStudent').innerText = data.student;
    document.getElementById('displayDate').innerText = data.date;
    document.getElementById('displayLocation').innerText = data.location;
    document.getElementById('displayImage').src = data.image;

    updatePill(data.status);
    document.getElementById('statusSelect').value = data.status;
}

function updatePill(status) {
    const pill = document.getElementById('displayStatus');
    pill.innerText = status;
    pill.className = 'card-badge'; // Reset classes
    pill.classList.add('st-' + status.toLowerCase());
}

function previewStatusColor() {
    const newStatus = document.getElementById('statusSelect').value;
    updatePill(newStatus);
}

function saveStatus() {
    if(!currentId) return;

    const newStatus = document.getElementById('statusSelect').value;
    const btn = document.querySelector('.btn-save');
    
    itemsDB[currentId].status = newStatus;

    btn.innerHTML = '<i class="fa-solid fa-check"></i> Status Updated!';
    btn.style.background = "#10b981"; 

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Updates';
        btn.style.background = ""; 
        alert(`Success! Item ${currentId} marked as '${newStatus}'.`);
    }, 1500);
}