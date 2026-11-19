document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('dreamForm');
    const dreamsList = document.getElementById('dreamsList');
    
    // Load dreams from localStorage
    let dreams = JSON.parse(localStorage.getItem('dreams')) || [];
    renderDreams();

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('dreamTitle').value;
        const content = document.getElementById('dreamContent').value;
        const date = document.getElementById('dreamDate').value;
        
        const dream = { title, content, date, id: Date.now() };
        dreams.push(dream);
        localStorage.setItem('dreams', JSON.stringify(dreams));
        
        form.reset();
        renderDreams();
    });

    function renderDreams() {
        dreamsList.innerHTML = '';
        dreams.sort((a, b) => new Date(b.date) - new Date(a.date));
        dreams.forEach(dream => {
            const div = document.createElement('div');
            div.className = 'dream-item';
            div.innerHTML = `
                <h3>${dream.title}</h3>
                <p><small>${dream.date}</small></p>
                <p>${dream.content}</p>
            `;
            dreamsList.appendChild(div);
        });
    }
});
