(() => {
  const DATA_URL = "./account-batch-2026-09-22-qualified-buyers-30.json?v=1";
  const BATCH_KEY = "ecore-account-batch-2026-09-22-qualified-buyers-30-v1";
  const BUTTON_ID = "import-qualified-buyers-20260922";
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const norm = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
  let importStarted = false;
  let autoAttempted = false;

  function toast(text, error = false) {
    document.getElementById("ecore-qualified-buyers-import-toast")?.remove();
    const element = document.createElement("div");
    element.id = "ecore-qualified-buyers-import-toast";
    element.textContent = text;
    Object.assign(element.style, {
      position: "fixed",
      right: "18px",
      bottom: "72px",
      zIndex: 999999,
      maxWidth: "660px",
      padding: "13px 17px",
      borderRadius: "10px",
      background: error ? "#7f1d1d" : "#173a2a",
      color: "#fff",
      fontSize: "14px",
      lineHeight: "1.5",
      boxShadow: "0 8px 30px rgba(0,0,0,.25)"
    });
    document.body.appendChild(element);
    setTimeout(() => element.remove(), 14000);
  }

  async function waitFor(fn, timeout = 10000) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      const value = fn();
      if (value) return value;
      await sleep(80);
    }
    return null;
  }

  function setField(form, name, value) {
    const element = form.querySelector(`[name="${name}"]`);
    if (!element) return;
    element.value = value ?? "";
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function localDateTimeOffset(days, hour = 10) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  function dueDays(priority = "B1", index = 0) {
    if (priority === "A1") return 1 + (index % 3);
    if (priority === "A2") return 4 + (index % 4);
    return 8 + (index % 6);
  }

  async function goClients() {
    const nav = document.querySelector('[data-view="clients"]');
    if (!nav) return false;
    nav.click();
    return !!(await waitFor(() => document.querySelector(".account-table"), 4000));
  }

  async function clearFilters() {
    const search = document.getElementById("client-search");
    if (search && search.value) {
      search.value = "";
      search.dispatchEvent(new Event("input", { bubbles: true }));
      await sleep(120);
    }
    for (const id of ["client-status", "client-grade", "client-direction", "client-key-account"]) {
      const select = document.getElementById(id);
      if (select && select.value !== "全部") {
        select.value = "全部";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await sleep(120);
      }
    }
  }

  function existingNames() {
    return new Set(
      [...document.querySelectorAll(".account-table tbody .company-cell strong")]
        .map((element) => norm(element.textContent))
        .filter(Boolean)
    );
  }

  async function addOne(candidate, index) {
    let button = document.querySelector('[data-action="client"]');
    if (!button) {
      if (!(await goClients())) return false;
      button = document.querySelector('[data-action="client"]');
    }
    if (!button) return false;

    button.click();
    const form = await waitFor(() => document.querySelector("#client-form"), 3000);
    if (!form) return false;

    setField(form, "company", candidate.company);
    setField(form, "website", candidate.website || "");
    setField(form, "country", candidate.country || "");
    setField(form, "accountGrade", candidate.accountGrade || "B");
    setField(form, "accountType", candidate.accountType || "SI");
    setField(form, "direction", candidate.direction || "Sell-to");
    setField(form, "products", candidate.products || "DDR5 RDIMM, enterprise SSD/HDD and server CPU");
    setField(form, "source", "官网");
    setField(form, "trustScore", candidate.accountGrade === "A" ? "88" : "78");
    setField(form, "commercialHypothesis", candidate.commercialHypothesis || "Verified enterprise hardware user, system builder or distributor.");
    setField(form, "verifiedEvidence", candidate.verifiedEvidence || "Official website and LinkedIn About reviewed on 2026-09-22.");
    setField(form, "nextAction", candidate.nextAction || "Find the correct procurement, server product or infrastructure owner and verify independent component purchasing.");
    setField(form, "notes", candidate.notes || `2026-09-22 qualified buyer batch｜${candidate.priority || "B1"}｜未触达`);
    setField(form, "nextFollowUpAt", localDateTimeOffset(dueDays(candidate.priority, index), 10 + (index % 3)));

    const keyAccount = form.querySelector('[name="keyAccount"]');
    if (keyAccount) keyAccount.checked = ["A1", "A2"].includes(candidate.priority);

    // Company-page evidence stays in notes/evidence. Leaving personal contact fields blank
    // prevents the CRM from marking these records as already contacted.
    setField(form, "contactName", "");
    setField(form, "jobTitle", "");
    setField(form, "email", "");
    setField(form, "linkedin", "");
    setField(form, "whatsapp", "");

    form.requestSubmit();
    return !!(await waitFor(() => !document.querySelector("#client-form"), 5000));
  }

  async function importBatch(button) {
    if (importStarted) return;
    importStarted = true;
    if (button) {
      button.disabled = true;
      button.textContent = "正在导入 30 家高匹配客户…";
    }

    try {
      if (!(await goClients())) throw new Error("无法打开账户库，请先解锁 CRM");
      await clearFilters();
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`名单文件加载失败 ${response.status}`);
      const candidates = await response.json();
      const names = existingNames();
      let added = 0;
      let skipped = 0;

      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        const aliases = [candidate.company, ...(candidate.aliases || [])].map(norm).filter(Boolean);
        if (aliases.some((alias) => names.has(alias))) {
          skipped += 1;
          continue;
        }
        const ok = await addOne(candidate, index);
        if (!ok) throw new Error(`写入 ${candidate.company} 时失败`);
        aliases.forEach((alias) => names.add(alias));
        added += 1;
        await sleep(140);
      }

      localStorage.setItem(BATCH_KEY, JSON.stringify({ at: new Date().toISOString(), added, skipped }));
      toast(`9/22 高匹配客户导入完成：新增 ${added} 家，自动跳过 ${skipped} 个已有账户。全部保持未触达，等待你找正确联系人。`);
      if (button) button.textContent = `9/22 客户已导入：+${added} / 跳过${skipped}`;
    } catch (error) {
      importStarted = false;
      toast(`9/22 客户导入未完成：${error.message || error}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "重试导入 9/22 高匹配客户";
      }
    }
  }

  function addImportButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById(BUTTON_ID)) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "＋ 导入 9/22 高匹配客户（30家）";
    Object.assign(button.style, {
      margin: "0 14px 10px",
      padding: "10px 12px",
      border: "1px solid rgba(255,255,255,.18)",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "600"
    });
    button.addEventListener("click", () => importBatch(button));
    host.appendChild(button);
  }

  function maybeAutoImport() {
    if (autoAttempted || importStarted || localStorage.getItem(BATCH_KEY)) return;
    if (!document.querySelector('[data-view="clients"]')) return;
    autoAttempted = true;
    setTimeout(() => importBatch(document.getElementById(BUTTON_ID)), 1200);
  }

  function run() {
    addImportButton();
    maybeAutoImport();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 700);
})();
