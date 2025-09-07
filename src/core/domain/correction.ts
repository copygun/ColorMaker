// Decision: 색상 보정 도메인을 독립적으로 관리하여 보정 알고리즘 캡슐화
// Architecture: Value Objects and Entities for correction workflow

import type { LabColor } from './color';

/**
 * 보정 제안
 */
export interface CorrectionSuggestion {
  id: string;
  recipeId: string;
  suggestedAt: string;
  reason: string;
  originalDeltaE: number;
  targetDeltaE: number;
  adjustments: Record<string, {
    from: number;
    to: number;
    reason?: string;
  }>;
  confidence: number;
  method: 'machine-learning' | 'manual' | 'algorithmic';
}

/**
 * 보정 이력
 */
export interface CorrectionHistory {
  id: string;
  recipeId: string;
  suggestionId: string;
  appliedAt: string;
  status: 'pending' | 'applied' | 'success' | 'failed';
  beforeDeltaE: number;
  afterDeltaE: number;
  iterations: number;
  notes?: string;
  adjustmentsApplied?: Record<string, {
    from: number;
    to: number;
  }>;
  measuredAt?: string;
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
 * 보정 검증 클래스
 */
export class CorrectionValidation {
  /**
   * 보정 제안 유효성 검증
   */
  static validateSuggestion(suggestion: CorrectionSuggestion): boolean {
    // 신뢰도 검증 (0-1 범위)
    if (suggestion.confidence < 0 || suggestion.confidence > 1) {
      return false;
    }
    
    // 목표 Delta E가 음수가 아니어야 함
    if (suggestion.targetDeltaE < 0) {
      return false;
    }
    
    // 목표 Delta E가 원본보다 작거나 같아야 함 (개선되어야 함)
    if (suggestion.targetDeltaE > suggestion.originalDeltaE) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 보정 이력 유효성 검증
   */
  static validateHistory(history: CorrectionHistory): boolean {
    // 반복 횟수가 음수가 아니어야 함
    if (history.iterations < 0) {
      return false;
    }
    
    // Delta E 값들이 음수가 아니어야 함
    if (history.beforeDeltaE < 0 || history.afterDeltaE < 0) {
      return false;
    }
    
    // 유효한 상태 확인
    const validStatuses = ['pending', 'applied', 'success', 'failed'];
    if (!validStatuses.includes(history.status)) {
      return false;
    }
    
    return true;
  }
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
      // 신뢰도가 높은 순서로 정렬
      return b.confidence - a.confidence;
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