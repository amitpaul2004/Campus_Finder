// Load History on Start
document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('historyList');
    if(!list) return;

    try {
        const response = await fetch('https://uniback-api.onrender.com/api/alerts');
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            result.data.forEach(item => addHistoryToUI(item));
        } else {
            list.innerHTML = '<p style="text-align: center; color: #888; margin-top: 20px;">No broadcast history found.</p>';
        }
    } catch (err) {
        console.error("Failed to load history:", err);
        list.innerHTML = '<p style="text-align: center; color: #ef4444; margin-top: 20px;">Error loading broadcast history. Ensure backend is running.</p>';
    }
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
        // 3. SEND POST TO LOCAL BACKEND
        // The backend handles saving to DB and automatically delegates email sending!
        const response = await fetch('https://uniback-api.onrender.com/broadcast-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                audience: audience, 
                subject: subject, 
                body: body, 
                sendEmail: sendEmail // boolean flag telling server to run nodemailer
            })
        });
        
        const result = await response.json();
        if (!response.ok) throw new Error(result.message);
        console.log("Server Response:", result);

        // 4. Success State
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Published!';
        btn.style.background = "#10b981";

        // 5. Send email via EmailJS if toggle is ON
        if (sendEmail) {
            emailjs.send(
                'YOUR_SERVICE_ID',      // ← Replace with your EmailJS Service ID
                'YOUR_BROADCAST_TEMPLATE_ID', // ← Replace with your Broadcast Template ID
                {
                    target_audience: audience,
                    alert_subject:   subject,
                    alert_body:      body,
                    sent_time:       new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
                }
            ).then(() => {
                console.log('✅ Broadcast email sent via EmailJS');
            }).catch(err => {
                console.warn('⚠️ Broadcast email failed:', err);
            });
        }

        // 5. Update the Live Feed (UI Only, since we just saved it to DB)
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        
        const newItem = {
            audience: audience,
            subject: subject,
            body: body,
            time: timeString
        };
        addHistoryToUI(newItem, true);
        
        // Remove empty state message if it exists
        const list = document.getElementById('historyList');
        if (list.innerHTML.includes("No broadcast history found")) {
            list.innerHTML = "";
            addHistoryToUI(newItem, true); // re-add
        }

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