const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyauDmWhToMpGQQPQQIXVGVQubbyZH3Xut4G8Y8C7gKULLOCl4o3bNxvGqWwU1zD6eqhA/exec";

var scenarioData;

var htmlElement = document.documentElement;

var selectElement = document.querySelector("select[name='option1']");
var rInputElement = document.getElementById("r_input");
var sInputElement = document.getElementById("s_input");
var cInputElement = document.getElementById("c_input");
var hInputElement = document.getElementById("h_input");
var scenarioDescriptor = document.querySelector(".description_of_scenario");

//themeToggleButton (Dark Mode / Light Mode)
var themeToggleButton = document.getElementsByClassName("theme-toggle-btn")[0];
var themeIcon = themeToggleButton.querySelector("h1");

function doGet() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

async function fetchData() {
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    console.log(data); // 가져온 데이터 확인
  } catch (error) {
    console.error("데이터 로드 실패:", error);
  }
}

async function getScenario() {
  try{
    const response = await fetch(SCRIPT_URL+"?action=getScenario");
    scenarioData = await response.json();
  
    console.log("Scenario Data:", scenarioData); // Check Scenario Data

    scenarioData.data.forEach(row => {
      const optionValue = row[0];
      if(optionValue != null && optionValue.trim() !== ""){
        const option = document.createElement("option");
        option.value = optionValue;
        option.textContent = optionValue;
        selectElement.appendChild(option);
      }
    });

    const customOption = Array.from(selectElement.options).find(option => {
      return option.value.toLowerCase() === "custom";
    });

    if (customOption) {
      selectElement.value = customOption.value;
    } else {
      // custom이 없으면 마지막 option 선택
      selectElement.selectedIndex = selectElement.options.length - 1;
    }

    selectElement.addEventListener("change", async function() {
      const selectedScenario = this.value;

      console.log("Selected Scenario : ", selectedScenario);

      if(!selectedScenario){
        scenarioDescriptor.textContent = "wrong scenario selected!";
        scenarioDescriptor.style.color = "red";
        scenarioDescriptor.style.fontWeight = "bold";
        return;
      }

      // const detailDataOfScenario = await getScenarioDetail(selectedScenario);

      const detailDataOfScenario = scenarioData.data.find(row => row[0] === selectedScenario);

      console.log("Detail Data of Scenario : ", detailDataOfScenario);

      rInputElement.value = detailDataOfScenario[1];
      sInputElement.value = detailDataOfScenario[2];
      cInputElement.value = detailDataOfScenario[3];
      hInputElement.value = detailDataOfScenario[4];
      scenarioDescriptor.textContent = detailDataOfScenario[5];

      if(selectedScenario === "custom"){
        rInputElement.readOnly = false;
        sInputElement.readOnly = false;
        cInputElement.readOnly = false;
        hInputElement.readOnly = false;
      }else{
        rInputElement.readOnly = true;
        sInputElement.readOnly = true;
        cInputElement.readOnly = true;
        hInputElement.readOnly = true;
      }

    });

    selectElement.dispatchEvent(new Event("change"));
  }catch(error){
    console.error("Error to load Scenario :", error);
  }
}

// async function getScenarioDetail(scenarioName){
//   try{
//     const response = await fetch(SCRIPT_URL+"?action=getScenarioDetail&scenarioName="+encodeURIComponent(scenarioName));
//     const data = await response.json();
//     return data;
//   }catch(error){
//     console.error("Error to load Scenario Detail :", error);
//     return null;
//   }
// }

function showLoading() {
  document.getElementById("loadingOverlay").classList.add("show");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.remove("show");
}

function applyTheme(theme) {
  if (theme === "dark") {
    htmlElement.classList.add("dark-mode");
    themeIcon.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  } else {
    htmlElement.classList.remove("dark-mode");
    themeIcon.textContent = "☀️";
    localStorage.setItem("theme", "light");
  }

  console.log("applied theme:", localStorage.getItem("theme"));
  console.log("html class:", htmlElement.className);
}

function applyTheme(theme) {
  htmlElement.classList.remove("dark-mode", "light-mode");

  if (theme === "dark") {
    htmlElement.classList.add("dark-mode");
    themeIcon.textContent = "🌙";
    localStorage.setItem("theme", "dark");
  } else if (theme === "light") {
    htmlElement.classList.add("light-mode");
    themeIcon.textContent = "☀️";
    localStorage.setItem("theme", "light");
  }
}

function initTheme() {
  var savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark" || savedTheme === "light") {
    applyTheme(savedTheme);
    return;
  }

  var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  if (systemDark) {
    themeIcon.textContent = "🌙";
  } else {
    themeIcon.textContent = "☀️";
  }
}

function toggleTheme() {
  themeToggleButton.addEventListener("click", function () {
    var isDarkNow =
      htmlElement.classList.contains("dark-mode") ||
      (
        !htmlElement.classList.contains("light-mode") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      );

    if (isDarkNow) {
      applyTheme("light");
    } else {
      applyTheme("dark");
    }

    console.log("theme:", localStorage.getItem("theme"));
    console.log("html class:", htmlElement.className);
  });
}

async function main(){
  initTheme();
  toggleTheme();

   try {
    showLoading();
    await getScenario();
  } catch (error) {
    console.error("main error:", error);
  } finally {
    hideLoading();
  }

  // await getScenario();
  // await fetchData();
}

main();