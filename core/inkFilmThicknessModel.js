/**
 * Ink Film Thickness Model
 * 실제 인쇄 조건에서 잉크 도막 두께가 색상에 미치는 영향을 시뮬레이션
 */

class InkFilmThicknessModel {
  constructor() {
    // 표준 도막 두께 (마이크로미터)
    this.standardThickness = {
      offset: 1.5,      // 오프셋 인쇄
      flexo: 2.0,       // 플렉소 인쇄
      gravure: 1.8,     // 그라비어 인쇄
      digital: 0.8,     // 디지털 인쇄
      screen: 3.0       // 스크린 인쇄
    };

    // 도막 두께별 광학 특성 계수
    this.opticalCoefficients = {
      absorption: 0.65,    // 흡수 계수
      scattering: 0.35,    // 산란 계수
      transmission: 0.15   // 투과 계수
    };

    // 인쇄 압력별 도막 변화율
    this.pressureFactors = {
      low: 0.85,       // 낮은 압력
      normal: 1.0,     // 표준 압력
      high: 1.15       // 높은 압력
    };

    // 잉크 점도별 도막 형성 특성
    this.viscosityFactors = {
      low: { spread: 1.2, thickness: 0.9 },      // 저점도 (빠른 퍼짐, 얇은 도막)
      medium: { spread: 1.0, thickness: 1.0 },   // 중간 점도
      high: { spread: 0.8, thickness: 1.1 }      // 고점도 (느린 퍼짐, 두꺼운 도막)
    };

    // 원단 흡수율별 도막 변화
    this.substrateAbsorption = {
      coated: 0.05,      // 코팅지 (낮은 흡수)
      uncoated: 0.25,    // 비코팅지 (중간 흡수)
      textile: 0.45,     // 섬유 (높은 흡수)
      plastic: 0.02,     // 플라스틱 (매우 낮은 흡수)
      metal: 0.0         // 금속 (무흡수)
    };
  }

  /**
   * 실제 도막 두께 계산
   * @param {Object} params - 인쇄 조건 파라미터
   * @returns {number} 계산된 도막 두께 (마이크로미터)
   */
  calculateActualThickness(params) {
    const {
      printMethod = 'offset',
      pressure = 'normal',
      viscosity = 'medium',
      substrate = 'coated',
      inkConcentration = 100,
      meshCount = null,  // 스크린 인쇄용
      aniloxVolume = null  // 플렉소 인쇄용
    } = params;

    // 기본 도막 두께
    let thickness = this.standardThickness[printMethod] || 1.5;

    // 압력 보정
    thickness *= this.pressureFactors[pressure];

    // 점도 보정
    thickness *= this.viscosityFactors[viscosity].thickness;

    // 농도 보정 (100% 기준)
    thickness *= (inkConcentration / 100);

    // 원단 흡수 보정
    const absorptionFactor = this.substrateAbsorption[substrate] || 0.1;
    thickness *= (1 - absorptionFactor * 0.3); // 흡수로 인한 도막 감소

    // 인쇄 방식별 특수 보정
    if (printMethod === 'screen' && meshCount) {
      // 메쉬 카운트가 높을수록 얇은 도막
      thickness *= (200 / meshCount);
    } else if (printMethod === 'flexo' && aniloxVolume) {
      // 아닐록스 볼륨에 비례
      thickness *= (aniloxVolume / 10);
    }

    return Math.max(0.1, Math.min(5.0, thickness)); // 0.1-5.0 마이크로미터 범위
  }

  /**
   * 도막 두께에 따른 Lab 값 보정
   * @param {Object} baseLab - 기본 Lab 색상
   * @param {number} thickness - 도막 두께
   * @param {Object} inkProperties - 잉크 특성
   * @returns {Object} 보정된 Lab 값
   */
  adjustLabByThickness(baseLab, thickness, inkProperties = {}) {
    const {
      opacity = 0.8,        // 불투명도 (0-1)
      pigmentLoad = 0.3,    // 피그먼트 함량 (0-1)
      glossLevel = 0.5      // 광택도 (0-1)
    } = inkProperties;

    // Beer-Lambert 법칙 기반 흡광도 계산
    const absorbance = -Math.log10(1 - opacity) * thickness;
    
    // 도막 두께에 따른 명도 변화
    // 두꺼울수록 어두워짐
    const thicknessFactor = Math.exp(-absorbance * 0.3);
    const adjustedL = baseLab.L * thicknessFactor;

    // 채도 변화 (두꺼울수록 채도 증가, 특정 지점 이후 감소)
    const optimalThickness = 1.5; // 최적 도막 두께
    const chromaFactor = 1 + 0.3 * Math.exp(-Math.pow(thickness - optimalThickness, 2) / 2);
    
    const adjustedA = baseLab.a * chromaFactor;
    const adjustedB = baseLab.b * chromaFactor;

    // 피그먼트 함량에 따른 추가 보정
    const pigmentEffect = 1 + (pigmentLoad - 0.3) * 0.2;
    
    // 광택도에 따른 명도 보정 (광택이 높으면 약간 밝아짐)
    const glossEffect = 1 + glossLevel * 0.1;

    return {
      L: Math.max(0, Math.min(100, adjustedL * glossEffect)),
      a: Math.max(-128, Math.min(127, adjustedA * pigmentEffect)),
      b: Math.max(-128, Math.min(127, adjustedB * pigmentEffect))
    };
  }

  /**
   * 다층 도막 상호작용 계산 (오버프린팅)
   * @param {Array} layers - 잉크층 배열 [{lab, thickness, opacity}]
   * @param {Object} substrateLab - 원단 Lab 값
   * @returns {Object} 최종 Lab 값
   */
  calculateMultilayerInteraction(layers, substrateLab) {
    if (!layers || layers.length === 0) {
      return substrateLab;
    }

    // Kubelka-Munk 이론 적용
    let resultLab = { ...substrateLab };
    
    layers.forEach(layer => {
      const { lab, thickness, opacity = 0.8 } = layer;
      
      // 각 층의 기여도 계산
      const transmission = Math.exp(-opacity * thickness);
      
      // 이전 층과의 혼합
      resultLab = {
        L: resultLab.L * transmission + lab.L * (1 - transmission),
        a: resultLab.a * transmission + lab.a * (1 - transmission),
        b: resultLab.b * transmission + lab.b * (1 - transmission)
      };
    });

    return resultLab;
  }

  /**
   * 도막 균일성 분석
   * @param {Object} printParams - 인쇄 파라미터
   * @returns {Object} 균일성 분석 결과
   */
  analyzeThicknessUniformity(printParams) {
    const {
      printMethod,
      speed = 'normal',  // 인쇄 속도
      temperature = 25,   // 온도 (°C)
      humidity = 50       // 습도 (%)
    } = printParams;

    // 속도별 균일성 계수
    const speedFactors = {
      slow: 0.95,    // 느린 속도 - 높은 균일성
      normal: 0.85,  // 표준 속도
      fast: 0.70     // 빠른 속도 - 낮은 균일성
    };

    // 온습도 영향
    const tempDeviation = Math.abs(temperature - 25) / 25;
    const humidityDeviation = Math.abs(humidity - 50) / 50;
    const environmentalFactor = 1 - (tempDeviation + humidityDeviation) * 0.1;

    // 인쇄 방식별 기본 균일성
    const methodUniformity = {
      offset: 0.90,
      flexo: 0.85,
      gravure: 0.92,
      digital: 0.95,
      screen: 0.80
    };

    const baseUniformity = methodUniformity[printMethod] || 0.85;
    const speedEffect = speedFactors[speed] || 0.85;
    
    const finalUniformity = baseUniformity * speedEffect * environmentalFactor;

    // 색상 변동 예측 (Delta E)
    const expectedVariation = (1 - finalUniformity) * 10; // 최대 10 Delta E 변동

    return {
      uniformityScore: finalUniformity,
      expectedDeltaE: expectedVariation,
      recommendations: this.getUniformityRecommendations(finalUniformity),
      factors: {
        method: baseUniformity,
        speed: speedEffect,
        environment: environmentalFactor
      }
    };
  }

  /**
   * 균일성 개선 권장사항
   * @param {number} uniformityScore - 균일성 점수
   * @returns {Array} 권장사항 목록
   */
  getUniformityRecommendations(uniformityScore) {
    const recommendations = [];

    if (uniformityScore < 0.7) {
      recommendations.push({
        priority: 'high',
        action: '인쇄 속도 감소',
        effect: '균일성 10-15% 개선 예상'
      });
      recommendations.push({
        priority: 'high',
        action: '잉크 점도 조정',
        effect: '도막 형성 안정화'
      });
    }

    if (uniformityScore < 0.8) {
      recommendations.push({
        priority: 'medium',
        action: '온습도 관리 강화',
        effect: '환경 변수 최소화'
      });
      recommendations.push({
        priority: 'medium',
        action: '압력 균일화 점검',
        effect: '전체 면적 일관성 향상'
      });
    }

    if (uniformityScore < 0.9) {
      recommendations.push({
        priority: 'low',
        action: '잉크 교반 주기 단축',
        effect: '잉크 균질성 유지'
      });
    }

    return recommendations;
  }

  /**
   * 건조 시간 예측
   * @param {Object} params - 파라미터
   * @returns {Object} 건조 시간 정보
   */
  predictDryingTime(params) {
    const {
      thickness,
      printMethod,
      substrate,
      temperature = 25,
      humidity = 50,
      airFlow = 'normal'
    } = params;

    // 기본 건조 시간 (초)
    const baseDryingTime = {
      offset: 30,
      flexo: 15,
      gravure: 20,
      digital: 5,
      screen: 45
    };

    let dryingTime = baseDryingTime[printMethod] || 30;

    // 도막 두께 영향 (지수적 증가)
    dryingTime *= Math.pow(thickness / 1.5, 1.5);

    // 원단 영향
    const substrateFactors = {
      coated: 0.8,
      uncoated: 1.2,
      textile: 1.5,
      plastic: 0.7,
      metal: 0.6
    };
    dryingTime *= substrateFactors[substrate] || 1.0;

    // 환경 조건
    const tempFactor = Math.exp((25 - temperature) * 0.03);
    const humidityFactor = 1 + (humidity - 50) * 0.01;
    const airFlowFactors = { low: 1.3, normal: 1.0, high: 0.7 };
    
    dryingTime *= tempFactor * humidityFactor * airFlowFactors[airFlow];

    return {
      estimatedTime: Math.round(dryingTime),
      unit: 'seconds',
      confidence: this.calculateConfidence(params),
      stages: {
        touchDry: Math.round(dryingTime * 0.3),
        handleDry: Math.round(dryingTime * 0.7),
        fullyCured: Math.round(dryingTime * 2)
      }
    };
  }

  /**
   * 신뢰도 계산
   * @param {Object} params - 파라미터
   * @returns {number} 신뢰도 (0-1)
   */
  calculateConfidence(params) {
    let confidence = 1.0;

    // 파라미터 완전성 체크
    const requiredParams = ['thickness', 'printMethod', 'substrate'];
    const providedParams = Object.keys(params);
    
    requiredParams.forEach(param => {
      if (!providedParams.includes(param)) {
        confidence *= 0.8;
      }
    });

    // 극단적인 값 체크
    if (params.thickness && (params.thickness < 0.5 || params.thickness > 4)) {
      confidence *= 0.9;
    }

    return Math.max(0.5, confidence);
  }
}

export default InkFilmThicknessModel;