const menuItems = ["Copy LEAD data", "Paste LEAD data", "Copy to Clipboard"];

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
  if (info.menuItemId === "Copy LEAD data") {
    handleCopyCommand(tab);
  } else if (info.menuItemId === "Paste LEAD data") {
    handlePasteCommand(tab);
  } else if (info.menuItemId === "Copy to Clipboard") {
    handleCopyToClipboard(tab);
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
      } else {
        console.log("No data returned from dataCopier.");
      }
    }
  );
}

function handleCopyToClipboard(tab) {
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      function: dataCopier,
    },
    (results) => {
      if (results && results.length > 0) {
        const resultData = results[0].result;

        // Format the text
        const formattedText = `
Uusi tapaaminen:
Yritys: ${resultData.Yritys}
Titteli: ${resultData.Titteli}
Nimi: ${resultData.Etunimi} ${resultData.Sukunimi}
Yhteystiedot: ${resultData.Matkapuhelinnumero} / ${resultData.Sähköpostiosoite}
${resultData.Muistiinpanot}
`.trim();

        // Send data to the content script for clipboard copy
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: copyToClipboard,
          args: [formattedText],
        });
      } else {
        console.log("Something's wrong here...");
      }
    }
  );
}

function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => console.log("Text successfully copied to clipboard!"))
    .catch((err) => console.error("Failed to copy text:", err));
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
    } else {
      console.log("No data found in storage to paste.");
    }
  });
}

// Actual copying
function dataCopier() {
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

  // Find the "Muistiinpanot" section
  const secondContainer = document.querySelector(
    ".WZyIH.ComponentContainer:nth-child(2)"
  );
  if (secondContainer) {
    const childElements = secondContainer.querySelectorAll("div.TS05F");
    childElements.forEach((child) => {
      const label = child.querySelector("label.YfDOn");
      if (label && label.textContent.trim() === "Muistiinpanot") {
        const textarea = child.querySelector("textarea");
        if (textarea) {
          const textareaValue = textarea.value.trim();
          inputValues["Muistiinpanot"] = textareaValue;
        }
      }
    });
  }

  return inputValues;
}

// Actual paste
function dataPaster(inputValues) {
  console.log("Pasting values:", inputValues);

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
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });
  });

  // Paste "Muistiinpanot" (needed cause Enreach HTML is a mess)
  const secondContainer = document.querySelector(
    ".WZyIH.ComponentContainer:nth-child(2)"
  );
  if (secondContainer) {
    const childElements = secondContainer.querySelectorAll("div.TS05F");
    childElements.forEach((child) => {
      const label = child.querySelector("label.YfDOn");
      if (label && label.textContent.trim() === "Muistiinpanot") {
        const textarea = child.querySelector("textarea");
        if (textarea && inputValues.hasOwnProperty("Muistiinpanot")) {
          textarea.value = inputValues["Muistiinpanot"];
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          textarea.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
    });
  }
}
