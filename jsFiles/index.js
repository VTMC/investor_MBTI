import { getDateString } from "./util.js";
import { getTxtResult } from "./util.js";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyauDmWhToMpGQQPQQIXVGVQubbyZH3Xut4G8Y8C7gKULLOCl4o3bNxvGqWwU1zD6eqhA/exec";

var scenarioData;

var htmlElement = document.documentElement;

var selectElement = document.querySelector("select[name='option1']");
var rInputElement = document.getElementById("r_input");
var sInputElement = document.getElementById("s_input");
var cInputElement = document.getElementById("c_input");
var hInputElement = document.getElementById("h_input");
var scenarioDescriptor = document.querySelector(".description_of_scenario");

var startButton = document.getElementById("start-btn");
var restartButton = document.getElementById("restart_btn");
var shareButton = document.getElementById("share_btn");
var saveButton = document.getElementById("save_btn");
var saveImgButton = document.getElementById("save-img-format-btn");
var saveTxtButton = document.getElementById("save-text-format-btn");

//themeToggleButton (Dark Mode / Light Mode)
var themeToggleButton = document.getElementsByClassName("theme-toggle-btn")[0];
var themeIcon = themeToggleButton.querySelector("h1");

var spyValueP = document.getElementById("SPY-value");
var qqqValueP = document.getElementById("QQQ-value");
var qldValueP = document.getElementById("QLD-value");
var jepiValueP = document.getElementById("JEPI-value");
var schdValueP = document.getElementById("SCHD-value");
var vnqValueP = document.getElementById("VNQ-value");
var tltValueP = document.getElementById("TLT-value");
var iauValueP = document.getElementById("IAU-value");
var objzValueP = document.getElementById("objective-z-value");
var totalWeightValueP = document.getElementById("total-weight-value");

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

function showLoadingBox(loadingStr) { 
  document.getElementById("loadingOverlay").classList.add("show");

  if(loadingStr != null && typeof loadingStr === "string"){
    var loadingText = document.getElementsByClassName("loading-text")[0];

    loadingText.textContent = loadingStr
  }
}

function hideLoadingBox() {
  document.getElementById("loadingOverlay").classList.remove("show");
}   

function showSaveFormatDataBox() {
  document.getElementById("saveOverlay").classList.add("show");
}

function hideSaveFormatDataBox(){
  document.getElementById("saveOverlay").classList.remove("show");
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

// function applyTheme(theme) {
//   htmlElement.classList.remove("dark-mode", "light-mode");

//   if (theme === "dark") {
//     htmlElement.classList.add("dark-mode");
//     themeIcon.textContent = "🌙";
//     localStorage.setItem("theme", "dark");
//   } else if (theme === "light") {
//     htmlElement.classList.add("light-mode");
//     themeIcon.textContent = "☀️";
//     localStorage.setItem("theme", "light");
//   }
// }

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

function setActiveButtonsFeature(){
  restartButton.addEventListener("click", function (){
    location.reload();
  });

  shareButton.addEventListener("click", function() {

  });

  saveButton.addEventListener("click", function() {
    showSaveFormatDataBox();

    saveImgButton.addEventListener("click", function() {
      hideSaveFormatDataBox();
      
      saveResultAsImage();
    });

    saveTxtButton.addEventListener("click", function() {
      hideSaveFormatDataBox();

      saveResultAsTxt();
    });
  });

  startButton.addEventListener("click", function () {
    startModel();
  });
}

async function saveResultAsImage(){
  const target = document.querySelector("main");

  if(!target){
    alert("Can't find capture Area!");
    return;
  }

  showLoadingBox("saving image...");

  try{
    const canvas = await html2canvas(target, {
        backgroundColor: "#ffffff",
        scale: Math.max(window.devicePixelRatio || 1,2),
        useCORS: true,
        // 스크롤 위치 보정
        scrollX: 0,
        scrollY: -window.scrollY
    });

    const imageUrl = canvas.toDataURL("image/jpg");

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `${getDateString()}_investor_MBTI_Analyzer_Result.jpg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error(error);
    alert("이미지 저장 중 오류가 발생했습니다.");
  } finally {
    hideLoadingBox();
  }
}

function saveResultAsTxt(){
  var resultText = "";

  resultText = getTxtResult(
    selectElement.value,
    rInputElement.value,
    sInputElement.value,
    cInputElement.value,
    hInputElement.value,
    spyValueP.textContent,
    qqqValueP.textContent,
    qldValueP.textContent,
    jepiValueP.textContent,
    schdValueP.textContent,
    vnqValueP.textContent,
    tltValueP.textContent,
    iauValueP.textContent,
    objzValueP.textContent,
    totalWeightValueP.textContent
  );

  if(!resultText || resultText.trim === ""){
    alert("Text data is empty.");
    return;
  }

  showLoadingBox("saving txt...");

  try{
    const fileName = `${getDateString()}_investor_MBTI_Analyzer_Result.txt`;

    const blob = new Blob(["\uFEFF" + resultText], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href=url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }catch(error){
    console.error(error);
    alert("문서 파일 저장 중 오류가 발생했습니다.");
  } finally {
    hideLoadingBox();
  }
}

function startModel(){
  // 모델 실행 로직 추가
  // 결과 창 표시
  document.getElementsByClassName("result-contents")[0].classList.add("show");
}

async function main(){
  showLoadingBox();
  initTheme();
  toggleTheme();
  setActiveButtonsFeature();

   try {
    await getScenario();
  } catch (error) {
    console.error("main error:", error);
  } finally {
    hideLoadingBox();
  }

  // await getScenario();
  // await fetchData();
}

main();