(() => {
  "use strict";

  const INPUT_ID = "account-import-file";
  const BUTTON_ID = "account-file-import-button";
  const MODAL_ID = "account-import-preview-modal";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const norm = (v = "") => String(v).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g, "");
  let importing = false;

  function toast(text, error = false) {
    document.getElementById("account-import-toast")?.remove();
    const el = document.createElement("div");
    el.id = "account-import-toast";
    el.textContent = text;
    Object.assign(el.style, {
      position: "fixed", right: "18px", bottom: "18px", zIndex: 1000001,
      maxWidth: "520px", padding: "13px 17px", borderRadius: "10px",
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

  function ensureInput() {
    let input = document.getElementById(INPUT_ID);
    if (input) return input;
    input = document.createElement("input");
    input.id = INPUT_ID;
    input.type = "file";
    input.accept = ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv";
    input.hidden = true;
    input.addEventListener("change", onFileChosen);
    document.body.appendChild(input);
    return input;
  }

  function headerValue(row, aliases) {
    const map = new Map(Object.entries(row || {}).map(([k, v]) => [norm(k), v]));
    for (const key of aliases) {
      const value = map.get(norm(key));
      if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
    }
    return "";
  }

  function mapGrade(raw) {
    const s = String(raw || "").trim().toUpperCase();
    if (s.startsWith("A")) return "A";
    if (s.startsWith("B")) return "B";
    return "C";
  }

  function mapDirection(raw) {
    const s = String(raw || "").toLowerCase();
    if (/two-way|both|双向/.test(s)) return "Two-way";
    if (/sell priority|sell-to|向对方销售/.test(s) && !/buy priority|buy-from/.test(s)) return "Sell-to";
    if (/buy priority|buy-from|采购|供应源/.test(s) && !/sell priority/.test(s)) return "Buy-from";
    return "Two-way";
  }

  function mapAccountType(raw) {
    const s = String(raw || "").toLowerCase();
    if (/server.*manufacturer|server.*builder|system manufacturer|bto server|server builder/.test(s)) return "Server Builder";
    if (/hpc|ai infrastructure/.test(s)) return "HPC / AI Infrastructure";
    if (/distributor|distribution|stocking|component distributor/.test(s)) return "Distributor";
    if (/var|value-added/.test(s)) return "VAR";
    if (/cloud|hosting|iaas|dedicated server/.test(s)) return "Cloud / Hosting";
    if (/data center|datacenter/.test(s)) return "Data Center";
    if (/oem|odm/.test(s)) return "OEM / ODM";
    if (/lifecycle|repair|maintenance/.test(s)) return "Repair / Lifecycle";
    if (/integrator|solution provider|enterprise it/.test(s)) return "SI";
    return "Other";
  }

  function sheetRows(workbook, names) {
    const target = workbook.SheetNames.find((n) => names.some((x) => norm(n) === norm(x)));
    if (!target) return [];
    return XLSX.utils.sheet_to_json(workbook.Sheets[target], { defval: "", raw: false });
  }

  function parseWorkbook(workbook) {
    const crmRows = sheetRows(workbook, ["CRM导入", "CRM Import", "Import"]);
    const baseRows = crmRows.length ? crmRows : XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: "", raw: false });
    const scoreRows = sheetRows(workbook, ["综合评分", "Scoring", "Score"]);
    const scoreByCompany = new Map();
    scoreRows.forEach((r) => {
      const company = headerValue(r, ["Company", "公司", "公司名称"]);
      if (company) scoreByCompany.set(norm(company), r);
    });

    return baseRows.map((r, index) => {
      const company = headerValue(r, ["公司", "Company", "公司名称", "Account", "Account Name"]);
      const extra = scoreByCompany.get(norm(company)) || {};
      const gradeRaw = headerValue(r, ["优先级", "Grade", "Account Grade", "等级"]) || headerValue(extra, ["Grade"]);
      const followJudgement = headerValue(r, ["跟进判断", "Motion", "业务方向", "Direction"]) || headerValue(extra, ["Motion"]);
      const companyType = headerValue(r, ["Company Type", "公司类型", "账户类型", "类型"]) || headerValue(extra, ["Company Type"]);
      const evidence = headerValue(extra, ["Evidence / Challenge", "Evidence", "证据"]) || headerValue(r, ["证据", "Evidence", "最近回复/备注", "备注"]);
      const nextAction = headerValue(r, ["下一步目的", "Next Action", "下一步"]) || headerValue(extra, ["Next Action"]);
      const source = headerValue(r, ["资料链接", "Source", "Official Source", "来源"]) || headerValue(extra, ["Official Source"]);
      const products = headerValue(r, ["产品", "Products", "Product", "Product Family", "品类"]);
      const status = headerValue(r, ["当前状态", "Status"]);
      return {
        rowNumber: index + 2,
        company,
        website: headerValue(r, ["官网", "Website", "URL", "网址"]),
        country: headerValue(r, ["国家/地区", "Country/Region", "Country", "国家", "地区"]),
        accountGrade: mapGrade(gradeRaw),
        accountType: mapAccountType(companyType),
        direction: mapDirection(followJudgement),
        products,
        role: headerValue(r, ["职位", "Role", "Target Role", "目标职位"]) || headerValue(extra, ["Target Role"]),
        contact: headerValue(r, ["联系人", "Contact", "Contact Name"]),
        email: headerValue(r, ["Email", "邮箱", "电子邮箱"]),
        linkedin: headerValue(r, ["LinkedIn", "LinkedIn URL"]),
        whatsapp: headerValue(r, ["WhatsApp", "Whatsapp"]),
        status,
        followJudgement,
        nextAction,
        evidence,
        notes: headerValue(r, ["最近回复/备注", "备注", "Notes"]),
        source,
        companyTypeRaw: companyType,
      };
    }).filter((x) => x.company);
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
    return !!(await waitFor(() => document.querySelector(".account-table"), 5000));
  }

  function setField(form, name, value) {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.value = value ?? "";
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
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
    setField(form, "products", c.products || "Enterprise DDR5 RDIMM / Enterprise SSD");
    setField(form, "role", c.role || "");
    setField(form, "contact", c.contact || "");
    setField(form, "contactName", c.contact || "");
    setField(form, "email", c.email || "");
    setField(form, "linkedin", c.linkedin || "");
    setField(form, "whatsapp", c.whatsapp || "");
    setField(form, "commercialHypothesis", c.followJudgement || `${c.direction} account imported from research file; qualify real demand/inventory before upgrading stage.`);
    setField(form, "verifiedEvidence", [c.evidence, c.source ? `Source: ${c.source}` : ""].filter(Boolean).join(" | "));
    setField(form, "nextAction", c.nextAction || "找 Right Person，确认业务职责与真实采购/库存场景");
    setField(form, "notes", ["File import", c.notes, c.companyTypeRaw ? `Company Type: ${c.companyTypeRaw}` : ""].filter(Boolean).join(" | "));

    form.requestSubmit();
    return !!(await waitFor(() => !document.querySelector("#client-form"), 5000));
  }

  function closePreview() {
    document.getElementById(MODAL_ID)?.remove();
  }

  function showPreview(fileName, records) {
    closePreview();
    const names = existingNames();
    const seen = new Set();
    const rows = records.map((r) => {
      const key = norm(r.company);
      const duplicate = names.has(key) || seen.has(key);
      seen.add(key);
      return { ...r, duplicate };
    });
    const fresh = rows.filter((r) => !r.duplicate);
    const duplicates = rows.length - fresh.length;

    const overlay = document.createElement("div");
    overlay.id = MODAL_ID;
    Object.assign(overlay.style, {
      position: "fixed", inset: 0, zIndex: 1000000, background: "rgba(15,23,42,.45)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "24px"
    });
    const card = document.createElement("div");
    Object.assign(card.style, {
      width: "min(980px, 96vw)", maxHeight: "88vh", overflow: "auto", background: "#fff",
      borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,.25)", padding: "22px"
    });
    const sample = rows.slice(0, 12).map((r) => `
      <tr style="border-top:1px solid #e5e7eb">
        <td style="padding:9px 8px"><strong>${escapeHtml(r.company)}</strong></td>
        <td style="padding:9px 8px">${escapeHtml(r.country || "—")}</td>
        <td style="padding:9px 8px">${escapeHtml(r.accountGrade)}</td>
        <td style="padding:9px 8px">${escapeHtml(r.direction)}</td>
        <td style="padding:9px 8px">${r.duplicate ? '<span style="color:#b45309">重复，将跳过</span>' : '<span style="color:#166534">净新增</span>'}</td>
      </tr>`).join("");
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:18px;align-items:flex-start">
        <div>
          <h2 style="margin:0 0 6px;font-size:22px;color:#0f2e63">导入客户文件 · Preview</h2>
          <div style="color:#64748b;font-size:13px">${escapeHtml(fileName)}</div>
        </div>
        <button data-close style="border:0;background:#f1f5f9;border-radius:8px;padding:8px 12px;cursor:pointer">关闭</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:18px 0">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:13px"><div style="font-size:12px;color:#64748b">识别记录</div><strong style="font-size:24px">${rows.length}</strong></div>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:13px"><div style="font-size:12px;color:#166534">净新增</div><strong style="font-size:24px;color:#166534">${fresh.length}</strong></div>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:13px"><div style="font-size:12px;color:#92400e">重复跳过</div><strong style="font-size:24px;color:#92400e">${duplicates}</strong></div>
      </div>
      <div style="font-size:13px;color:#475569;margin-bottom:10px">自动识别：公司、国家/地区、官网、优先级、职位、业务方向、下一步、备注；如存在“综合评分”Sheet，会补充 Company Type / Evidence / Target Role。</div>
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse;font-size:13px"><thead style="background:#f8fafc"><tr><th style="text-align:left;padding:9px 8px">公司</th><th style="text-align:left;padding:9px 8px">国家</th><th style="text-align:left;padding:9px 8px">等级</th><th style="text-align:left;padding:9px 8px">Motion</th><th style="text-align:left;padding:9px 8px">去重</th></tr></thead><tbody>${sample}</tbody></table>
      </div>
      ${rows.length > 12 ? `<div style="font-size:12px;color:#64748b;margin-top:8px">仅预览前12条；共 ${rows.length} 条。</div>` : ""}
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px">
        <button data-close style="border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:10px 16px;cursor:pointer">取消</button>
        <button data-confirm ${fresh.length ? "" : "disabled"} style="border:0;background:${fresh.length ? "#1768f2" : "#94a3b8"};color:#fff;border-radius:8px;padding:10px 18px;font-weight:700;cursor:${fresh.length ? "pointer" : "not-allowed"}">确认导入 ${fresh.length} 家</button>
      </div>`;
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    overlay.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closePreview));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closePreview(); });
    overlay.querySelector("[data-confirm]")?.addEventListener("click", () => importRecords(fresh, overlay.querySelector("[data-confirm]")));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[ch]));
  }

  async function importRecords(records, button) {
    if (importing || !records.length) return;
    importing = true;
    button.disabled = true;
    const original = button.textContent;
    let added = 0;
    try {
      if (!(await goClients())) throw new Error("无法打开账户库");
      for (const record of records) {
        button.textContent = `正在导入 ${added + 1}/${records.length}…`;
        const ok = await addOne(record);
        if (!ok) throw new Error(`写入 ${record.company} 时失败`);
        added += 1;
        await sleep(90);
      }
      closePreview();
      toast(`导入完成：新增 ${added} 家。重复账户已在 Preview 阶段自动跳过。`);
    } catch (err) {
      toast(`导入中断：已新增 ${added} 家；${err.message || err}`, true);
      button.disabled = false;
      button.textContent = original;
    } finally {
      importing = false;
    }
  }

  async function onFileChosen(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!window.XLSX) {
      toast("Excel解析组件未加载，请刷新页面后重试。", true);
      return;
    }
    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array", cellDates: true });
      const records = parseWorkbook(workbook);
      if (!records.length) throw new Error("没有识别到公司列。请使用包含“公司/Company”列的Excel或CSV。 ");
      if (!(await goClients())) throw new Error("无法打开账户库进行去重预览");
      showPreview(file.name, records);
    } catch (err) {
      toast(`读取文件失败：${err.message || err}`, true);
    }
  }

  function addButton() {
    if (!document.querySelector('[data-view="clients"]')) return;
    if (document.getElementById(BUTTON_ID)) return;
    const host = document.querySelector(".sidebar") || document.body;
    const button = document.createElement("button");
    button.id = BUTTON_ID;
    button.type = "button";
    button.textContent = "＋ 导入客户文件";
    Object.assign(button.style, {
      margin: "10px 14px", padding: "11px 12px", border: "1px solid #1768f2",
      borderRadius: "8px", cursor: "pointer", fontWeight: "700", background: "#eaf2ff", color: "#0f4bb8"
    });
    button.title = "支持 Excel / CSV；先预览、自动去重，再确认导入";
    button.addEventListener("click", () => ensureInput().click());
    host.appendChild(button);
  }

  function run() {
    ensureInput();
    addButton();
  }

  const observer = new MutationObserver(run);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", run);
  setTimeout(run, 500);
})();