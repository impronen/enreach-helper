document.addEventListener("DOMContentLoaded", () => {
  const statusElement = document.getElementById("status");
  const toggleButton = document.getElementById("toggleBtn");

  chrome.storage.local.get("extensionStatus", (data) => {
    const isActive = data.extensionStatus === "active";
    updateStatus(isActive);
  });

  toggleButton.addEventListener("click", () => {
    chrome.storage.local.get("extensionStatus", (data) => {
      const newStatus =
        data.extensionStatus === "active" ? "disabled" : "active";
      chrome.storage.local.set({ extensionStatus: newStatus }, () => {
        updateStatus(newStatus === "active");
      });
    });
  });

  function updateStatus(isActive) {
    statusElement.textContent = isActive ? "Active" : "Disabled";
    statusElement.className = isActive ? "active" : "disabled";

    chrome.action.setBadgeText({ text: isActive ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({
      color: isActive ? "green" : "red",
    });
  }
});
