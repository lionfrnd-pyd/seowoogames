(() => {
  const panel = document.querySelector('[data-feedback-panel]');
  if (!panel) return;

  const storageKey = 'seowoo-feedback-history-v1';
  const maxEntries = 200;
  const labels = { jump: '점프', hanja: '한자', both: '공통' };
  const form = panel.querySelector('#feedbackForm');
  const list = panel.querySelector('#feedbackList');
  const count = panel.querySelector('#feedbackCount');
  const status = panel.querySelector('#feedbackStatus');
  const clearButton = panel.querySelector('#feedbackClear');

  function readEntries() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter(entry =>
        entry && typeof entry.text === 'string' &&
        Object.prototype.hasOwnProperty.call(labels, entry.game) &&
        Number.isFinite(entry.createdAt)
      ).slice(0, maxEntries);
    } catch {
      return [];
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(entries));
      return true;
    } catch {
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function formatDate(timestamp) {
    return new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(new Date(timestamp));
  }

  let entries = readEntries();

  function render() {
    count.textContent = String(entries.length);
    clearButton.disabled = entries.length === 0;
    if (entries.length === 0) {
      list.innerHTML = '<li class="feedback-empty">아직 기록된 요청이 없어요.</li>';
      return;
    }

    list.innerHTML = entries.map((entry, index) => {
      const date = new Date(entry.createdAt);
      return `<li class="feedback-entry">
        <div class="feedback-entry-heading">
          <div class="feedback-entry-meta"><span class="feedback-entry-game">${labels[entry.game]}</span><time datetime="${date.toISOString()}">${escapeHtml(formatDate(entry.createdAt))}</time></div>
          <button class="feedback-delete" type="button" data-feedback-delete="${index}" aria-label="${labels[entry.game]} 요청 삭제">삭제</button>
        </div>
        <p class="feedback-entry-text">${escapeHtml(entry.text)}</p>
      </li>`;
    }).join('');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const formData = new FormData(form);
    const text = formData.get('message').trim();
    const game = formData.get('game');
    if (!text || !Object.prototype.hasOwnProperty.call(labels, game)) return;

    const previousEntries = entries;
    entries = [{ game, text, createdAt: Date.now() }, ...entries].slice(0, maxEntries);
    if (!saveEntries()) {
      entries = previousEntries;
      status.textContent = '저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요.';
      return;
    }

    form.elements.message.value = '';
    render();
    status.textContent = '요청을 기록했어요.';
  });

  list.addEventListener('click', event => {
    const button = event.target.closest('[data-feedback-delete]');
    if (!button) return;
    const index = Number(button.dataset.feedbackDelete);
    if (!Number.isInteger(index) || index < 0 || index >= entries.length) return;

    const removed = entries.splice(index, 1);
    if (!saveEntries()) {
      entries.splice(index, 0, ...removed);
      status.textContent = '변경 사항을 저장할 수 없어요.';
      return;
    }
    render();
  });

  clearButton.addEventListener('click', () => {
    if (entries.length === 0 || !window.confirm('요청 히스토리를 모두 삭제할까요?')) return;
    const previousEntries = entries;
    entries = [];
    if (!saveEntries()) {
      entries = previousEntries;
      status.textContent = '변경 사항을 저장할 수 없어요.';
      return;
    }
    render();
    status.textContent = '요청 기록을 모두 삭제했어요.';
  });

  window.addEventListener('storage', event => {
    if (event.key !== storageKey) return;
    entries = readEntries();
    render();
  });

  render();
})();