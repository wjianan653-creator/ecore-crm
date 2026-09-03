(() => {
  "use strict";

  const DATA_URL = "./account-batch-2026-09-03-v2.json?v=3";
  const BATCH_KEY = "ecore-account-batch-2026-09-03-v3";
  const COUNTRY_KEY = "ecore-country-filter-v3";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = "") => String(v).toLowerCase().replace(/[^a-z0-9]/g, "");
  let importStarted = false;
  let autoAttempted = false;

  function toast(text, error = false) {
    document.getElementById("ecore-v3-toast")?.remove();
    const el = document.createElement("div");
    el.id = "ecore-v3-toast";
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", right: "18px", bottom: "18px", zIndex: 999999,
      maxWidth: "460px", padding: "13px 17px", borderRadius: "10px",
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
    setField(form, "commercialHypothesis", `2026-09-03 account pool: ${c.direction || "Two-way"}; qualify right person and real buying/supply scenario before deeper investment.`);
    setField(form, "verifiedEvidence", `2026-09-03 researched candidate; priority ${c.priority || "B1"}. Company/product fit must not be treated as proof of current physical stock.`);
    setField(form, "nextAction", "找 Right Person，完成公司/职位/语言判断后定制第一封开发信");
    setField(form, "notes", `2026-09-03 去重后30家新开发池｜优先级 ${c.priority || "B1"}｜尚未触达`);
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
      button.textContent = "正在导入…";
    }
    try {
      if (!(await goClients())) throw new Error("无法打开账户库");
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) throw new Error(`名单文件加载失败 ${response.status}`);
      const candidates = await response.json();
      const names = existingNames();
      let added = 0, skipped = 0;

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
        await sleep(80);
      }

      localStorage.setItem(BATCH_KEY, JSON.stringify({ at: new Date().toISOString(), added, skipped }));
      enhanceCountry(true);
      toast(`导入完成：新增 ${added} 家，自动跳过 ${skipped} 个已有账户。`);
      if (button) button.textContent = `已导入：+${added} / 跳过${skipped}`;
    } catch (err) {
      importStarted = false;
      toast(`导入没有完成：${err.message || err}`, true);
      if (button) {
        button.disabled = false;
        button.textContent = "重试导入今日30家";
      }
    }
  }

  function countryFromRow(row) {
    const small = row.querySelector(".company-cell small");
    const raw = small?.textContent || "";
    return (raw.split(" · ")[0] || "").trim();
  }

  function applyCountryFilter() {
    const select = document.getElementById("client-country-v5");
    if (!select) return;
    const target = select.value;
    document.querySelectorAll(".account-table tbody tr").forEach((row) => {
      const country = row.querySelector(".country-cell-v5")?.textContent.trim() || "待补充";
      row.style.display = target === "全部" || country === target ? "" : "none";
    });
  }

  function enhanceCountry(force = false) {
    const table = document.querySelector(".account-table table");
    const toolbar = document.querySelector("#client-search")?.closest(".toolbar");
    if (!table || !toolbar) return;
    if (force) table.dataset.countryV5 = "";

    if (table.dataset.countryV5 !== "1") {
      const head = table.querySelector("thead tr");
      const alreadyCountry = head?.children[1]?.textContent.trim() === "国家";
      if (!alreadyCountry && head?.children[0]) {
        const th = document.createElement("th");
        th.textContent = "国家";
        head.children[0].after(th);
        table.querySelectorAll("tbody tr").forEach((row) => {
          const td = document.createElement("td");
          td.className = "country-cell-v5";
          td.textContent = countryFromRow(row) || "待补充";
          row.children[0]?.after(td);
        });
      } else {
        table.querySelectorAll("tbody tr").forEach((row) => row.children[1]?.classList.add("country-cell-v5"));
      }
      table.dataset.countryV5 = "1";
    }

    let select = document.getElementById("client-country-v5");
    const countries = [...new Set([...table.querySelectorAll(".country-cell-v5")]
      .map((x) => x.textContent.trim()).filter((x) => x && x !== "待补充"))].sort();
    if (!select) {
      select = document.createElement("select");
      select.id = "client-country-v5";
      select.addEventListener("change", () => {
        localStorage.setItem(COUNTRY_KEY, select.value);
        applyCountryFilter();
      });
      toolbar.insertBefore(select, toolbar.querySelector("#client-grade"));
    }
    const saved = localStorage.getItem(COUNTRY_KEY) || "全部";
    const countrySignature = countries.join("|");
    if (select.dataset.countryOptions !== countrySignature) {
      select.innerHTML = `<option value="全部">全部国家</option>${countries.map((c) => `<option value="${c}">${c}</option>`).join("")}`;
      select.dataset.countryOptions = countrySignature;
    }
    select.value = [...select.options].some((o) => o.value === saved) ? saved : "全部";
    applyCountryFilter();

    const countryInput = document.querySelector('#client-form [name="country"]');
    const label = countryInput?.closest(".field")?.querySelector("label");
    if (label) label.textContent = "国家";
  }

  function addImportButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById("import-accounts-20260903-v3")) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = "import-accounts-20260903-v3";
    button.type = "button";
    button.textContent = "＋ 导入今日30家";
    Object.assign(button.style, {
      margin: "10px 14px", padding: "10px 12px", border: "1px solid rgba(255,255,255,.18)",
      borderRadius: "8px", cursor: "pointer", fontWeight: "600"
    });
    button.addEventListener("click", () => importBatch(button));
    host.appendChild(button);
  }

  function maybeAutoImport() {
    if (autoAttempted || importStarted || localStorage.getItem(BATCH_KEY)) return;
    if (!document.querySelector('[data-view="clients"]')) return;
    autoAttempted = true;
    setTimeout(() => importBatch(document.getElementById("import-accounts-20260903-v3")), 700);
  }

  function run() {
    addImportButton();
    enhanceCountry();
    maybeAutoImport();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 500);
})();