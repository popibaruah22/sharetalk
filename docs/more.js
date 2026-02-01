document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("pwaInstallBtn");
  const status = document.getElementById("pwaInstallStatus");

  if (!btn) return;

  async function checkInstalled() {
    if ("getInstalledRelatedApps" in navigator) {
      const apps = await navigator.getInstalledRelatedApps();
      if (apps.length > 0) {
        btn.style.display = "none";
        if (status) status.innerText = "✅ App already downloaded";
        return;
      }
    }
    btn.style.display = "inline-block";
    if (status) status.innerText = "";
  }

  await checkInstalled();

  btn.addEventListener("click", async () => {
    if (!window.deferredInstallPrompt) {
      alert("Install not available yet. Visit home page once.");
      return;
    }

    window.deferredInstallPrompt.prompt();
    const result = await window.deferredInstallPrompt.userChoice;

    if (result.outcome === "accepted") {
      btn.style.display = "none";
      if (status) status.innerText = "✅ App downloaded";
    }

    window.deferredInstallPrompt = null;
  });

  window.addEventListener("focus", checkInstalled);
});
