// metods to run the server :
// cd Frontend
// cd lost and found
// cd Report Lost Item
// node server.js

require('dotenv').config(); 

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode'); // 1. IMPORT QR LIBRARY

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- EMAIL CONFIGURATION ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

app.post('/send-report', async (req, res) => {
    // 2. Destructure data received from Frontend
    const { userEmail, collectorName, itemName, refId, dateLost, location } = req.body;

    console.log(`Processing report for ${userEmail} | Ref: ${refId}`);

    try {
        // 3. GENERATE QR CODE DATA
        // We construct a string that contains the 'refId'.
        // The VerifyClaim scanner will look for the pattern "CLM-YYYY-XXX" inside this text.
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

                        <a href="http://localhost:5500/claim_status.html" style="display: inline-block; background-color: #1e2a5e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 14px; margin-top: 5px;">Check Status</a>
                    </div>

                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; color: #888; font-size: 12px;">
                        &copy; 2025 JIS University Student Services.
                    </div>
                </div>
            `,
            // 6. ATTACH THE IMAGE DATA
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrImage.split("base64,")[1], // Remove the data:image/png;base64 part
                    encoding: 'base64',
                    cid: 'unique-qrcode-id' // Matches the <img src="cid:..."> above
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email Sent Successfully to ${userEmail}`);
        res.status(200).json({ message: "Email Sent Successfully" });

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Failed to send email", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});