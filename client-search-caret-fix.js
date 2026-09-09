(() => {
  "use strict";

  // app.js re-renders the whole account view on every search keystroke.
  // That recreates #client-search and resets the caret to position 0.
  // Preserve the user's caret position after the synchronous re-render.
  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.id !== "client-search") return;

    const caretStart = target.selectionStart ?? target.value.length;
    const caretEnd = target.selectionEnd ?? caretStart;
    const currentValue = target.value;

    queueMicrotask(() => {
      const nextInput = document.getElementById("client-search");
      if (!(nextInput instanceof HTMLInputElement)) return;
      if (nextInput.value !== currentValue) return;

      nextInput.focus({ preventScroll: true });
      const max = nextInput.value.length;
      const start = Math.min(caretStart, max);
      const end = Math.min(caretEnd, max);
      nextInput.setSelectionRange(start, end);
    });
  }, true);
})();
