(() => {
  "use strict";

  // Stable account search override.
  // The original app.js re-renders the whole account view on every keystroke,
  // which recreates #client-search and makes the caret jump to the left.
  // Intercept only this input before the original handler runs and filter the
  // already-rendered rows in place. No MutationObserver, no DOM insertion loop.

  let liveQuery = "";

  function normalize(value) {
    return String(value || "").toLowerCase().trim();
  }

  function applyLiveSearch() {
    const input = document.getElementById("client-search");
    const tbody = document.querySelector(".account-table tbody");
    if (!(input instanceof HTMLInputElement) || !tbody) return;

    if (input.value !== liveQuery) input.value = liveQuery;

    const terms = normalize(liveQuery).split(/\s+/).filter(Boolean);
    const rows = [...tbody.querySelectorAll("tr")];

    rows.forEach((row) => {
      const haystack = normalize(row.textContent);
      const match = terms.length === 0 || terms.every((term) => haystack.includes(term));
      row.hidden = !match;
    });
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

  // Capture phase prevents the original direct input listener in app.js from
  // receiving this event, so the search box is never destroyed while typing.
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "client-search") return;

    liveQuery = target.value;
    event.stopPropagation();
    applyLiveSearch();
  }, true);

  // Other filters legitimately re-render the account page. Re-apply the live
  // search once that synchronous render has finished.
  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) return;
    if (!["client-status", "client-grade", "client-direction", "client-country"].includes(target.id)) return;
    restoreAfterRender();
  }, true);

  // Modal open/close and navigation can also re-render the account view.
  document.addEventListener("click", () => restoreAfterRender(), true);
})();
