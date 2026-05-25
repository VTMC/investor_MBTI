const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyauDmWhToMpGQQPQQIXVGVQubbyZH3Xut4G8Y8C7gKULLOCl4o3bNxvGqWwU1zD6eqhA/exec";

var scenarioData;

var selectElement = document.querySelector("select[name='option1']");
var rInputElement = document.getElementById("r_input");
var sInputElement = document.getElementById("s_input");
var cInputElement = document.getElementById("c_input");
var hInputElement = document.getElementById("h_input");
var scenarioDescriptor = document.querySelector(".description_of_scenario");

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

      const detailDataOfScenario = await getScenarioDetail(selectedScenario);

      console.log("Detail Data of Scenario : ", detailDataOfScenario);

      rInputElement.value = detailDataOfScenario.data.r_value;
      sInputElement.value = detailDataOfScenario.data.s_value;
      cInputElement.value = detailDataOfScenario.data.c_value;
      hInputElement.value = detailDataOfScenario.data.h_value;
      scenarioDescriptor.textContent = detailDataOfScenario.data.note;

      if(selectedScenario === "custom"){
        rInputElement.readOnly = false;
        sInputElement.readOnly = false;
        cInputElement.readOnly = false;
        hInputElement.readOnly = false;
      }

    });

    selectElement.dispatchEvent(new Event("change"));
  }catch(error){
    console.error("Error to load Scenario :", error);
  }
}

async function getScenarioDetail(scenarioName){
  try{
    const response = await fetch(SCRIPT_URL+"?action=getScenarioDetail&scenarioName="+encodeURIComponent(scenarioName));
    const data = await response.json();
    return data;
  }catch(error){
    console.error("Error to load Scenario Detail :", error);
    return null;
  }
}

async function main(){
  await getScenario();
  // await fetchData();
}

main();