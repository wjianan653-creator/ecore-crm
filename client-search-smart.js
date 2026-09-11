(() => {
  "use strict";

  // Keep the account search input stable while filtering and ranking the
  // already-rendered rows. This avoids destroying the input/caret on each key.
  let liveQuery = "";

  function normalize(value) {
    return String(value || "")
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function words(value) {
    return normalize(value).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  }

  function rowRecord(row) {
    const headers = [...document.querySelectorAll(".account-table thead th")].map((cell) => normalize(cell.textContent));
    const cellText = (label) => {
      const index = headers.findIndex((header) => header.includes(normalize(label)));
      return index >= 0 ? normalize(row.children[index]?.textContent) : "";
    };
    const companyMeta = row.querySelector(".company-cell small")?.textContent || "";
    const [companyCountry = "", ...websiteParts] = companyMeta.split("·");
    return {
      company: normalize(row.dataset.searchCompany || row.querySelector(".company-cell strong")?.textContent),
      website: normalize(row.dataset.searchWebsite || websiteParts.join("·")),
      country: normalize(row.dataset.searchCountry || row.querySelector(".country-cell-v5")?.textContent || companyCountry),
      contact: normalize(row.dataset.searchContact || row.querySelector(".contact-cell")?.textContent),
      products: normalize(row.dataset.searchProducts || `${cellText("等级 / 类型")} ${cellText("业务方向")}`),
      notes: normalize(row.dataset.searchNotes || cellText("下一步")),
    };
  }

  function scoreRecord(record, query) {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return 0;

    // One letter is normally used to jump to a company initial. The previous
    // full-row search made "T" match nearly every US account.
    if (terms.length === 1 && terms[0].length === 1) {
      return words(record.company).some((word) => word.startsWith(terms[0])) ? 500 : -1;
    }

    const fields = [record.company, record.website, record.country, record.contact, record.products, record.notes];
    if (!terms.every((term) => fields.some((field) => field.includes(term)))) return -1;

    const fullQuery = terms.join(" ");
    let score = 0;
    if (record.company === fullQuery) score += 1200;
    else if (record.company.startsWith(fullQuery)) score += 900;
    else if (words(record.company).some((word) => word.startsWith(fullQuery))) score += 700;
    else if (record.company.includes(fullQuery)) score += 500;

    terms.forEach((term) => {
      if (words(record.company).some((word) => word.startsWith(term))) score += 220;
      else if (record.company.includes(term)) score += 160;
      if (record.contact.includes(term)) score += 90;
      if (record.website.includes(term)) score += 80;
      if (record.products.includes(term)) score += 55;
      if (record.country.includes(term)) score += 35;
      if (record.notes.includes(term)) score += 20;
    });
    return score;
  }

  function ensureFeedback(input) {
    let feedback = document.getElementById("client-search-feedback");
    if (feedback) return feedback;
    feedback = document.createElement("div");
    feedback.id = "client-search-feedback";
    feedback.className = "client-search-feedback";
    feedback.setAttribute("aria-live", "polite");
    Object.assign(feedback.style, { margin: "-5px 0 12px", color: "#49617f", fontSize: "12px" });
    input.closest(".toolbar")?.insertAdjacentElement("afterend", feedback);
    return feedback;
  }

  function applyLiveSearch() {
    const input = document.getElementById("client-search");
    const tbody = document.querySelector(".account-table tbody");
    if (!(input instanceof HTMLInputElement) || !tbody) return;

    if (input.value !== liveQuery) input.value = liveQuery;

    const rows = [...tbody.querySelectorAll("tr")];
    const hasQuery = Boolean(normalize(liveQuery));
    const ranked = rows.map((row, index) => {
      if (!row.dataset.searchOrder) row.dataset.searchOrder = String(index);
      return { row, score: hasQuery ? scoreRecord(rowRecord(row), liveQuery) : 0 };
    });

    ranked.sort((a, b) => {
      if (hasQuery && b.score !== a.score) return b.score - a.score;
      return Number(a.row.dataset.searchOrder) - Number(b.row.dataset.searchOrder);
    });

    let matches = 0;
    ranked.forEach(({ row, score }) => {
      const match = !hasQuery || score >= 0;
      row.hidden = !match;
      if (match) matches += 1;
      tbody.appendChild(row);
    });

    const feedback = ensureFeedback(input);
    if (!feedback) return;
    feedback.textContent = hasQuery
      ? matches
        ? `找到 ${matches} 家匹配账户`
        : "没有找到匹配账户，请换公司名、联系人、邮箱或产品关键词"
      : "";
    feedback.hidden = !hasQuery;
    feedback.classList.toggle("is-empty", hasQuery && matches === 0);
    feedback.style.color = hasQuery && matches === 0 ? "#a33b44" : "#49617f";
  }

  function restoreAfterRender() {
    if (!liveQuery) return;
    setTimeout(() => {
      const input = document.getElementById("client-search");
      if (!(input instanceof HTMLInputElement)) return;
      input.value = liveQuery;
      applyLiveSearch();
    }, 0);
  }

  // Capture phase prevents app.js from replacing the input while typing.
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "client-search") return;

    liveQuery = target.value;
    event.stopPropagation();
    applyLiveSearch();
  }, true);

  // Preserve dashboard global search when Enter opens the account library.
  document.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "global-search" || event.key !== "Enter") return;
    liveQuery = target.value;
    setTimeout(applyLiveSearch, 0);
  }, true);

  // Other filters legitimately re-render the account page. Re-apply the query.
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!["client-status", "client-grade", "client-direction", "client-country", "client-country-v5"].includes(target.id)) return;
    restoreAfterRender();
  }, true);

  // Modal open/close and navigation can also re-render the account view.
  document.addEventListener("click", () => restoreAfterRender(), true);
})();
