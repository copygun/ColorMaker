/**
 * TypeScript 타입 정의
 */

export interface LabColor {
  L: number;
  a: number;
  b: number;
}

export interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

export interface InkConcentration {
  100: LabColor;
  70?: LabColor;
  40?: LabColor;
}

export interface Ink {
  id: string;
  name: string;
  type: 'process' | 'spot' | 'metallic' | 'custom';
  concentrations: InkConcentration;
}

export interface InkRatio {
  inkId: string;
  ratio: number;
  concentration: number;
  baseInk?: boolean; // ColorCorrectionSection에서 사용
}

export enum RecipeStatus {
  CALCULATED = 'calculated', // 계산 완료 (초기 상태)
  SELECTED = 'selected', // 작업용으로 선택됨
  IN_PROGRESS = 'in_progress', // 조색 진행 중
  MEASURING = 'measuring', // 색상 측정 중
  COMPLETED = 'completed', // 작업 완료
  NEEDS_CORRECTION = 'needs_correction', // 보정 필요
  CORRECTING = 'correcting', // 보정 중
  CORRECTED = 'corrected', // 보정 완료
}

export interface Recipe {
  id?: string; // 고유 ID
  name?: string; // 레시피 이름 (예: "선택된 잉크", "최적화 #1")
  type?: 'selected' | 'optimized'; // 레시피 유형
  status?: RecipeStatus; // 작업 상태
  createdAt?: string; // 생성 시간
  startedAt?: string; // 작업 시작 시간
  completedAt?: string; // 작업 완료 시간
  target: LabColor;
  inks: InkRatio[];
  mixed: LabColor;
  deltaE: number;
  method: 'lab' | 'xyz' | 'optimized';
  optimization: 'simple' | 'pso' | 'all-concentrations';
  isCorrection?: boolean; // 보정된 레시피인지
  correctionDate?: string; // 보정 적용 시간
  originalDeltaE?: number; // 보정 전 Delta E
  targetColor?: LabColor; // App.tsx에서 사용
  mixedColor?: LabColor; // ProfessionalApp.tsx에서 사용
  correctedDeltaE?: number; // ColorCorrectionSection에서 사용
  correctionIteration?: number; // ColorCorrectionSection에서 사용
  recipe?: Recipe; // ProfessionalApp.tsx에서 사용 (중첩)
  totalAmount?: number; // PrintResultTracker에서 사용
  metadata?: any; // RecipeDisplay에서 사용
}

export interface DeltaEWeights {
  kL: number;
  kC: number;
  kH: number;
}

export type DeltaEMethod = 'E00' | 'E94' | 'E76' | 'CMC';

export interface CalculationMode {
  mode: 'legacy' | 'advanced' | 'hybrid';
  features: {
    mixing: 'lab' | 'xyz';
    optimization: 'linear' | 'pso';
    interpolation: 'linear' | 'catmull-rom';
    deltaE: DeltaEMethod;
  };
}

export interface CalculationOptions {
  maxInks: number;
  includeWhite: boolean;
  use100: boolean;
  use70: boolean;
  use40: boolean;
  costWeight: number;
  maxResults: number;
  substrateLab?: LabColor; // useColorCalculation, ProfessionalApp에서 사용
}

export interface PrinterProfile {
  id: string;
  name: string;
  tacLimit: number;
  dotGain: number;
  inkLimit: Record<string, number>;
}

export interface FeatureFlags {
  USE_XYZ_MIXING: boolean;
  USE_PSO_OPTIMIZER: boolean;
  USE_CATMULL_ROM: boolean;
  USE_KUBELKA_MUNK: boolean; // Kubelka-Munk 비선형 혼합
  ENABLE_CERTIFICATE: boolean;
  ENABLE_METALLIC: boolean;
  ENABLE_TAC_CHECK: boolean;
  ENABLE_DOT_GAIN: boolean; // Dot gain 보정
  ENABLE_SUBSTRATE: boolean; // 기질 영향 반영
}

export interface CorrectionSuggestion {
  id: string; // App.tsx에서 필요
  inkId: string;
  name: string;
  addAmount: number;
  expectedImpact: {
    dL: number;
    da: number;
    db: number;
  };
}

export interface CorrectionHistory {
  id: string;
  timestamp: string;
  targetLab: LabColor;
  actualLab: LabColor;
  deltaE: number;
  corrections: CorrectionSuggestion[];
  status: 'pending' | 'applied' | 'success' | 'failed';
}

export interface AppState {
  targetColor: LabColor;
  selectedInks: string[];
  recipe: Recipe | null;
  calculationMode: CalculationMode;
  deltaEWeights: DeltaEWeights;
  deltaEMethod: DeltaEMethod;
  printerProfile: string;
  features: FeatureFlags;
  history: Recipe[];
  correctionMode: boolean;
  correctionHistory: CorrectionHistory[];
}
