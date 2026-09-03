(() => {
  "use strict";

  const KEY = "ecore-country-filter-v1";

  function esc(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");
  }

  function apply() {
    const table = document.querySelector(".account-table table");
    const toolbar = document.querySelector("#client-search")?.closest(".toolbar");
    if (!table || !toolbar) return;

    let select = document.getElementById("client-country-v3");
    const countries = [...new Set([...table.querySelectorAll(".country-cell-v3")]
      .map((el) => el.textContent.trim())
      .filter((value) => value && value !== "待补充"))]
      .sort((a, b) => a.localeCompare(b));

    if (!select) {
      select = document.createElement("select");
      select.id = "client-country-v3";
      const grade = toolbar.querySelector("#client-grade");
      if (grade) toolbar.insertBefore(select, grade);
      else toolbar.appendChild(select);
      select.addEventListener("change", () => {
        localStorage.setItem(KEY, select.value);
        filterRows();
      });
    }

    const current = localStorage.getItem(KEY) || select.value || "全部";
    select.innerHTML = `<option value="全部">全部国家</option>${countries.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}`;
    select.value = [...select.options].some((o) => o.value === current) ? current : "全部";
    filterRows();
  }

  function filterRows() {
    const select = document.getElementById("client-country-v3");
    if (!select) return;
    const target = select.value;
    document.querySelectorAll(".account-table tbody tr").forEach((row) => {
      const country = row.querySelector(".country-cell-v3")?.textContent.trim() || "待补充";
      row.style.display = target === "全部" || country === target ? "" : "none";
    });
  }

  const observer = new MutationObserver(apply);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", apply);
  setTimeout(apply, 500);
})();
