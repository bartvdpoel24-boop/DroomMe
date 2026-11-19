document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('dreamForm');
    const dreamsList = document.getElementById('dreamsList');
    const searchInput = document.getElementById('searchInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analysisResult = document.getElementById('analysisResult');
    const notifyBtn = document.getElementById('notifyBtn');
    const tagSuggestions = document.querySelectorAll('.tag-suggestions span');

    let dreams = JSON.parse(localStorage.getItem('dreams')) || [];

    // Set default datetime to now
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('dreamDatetime').value = localISO;

    function saveDreams() {
        localStorage.setItem('dreams', JSON.stringify(dreams));
    }

    function getTags(input) {
        return input.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    }

    function renderDreams(filter = '') {
        dreamsList.innerHTML = '';
        const query = filter.toLowerCase();
        const filtered = dreams.filter(d => {
            const haystack = `${d.title} ${d.content} ${(d.tags || []).join(' ')}`.toLowerCase();
            return haystack.includes(query);
        }).sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

        if (filtered.length === 0) {
            dreamsList.innerHTML = '<p>Geen dromen gevonden.</p>';
            return;
        }

        filtered.forEach(dream => {
            const div = document.createElement('div');
            div.className = 'dream-item';
            const date = new Date(dream.datetime);
            const formatted = date.toLocaleString('nl-NL', {
                day: 'numeric', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            const tagsHtml = (dream.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
            const moodHtml = dream.mood ? `<span class="mood">Stemming: ${dream.mood}/5</span>` : '';

            div.innerHTML = `
                <h3>${escapeHtml(dream.title)}</h3>
                <div class="dream-meta">${formatted} ${moodHtml}</div>
                <p>${escapeHtml(dream.content)}</p>
                ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
                <button class="delete-btn" data-id="${dream.id}">Verwijderen</button>
            `;
            dreamsList.appendChild(div);
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('dreamTitle').value.trim();
        const content = document.getElementById('dreamContent').value.trim();
        const datetime = document.getElementById('dreamDatetime').value;
        const mood = document.getElementById('dreamMood').value;
        const tags = getTags(document.getElementById('dreamTags').value);

        dreams.push({
            id: Date.now(),
            title,
            content,
            datetime,
            mood: mood || null,
            tags
        });
        saveDreams();
        form.reset();
        document.getElementById('dreamDatetime').value = localISO;
        renderDreams(searchInput.value);
    });

    dreamsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const id = Number(e.target.dataset.id);
            dreams = dreams.filter(d => d.id !== id);
            saveDreams();
            renderDreams(searchInput.value);
        }
    });

    searchInput.addEventListener('input', () => renderDreams(searchInput.value));

    // Tag suggestions
    tagSuggestions.forEach(span => {
        span.addEventListener('click', () => {
            const input = document.getElementById('dreamTags');
            const current = input.value.trim();
            const tag = span.dataset.tag;
            if (!current.toLowerCase().includes(tag)) {
                input.value = current ? `${current}, ${tag}` : tag;
            }
        });
    });

    // Analysis
    const stopwords = new Set(['de', 'het', 'een', 'en', 'van', 'ik', 'te', 'dat', 'die', 'in', 'op', 'is', 'was', 'met', 'voor', 'aan', 'er', 'om', 'maar', 'niet', 'ook', 'als', 'dan', 'uit', 'bij', 'nog', 'wel', 'geen', 'kan', 'zou', 'zijn', 'had', 'heb', 'mijn', 'mij', 'me', 'je', 'jij', 'we', 'wij', 'ze', 'zij']);

    analyzeBtn.addEventListener('click', () => {
        if (dreams.length === 0) {
            analysisResult.innerHTML = '<p>Nog geen dromen om te analyseren.</p>';
            return;
        }

        // Tag frequencies
        const tagCount = {};
        dreams.forEach(d => (d.tags || []).forEach(t => {
            tagCount[t] = (tagCount[t] || 0) + 1;
        }));
        const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 8);

        // Word frequencies
        const wordCount = {};
        dreams.forEach(d => {
            const words = (d.title + ' ' + d.content).toLowerCase().match(/[a-zà-ÿ]+/g) || [];
            words.forEach(w => {
                if (w.length > 2 && !stopwords.has(w)) {
                    wordCount[w] = (wordCount[w] || 0) + 1;
                }
            });
        });
        const topWords = Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 10);

        let html = '<h3>Meest voorkomende tags</h3><ul>';
        if (topTags.length) {
            topTags.forEach(([tag, count]) => html += `<li>${tag}: ${count}x</li>`);
        } else {
            html += '<li>Nog geen tags</li>';
        }
        html += '</ul><h3>Meest voorkomende woorden</h3><ul>';
        topWords.forEach(([word, count]) => html += `<li>${word}: ${count}x</li>`);
        html += '</ul>';

        analysisResult.innerHTML = html;
    });

    // Notification reminder (simple: schedule for next morning if permission granted)
    notifyBtn.addEventListener('click', async () => {
        if (!('Notification' in window)) {
            alert('Notificaties worden niet ondersteund in deze browser.');
            return;
        }
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
            // Demo: notify in 5 seconds (in real use you could use a service worker or keep page open)
            setTimeout(() => {
                new Notification('DroomMe', {
                    body: 'Tijd om je dromen van vannacht op te schrijven!',
                    icon: 'https://github.com/favicon.ico'
                });
            }, 5000);
            alert('Toestemming verleend. Er verschijnt over 5 seconden een demo-notificatie. Voor een echte ochtendherinnering kun je de app toevoegen aan je beginscherm of een PWA-uitbreiding overwegen.');
        } else {
            alert('Notificaties zijn geweigerd.');
        }
    });

    renderDreams();
});
