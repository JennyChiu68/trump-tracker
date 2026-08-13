(function initFreePreview() {
  const tabs = [...document.querySelectorAll("[data-tab]")];
  const panels = [...document.querySelectorAll("[data-panel]")];
  const dialog = document.querySelector("#upgradeDialog");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.tab;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.panel !== next;
      });
      window.scrollTo({ top: 177, behavior: "smooth" });
    });
  });

  document.querySelectorAll("[data-open-upgrade]").forEach((button) => {
    button.addEventListener("click", () => {
      if (typeof dialog?.showModal === "function") dialog.showModal();
      else dialog?.setAttribute("open", "");
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => dialog?.close());
  });

  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
})();
