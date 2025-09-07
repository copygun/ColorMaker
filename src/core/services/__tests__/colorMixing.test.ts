import { describe, it, expect } from 'vitest';
import {
  labToXYZ,
  xyzToLab,
  mixColorsInLab,
  mixColorsInXYZ,
  mixColorsKubelkaMunk,
  interpolateConcentration,
  calculateInkMixture,
} from '../colorMixing';
import type { LabColor, XYZColor } from '../../domain/color';
import type { Ink, InkRatio } from '../../domain/ink';

describe('Color Mixing Service', () => {
  describe('Lab to XYZ Conversion', () => {
    it('should convert white correctly', () => {
      const white: LabColor = { L: 100, a: 0, b: 0 };
      const xyz = labToXYZ(white);
      
      // D65 illuminant white point
      expect(xyz.X).toBeCloseTo(95.047, 2);
      expect(xyz.Y).toBeCloseTo(100, 2);
      expect(xyz.Z).toBeCloseTo(108.883, 2);
    });

    it('should convert black correctly', () => {
      const black: LabColor = { L: 0, a: 0, b: 0 };
      const xyz = labToXYZ(black);
      
      expect(xyz.X).toBeCloseTo(0, 2);
      expect(xyz.Y).toBeCloseTo(0, 2);
      expect(xyz.Z).toBeCloseTo(0, 2);
    });

    it('should convert mid-gray correctly', () => {
      const gray: LabColor = { L: 50, a: 0, b: 0 };
      const xyz = labToXYZ(gray);
      
      expect(xyz.X).toBeCloseTo(18.42, 1);
      expect(xyz.Y).toBeCloseTo(19.37, 1);
      expect(xyz.Z).toBeCloseTo(21.10, 1);
    });

    it('should handle chromatic colors', () => {
      const red: LabColor = { L: 53.24, a: 80.09, b: 67.20 };
      const xyz = labToXYZ(red);
      
      expect(xyz.X).toBeGreaterThan(0);
      expect(xyz.Y).toBeGreaterThan(0);
      expect(xyz.Z).toBeGreaterThan(0);
    });
  });

  describe('XYZ to Lab Conversion', () => {
    it('should convert D65 white correctly', () => {
      const white: XYZColor = { X: 95.047, Y: 100, Z: 108.883 };
      const lab = xyzToLab(white);
      
      expect(lab.L).toBeCloseTo(100, 1);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });

    it('should convert black correctly', () => {
      const black: XYZColor = { X: 0, Y: 0, Z: 0 };
      const lab = xyzToLab(black);
      
      expect(lab.L).toBeCloseTo(0, 1);
      expect(lab.a).toBeCloseTo(0, 1);
      expect(lab.b).toBeCloseTo(0, 1);
    });

    it('should be reversible (round-trip test)', () => {
      const originalLab: LabColor = { L: 75.5, a: 25.3, b: -45.8 };
      const xyz = labToXYZ(originalLab);
      const backToLab = xyzToLab(xyz);
      
      expect(backToLab.L).toBeCloseTo(originalLab.L, 1);
      expect(backToLab.a).toBeCloseTo(originalLab.a, 1);
      expect(backToLab.b).toBeCloseTo(originalLab.b, 1);
    });

    it('should handle multiple round trips', () => {
      const colors: LabColor[] = [
        { L: 50, a: 20, b: -30 },
        { L: 90, a: -50, b: 75 },
        { L: 25, a: 60, b: -80 },
      ];

      colors.forEach(original => {
        const xyz = labToXYZ(original);
        const back = xyzToLab(xyz);
        
        expect(back.L).toBeCloseTo(original.L, 0.1);
        expect(back.a).toBeCloseTo(original.a, 0.1);
        expect(back.b).toBeCloseTo(original.b, 0.1);
      });
    });
  });

  describe('Lab Color Mixing', () => {
    it('should mix two identical colors correctly', () => {
      const color: LabColor = { L: 50, a: 20, b: -30 };
      const mixed = mixColorsInLab([color, color], [0.5, 0.5]);
      
      expect(mixed.L).toBe(color.L);
      expect(mixed.a).toBe(color.a);
      expect(mixed.b).toBe(color.b);
    });

    it('should mix black and white to gray', () => {
      const black: LabColor = { L: 0, a: 0, b: 0 };
      const white: LabColor = { L: 100, a: 0, b: 0 };
      const mixed = mixColorsInLab([black, white], [0.5, 0.5]);
      
      expect(mixed.L).toBe(50);
      expect(mixed.a).toBe(0);
      expect(mixed.b).toBe(0);
    });

    it('should respect mixing ratios', () => {
      const color1: LabColor = { L: 20, a: 10, b: 0 };
      const color2: LabColor = { L: 80, a: -10, b: 0 };
      
      // 75% color1, 25% color2
      const mixed = mixColorsInLab([color1, color2], [0.75, 0.25]);
      
      expect(mixed.L).toBe(20 * 0.75 + 80 * 0.25); // 35
      expect(mixed.a).toBe(10 * 0.75 + (-10) * 0.25); // 5
      expect(mixed.b).toBe(0);
    });

    it('should handle multiple colors', () => {
      const colors: LabColor[] = [
        { L: 30, a: 0, b: 0 },
        { L: 60, a: 0, b: 0 },
        { L: 90, a: 0, b: 0 },
      ];
      const ratios = [0.33, 0.33, 0.34];
      
      const mixed = mixColorsInLab(colors, ratios);
      
      expect(mixed.L).toBeCloseTo(60.3, 1);
      expect(mixed.a).toBe(0);
      expect(mixed.b).toBe(0);
    });

    it('should throw error for mismatched arrays', () => {
      const colors: LabColor[] = [{ L: 50, a: 0, b: 0 }];
      const ratios = [0.5, 0.5];
      
      expect(() => mixColorsInLab(colors, ratios)).toThrow();
    });

    it('should throw error for invalid ratio sum', () => {
      const colors: LabColor[] = [
        { L: 50, a: 0, b: 0 },
        { L: 60, a: 0, b: 0 },
      ];
      const ratios = [0.3, 0.3]; // Sum = 0.6, not 1
      
      expect(() => mixColorsInLab(colors, ratios)).toThrow();
    });

    it('should handle empty arrays', () => {
      expect(() => mixColorsInLab([], [])).toThrow();
    });
  });

  describe('XYZ Color Mixing', () => {
    it('should mix colors in XYZ space', () => {
      const color1: LabColor = { L: 50, a: 20, b: -30 };
      const color2: LabColor = { L: 70, a: -10, b: 40 };
      
      const mixedXYZ = mixColorsInXYZ([color1, color2], [0.5, 0.5]);
      const mixedLab = mixColorsInLab([color1, color2], [0.5, 0.5]);
      
      // XYZ mixing should give different results than Lab mixing
      expect(mixedXYZ.L).not.toBeCloseTo(mixedLab.L, 0);
      expect(mixedXYZ.a).not.toBeCloseTo(mixedLab.a, 0);
      expect(mixedXYZ.b).not.toBeCloseTo(mixedLab.b, 0);
    });

    it('should handle ratio validation', () => {
      const colors: LabColor[] = [
        { L: 50, a: 0, b: 0 },
        { L: 60, a: 0, b: 0 },
      ];
      const invalidRatios = [0.6, 0.6];
      
      expect(() => mixColorsInXYZ(colors, invalidRatios)).toThrow();
    });
  });

  describe('Kubelka-Munk Mixing', () => {
    it('should mix colors using Kubelka-Munk model', () => {
      const color1: LabColor = { L: 30, a: 0, b: 0 };
      const color2: LabColor = { L: 70, a: 0, b: 0 };
      
      const mixed = mixColorsKubelkaMunk([color1, color2], [0.5, 0.5]);
      
      // Result should be different from linear mixing
      const linearMixed = mixColorsInLab([color1, color2], [0.5, 0.5]);
      
      expect(mixed.L).not.toBeCloseTo(linearMixed.L, 0);
    });

    it('should handle extreme values', () => {
      const black: LabColor = { L: 0, a: 0, b: 0 };
      const white: LabColor = { L: 100, a: 0, b: 0 };
      
      const mixed = mixColorsKubelkaMunk([black, white], [0.5, 0.5]);
      
      expect(mixed.L).toBeGreaterThan(0);
      expect(mixed.L).toBeLessThan(100);
    });

    it('should preserve chromaticity', () => {
      const color1: LabColor = { L: 50, a: 30, b: -20 };
      const color2: LabColor = { L: 50, a: -30, b: 20 };
      
      const mixed = mixColorsKubelkaMunk([color1, color2], [0.5, 0.5]);
      
      expect(Math.abs(mixed.a)).toBeLessThan(30);
      expect(Math.abs(mixed.b)).toBeLessThan(20);
    });
  });

  describe('Ink Concentration Interpolation', () => {
    const ink: Ink = {
      id: 'test-ink',
      name: 'Test Ink',
      type: 'process',
      vendor: 'Test Vendor',
      concentrations: {
        100: { L: 30, a: 50, b: -20 },
        70: { L: 50, a: 35, b: -14 },
        40: { L: 70, a: 20, b: -8 },
      },
    };

    it('should return exact concentration values', () => {
      expect(interpolateConcentration(ink, 100)).toEqual(ink.concentrations[100]);
      expect(interpolateConcentration(ink, 70)).toEqual(ink.concentrations[70]);
      expect(interpolateConcentration(ink, 40)).toEqual(ink.concentrations[40]);
    });

    it('should interpolate between 70% and 100%', () => {
      const result = interpolateConcentration(ink, 85);
      
      expect(result.L).toBeCloseTo(40, 1); // Between 30 and 50
      expect(result.a).toBeCloseTo(42.5, 1); // Between 35 and 50
      expect(result.b).toBeCloseTo(-17, 1); // Between -14 and -20
    });

    it('should interpolate between 40% and 70%', () => {
      const result = interpolateConcentration(ink, 55);
      
      expect(result.L).toBeCloseTo(60, 1); // Between 50 and 70
      expect(result.a).toBeCloseTo(27.5, 1); // Between 20 and 35
      expect(result.b).toBeCloseTo(-11, 1); // Between -8 and -14
    });

    it('should use 40% for values below 40%', () => {
      const result = interpolateConcentration(ink, 20);
      expect(result).toEqual(ink.concentrations[40]);
    });

    it('should handle missing concentration levels', () => {
      const inkMissing70: Ink = {
        ...ink,
        concentrations: {
          100: { L: 30, a: 50, b: -20 },
          40: { L: 70, a: 20, b: -8 },
        },
      };
      
      const result = interpolateConcentration(inkMissing70, 85);
      // Should interpolate between 100 and 100 (fallback)
      expect(result).toEqual(inkMissing70.concentrations[100]);
    });
  });

  describe('Ink Mixture Calculation', () => {
    const inks: Ink[] = [
      {
        id: 'cyan',
        name: 'Cyan',
        type: 'process',
        vendor: 'Test',
        concentrations: {
          100: { L: 55, a: -37, b: -50 },
        },
      },
      {
        id: 'magenta',
        name: 'Magenta',
        type: 'process',
        vendor: 'Test',
        concentrations: {
          100: { L: 48, a: 74, b: -3 },
        },
      },
    ];

    it('should calculate ink mixture with Lab mixing', () => {
      const inkRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.6, concentration: 100 },
        { inkId: 'magenta', ratio: 0.4, concentration: 100 },
      ];
      
      const result = calculateInkMixture(inks, inkRatios, 'lab');
      
      expect(result.L).toBeGreaterThan(0);
      expect(result.L).toBeLessThan(100);
    });

    it('should calculate ink mixture with XYZ mixing', () => {
      const inkRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.5, concentration: 100 },
        { inkId: 'magenta', ratio: 0.5, concentration: 100 },
      ];
      
      const labResult = calculateInkMixture(inks, inkRatios, 'lab');
      const xyzResult = calculateInkMixture(inks, inkRatios, 'xyz');
      
      // Results should be different
      expect(xyzResult.L).not.toBeCloseTo(labResult.L, 0);
    });

    it('should calculate ink mixture with Kubelka-Munk', () => {
      const inkRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.7, concentration: 100 },
        { inkId: 'magenta', ratio: 0.3, concentration: 100 },
      ];
      
      const result = calculateInkMixture(inks, inkRatios, 'kubelka-munk');
      
      expect(result.L).toBeGreaterThan(0);
      expect(result.L).toBeLessThan(100);
    });

    it('should throw error for missing ink', () => {
      const inkRatios: InkRatio[] = [
        { inkId: 'nonexistent', ratio: 1.0, concentration: 100 },
      ];
      
      expect(() => calculateInkMixture(inks, inkRatios)).toThrow('Ink not found');
    });

    it('should handle single ink', () => {
      const inkRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 1.0, concentration: 100 },
      ];
      
      const result = calculateInkMixture(inks, inkRatios);
      
      expect(result).toEqual(inks[0].concentrations[100]);
    });

    it('should handle empty ink ratios', () => {
      expect(() => calculateInkMixture(inks, [])).toThrow();
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle near-zero values in conversions', () => {
      const nearBlack: LabColor = { L: 0.001, a: 0.001, b: 0.001 };
      const xyz = labToXYZ(nearBlack);
      const backToLab = xyzToLab(xyz);
      
      expect(backToLab.L).toBeCloseTo(nearBlack.L, 3);
    });

    it('should handle very large values', () => {
      const extreme: LabColor = { L: 99.999, a: 127, b: 127 };
      const xyz = labToXYZ(extreme);
      
      expect(xyz.X).toBeGreaterThan(0);
      expect(xyz.Y).toBeGreaterThan(0);
      expect(xyz.Z).toBeGreaterThan(0);
    });

    it('should complete mixing operations quickly', () => {
      const colors: LabColor[] = Array(10).fill(null).map((_, i) => ({
        L: 50 + i,
        a: i - 5,
        b: 5 - i,
      }));
      const ratios = Array(10).fill(0.1);
      
      const start = performance.now();
      
      for (let i = 0; i < 100; i++) {
        mixColorsInLab(colors, ratios);
        mixColorsInXYZ(colors, ratios);
        mixColorsKubelkaMunk(colors, ratios);
      }
      
      const duration = performance.now() - start;
      
      // 300 mixing operations should complete in less than 50ms
      expect(duration).toBeLessThan(50);
    });
  });
});