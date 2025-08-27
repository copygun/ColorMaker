/**
 * Color Correction Engine
 * 실제 인쇄 결과와 목표 색상 간의 차이를 분석하고 보정
 */

class CorrectionEngine {
  constructor(options = {}) {
    this.maxIterations = options.maxIterations || 10;
    this.targetDeltaE = options.targetDeltaE || 1.0;
    this.correctionHistory = [];
    
    // ColorScience 직접 참조 (이미 전역으로 로드됨)
    this.ColorScience = typeof ColorScience !== 'undefined' ? ColorScience : null;
  }

  /**
   * 색상 보정 분석
   * @param {Object} targetLab - 목표 Lab 색상
   * @param {Object} actualLab - 실제 인쇄된 Lab 색상
   * @param {Array} currentRecipe - 현재 레시피 [{inkId, ratio, concentration}]
   * @param {Array} availableInks - 사용 가능한 잉크 목록
   */
  analyzeCorrection(targetLab, actualLab, currentRecipe, availableInks) {
    // Delta E 계산 - 간단한 내장 구현 사용
    const deltaE = this.calculateDeltaE00(
      targetLab.L, targetLab.a, targetLab.b,
      actualLab.L, actualLab.a, actualLab.b
    );

    // 색상 차이 분석
    const colorDifference = {
      dL: targetLab.L - actualLab.L,  // 명도 차이
      da: targetLab.a - actualLab.a,  // 적녹 차이
      db: targetLab.b - actualLab.b,  // 황청 차이
      deltaE: deltaE
    };

    // 보정 방향 결정
    const correctionDirection = this.determineCorrectionDirection(colorDifference);
    
    // 보정 가능성 평가
    const feasibility = this.evaluateFeasibility(
      colorDifference, 
      currentRecipe, 
      availableInks
    );

    return {
      colorDifference,
      correctionDirection,
      feasibility,
      deltaE
    };
  }  /**
   * 보정 방향 결정
   */
  determineCorrectionDirection(colorDiff) {
    const direction = {
      needsBrighter: colorDiff.dL > 0.5,
      needsDarker: colorDiff.dL < -0.5,
      needsMoreRed: colorDiff.da > 0.5,
      needsMoreGreen: colorDiff.da < -0.5,
      needsMoreYellow: colorDiff.db > 0.5,
      needsMoreBlue: colorDiff.db < -0.5,
      magnitude: Math.sqrt(colorDiff.dL**2 + colorDiff.da**2 + colorDiff.db**2)
    };

    // 주요 보정 방향 결정
    const corrections = [];
    if (direction.needsBrighter) corrections.push({ type: 'brightness', value: 'increase', amount: colorDiff.dL });
    if (direction.needsDarker) corrections.push({ type: 'brightness', value: 'decrease', amount: Math.abs(colorDiff.dL) });
    if (direction.needsMoreRed) corrections.push({ type: 'red', value: 'increase', amount: colorDiff.da });
    if (direction.needsMoreGreen) corrections.push({ type: 'green', value: 'increase', amount: Math.abs(colorDiff.da) });
    if (direction.needsMoreYellow) corrections.push({ type: 'yellow', value: 'increase', amount: colorDiff.db });
    if (direction.needsMoreBlue) corrections.push({ type: 'blue', value: 'increase', amount: Math.abs(colorDiff.db) });

    return {
      ...direction,
      corrections: corrections.sort((a, b) => b.amount - a.amount)
    };
  }  /**
   * 보정 가능성 평가
   */
  evaluateFeasibility(colorDiff, currentRecipe, availableInks) {
    // 색차가 너무 큰 경우
    if (colorDiff.deltaE > 10) {
      return {
        isPossible: false,
        reason: 'COLOR_DIFFERENCE_TOO_LARGE',
        recommendation: 'REMAKE_RECIPE',
        confidence: 0.1
      };
    }

    // 현재 레시피의 총 잉크량 계산
    const totalInkAmount = currentRecipe.reduce((sum, ink) => sum + ink.ratio, 0);
    
    // 추가 가능한 잉크량 계산 (TAC 고려)
    const availableCapacity = 400 - totalInkAmount; // 일반적인 TAC 400%
    
    if (availableCapacity < 10) {
      return {
        isPossible: false,
        reason: 'TAC_LIMIT_REACHED',
        recommendation: 'REMAKE_RECIPE',
        confidence: 0.2
      };
    }

    // 보정 가능한 잉크 확인
    const correctionInks = this.identifyCorrectionInks(colorDiff, availableInks);
    
    if (correctionInks.length === 0) {
      return {
        isPossible: false,
        reason: 'NO_SUITABLE_INKS',
        recommendation: 'ADD_SPECIAL_INKS',
        suggestedInks: this.suggestSpecialInks(colorDiff),
        confidence: 0.3
      };
    }

    return {
      isPossible: true,
      reason: 'CORRECTION_POSSIBLE',
      correctionInks,
      availableCapacity,
      confidence: Math.min(1.0, 1.0 - (colorDiff.deltaE / 10))
    };
  }  /**
   * 보정에 적합한 잉크 식별
   */
  identifyCorrectionInks(colorDiff, availableInks) {
    const correctionInks = [];
    
    availableInks.forEach(ink => {
      // 잉크에 농도 정보가 없으면 건너뛰기
      if (!ink.concentrations || !ink.concentrations[100]) {
        return;
      }
      
      let suitability = 0;
      
      // 각 잉크의 Lab 값과 보정 방향 비교
      const inkLab = ink.concentrations[100];
      
      // Lab 값이 유효한지 확인
      if (!inkLab || typeof inkLab.L === 'undefined' || 
          typeof inkLab.a === 'undefined' || typeof inkLab.b === 'undefined') {
        return;
      }
      
      // 명도 보정
      if (colorDiff.dL > 0 && inkLab.L > 50) {
        suitability += Math.abs(colorDiff.dL) * 0.3;
      } else if (colorDiff.dL < 0 && inkLab.L < 50) {
        suitability += Math.abs(colorDiff.dL) * 0.3;
      }
      
      // a* 보정 (적녹)
      if (colorDiff.da > 0 && inkLab.a > 0) {
        suitability += Math.abs(colorDiff.da) * 0.35;
      } else if (colorDiff.da < 0 && inkLab.a < 0) {
        suitability += Math.abs(colorDiff.da) * 0.35;
      }
      
      // b* 보정 (황청)
      if (colorDiff.db > 0 && inkLab.b > 0) {
        suitability += Math.abs(colorDiff.db) * 0.35;
      } else if (colorDiff.db < 0 && inkLab.b < 0) {
        suitability += Math.abs(colorDiff.db) * 0.35;
      }
      
      if (suitability > 0.5) {
        correctionInks.push({
          inkId: ink.id,
          name: ink.name,
          suitability,
          labValues: inkLab
        });
      }
    });
    
    return correctionInks.sort((a, b) => b.suitability - a.suitability);
  }  /**
   * 특수 잉크 추천 (구체적인 잉크명과 사용법 포함)
   */
  suggestSpecialInks(colorDiff) {
    const suggestions = [];
    
    // 명도 조정용
    if (Math.abs(colorDiff.dL) > 2) {
      if (colorDiff.dL > 0) {
        suggestions.push({ 
          type: 'TRANSPARENT_WHITE',
          name: 'Transparent White (투명백)',
          pantone: 'PANTONE Trans. White',
          reason: '명도를 높이면서 채도 유지',
          usage: '전체 잉크량의 5-15% 추가',
          effect: 'L값 +3~5 증가 예상'
        });
        suggestions.push({
          type: 'EXTENDER',
          name: 'Extender Base',
          pantone: 'PANTONE Extender',
          reason: '투명도 증가 및 명도 상승',
          usage: '전체 잉크량의 10-20% 추가',
          effect: 'L값 +2~4 증가, 채도 약간 감소'
        });
      } else {
        suggestions.push({ 
          type: 'CONCENTRATED_BLACK',
          name: 'Dense Black (농축 블랙)',
          pantone: 'PANTONE Black 6 C',
          reason: '명도 감소 및 깊이 증가',
          usage: '전체 잉크량의 2-5% 추가',
          effect: 'L값 -3~5 감소 예상'
        });
      }
    }
    
    // 녹색 조정 (a*가 음수 방향)
    if (colorDiff.da < -1) {
      suggestions.push({
        type: 'GREEN_SHADE',
        name: 'Green Shade Blue',
        pantone: 'PANTONE 3145 C 또는 Green C',
        reason: '녹색 방향으로 색상 이동 필요',
        usage: '전체 잉크량의 3-8% 추가',
        effect: 'a값 -2~4 이동 예상',
        labTarget: { L: 45, a: -35, b: -5 }
      });
      suggestions.push({
        type: 'COOL_GREEN',
        name: 'Emerald Green',
        pantone: 'PANTONE 3415 C',
        reason: '차가운 녹색 톤 보강',
        usage: '전체 잉크량의 2-6% 추가',
        effect: 'a값 -1~3 이동',
        labTarget: { L: 50, a: -30, b: 5 }
      });
    }
    
    // 적색 조정 (a*가 양수 방향)
    if (colorDiff.da > 1) {
      suggestions.push({
        type: 'WARM_RED',
        name: 'Warm Red',
        pantone: 'PANTONE Warm Red C',
        reason: '적색 방향으로 색상 이동 필요',
        usage: '전체 잉크량의 3-8% 추가',
        effect: 'a값 +2~4 이동 예상',
        labTarget: { L: 50, a: 45, b: 35 }
      });
      suggestions.push({
        type: 'RUBINE_RED',
        name: 'Rubine Red',
        pantone: 'PANTONE Rubine Red C',
        reason: '마젠타 계열 적색 보강',
        usage: '전체 잉크량의 2-6% 추가',
        effect: 'a값 +1~3 이동',
        labTarget: { L: 48, a: 50, b: 5 }
      });
    }
    
    // 황색 조정 (b*가 양수 방향)
    if (colorDiff.db > 1) {
      suggestions.push({
        type: 'WARM_YELLOW',
        name: 'Yellow 012',
        pantone: 'PANTONE Yellow 012 C',
        reason: '황색 방향으로 색상 이동 필요',
        usage: '전체 잉크량의 3-8% 추가',
        effect: 'b값 +3~5 이동 예상',
        labTarget: { L: 88, a: -5, b: 85 }
      });
    }
    
    // 청색 조정 (b*가 음수 방향)
    if (colorDiff.db < -1) {
      suggestions.push({
        type: 'REFLEX_BLUE',
        name: 'Reflex Blue',
        pantone: 'PANTONE Reflex Blue C',
        reason: '청색 방향으로 색상 이동 필요',
        usage: '전체 잉크량의 2-5% 추가',
        effect: 'b값 -3~5 이동 예상',
        labTarget: { L: 30, a: 20, b: -60 }
      });
      suggestions.push({
        type: 'PROCESS_BLUE',
        name: 'Process Blue',
        pantone: 'PANTONE Process Blue C',
        reason: '선명한 청색 보강',
        usage: '전체 잉크량의 3-7% 추가',
        effect: 'b값 -2~4 이동',
        labTarget: { L: 55, a: -25, b: -50 }
      });
    }
    
    // 채도 조정용
    const chromaDiff = Math.sqrt(colorDiff.da**2 + colorDiff.db**2);
    if (chromaDiff > 5) {
      suggestions.push({
        type: 'HIGH_CHROMA',
        name: 'High Chroma Base',
        reason: '채도 증가를 위한 고채도 베이스',
        usage: '기존 잉크의 일부를 고채도 버전으로 교체',
        effect: '채도 20-30% 증가 예상',
        recommendation: '형광 잉크 또는 고농도 피그먼트 잉크 사용'
      });
    }
    
    // 미세 조정용 (색차가 작을 때)
    if (Math.abs(colorDiff.da) < 1 && Math.abs(colorDiff.db) < 1 && Math.abs(colorDiff.dL) < 2) {
      suggestions.push({
        type: 'FINE_TUNING',
        name: 'Toning Colors',
        reason: '미세 색상 조정',
        usage: '전체 잉크량의 1-3% 소량 추가',
        effect: '정밀한 색상 매칭',
        recommendation: 'PANTONE 기본색 중 가장 가까운 색상을 1-2% 추가'
      });
    }
    
    return suggestions;
  }  /**
   * 보정 레시피 계산
   */
  calculateCorrectionRecipe(targetLab, actualLab, currentRecipe, correctionInks) {
    const corrections = [];
    const colorDiff = {
      dL: targetLab.L - actualLab.L,
      da: targetLab.a - actualLab.a,
      db: targetLab.b - actualLab.b
    };
    
    // 각 보정 잉크에 대해 필요한 양 계산
    correctionInks.forEach(ink => {
      const inkLab = ink.labValues;
      
      // 간단한 선형 근사를 사용한 필요량 계산
      let requiredAmount = 0;
      
      // 각 차원에서의 기여도 계산
      const contributions = {
        L: inkLab.L - actualLab.L,
        a: inkLab.a - actualLab.a,
        b: inkLab.b - actualLab.b
      };
      
      // 가중 평균으로 필요량 결정
      if (contributions.L !== 0 && Math.sign(contributions.L) === Math.sign(colorDiff.dL)) {
        requiredAmount += (colorDiff.dL / contributions.L) * 0.3;
      }
      if (contributions.a !== 0 && Math.sign(contributions.a) === Math.sign(colorDiff.da)) {
        requiredAmount += (colorDiff.da / contributions.a) * 0.35;
      }
      if (contributions.b !== 0 && Math.sign(contributions.b) === Math.sign(colorDiff.db)) {
        requiredAmount += (colorDiff.db / contributions.b) * 0.35;
      }
      
      // 실용적인 범위로 제한 (1-20%)
      requiredAmount = Math.max(1, Math.min(20, Math.abs(requiredAmount) * 100));
      
      if (requiredAmount > 0) {
        corrections.push({
          inkId: ink.inkId,
          name: ink.name,
          addAmount: requiredAmount,
          expectedImpact: {
            dL: contributions.L * requiredAmount / 100,
            da: contributions.a * requiredAmount / 100,
            db: contributions.b * requiredAmount / 100
          }
        });
      }
    });
    
    return corrections.slice(0, 3); // 최대 3개 잉크만 추천
  }  /**
   * Delta E 2000 계산 (내장 구현)
   */
  calculateDeltaE00(L1, a1, b1, L2, a2, b2) {
    // 간단한 Delta E 2000 구현
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cb = (C1 + C2) / 2;
    
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
    const ap1 = a1 * (1 + G);
    const ap2 = a2 * (1 + G);
    
    const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1);
    const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2);
    
    const dLp = L2 - L1;
    const dCp = Cp2 - Cp1;
    
    let hp1 = Math.atan2(b1, ap1) * 180 / Math.PI;
    if (hp1 < 0) hp1 += 360;
    let hp2 = Math.atan2(b2, ap2) * 180 / Math.PI;
    if (hp2 < 0) hp2 += 360;
    
    let dhp = hp2 - hp1;
    if (Math.abs(dhp) > 180) {
      if (dhp > 180) dhp -= 360;
      else dhp += 360;
    }
    
    const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * Math.PI / 180) / 2);
    
    // 간단한 가중치 적용
    const kL = 1, kC = 1, kH = 1;
    const SL = 1, SC = 1 + 0.045 * (Cp1 + Cp2) / 2;
    const SH = 1 + 0.015 * (Cp1 + Cp2) / 2;
    
    const deltaE = Math.sqrt(
      Math.pow(dLp / (kL * SL), 2) +
      Math.pow(dCp / (kC * SC), 2) +
      Math.pow(dHp / (kH * SH), 2)
    );
    
    return deltaE;
  }

  /**
   * 보정 이력 추가
   */
  addCorrectionHistory(entry) {
    this.correctionHistory.push({
      timestamp: new Date().toISOString(),
      ...entry
    });
    
    // 최대 50개까지만 보관
    if (this.correctionHistory.length > 50) {
      this.correctionHistory.shift();
    }
  }
  
  /**
   * 보정 이력 조회
   */
  getCorrectionHistory() {
    return this.correctionHistory;
  }
  
  /**
   * 보정 성공률 계산
   */
  calculateSuccessRate() {
    if (this.correctionHistory.length === 0) return 0;
    
    const successful = this.correctionHistory.filter(h => h.deltaE < this.targetDeltaE).length;
    return (successful / this.correctionHistory.length) * 100;
  }

  /**
   * 보정 적용 시 예측 색상 계산
   */
  predictCorrectedColor(currentLab, corrections) {
    // 현재 색상에서 시작
    let predictedLab = { ...currentLab };
    
    // 각 보정값 적용
    corrections.forEach(correction => {
      if (correction.expectedImpact) {
        predictedLab.L += correction.expectedImpact.dL || 0;
        predictedLab.a += correction.expectedImpact.da || 0;
        predictedLab.b += correction.expectedImpact.db || 0;
      }
    });
    
    // Lab 값 범위 제한
    predictedLab.L = Math.max(0, Math.min(100, predictedLab.L));
    predictedLab.a = Math.max(-128, Math.min(127, predictedLab.a));
    predictedLab.b = Math.max(-128, Math.min(127, predictedLab.b));
    
    return predictedLab;
  }

  /**
   * Delta E 계산 (외부 인터페이스용)
   */
  calculateDeltaE(lab1, lab2) {
    return this.calculateDeltaE00(
      lab1.L, lab1.a, lab1.b,
      lab2.L, lab2.a, lab2.b
    );
  }
}

export default CorrectionEngine;