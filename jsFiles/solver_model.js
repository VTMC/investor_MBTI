/*******************************************************
 * Investment MBTI Portfolio Optimizer
 * AHP-LP 기반 ETF 포트폴리오 최적화 JS 버전
 *******************************************************/

/**
 * ETF 순서
 * SOLVER_Results, Scores, Metrics와 동일한 순서로 유지하는 것이 중요함
 */
const ETF_ORDER = ["SPY", "QQQ", "QLD", "JEPI", "SCHD", "VNQ", "TLT", "IAU"];

/**
 * 기본 제약조건 파라미터
 * 현재 최종 프로젝트 기준
 */
const DEFAULT_PARAMS = {
  totalWeight = 1.0,                                    //== Total Weight : 각 x_i wiehgt 합이 1이여야 한다.
  nonNegative = 0,                                      //== Non-negative : 각 x_i weight 항목이 음수이면 안 됨을 의미
  maxSingleWeight: 0.30,                                //== Max SingleETF
  maxQldWeight: 0.15,                                   //== QLD Max

  //need to calculate - growth Sleeve Min : (growthMinBase + growthMinCoef) * (scenario.R/100)
  growthMinBase: 0.15,                                  //== Growth Min Base
  growthMinCoef: 0.60,                                  //== Growth Min Coef

  highGrowthMinCoef: 0.30,  //==High-Growth Sleeve Min

  //need to calculate - Risk Score Max : (riskMaxBase - riskMaxStabilityCoef) * (scenario.S/100)
  riskMaxBase: 70,                                      //== Risk Max Base
  riskMaxStabilityCoef: 35,                             //==Risk Max Stability Coef

  //need to calculate - Cashflow Score Min : (cashflowMinBase + cashflowMinCoef) * (scenario.C/100)
  cashflowMinBase: 15,                                  //== Cashflow Min Base
  cashflowMinCoef: 40,                                  //== Cashflow Min Coef

  //need to calculate - Defense Socre Min : (defenseMinBase + defenseMinCoef) * (scenario.H/100)
  defenseMinBase: 10,                                   //== Defense Min Base
  defenseMinCoef: 55,                                   //== Defense Min Coef

  //need to calculate - Option-Income Sleeve Max : 
  //(optionIncomeMaxBase + optionIncomeMaxCashflowCoef) * (scenario.C/100) + OptionIncomeMaxStabilityCoef * (scenario.S/100)
  optionIncomeMaxBase: 0.10,                            //== Option Income Max Base
  optionIncomeMaxCashflowCoef: 0.40,                    //== Option Income Max Cashflow Coef
  optionIncomeMaxStabilityCoef: 0.10,                   //== Option Income Max Stability Coef

  //need to calculate  - Devidened/Income Sleeve Max : 
  //(dividendIncomeMaxBase + devidendIncomeMaxCashflowCoef) * (scenario.C/100) + devidendIncomeMaxStabilityCoef*(scenario.S/100)
  dividendIncomeMaxBase: 0.25,                          //==
  dividendIncomeMaxCashflowCoef: 0.35,                  //==
  dividendIncomeMaxStabilityCoef: 0.20                  //==
};

/**
 * 시나리오 가중치를 0~1 범위로 변환
 *
 * 입력 예:
 * {
 *   R: 70,
 *   S: 20,
 *   C: 5,
 *   H: 5
 * }
 */
function normalizeScenarioWeights(scenario) {
  const total =
    Number(scenario.R || 0) + //Scenario.R의 값을 읽어옴. 없으면 0으로 처리.
    Number(scenario.S || 0) +
    Number(scenario.C || 0) +
    Number(scenario.H || 0);

  if (total <= 0) {
    throw new Error("시나리오 R/S/C/H 합계가 0입니다.");
  }

  return {
    wR: Number(scenario.R || 0) / total,
    wS: Number(scenario.S || 0) / total,
    wC: Number(scenario.C || 0) / total,
    wH: Number(scenario.H || 0) / total
  };
}

/**
 * ETF별 종합점수 P_i 계산
 *
 * P_i = wR * R_i + wS * S_i + wC * C_i + wH * H_i
 *
 * scores 예:
 * {
 *   SPY:  { R: 65.8, S: 67.1, C: 11.9, H: 39.6 },
 *   QQQ:  { R: 67.4, S: 40.0, C: 4.9,  H: 28.9 },
 *   ...
 * }
 */
function calculateCompositeScores(scores, scenarioWeights) {
  const { wR, wS, wC, wH } = scenarioWeights;
  const result = {};

  ETF_ORDER.forEach((ticker) => { //ticker : ETF_ORDER 각 항목별 이름을 의미.
    const s = scores[ticker];     //ticker별 항목에서 R,S,C,H에 대한 점수를 가져오기 때문에 배열로 가져옴.

    if (!s) {
      throw new Error(`${ticker} 점수 데이터가 없습니다.`);
    }

    result[ticker] =
      wR * Number(s.R || 0) +
      wS * Number(s.S || 0) +
      wC * Number(s.C || 0) +
      wH * Number(s.H || 0);
  });

  return result;
}

/**
 * LP Solver 모델 생성
 *
 * javascript-lp-solver 형식:
 *
 * model = {
 *   optimize: "objective",
 *   opType: "max",
 *   constraints: {...},
 *   variables: {...}
 * }
 */
function buildLpModel(scores, scenario, params = DEFAULT_PARAMS) {
  const weights = normalizeScenarioWeights(scenario);
  const { wR, wS, wC, wH } = weights;

  const compositeScores = calculateCompositeScores(scores, weights);

  /**
   * 시나리오에 따라 달라지는 제약조건 기준값
   */
  const growthMin =
    params.growthMinBase +
    params.growthMinCoef * wR;

  const highGrowthMin =
    params.highGrowthMinCoef * wR;

  const riskMax =
    params.riskMaxBase -
    params.riskMaxStabilityCoef * wS;

  const cashflowMin =
    params.cashflowMinBase +
    params.cashflowMinCoef * wC;

  const defenseMin =
    params.defenseMinBase +
    params.defenseMinCoef * wH;

  const optionIncomeMax =
    params.optionIncomeMaxBase +
    params.optionIncomeMaxCashflowCoef * wC +
    params.optionIncomeMaxStabilityCoef * wS;

  const dividendIncomeMax =
    params.dividendIncomeMaxBase +
    params.dividendIncomeMaxCashflowCoef * wC +
    params.dividendIncomeMaxStabilityCoef * wS;

  /**
   * LP 제약조건 정의 (우측 계산식 구성)
   *
   * equal: 등식
   * min: 이상
   * max: 이하
   */
  const constraints = {
    totalWeight: { equal: params.totalWeight },

    qldMax: { max: params.maxQldWeight },
    qqqAnchor: { min: 0 },

    growthMin: { min: growthMin },
    highGrowthMin: { min: highGrowthMin },

    riskMax: { max: riskMax },
    cashflowMin: { min: cashflowMin },
    defenseMin: { min: defenseMin },

    optionIncomeMax: { max: optionIncomeMax },
    dividendIncomeMax: { max: dividendIncomeMax }
  };

  /**
   * 개별 ETF 최대비중 제약
   * x_i <= 0.30
   *
   * javascript-lp-solver에서는 개별 상한을 별도 constraint로 만든다.
   */
  ETF_ORDER.forEach((ticker) => {
    constraints[`max_${ticker}`] = { max: params.maxSingleWeight };
  });

  /**
   * 변수 정의 (좌측 계산식 구성)
   *
   * 각 변수는 ETF 비중 x_i를 의미한다.
   * objective: 목적함수 계수 P_i
   * totalWeight: 전체 비중 합계 계수
   * max_TICKER: 개별 ETF 상한 계수
   */
  const variables = {};

  ETF_ORDER.forEach((ticker) => {
    const s = scores[ticker];

    variables[ticker] = { //그래서 이게 좌측 계산 즉, 계수와 변수를 설정하는 부분이라고 보면 된다.
      objective: compositeScores[ticker],

      totalWeight: 1,

      /**
       * 개별 ETF 최대비중 ex) 1 * max_SPY <= 0.3 (위의 개별 ETF 최대비중 제약에 의해 제한됨.)
       */
      [`max_${ticker}`]: 1,

      /**
       * Risk Score = Σ(100 - S_i) x_i
       */
      riskMax: 100 - Number(s.S || 0),

      /**
       * Cashflow Score = Σ C_i x_i
       */
      cashflowMin: Number(s.C || 0),

      /**
       * Defense Score = Σ H_i x_i
       */
      defenseMin: Number(s.H || 0)
    };
  });

  /**
   * QLD <= 15%
   */
  variables.QLD.qldMax = 1; //1*QLD <= 0.15

  /**
   * QQQ >= QLD
   * 즉, QQQ - QLD >= 0
   */
  variables.QQQ.qqqAnchor = 1;
  variables.QLD.qqqAnchor = -1;

  /**
   * Growth Assets = SPY + QQQ + QLD
   */
  variables.SPY.growthMin = 1;
  variables.QQQ.growthMin = 1;
  variables.QLD.growthMin = 1;

  /**
   * High Growth Assets = QQQ + QLD
   */
  variables.QQQ.highGrowthMin = 1;
  variables.QLD.highGrowthMin = 1;

  /**
   * Option-Income Sleeve = JEPI
   */
  variables.JEPI.optionIncomeMax = 1;

  /**
   * Dividend/Income Sleeve = JEPI + SCHD + VNQ
   */
  variables.JEPI.dividendIncomeMax = 1;
  variables.SCHD.dividendIncomeMax = 1;
  variables.VNQ.dividendIncomeMax = 1;

  return {
    optimize: "objective",
    opType: "max",
    constraints,
    variables,
    ints: {}
  };
}

/**
 * 최종 포트폴리오 최적화 실행
 *
 * 반환값:
 * {
 *   feasible: true,
 *   result: 69.97,
 *   weights: {
 *     SPY: 0.30,
 *     QQQ: 0.30,
 *     ...
 *   },
 *   weightsPercent: {...},
 *   compositeScores: {...},
 *   constraintCheck: {...}
 * }
 */
function optimizePortfolio(scores, scenario, params = DEFAULT_PARAMS) {
  if (typeof solver === "undefined") {
    throw new Error(
      "javascript-lp-solver가 로드되지 않았습니다. HTML에 solver 라이브러리를 추가하세요."
    );
  }

  const scenarioWeights = normalizeScenarioWeights(scenario);
  const compositeScores = calculateCompositeScores(scores, scenarioWeights);
  const model = buildLpModel(scores, scenario, params);

  const solution = solver.Solve(model);

  if (!solution.feasible) {
    return {
      feasible: false,
      message: "해당 시나리오와 제약조건에서는 feasible solution이 없습니다.",
      rawSolution: solution
    };
  }

  const weights = {};

  ETF_ORDER.forEach((ticker) => {
    weights[ticker] = Number(solution[ticker] || 0);
  });

  const weightsPercent = {};

  ETF_ORDER.forEach((ticker) => {
    weightsPercent[ticker] = weights[ticker] * 100;
  });

  const constraintCheck = checkPortfolioConstraints(
    weights,
    scores,
    scenario,
    params
  );

  return {
    feasible: true,
    result: Number(solution.result || 0),
    weights,
    weightsPercent,
    compositeScores,
    constraintCheck,
    rawSolution: solution
  };
}

/**
 * 제약조건 충족 여부 검증
 *
 * Solver 결과가 나온 뒤 실제로 모든 조건을 만족하는지 확인한다.
 */
function checkPortfolioConstraints(weights, scores, scenario, params = DEFAULT_PARAMS) {
  const { wR, wS, wC, wH } = normalizeScenarioWeights(scenario);

  const totalWeight = sumValues(weights);

  const growthAssets =
    weights.SPY + weights.QQQ + weights.QLD;

  const highGrowthAssets =
    weights.QQQ + weights.QLD;

  const riskScore = ETF_ORDER.reduce((sum, ticker) => {
    return sum + (100 - Number(scores[ticker].S || 0)) * weights[ticker];
  }, 0);

  const cashflowScore = ETF_ORDER.reduce((sum, ticker) => {
    return sum + Number(scores[ticker].C || 0) * weights[ticker];
  }, 0);

  const defenseScore = ETF_ORDER.reduce((sum, ticker) => {
    return sum + Number(scores[ticker].H || 0) * weights[ticker];
  }, 0);

  const optionIncome = weights.JEPI;

  const dividendIncome =
    weights.JEPI + weights.SCHD + weights.VNQ;

  const growthMin =
    params.growthMinBase + params.growthMinCoef * wR;

  const highGrowthMin =
    params.highGrowthMinCoef * wR;

  const riskMax =
    params.riskMaxBase - params.riskMaxStabilityCoef * wS;

  const cashflowMin =
    params.cashflowMinBase + params.cashflowMinCoef * wC;

  const defenseMin =
    params.defenseMinBase + params.defenseMinCoef * wH;

  const optionIncomeMax =
    params.optionIncomeMaxBase +
    params.optionIncomeMaxCashflowCoef * wC +
    params.optionIncomeMaxStabilityCoef * wS;

  const dividendIncomeMax =
    params.dividendIncomeMaxBase +
    params.dividendIncomeMaxCashflowCoef * wC +
    params.dividendIncomeMaxStabilityCoef * wS;

  const tolerance = 1e-6;

  return {
    totalWeight: {
      value: totalWeight,
      required: 1,
      ok: Math.abs(totalWeight - 1) <= tolerance
    },

    nonNegative: {
      value: Math.min(...Object.values(weights)),
      required: 0,
      ok: Math.min(...Object.values(weights)) >= -tolerance
    },

    maxSingleWeight: {
      value: Math.max(...Object.values(weights)),
      required: params.maxSingleWeight,
      ok: Math.max(...Object.values(weights)) <= params.maxSingleWeight + tolerance
    },

    qldMax: {
      value: weights.QLD,
      required: params.maxQldWeight,
      ok: weights.QLD <= params.maxQldWeight + tolerance
    },

    qqqAnchor: {
      value: weights.QQQ - weights.QLD,
      required: 0,
      ok: weights.QQQ + tolerance >= weights.QLD
    },

    growthMin: {
      value: growthAssets,
      required: growthMin,
      ok: growthAssets + tolerance >= growthMin
    },

    highGrowthMin: {
      value: highGrowthAssets,
      required: highGrowthMin,
      ok: highGrowthAssets + tolerance >= highGrowthMin
    },

    riskMax: {
      value: riskScore,
      required: riskMax,
      ok: riskScore <= riskMax + tolerance
    },

    cashflowMin: {
      value: cashflowScore,
      required: cashflowMin,
      ok: cashflowScore + tolerance >= cashflowMin
    },

    defenseMin: {
      value: defenseScore,
      required: defenseMin,
      ok: defenseScore + tolerance >= defenseMin
    },

    optionIncomeMax: {
      value: optionIncome,
      required: optionIncomeMax,
      ok: optionIncome <= optionIncomeMax + tolerance
    },

    dividendIncomeMax: {
      value: dividendIncome,
      required: dividendIncomeMax,
      ok: dividendIncome <= dividendIncomeMax + tolerance
    }
  };
}

/**
 * 간단한 합계 함수
 */
function sumValues(obj) {
  return Object.values(obj).reduce((sum, value) => sum + Number(value || 0), 0);
}

/**
 * 결과 출력용 포맷 함수
 */
function formatPortfolioResult(result) {
  if (!result.feasible) {
    console.warn(result.message);
    return;
  }

  console.log("Objective Z:", result.result.toFixed(3));

  console.table(
    ETF_ORDER.map((ticker) => ({
      ETF: ticker,
      Weight: `${result.weightsPercent[ticker].toFixed(2)}%`,
      Pi: result.compositeScores[ticker].toFixed(3)
    }))
  );

  console.table(
    Object.entries(result.constraintCheck).map(([name, item]) => ({
      Constraint: name,
      Value: typeof item.value === "number" ? item.value.toFixed(4) : item.value,
      Required:
        typeof item.required === "number"
          ? item.required.toFixed(4)
          : item.required,
      Status: item.ok ? "OK" : "Check"
    }))
  );
}