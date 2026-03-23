// --- DYNAMIC DATABASE ---
const today = new Date();
const currentYear = today.getFullYear();

let currentId = null;
let currentDbId = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').placeholder = `e.g. #CLM-${currentYear}-001`;
});

function handleEnter(e) {
    if (e.key === 'Enter') searchItem();
}

async function searchItem() {
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

    try {
        const response = await fetch(`https://uniback-api.onrender.com/api/items/track/${encodeURIComponent(id)}`);
        
        btn.innerHTML = originalContent;
        btn.disabled = false;

        if (response.ok) {
            const result = await response.json();
            const item = result.data;

            currentDbId = item._id; // The native MongoDB true _id
            
            // Generate display ref if native is missing
            const safeId = item._id.toString();
            const dateObj = new Date(item.dateReported);
            const refIdDisplay = item.refId || `#CLM-${dateObj.getFullYear()}-${safeId.substring(Math.max(0, safeId.length-4)).toUpperCase()}`;
            
            currentId = refIdDisplay;

            // Normalize the image
            let imgUrl = item.image;
            if (!imgUrl || imgUrl === 'none' || imgUrl === "") {
                imgUrl = "https://cdn-icons-png.flaticon.com/512/679/679821.png";
            }

            // Normalise status
            let rawStatus = (item.status || "new").charAt(0).toUpperCase() + (item.status || "new").slice(1).toLowerCase();
            if (rawStatus === 'Pending') rawStatus = 'Pending';

            const mapData = {
                name: item.itemName,
                student: item.collectorName || "Unknown Student",
                date: dateObj.toLocaleDateString(),
                location: item.location || "Reported via web",
                status: rawStatus,
                image: imgUrl
            };

            populateData(refIdDisplay, mapData);
            container.style.display = 'block';
            container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            alert(`No item found with ID: ${id}`);
        }
    } catch (err) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
        alert("Server connection error: Ensure backend is running!");
        console.error(err);
    }
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

async function saveStatus() {
    if(!currentDbId) return;

    const newStatus = document.getElementById('statusSelect').value;
    const btn = document.querySelector('.btn-save');
    const originalHtml = btn.innerHTML;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const response = await fetch(`https://uniback-api.onrender.com/api/items/${currentDbId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus.toLowerCase() })
        });
        
        if (response.ok) {
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Status Updated!';
            btn.style.background = "#10b981"; 
            
            setTimeout(() => {
                btn.innerHTML = originalHtml;
                btn.style.background = ""; 
                btn.disabled = false;
                alert(`Success! Item ${currentId} automatically marked as '${newStatus}' across all portals.`);
            }, 1500);
        } else {
            alert('Failed to update status on server.');
            btn.innerHTML = originalHtml;
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error while saving.');
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
}