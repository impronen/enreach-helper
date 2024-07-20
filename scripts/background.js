chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
    text: "OFF",
  });
});

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
  return inputValues;
}

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
