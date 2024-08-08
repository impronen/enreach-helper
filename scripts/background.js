const menuItems = ["Copy from Enreach", "Paste from Enreach"];

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });

  menuItems.forEach((item) => {
    chrome.contextMenus.create({
      id: item,
      title: item,
      type: "normal",
      contexts: ["all"],
    });
  });
});

// Context menu listener
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "Copy from Enreach") {
    handleCopyCommand(tab);
  } else if (info.menuItemId === "Paste from Enreach") {
    handlePasteCommand(tab);
  }
});

// Shortcut listener
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (command === "run-copy") {
      handleCopyCommand(tabs[0]);
    } else if (command === "run-paste") {
      handlePasteCommand(tabs[0]);
    }
  });
});

// Extension side copy
function handleCopyCommand(tab) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: dataCopier,
    },
    (results) => {
      if (results && results.length > 0) {
        const copiedData = results[0].result;
        chrome.storage.local.set({ copiedData: copiedData }, () => {
          console.log("Data copied and stored:", copiedData);
        });
      }
    }
  );
}

// Extension side paste
function handlePasteCommand(tab) {
  chrome.storage.local.get("copiedData", (result) => {
    const inputValues = result.copiedData;
    if (inputValues) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: dataPaster,
        args: [inputValues],
      });
    }
  });
}

// Actual copying
function dataCopier() {
  console.log("Running Copy!");
  const data = document.querySelectorAll(".ydum_");

  const inputValues = {};

  data.forEach((element) => {
    const childDivs = element.querySelectorAll("div");

    childDivs.forEach((child) => {
      const label = child.querySelector("label");
      const input = child.querySelector('input[type="text"]');

      if (label && input) {
        const labelText = label.textContent.trim();
        const inputValue = input.value.trim();
        inputValues[labelText] = inputValue;
      }
    });
  });

  return inputValues;
}

// Actual paste
function dataPaster(inputValues) {
  console.log(inputValues);

  const data = document.querySelectorAll(".ydum_");

  data.forEach((element) => {
    const childDivs = element.querySelectorAll("div");

    childDivs.forEach((child) => {
      const label = child.querySelector("label");
      const input = child.querySelector('input[type="text"]');

      if (label && input) {
        const labelText = label.textContent.trim();
        if (inputValues.hasOwnProperty(labelText)) {
          input.value = inputValues[labelText];
        }
      }
    });
  });
}
