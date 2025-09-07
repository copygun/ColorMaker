// Decision: 기존 타입 정의를 새로운 도메인 모듈로 리다이렉트하여 하위 호환성 유지
// Architecture: Facade pattern for backward compatibility during migration

// Re-export from new domain modules
export type {
  // 색상 도메인
  LabColor,
  XYZColor,
  RGBColor,
  DeltaEMethod,
  DeltaEWeights,
  
  // 잉크 도메인
  InkConcentration,
  Ink,
  InkRatio,
  
  // 레시피 도메인
  Recipe,
  
  // 설정 도메인
  CalculationMode,
  CalculationOptions,
  PrinterProfile,
  FeatureFlags,
  VendorProfile,
  
  // 보정 도메인
  CorrectionSuggestion,
  CorrectionHistory,
} from '../core/domain';

export { RecipeStatus } from '../core/domain';

// 하위 호환성을 위한 타입 별칭
export type RecipeMethod = 'lab' | 'xyz' | 'optimized';
export type OptimizationMethod = 'simple' | 'pso' | 'all-concentrations';
export type RecipeType = 'selected' | 'optimized';
export type CorrectionStatus = 'pending' | 'applied' | 'success' | 'failed';

// 임시 import (AppState 정의용)
import type { 
  LabColor as _LabColor, 
  Recipe as _Recipe,
  CalculationMode as _CalculationMode,
  DeltaEWeights as _DeltaEWeights,
  DeltaEMethod as _DeltaEMethod,
  FeatureFlags as _FeatureFlags,
  CorrectionHistory as _CorrectionHistory,
} from '../core/domain';

// 레거시 인터페이스 (점진적 마이그레이션용)
export interface AppState {
  targetColor: _LabColor;
  selectedInks: string[];
  recipe: _Recipe | null;
  calculationMode: _CalculationMode;
  deltaEWeights: _DeltaEWeights;
  deltaEMethod: _DeltaEMethod;
  printerProfile: string;
  features: _FeatureFlags;
  history: _Recipe[];
  correctionMode: boolean;
  correctionHistory: _CorrectionHistory[];
}

// 임시 하위 호환성을 위한 타입 확장
import type { 
  LabColor
} from '../core/domain';

// 기존 코드와의 호환성을 위한 확장 (점진적 제거 예정)
declare module '../core/domain' {
  interface Recipe {
    targetColor?: LabColor;     // App.tsx 호환
    mixedColor?: LabColor;      // ProfessionalApp.tsx 호환
    correctedDeltaE?: number;    // ColorCorrectionSection 호환
    recipe?: Recipe;             // ProfessionalApp.tsx 중첩 호환
    timestamp?: string;          // RecipeHistory 호환
  }
}
