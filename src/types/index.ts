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
}

export interface Recipe {
  target: LabColor;
  inks: InkRatio[];
  mixed: LabColor;
  deltaE: number;
  method: 'lab' | 'xyz';
  optimization: 'simple' | 'pso';
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
  USE_KUBELKA_MUNK: boolean;  // Kubelka-Munk 비선형 혼합
  ENABLE_CERTIFICATE: boolean;
  ENABLE_METALLIC: boolean;
  ENABLE_TAC_CHECK: boolean;
  ENABLE_DOT_GAIN: boolean;    // Dot gain 보정
  ENABLE_SUBSTRATE: boolean;   // 기질 영향 반영
}

export interface CorrectionSuggestion {
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