(() => {
  "use strict";

  const QUICK_FILTERS = [
    ["linkedin_pending", "LinkedIn 待接受"],
    ["linkedin_replied", "LinkedIn 已回复"],
    ["email_pending", "Email 待回复"],
    ["email_replied", "Email 已回复"],
  ];

  function relabelProgress() {
    document.querySelectorAll('.progress-selector').forEach((selector) => {
      const map = {
        linkedin_pending: 'LinkedIn 已发送 · 待接受',
        email_pending: 'Email 已发送 · 待回复',
        whatsapp_pending: 'WhatsApp 已发送 · 待回复',
        linkedin_replied: 'LinkedIn 已回复',
        email_replied: 'Email 已回复',
        whatsapp_replied: 'WhatsApp 已回复',
      };
      selector.querySelectorAll('label').forEach((label) => {
        const input = label.querySelector('input[name="progressTags"]');
        const span = label.querySelector('span');
        if (input && span && map[input.value]) span.textContent = map[input.value];
      });
      selector.querySelectorAll('fieldset').forEach((group) => {
        const legend = group.querySelector('legend');
        if (!legend) return;
        if (group.classList.contains('pending')) legend.textContent = '只记录：我已经发出去了';
        if (group.classList.contains('reply')) legend.textContent = '对方真正回复后再点';
        if (group.classList.contains('opportunity')) {
          legend.textContent = '形成真实业务后再记录';
          group.classList.add('v2-collapsible');
        }
      });
    });
  }

  function simplifyActivityForm() {
    const form = document.querySelector('#activity-form');
    if (!form || form.dataset.v2Ready) return;
    form.dataset.v2Ready = '1';

    const summary = form.querySelector('textarea[name="summary"]');
    if (summary) {
      summary.required = false;
      summary.placeholder = '选填。只有对方真正回复、给价、给库存或出现明确需求时再记重点。';
      const field = summary.closest('.field');
      const label = field?.querySelector('label');
      if (label) label.textContent = '沟通备注（选填）';
      if (field) field.classList.add('v2-optional-note');
    }

    const type = form.querySelector('select[name="activityType"]');
    if (type) {
      [...type.options].forEach((opt) => {
        if (opt.textContent === '首次触达') opt.textContent = '已发送 / 首次触达';
        if (opt.textContent === '二次跟进') opt.textContent = '再次发送 / 跟进';
      });
    }

    const channel = form.querySelector('select[name="channel"]');
    const progressInputs = [...form.querySelectorAll('input[name="progressTags"]')];

    const syncNoteVisibility = () => {
      if (!summary) return;
      const meaningful = progressInputs.some((i) => i.checked && /replied|quote_sent|customer_buying|customer_selling/.test(i.value));
      const field = summary.closest('.field');
      if (field) field.classList.toggle('v2-note-muted', !meaningful);
    };

    progressInputs.forEach((i) => i.addEventListener('change', syncNoteVisibility));

    if (channel) {
      channel.addEventListener('change', () => {
        const pendingByChannel = {
          LinkedIn: 'linkedin_pending',
          Email: 'email_pending',
          WhatsApp: 'whatsapp_pending',
        };
        const value = pendingByChannel[channel.value];
        if (!value) return;
        const target = form.querySelector(`input[name="progressTags"][value="${value}"]`);
        const hasResult = progressInputs.some((i) => i.checked);
        if (target && !hasResult) target.checked = true;
        syncNoteVisibility();
      });
    }

    syncNoteVisibility();
  }

  function addKnowledgeNav() {
    const nav = document.querySelector('.sidebar .nav');
    if (!nav || nav.querySelector('[data-v2-knowledge]')) return;
    const link = document.createElement('a');
    link.href = './knowledge.html';
    link.className = 'nav-item v2-nav-link';
    link.dataset.v2Knowledge = '1';
    link.innerHTML = '<span class="icon">◫</span><span>知识库</span>';
    nav.appendChild(link);
  }

  function addQuickFilters() {
    const toolbar = document.querySelector('.toolbar');
    const status = document.querySelector('#client-status');
    if (!toolbar || !status || document.querySelector('.v2-quick-filters')) return;

    const box = document.createElement('div');
    box.className = 'v2-quick-filters';
    box.innerHTML = `<span>常用：</span>${QUICK_FILTERS.map(([value, label]) => `<button type="button" data-v2-filter="${value}">${label}</button>`).join('')}<button type="button" data-v2-filter="全部">全部</button>`;
    toolbar.insertAdjacentElement('afterend', box);

    box.addEventListener('click', (event) => {
      const button = event.target.closest('[data-v2-filter]');
      if (!button) return;
      status.value = button.dataset.v2Filter;
      status.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }

  function softenLabels() {
    document.querySelectorAll('.field > label').forEach((label) => {
      if (label.textContent.includes('触达 / 回复 / 业务机会')) label.textContent = '当前进展（点一下即可）';
      if (label.textContent.includes('本次结果 / 业务机会')) label.textContent = '本次结果（没回复只选“已发送”）';
    });
  }

  function run() {
    addKnowledgeNav();
    addQuickFilters();
    relabelProgress();
    simplifyActivityForm();
    softenLabels();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', run);
  setTimeout(run, 250);
})();
