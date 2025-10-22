// frontend JS: fetch news from backend and render
async function loadNews() {
  const list = document.getElementById('newsList');
  if (!list) return;
  list.textContent = 'Loading...';
  try {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    if (!Array.isArray(data.items)) throw new Error('Invalid data');

    if (data.items.length === 0) {
      list.innerHTML = '<p>No news items available.</p>';
      return;
    }

    list.innerHTML = '';
    data.items.forEach(item => {
      const div = document.createElement('div');
      div.className = 'news-item';
      div.innerHTML = `
        <h3><a href="${escapeHtml(item.link)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></h3>
        <div class="news-meta">${escapeHtml(item.pubDate || '')}</div>
        <p>${escapeHtml(item.contentSnippet || '')}</p>
      `;
      list.appendChild(div);
    });

  } catch (err) {
    list.innerHTML = '<p>Error loading news.</p>';
    console.error(err);
  }
}

function escapeHtml(s){
  if(!s) return '';
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// run on pages that include newsList
document.addEventListener('DOMContentLoaded', () => {
  loadNews();
});