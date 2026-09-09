(() => {
  "use strict";

  const DATA_URL = "./account-batch-2026-09-09-ddr5-mainstream-wave3.json?v=1";
  const BATCH_KEY = "ecore-account-batch-2026-09-09-ddr5-mainstream-wave3-v1";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = "") => String(v).toLowerCase().replace(/[^a-z0-9]/g, "");
  let importStarted = false;
  let autoAttempted = false;

  function toast(text, error = false) {
    document.getElementById("ecore-ddr5-wave3-import-toast")?.remove();
    const el = document.createElement("div");
    el.id = "ecore-ddr5-wave3-import-toast";
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", right: "18px", bottom: "72px", zIndex: 999999,
      maxWidth: "560px", padding: "13px 17px", borderRadius: "10px",
      background: error ? "#7f1d1d" : "#173a2a", color: "#fff",
      fontSize: "14px", lineHeight: "1.5", boxShadow: "0 8px 30px rgba(0,0,0,.25)"
    });
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 10000);
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

  async function addOne(c) {
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
    setField(form, "products", c.products || "32GB/64GB DDR5 ECC RDIMM; preferably 5600MT/s");
    setField(form, "commercialHypothesis", c.commercialHypothesis || "Qualified server-memory sourcing account; verify physical stock before deeper investment.");
    setField(form, "verifiedEvidence", c.verifiedEvidence || "2026-09-09 researched sourcing candidate; physical stock not assumed.");
    setField(form, "nextAction", c.nextAction || "Verify standalone DDR5 availability first, then exact brand/PN, physical qty, price, stock location and HK export capability.");
    setField(form, "notes", c.notes || `2026-09-09 DDR5 mainstream sourcing pool｜${c.priority || "B1"}｜尚未触达`);
    setField(form, "email", c.email || "");
    setField(form, "linkedin", c.linkedin || "");
    setField(form, "whatsapp", c.whatsapp || "");

    form.requestSubmit();
    return !!(await waitFor(() => !document.querySelector("#client-form"), 5000));
  }

  async function importBatch(button) {
    if (importStarted) return;
    importStarted = true;
    if (button) {
      button.disabled = true;
      button.textContent = "正在导入DDR5主流规格第三批…";
    }

    try {
      if (!(await goClients())) throw new Error("无法打开账户库，请先解锁 CRM");
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`名单文件加载失败 ${response.status}`);
      const candidates = await response.json();
      const names = existingNames();
      let added = 0;
      let skipped = 0;

      for (const c of candidates) {
        const aliases = [c.company, ...(c.aliases || [])].map(norm).filter(Boolean);
        if (aliases.some((a) => names.has(a))) {
          skipped += 1;
          continue;
        }
        const ok = await addOne(c);
        if (!ok) throw new Error(`写入 ${c.company} 时失败`);
        aliases.forEach((a) => names.add(a));
        added += 1;
        await sleep(140);
      }

      localStorage.setItem(BATCH_KEY, JSON.stringify({ at: new Date().toISOString(), added, skipped }));
      toast(`DDR5主流规格第三批导入完成：新增 ${added} 家，跳过 ${skipped} 个已有账户。未实际触达的账户保持未触达状态。`);
      if (button) button.textContent = `DDR5第三批已导入：+${added} / 跳过${skipped}`;
    } catch (err) {
      importStarted = false;
      toast(`DDR5主流规格第三批导入未完成：${err.message || err}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "重试导入DDR5第三批5家";
      }
    }
  }

  function addImportButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById("import-ddr5-mainstream-accounts-20260909-wave3")) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = "import-ddr5-mainstream-accounts-20260909-wave3";
    button.type = "button";
    button.textContent = "＋ 导入DDR5第三批5家";
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
    setTimeout(() => importBatch(document.getElementById("import-ddr5-mainstream-accounts-20260909-wave3")), 1000);
  }

  function run() {
    addImportButton();
    maybeAutoImport();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 600);
})();
