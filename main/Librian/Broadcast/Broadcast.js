// --- INITIAL HISTORY DATA (Demo Data) ---
const historyData = [
    {
        audience: "All Students",
        subject: "Found: Red Water Bottle",
        body: "A red Milton water bottle was found in the Canteen. Please claim it from the front desk.",
        time: "10:30 AM"
    },
    {
        audience: "CSE Dept",
        subject: "Lab Coat Left Behind",
        body: "Someone left a lab coat in Lab 3. It has been submitted to the Lost & Found.",
        time: "09:15 AM"
    }
];

// Load History on Start
document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('historyList');
    if(list) historyData.forEach(item => addHistoryToUI(item));
});

// --- MAIN FUNCTION: SEND BROADCAST ---
async function sendBroadcast(e) {
    e.preventDefault();
    
    // 1. Get Values from Form
    const audience = document.getElementById('targetAudience').value;
    const subject = document.getElementById('msgSubject').value;
    const body = document.getElementById('msgBody').value;
    const sendEmail = document.getElementById('emailToggle').checked; // Checkbox Status
    
    const btn = document.querySelector('.btn-broadcast');
    const originalContent = btn.innerHTML;

    // 2. Loading State (Visual Feedback)
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Broadcasting...';
    btn.style.opacity = '0.9';
    btn.disabled = true;

    try {
        // 3. IF CHECKBOX IS CHECKED -> SEND TO BACKEND    
        if (sendEmail) {
            const response = await fetch('https://uniback-backend.onrender.com/broadcast-alert', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audience, subject, body })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            console.log("Server Response:", result);
        } else {
            // If email is NOT checked, just simulate a small delay for UI effect
            await new Promise(r => setTimeout(r, 1000));
        }

        // 4. Success State
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Published!';
        btn.style.background = "#10b981"; // Success Green

        // 5. Update the Live Feed (UI Only)
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newItem = {
            audience: audience,
            subject: subject,
            body: body,
            time: timeString
        };
        addHistoryToUI(newItem, true);

        // 6. Reset Form after 2 seconds
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = ""; // Return to original gradient
            btn.disabled = false;
            document.getElementById('broadcastForm').reset();
        }, 2000);

    } catch (error) {
        console.error("Broadcast failed:", error);
        
        // Error State
        btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Failed';
        btn.style.background = "#ef4444"; // Red
        
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.background = "";
            btn.disabled = false;
        }, 3000);
        
        alert("Error sending broadcast: " + error.message);
    }
}

// Helper: Add Item to the Feed List
function addHistoryToUI(item, isNew = false) {
    const list = document.getElementById('historyList');
    
    const div = document.createElement('div');
    div.className = 'feed-card';
    if(isNew) div.style.animation = "slideIn 0.5s ease-out";

    div.innerHTML = `
        <div class="feed-meta">
            <span class="feed-audience"><i class="fa-solid fa-users"></i> ${item.audience}</span>
            <span>${item.time}</span>
        </div>
        <h4 class="feed-title">${item.subject}</h4>
        <p class="feed-body">${item.body}</p>
    `;

    // Prepend if new, Append if loading initial history
    if(isNew) {
        list.insertBefore(div, list.firstChild);
    } else {
        list.appendChild(div);
    }
}