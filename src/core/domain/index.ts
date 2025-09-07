// Decision: 도메인 모듈 통합 export로 import 경로 단순화
// Architecture: Barrel pattern for clean module boundaries

// 색상 도메인
export type {
  LabColor,
  XYZColor,
  RGBColor,
  DeltaEMethod,
  DeltaEWeights,
  ColorComparison,
} from './color';

export {
  isValidLabColor,
  areColorsEqual,
} from './color';

// 잉크 도메인
export type {
  InkConcentration,
  InkType,
  Ink,
  InkRatio,
} from './ink';

export {
  InkValidation,
  InkBusinessRules,
} from './ink';

// 레시피 도메인
export {
  RecipeStatus,
} from './recipe';

export type {
  RecipeMethod,
  OptimizationMethod,
  RecipeType,
  Recipe,
  RecipeCreationOptions,
  RecipeSortCriteria,
  RecipeFilterOptions,
} from './recipe';

export {
  RecipeBusinessRules,
} from './recipe';

// 설정 도메인
export type {
  CalculationMode,
  CalculationOptions,
  PrinterProfile,
  FeatureFlags,
  VendorProfile,
} from './settings';

export {
  SettingsValidation,
  DEFAULT_SETTINGS,
} from './settings';

// 보정 도메인
export type {
  CorrectionSuggestion,
  CorrectionHistory,
  CorrectionStatus,
  CorrectionParameters,
  CorrectionResult,
} from './correction';

export {
  CorrectionBusinessRules,
  DEFAULT_CORRECTION_PARAMS,
} from './correction';