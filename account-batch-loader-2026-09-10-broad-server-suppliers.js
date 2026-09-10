(() => {
  "use strict";

  const DATA_URL = "./account-batch-2026-09-10-broad-server-suppliers.json?v=1";
  const BATCH_KEY = "ecore-account-batch-2026-09-10-broad-server-suppliers-v1";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = "") => String(v).toLowerCase().replace(/[^a-z0-9]/g, "");
  let importStarted = false;
  let autoAttempted = false;

  function toast(text, error = false) {
    document.getElementById("ecore-broad-suppliers-import-toast")?.remove();
    const el = document.createElement("div");
    el.id = "ecore-broad-suppliers-import-toast";
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", right: "18px", bottom: "72px", zIndex: 999999,
      maxWidth: "620px", padding: "13px 17px", borderRadius: "10px",
      background: error ? "#7f1d1d" : "#173a2a", color: "#fff",
      fontSize: "14px", lineHeight: "1.5", boxShadow: "0 8px 30px rgba(0,0,0,.25)"
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 12000);
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
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.value = value ?? "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function localDateTimeOffset(days, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(hour, 0, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }

  function dueDays(priority = "B2", index = 0) {
    if (priority === "A1") return 1 + (index % 3);
    if (priority === "A2") return 3 + (index % 3);
    if (priority === "B1") return 7 + (index % 4);
    if (priority === "B2") return 12 + (index % 5);
    if (priority === "C2") return 60 + (index % 7);
    return 30 + (index % 10);
  }

  function existingNames() {
    return new Set(
      [...document.querySelectorAll(".account-table tbody .company-cell strong")]
        .map((el) => norm(el.textContent)).filter(Boolean)
    );
  }

  async function goClients() {
    const nav = document.querySelector('[data-view="clients"]');
    if (!nav) return false;
    nav.click();
    return !!(await waitFor(() => document.querySelector(".account-table"), 4000));
  }

  async function addOne(c, index) {
    let button = document.querySelector('[data-action="client"]');
    if (!button) {
      if (!(await goClients())) return false;
      button = document.querySelector('[data-action="client"]');
    }
    if (!button) return false;

    button.click();
    const form = await waitFor(() => document.querySelector("#client-form"), 3000);
    if (!form) return false;

    setField(form, "company", c.company);
    setField(form, "website", c.website || "");
    setField(form, "country", c.country || "");
    setField(form, "accountGrade", c.accountGrade || "B");
    setField(form, "accountType", c.accountType || "Other");
    setField(form, "direction", c.direction || "Buy-from");
    setField(form, "products", c.products || "Enterprise server hardware, DDR5 RDIMM, Enterprise SSD, GPU");
    setField(form, "source", "行业目录");
    setField(form, "trustScore", c.accountGrade === "A" ? "85" : c.accountGrade === "B" ? "75" : "60");
    setField(form, "commercialHypothesis", c.commercialHypothesis || "Hardware-related sourcing candidate; verify physical new stock before deeper investment.");
    setField(form, "verifiedEvidence", c.verifiedEvidence || "2026-09-10 broad supplier screening; physical stock not assumed.");
    setField(form, "nextAction", c.nextAction || "Find the correct sales/procurement/inventory contact; first verify relevant new stock without sending a PN. Ask exact details only after reply.");
    setField(form, "notes", c.notes || `2026-09-10 broad supplier pool｜${c.priority || "B2"}｜尚未触达`);
    setField(form, "nextFollowUpAt", localDateTimeOffset(dueDays(c.priority, index), 10 + (index % 3)));

    // Keep contact fields empty on import so the CRM does not falsely mark an outreach as already sent.
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
      button.textContent = "正在导入宽口径供应商池…";
    }

    try {
      if (!(await goClients())) throw new Error("无法打开账户库，请先解锁 CRM");
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`名单文件加载失败 ${response.status}`);
      const candidates = await response.json();
      const names = existingNames();
      let added = 0;
      let skipped = 0;

      for (let i = 0; i < candidates.length; i += 1) {
        const c = candidates[i];
        const aliases = [c.company, ...(c.aliases || [])].map(norm).filter(Boolean);
        if (aliases.some((a) => names.has(a))) {
          skipped += 1;
          continue;
        }
        const ok = await addOne(c, i);
        if (!ok) throw new Error(`写入 ${c.company} 时失败`);
        aliases.forEach((a) => names.add(a));
        added += 1;
        await sleep(140);
      }

      localStorage.setItem(BATCH_KEY, JSON.stringify({ at: new Date().toISOString(), added, skipped }));
      toast(`宽口径供应商池导入完成：新增 ${added} 家，自动跳过 ${skipped} 个已有账户。A/B/C 已分层，未实际联系的账户保持未触达。`);
      if (button) button.textContent = `供应商池已导入：+${added} / 跳过${skipped}`;
    } catch (err) {
      importStarted = false;
      toast(`供应商池导入未完成：${err.message || err}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "重试导入宽口径供应商池";
      }
    }
  }

  function addImportButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById("import-broad-server-suppliers-20260910")) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = "import-broad-server-suppliers-20260910";
    button.type = "button";
    button.textContent = "＋ 导入9/10宽口径供应商池";
    Object.assign(button.style, {
      margin: "0 14px 10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,.18)",
      borderRadius: "8px", cursor: "pointer", fontWeight: "600"
    });
    button.addEventListener("click", () => importBatch(button));
    host.appendChild(button);
  }

  function maybeAutoImport() {
    if (autoAttempted || importStarted || localStorage.getItem(BATCH_KEY)) return;
    if (!document.querySelector('[data-view="clients"]')) return;
    autoAttempted = true;
    setTimeout(() => importBatch(document.getElementById("import-broad-server-suppliers-20260910")), 1200);
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
