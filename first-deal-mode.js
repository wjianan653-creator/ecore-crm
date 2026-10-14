(() => {
  "use strict";

  const FOCUS_KEY = "ecore-crm-first-deal-focus-v1";
  const OVERSEAS_KEY = "ecore-crm-overseas-only-v1";

  const defaultFocus = [
    {
      priority: "CORE",
      title: "DDR5 Server RAM",
      detail: "Samsung / SK hynix / Micron · 32GB / 64GB / 96GB / 128GB · 5600 / 6400 MT/s",
      note: "长期主线：优先 factory-new / unused，原厂包装；先拿 availability / qty / price / location。"
    },
    {
      priority: "CORE",
      title: "Enterprise / Data Center SSD",
      detail: "Samsung / Micron / Kioxia / Solidigm",
      note: "长期主线：Exact PN 优先；先判断 own stock / partner stock / can source。"
    },
    {
      priority: "P0",
      title: "Intel Xeon 6740P × 44",
      detail: "TP USD 6,000/pc · 最多 1 周交付",
      note: "当前瓶颈：可验证的 44pcs firm stock。临时急单，不扩成长期模块。"
    },
    {
      priority: "P0",
      title: "MZWL67T6HBLC-00AW7 × 480",
      detail: "TP USD 3,000/pc",
      note: "当前瓶颈：大批量可交付库存 + 可做价格；优先 Samsung / Enterprise SSD 渠道。"
    },
    {
      priority: "P1",
      title: "Bulk SSD × 7,000",
      detail: "Solidigm D7-P5620 / Micron 7450 MAX / 7500 MAX",
      note: "先补 Capacity / Exact PN / Form Factor / 数量分配，再扩大询价。"
    }
  ];

  let scheduled = false;

  function loadFocus() {
    try {
      const parsed = JSON.parse(localStorage.getItem(FOCUS_KEY));
      return Array.isArray(parsed) && parsed.length ? parsed : defaultFocus;
    } catch {
      return defaultFocus;
    }
  }

  function saveFocus(items) {
    localStorage.setItem(FOCUS_KEY, JSON.stringify(items));
  }

  function overseasOnly() {
    return localStorage.getItem(OVERSEAS_KEY) !== "0";
  }

  function setOverseasOnly(value) {
    localStorage.setItem(OVERSEAS_KEY, value ? "1" : "0");
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function navLabel(button) {
    return button?.textContent?.replace(/\d+/g, "").trim() || "";
  }

  function simplifySidebar() {
    document.querySelectorAll(".sidebar .nav-item").forEach((button) => {
      const label = navLabel(button);
      const view = button.dataset.view;

      if (view === "dashboard") {
        const spans = button.querySelectorAll("span");
        if (spans[1]) spans[1].textContent = "今日作战";
      }
      if (view === "pipeline") {
        const spans = button.querySelectorAll("span");
        if (spans[1]) spans[1].textContent = "Deal / 机会";
      }

      if (["tasks", "activities"].includes(view)) button.classList.add("fd-hidden");
      else button.classList.remove("fd-hidden");

      if (label.includes("知识库")) button.classList.add("fd-hidden");
    });

    document.querySelectorAll(".sidebar button, .sidebar a").forEach((element) => {
      const text = element.textContent?.trim() || "";
      if (/^导入/.test(text) || text.includes("GPU渠道") || text.includes("恢复备份") && !element.id) {
        element.classList.add("fd-import-tool");
      }
    });
  }

  function metricValue(label) {
    const metric = [...document.querySelectorAll(".metric")].find((el) => el.textContent.includes(label));
    return metric?.querySelector("strong")?.textContent?.trim() || "0";
  }

  function renderFocusCards() {
    return loadFocus().map((item, index) => {
      const cls = item.priority === "P0" ? "p0" : item.priority === "P1" ? "p1" : "";
      return `<article class="fd-demand-card" data-priority="${esc(item.priority)}">
        <div class="fd-demand-top">
          <strong>${esc(item.title)}</strong>
          <span class="fd-pill ${cls}">${esc(item.priority)}</span>
        </div>
        <p>${esc(item.detail)}</p>
        <small>${esc(item.note)}</small>
        <div style="margin-top:10px;"><button class="fd-mini-btn" data-fd-edit="${index}">编辑</button>${item.priority !== "CORE" ? ` <button class="fd-mini-btn" data-fd-remove="${index}">完成/移除</button>` : ""}</div>
      </article>`;
    }).join("");
  }

  function enhanceDashboard() {
    const topbar = document.querySelector(".workspace .topbar");
    if (!topbar || !topbar.textContent.includes("今日业务控制台")) return;

    const title = topbar.querySelector("h1");
    const note = topbar.querySelector(".header-note");
    if (title) title.textContent = "First Deal 作战台";
    if (note) note.textContent = "只看最接近成交的动作：真实需求、真实库存、可做价格、明确下一步。";

    const metrics = document.querySelector(".workspace .metrics");
    const grid = document.querySelector(".workspace .dashboard-grid");
    if (metrics) metrics.classList.add("fd-legacy-wrap");
    if (grid) grid.classList.add("fd-legacy-wrap");

    if (document.querySelector(".fd-focus-board")) return;

    const opportunity = metricValue("已发现机会");
    const ready = metricValue("进入核验/评估");
    const today = metricValue("今日待跟进");

    const board = document.createElement("section");
    board.className = "fd-focus-board";
    board.innerHTML = `
      <div class="fd-principle"><strong>工作逻辑：</strong> RFQ / 当前需求决定今天找什么；账户库告诉你去找谁；Deal 只放真实商业证据。LinkedIn、Email、WhatsApp 只是触达方式，不再当成 Pipeline。</div>

      <div class="fd-kpi-row">
        <div class="fd-kpi"><span>真实商业机会</span><b>${esc(opportunity)}</b></div>
        <div class="fd-kpi"><span>进入核验 / 评估</span><b>${esc(ready)}</b></div>
        <div class="fd-kpi"><span>今日原任务</span><b>${esc(today)}</b></div>
      </div>

      <div class="fd-section-head">
        <div><h2>Current Buying / 当前重点</h2><p>核心长期只保留 RAM + Enterprise SSD；老板临时急单作为 P0/P1 卡片，不单独造复杂模块。</p></div>
        <div><button class="fd-mini-btn" data-fd-add>＋ 临时需求</button> <button class="fd-mini-btn fd-legacy-toggle" data-fd-legacy>查看原任务数据</button></div>
      </div>
      <div class="fd-demand-grid">${renderFocusCards()}</div>
    `;

    topbar.insertAdjacentElement("afterend", board);
  }

  function isMainlandRow(row) {
    const cells = row.querySelectorAll("td");
    if (!cells.length) return false;
    const text = `${cells[0]?.textContent || ""} ${row.textContent || ""}`.toLowerCase();
    if (text.includes("hong kong") || text.includes("香港")) return false;
    return ["china", "中国", "shenzhen", "深圳", "beijing", "北京", "shanghai", "上海", "guangzhou", "广州"].some((term) => text.includes(term));
  }

  function applyOverseasFilter() {
    const enabled = overseasOnly();
    document.querySelectorAll(".workspace table tbody tr[data-client]").forEach((row) => {
      row.classList.toggle("fd-hidden", enabled && isMainlandRow(row));
    });
    const button = document.querySelector("[data-fd-overseas]");
    if (button) {
      button.textContent = enabled ? "海外优先：ON" : "海外优先：OFF";
      button.classList.toggle("fd-off", !enabled);
    }
  }

  function enhanceClients() {
    const header = document.querySelector(".workspace .section-header h1");
    if (!header || header.textContent.trim() !== "账户库") return;

    if (!document.querySelector(".fd-filter-note")) {
      const toolbar = document.querySelector(".workspace .toolbar");
      if (toolbar) {
        const note = document.createElement("div");
        note.className = "fd-filter-note";
        note.innerHTML = `<span>默认只看海外账户；中国内地/深圳记录不删除，只在日常视图隐藏。</span><button data-fd-overseas>${overseasOnly() ? "海外优先：ON" : "海外优先：OFF"}</button>`;
        toolbar.insertAdjacentElement("beforebegin", note);
      }
    }

    applyOverseasFilter();
  }

  const dealStages = new Set([
    "已向客户发送报价",
    "已收到供应报价",
    "已发现采购需求",
    "已确认库存机会",
    "资料核验中",
    "价格评估中",
    "商务谈判中",
    "已成交"
  ]);

  function enhancePipeline() {
    const header = document.querySelector(".workspace .section-header h1");
    if (!header || !header.textContent.includes("机会漏斗")) return;

    header.textContent = "Deal / 商业机会";
    const eyebrow = document.querySelector(".workspace .section-header .eyebrow");
    if (eyebrow) eyebrow.textContent = "只有真实需求 / 库存 / 报价 / 商务推进才进入这里";

    const board = document.querySelector(".workspace .pipeline-board");
    if (!board) return;

    if (!document.querySelector(".fd-deal-banner")) {
      const banner = document.createElement("div");
      banner.className = "fd-deal-banner";
      banner.innerHTML = `<strong>简化规则：</strong> LinkedIn Pending、Email Pending、WhatsApp Pending、单纯 Reply 都不是 Deal 阶段；这些仍保留在账户沟通记录中。`;
      board.insertAdjacentElement("beforebegin", banner);
    }

    board.querySelectorAll(".pipeline-column").forEach((column) => {
      const stage = column.querySelector(".column-title h2")?.textContent?.trim() || "";
      column.classList.toggle("fd-hidden", !dealStages.has(stage));
    });
  }

  function hideSetupImports() {
    document.querySelectorAll("button, a").forEach((element) => {
      const text = element.textContent?.trim() || "";
      if (/^\+?\s*导入/.test(text) && !text.includes("新客户")) element.classList.add("fd-hidden");
    });
  }

  function enhance() {
    simplifySidebar();
    hideSetupImports();
    enhanceDashboard();
    enhanceClients();
    enhancePipeline();
  }

  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      enhance();
    });
  }

  document.addEventListener("click", (event) => {
    const add = event.target.closest("[data-fd-add]");
    if (add) {
      const title = prompt("临时需求：PN / 产品名", "");
      if (!title) return;
      const detail = prompt("Qty / TP / Required Date", "");
      const note = prompt("当前唯一瓶颈 / 下一步", "");
      const items = loadFocus();
      items.push({ priority: "P1", title, detail: detail || "待补充", note: note || "待设置" });
      saveFocus(items);
      document.querySelector(".fd-focus-board")?.remove();
      scheduleEnhance();
      return;
    }

    const edit = event.target.closest("[data-fd-edit]");
    if (edit) {
      const index = Number(edit.dataset.fdEdit);
      const items = loadFocus();
      const item = items[index];
      if (!item) return;
      const title = prompt("需求名称", item.title);
      if (title === null) return;
      const detail = prompt("规格 / Qty / TP / 时间", item.detail);
      if (detail === null) return;
      const note = prompt("唯一瓶颈 / 下一步", item.note);
      if (note === null) return;
      items[index] = { ...item, title: title || item.title, detail: detail || item.detail, note: note || item.note };
      saveFocus(items);
      document.querySelector(".fd-focus-board")?.remove();
      scheduleEnhance();
      return;
    }

    const remove = event.target.closest("[data-fd-remove]");
    if (remove) {
      const index = Number(remove.dataset.fdRemove);
      const items = loadFocus();
      items.splice(index, 1);
      saveFocus(items);
      document.querySelector(".fd-focus-board")?.remove();
      scheduleEnhance();
      return;
    }

    const overseas = event.target.closest("[data-fd-overseas]");
    if (overseas) {
      setOverseasOnly(!overseasOnly());
      applyOverseasFilter();
      return;
    }

    const legacy = event.target.closest("[data-fd-legacy]");
    if (legacy) {
      const wraps = document.querySelectorAll(".fd-legacy-wrap");
      const open = [...wraps].some((el) => el.classList.contains("fd-open"));
      wraps.forEach((el) => el.classList.toggle("fd-open", !open));
      legacy.textContent = open ? "查看原任务数据" : "收起原任务数据";
    }
  });

  const observer = new MutationObserver(scheduleEnhance);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("load", scheduleEnhance);
  scheduleEnhance();
})();
