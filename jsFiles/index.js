const SCRIPT_URL = "https://docs.google.com/spreadsheets/d/1qHDKKrVmFucePpcuPVDWSo4g0vKudzUIgb08Kyn8LpY/edit?usp=sharing";

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

function main(){
    fetchData();
}

main();