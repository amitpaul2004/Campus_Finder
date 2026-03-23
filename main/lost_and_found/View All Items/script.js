document.addEventListener("DOMContentLoaded", () => {
    
    // --- Elements ---
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const itemsGrid = document.getElementById('itemsGrid');
    const emptyState = document.getElementById('emptyState');
    let itemCards = []; // Will be populated dynamically

    // --- 0. FETCH DATA FROM BACKEND ---
    async function fetchItems() {
        try {
            const response = await fetch('http://localhost:5000/api/items');
            const result = await response.json();

            if (result.success && result.data) {
                renderItems(result.data);
            } else {
                showErrorState();
            }
        } catch (error) {
            console.error("Error fetching items:", error);
            showErrorState();
        }
    }

    function showErrorState() {
        itemsGrid.innerHTML = '';
        emptyState.classList.add('visible');
        document.getElementById('empty-title').textContent = "Server Error";
        document.getElementById('empty-desc').textContent = "Failed to load items. Make sure backend is running.";
    }

    function renderItems(items) {
        itemsGrid.innerHTML = ''; // Clear loading spinner

        if (items.length === 0) {
            emptyState.classList.add('visible');
            document.getElementById('empty-title').textContent = "No Items Found";
            document.getElementById('empty-desc').textContent = "No items have been reported yet.";
            return;
        }

        items.forEach(item => {
            // Check if it's lost or found based on type string.
            const isLost = item.type.toLowerCase() === 'lost';
            const cardClass = isLost ? 'lost-card' : 'found-card';
            const badgeBg = isLost ? '#ff9f76' : '#2ecc71';
            
            // Format nice date
            const dateObj = new Date(item.dateReported);
            const friendlyDate = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

            // Create Card Element
            const div = document.createElement('div');
            div.className = `item-card ${cardClass} js-scroll-anim`;
            
            // Store data attributes for search and modal logic
            div.setAttribute('data-type', item.type.toLowerCase());
            div.setAttribute('data-title', item.itemName);
            div.setAttribute('data-category', item.category);
            div.setAttribute('data-status', item.type); // Lost or Found
            div.setAttribute('data-location', item.location);
            div.setAttribute('data-date', friendlyDate);
            div.setAttribute('data-collector', item.collectorName);
            div.setAttribute('data-phone', item.phoneNumber);
            div.setAttribute('data-email', item.email);
            div.setAttribute('data-desc', item.description || "No description provided.");
            div.setAttribute('data-image', item.image || "");

            div.innerHTML = `
                <div class="card-status-badge" style="background: ${badgeBg}; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; position: absolute; top: 15px; right: 15px; z-index: 2; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">${item.type}</div>
                <div class="card-image-wrapper js-open-modal" style="height: 200px; overflow: hidden; border-radius: 12px 12px 0 0; cursor: pointer;">
                    ${item.image ? `<img src="${item.image}" alt="Item" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;">` : `<div style="width: 100%; height: 100%; background: #f1f5f9; display: flex; align-items: center; justify-content: center; color: #94a3b8;"><i class="fa-solid fa-image fa-2x"></i></div>`}
                </div>  
                <div class="card-content" style="padding: 20px;">
                    <span class="item-category" style="color: #3b82f6; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${item.category}</span>
                    <h3 class="item-title" style="margin: 8px 0; color: #1e2a5e; font-size: 18px;">${item.itemName}</h3>
                    <div class="item-meta" style="display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #64748b; margin-bottom: 20px;">
                        <span><i class="fa-solid fa-location-dot" style="margin-right:5px;"></i> ${item.location}</span>
                        <span><i class="fa-regular fa-calendar" style="margin-right:5px;"></i> ${friendlyDate}</span>
                    </div>
                    <button class="view-btn" style="width: 100%; background: #f8fafc; color: #1e2a5e; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; font-weight: 600; cursor: pointer; transition: all 0.3s ease;">View Details <i class="fa-solid fa-arrow-right" style="margin-left: 5px; font-size:12px;"></i></button>
                </div>
            `;

            itemsGrid.appendChild(div);
        });

        // Re-query dynamically created elements
        itemCards = document.querySelectorAll('.item-card');
        
        initModalLogic();
        initScrollAnimations();
        updateStats(); // Count items on load
    }

    // --- 1. AUTO-COUNT STATS ---
    function updateStats() {
        const total = itemCards.length;
        const lost = document.querySelectorAll('.item-card[data-type="lost"]').length;
        const found = document.querySelectorAll('.item-card[data-type="found"]').length;
        document.getElementById('total-count').textContent = total;
        document.getElementById('lost-count').textContent = lost;
        document.getElementById('found-count').textContent = found;
    }

    // --- 2. SEARCH & FILTER LOGIC ---
    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterType = filterSelect.value;
        let visibleCount = 0;

        itemCards.forEach(card => {
            const title = card.getAttribute('data-title').toLowerCase();
            const category = card.getAttribute('data-category').toLowerCase();
            const cardType = card.getAttribute('data-type'); 

            const matchesSearch = title.includes(searchTerm) || category.includes(searchTerm);
            const matchesType = (filterType === 'all') || (filterType === cardType);

            if (matchesSearch && matchesType) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle Empty State
        if (visibleCount === 0 && itemCards.length > 0) {
            itemsGrid.style.display = 'none';
            emptyState.classList.add('visible');
            
            if(searchTerm) {
                document.getElementById('empty-title').textContent = "No Search Results";
                document.getElementById('empty-desc').innerHTML = `No items match "<b>${searchTerm}</b>".`;
            } else {
                document.getElementById('empty-title').textContent = "No Items Found";
                document.getElementById('empty-desc').textContent = "There are no items matching this filter.";
            }
        } else if (itemCards.length > 0) {
            itemsGrid.style.display = 'grid';
            emptyState.classList.remove('visible');
        }
    }

    // --- 3. DETAILS MODAL POPULATOR ---
    function initModalLogic() {
        const modal = document.getElementById('details-modal');
        const triggers = document.querySelectorAll('.view-btn, .js-open-modal');

        triggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                const card = e.target.closest('.item-card');

                document.getElementById('modal-title').textContent = card.getAttribute('data-title');
                document.getElementById('modal-category').textContent = card.getAttribute('data-category');
                document.getElementById('modal-desc').textContent = card.getAttribute('data-desc');
                
                document.querySelector('#modal-date span').textContent = card.getAttribute('data-date');
                document.querySelector('#modal-location span').textContent = card.getAttribute('data-location');
                document.querySelector('#modal-collector span').textContent = card.getAttribute('data-collector');
                document.querySelector('#modal-phone span').textContent = card.getAttribute('data-phone');
                document.querySelector('#modal-email span').textContent = card.getAttribute('data-email');

                const status = card.getAttribute('data-status');
                const statusBadge = document.getElementById('modal-status');
                statusBadge.textContent = status;
                statusBadge.style.background = status.toLowerCase() === 'lost' ? '#ff9f76' : '#2ecc71';

                const imageSrc = card.getAttribute('data-image');
                const imgEl = document.getElementById('modal-img');
                const noImgEl = document.getElementById('modal-no-img');
                
                if (imageSrc && imageSrc.trim() !== "") {
                    imgEl.src = imageSrc; imgEl.style.display = 'block'; noImgEl.style.display = 'none';
                } else {
                    imgEl.style.display = 'none'; noImgEl.style.display = 'flex';
                }

                modal.classList.add('active');
            });
        });
    }

    // --- 4. SCROLL ANIMATION ---
    function initScrollAnimations() {
        const animatedCards = document.querySelectorAll('.js-scroll-anim');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => { entry.target.classList.add('is-visible'); }, index * 100); 
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedCards.forEach(card => observer.observe(card));
    }

    // --- 5. INITIALIZATION ---
    fetchItems(); // Will start the entire rendering chain and bind events
    
    // Static Listeners
    searchInput.addEventListener('keyup', filterItems);
    filterSelect.addEventListener('change', filterItems);
});

// Helper Functions
function closeDetailsModal() { document.getElementById('details-modal').classList.remove('active'); }
function resetSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterSelect').value = 'all';
    document.getElementById('filterSelect').dispatchEvent(new Event('change'));
}