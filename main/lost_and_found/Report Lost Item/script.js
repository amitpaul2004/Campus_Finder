// metods to run the server :
// cd Frontend
// cd lost and found
// cd Report Lost Item
// node server.js

document.addEventListener('DOMContentLoaded', () => {
    
    const form = document.getElementById('reportForm');
    const modal = document.getElementById('success-modal');
    const uploadInput = document.getElementById('file-upload');
    const uploadLabel = document.getElementById('upload-label');

    // Visual feedback for file upload
    if(uploadInput) {
        uploadInput.addEventListener('change', function() {
            if(this.files.length > 0) {
                const fileName = this.files[0].name;
                uploadLabel.style.borderColor = "#10b981";
                uploadLabel.style.backgroundColor = "#ecfdf5";
                
                const iconCircle = uploadLabel.querySelector('.icon-circle');
                iconCircle.style.backgroundColor = "#d1fae5";
                iconCircle.querySelector('i').className = "fa-solid fa-check";
                iconCircle.querySelector('i').style.color = "#10b981";

                const uploadText = uploadLabel.querySelector('.upload-text');
                uploadText.querySelector('span').textContent = fileName;
                uploadText.querySelector('small').textContent = "File selected successfully";
                uploadText.querySelector('small').style.color = "#10b981";
            }
        });
    }

     if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Required Image Upload validation
            const fileInput = document.getElementById('file-upload');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert("Please upload an image of the lost item.");
                return;
            }
            
            const btn = document.querySelector('.submit-btn-modern');
            const originalText = btn.innerHTML;
            btn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.8';
            btn.disabled = true;

            let base64Image = null;
            
            const submitData = async () => {
                // 1. Get Data matching DB Schema
                const nameValue = document.getElementById('name-input').value;
                const userPhone = document.getElementById('phone-input').value;
                const userEmail = document.getElementById('email-input').value;
                const itemName = document.getElementById('item-input').value;
                const category = document.getElementById('category-input').value;
                const location = document.getElementById('location-input').value;
                const dateLost = document.getElementById('date-input').value;
                const description = document.getElementById('desc-input').value;

                // 2. Generate Reference ID
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const refId = `#CLM-${new Date().getFullYear()}-${randomNum}`;

                // 3. Send to New Database Endpoint
                try {
                    const response = await fetch('https://uniback-api.onrender.com/api/items/report-lost', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            collectorName: nameValue,
                            phoneNumber: userPhone,
                            email: userEmail,
                            itemName: itemName,
                            category: category,
                            location: location,
                            dateReported: dateLost,
                            description: description,
                            image: base64Image,
                            refId: refId
                        })
                    });

                    const result = await response.json();

                    if(response.ok) {
                        document.getElementById('generated-ref-id').textContent = refId;
                        document.getElementById('user-email-display').textContent = userEmail;
                        modal.classList.add('active');
                        form.reset();

                        // --- SEND CONFIRMATION EMAIL VIA EMAILJS (frontend, no backend needed) ---
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`JIS UNIVERSITY\nRef: ${refId}\nItem: ${itemName}\nStudent: ${nameValue}\nStatus: REPORTED LOST`)}`;
                        emailjs.send(
                            'service_vkxaxes',      // ← Replace with your EmailJS Service ID
                            'template_wupwxgr',     // ← Replace with your EmailJS Template ID
                            {
                                to_name:    nameValue,
                                to_email:   userEmail,
                                ref_id:     refId,
                                item_name:  itemName,
                                category:   category,
                                location:   location,
                                date_lost:  dateLost,
                                qr_code_url: qrUrl
                            }
                        ).then(() => {
                            console.log('✅ Confirmation email sent via EmailJS');
                        }).catch(err => {
                            console.warn('⚠️ Email failed (item still saved):', err);
                        });

                        // Reset image ui
                        if(uploadLabel) {
                            uploadLabel.style.borderColor = "#e2e8f0";
                            uploadLabel.style.backgroundColor = "";
                            const iconCircle = uploadLabel.querySelector('.icon-circle');
                            iconCircle.style.backgroundColor = "white";
                            iconCircle.querySelector('i').className = "fa-solid fa-cloud-arrow-up";
                            iconCircle.querySelector('i').style.color = "#3b82f6";
                            const uploadText = uploadLabel.querySelector('.upload-text');
                            uploadText.querySelector('span').textContent = "Click to upload an image";
                            uploadText.querySelector('small').textContent = "(Required) AI Auto-tagging enabled";
                            uploadText.querySelector('small').style.color = "#94a3b8";
                        }
                    } else {
                        alert('Failed to submit report: ' + (result.message || 'Unknown Error'));
                    }
                } catch(err) {
                    console.error(err);
                    alert('Server error. Run "node server.js" in backend folder.');
                } finally {
                    btn.innerHTML = originalText;
                    btn.style.opacity = '1';
                    btn.disabled = false;
                }
            };

            // Read image if provided
            if (fileInput && fileInput.files.length > 0) {
                const reader = new FileReader();
                reader.readAsDataURL(fileInput.files[0]);
                reader.onload = function() {
                    base64Image = reader.result;
                    submitData();
                };
                reader.onerror = function() {
                    alert("Error reading file image.");
                    btn.innerHTML = originalText;
                    btn.style.opacity = '1';
                    btn.disabled = false;
                };
            } else {
                // Submit without image
                submitData();
            }
        });
    }
});

function closeModal() {
    document.getElementById('success-modal').classList.remove('active');
}
