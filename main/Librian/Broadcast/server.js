// steps to run the server:--
// cd Frontend\Librian\Broadcast
// node server.js

require('dotenv').config(); 
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');

const app = express();
const PORT = 5000;

// --- MIDDLEWARE ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your sending email
        pass: process.env.EMAIL_PASS  // Your App Password
    }
});

// --- ROUTE 1: TEST SERVER ---
app.get('/', (req, res) => {
    res.send("<h1>Server is Online!</h1>");
});

// --- ROUTE 2: REPORT LOST ITEM ---
app.post('/send-report', async (req, res) => {
    res.json({ message: "Report logic active" }); 
});

// --- ROUTE 3: BROADCAST ALERT (Targeted Emails) ---
app.post('/broadcast-alert', async (req, res) => {
    console.log("📢 Broadcast Request Received!"); 
    
    const { audience, subject, body } = req.body;
    let targetEmail = "";

    // --- 1. SELECT EMAIL BASED ON AUDIENCE ---
    // Note: The case values must match the 'value' attributes in your HTML <option> tags exactly.
    switch (audience) {
        case "All Students": // Matches value="All Students"
        case "All Students & Faculty":
            targetEmail = "rdxeveil@gmail.com";
            break;
            
        case "CSE Dept": // Matches value="CSE Dept"
        case "CSE Department Only":
            targetEmail = "23cs2011016.jis@gmail.com";
            break;
            
        case "ECE Dept": // Matches value="ECE Dept"
        case "ECE Department Only":
            targetEmail = "dimi.dey2004@gmail.com";
            break;
            
        case "Hostelers": // Matches value="Hostelers"
        case "Hostel Residents":
            targetEmail = "dasbedasbadal12340987@gmail.com";
            break;
            
        default:
            targetEmail = process.env.EMAIL_USER; // Fallback to yourself
            console.log("⚠️ Unknown audience, sending to default admin.");
    }

    console.log(`📧 Sending to [${audience}] -> ${targetEmail}`);

    try {
        // 2. GENERATE DATE & QR
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        const qrText = `JIS BROADCAST ALERT\n-------------------\nDate: ${dateStr}\nTime: ${timeStr}\nTo: ${audience}\nSubject: ${subject}\n\nMessage:\n${body}`;
        const qrCodeImage = await QRCode.toDataURL(qrText);

        // 3. SEND EMAIL
        const mailOptions = {
            from: '"JISU Broadcast System" <your_email@gmail.com>',
            to: targetEmail, 
            subject: `📢 ALERT: ${subject}`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background-color: #ffffff;">
                    
                    <div style="background-color: #1e2a5e; padding: 25px; text-align: center; color: white;">
                        <h2 style="margin: 0; letter-spacing: 1px; font-size: 24px;">OFFICIAL BROADCAST</h2>
                        <p style="margin: 5px 0 0 0; font-size: 14px; color: #cbd5e1;">Target Group: ${audience}</p>
                    </div>

                    <div style="padding: 30px;">
                        
                        <div style="background-color: #f8fafc; border-left: 5px solid #f59e0b; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                            <table style="width: 100%; font-size: 14px; color: #334155;">
                                <tr><td style="font-weight: bold; width: 60px;">DATE:</td><td>${dateStr}</td></tr>
                                <tr><td style="font-weight: bold;">TIME:</td><td>${timeStr}</td></tr>
                                <tr><td style="font-weight: bold;">TO:</td><td><span style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 600; font-size: 12px; color: #1e2a5e;">${audience}</span></td></tr>
                            </table>
                        </div>

                        <h3 style="color: #1e2a5e; margin-top: 0; font-size: 20px;">${subject}</h3>
                        <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 30px;">
                            ${body}
                        </p>

                        <div style="text-align: center; border-top: 2px dashed #e2e8f0; padding-top: 25px;">
                            <p style="font-size: 12px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 15px;">Official Verification QR</p>
                            <img src="cid:unique-broadcast-qr" alt="Broadcast QR" style="width: 150px; height: 150px; border: 1px solid #ddd; padding: 5px; border-radius: 8px;">
                        </div>
                    </div>

                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #64748b; font-size: 11px;">
                        &copy; 2026 JIS University. Automated Message.
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: 'broadcast_qr.png',
                    content: qrCodeImage.split("base64,")[1],
                    encoding: 'base64',
                    cid: 'unique-broadcast-qr' 
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Detailed Broadcast Sent Successfully");
        res.status(200).json({ success: true, message: "Broadcast sent successfully" });

    } catch (error) {
        console.error("❌ Error:", error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});