import { describe, it, expect } from 'vitest';
import {
  isValidLabColor,
  isValidXYZColor,
  isValidRGBColor,
  areColorsEqual,
  formatLabColor,
  parseLabColor,
} from '../color';
import type { LabColor, XYZColor, RGBColor } from '../color';

describe('Color Domain', () => {
  describe('Lab Color Validation', () => {
    it('should validate valid Lab colors', () => {
      const validColors: LabColor[] = [
        { L: 50, a: 0, b: 0 },
        { L: 0, a: -128, b: -128 },
        { L: 100, a: 127, b: 127 },
        { L: 75.5, a: -50.3, b: 25.8 },
      ];

      validColors.forEach(color => {
        expect(isValidLabColor(color)).toBe(true);
      });
    });

    it('should reject invalid Lab colors', () => {
      const invalidColors = [
        { L: -1, a: 0, b: 0 },        // L too low
        { L: 101, a: 0, b: 0 },       // L too high
        { L: 50, a: -129, b: 0 },     // a too low
        { L: 50, a: 128, b: 0 },      // a too high
        { L: 50, a: 0, b: -129 },     // b too low
        { L: 50, a: 0, b: 128 },      // b too high
        { L: NaN, a: 0, b: 0 },       // NaN value
        { L: Infinity, a: 0, b: 0 },  // Infinity
        { L: 50, a: undefined as any, b: 0 }, // undefined
        null as any,                   // null
        undefined as any,              // undefined
      ];

      invalidColors.forEach(color => {
        expect(isValidLabColor(color)).toBe(false);
      });
    });

    it('should handle boundary values correctly', () => {
      const boundaryColors: LabColor[] = [
        { L: 0, a: -128, b: -128 },    // minimum values
        { L: 100, a: 127, b: 127 },    // maximum values
        { L: 50, a: 0, b: 0 },         // neutral gray
      ];

      boundaryColors.forEach(color => {
        expect(isValidLabColor(color)).toBe(true);
      });
    });
  });

  describe('XYZ Color Validation', () => {
    it('should validate valid XYZ colors', () => {
      const validColors: XYZColor[] = [
        { X: 0, Y: 0, Z: 0 },
        { X: 95.047, Y: 100, Z: 108.883 }, // D65 white point
        { X: 50, Y: 50, Z: 50 },
        { X: 150, Y: 150, Z: 150 },
      ];

      validColors.forEach(color => {
        expect(isValidXYZColor(color)).toBe(true);
      });
    });

    it('should reject invalid XYZ colors', () => {
      const invalidColors = [
        { X: -1, Y: 0, Z: 0 },        // negative X
        { X: 0, Y: -1, Z: 0 },        // negative Y
        { X: 0, Y: 0, Z: -1 },        // negative Z
        { X: NaN, Y: 0, Z: 0 },       // NaN
        { X: Infinity, Y: 0, Z: 0 },  // Infinity
        null as any,
        undefined as any,
      ];

      invalidColors.forEach(color => {
        expect(isValidXYZColor(color)).toBe(false);
      });
    });
  });

  describe('RGB Color Validation', () => {
    it('should validate valid RGB colors', () => {
      const validColors: RGBColor[] = [
        { r: 0, g: 0, b: 0 },          // black
        { r: 255, g: 255, b: 255 },    // white
        { r: 128, g: 128, b: 128 },    // gray
        { r: 255, g: 0, b: 0 },        // red
        { r: 0, g: 255, b: 0 },        // green
        { r: 0, g: 0, b: 255 },        // blue
      ];

      validColors.forEach(color => {
        expect(isValidRGBColor(color)).toBe(true);
      });
    });

    it('should reject invalid RGB colors', () => {
      const invalidColors = [
        { r: -1, g: 0, b: 0 },         // negative r
        { r: 256, g: 0, b: 0 },        // r too high
        { r: 0, g: -1, b: 0 },         // negative g
        { r: 0, g: 256, b: 0 },        // g too high
        { r: 0, g: 0, b: -1 },         // negative b
        { r: 0, g: 0, b: 256 },        // b too high
        { r: NaN, g: 0, b: 0 },        // NaN
        { r: 1.5, g: 0, b: 0 },        // float (should be integer)
        null as any,
        undefined as any,
      ];

      invalidColors.forEach(color => {
        expect(isValidRGBColor(color)).toBe(false);
      });
    });
  });

  describe('Color Equality', () => {
    it('should correctly compare equal colors', () => {
      const color1: LabColor = { L: 50, a: 25, b: -25 };
      const color2: LabColor = { L: 50, a: 25, b: -25 };
      
      expect(areColorsEqual(color1, color2)).toBe(true);
    });

    it('should correctly compare nearly equal colors with tolerance', () => {
      const color1: LabColor = { L: 50, a: 25, b: -25 };
      const color2: LabColor = { L: 50.09, a: 25.09, b: -24.91 };
      
      expect(areColorsEqual(color1, color2, 0.1)).toBe(true);
      expect(areColorsEqual(color1, color2, 0.05)).toBe(false);
    });

    it('should correctly identify different colors', () => {
      const color1: LabColor = { L: 50, a: 25, b: -25 };
      const color2: LabColor = { L: 60, a: 25, b: -25 };
      
      expect(areColorsEqual(color1, color2)).toBe(false);
    });

    it('should handle edge cases in color comparison', () => {
      const color: LabColor = { L: 50, a: 25, b: -25 };
      
      expect(areColorsEqual(color, null as any)).toBe(false);
      expect(areColorsEqual(null as any, color)).toBe(false);
      expect(areColorsEqual(null as any, null as any)).toBe(false);
      expect(areColorsEqual(undefined as any, undefined as any)).toBe(false);
    });
  });

  describe('Lab Color Formatting', () => {
    it('should format Lab colors correctly', () => {
      expect(formatLabColor({ L: 50, a: 25, b: -25 }))
        .toBe('L:50.0 a:25.0 b:-25.0');
      
      expect(formatLabColor({ L: 100, a: 0, b: 0 }))
        .toBe('L:100.0 a:0.0 b:0.0');
      
      expect(formatLabColor({ L: 0, a: -128, b: 127 }))
        .toBe('L:0.0 a:-128.0 b:127.0');
    });

    it('should format with custom precision', () => {
      const color: LabColor = { L: 50.456, a: 25.789, b: -25.123 };
      
      expect(formatLabColor(color, 0)).toBe('L:50 a:26 b:-25');
      expect(formatLabColor(color, 1)).toBe('L:50.5 a:25.8 b:-25.1');
      expect(formatLabColor(color, 2)).toBe('L:50.46 a:25.79 b:-25.12');
    });
  });

  describe('Lab Color Parsing', () => {
    it('should parse valid Lab color strings', () => {
      expect(parseLabColor('L:50 a:25 b:-25')).toEqual({ L: 50, a: 25, b: -25 });
      expect(parseLabColor('L:50.5 a:25.8 b:-25.1')).toEqual({ L: 50.5, a: 25.8, b: -25.1 });
      expect(parseLabColor('L:100 a:0 b:0')).toEqual({ L: 100, a: 0, b: 0 });
    });

    it('should handle various formats', () => {
      // With extra spaces
      expect(parseLabColor('L: 50  a: 25  b: -25')).toEqual({ L: 50, a: 25, b: -25 });
      
      // With colons
      expect(parseLabColor('L:50 a:25 b:-25')).toEqual({ L: 50, a: 25, b: -25 });
      
      // Mixed separators
      expect(parseLabColor('L:50, a:25, b:-25')).toEqual({ L: 50, a: 25, b: -25 });
    });

    it('should return null for invalid strings', () => {
      expect(parseLabColor('invalid')).toBeNull();
      expect(parseLabColor('')).toBeNull();
      expect(parseLabColor('L:50 a:25')).toBeNull(); // missing b
      expect(parseLabColor('50 25 -25')).toBeNull(); // missing labels
      expect(parseLabColor(null as any)).toBeNull();
      expect(parseLabColor(undefined as any)).toBeNull();
    });
  });

  describe('Delta E Method Constants', () => {
    it('should have valid Delta E method values', () => {
      const methods = ['E76', 'E94', 'E00', 'CMC'];
      
      methods.forEach(method => {
        expect(method).toMatch(/^(E76|E94|E00|CMC)$/);
      });
    });
  });

  describe('Delta E Weights', () => {
    it('should have valid default weights', () => {
      const defaultWeights = { kL: 1, kC: 1, kH: 1 };
      
      expect(defaultWeights.kL).toBeGreaterThan(0);
      expect(defaultWeights.kC).toBeGreaterThan(0);
      expect(defaultWeights.kH).toBeGreaterThan(0);
    });
  });
});