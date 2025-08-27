/**
 * Color Standards Configuration
 * 색상 측정 및 변환 표준 설정
 */

// 측정 기준 상수
export const COLOR_STANDARDS = {
  // 현재 시스템 기준 (인쇄 표준)
  CURRENT: {
    illuminant: 'D50',
    observer: '2°',
    description: 'Graphic Arts Standard (인쇄 표준)',
    temperature: '5000K',
    usage: '오프셋, 플렉소, 디지털 인쇄'
  },
  
  // 대체 기준들 (참고용)
  ALTERNATIVES: {
    D65_10: {
      illuminant: 'D65',
      observer: '10°',
      description: 'Wide-angle daylight (광각 주광)',
      temperature: '6500K',
      usage: '페인트, 텍스타일'
    },
    D65_2: {
      illuminant: 'D65',
      observer: '2°',
      description: 'Standard daylight (표준 주광)',
      temperature: '6500K',
      usage: '디지털 디스플레이, sRGB'
    }
  }
};

// XYZ 참조 백색점 (Reference White Points)
export const REFERENCE_WHITE = {
  // D50/2° - 인쇄 표준
  D50_2: {
    X: 96.422,
    Y: 100.000,
    Z: 82.521
  },
  // D65/2° - sRGB 표준
  D65_2: {
    X: 95.047,
    Y: 100.000,
    Z: 108.883
  },
  // D65/10° - 광각 관찰
  D65_10: {
    X: 94.811,
    Y: 100.000,
    Z: 107.304
  }
};

// Chromatic Adaptation Matrices (Bradford Transform)
export const BRADFORD_MATRIX = {
  // D65 to D50 변환
  D65_TO_D50: [
    [1.0478112, 0.0228866, -0.0501270],
    [0.0295424, 0.9904844, -0.0170491],
    [-0.0092345, 0.0150436, 0.7521316]
  ],
  // D50 to D65 변환
  D50_TO_D65: [
    [0.9555766, -0.0230393, 0.0631636],
    [-0.0282895, 1.0099416, 0.0210077],
    [0.0122982, -0.0204830, 1.3299098]
  ]
};

/**
 * Lab to XYZ 변환 (D50/2° 기준)
 */
export function labToXYZ_D50(L, a, b) {
  const fy = (L + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  
  const epsilon = 0.008856;
  const kappa = 903.3;
  
  const xr = fx ** 3 > epsilon ? fx ** 3 : (116 * fx - 16) / kappa;
  const yr = L > kappa * epsilon ? fy ** 3 : L / kappa;
  const zr = fz ** 3 > epsilon ? fz ** 3 : (116 * fz - 16) / kappa;
  
  const white = REFERENCE_WHITE.D50_2;
  
  return {
    X: xr * white.X,
    Y: yr * white.Y,
    Z: zr * white.Z
  };
}

/**
 * XYZ to RGB 변환 (sRGB, D65 adapted)
 */
export function xyzToRGB_sRGB(X, Y, Z, fromD50 = true) {
  // D50에서 D65로 색순응 변환
  if (fromD50) {
    const m = BRADFORD_MATRIX.D50_TO_D65;
    const X65 = m[0][0] * X + m[0][1] * Y + m[0][2] * Z;
    const Y65 = m[1][0] * X + m[1][1] * Y + m[1][2] * Z;
    const Z65 = m[2][0] * X + m[2][1] * Y + m[2][2] * Z;
    X = X65;
    Y = Y65;
    Z = Z65;
  }
  
  // XYZ를 0-1 범위로 정규화
  X = X / 100;
  Y = Y / 100;
  Z = Z / 100;
  
  // XYZ to linear RGB (sRGB matrix)
  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
  
  // Gamma correction (sRGB)
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1/2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1/2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1/2.4) - 0.055 : 12.92 * b;
  
  // Clamp and scale to 0-255
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255)))
  };
}

/**
 * Lab to RGB 변환 (D50 Lab → D65 sRGB)
 */
export function labToRGB_D50_to_sRGB(L, a, b) {
  const xyz = labToXYZ_D50(L, a, b);
  return xyzToRGB_sRGB(xyz.X, xyz.Y, xyz.Z, true);
}

/**
 * Delta E 계산 시 illuminant 차이 경고
 */
export function checkIlluminantMismatch(source1, source2) {
  if (source1 !== source2) {
    console.warn(`⚠️ 주의: 다른 측정 기준 비교 중 (${source1} vs ${source2})`);
    console.warn('정확한 색상 비교를 위해 같은 측정 기준을 사용하세요.');
    return true;
  }
  return false;
}

export default {
  COLOR_STANDARDS,
  REFERENCE_WHITE,
  BRADFORD_MATRIX,
  labToXYZ_D50,
  xyzToRGB_sRGB,
  labToRGB_D50_to_sRGB,
  checkIlluminantMismatch
};