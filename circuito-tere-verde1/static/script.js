document.addEventListener('DOMContentLoaded', function() {
    const trailListContainer = document.getElementById('trail-list');
    const eventListContainer = document.getElementById('event-list');
    const trailModal = document.getElementById('trail-modal');
    

    async function displayTrails(filter = 'all') {
        const response = await fetch('/api/trails');
        const trails = await response.json();

        trailListContainer.innerHTML = '';
        const filteredTrails = trails.filter(trail => filter === 'all' || trail.difficulty === filter);

        filteredTrails.forEach(trail => {
            const card = document.createElement('div');
            card.className = 'trail-card';
            card.dataset.id = trail.id; 
            card.innerHTML = `
                <img src="/static/${trail.image}" alt="${trail.name}">
                <div class="trail-card-content">
                    <h4>${trail.name}</h4>
                    <p>${trail.park}</p>
                    <span class="difficulty-badge ${trail.difficulty}">${trail.difficulty}</span>
                </div>
            `;
            trailListContainer.appendChild(card);
        });
    }

    async function displayEvents() {
        const response = await fetch('/api/events');
        const events = await response.json();
        eventListContainer.innerHTML = '';
        events.forEach(event => {
            const item = document.createElement('div');
            item.className = 'event-item';
            item.innerHTML = `
                <h4>${event.name}</h4>
                <p><strong>Quando:</strong> ${event.date_str}</p>
                <p><strong>Onde:</strong> ${event.location}</p>
                <p>${event.description}</p>
            `;
            eventListContainer.appendChild(item);
        });
    }

    async function openTrailModal(id) {
        const response = await fetch(`/api/trail/${id}`);
        const trail = await response.json();
        if (!trail) return;
        
        const modalBody = document.getElementById('modal-body');
        modalBody.innerHTML = `
            <img src="/static/${trail.image}" alt="${trail.name}">
            <h3>${trail.name}</h3>
            <p>${trail.description}</p>
            <div class="info-grid">
                <div class="info-item"><strong>Parque:</strong><br>${trail.park}</div>
                <div class="info-item"><strong>Dificuldade:</strong><br><span class="difficulty-badge ${trail.difficulty}">${trail.difficulty}</span></div>
                <div class="info-item"><strong>Duração:</strong><br>${trail.duration}</div>
                <div class="info-item"><strong>Distância:</strong><br>${trail.distance}</div>
            </div>
            <h4>Biodiversidade no Local</h4>
            <p>${trail.biodiversity}</p>
            <h4>Como Chegar</h4>
            <p>${trail.address || 'Não informado'}</p>
        `;
        trailModal.style.display = 'block';
    }

    
    
     trailListContainer.addEventListener('click', function(e) {
        const card = e.target.closest('.trail-card');
        if (card) {
            openTrailModal(card.dataset.id);
        }
    });
    
    displayTrails();
    displayEvents();
});