// Decision: 색상 보정 도메인을 독립적으로 관리하여 보정 알고리즘 캡슐화
// Architecture: Value Objects and Entities for correction workflow

import type { LabColor } from './color';

/**
 * 보정 제안
 */
export interface CorrectionSuggestion {
  id: string;
  inkId: string;
  name: string;
  addAmount: number;  // 추가량 (%)
  expectedImpact: {
    dL: number;       // 명도 변화 예상
    da: number;       // a* 변화 예상
    db: number;       // b* 변화 예상
  };
}

/**
 * 보정 이력
 */
export interface CorrectionHistory {
  id: string;
  timestamp: string;
  targetLab: LabColor;    // 목표 색상
  actualLab: LabColor;    // 실제 측정 색상
  deltaE: number;         // 색차
  corrections: CorrectionSuggestion[];
  status: CorrectionStatus;
}

/**
 * 보정 상태
 */
export type CorrectionStatus = 'pending' | 'applied' | 'success' | 'failed';

/**
 * 보정 파라미터
 */
export interface CorrectionParameters {
  maxIterations: number;      // 최대 반복 횟수
  targetDeltaE: number;       // 목표 Delta E
  learningRate: number;       // 학습률 (0-1)
  confidenceThreshold: number; // 신뢰도 임계값
}

/**
 * 보정 결과
 */
export interface CorrectionResult {
  success: boolean;
  iterations: number;
  finalDeltaE: number;
  finalColor: LabColor;
  appliedCorrections: CorrectionSuggestion[];
  confidence: number;
}

/**
 * 보정 비즈니스 규칙
 */
export class CorrectionBusinessRules {
  /**
   * 보정 필요 여부 판단
   */
  static needsCorrection(deltaE: number, threshold = 2.0): boolean {
    return deltaE > threshold;
  }
  
  /**
   * 보정 가능 여부 확인
   */
  static canApplyCorrection(
    currentIteration: number,
    maxIterations: number,
    confidence: number,
    minConfidence: number
  ): boolean {
    return currentIteration < maxIterations && confidence >= minConfidence;
  }
  
  /**
   * 보정량 제한
   */
  static limitCorrectionAmount(amount: number, maxAmount = 10): number {
    return Math.min(Math.abs(amount), maxAmount) * Math.sign(amount);
  }
  
  /**
   * 보정 우선순위 결정
   */
  static prioritizeCorrections(
    suggestions: CorrectionSuggestion[]
  ): CorrectionSuggestion[] {
    return suggestions.sort((a, b) => {
      // 예상 영향력이 큰 순서로 정렬
      const impactA = Math.abs(a.expectedImpact.dL) + 
                      Math.abs(a.expectedImpact.da) + 
                      Math.abs(a.expectedImpact.db);
      const impactB = Math.abs(b.expectedImpact.dL) + 
                      Math.abs(b.expectedImpact.da) + 
                      Math.abs(b.expectedImpact.db);
      return impactB - impactA;
    });
  }
}

/**
 * 기본 보정 파라미터
 */
export const DEFAULT_CORRECTION_PARAMS: CorrectionParameters = {
  maxIterations: 5,
  targetDeltaE: 1.0,
  learningRate: 0.5,
  confidenceThreshold: 0.7,
};