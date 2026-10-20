(() => {
  "use strict";

  const IMPORT_ID = "account-file-import-button";

  function placeButton() {
    const importButton = document.getElementById(IMPORT_ID);
    const newClientButton = document.querySelector('[data-action="client"]');
    if (!importButton || !newClientButton) return;

    const host = newClientButton.parentElement;
    if (!host || importButton.parentElement === host) return;

    host.insertBefore(importButton, newClientButton);
    Object.assign(importButton.style, {
      margin: "0 10px 0 0",
      padding: "10px 14px",
      border: "1px solid #1768f2",
      borderRadius: "8px",
      background: "#eaf2ff",
      color: "#0f4bb8",
      fontWeight: "700",
      cursor: "pointer",
      width: "auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center"
    });
  }

  const observer = new MutationObserver(placeButton);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("DOMContentLoaded", placeButton);
  setTimeout(placeButton, 400);
  setTimeout(placeButton, 1200);
})();
