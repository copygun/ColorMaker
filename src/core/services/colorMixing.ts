// Decision: 색상 혼합 알고리즘을 순수 함수로 구현하여 예측 가능성 보장
// Architecture: Strategy pattern for different mixing algorithms

import type { LabColor, XYZColor } from '../domain/color';
import type { Ink, InkRatio } from '../domain/ink';

/**
 * Lab to XYZ 변환
 */
export function labToXYZ(lab: LabColor): XYZColor {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  
  const epsilon = 0.008856;
  const kappa = 903.3;
  
  const xr = fx * fx * fx > epsilon ? fx * fx * fx : (116 * fx - 16) / kappa;
  const yr = lab.L > kappa * epsilon ? Math.pow((lab.L + 16) / 116, 3) : lab.L / kappa;
  const zr = fz * fz * fz > epsilon ? fz * fz * fz : (116 * fz - 16) / kappa;
  
  // D65 illuminant
  const Xn = 95.047;
  const Yn = 100.000;
  const Zn = 108.883;
  
  return {
    X: xr * Xn,
    Y: yr * Yn,
    Z: zr * Zn,
  };
}

/**
 * XYZ to Lab 변환
 */
export function xyzToLab(xyz: XYZColor): LabColor {
  // D65 illuminant
  const Xn = 95.047;
  const Yn = 100.000;
  const Zn = 108.883;
  
  const xr = xyz.X / Xn;
  const yr = xyz.Y / Yn;
  const zr = xyz.Z / Zn;
  
  const epsilon = 0.008856;
  const kappa = 903.3;
  
  const fx = xr > epsilon ? Math.cbrt(xr) : (kappa * xr + 16) / 116;
  const fy = yr > epsilon ? Math.cbrt(yr) : (kappa * yr + 16) / 116;
  const fz = zr > epsilon ? Math.cbrt(zr) : (kappa * zr + 16) / 116;
  
  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

/**
 * LAB 색공간에서 선형 혼합
 */
export function mixColorsInLab(
  colors: LabColor[],
  ratios: number[]
): LabColor {
  if (colors.length !== ratios.length) {
    throw new Error('Colors and ratios arrays must have the same length');
  }
  
  const totalRatio = ratios.reduce((sum, r) => sum + r, 0);
  if (Math.abs(totalRatio - 1) > 0.001) {
    throw new Error('Ratios must sum to 1');
  }
  
  let mixedL = 0;
  let mixedA = 0;
  let mixedB = 0;
  
  for (let i = 0; i < colors.length; i++) {
    mixedL += colors[i].L * ratios[i];
    mixedA += colors[i].a * ratios[i];
    mixedB += colors[i].b * ratios[i];
  }
  
  return { L: mixedL, a: mixedA, b: mixedB };
}

/**
 * XYZ 색공간에서 혼합 (더 정확한 물리적 혼합)
 */
export function mixColorsInXYZ(
  colors: LabColor[],
  ratios: number[]
): LabColor {
  if (colors.length !== ratios.length) {
    throw new Error('Colors and ratios arrays must have the same length');
  }
  
  const xyzColors = colors.map(labToXYZ);
  
  let mixedX = 0;
  let mixedY = 0;
  let mixedZ = 0;
  
  for (let i = 0; i < xyzColors.length; i++) {
    mixedX += xyzColors[i].X * ratios[i];
    mixedY += xyzColors[i].Y * ratios[i];
    mixedZ += xyzColors[i].Z * ratios[i];
  }
  
  return xyzToLab({ X: mixedX, Y: mixedY, Z: mixedZ });
}

/**
 * Kubelka-Munk 모델을 사용한 비선형 혼합
 * 더 현실적인 잉크 혼합 시뮬레이션
 */
export function mixColorsKubelkaMunk(
  colors: LabColor[],
  ratios: number[]
): LabColor {
  // K/S 값 계산 (단순화된 모델)
  const calculateKS = (reflectance: number): number => {
    return (1 - reflectance) * (1 - reflectance) / (2 * reflectance);
  };
  
  const reflectanceFromL = (L: number): number => L / 100;
  
  // 각 색상의 K/S 값 계산
  const ksValues = colors.map(color => ({
    L: calculateKS(reflectanceFromL(color.L)),
    a: color.a / 100,
    b: color.b / 100,
  }));
  
  // K/S 값 혼합
  let mixedKS_L = 0;
  let mixedKS_a = 0;
  let mixedKS_b = 0;
  
  for (let i = 0; i < ksValues.length; i++) {
    mixedKS_L += ksValues[i].L * ratios[i];
    mixedKS_a += ksValues[i].a * ratios[i];
    mixedKS_b += ksValues[i].b * ratios[i];
  }
  
  // K/S 값을 다시 반사율로 변환
  const reflectanceFromKS = (ks: number): number => {
    const discriminant = 1 + ks - Math.sqrt(ks * ks + 2 * ks);
    return discriminant;
  };
  
  const mixedL = reflectanceFromKS(mixedKS_L) * 100;
  const mixedA = mixedKS_a * 100;
  const mixedB = mixedKS_b * 100;
  
  return { L: mixedL, a: mixedA, b: mixedB };
}

/**
 * 잉크 농도 보간
 */
export function interpolateConcentration(
  ink: Ink,
  concentration: number
): LabColor {
  const conc = ink.concentrations;
  
  // 정확한 농도가 있는 경우
  if (concentration === 100) return conc[100];
  if (concentration === 70 && conc[70]) return conc[70];
  if (concentration === 40 && conc[40]) return conc[40];
  
  // 선형 보간
  if (concentration >= 70 && concentration < 100) {
    const c100 = conc[100];
    const c70 = conc[70] || conc[100]; // 70%가 없으면 100% 사용
    const t = (concentration - 70) / 30;
    
    return {
      L: c70.L + (c100.L - c70.L) * t,
      a: c70.a + (c100.a - c70.a) * t,
      b: c70.b + (c100.b - c70.b) * t,
    };
  }
  
  if (concentration >= 40 && concentration < 70) {
    const c70 = conc[70] || conc[100];
    const c40 = conc[40] || conc[70] || conc[100];
    const t = (concentration - 40) / 30;
    
    return {
      L: c40.L + (c70.L - c40.L) * t,
      a: c40.a + (c70.a - c40.a) * t,
      b: c40.b + (c70.b - c40.b) * t,
    };
  }
  
  // 40% 미만은 40% 사용
  return conc[40] || conc[70] || conc[100];
}

/**
 * 잉크 혼합 계산
 */
export function calculateInkMixture(
  inks: Ink[],
  inkRatios: InkRatio[],
  mixingMethod: 'lab' | 'xyz' | 'kubelka-munk' = 'lab'
): LabColor {
  const colors: LabColor[] = [];
  const ratios: number[] = [];
  
  for (const inkRatio of inkRatios) {
    const ink = inks.find(i => i.id === inkRatio.inkId);
    if (!ink) {
      throw new Error(`Ink not found: ${inkRatio.inkId}`);
    }
    
    const color = interpolateConcentration(ink, inkRatio.concentration);
    colors.push(color);
    ratios.push(inkRatio.ratio);
  }
  
  switch (mixingMethod) {
    case 'xyz':
      return mixColorsInXYZ(colors, ratios);
    case 'kubelka-munk':
      return mixColorsKubelkaMunk(colors, ratios);
    case 'lab':
    default:
      return mixColorsInLab(colors, ratios);
  }
}