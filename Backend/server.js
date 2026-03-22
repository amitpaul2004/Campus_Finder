// steps to run the server:--
//cd Backend
//node server.js


//https://university-lost-found-83zs.vercel.app/

require('dotenv').config(); 

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode'); // 1. IMPORT QR LIBRARY

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
// Increase limit for Image Uploads
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// --- UPDATED EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,       // Use SSL Port
    secure: true,    // Must be true for port 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // ⬇️ ADD THIS TO FIX TIMEOUTS ⬇️
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
    },
    // Force IPv4 (Fixes Render/Gmail timeout issues)
    family: 4 
});

// Add a verification check to see if connection works on startup
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ Email Server Error: ", error);
    } else {
        console.log("✅ Email Server is Ready to Send messages");
    }
});

// --- ROUTE 0: TEST SERVER STATUS ---
app.get('/', (req, res) => {
    res.send("<h1>Server is Online!</h1><p>Active Routes: /send-report, /broadcast-alert</p>");
});

// ==========================================
// ROUTE 1: REPORT LOST ITEM (Your Code)
// ==========================================
app.post('/send-report', async (req, res) => {
    // 2. Destructure data received from Frontend
    const { userEmail, collectorName, itemName, refId, dateLost, location } = req.body;

    console.log(`Processing report for ${userEmail} | Ref: ${refId}`);

    try {
        // 3. GENERATE QR CODE DATA
        const qrData = `JIS UNIVERSITY REPORT
-----------------------
Ref ID: ${refId}
Item: ${itemName}
Student: ${collectorName}
Date: ${dateLost}
Status: REPORTED
-----------------------`;

        // 4. CREATE QR IMAGE (Base64)
        const qrImage = await QRCode.toDataURL(qrData);

        const mailOptions = {
            from: '"JISU Student Services" <your_email@gmail.com>',
            to: userEmail,
            subject: `ACTION REQUIRED: Report Submitted (${refId})`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    
                    <div style="background-color: #1e2a5e; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0;">Report Received</h2>
                    </div>

                    <div style="padding: 30px; background-color: #ffffff;">
                        <p>Dear <strong>${collectorName}</strong>,</p>
                        <p>Your report has been successfully logged in our system.</p>

                        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Ref ID:</strong> <span style="font-family: monospace; color: #1e2a5e;">${refId}</span></p>
                            <p style="margin: 5px 0;"><strong>Item:</strong> ${itemName}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${dateLost}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0; border: 2px dashed #ddd; padding: 20px; border-radius: 10px;">
                            <h3 style="color: #1e2a5e; margin-top: 0;">Verification QR Code</h3>
                            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Show this to the Librarian to instantly verify your claim.</p>
                            
                            <img src="cid:unique-qrcode-id" alt="Report QR Code" style="width: 180px; height: 180px;" />
                        </div>

                        <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin-top: 25px;">
                            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚠️ Action Required</h3>
                            <p style="color: #b45309; margin-bottom: 0; font-size: 14px;">
                                Please <strong>visit the Library Help Desk</strong> immediately to submit the found item or verify your lost item claim.
                            </p>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                        <div style="text-align: center;">
                             <a href="https://university-lost-found-83zs.vercel.app/" style="display: inline-block; background-color: #1e2a5e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 14px; margin-top: 5px;">Check Status</a>
                    </div>
                    </div>

                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        &copy; 2025 JIS University Student Services.
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrImage.split("base64,")[1],
                    encoding: 'base64',
                    cid: 'unique-qrcode-id'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email Sent Successfully to ${userEmail}`);
        res.status(200).json({ message: "Report Email Sent Successfully" });

    } catch (error) {
        console.error("Error sending report email:", error);
        res.status(500).json({ message: "Failed to send email", error: error.message });
    }
});

// ==========================================
// ROUTE 2: BROADCAST ALERT (New Feature)
// ==========================================
app.post('/broadcast-alert', async (req, res) => {
    // 1. Destructure Data
    const { audience, subject, body } = req.body;
    console.log(`📢 Broadcasting to [${audience}]: ${subject}`);

    // 2. Select Target Email Logic
    let targetEmail = "";
    switch (audience) {
        case "All Students": 
        case "All Students & Faculty": targetEmail = "rdxeveil@gmail.com"; break;
        case "CSE Dept": 
        case "CSE Department Only": targetEmail = "23cs2011016.jis@gmail.com"; break;
        case "ECE Dept": 
        case "ECE Department Only": targetEmail = "dimi.dey2004@gmail.com"; break;
        case "Hostelers": 
        case "Hostel Residents": targetEmail = "dasbedasbadal12340987@gmail.com"; break;
        default: targetEmail = process.env.EMAIL_USER; // Fallback
    }

    try {
        // 3. Generate Metadata (Date/Time)
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // 4. Generate Broadcast QR Code
        const qrText = `BROADCAST ALERT\nTarget: ${audience}\nSubject: ${subject}\nDate: ${dateStr}`;
        const qrImage = await QRCode.toDataURL(qrText);

        // 5. Configure Broadcast Email (Maintaining Your Style)
        const mailOptions = {
            from: '"JISU Broadcast System" <your_email@gmail.com>',
            to: targetEmail,
            subject: `📢 ALERT: ${subject}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    
                    <div style="background-color: #f59e0b; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; text-transform: uppercase;">Campus Alert</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Target: ${audience}</p>
                    </div>

                    <div style="padding: 30px; background-color: #ffffff;">
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #1e2a5e; margin-bottom: 25px;">
                            <table style="width: 100%; font-size: 14px; color: #334155;">
                                <tr><td style="font-weight: bold; width: 60px;">DATE:</td><td>${dateStr}</td></tr>
                                <tr><td style="font-weight: bold;">TIME:</td><td>${timeStr}</td></tr>
                            </table>
                        </div>

                        <h3 style="color: #1e2a5e; margin-top: 0;">${subject}</h3>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
                            ${body}
                        </p>

                        <div style="text-align: center; margin: 30px 0; border: 2px dashed #ddd; padding: 20px; border-radius: 10px;">
                            <h3 style="color: #1e2a5e; margin-top: 0; font-size: 16px;">Official Broadcast QR</h3>
                            <img src="cid:broadcast-qr" alt="Broadcast QR" style="width: 150px; height: 150px;" />
                        </div>
                    </div>

                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        &copy; 2025 JIS University. Automated Broadcast.
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'broadcast_qr.png',
                    content: qrImage.split("base64,")[1],
                    encoding: 'base64',
                    cid: 'broadcast-qr'
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ Broadcast sent to ${targetEmail}`);
        res.status(200).json({ success: true, message: "Broadcast sent successfully" });

    } catch (error) {
        console.error("❌ Broadcast Error:", error);
        res.status(500).json({ success: false, message: "Failed to send broadcast" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});