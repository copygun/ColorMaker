// Decision: 색상 관련 타입을 독립 도메인으로 분리하여 재사용성과 테스트 용이성 확보
// Architecture: Domain-Driven Design - Value Objects for color representations

/**
 * CIELAB 색상 공간 표현
 * L*: 명도 (0-100)
 * a*: 빨강-초록 축 (-128 to +127)
 * b*: 노랑-파랑 축 (-128 to +127)
 */
export interface LabColor {
  L: number;
  a: number;
  b: number;
}

/**
 * CIE XYZ 색상 공간 표현
 * 장치 독립적 색상 공간
 */
export interface XYZColor {
  X: number;
  Y: number;
  Z: number;
}

/**
 * RGB 색상 공간 표현
 * 디스플레이용 색상 표현 (0-255)
 */
export interface RGBColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Delta E 계산 방법
 */
export type DeltaEMethod = 'E00' | 'E94' | 'E76' | 'CMC';

/**
 * Delta E 계산 가중치
 */
export interface DeltaEWeights {
  kL: number; // 명도 가중치
  kC: number; // 채도 가중치
  kH: number; // 색상 가중치
}

/**
 * 색상 비교 결과
 */
export interface ColorComparison {
  source: LabColor;
  target: LabColor;
  deltaE: number;
  method: DeltaEMethod;
  weights?: DeltaEWeights;
}

/**
 * 색상 유효성 검증
 */
export const isValidLabColor = (color: LabColor | null | undefined): boolean => {
  if (!color) return false;
  return (
    typeof color.L === 'number' && color.L >= 0 && color.L <= 100 &&
    typeof color.a === 'number' && color.a >= -128 && color.a <= 127 &&
    typeof color.b === 'number' && color.b >= -128 && color.b <= 127
  );
};

export const isValidXYZColor = (color: XYZColor | null | undefined): boolean => {
  if (!color) return false;
  return (
    typeof color.X === 'number' && color.X >= 0 &&
    typeof color.Y === 'number' && color.Y >= 0 &&
    typeof color.Z === 'number' && color.Z >= 0
  );
};

export const isValidRGBColor = (color: RGBColor | null | undefined): boolean => {
  if (!color) return false;
  return (
    typeof color.r === 'number' && color.r >= 0 && color.r <= 255 &&
    typeof color.g === 'number' && color.g >= 0 && color.g <= 255 &&
    typeof color.b === 'number' && color.b >= 0 && color.b <= 255
  );
};

/**
 * 색상 동등성 비교
 */
export const areColorsEqual = (c1: LabColor | null | undefined, c2: LabColor | null | undefined, tolerance = 0.01): boolean => {
  if (!c1 || !c2) return false;
  return (
    Math.abs(c1.L - c2.L) < tolerance &&
    Math.abs(c1.a - c2.a) < tolerance &&
    Math.abs(c1.b - c2.b) < tolerance
  );
};

/**
 * Lab 색상 포맷팅
 */
export const formatLabColor = (color: LabColor, precision = 2): string => {
  return `L:${color.L.toFixed(precision)} a:${color.a.toFixed(precision)} b:${color.b.toFixed(precision)}`;
};

/**
 * Lab 색상 파싱
 */
export const parseLabColor = (str: string): LabColor | null => {
  const match = str.match(/L:\s*([\d.-]+)\s*a:\s*([\d.-]+)\s*b:\s*([\d.-]+)/);
  if (!match) return null;
  
  const color: LabColor = {
    L: parseFloat(match[1]),
    a: parseFloat(match[2]),
    b: parseFloat(match[3])
  };
  
  return isValidLabColor(color) ? color : null;
};