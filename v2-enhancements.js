(() => {
  "use strict";

  const QUICK_FILTERS = [
    ["linkedin_pending", "LinkedIn 待接受"],
    ["linkedin_replied", "LinkedIn 已回复"],
    ["email_pending", "Email 待回复"],
    ["email_replied", "Email 已回复"],
  ];

  const CHANNEL_PENDING = {
    LinkedIn: "linkedin_pending",
    Email: "email_pending",
    WhatsApp: "whatsapp_pending",
  };

  function setOnlyChannelState(form, value) {
    const channel = value.split("_")[0];
    form.querySelectorAll('input[name="progressTags"]').forEach((input) => {
      if (input.value.startsWith(`${channel}_`)) input.checked = input.value === value;
    });
    const target = form.querySelector(`input[name="progressTags"][value="${value}"]`);
    if (target) target.checked = true;
  }

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
        if (group.classList.contains('pending')) legend.textContent = '未形成对话：只记“已发送”';
        if (group.classList.contains('reply')) legend.textContent = '对方真正回复后再记录';
        if (group.classList.contains('opportunity')) {
          legend.textContent = '出现报价 / 采购 / 库存机会后再记录';
          group.classList.add('v2-collapsible');
        }
      });
    });
  }

  function addClientQuickSave() {
    const form = document.querySelector('#client-form');
    if (!form || form.querySelector('.v2-one-click-status')) return;
    const selector = form.querySelector('.progress-selector');
    if (!selector) return;

    const box = document.createElement('div');
    box.className = 'v2-one-click-status';
    box.innerHTML = `
      <div class="v2-one-click-copy"><strong>未回复？一键保存状态</strong><span>不用填回复文本，不用写备注，不用设下次动作。</span></div>
      <div class="v2-one-click-buttons">
        <button type="button" data-one-click="linkedin_pending">LinkedIn 已发送 · 待接受</button>
        <button type="button" data-one-click="email_pending">Email 已发送 · 待回复</button>
        <button type="button" data-one-click="whatsapp_pending">WhatsApp 已发送 · 待回复</button>
      </div>`;
    selector.parentElement.insertBefore(box, selector);

    box.addEventListener('click', (event) => {
      const button = event.target.closest('[data-one-click]');
      if (!button) return;
      setOnlyChannelState(form, button.dataset.oneClick);
      form.requestSubmit();
    });
  }

  function simplifyActivityForm() {
    const form = document.querySelector('#activity-form');
    if (!form || form.dataset.v2Ready) return;
    form.dataset.v2Ready = '1';

    const summary = form.querySelector('textarea[name="summary"]');
    if (summary) {
      summary.required = false;
      summary.placeholder = '选填：只记会影响下一步的信息，例如 PN、Qty、Price、Location、ETA。';
      const field = summary.closest('.field');
      const label = field?.querySelector('label');
      if (label) label.textContent = '关键沟通备注（选填）';
      if (field) field.classList.add('v2-optional-note');
    }

    const type = form.querySelector('select[name="activityType"]');
    const channel = form.querySelector('select[name="channel"]');
    const progressInputs = [...form.querySelectorAll('input[name="progressTags"]')];

    if (type) {
      [...type.options].forEach((opt) => {
        if (opt.textContent === '首次触达') opt.textContent = '已发送 / 首次触达';
        if (opt.textContent === '二次跟进') opt.textContent = '再次发送 / 跟进';
      });
    }

    const grid = form.querySelector('.form-grid');
    if (grid) {
      const quick = document.createElement('div');
      quick.className = 'field wide v2-activity-quick';
      quick.innerHTML = `
        <div class="v2-one-click-copy"><strong>只是发出去了、对方没回？</strong><span>直接点下面一个按钮就保存，下面详细内容都不用填。</span></div>
        <div class="v2-one-click-buttons">
          <button type="button" data-activity-quick="LinkedIn">LinkedIn · 待接受</button>
          <button type="button" data-activity-quick="Email">Email · 待回复</button>
          <button type="button" data-activity-quick="WhatsApp">WhatsApp · 待回复</button>
        </div>`;
      grid.insertBefore(quick, grid.firstChild);
      quick.addEventListener('click', (event) => {
        const button = event.target.closest('[data-activity-quick]');
        if (!button) return;
        const selectedChannel = button.dataset.activityQuick;
        if (channel) channel.value = selectedChannel;
        if (type) type.value = '首次触达';
        setOnlyChannelState(form, CHANNEL_PENDING[selectedChannel]);
        if (summary) summary.value = '';
        const nextDue = form.querySelector('[name="nextDueAt"]');
        const nextAction = form.querySelector('[name="nextAction"]');
        if (nextDue) nextDue.value = '';
        if (nextAction) nextAction.value = '';
        form.requestSubmit();
      });
    }

    const syncNoteVisibility = () => {
      if (!summary) return;
      const meaningful = progressInputs.some((i) => i.checked && /replied|quote_sent|customer_buying|customer_selling/.test(i.value));
      const field = summary.closest('.field');
      if (field) field.classList.toggle('v2-note-muted', !meaningful);
    };

    progressInputs.forEach((i) => i.addEventListener('change', syncNoteVisibility));

    if (channel) {
      channel.addEventListener('change', () => {
        const value = CHANNEL_PENDING[channel.value];
        if (!value) return;
        const hasResult = progressInputs.some((i) => i.checked);
        if (!hasResult) setOnlyChannelState(form, value);
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
    box.innerHTML = `<span>我最常看：</span>${QUICK_FILTERS.map(([value, label]) => `<button type="button" data-v2-filter="${value}">${label}</button>`).join('')}<button type="button" data-v2-filter="全部">全部</button>`;
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
      if (label.textContent.includes('触达 / 回复 / 业务机会')) label.textContent = '当前进展';
      if (label.textContent.includes('本次结果 / 业务机会')) label.textContent = '本次结果（只有真实进展才多记）';
    });
  }

  function run() {
    addKnowledgeNav();
    addQuickFilters();
    relabelProgress();
    addClientQuickSave();
    simplifyActivityForm();
    softenLabels();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('DOMContentLoaded', run);
  setTimeout(run, 250);
})();
