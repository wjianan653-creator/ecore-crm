(() => {
  "use strict";

  const DATA_URL = "./account-batch-2026-09-04-gpu-ecosystem.json?v=1";
  const BATCH_KEY = "ecore-account-batch-2026-09-04-gpu-v1";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = "") => String(v).toLowerCase().replace(/[^a-z0-9]/g, "");
  let importStarted = false;
  let autoAttempted = false;

  function toast(text, error = false) {
    document.getElementById("ecore-gpu-import-toast")?.remove();
    const el = document.createElement("div");
    el.id = "ecore-gpu-import-toast";
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", right: "18px", bottom: "72px", zIndex: 999999,
      maxWidth: "480px", padding: "13px 17px", borderRadius: "10px",
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
    setField(form, "direction", c.direction || "Two-way");
    setField(form, "products", c.products || "");
    setField(form, "commercialHypothesis", c.commercialHypothesis || "GPU ecosystem account; qualify real supply/demand before deeper investment.");
    setField(form, "verifiedEvidence", c.verifiedEvidence || "2026-09-04 researched GPU ecosystem candidate; current physical stock is not assumed.");
    setField(form, "nextAction", c.nextAction || "Find Right Person and validate RTX 5090 / RTX PRO 6000 supply or demand.");
    setField(form, "notes", c.notes || `2026-09-04 GPU ecosystem pool｜${c.priority || "B1"}｜尚未触达`);
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
      button.textContent = "正在导入GPU渠道…";
    }

    try {
      if (!(await goClients())) throw new Error("无法打开账户库");
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`GPU名单文件加载失败 ${response.status}`);
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
        await sleep(100);
      }

      localStorage.setItem(BATCH_KEY, JSON.stringify({ at: new Date().toISOString(), added, skipped }));
      toast(`GPU渠道导入完成：新增 ${added} 家，跳过 ${skipped} 个已有账户。`);
      if (button) button.textContent = `GPU渠道已导入：+${added} / 跳过${skipped}`;
    } catch (err) {
      importStarted = false;
      toast(`GPU渠道导入未完成：${err.message || err}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "重试导入GPU渠道10家";
      }
    }
  }

  function addImportButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById("import-gpu-accounts-20260904")) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = "import-gpu-accounts-20260904";
    button.type = "button";
    button.textContent = "＋ 导入GPU渠道10家";
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
    setTimeout(() => importBatch(document.getElementById("import-gpu-accounts-20260904")), 1000);
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
