(() => {
  "use strict";
  const BATCH_KEY = "ecore-account-batch-2026-09-03-v2";
  const FILTER_KEY = "ecore-country-filter-v2";
  const DATA_URL = "./account-batch-2026-09-03-v2.json?v=2";
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const norm = v => String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

  async function waitFor(fn, timeout = 15000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const v = fn();
      if (v) return v;
      await sleep(100);
    }
    return null;
  }

  function setField(form, name, value) {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.value = value || "";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  async function openClients() {
    const nav = await waitFor(() => document.querySelector('[data-view="clients"]'), 120000);
    if (!nav) return false;
    nav.click();
    return !!(await waitFor(() => document.querySelector(".account-table"), 5000));
  }

  function namesInCrm() {
    return new Set([...document.querySelectorAll(".account-table tbody .company-cell strong")].map(x => norm(x.textContent)).filter(Boolean));
  }

  async function addAccount(c) {
    let btn = document.querySelector('[data-action="client"]');
    if (!btn && !(await openClients())) return false;
    btn = document.querySelector('[data-action="client"]');
    if (!btn) return false;
    btn.click();
    const form = await waitFor(() => document.querySelector("#client-form"), 4000);
    if (!form) return false;
    setField(form, "company", c.company);
    setField(form, "website", c.website);
    setField(form, "country", c.country);
    setField(form, "accountGrade", c.accountGrade);
    setField(form, "accountType", c.accountType);
    setField(form, "direction", c.direction);
    setField(form, "products", c.products);
    setField(form, "nextAction", "找 Right Person，完成公司/职位/语言判断后定制第一封开发信");
    setField(form, "notes", `2026-09-03 去重后30家新开发池｜优先级 ${c.priority}｜尚未触达｜先验证 Right Person。`);
    setField(form, "email", "");
    setField(form, "linkedin", "");
    setField(form, "whatsapp", "");
    form.requestSubmit();
    return !!(await waitFor(() => !document.querySelector("#client-form"), 7000));
  }

  function banner(text) {
    document.getElementById("ecore-batch-v2-banner")?.remove();
    const el = document.createElement("div");
    el.id = "ecore-batch-v2-banner";
    el.textContent = text;
    Object.assign(el.style,{position:"fixed",right:"18px",bottom:"18px",zIndex:99999,padding:"12px 16px",borderRadius:"10px",background:"#173a2a",color:"white",fontSize:"14px",boxShadow:"0 8px 30px rgba(0,0,0,.2)"});
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }

  async function importBatch() {
    if (localStorage.getItem(BATCH_KEY) === "done") return;
    if (!(await openClients())) return;
    const candidates = await fetch(DATA_URL).then(r => r.json());
    const names = namesInCrm();
    let added = 0, skipped = 0;
    for (const c of candidates) {
      const aliases = [c.company, ...(c.aliases || [])].map(norm);
      if (aliases.some(a => names.has(a))) { skipped++; continue; }
      if (!(await addAccount(c))) return;
      aliases.forEach(a => names.add(a));
      added++;
      await sleep(120);
    }
    localStorage.setItem(BATCH_KEY, "done");
    banner(`CRM批次完成：新增 ${added} 家，跳过 ${skipped} 个已有账户。`);
  }

  function countryFromRow(row) {
    const small = row.querySelector(".company-cell small");
    return ((small?.textContent || "").split(" · ")[0] || "").trim();
  }

  function applyCountry() {
    const select = document.getElementById("client-country-v4");
    if (!select) return;
    document.querySelectorAll(".account-table tbody tr").forEach(row => {
      const c = row.querySelector(".country-cell-v4")?.textContent.trim() || "待补充";
      row.style.display = select.value === "全部" || c === select.value ? "" : "none";
    });
  }

  function enhanceCountry() {
    const table = document.querySelector(".account-table table");
    if (!table || table.dataset.countryV4 === "1") return;
    const head = table.querySelector("thead tr");
    if (!head) return;
    const old = head.children[1]?.textContent.trim() === "国家";
    if (!old) {
      const th = document.createElement("th"); th.textContent = "国家"; head.children[0].after(th);
      table.querySelectorAll("tbody tr").forEach(row => {
        const td = document.createElement("td"); td.className = "country-cell-v4"; td.textContent = countryFromRow(row) || "待补充"; row.children[0]?.after(td);
      });
    } else {
      table.querySelectorAll("tbody tr").forEach(row => row.children[1]?.classList.add("country-cell-v4"));
    }
    table.dataset.countryV4 = "1";
    const toolbar = table.closest(".account-table")?.previousElementSibling;
    if (toolbar?.classList.contains("toolbar") && !toolbar.querySelector("#client-country-v4")) {
      const countries = [...new Set([...table.querySelectorAll(".country-cell-v4")].map(x => x.textContent.trim()).filter(x => x && x !== "待补充"))].sort();
      const sel = document.createElement("select");
      sel.id = "client-country-v4";
      sel.innerHTML = `<option value="全部">全部国家</option>${countries.map(c => `<option>${c}</option>`).join("")}`;
      sel.value = localStorage.getItem(FILTER_KEY) || "全部";
      sel.addEventListener("change", () => { localStorage.setItem(FILTER_KEY, sel.value); applyCountry(); });
      toolbar.insertBefore(sel, toolbar.querySelector("#client-grade"));
      applyCountry();
    }
    const input = document.querySelector('#client-form [name="country"]');
    const label = input?.closest(".field")?.querySelector("label");
    if (label) label.textContent = "国家";
  }

  const observer = new MutationObserver(enhanceCountry);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(enhanceCountry, 300);
  setTimeout(importBatch, 800);
})();