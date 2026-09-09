(() => {
  "use strict";

  // Root fix for the account search bug:
  // app.js re-renders the entire account page on every input event, which
  // destroys #client-search and makes the caret jump back to the left.
  // Intercept only this search box before app.js sees the event, keep the
  // input node alive, and filter the currently rendered table rows in place.

  let liveQuery = "";
  let applying = false;

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function removeEmptyRow(tbody) {
    tbody?.querySelector('[data-live-search-empty="1"]')?.remove();
  }

  function applyLiveSearch() {
    if (applying) return;
    const input = document.getElementById("client-search");
    const tbody = document.querySelector(".account-table tbody");
    if (!(input instanceof HTMLInputElement) || !tbody) return;

    applying = true;
    try {
      // If another CRM filter re-rendered the page, restore the current query.
      if (input.value !== liveQuery) input.value = liveQuery;

      removeEmptyRow(tbody);
      const terms = normalize(liveQuery).split(/\s+/).filter(Boolean);
      const rows = [...tbody.querySelectorAll("tr")].filter((row) => !row.hasAttribute("data-live-search-empty"));
      let visible = 0;

      rows.forEach((row) => {
        const haystack = normalize(row.textContent);
        const match = terms.length === 0 || terms.every((term) => haystack.includes(term));
        row.style.display = match ? "" : "none";
        if (match) visible += 1;
      });

      if (rows.length && visible === 0) {
        const empty = document.createElement("tr");
        empty.dataset.liveSearchEmpty = "1";
        empty.innerHTML = '<td colspan="8" style="padding:42px 18px;text-align:center;color:#7a8596;">没有符合搜索条件的客户</td>';
        tbody.appendChild(empty);
      }
    } finally {
      applying = false;
    }
  }

  // Capture phase is intentional: stop the original app.js input handler from
  // calling render(), while leaving every other input in the CRM untouched.
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "client-search") return;

    event.stopImmediatePropagation();
    event.stopPropagation();
    liveQuery = target.value;
    applyLiveSearch();
  }, true);

  // The country/grade/direction/status filters still legitimately re-render
  // the account page. Re-apply the live query afterward without moving focus.
  const observer = new MutationObserver(() => {
    if (!liveQuery && !document.getElementById("client-search")) return;
    queueMicrotask(applyLiveSearch);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener("DOMContentLoaded", applyLiveSearch);
})();
