// steps to run the server:--
//d Frontend\Backendc
//node server.js


//https://university-lost-found-83zs.vercel.app/

require('dotenv').config(); 

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode'); // 1. IMPORT QR LIBRARY

const connectDB = require('./config/db'); // Import DB connect function
const Item = require('./models/Item');    // Import Item model
const Alert = require('./models/Alert');  // Import Alert model

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.use(cors());
// Increase limit for Image Uploads
app.use(bodyParser.json({ limit: '10mb' })); 
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// --- EMAIL CONFIGURATION (Brevo SMTP — works on Render free tier) ---
// Why Brevo? Render blocks outbound Gmail SMTP (port 587 ETIMEDOUT).
// Brevo's SMTP relay is NOT blocked by Render and uses the same nodemailer API.
const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',   // Brevo SMTP relay (works on Render)
    port: 587,                       // Standard STARTTLS port
    secure: false,                   // false = upgrade via STARTTLS
    auth: {
        user: process.env.BREVO_USER, // Your Brevo account login email
        pass: process.env.BREVO_PASS  // Brevo SMTP key (NOT your login password)
    }
});

// Startup connection check
transporter.verify(function (error, success) {
    if (error) {
        console.log("❌ Email Server Error: ", error);
    } else {
        console.log("✅ Brevo Email Server is Ready to Send messages");
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
            from: `"JISU Student Services" <${process.env.BREVO_USER}>`,
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
// ROUTE 1.2: REPORT LOST ITEM (MongoDB + Email)
// ==========================================
app.post('/api/items/report-lost', async (req, res) => {
    try {
        const { collectorName, phoneNumber, email, itemName, category, location, dateReported, description, image, refId } = req.body;
        
        console.log(`Processing Lost Item report for ${email} | Ref: ${refId}`);
        
        // 1. SAVE TO MONGODB
        const newItem = new Item({
            type: 'Lost',
            collectorName,
            phoneNumber,
            email,
            itemName,
            category,
            location,
            dateReported: new Date(dateReported),
            description,
            image: image || 'none', // Includes base64 or placeholder if missing
            status: 'new', // Lowercase enum requirement
            refId: refId // Save the matching QR ID to MongoDB
        });

        const savedItem = await newItem.save();
        console.log(`Saved Lost Item to DB: ${savedItem._id}`);

        // 2. GENERATE QR CODE DATA
        const qrData = `JIS UNIVERSITY REPORT
-----------------------
Ref ID: ${refId}
Item: ${itemName}
Student: ${collectorName}
Date: ${dateReported}
Status: REPORTED LOST
-----------------------`;

        const qrImage = await QRCode.toDataURL(qrData);

        // 3. SEND HTML EMAIL WITH QR
        const mailOptions = {
            from: `"JISU Student Services" <${process.env.BREVO_USER}>`,
            to: email, // use the unified 'email' field
            subject: `ACTION REQUIRED: Lost Item Report Submitted (${refId})`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #1e2a5e; padding: 20px; text-align: center; color: white;">
                        <h2 style="margin: 0;">Lost Item Report Received</h2>
                    </div>
                    <div style="padding: 30px; background-color: #ffffff;">
                        <p>Dear <strong>${collectorName}</strong>,</p>
                        <p>Your lost item report has been successfully logged in our system and dashboard.</p>

                        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Ref ID:</strong> <span style="font-family: monospace; color: #1e2a5e;">${refId}</span></p>
                            <p style="margin: 5px 0;"><strong>Item:</strong> ${itemName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${category}</p>
                            <p style="margin: 5px 0;"><strong>Date:</strong> ${dateReported}</p>
                            <p style="margin: 5px 0;"><strong>Location:</strong> ${location}</p>
                        </div>

                        <div style="text-align: center; margin: 30px 0; border: 2px dashed #ddd; padding: 20px; border-radius: 10px;">
                            <h3 style="color: #1e2a5e; margin-top: 0;">Verification QR Code</h3>
                            <p style="font-size: 13px; color: #666; margin-bottom: 15px;">Show this to the Librarian to verify your identity if the item is found.</p>
                            <img src="cid:unique-qrcode-id" alt="Report QR Code" style="width: 180px; height: 180px;" />
                        </div>

                        <div style="background-color: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 6px; margin-top: 25px;">
                            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">⚠️ Next Steps</h3>
                            <p style="color: #b45309; margin-bottom: 0; font-size: 14px;">
                                We will notify you if an item matching this description is turned in to the library.
                            </p>
                        </div>

                        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
                        <div style="text-align: center;">
                             <a href="https://university-lost-found-83zs.vercel.app/" style="display: inline-block; background-color: #1e2a5e; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-weight: bold; font-size: 14px; margin-top: 5px;">Check Dashboard</a>
                        </div>
                    </div>
                </div>
            `,
            attachments: [{
                filename: 'qrcode.png',
                content: qrImage.split("base64,")[1],
                encoding: 'base64',
                cid: 'unique-qrcode-id'
            }]
        };

        // Send Email but don't crash if it fails (the DB saved!)
        try {
            await transporter.sendMail(mailOptions);
            console.log(`Email Sent Successfully to ${email}`);
        } catch(emailErr) {
            console.error("Warning: DB saved but email failed:", emailErr.message);
        }

        res.status(201).json({ success: true, message: "Item reported and email sent successfully", data: savedItem });

    } catch (error) {
        console.error("Error saving lost item:", error);
        res.status(500).json({ success: false, message: "Server Error: Could not save lost item", error: error.message });
    }
});

// ==========================================
// ROUTE 1.5: REPORT FOUND ITEM (MongoDB Integration)
// ==========================================
app.post('/api/items/report-found', async (req, res) => {
    try {
        const { collectorName, phoneNumber, email, itemName, category, location, dateReported, description, image } = req.body;
        
        console.log(`Processing Found Item report for ${email}`);
        
        // Auto-generate refId for Found items since the frontend doesn't supply it!
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const autoRefId = `#CLM-${new Date().getFullYear()}-${randomNum}`;

        const newItem = new Item({
            type: 'Found',
            collectorName,
            phoneNumber,
            email,
            itemName,
            category,
            location,
            dateReported: new Date(dateReported),
            description,
            image, // Includes the base64 string
            status: 'pending',
            refId: autoRefId
        });

        const savedItem = await newItem.save();
        console.log(`Successfully saved Found Item: ${savedItem._id}`);

        res.status(201).json({ success: true, message: "Item reported successfully", data: savedItem });
    } catch (error) {
        console.error("Error saving found item:", error);
        res.status(500).json({ success: false, message: "Server Error: Could not save item", error: error.message });
    }
});

// ==========================================
// ROUTE 1.6: GET ALL ITEMS (MongoDB Integration)
// ==========================================
app.get('/api/items', async (req, res) => {
    try {
        const items = await Item.find().sort({ createdAt: -1 }); // Newest first
        res.status(200).json({ success: true, count: items.length, data: items });
    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ success: false, message: "Server Error: Could not fetch items", error: error.message });
    }
});

// ==========================================
// ROUTE 1.7: UPDATE ITEM STATUS (Librarian)
// ==========================================
app.put('/api/items/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedItem = await Item.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        if (!updatedItem) return res.status(404).json({ success: false, message: "Item not found" });
        res.status(200).json({ success: true, message: "Status updated", data: updatedItem });
    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// ==========================================
// ROUTE 1.8: DELETE ITEM (Librarian)
// ==========================================
app.delete('/api/items/:id', async (req, res) => {
    try {
        const deletedItem = await Item.findByIdAndDelete(req.params.id);
        if (!deletedItem) return res.status(404).json({ success: false, message: "Item not found" });
        res.status(200).json({ success: true, message: "Item deleted" });
    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

// ==========================================
// ROUTE 1.9: TRACK CLAIM STATUS (Lookup by RefID)
// ==========================================
app.get('/api/items/track/:refId', async (req, res) => {
    try {
        const refIdParam = req.params.refId.toUpperCase();
        console.log(`Tracking request for Ref ID: ${refIdParam}`);
        
        let item = await Item.findOne({ refId: new RegExp(`^${refIdParam}$`, 'i') });

        // Fallback for older items or Found items that didn't generate a native refId!
        // The Librarian script generated pseudo-IDs using the last 4 characters of the _id string.
        if (!item) {
            const pseudoEnding = refIdParam.split('-').pop(); // Extracts "8542" from "#CLM-2026-8542"
            if (pseudoEnding && pseudoEnding.length >= 4) {
                // Find all items and check if their stringified _id ends with this exact string natively
                const allItems = await Item.find({});
                item = allItems.find(i => i._id.toString().toUpperCase().endsWith(pseudoEnding));
            }
        }

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.status(200).json({ success: true, data: item });
    } catch (error) {
        console.error("Error looking up item:", error);
        res.status(500).json({ success: false, message: "Error looking up item" });
    }
});

// ==========================================
// ROUTE 2: BROADCAST ALERT (New Feature)
// ==========================================
app.post('/broadcast-alert', async (req, res) => {
    // 1. Destructure Data
    const { audience, subject, body, sendEmail } = req.body;
    console.log(`📢 Broadcasting to [${audience}]: ${subject} (Send Email: ${sendEmail})`);

    try {
        // 2. Generate Metadata (Date/Time)
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

        // 3. Save to MongoDB
        const newAlert = new Alert({
            audience: audience,
            subject: subject,
            body: body,
            sentViaEmail: !!sendEmail,
            time: timeStr
        });
        const savedAlert = await newAlert.save();
        console.log(`✅ Saved Alert to DB ID: ${savedAlert._id}`);

        // 4. Send Email IF requested
        if (sendEmail) {
            // Select Target Email Logic
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
                default: targetEmail = process.env.BREVO_USER; // Fallback
            }

            // Generate Broadcast QR Code
            const qrText = `BROADCAST ALERT\nTarget: ${audience}\nSubject: ${subject}\nDate: ${dateStr}`;
            const qrImage = await QRCode.toDataURL(qrText);

            // Configure Broadcast Email
            const mailOptions = {
                from: `"JISU Broadcast System" <${process.env.BREVO_USER}>`,
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
            console.log(`✅ Mass Email Broadcast sent successfully to ${targetEmail}`);
        }

        res.status(200).json({ success: true, message: "Broadcast processed successfully", data: savedAlert });

    } catch (error) {
        console.error("❌ Broadcast Error:", error);
        res.status(500).json({ success: false, message: "Failed to process broadcast", error: error.message });
    }
});

// ==========================================
// ROUTE 3: GET BROADCAST HISTORY
// ==========================================
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find().sort({ createdAt: -1 }); // Newest alerts first
        res.status(200).json({ success: true, count: alerts.length, data: alerts });
    } catch (error) {
        console.error("Error fetching alerts:", error);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});


