document.addEventListener('DOMContentLoaded', function() {
  
    const trailListContainer = document.getElementById('trail-list');
    const eventListContainer = document.getElementById('event-list');
    const trailModal = document.getElementById('trail-modal');
    const modalBody = document.getElementById('modal-body');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    const loginModal = document.getElementById('login-modal');
    const closeButtons = document.querySelectorAll('.close-btn');
    const adminLoginBtn = document.getElementById('admin-login-btn');


    

    
    async function displayTrails(filter = 'all') {
        try {
            
            const response = await fetch('/api/trails');
            if (!response.ok) throw new Error(`Erro na API de trilhas: ${response.status}`);
            
            const trails = await response.json();

            trailListContainer.innerHTML = ''; 
            const filteredTrails = trails.filter(trail => filter === 'all' || trail.difficulty === filter);

            filteredTrails.forEach(trail => {
                const card = document.createElement('div');
                card.className = 'trail-card';
                card.dataset.id = trail.id;
                card.innerHTML = `
                    <img src="${trail.image}" alt="${trail.name}">
                    <div class="trail-card-content">
                        <h4>${trail.name}</h4>
                        <p>${trail.park}</p>
                        <span class="difficulty-badge ${trail.difficulty}">${trail.difficulty}</span>
                    </div>
                `;
                trailListContainer.appendChild(card);
            });
        } catch (error) {
            console.error('Falha ao carregar as trilhas:', error);
            trailListContainer.innerHTML = '<p style="color: red;">Não foi possível carregar as trilhas. Verifique o console para mais detalhes.</p>';
        }
    }

    async function displayEvents() {
        try {
            const response = await fetch('/api/events');
            if (!response.ok) throw new Error(`Erro na API de eventos: ${response.status}`);
            
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
        } catch (error) {
            console.error('Falha ao carregar os eventos:', error);
            eventListContainer.innerHTML = '<p style="color: red;">Não foi possível carregar os eventos.</p>';
        }
    }

    async function openTrailModal(id) {
        try {
            const response = await fetch(`/api/trail/${id}`);
            if (!response.ok) throw new Error(`Erro na API de detalhes: ${response.status}`);
            
            const trail = await response.json();

            modalBody.innerHTML = `
                <img src="${trail.image}" alt="${trail.name}">
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
        } catch (error) {
            console.error(`Falha ao buscar detalhes da trilha ${id}:`, error);
        }
    }
    
    

    if (filterButtons) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                
                if(document.querySelector('.filter-btn.active')) {
                    document.querySelector('.filter-btn.active').classList.remove('active');
                }
                btn.classList.add('active');
                displayTrails(btn.dataset.filter);
            });
        });
    }

    if (trailListContainer) {
        trailListContainer.addEventListener('click', function(e) {
            const card = e.target.closest('.trail-card');
            if (card) {
                openTrailModal(card.dataset.id);
            }
        });
    }
    
    
    if (closeButtons) {
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').style.display = 'none';
            });
        });
    }

    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            if(loginModal) loginModal.style.display = 'block';
        });
    }

    
    displayTrails();
    displayEvents();
});