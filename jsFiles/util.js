export function getDateString() {
    const now = new Date();

    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");

    return `${yyyy}${mm}${dd}_${hh}${min}`;
}

export function getTxtResult(scenarioValue, rValue, sValue, cValue, hValue, spyValue, 
    qqqValue, qldValue, jepiValue, schdValue, vnqValue, tltValue, iauValue, objzValue, totalWeightValue){
    
        const text = 
`${makeTitle("inputted Scenario")}
Scenario : ${scenarioValue}
Rate : ${rValue}
Safety : ${sValue}
Cash Flow : ${cValue}
Hedge : ${hValue}
${makeTitle("Result")}
SPY : ${spyValue}
QQQ : ${qqqValue}
QLD : ${qldValue}
JEPI : ${jepiValue}
SCHD : ${schdValue}
VNQ : ${vnqValue}
TLT : ${tltValue}
IAU : ${iauValue}
${makeTitle("Expected Deliverables")}
Total Weight : ${totalWeightValue}
Objective Z : ${objzValue}`;

        return text;

}

function makeTitle(title, totalLength = 45) {
    const titleText = `[${title}]`;

    // 제목 길이와 전체 길이의 홀짝이 다르면 전체 길이를 1 증가
    if ((totalLength - titleText.length) % 2 !== 0) {
        totalLength += 1;
    }

    const remainLength = totalLength - titleText.length;
    const sideLength = remainLength / 2;

    return "=".repeat(sideLength) + titleText + "=".repeat(sideLength);
}