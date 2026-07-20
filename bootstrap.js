(function bootstrap() {
  function loadScript(source, onload) {
    const script = document.createElement("script");
    script.src = source;
    script.defer = true;
    if (onload) script.addEventListener("load", onload, { once: true });
    script.addEventListener("error", showBootstrapError, { once: true });
    document.head.appendChild(script);
  }

  function showBootstrapError() {
    const message = '<div class="status-state error-state"><strong>页面载入失败</strong><span>请检查网络后刷新</span></div>';
    const primary = document.querySelector("#primaryList");
    const archive = document.querySelector("#statementList");
    if (primary) primary.innerHTML = message;
    if (archive) archive.innerHTML = message;
  }

  if (window.location.protocol === "file:") {
    loadScript("./snapshot.js?v=20260720-core-2", () => loadScript("./app.js?v=20260720-core-2"));
  } else {
    loadScript("./app.js?v=20260720-core-2");
  }
})();
