// Decision: Recipe를 중심 집합체(Aggregate Root)로 설계하여 일관성 보장
// Architecture: Aggregate pattern with state management

import type { LabColor } from './color';
import type { InkRatio } from './ink';

/**
 * 레시피 상태 정의
 */
export enum RecipeStatus {
  CALCULATED = 'calculated',           // 계산 완료
  SELECTED = 'selected',               // 작업용으로 선택됨
  IN_PROGRESS = 'in_progress',         // 조색 진행 중
  MEASURING = 'measuring',             // 색상 측정 중
  COMPLETED = 'completed',             // 작업 완료
  NEEDS_CORRECTION = 'needs_correction', // 보정 필요
  CORRECTING = 'correcting',           // 보정 중
  CORRECTED = 'corrected',             // 보정 완료
}

/**
 * 레시피 계산 방법
 */
export type RecipeMethod = 'lab' | 'xyz' | 'optimized';

/**
 * 최적화 알고리즘
 */
export type OptimizationMethod = 'simple' | 'pso' | 'all-concentrations';

/**
 * 레시피 타입
 */
export type RecipeType = 'selected' | 'optimized';

/**
 * 레시피 집합체
 */
export interface Recipe {
  // 식별자
  id: string;
  name: string;
  type: RecipeType;
  
  // 상태
  status: RecipeStatus;
  
  // 시간 정보
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // 색상 정보
  target: LabColor;      // 목표 색상
  mixed: LabColor;       // 혼합 결과
  deltaE: number;        // 색차
  
  // 잉크 구성
  inks: InkRatio[];
  
  // 계산 정보
  method: RecipeMethod;
  optimization: OptimizationMethod;
  
  // 보정 정보
  isCorrection?: boolean;
  correctionDate?: string;
  originalDeltaE?: number;
  correctionIteration?: number;
  
  // 메타데이터
  totalAmount?: number;
  metadata?: RecipeMetadata;
}

/**
 * 레시피 메타데이터
 */
export interface RecipeMetadata {
  totalIterations?: number;
  convergenceRate?: number;
  printMethod?: string;
  substrate?: string;
  notes?: string;
  [key: string]: unknown;
}

/**
 * 레시피 생성 옵션
 */
export interface RecipeCreationOptions {
  name?: string;
  type?: RecipeType;
  method?: RecipeMethod;
  optimization?: OptimizationMethod;
}

/**
 * 레시피 비즈니스 규칙
 */
export class RecipeBusinessRules {
  /**
   * 상태 전환 가능 여부 확인
   */
  static canTransitionTo(current: RecipeStatus, next: RecipeStatus): boolean {
    const transitions: Record<RecipeStatus, RecipeStatus[]> = {
      [RecipeStatus.CALCULATED]: [RecipeStatus.SELECTED],
      [RecipeStatus.SELECTED]: [RecipeStatus.IN_PROGRESS, RecipeStatus.CALCULATED],
      [RecipeStatus.IN_PROGRESS]: [RecipeStatus.MEASURING, RecipeStatus.SELECTED],
      [RecipeStatus.MEASURING]: [RecipeStatus.COMPLETED, RecipeStatus.NEEDS_CORRECTION],
      [RecipeStatus.COMPLETED]: [],
      [RecipeStatus.NEEDS_CORRECTION]: [RecipeStatus.CORRECTING],
      [RecipeStatus.CORRECTING]: [RecipeStatus.CORRECTED, RecipeStatus.NEEDS_CORRECTION],
      [RecipeStatus.CORRECTED]: [RecipeStatus.COMPLETED],
    };
    
    return transitions[current]?.includes(next) ?? false;
  }
  
  /**
   * 레시피 품질 평가
   */
  static evaluateQuality(deltaE: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
    if (deltaE < 1.0) return 'excellent';
    if (deltaE < 2.0) return 'good';
    if (deltaE < 3.5) return 'acceptable';
    return 'poor';
  }
  
  /**
   * 보정 필요 여부 판단
   */
  static needsCorrection(deltaE: number, threshold = 2.0): boolean {
    return deltaE > threshold;
  }
}

/**
 * 레시피 정렬 기준
 */
export type RecipeSortCriteria = 'deltaE' | 'date' | 'name' | 'status';

/**
 * 레시피 필터 옵션
 */
export interface RecipeFilterOptions {
  status?: RecipeStatus[];
  type?: RecipeType[];
  maxDeltaE?: number;
  dateFrom?: string;
  dateTo?: string;
}