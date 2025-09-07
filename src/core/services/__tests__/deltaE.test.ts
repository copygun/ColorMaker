import { describe, it, expect } from 'vitest';
import {
  calculateDeltaE76,
  calculateDeltaE94,
  calculateDeltaE00,
  calculateDeltaECMC,
  calculateDeltaE,
  interpretDeltaE,
} from '../deltaE';
import type { LabColor, DeltaEMethod, DeltaEWeights } from '../../domain/color';

describe('Delta E Calculations', () => {
  // Test colors with known Delta E values
  const white: LabColor = { L: 100, a: 0, b: 0 };
  const black: LabColor = { L: 0, a: 0, b: 0 };
  const red: LabColor = { L: 53.24, a: 80.09, b: 67.20 };
  const green: LabColor = { L: 87.74, a: -86.18, b: 83.18 };
  const blue: LabColor = { L: 32.30, a: 79.19, b: -107.86 };
  
  describe('Delta E76 (CIE76)', () => {
    it('should calculate zero for identical colors', () => {
      expect(calculateDeltaE76(white, white)).toBe(0);
      expect(calculateDeltaE76(red, red)).toBe(0);
    });

    it('should calculate correct values for known color pairs', () => {
      // White to black should be 100 (only L changes)
      expect(calculateDeltaE76(white, black)).toBe(100);
      
      // Small color difference
      const color1: LabColor = { L: 50, a: 0, b: 0 };
      const color2: LabColor = { L: 51, a: 0, b: 0 };
      expect(calculateDeltaE76(color1, color2)).toBe(1);
    });

    it('should handle 3D distance calculation correctly', () => {
      const color1: LabColor = { L: 50, a: 2.5, b: 0 };
      const color2: LabColor = { L: 73, a: 25, b: -18 };
      
      // Manual calculation: sqrt((73-50)^2 + (25-2.5)^2 + (-18-0)^2)
      // = sqrt(529 + 506.25 + 324) = sqrt(1359.25) ≈ 36.87
      const deltaE = calculateDeltaE76(color1, color2);
      expect(deltaE).toBeCloseTo(36.87, 1);
    });

    it('should be symmetric', () => {
      expect(calculateDeltaE76(red, green)).toBe(calculateDeltaE76(green, red));
      expect(calculateDeltaE76(blue, white)).toBe(calculateDeltaE76(white, blue));
    });
  });

  describe('Delta E94 (CIE94)', () => {
    it('should calculate zero for identical colors', () => {
      expect(calculateDeltaE94(white, white)).toBe(0);
      expect(calculateDeltaE94(red, red)).toBe(0);
    });

    it('should apply perceptual weighting factors', () => {
      const color1: LabColor = { L: 50, a: 0, b: 0 };
      const color2: LabColor = { L: 51, a: 0, b: 0 };
      
      // E94 should give different result than E76 due to weighting
      const e76 = calculateDeltaE76(color1, color2);
      const e94 = calculateDeltaE94(color1, color2);
      
      expect(e94).not.toBe(e76);
      expect(e94).toBeLessThan(e76); // E94 typically reduces lightness differences
    });

    it('should respect custom weights', () => {
      const weights1: DeltaEWeights = { kL: 1, kC: 1, kH: 1 };
      const weights2: DeltaEWeights = { kL: 2, kC: 1, kH: 1 };
      
      const deltaE1 = calculateDeltaE94(white, black, weights1);
      const deltaE2 = calculateDeltaE94(white, black, weights2);
      
      expect(deltaE2).toBeLessThan(deltaE1); // Higher kL reduces L contribution
    });

    it('should be symmetric', () => {
      expect(calculateDeltaE94(red, green)).toBeCloseTo(calculateDeltaE94(green, red), 5);
    });
  });

  describe('Delta E00 (CIE2000)', () => {
    it('should calculate zero for identical colors', () => {
      expect(calculateDeltaE00(white, white)).toBe(0);
      expect(calculateDeltaE00(red, red)).toBe(0);
    });

    it('should provide most accurate perceptual difference', () => {
      // Test with colors that have known CIE2000 values
      const color1: LabColor = { L: 50, a: 2.6772, b: -79.7751 };
      const color2: LabColor = { L: 50, a: 0, b: -82.7485 };
      
      // This pair has a known Delta E00 of approximately 2.0425
      const deltaE = calculateDeltaE00(color1, color2);
      expect(deltaE).toBeCloseTo(2.0425, 2);
    });

    it('should handle blue region rotation correctly', () => {
      // CIE2000 has special handling for blue region
      const blue1: LabColor = { L: 50, a: 0, b: -50 };
      const blue2: LabColor = { L: 50, a: -5, b: -50 };
      
      const deltaE = calculateDeltaE00(blue1, blue2);
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(10);
    });

    it('should respect custom weights', () => {
      const weights1: DeltaEWeights = { kL: 1, kC: 1, kH: 1 };
      const weights2: DeltaEWeights = { kL: 2, kC: 1, kH: 1 };
      
      const deltaE1 = calculateDeltaE00(white, black, weights1);
      const deltaE2 = calculateDeltaE00(white, black, weights2);
      
      expect(deltaE2).not.toBe(deltaE1);
    });
  });

  describe('Delta E CMC', () => {
    it('should calculate zero for identical colors', () => {
      expect(calculateDeltaECMC(white, white)).toBe(0);
      expect(calculateDeltaECMC(red, red)).toBe(0);
    });

    it('should use l:c ratio correctly', () => {
      const color1: LabColor = { L: 50, a: 0, b: 0 };
      const color2: LabColor = { L: 55, a: 0, b: 0 };
      
      // Default l:c = 2:1 (textile)
      const deltaE_2_1 = calculateDeltaECMC(color1, color2, 2, 1);
      
      // Acceptability l:c = 1:1
      const deltaE_1_1 = calculateDeltaECMC(color1, color2, 1, 1);
      
      expect(deltaE_2_1).not.toBe(deltaE_1_1);
      expect(deltaE_1_1).toBeGreaterThan(deltaE_2_1); // Lower l makes L more significant
    });

    it('should handle hue-dependent factors', () => {
      // CMC has different weighting based on hue angle
      const yellow: LabColor = { L: 90, a: 0, b: 90 };  // ~90° hue
      const cyan: LabColor = { L: 70, a: -50, b: -20 }; // ~200° hue
      
      const deltaE1 = calculateDeltaECMC(white, yellow);
      const deltaE2 = calculateDeltaECMC(white, cyan);
      
      expect(deltaE1).toBeGreaterThan(0);
      expect(deltaE2).toBeGreaterThan(0);
    });
  });

  describe('Unified calculateDeltaE function', () => {
    const color1: LabColor = { L: 50, a: 10, b: -20 };
    const color2: LabColor = { L: 60, a: 15, b: -15 };

    it('should use E00 as default method', () => {
      const defaultResult = calculateDeltaE(color1, color2);
      const e00Result = calculateDeltaE(color1, color2, 'E00');
      
      expect(defaultResult).toBe(e00Result);
    });

    it('should switch between different methods correctly', () => {
      const e76 = calculateDeltaE(color1, color2, 'E76');
      const e94 = calculateDeltaE(color1, color2, 'E94');
      const e00 = calculateDeltaE(color1, color2, 'E00');
      const cmc = calculateDeltaE(color1, color2, 'CMC');
      
      // All should be different
      expect(e76).not.toBe(e94);
      expect(e94).not.toBe(e00);
      expect(e00).not.toBe(cmc);
      
      // All should be positive
      expect(e76).toBeGreaterThan(0);
      expect(e94).toBeGreaterThan(0);
      expect(e00).toBeGreaterThan(0);
      expect(cmc).toBeGreaterThan(0);
    });

    it('should pass weights correctly to each method', () => {
      const weights: DeltaEWeights = { kL: 2, kC: 1, kH: 1 };
      
      const e94WithWeights = calculateDeltaE(color1, color2, 'E94', weights);
      const e00WithWeights = calculateDeltaE(color1, color2, 'E00', weights);
      
      const e94NoWeights = calculateDeltaE(color1, color2, 'E94');
      const e00NoWeights = calculateDeltaE(color1, color2, 'E00');
      
      expect(e94WithWeights).not.toBe(e94NoWeights);
      expect(e00WithWeights).not.toBe(e00NoWeights);
    });

    it('should handle invalid method by defaulting to E00', () => {
      const result = calculateDeltaE(color1, color2, 'INVALID' as DeltaEMethod);
      const e00Result = calculateDeltaE(color1, color2, 'E00');
      
      expect(result).toBe(e00Result);
    });
  });

  describe('Delta E Interpretation', () => {
    it('should interpret Delta E values correctly', () => {
      expect(interpretDeltaE(0)).toBe('구별 불가능');
      expect(interpretDeltaE(0.5)).toBe('구별 불가능');
      expect(interpretDeltaE(0.99)).toBe('구별 불가능');
      
      expect(interpretDeltaE(1.0)).toBe('매우 유사');
      expect(interpretDeltaE(1.5)).toBe('매우 유사');
      expect(interpretDeltaE(1.99)).toBe('매우 유사');
      
      expect(interpretDeltaE(2.0)).toBe('유사');
      expect(interpretDeltaE(3.0)).toBe('유사');
      expect(interpretDeltaE(3.49)).toBe('유사');
      
      expect(interpretDeltaE(3.5)).toBe('차이 있음');
      expect(interpretDeltaE(4.5)).toBe('차이 있음');
      expect(interpretDeltaE(4.99)).toBe('차이 있음');
      
      expect(interpretDeltaE(5.0)).toBe('명확한 차이');
      expect(interpretDeltaE(7.5)).toBe('명확한 차이');
      expect(interpretDeltaE(9.99)).toBe('명확한 차이');
      
      expect(interpretDeltaE(10.0)).toBe('매우 다름');
      expect(interpretDeltaE(20)).toBe('매우 다름');
      expect(interpretDeltaE(100)).toBe('매우 다름');
    });

    it('should handle edge cases', () => {
      expect(interpretDeltaE(-1)).toBe('구별 불가능'); // Negative (shouldn't happen but handle gracefully)
      expect(interpretDeltaE(NaN)).toBe('매우 다름'); // NaN
      expect(interpretDeltaE(Infinity)).toBe('매우 다름'); // Infinity
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle extreme color differences', () => {
      const extremeColor1: LabColor = { L: 0, a: -128, b: -128 };
      const extremeColor2: LabColor = { L: 100, a: 127, b: 127 };
      
      const deltaE = calculateDeltaE(extremeColor1, extremeColor2);
      expect(deltaE).toBeGreaterThan(100);
      expect(deltaE).toBeLessThan(500);
    });

    it('should handle near-zero differences', () => {
      const color1: LabColor = { L: 50, a: 0, b: 0 };
      const color2: LabColor = { L: 50.0001, a: 0.0001, b: 0.0001 };
      
      const deltaE = calculateDeltaE(color1, color2);
      expect(deltaE).toBeGreaterThan(0);
      expect(deltaE).toBeLessThan(0.001);
    });

    it('should complete calculations quickly', () => {
      const start = performance.now();
      
      // Run 1000 calculations
      for (let i = 0; i < 1000; i++) {
        calculateDeltaE00(red, green);
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should complete 1000 calculations in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});