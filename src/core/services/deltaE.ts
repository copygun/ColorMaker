// Decision: Delta E 계산 로직을 순수 함수로 분리하여 테스트 용이성 확보
// Architecture: Pure functions for color difference calculations

import type { LabColor, DeltaEMethod, DeltaEWeights } from '../domain/color';

/**
 * CIE76 Delta E 계산 (가장 단순한 유클리드 거리)
 */
export function calculateDeltaE76(lab1: LabColor, lab2: LabColor): number {
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * CIE94 Delta E 계산 (산업 표준)
 */
export function calculateDeltaE94(
  lab1: LabColor,
  lab2: LabColor,
  weights: DeltaEWeights = { kL: 1, kC: 1, kH: 1 }
): number {
  const { kL, kC, kH } = weights;
  const K1 = 0.045;
  const K2 = 0.015;
  
  const dL = lab1.L - lab2.L;
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const dC = C1 - C2;
  
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  const dH = Math.sqrt(da * da + db * db - dC * dC);
  
  const SL = 1;
  const SC = 1 + K1 * C1;
  const SH = 1 + K2 * C1;
  
  const dLKlSl = dL / (kL * SL);
  const dCKcSc = dC / (kC * SC);
  const dHKhSh = dH / (kH * SH);
  
  return Math.sqrt(dLKlSl * dLKlSl + dCKcSc * dCKcSc + dHKhSh * dHKhSh);
}

/**
 * CIE2000 Delta E 계산 (가장 정확한 색차 계산)
 */
export function calculateDeltaE00(
  lab1: LabColor,
  lab2: LabColor,
  weights: DeltaEWeights = { kL: 1, kC: 1, kH: 1 }
): number {
  const { kL, kC, kH } = weights;
  
  // Convert to L*C*h color space
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const Cmean = (C1 + C2) / 2;
  
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cmean, 7) / (Math.pow(Cmean, 7) + Math.pow(25, 7))));
  
  const a1Prime = (1 + G) * lab1.a;
  const a2Prime = (1 + G) * lab2.a;
  
  const C1Prime = Math.sqrt(a1Prime * a1Prime + lab1.b * lab1.b);
  const C2Prime = Math.sqrt(a2Prime * a2Prime + lab2.b * lab2.b);
  
  const h1Prime = Math.atan2(lab1.b, a1Prime) * 180 / Math.PI;
  const h2Prime = Math.atan2(lab2.b, a2Prime) * 180 / Math.PI;
  
  const dLPrime = lab2.L - lab1.L;
  const dCPrime = C2Prime - C1Prime;
  
  let dhPrime = h2Prime - h1Prime;
  if (Math.abs(dhPrime) > 180) {
    dhPrime = dhPrime > 180 ? dhPrime - 360 : dhPrime + 360;
  }
  
  const dHPrime = 2 * Math.sqrt(C1Prime * C2Prime) * Math.sin(dhPrime * Math.PI / 360);
  
  const LmeanPrime = (lab1.L + lab2.L) / 2;
  const CmeanPrime = (C1Prime + C2Prime) / 2;
  
  let HmeanPrime = (h1Prime + h2Prime) / 2;
  if (Math.abs(h1Prime - h2Prime) > 180) {
    HmeanPrime = HmeanPrime < 360 ? HmeanPrime + 180 : HmeanPrime - 180;
  }
  
  const T = 1 - 0.17 * Math.cos((HmeanPrime - 30) * Math.PI / 180) +
            0.24 * Math.cos(2 * HmeanPrime * Math.PI / 180) +
            0.32 * Math.cos((3 * HmeanPrime + 6) * Math.PI / 180) -
            0.20 * Math.cos((4 * HmeanPrime - 63) * Math.PI / 180);
  
  const dTheta = 30 * Math.exp(-Math.pow((HmeanPrime - 275) / 25, 2));
  const RC = 2 * Math.sqrt(Math.pow(CmeanPrime, 7) / (Math.pow(CmeanPrime, 7) + Math.pow(25, 7)));
  
  const SL = 1 + (0.015 * Math.pow(LmeanPrime - 50, 2)) / Math.sqrt(20 + Math.pow(LmeanPrime - 50, 2));
  const SC = 1 + 0.045 * CmeanPrime;
  const SH = 1 + 0.015 * CmeanPrime * T;
  const RT = -Math.sin(2 * dTheta * Math.PI / 180) * RC;
  
  const dLKlSl = dLPrime / (kL * SL);
  const dCKcSc = dCPrime / (kC * SC);
  const dHKhSh = dHPrime / (kH * SH);
  
  return Math.sqrt(dLKlSl * dLKlSl + dCKcSc * dCKcSc + dHKhSh * dHKhSh + RT * dCKcSc * dHKhSh);
}

/**
 * CMC l:c Delta E 계산 (텍스타일 산업 표준)
 */
export function calculateDeltaECMC(
  lab1: LabColor,
  lab2: LabColor,
  l = 2,
  c = 1
): number {
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const dC = C1 - C2;
  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  const dH = Math.sqrt(da * da + db * db - dC * dC);
  
  const H1 = Math.atan2(lab1.b, lab1.a) * 180 / Math.PI;
  
  const T = H1 >= 164 && H1 <= 345 
    ? 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * Math.PI / 180))
    : 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * Math.PI / 180));
  
  const F = Math.sqrt(Math.pow(C1, 4) / (Math.pow(C1, 4) + 1900));
  
  const SL = lab1.L < 16 ? 0.511 : (0.040975 * lab1.L) / (1 + 0.01765 * lab1.L);
  const SC = (0.0638 * C1) / (1 + 0.0131 * C1) + 0.638;
  const SH = SC * (F * T + 1 - F);
  
  return Math.sqrt(Math.pow(dL / (l * SL), 2) + Math.pow(dC / (c * SC), 2) + Math.pow(dH / SH, 2));
}

/**
 * 통합 Delta E 계산 함수
 */
export function calculateDeltaE(
  lab1: LabColor,
  lab2: LabColor,
  method: DeltaEMethod = 'E00',
  weights?: DeltaEWeights
): number {
  switch (method) {
    case 'E76':
      return calculateDeltaE76(lab1, lab2);
    case 'E94':
      return calculateDeltaE94(lab1, lab2, weights);
    case 'E00':
      return calculateDeltaE00(lab1, lab2, weights);
    case 'CMC':
      return calculateDeltaECMC(lab1, lab2, weights?.kL, weights?.kC);
    default:
      return calculateDeltaE00(lab1, lab2, weights);
  }
}

/**
 * Delta E 해석
 */
export function interpretDeltaE(deltaE: number): string {
  if (deltaE < 1.0) return '구별 불가능';
  if (deltaE < 2.0) return '매우 유사';
  if (deltaE < 3.5) return '유사';
  if (deltaE < 5.0) return '차이 있음';
  if (deltaE < 10.0) return '명확한 차이';
  return '매우 다름';
}