// Decision: 설정 도메인을 분리하여 응용 프로그램 구성 관리 단순화
// Architecture: Configuration objects with validation

import type { LabColor } from './color';
import type { DeltaEMethod, DeltaEWeights } from './color';

/**
 * 계산 모드 설정
 */
export interface CalculationMode {
  mode: 'legacy' | 'advanced' | 'hybrid';
  features: {
    mixing: 'lab' | 'xyz';
    optimization: 'linear' | 'pso';
    interpolation: 'linear' | 'catmull-rom';
    deltaE: DeltaEMethod;
  };
}

/**
 * 계산 옵션
 */
export interface CalculationOptions {
  maxInks: number;           // 최대 잉크 개수
  includeWhite: boolean;     // 백색 잉크 포함 여부
  use100: boolean;           // 100% 농도 사용
  use70: boolean;            // 70% 농도 사용
  use40: boolean;            // 40% 농도 사용
  costWeight: number;        // 비용 가중치 (0-1)
  maxResults: number;        // 최대 결과 개수
  substrateLab?: LabColor;   // 기질 색상
}

/**
 * 프린터 프로파일
 */
export interface PrinterProfile {
  id: string;
  name: string;
  tacLimit: number;                    // Total Area Coverage 제한
  dotGain: number;                     // 도트 게인 (%)
  inkLimit: Record<string, number>;    // 잉크별 제한
}

/**
 * 기능 플래그
 */
export interface FeatureFlags {
  USE_XYZ_MIXING: boolean;        // XYZ 색공간 혼합
  USE_PSO_OPTIMIZER: boolean;     // PSO 최적화 사용
  USE_CATMULL_ROM: boolean;       // Catmull-Rom 보간
  USE_KUBELKA_MUNK: boolean;      // Kubelka-Munk 모델
  ENABLE_CERTIFICATE: boolean;    // 인증서 기능
  ENABLE_METALLIC: boolean;       // 메탈릭 잉크
  ENABLE_TAC_CHECK: boolean;      // TAC 검사
  ENABLE_DOT_GAIN: boolean;       // 도트 게인 보정
  ENABLE_SUBSTRATE: boolean;      // 기질 영향 반영
}

/**
 * 벤더 프로파일
 */
export interface VendorProfile {
  id: string;
  name: string;
  company: string;
  inkSystem: string;
  colorSpace: 'LAB' | 'XYZ';
  calibrationData?: {
    whitePoint: LabColor;
    blackPoint: LabColor;
    primaryColors: Record<string, LabColor>;
  };
}

/**
 * 설정 검증
 */
export class SettingsValidation {
  /**
   * 계산 옵션 유효성 검증
   */
  static validateCalculationOptions(options: CalculationOptions): boolean {
    return (
      options.maxInks > 0 && options.maxInks <= 8 &&
      options.costWeight >= 0 && options.costWeight <= 1 &&
      options.maxResults > 0 && options.maxResults <= 100 &&
      (options.use100 || options.use70 || options.use40) // 최소 하나의 농도 선택
    );
  }
  
  /**
   * 프린터 프로파일 유효성 검증
   */
  static validatePrinterProfile(profile: PrinterProfile): boolean {
    return (
      profile.tacLimit > 0 && profile.tacLimit <= 400 &&
      profile.dotGain >= 0 && profile.dotGain <= 50
    );
  }
}

/**
 * 기본 설정 값
 */
export const DEFAULT_SETTINGS = {
  calculationOptions: {
    maxInks: 4,
    includeWhite: false,
    use100: true,
    use70: true,
    use40: false,
    costWeight: 0.3,
    maxResults: 10,
  },
  deltaEWeights: {
    kL: 1.0,
    kC: 1.0,
    kH: 1.0,
  } as DeltaEWeights,
  printerProfile: {
    id: 'default',
    name: 'Standard Offset',
    tacLimit: 300,
    dotGain: 15,
    inkLimit: {},
  },
} as const;