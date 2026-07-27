(() => {
  "use strict";

  const app = document.getElementById("app");
  const backupFile = document.getElementById("backup-file");
  const STORAGE_KEY = "ecore-crm-secure-v1";
  const SESSION_KEY = "ecore-crm-session-key";
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let data = null;
  let cryptoKey = null;
  let view = "dashboard";
  let selectedClientId = null;
  let modal = null;
  let toastTimer = null;
  let clientSearch = "";
  let clientStatus = "全部";
  let quickDraft = { company: "", website: "" };

  const navItems = [
    ["dashboard", "▦", "工作台"],
    ["clients", "●", "客户库"],
    ["tasks", "✓", "跟进任务"],
    ["activities", "➤", "触达记录"],
    ["quotes", "◆", "报价与库存"],
    ["report", "▥", "老板汇报"],
  ];
  const statuses = ["新线索", "已触达", "已回复", "报价中", "谈判中", "已成交", "暂缓", "无效"];
  const statusTone = { 新线索: "gray", 已触达: "blue", 已回复: "cyan", 报价中: "purple", 谈判中: "orange", 已成交: "green", 暂缓: "gray", 无效: "red" };

  function uid() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }
  function isoOffset(days, hour = 10, minute = 0) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }
  function dateKey(value) {
    const d = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  }
  function fmt(value, time = true) {
    if (!value) return "未设置";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Singapore", month: "numeric", day: "numeric",
      ...(time ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
    }).format(d);
  }
  function localInput(days = 0, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }
  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[m]);
  }
  function clientById(id) {
    return data.clients.find((item) => item.id === Number(id));
  }
  function trustLevel(score) {
    return score >= 85 ? "较可信" : score >= 65 ? "需继续核验" : "待核验";
  }
  function statusPill(status) {
    return `<span class="status ${statusTone[status] || "gray"}">${escapeHtml(status)}</span>`;
  }
  function trustPill(score) {
    const tone = score >= 85 ? "good" : score >= 65 ? "medium" : "low";
    return `<span class="trust ${tone}">${score} · ${trustLevel(score)}</span>`;
  }

  function seedData() {
    const now = new Date().toISOString();
    const clients = [
      { id: 101, company: "ClusterVision", website: "https://clustervision.com", country: "Netherlands", businessRole: "潜在买家", products: "DDR5 RDIMM, GPU, HPC", source: "官网 / LinkedIn", contactName: "Procurement Team", jobTitle: "", email: "info@clustervision.com", whatsapp: "", linkedin: "", status: "已触达", trustScore: 88, followUpStage: "二次跟进", lastTouchAt: isoOffset(-3, 16, 10), nextFollowUpAt: isoOffset(0, 10, 30), nextAction: "确认是否采购 DDR5 RDIMM，并约 15 分钟沟通", notes: "HPC / AI 基础设施方向，匹配企业级内存和 GPU。", createdAt: isoOffset(-6), updatedAt: now },
      { id: 102, company: "Stortech", website: "https://stortech.ae", country: "UAE", businessRole: "供应商", products: "Enterprise SSD, Server Memory", source: "官网", contactName: "Anil Gupta", jobTitle: "Owner", email: "", whatsapp: "", linkedin: "", status: "已回复", trustScore: 72, followUpStage: "报价询盘", lastTouchAt: isoOffset(-1, 20, 15), nextFollowUpAt: isoOffset(0, 14), nextAction: "询问是否现货、Date Code、实物图片和最佳价格", notes: "已开始沟通，收到报价前先核验货况及公司实体。", createdAt: isoOffset(-5), updatedAt: now },
      { id: 103, company: "PMCO", website: "https://pmco.eu", country: "Lithuania", businessRole: "潜在买家", products: "DDR5 RDIMM, Enterprise SSD", source: "LinkedIn", contactName: "Mindaugas Seduikis", jobTitle: "", email: "", whatsapp: "", linkedin: "https://www.linkedin.com", status: "已触达", trustScore: 84, followUpStage: "三次跟进", lastTouchAt: isoOffset(-7, 11), nextFollowUpAt: isoOffset(1, 9, 30), nextAction: "基于 AI/HPC 项目发送更具体的库存合作问句", notes: "已通过 LinkedIn 连接，需避免模板化跟进。", createdAt: isoOffset(-8), updatedAt: now },
      { id: 104, company: "Settech Inc.", website: "https://settechinc.com", country: "United States", businessRole: "双向合作", products: "Server Components, SSD", source: "官网", contactName: "", jobTitle: "", email: "", whatsapp: "", linkedin: "", status: "新线索", trustScore: 64, followUpStage: "首次触达", lastTouchAt: "", nextFollowUpAt: isoOffset(2, 10), nextAction: "查找采购/供应链负责人并发送定制邮件", notes: "需要补全联系人、团队规模与地址核验。", createdAt: isoOffset(-3), updatedAt: now },
      { id: 105, company: "Wiwynn", website: "https://www.wiwynn.com", country: "Taiwan", businessRole: "潜在买家", products: "AI Server, Cloud Infrastructure, Rack Solutions", source: "官网 / LinkedIn", contactName: "", jobTitle: "", email: "", whatsapp: "", linkedin: "", status: "新线索", trustScore: 95, followUpStage: "联系人研究", lastTouchAt: "", nextFollowUpAt: isoOffset(3, 15), nextAction: "定位供应链、供应商注册或项目剩余库存合作联系人", notes: "大型云基础设施公司，匹配度高，触达应更精准。", createdAt: isoOffset(-2), updatedAt: now },
    ];
    return {
      version: 1,
      clients,
      tasks: [
        { id: 201, clientId: 101, title: "发送二次跟进：确认 DDR5 RDIMM 需求", dueAt: isoOffset(0, 10, 30), priority: "高", stage: "二次跟进", completed: false },
        { id: 202, clientId: 102, title: "询问库存、货况、Date Code 与最佳价格", dueAt: isoOffset(0, 14), priority: "高", stage: "报价询盘", completed: false },
        { id: 203, clientId: 103, title: "发送第三次定制化跟进", dueAt: isoOffset(1, 9, 30), priority: "普通", stage: "三次跟进", completed: false },
        { id: 204, clientId: 104, title: "补全采购联系人与邮箱", dueAt: isoOffset(2, 10), priority: "普通", stage: "联系人研究", completed: false },
      ],
      activities: [
        { id: 301, clientId: 101, channel: "Email", activityType: "首次触达", stage: "首次触达", summary: "已发送企业级内存与 GPU 供应合作介绍。", nextAction: "确认当前采购方向", occurredAt: isoOffset(-3, 16, 10), nextDueAt: isoOffset(0, 10, 30) },
        { id: 302, clientId: 102, channel: "WhatsApp", activityType: "客户回复", stage: "报价询盘", summary: "对方表示可以提供企业级 SSD 报价，等待具体库存信息。", nextAction: "索取实物图、Date Code 和贸易条款", occurredAt: isoOffset(-1, 20, 15), nextDueAt: isoOffset(0, 14) },
      ],
      quotes: [
        { id: 401, clientId: 102, partNumber: "MZWLJ3T8HBLS-00007", category: "Enterprise SSD", brand: "Samsung", description: "3.84TB NVMe U.2", quantity: 40, unitPrice: "410", currency: "USD", condition: "Factory Sealed", dateCode: "待确认", stockLocation: "Dubai", leadTime: "2–3 days", incoterm: "EXW", quoteStatus: "价格偏高", createdAt: now },
      ],
    };
  }

  function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach((b) => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function base64ToBytes(value) {
    const binary = atob(value);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  }
  async function deriveKey(password, salt) {
    const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 180000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
  }
  async function encryptPayload(payload, key, salt) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(JSON.stringify(payload)));
    return { format: "ecore-crm-encrypted", version: 1, salt: bytesToBase64(salt), iv: bytesToBase64(iv), data: bytesToBase64(new Uint8Array(ciphertext)), updatedAt: new Date().toISOString() };
  }
  async function decryptPayload(record, key) {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(record.iv) }, key, base64ToBytes(record.data));
    return JSON.parse(decoder.decode(plain));
  }
  async function saveData() {
    if (!cryptoKey || !data) return;
    const old = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const salt = old.salt ? base64ToBytes(old.salt) : crypto.getRandomValues(new Uint8Array(16));
    const encrypted = await encryptPayload(data, cryptoKey, salt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
  }
  async function transact(mutator, message) {
    mutator(data);
    await saveData();
    render();
    toast(message);
  }

  function renderAuth(mode = "login", error = "") {
    const setup = mode === "setup";
    app.innerHTML = `
      <main class="auth-shell">
        <section class="auth-panel">
          <div class="auth-brand"><span>ecore</span><small>CRM</small></div>
          <div class="auth-kicker">${setup ? "首次使用 · 创建本机密码" : "安全访问"}</div>
          <h1>${setup ? "建立你的客户工作台" : "欢迎回来，Jenna"}</h1>
          <p class="auth-copy">${setup
            ? "设置一个至少 6 位的访问密码。客户、报价和跟进数据会加密后保存在当前浏览器，不会上传到 GitHub。"
            : "输入你首次设置的密码，解锁保存在这台设备上的客户、报价和跟进数据。"}</p>
          <form class="auth-form" id="auth-form">
            <label for="auth-password">${setup ? "创建访问密码" : "访问密码"}</label>
            <div class="auth-input-row">
              <input id="auth-password" name="password" type="password" minlength="6" autocomplete="${setup ? "new-password" : "current-password"}" required placeholder="${setup ? "至少 6 位，请务必记住" : "请输入密码"}" />
              <button type="submit">${setup ? "创建并进入" : "解锁 CRM"}</button>
            </div>
            <p class="auth-error">${escapeHtml(error)}</p>
          </form>
          <div class="auth-note"><b>✓</b><span>GitHub Pages 只存放网页程序，不存放你的客户数据。请定期进入系统下载加密备份。</span></div>
          ${setup ? "" : `<button class="subtle-button" id="import-auth" style="margin-top:16px;padding:0 14px;">从加密备份恢复</button>`}
        </section>
        <aside class="auth-art"><span class="orb one"></span><span class="orb two"></span><p>专注芯片分销<br />连接全球机会</p></aside>
      </main>`;
    document.getElementById("auth-form").addEventListener("submit", (event) => handleAuth(event, setup));
    document.getElementById("import-auth")?.addEventListener("click", () => backupFile.click());
    setTimeout(() => document.getElementById("auth-password")?.focus(), 0);
  }

  async function handleAuth(event, setup) {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get("password").toString();
    if (password.length < 6) return renderAuth(setup ? "setup" : "login", "密码至少需要 6 位");
    app.innerHTML = `<div class="loading-screen">正在安全解锁…</div>`;
    try {
      if (setup) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        cryptoKey = await deriveKey(password, salt);
        data = seedData();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(await encryptPayload(data, cryptoKey, salt)));
      } else {
        const record = JSON.parse(localStorage.getItem(STORAGE_KEY));
        cryptoKey = await deriveKey(password, base64ToBytes(record.salt));
        data = await decryptPayload(record, cryptoKey);
      }
      sessionStorage.setItem(SESSION_KEY, password);
      render();
      const overdue = openTasks().filter((task) => new Date(task.dueAt) < new Date()).length;
      if (overdue) toast(`有 ${overdue} 个跟进任务已到期，请优先处理`);
    } catch {
      cryptoKey = null;
      data = null;
      sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login", "密码不正确，或本地数据已损坏");
    }
  }

  function logout() {
    cryptoKey = null;
    data = null;
    sessionStorage.removeItem(SESSION_KEY);
    renderAuth(localStorage.getItem(STORAGE_KEY) ? "login" : "setup");
  }

  function openTasks() {
    return data.tasks.filter((task) => !task.completed);
  }
  function stats() {
    const now = new Date();
    const today = dateKey(now);
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const open = openTasks();
    return {
      today: open.filter((t) => dateKey(t.dueAt) === today).length,
      overdue: open.filter((t) => new Date(t.dueAt) < now && dateKey(t.dueAt) !== today).length,
      newWeek: data.clients.filter((c) => new Date(c.createdAt) >= weekAgo).length,
      replied: data.clients.filter((c) => ["已回复", "报价中", "谈判中", "已成交"].includes(c.status)).length,
    };
  }
  function renderNav() {
    const counts = { tasks: openTasks().length, clients: data.clients.length };
    return `
      <aside class="sidebar">
        <div class="brand"><span>ecore</span><small>CRM</small></div>
        <nav class="nav">${navItems.map(([id, icon, label]) => `
          <button class="nav-item ${view === id ? "active" : ""}" data-view="${id}">
            <span class="icon">${icon}</span><span>${label}</span>${counts[id] ? `<b class="badge">${counts[id]}</b>` : ""}
          </button>`).join("")}</nav>
        <div class="sidebar-tools">
          <button class="subtle-button" id="download-backup">下载加密备份</button>
          <button class="subtle-button" id="restore-backup">恢复备份</button>
          <button class="subtle-button" id="logout">锁定 CRM</button>
        </div>
        <div class="sidebar-art"><span></span><b></b></div>
      </aside>`;
  }
  function top(title, eyebrow, actions = true) {
    return `<header class="section-header"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1></div>
      ${actions ? `<div class="top-actions"><button class="secondary" data-action="activity">＋ 记录沟通</button><button class="primary" data-action="client">＋ 录入新客户</button></div>` : ""}
    </header>`;
  }
  function renderDashboard() {
    const s = stats();
    const priority = [...openTasks()].sort((a, b) => (a.priority === "高" ? -1 : 1) - (b.priority === "高" ? -1 : 1) || new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 5);
    const progress = [
      ["⌕", "新线索", data.clients.filter((c) => c.status === "新线索").length],
      ["➤", "已触达", data.clients.filter((c) => c.status === "已触达").length],
      ["●", "已回复", data.clients.filter((c) => c.status === "已回复").length],
      ["▤", "报价中", data.clients.filter((c) => c.status === "报价中").length],
    ];
    return `
      <header class="topbar"><div><p class="eyebrow">${new Intl.DateTimeFormat("zh-CN", { dateStyle: "full", timeZone: "Asia/Singapore" }).format(new Date())}</p><h1>早上好，Jenna</h1></div>
        <div class="top-actions"><div class="search-box"><input id="global-search" placeholder="搜索公司、联系人、料号…" /></div><button class="primary" data-action="client">＋ 录入新客户</button></div>
      </header>
      <section class="metrics">
        <article class="metric"><div><label>今日待跟进</label><strong>${s.today}</strong></div><span class="metric-icon">◷</span></article>
        <article class="metric danger"><div><label>超期任务</label><strong>${s.overdue}</strong></div><span class="metric-icon">!</span></article>
        <article class="metric"><div><label>本周新客户</label><strong>${s.newWeek}</strong></div><span class="metric-icon">＋</span></article>
        <article class="metric"><div><label>已回复</label><strong>${s.replied}</strong></div><span class="metric-icon">●</span></article>
      </section>
      <section class="dashboard-grid">
        <div>
          <article class="panel">
            <div class="panel-title"><h2>今日优先跟进</h2><small>按优先级和到期时间排序</small></div>
            ${priority.length ? `<div class="priority-list">${priority.map((task) => {
              const client = clientById(task.clientId);
              return `<button class="priority-row" data-client="${task.clientId}"><strong>${escapeHtml(client?.company || "未知客户")}</strong><span>${escapeHtml(client?.products || "待补充产品")}</span><span>${escapeHtml(task.stage)}</span><time>${fmt(task.dueAt)}</time></button>`;
            }).join("")}</div>` : `<div class="empty">没有待处理任务</div>`}
            <div style="margin-top:20px"><button class="primary" data-action="client">＋ 录入新客户</button></div>
          </article>
          <article class="quick-card">
            <h3>网址快速建档</h3><p>粘贴公司官网，先自动提取域名与公司名，再补充背调信息。</p>
            <div class="quick-row"><input id="quick-url" placeholder="例如：https://company.com" /><button class="secondary" id="analyze-url">提取并建档</button></div>
          </article>
        </div>
        <div>
          <article class="panel">
            <div class="panel-title"><h2>客户进度</h2></div>
            <div class="progress-list">${progress.map(([icon, label, count]) => `<div class="progress-row"><span class="progress-icon">${icon}</span><span>${label}</span><b>${count}</b></div>`).join("")}</div>
          </article>
          <div class="motto"><strong>专注芯片分销<br />连接全球机会</strong></div>
        </div>
      </section>`;
  }
  function renderClients() {
    const keyword = clientSearch.toLowerCase();
    const rows = data.clients.filter((c) => {
      const text = [c.company, c.country, c.products, c.contactName, c.email].join(" ").toLowerCase();
      return text.includes(keyword) && (clientStatus === "全部" || c.status === clientStatus);
    });
    return `${top("客户库", "客户与供应商全景资料")}
      <div class="toolbar"><input id="client-search" class="grow" value="${escapeHtml(clientSearch)}" placeholder="搜索公司、国家、产品、联系人或邮箱" />
        <select id="client-status"><option>全部</option>${statuses.map((s) => `<option ${s === clientStatus ? "selected" : ""}>${s}</option>`).join("")}</select>
      </div>
      <div class="table-wrap"><table><thead><tr><th>公司</th><th>国家 / 角色</th><th>产品方向</th><th>联系人</th><th>进度</th><th>可信度</th><th>下次跟进</th><th>下一步</th></tr></thead>
      <tbody>${rows.map((c) => `<tr class="clickable" data-client="${c.id}"><td><div class="company-cell"><strong>${escapeHtml(c.company)}</strong><small>${escapeHtml(c.website)}</small></div></td><td>${escapeHtml(c.country || "待补充")}<br><small>${escapeHtml(c.businessRole)}</small></td><td>${escapeHtml(c.products || "待补充")}</td><td>${escapeHtml(c.contactName || "待寻找")}<br><small>${escapeHtml(c.jobTitle)}</small></td><td>${statusPill(c.status)}</td><td>${trustPill(c.trustScore)}</td><td>${fmt(c.nextFollowUpAt)}</td><td>${escapeHtml(c.nextAction)}</td></tr>`).join("")}</tbody></table>
      ${rows.length ? "" : `<div class="empty">没有符合条件的客户</div>`}</div>`;
  }
  function renderTasks() {
    const columns = [["今日", (t) => !t.completed && dateKey(t.dueAt) === dateKey(new Date())], ["未来", (t) => !t.completed && new Date(t.dueAt) > new Date() && dateKey(t.dueAt) !== dateKey(new Date())], ["超期", (t) => !t.completed && new Date(t.dueAt) < new Date() && dateKey(t.dueAt) !== dateKey(new Date())], ["已完成", (t) => t.completed]];
    return `${top("跟进任务", "二次、三次、四次跟进节奏")}
      <section class="task-board">${columns.map(([name, test]) => {
        const items = data.tasks.filter(test).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
        return `<div class="task-column"><div class="column-title"><h2>${name}</h2><b>${items.length}</b></div><div class="task-list">${items.length ? items.map((t) => {
          const client = clientById(t.clientId);
          return `<article class="task-card ${t.completed ? "done" : ""}"><div class="task-card-head"><button class="task-check" data-task="${t.id}">${t.completed ? "✓" : ""}</button><span class="priority ${t.priority === "高" ? "high" : ""}">${t.priority}</span></div><button class="task-client" style="border:0;background:none;padding:0;cursor:pointer" data-client="${t.clientId}">${escapeHtml(client?.company || "未知客户")}</button><p>${escapeHtml(t.title)}</p><time>${fmt(t.dueAt)} · ${escapeHtml(t.stage)}</time></article>`;
        }).join("") : `<div class="empty" style="padding:25px 4px">暂无任务</div>`}</div></div>`;
      }).join("")}</section>`;
  }
  function renderActivities() {
    const items = [...data.activities].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    return `${top("触达记录", "Email · WhatsApp · LinkedIn · 电话")}
      <section class="timeline">${items.length ? items.map((a) => {
        const client = clientById(a.clientId);
        return `<article class="timeline-item"><div><span class="timeline-dot">${escapeHtml(a.channel.slice(0, 2))}</span><i class="timeline-line"></i></div><div class="timeline-content"><div class="timeline-top"><strong>${escapeHtml(client?.company || "未知客户")}</strong><span>${escapeHtml(a.channel)} · ${escapeHtml(a.activityType)}</span><time>${fmt(a.occurredAt)}</time></div><p>${escapeHtml(a.summary)}</p><div class="next-step"><b>下一步：</b>${escapeHtml(a.nextAction || "待安排")} ${a.nextDueAt ? `· ${fmt(a.nextDueAt)}` : ""}</div></div></article>`;
      }).join("") : `<div class="empty">还没有触达记录</div>`}</section>`;
  }
  function renderQuotes() {
    return `${top("报价与库存", "料号、数量、价格、货况与 Date Code")}
      <div class="table-wrap"><table><thead><tr><th>公司</th><th>料号</th><th>类别 / 品牌</th><th>描述</th><th>数量</th><th>单价</th><th>货况</th><th>Date Code</th><th>库存地 / 交期</th><th>状态</th></tr></thead>
      <tbody>${data.quotes.map((q) => { const c = clientById(q.clientId); return `<tr class="clickable" data-client="${q.clientId}"><td><strong>${escapeHtml(c?.company || "未知客户")}</strong></td><td>${escapeHtml(q.partNumber)}</td><td>${escapeHtml(q.category)}<br><small>${escapeHtml(q.brand)}</small></td><td>${escapeHtml(q.description)}</td><td>${q.quantity}</td><td><strong>${escapeHtml(q.currency)} ${escapeHtml(q.unitPrice)}</strong><br><small>${escapeHtml(q.incoterm)}</small></td><td>${escapeHtml(q.condition)}</td><td>${escapeHtml(q.dateCode || "待确认")}</td><td>${escapeHtml(q.stockLocation || "待确认")}<br><small>${escapeHtml(q.leadTime)}</small></td><td>${escapeHtml(q.quoteStatus)}</td></tr>`; }).join("")}</tbody></table>
      ${data.quotes.length ? "" : `<div class="empty">还没有报价记录</div>`}</div>`;
  }
  function reportText() {
    const s = stats();
    const weekAgo = new Date(Date.now() - 7 * 86400000);
    const weeklyActivities = data.activities.filter((a) => new Date(a.occurredAt) >= weekAgo);
    const weeklyQuotes = data.quotes.filter((q) => new Date(q.createdAt) >= weekAgo);
    const open = openTasks();
    const focus = [...open].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 5);
    return `ecore 海外客户开发周报\n\n一、本周进展\n- 新增客户：${s.newWeek} 家\n- 新增触达：${weeklyActivities.length} 次\n- 当前已回复/报价/谈判客户：${s.replied} 家\n- 新增报价或库存记录：${weeklyQuotes.length} 条\n- 当前开放跟进任务：${open.length} 个，其中超期 ${s.overdue} 个\n\n二、重点客户与下一步\n${focus.length ? focus.map((t, i) => `${i + 1}. ${clientById(t.clientId)?.company || "未知客户"}：${t.title}（${fmt(t.dueAt)}）`).join("\n") : "- 暂无开放任务"}\n\n三、风险与核验重点\n- 报价前继续核验公司实体、官网邮箱、地址、Trade Reference 与实物图片。\n- 确认料号、数量、货况、Date Code、库存地、交期、Incoterm 和付款条款。\n- 对价格偏高、货况描述变化或无法提供图片的报价保持谨慎。\n\n四、下周计划\n- 优先清理超期跟进，按 T+3 / T+7 / 2–3 周节奏推进。\n- 聚焦企业级 RDIMM、Enterprise SSD、GPU 与数据中心硬件。\n- 提高具体 BOM / 库存名单触达比例，减少模板化群发。`;
  }
  function renderReport() {
    const s = stats();
    return `${top("老板汇报", "一键汇总本周开发进度", false)}
      <section class="report-grid"><article class="panel"><div class="panel-title"><h2>本周汇报草稿</h2><button class="secondary" id="copy-report">复制汇报</button></div><div class="report-copy">${escapeHtml(reportText())}</div></article>
      <aside class="panel"><div class="panel-title"><h2>核心指标</h2></div><div class="kpi-list">
        <div class="kpi-item"><span>客户总数</span><strong>${data.clients.length}</strong></div>
        <div class="kpi-item"><span>开放任务</span><strong>${openTasks().length}</strong></div>
        <div class="kpi-item"><span>报价记录</span><strong>${data.quotes.length}</strong></div>
        <div class="kpi-item"><span>超期任务</span><strong>${s.overdue}</strong></div>
      </div></aside></section>`;
  }

  function renderDrawer() {
    const c = clientById(selectedClientId);
    if (!c) return "";
    const activities = data.activities.filter((a) => a.clientId === c.id).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
    const quotes = data.quotes.filter((q) => q.clientId === c.id);
    const detail = (label, value, wide = false) => `<div class="detail-card ${wide ? "detail-wide" : ""}"><label>${label}</label><p>${value || "待补充"}</p></div>`;
    return `<div class="drawer-backdrop" id="drawer-backdrop"></div><aside class="drawer">
      <div class="drawer-head"><div><p>${escapeHtml(c.country)} · ${escapeHtml(c.businessRole)}</p><h2>${escapeHtml(c.company)}</h2>${statusPill(c.status)} ${trustPill(c.trustScore)}</div><button class="icon-button" id="close-drawer">×</button></div>
      <div class="drawer-actions"><button class="primary" data-action="activity" data-client-id="${c.id}">＋ 记录沟通</button><button class="secondary" data-action="quote" data-client-id="${c.id}">＋ 添加报价</button></div>
      <div class="detail-grid">
        ${detail("官网", c.website ? `<a href="${escapeHtml(c.website)}" target="_blank" rel="noopener">${escapeHtml(c.website)}</a>` : "")}
        ${detail("产品方向", escapeHtml(c.products))}
        ${detail("联系人", escapeHtml([c.contactName, c.jobTitle].filter(Boolean).join(" · ")))}
        ${detail("Email / WhatsApp", escapeHtml([c.email, c.whatsapp].filter(Boolean).join(" · ")))}
        ${detail("跟进阶段", escapeHtml(c.followUpStage))}
        ${detail("下次跟进", fmt(c.nextFollowUpAt))}
        ${detail("下一步动作", escapeHtml(c.nextAction), true)}
        ${detail("背调与沟通备注", escapeHtml(c.notes), true)}
      </div>
      <section class="drawer-section"><h3>近期触达</h3><div class="mini-list">${activities.length ? activities.slice(0, 5).map((a) => `<div class="mini-item"><strong>${escapeHtml(a.channel)} · ${fmt(a.occurredAt)}</strong>${escapeHtml(a.summary)}</div>`).join("") : `<div class="mini-item">暂无记录</div>`}</div></section>
      <section class="drawer-section"><h3>报价与库存</h3><div class="mini-list">${quotes.length ? quotes.map((q) => `<div class="mini-item"><strong>${escapeHtml(q.partNumber)} · ${escapeHtml(q.currency)} ${escapeHtml(q.unitPrice)}</strong>${escapeHtml(q.brand)} ${escapeHtml(q.description)} · ${q.quantity} pcs · ${escapeHtml(q.condition)} · DC ${escapeHtml(q.dateCode || "待确认")}</div>`).join("") : `<div class="mini-item">暂无报价</div>`}</div></section>
    </aside>`;
  }
  function clientOptions(selected = "") {
    return data.clients.map((c) => `<option value="${c.id}" ${Number(selected) === c.id ? "selected" : ""}>${escapeHtml(c.company)}</option>`).join("");
  }
  function renderModal() {
    if (!modal) return "";
    if (modal.type === "client") {
      return `<div class="modal-backdrop"><form class="modal" id="client-form"><div class="modal-head"><h2>录入新客户</h2><button type="button" class="icon-button" data-close-modal>×</button></div>
        <div class="form-grid">
          <div class="field"><label>公司名称 *</label><input name="company" required value="${escapeHtml(quickDraft.company)}" /></div>
          <div class="field"><label>公司官网</label><input name="website" value="${escapeHtml(quickDraft.website)}" placeholder="https://..." /></div>
          <div class="field"><label>国家 / 地区</label><input name="country" /></div>
          <div class="field"><label>业务角色</label><select name="businessRole"><option>供应商</option><option>潜在买家</option><option>双向合作</option></select></div>
          <div class="field wide"><label>主营与匹配产品</label><input name="products" placeholder="DDR5 RDIMM, Enterprise SSD, GPU…" /></div>
          <div class="field"><label>联系人</label><input name="contactName" /></div>
          <div class="field"><label>职位</label><input name="jobTitle" /></div>
          <div class="field"><label>Email</label><input name="email" type="email" /></div>
          <div class="field"><label>WhatsApp</label><input name="whatsapp" /></div>
          <div class="field"><label>线索来源</label><select name="source"><option>官网</option><option>LinkedIn</option><option>展会清单</option><option>转介绍</option><option>行业目录</option><option>WhatsApp</option></select></div>
          <div class="field"><label>可信度评分</label><input name="trustScore" type="number" min="0" max="100" value="60" /></div>
          <div class="field"><label>下次跟进时间</label><input name="nextFollowUpAt" type="datetime-local" value="${localInput(3, 10)}" /></div>
          <div class="field"><label>下一步动作</label><input name="nextAction" value="发送首次开发邮件" /></div>
          <div class="field wide"><label>背调与备注</label><textarea name="notes" placeholder="公司实体、地址、官网邮箱、团队规模、Trade Reference、风险点…"></textarea></div>
        </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">保存客户并创建跟进</button></div></form></div>`;
    }
    if (modal.type === "activity") {
      return `<div class="modal-backdrop"><form class="modal" id="activity-form"><div class="modal-head"><h2>记录沟通</h2><button type="button" class="icon-button" data-close-modal>×</button></div>
        <div class="form-grid">
          <div class="field"><label>客户 *</label><select name="clientId" required><option value="">请选择</option>${clientOptions(modal.clientId)}</select></div>
          <div class="field"><label>渠道</label><select name="channel"><option>Email</option><option>WhatsApp</option><option>LinkedIn</option><option>电话</option><option>官网表单</option><option>其他</option></select></div>
          <div class="field"><label>沟通类型</label><select name="activityType"><option>首次触达</option><option>二次跟进</option><option>三次跟进</option><option>四次跟进</option><option>客户回复</option><option>报价沟通</option><option>电话沟通</option></select></div>
          <div class="field"><label>更新客户状态</label><select name="status">${statuses.map((s) => `<option ${s === "已触达" ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          <div class="field wide"><label>本次沟通摘要 *</label><textarea name="summary" required></textarea></div>
          <div class="field"><label>下次跟进时间</label><input name="nextDueAt" type="datetime-local" value="${localInput(3, 10)}" /></div>
          <div class="field"><label>下次动作</label><input name="nextAction" placeholder="例如：索取实物图与 Date Code" /></div>
        </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">保存并安排跟进</button></div></form></div>`;
    }
    return `<div class="modal-backdrop"><form class="modal" id="quote-form"><div class="modal-head"><h2>添加报价 / 库存</h2><button type="button" class="icon-button" data-close-modal>×</button></div>
      <div class="form-grid">
        <div class="field"><label>客户 / 供应商 *</label><select name="clientId" required><option value="">请选择</option>${clientOptions(modal.clientId)}</select></div>
        <div class="field"><label>料号 *</label><input name="partNumber" required /></div>
        <div class="field"><label>类别</label><select name="category"><option>RDIMM</option><option>Enterprise SSD</option><option>GPU</option><option>CPU</option><option>Server Components</option></select></div>
        <div class="field"><label>品牌</label><input name="brand" placeholder="Samsung / SK hynix / Micron…" /></div>
        <div class="field wide"><label>规格描述</label><input name="description" /></div>
        <div class="field"><label>数量</label><input name="quantity" type="number" min="0" /></div>
        <div class="field"><label>单价</label><input name="unitPrice" inputmode="decimal" /></div>
        <div class="field"><label>币种</label><select name="currency"><option>USD</option><option>EUR</option><option>CNY</option><option>HKD</option></select></div>
        <div class="field"><label>货况</label><select name="condition"><option>Factory Sealed</option><option>New / Unused</option><option>Open-box Unused</option><option>Project-released New Stock</option><option>BOM-change New Stock</option></select></div>
        <div class="field"><label>Date Code</label><input name="dateCode" placeholder="待确认 / 2025+" /></div>
        <div class="field"><label>库存地</label><input name="stockLocation" /></div>
        <div class="field"><label>交期</label><input name="leadTime" /></div>
        <div class="field"><label>Incoterm</label><select name="incoterm"><option>EXW</option><option>FOB</option><option>CIF</option><option>DDP</option></select></div>
        <div class="field"><label>评估状态</label><select name="quoteStatus"><option>待评估</option><option>价格可谈</option><option>价格偏高</option><option>资料待核验</option><option>已接受</option><option>已拒绝</option></select></div>
      </div><div class="modal-actions"><button type="button" class="secondary" data-close-modal>取消</button><button class="primary" type="submit">保存报价</button></div></form></div>`;
  }

  function render() {
    if (!data) return;
    const content = view === "dashboard" ? renderDashboard() : view === "clients" ? renderClients() : view === "tasks" ? renderTasks() : view === "activities" ? renderActivities() : view === "quotes" ? renderQuotes() : renderReport();
    app.innerHTML = `<div class="app-shell">${renderNav()}<main class="workspace">${content}</main>${renderDrawer()}${renderModal()}</div>`;
    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => { view = button.dataset.view; selectedClientId = null; render(); }));
    document.querySelectorAll("[data-client]").forEach((el) => el.addEventListener("click", (event) => { event.stopPropagation(); selectedClientId = Number(el.dataset.client); render(); }));
    document.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.action;
      if (type === "client") quickDraft = { company: "", website: "" };
      modal = { type, clientId: Number(button.dataset.clientId || selectedClientId || 0) || "" };
      render();
    }));
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => { modal = null; render(); }));
    document.querySelector(".modal-backdrop")?.addEventListener("click", (event) => { if (event.target.classList.contains("modal-backdrop")) { modal = null; render(); } });
    document.getElementById("close-drawer")?.addEventListener("click", () => { selectedClientId = null; render(); });
    document.getElementById("drawer-backdrop")?.addEventListener("click", () => { selectedClientId = null; render(); });
    document.getElementById("logout")?.addEventListener("click", logout);
    document.getElementById("download-backup")?.addEventListener("click", downloadBackup);
    document.getElementById("restore-backup")?.addEventListener("click", () => backupFile.click());
    document.getElementById("analyze-url")?.addEventListener("click", analyzeUrl);
    document.getElementById("global-search")?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") { clientSearch = event.target.value; view = "clients"; render(); }
    });
    document.getElementById("client-search")?.addEventListener("input", (event) => { clientSearch = event.target.value; render(); document.getElementById("client-search")?.focus(); });
    document.getElementById("client-status")?.addEventListener("change", (event) => { clientStatus = event.target.value; render(); });
    document.querySelectorAll("[data-task]").forEach((button) => button.addEventListener("click", () => transact((draft) => {
      const task = draft.tasks.find((t) => t.id === Number(button.dataset.task));
      if (task) task.completed = !task.completed;
    }, "任务状态已更新")));
    document.getElementById("copy-report")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(reportText());
      toast("老板周报已复制");
    });
    document.getElementById("client-form")?.addEventListener("submit", submitClient);
    document.getElementById("activity-form")?.addEventListener("submit", submitActivity);
    document.getElementById("quote-form")?.addEventListener("submit", submitQuote);
  }

  function analyzeUrl() {
    const raw = document.getElementById("quick-url").value.trim();
    try {
      const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
      const url = new URL(normalized);
      const company = url.hostname.replace(/^www\./, "").split(".")[0].split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
      quickDraft = { company, website: normalized };
      modal = { type: "client", clientId: "" };
      render();
      toast("已提取网址和公司名，请补充背调信息");
    } catch { toast("请输入有效的公司网址"); }
  }
  async function submitClient(event) {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const id = uid();
    const createdAt = new Date().toISOString();
    const next = f.nextFollowUpAt ? new Date(f.nextFollowUpAt).toISOString() : "";
    const score = Math.max(0, Math.min(100, Number(f.trustScore || 60)));
    await transact((draft) => {
      draft.clients.unshift({ id, company: f.company.trim(), website: f.website.trim(), country: f.country.trim(), businessRole: f.businessRole, products: f.products.trim(), source: f.source, contactName: f.contactName.trim(), jobTitle: f.jobTitle.trim(), email: f.email.trim(), whatsapp: f.whatsapp.trim(), linkedin: "", status: "新线索", trustScore: score, followUpStage: "首次触达", lastTouchAt: "", nextFollowUpAt: next, nextAction: f.nextAction.trim() || "发送首次开发邮件", notes: f.notes.trim(), createdAt, updatedAt: createdAt });
      if (next) draft.tasks.push({ id: uid(), clientId: id, title: f.nextAction.trim() || "发送首次开发邮件", dueAt: next, priority: "普通", stage: "首次触达", completed: false });
    }, "客户已保存，并创建下次跟进");
    modal = null; quickDraft = { company: "", website: "" }; render();
  }
  async function submitActivity(event) {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const clientId = Number(f.clientId);
    const next = f.nextDueAt ? new Date(f.nextDueAt).toISOString() : "";
    const now = new Date().toISOString();
    await transact((draft) => {
      draft.activities.unshift({ id: uid(), clientId, channel: f.channel, activityType: f.activityType, stage: f.activityType, summary: f.summary.trim(), nextAction: f.nextAction.trim(), occurredAt: now, nextDueAt: next });
      const c = draft.clients.find((item) => item.id === clientId);
      if (c) { c.status = f.status; c.followUpStage = f.activityType; c.lastTouchAt = now; c.nextFollowUpAt = next; c.nextAction = f.nextAction.trim(); c.updatedAt = now; }
      if (next && f.nextAction.trim()) draft.tasks.push({ id: uid(), clientId, title: f.nextAction.trim(), dueAt: next, priority: ["三次跟进", "四次跟进"].includes(f.activityType) ? "高" : "普通", stage: f.activityType, completed: false });
    }, "沟通已记录，下一次跟进已安排");
    modal = null; render();
  }
  async function submitQuote(event) {
    event.preventDefault();
    const f = Object.fromEntries(new FormData(event.currentTarget));
    const clientId = Number(f.clientId);
    const now = new Date().toISOString();
    await transact((draft) => {
      draft.quotes.unshift({ id: uid(), clientId, partNumber: f.partNumber.trim(), category: f.category, brand: f.brand.trim(), description: f.description.trim(), quantity: Number(f.quantity || 0), unitPrice: f.unitPrice.trim(), currency: f.currency, condition: f.condition, dateCode: f.dateCode.trim(), stockLocation: f.stockLocation.trim(), leadTime: f.leadTime.trim(), incoterm: f.incoterm, quoteStatus: f.quoteStatus, createdAt: now });
      const c = draft.clients.find((item) => item.id === clientId);
      if (c && !["谈判中", "已成交"].includes(c.status)) { c.status = "报价中"; c.updatedAt = now; }
    }, "报价与库存信息已保存");
    modal = null; render();
  }

  function downloadBackup() {
    const record = localStorage.getItem(STORAGE_KEY);
    if (!record) return toast("暂无可备份的数据");
    const blob = new Blob([record], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `ecore-crm-backup-${dateKey(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast("加密备份已下载");
  }
  backupFile.addEventListener("change", async () => {
    const file = backupFile.files?.[0];
    if (!file) return;
    try {
      const record = JSON.parse(await file.text());
      if (record.format !== "ecore-crm-encrypted" || !record.salt || !record.iv || !record.data) throw new Error("invalid");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      backupFile.value = "";
      cryptoKey = null; data = null; sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login", "备份已恢复，请输入该备份对应的密码");
    } catch {
      backupFile.value = "";
      toast("这不是有效的 ecore CRM 加密备份");
    }
  });
  function toast(message) {
    clearTimeout(toastTimer);
    document.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = message;
    document.body.appendChild(el);
    toastTimer = setTimeout(() => el.remove(), 2600);
  }

  document.addEventListener("keydown", (event) => {
    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
    if (!data) return;
    if (!typing && event.key.toLowerCase() === "n") { quickDraft = { company: "", website: "" }; modal = { type: "client", clientId: "" }; render(); }
    if (event.key === "Escape") { modal = null; selectedClientId = null; render(); }
  });

  async function boot() {
    const record = localStorage.getItem(STORAGE_KEY);
    if (!record) return renderAuth("setup");
    const sessionPassword = sessionStorage.getItem(SESSION_KEY);
    if (!sessionPassword) return renderAuth("login");
    try {
      const parsed = JSON.parse(record);
      cryptoKey = await deriveKey(sessionPassword, base64ToBytes(parsed.salt));
      data = await decryptPayload(parsed, cryptoKey);
      render();
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      renderAuth("login");
    }
  }
  boot();
})();
