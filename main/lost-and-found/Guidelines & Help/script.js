document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SCROLL ANIMATION OBSERVER
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    const animatedElements = document.querySelectorAll('.fade-in-on-scroll');
    animatedElements.forEach((el) => observer.observe(el));

});

// 2. LIVE SEARCH FILTERING (With Shake Effect)
function filterFAQs() {
    const input = document.getElementById('faqSearch').value.toLowerCase().trim();
    const items = document.querySelectorAll('.accordion-item');
    const noResults = document.getElementById('noResults');
    let hasMatch = false;

    // Loop through all FAQ items
    items.forEach(item => {
        const title = item.querySelector('.accordion-header span').innerText.toLowerCase();
        const content = item.querySelector('.inner-content').innerText.toLowerCase();
        const keywords = item.getAttribute('data-keywords') || "";
        
        // Match Title, Content, or Hidden Keywords
        if (title.includes(input) || content.includes(input) || keywords.includes(input)) {
            item.style.display = "block";
            item.style.borderColor = input.length > 0 ? "#3b82f6" : "transparent"; // Highlight match
            hasMatch = true;
        } else {
            item.style.display = "none";
            item.style.borderColor = "transparent";
        }
    });

    // Handle "No Results" + Shake Animation
    if (hasMatch) {
        noResults.style.display = "none";
        noResults.classList.remove('shake-anim');
    } else {
        noResults.style.display = "block";
        noResults.classList.remove('shake-anim'); 
        void noResults.offsetWidth; // Trigger reflow to restart animation
        noResults.classList.add('shake-anim'); 
    }
}

// 3. ACCORDION TOGGLE
function toggleAccordion(button) {
    button.classList.toggle('active');
    const content = button.nextElementSibling;
    
    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
        
        // Optional: Auto-close other items for cleaner UI
        document.querySelectorAll('.accordion-header').forEach(btn => {
            if(btn !== button) {
                btn.classList.remove('active');
                btn.nextElementSibling.style.maxHeight = null;
            }
        });
    }
}