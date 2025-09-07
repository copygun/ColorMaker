// Decision: 잉크 도메인 모델을 독립적으로 관리하여 비즈니스 규칙 캡슐화
// Architecture: Entity pattern for Ink with business invariants

import type { LabColor } from './color';

/**
 * 잉크 농도별 색상 정보
 */
export interface InkConcentration {
  100: LabColor;  // 100% 농도
  70?: LabColor;  // 70% 농도 (선택적)
  40?: LabColor;  // 40% 농도 (선택적)
}

/**
 * 잉크 타입 정의
 */
export type InkType = 'process' | 'spot' | 'metallic' | 'custom';

/**
 * 잉크 엔티티
 */
export interface Ink {
  id: string;
  name: string;
  type: InkType;
  concentrations: InkConcentration;
}

/**
 * 잉크 비율 정보
 */
export interface InkRatio {
  inkId: string;
  ratio: number;        // 비율 (0-1)
  concentration: number; // 농도 (40, 70, 100)
  baseInk?: boolean;    // 기본 잉크 여부
}

/**
 * 잉크 검증 규칙
 */
export class InkValidation {
  /**
   * 잉크 비율 유효성 검증
   */
  static isValidRatio(ratio: InkRatio): boolean {
    return (
      ratio.ratio >= 0 &&
      ratio.ratio <= 1 &&
      [40, 70, 100].includes(ratio.concentration)
    );
  }

  /**
   * 총 비율 검증 (합이 1이 되어야 함)
   */
  static validateTotalRatio(ratios: InkRatio[]): boolean {
    const total = ratios.reduce((sum, r) => sum + r.ratio, 0);
    return Math.abs(total - 1) < 0.001; // 부동소수점 오차 허용
  }

  /**
   * TAC (Total Area Coverage) 제한 검증
   */
  static checkTACLimit(ratios: InkRatio[], tacLimit = 3.0): boolean {
    const totalCoverage = ratios.reduce((sum, r) => sum + r.ratio, 0);
    return totalCoverage <= tacLimit;
  }
}

/**
 * 잉크 관련 비즈니스 규칙
 */
export const InkBusinessRules = {
  MIN_INK_RATIO: 0.01,      // 최소 잉크 비율 1%
  MAX_INK_COUNT: 8,          // 최대 잉크 개수
  DEFAULT_TAC_LIMIT: 3.0,    // 기본 TAC 제한
  MIN_CONCENTRATION: 40,     // 최소 농도
  MAX_CONCENTRATION: 100,    // 최대 농도
} as const;