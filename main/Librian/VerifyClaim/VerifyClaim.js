// --- 1. DEFINE YEARS ---
const today = new Date();
const currentYear = today.getFullYear();
const lastYear = currentYear - 1;

// --- 2. MOCK DATABASE ---
const claimsDB = {
    [`CLM-${currentYear}-001`]: {
        item: "Blue Nike Bag",
        student: "Amit Paul",
        id: `JIS/CSE/${currentYear}/001`,
        location: "Library, 2nd Floor",
        status: "New",
        image: "https://m.media-amazon.com/images/I/51w+jK-6uUL._AC_UY1100_.jpg" 
    },
    [`CLM-${currentYear}-002`]: {
        item: "Dell Laptop Charger",
        student: "Rahul K.",
        id: `JIS/ECE/${currentYear}/042`,
        location: "Canteen",
        status: "Ready",
        image: "https://m.media-amazon.com/images/I/61M40m+fF0L.jpg"
    }
};

let currentRefId = ""; 
let html5QrcodeScanner = null;

document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('refInput');
    if(input) input.placeholder = `e.g. CLM-${currentYear}-001`;
});

function handleEnter(e) {
    if (e.key === 'Enter') verifyClaim();
}

// --- VERIFY LOGIC ---
function verifyClaim(scannedId = null) {
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

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.opacity = "1";
        btn.disabled = false;
        resultContainer.style.display = 'block';

        if (claimsDB[currentRefId]) {
            const data = claimsDB[currentRefId];
            
            document.getElementById('resItemName').innerText = data.item;
            document.getElementById('resStudent').innerText = data.student;
            document.getElementById('resStudentId').innerText = data.id || "N/A";
            document.getElementById('resLocation').innerText = data.location || "Reported via Email";
            
            const imgUrl = data.image || "https://cdn-icons-png.flaticon.com/512/679/679821.png";
            document.getElementById('resItemImage').src = imgUrl;
            
            successCard.style.display = 'block';
        } else {
            document.getElementById('invalidRef').innerText = currentRefId;
            errorCard.style.display = 'block';
        }
        
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 600);
}

// --- HANDOVER ACTION ---
function markAsReturned() {
    const btn = document.querySelector('.btn-primary');
    
    // Change button to "Complete" state
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Handover Complete';
    btn.style.background = "#0f172a"; 
    btn.disabled = true;

    // Optional: Alert the user
    // alert("Success! The item has been marked as returned.");
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
        extractedId = idMatch[0];
    } else {
        alert("Invalid QR Code: No Reference ID found.");
        return;
    }

    // Auto-Add Logic for QR codes not in static DB
    if (!claimsDB[extractedId]) {
        const itemMatch = decodedText.match(/Item:\s*(.*)/i);
        const studentMatch = decodedText.match(/Student:\s*(.*)/i);
        const imageMatch = decodedText.match(/\|Img:(.*?)\|/);

        claimsDB[extractedId] = {
            item: itemMatch ? itemMatch[1].trim() : "Scanned Item",
            student: studentMatch ? studentMatch[1].trim() : "Student",
            id: "Verified via QR", 
            location: "Front Desk (Scanned)",
            status: "Just Verified",
            image: imageMatch ? imageMatch[1].trim() : "https://cdn-icons-png.flaticon.com/512/679/679821.png"
        };
    }

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
}

function downloadReceipt() {
    if (!claimsDB[currentRefId]) return;
    const data = claimsDB[currentRefId];
    const dateStr = new Date().toLocaleDateString();
    const jisGroupLogo = "https://www.jisgroup.org/images/logo.png";
    
    const qrText = `JIS UNIVERSITY CLAIM\nRef: ${currentRefId}\nStudent: ${data.student}\nItem: ${data.item}\nStatus: VERIFIED`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;

    const receiptHTML = `
        <html>
        <head>
            <title>Receipt-${currentRefId}</title>
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
                <div class="row"><span class="label">Reference ID:</span><span class="value">${currentRefId}</span></div>
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