// --- JAVASCRIPT ANIMATION & LOGIC ---

async function fetchClaimStatus() {
    const input = document.getElementById('claimInput').value.trim();
    const resultCard = document.getElementById('result-card');
    const displayRef = document.getElementById('display-ref');
    const itemName = document.getElementById('item-name');
    const badge = document.getElementById('main-status-badge');
    const line = document.getElementById('progress-line');
    
    // Select Steps
    const steps = [
        document.getElementById('step-1'),
        document.getElementById('step-2'),
        document.getElementById('step-3'),
        document.getElementById('step-4')
    ];

    // Reset Animation (Clear previous search)
    resultCard.classList.remove('active');
    line.style.width = '0%';
    steps.forEach(step => step.classList.remove('active'));

    // Validation
    if (!input) {
        alert("Please enter a valid Reference ID");
        return;
    }

    const btn = document.querySelector('.track-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Finding...`;
    btn.disabled = true;

    try {
        // Fetch from the backend!
        const url = `http://localhost:5000/api/items/track/${encodeURIComponent(input)}`;
        const response = await fetch(url);
        
        let result;
        try {
            result = await response.json();
        } catch(parseErr) {
            alert(`CRITICAL ERROR: The backend Server returned a ${response.status} HTML error instead of JSON data! This means your 'node server.js' was NOT restarted properly with the new tracking code.`);
            throw new Error("JSON Parse failed");
        }

        if (response.ok && result.success) {
            const item = result.data;
            const status = (item.status || 'new').toLowerCase();
            const dateObj = new Date(item.dateReported);
            const friendlyDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            // Populate Card Data
            displayRef.textContent = item.refId || input.toUpperCase();
            itemName.textContent = item.itemName;
            
            // Map the other fields
            document.querySelectorAll('.detail-box h4')[1].textContent = friendlyDate;
            document.querySelectorAll('.detail-box h4')[2].textContent = item.location;

            // Determine Status UI based on Database exact ENUM
            let progress = 0; 

            if (status === 'expired') {
                // EXPIRED / REJECTED SCENARIO
                badge.className = 'status-pill rejected';
                badge.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Claim Expired/Closed`;
                progress = 100; 
                // Color all steps gray/red
                animateTimeline(steps, 4, true); 
            } 
            else if (status === 'returned') {
                // COMPLETED SCENARIO
                badge.className = 'status-pill success';
                badge.innerHTML = `<i class="fa-solid fa-check-double"></i> Handover Complete`;
                progress = 100;
                animateTimeline(steps, 4); 
            } 
            else if (status === 'ready') {
                // APPROVED / READY
                badge.className = 'status-pill success';
                badge.innerHTML = `<i class="fa-solid fa-check-circle"></i> Ready for Pickup`;
                document.querySelectorAll('.detail-box h4')[3].textContent = "Ready Now";
                progress = 75;
                animateTimeline(steps, 3); 
            }
            else if (status === 'pending') {
                // VERIFYING
                badge.className = 'status-pill pending';
                badge.innerHTML = `<i class="fa-solid fa-user-shield"></i> Under Review`;
                progress = 50;
                animateTimeline(steps, 2);
            }
            else {
                // NEW / DEFAULT SCENARIO
                badge.className = 'status-pill pending';
                badge.innerHTML = `<i class="fa-solid fa-clock"></i> Processing Request`;
                progress = 25; 
                animateTimeline(steps, 1); 
            }

            // Show Card and animate progress line
            resultCard.classList.add('active');
            setTimeout(() => {
                line.style.width = `${progress}%`;
                if(status === 'expired') line.style.backgroundColor = '#ef4444'; // Red line for expired
                else line.style.backgroundColor = '#3b82f6'; // Back to blue
            }, 300);

        } else {
            alert("Record not found! Please check your Reference ID and try again.");
        }
    } catch (err) {
        console.error(err);
        if (err.message !== "JSON Parse failed") {
            alert(`FETCH ERROR: ${err.message}\n\nThis means your Backend Terminal running 'node server.js' has crashed, stalled, or is completely closed! You must restart it.`);
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Function to cascade the active class on timeline steps
function animateTimeline(steps, count, isError = false) {
    steps.forEach((step, index) => {
        // Clear previous error states
        step.classList.remove('error-step');
        
        if (index < count) {
            setTimeout(() => {
                if (isError) {
                    step.classList.add('error-step');
                } else {
                    step.classList.add('active');
                }
            }, index * 400); // 400ms delay between each step lighting up
        }
    });
}