document.addEventListener('DOMContentLoaded', () => {

    // 1. File Upload Logic
    const fileInput = document.getElementById('file-upload');
    const uploadText = document.getElementById('upload-text');
    const uploadBox = document.querySelector('.file-upload-box');

    if(fileInput) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const name = this.files[0].name;
                uploadText.innerHTML = `
                    <i class="fa-solid fa-circle-check" style="color: #2ecc71;"></i>
                    <span style="color: #333;">${name}</span>
                `;
                uploadBox.style.borderColor = '#2ecc71';
            }
        });
    }

    // 2. Form Submission Logic
    const form = document.querySelector('.college-form');
    const modal = document.getElementById('success-modal');
    
    if(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // Stop page reload

            const submitBtn = form.querySelector('.submit-btn');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Submitting... <i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            // Extract values
            const data = {
                collectorName: document.getElementById('collector-name').value,
                phoneNumber: document.getElementById('phone-number').value,
                email: document.getElementById('user-email').value,
                itemName: document.getElementById('item-name').value,
                category: document.getElementById('category').value,
                location: document.getElementById('location').value,
                dateReported: document.getElementById('date-reported').value,
                description: document.getElementById('description').value
            };

            try {
                const response = await fetch('http://localhost:5000/api/items/report-found', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    // Update Modal
                    const nameDisplay = document.getElementById('collector-name-display');
                    if(nameDisplay) {
                        nameDisplay.textContent = data.collectorName || "Collector";
                    }

                    // Show the Modal
                    modal.classList.add('active');

                    // Reset form
                    form.reset();
                    if(uploadText && uploadBox) {
                        uploadText.innerHTML = `
                            <i class="fa-solid fa-cloud-arrow-up"></i>
                            <span>Upload Image (Optional)</span>
                        `;
                        uploadBox.style.borderColor = '#ddd';
                    }
                } else {
                    alert('Failed to submit report: ' + (result.message || 'Unknown error'));
                }
            } catch (err) {
                console.error(err);
                alert('Error connecting to the server. Is the backend running?');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

});

// 3. Function to Close Modal
function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('active');
}