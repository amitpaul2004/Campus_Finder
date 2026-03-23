// --- 1. DEFINE YEARS & GLOBALS ---
const today = new Date();
const currentYear = today.getFullYear();
const lastYear = currentYear - 1;

let currentRefId = ""; 
let currentDbId = null; // Store backend _id for updating status
let currentVerifyData = null; // Live session data for Receipt Generation
let html5QrcodeScanner = null;

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('refInput');
    if(input) input.placeholder = `e.g. CLM-${currentYear}-001`;
});

function handleEnter(e) {
    if (e.key === 'Enter') verifyClaim();
}

// --- VERIFY LOGIC ---
async function verifyClaim(scannedId = null) {
    const input = document.getElementById('refInput');
    currentRefId = (scannedId || input.value).trim().toUpperCase();
    
    if(scannedId) input.value = currentRefId;

    const resultContainer = document.getElementById('resultContainer');
    const successCard = document.getElementById('successCard');
    const errorCard = document.getElementById('errorCard');
    const btn = document.querySelector('.verify-btn');

    // 1. HIDE PREVIOUS RESULTS
    resultContainer.style.display = 'none';
    successCard.style.display = 'none';
    errorCard.style.display = 'none';

    // *** FIX: FORCE BUTTON RESET ON EVERY SEARCH ***
    const handoverBtn = document.querySelector('.btn-primary');
    if(handoverBtn) {
        handoverBtn.innerHTML = '<i class="fa-solid fa-hand-holding-hand"></i> Confirm Handover';
        handoverBtn.style.background = ""; // Remove the dark "Complete" color
        handoverBtn.disabled = false;      // Make it clickable again
    }

    if (!currentRefId) {
        alert("Please enter a Reference ID");
        return;
    }

    // Loading Animation
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
    btn.style.opacity = "0.8";
    btn.disabled = true;

    try {
        const response = await fetch(`http://localhost:5000/api/items/track/${encodeURIComponent(currentRefId)}`);
        
        btn.innerHTML = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
        resultContainer.style.display = 'block';

        if (response.ok) {
            const result = await response.json();
            const item = result.data;

            // Global store ID for 'markAsReturned' to use
            currentDbId = item._id;
            
            // Generate display ref if native is missing
            const safeId = item._id.toString();
            const dateObj = new Date(item.dateReported);
            const refIdDisplay = item.refId || `#CLM-${dateObj.getFullYear()}-${safeId.substring(Math.max(0, safeId.length-4)).toUpperCase()}`;

            // Save for the Receipt Generator
            currentVerifyData = {
                item: item.itemName,
                student: item.collectorName || "Unknown Student",
                id: refIdDisplay,
                location: item.location || "Reported via Web",
                status: item.status
            };

            document.getElementById('resItemName').innerText = item.itemName;
            document.getElementById('resStudent').innerText = currentVerifyData.student;
            document.getElementById('resStudentId').innerText = refIdDisplay; // Showing RefID here as ID
            document.getElementById('resLocation').innerText = currentVerifyData.location;

            // Dynamically update the Status Badge just like the main Dashboard
            const statusBadge = document.getElementById('resStatusBadge');
            if (statusBadge) {
                const rawStatus = (item.status || 'new').toLowerCase();
                let pillText = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);
                
                if (rawStatus === 'pending') pillText = 'Verifying';
                if (rawStatus === 'ready') pillText = 'Ready for Pickup';
                
                statusBadge.className = `status-badge st-${rawStatus}`;
                statusBadge.innerText = pillText;
            }
            
            // Check if item image is base64 or placeholder
            let imgUrl = item.image;
            if (!imgUrl || imgUrl === 'none' || imgUrl === "") {
                imgUrl = "https://cdn-icons-png.flaticon.com/512/679/679821.png";
            }
            document.getElementById('resItemImage').src = imgUrl;

            // Auto-disable handover if already returned or expired
            const statusLower = (item.status || "").toLowerCase();
            if (statusLower === 'returned' || statusLower === 'expired') {
                handoverBtn.innerHTML = `<i class="fa-solid fa-${statusLower === 'returned' ? 'check-double' : 'ban'}"></i> Already ${statusLower}`;
                handoverBtn.style.background = "#0f172a"; 
                handoverBtn.disabled = true;
            }
            
            successCard.style.display = 'block';
        } else {
            currentDbId = null;
            currentVerifyData = null;
            document.getElementById('invalidRef').innerText = currentRefId;
            errorCard.style.display = 'block';
        }
        
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });

    } catch (err) {
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert("Server connection error: Please make sure 'node server.js' is running.");
        console.error(err);
    }
}

// --- HANDOVER ACTION ---
async function markAsReturned() {
    if (!currentDbId) return;

    const btn = document.querySelector('.btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    btn.disabled = true;

    try {
        const response = await fetch(`http://localhost:5000/api/items/${currentDbId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'returned' })
        });
        
        if (response.ok) {
            // Change button to "Complete" state
            btn.innerHTML = '<i class="fa-solid fa-check-double"></i> Handover Complete';
            btn.style.background = "#15803d"; // Green success color
            // btn remains disabled to prevent multiple clicks
        } else {
            alert('Failed to update status on server.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        console.error(err);
        alert('Server connection error while saving.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// --- CAMERA SCANNER ---
function startCameraScan() {
    document.getElementById('scannerModal').classList.add('active');
    const config = { 
        fps: 25, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true }
    };
    html5QrcodeScanner = new Html5QrcodeScanner("reader", config, false);
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function onScanSuccess(decodedText, decodedResult) {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            document.getElementById('scannerModal').classList.remove('active');
            html5QrcodeScanner = null;
        });
    }

    let extractedId = null;
    const idMatch = decodedText.match(/(CLM-\d{4}-\d{3,})/i); 
    if(idMatch) {
        // Must prepend # to match database strict formats
        extractedId = "#" + idMatch[0].toUpperCase();
    } else {
        alert("Invalid QR Code: No Reference ID found.");
        return;
    }

    // Immediately trigger live backend verification exactly like manual text input!
    verifyClaim(extractedId);
}

function onScanFailure(error) { }

function stopCameraScan() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            document.getElementById('scannerModal').classList.remove('active');
            html5QrcodeScanner = null;
        });
    } else {
        document.getElementById('scannerModal').classList.remove('active');
    }
}

// --- UTILS ---
function resetVerify() {
    document.getElementById('refInput').value = "";
    document.getElementById('resultContainer').style.display = 'none';
    document.getElementById('refInput').focus();
    currentRefId = "";
    currentDbId = null;
    currentVerifyData = null;
}

function downloadReceipt() {
    if (!currentVerifyData) return;
    const data = currentVerifyData;
    const dateStr = new Date().toLocaleDateString();
    const jisGroupLogo = "https://www.jisgroup.org/images/logo.png";
    
    // Create live QR Code for Receipt
    const qrText = `JIS UNIVERSITY CLAIM\nRef: ${data.id}\nStudent: ${data.student}\nItem: ${data.item}\nStatus: VERIFIED`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

    const receiptHTML = `
        <html>
        <head>
            <title>Receipt-${data.id}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; color: #000; max-width: 800px; margin: 0 auto; border: 1px solid #ddd; }
                .header-container { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
                .left-logo img { height: 85px; } .left-logo div { font-size: 11px; font-weight: bold; margin-top: 5px; text-align:center; }
                .center-info { text-align: center; flex: 1; padding: 0 10px; }
                .center-info h2 { margin: 0; text-decoration: underline; font-size: 20px; font-weight: 800; text-transform: uppercase; }
                .center-info h3 { margin: 5px 0; font-size: 18px; color: #003366; font-weight: 800; }
                .center-info p { margin: 2px 0; font-size: 13px; color: #333; }
                .right-section { display: flex; align-items: center; gap: 15px; }
                .qr-code { height: 75px; width: 75px; object-fit: contain; } .uni-logo { height: 80px; } 
                .content { font-size: 15px; line-height: 1.6; margin-top: 25px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
                .label { font-weight: bold; width: 160px; display: inline-block; }
                .value { border-bottom: 1px dotted #000; flex: 1; padding-left: 10px; font-weight: 500; }
                .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; }
                .sig-line { border-top: 1px solid #000; width: 180px; text-align: center; padding-top: 8px; }
                @media print { body { border: none; } img { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style>
        </head>
        <body>
            <div class="header-container">
                <div class="left-logo"><img src="${jisGroupLogo}" alt="JIS Group"><div>Educational Initiatives</div></div>
                <div class="center-info"><h2>HANDOVER RECEIPT</h2><h3>JIS UNIVERSITY</h3><p>Agarpara, Kolkata - 700 109</p></div>
                <div class="right-section"><img src="${qrCodeUrl}" class="qr-code"><img src="${jisGroupLogo}" class="uni-logo"></div>
            </div>
            <div class="content">
                <div style="text-align: right; margin-bottom: 25px;"><strong>Date:</strong> ${dateStr}</div>
                <div class="row"><span class="label">Reference ID:</span><span class="value">${data.id}</span></div>
                <div class="row"><span class="label">Received From:</span><span class="value">JIS University Lost & Found Dept.</span></div>
                <div class="row"><span class="label">Student Name:</span><span class="value">${data.student}</span></div>
                <div class="row"><span class="label">Item Details:</span><span class="value">${data.item}</span></div>
                <div class="row"><span class="label">Status:</span><span class="value">RETURNED / HANDOVER COMPLETE</span></div>
            </div>
            <div class="footer"><div class="sig-line">Receiving Student</div><div class="sig-line">Authority Signature</div></div>
        </body>
        </html>
    `;
    const printWindow = window.open('', '', 'height=600,width=850');
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 1000);
}