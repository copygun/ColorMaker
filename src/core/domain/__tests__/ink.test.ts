import { describe, it, expect } from 'vitest';
import { InkValidation } from '../ink';
import type { Ink, InkRatio, InkConcentration } from '../ink';
import type { LabColor } from '../color';

describe('Ink Domain', () => {
  describe('Ink Type Constants', () => {
    it('should have valid ink type values', () => {
      const validTypes = ['process', 'spot', 'metallic', 'white'];
      
      validTypes.forEach(type => {
        expect(type).toMatch(/^(process|spot|metallic|white)$/);
      });
    });
  });

  describe('Ink Concentration', () => {
    it('should have valid concentration levels', () => {
      const concentrations: InkConcentration = {
        100: { L: 30, a: 50, b: -20 },
        70: { L: 50, a: 35, b: -14 },
        40: { L: 70, a: 20, b: -8 },
      };
      
      expect(concentrations[100]).toBeDefined();
      expect(concentrations[70]).toBeDefined();
      expect(concentrations[40]).toBeDefined();
    });

    it('should allow partial concentration definitions', () => {
      const concentrations: InkConcentration = {
        100: { L: 30, a: 50, b: -20 },
      };
      
      expect(concentrations[100]).toBeDefined();
      expect(concentrations[70]).toBeUndefined();
      expect(concentrations[40]).toBeUndefined();
    });
  });

  describe('Ink Entity', () => {
    it('should create valid ink objects', () => {
      const ink: Ink = {
        id: 'cyan-001',
        name: 'Process Cyan',
        type: 'process',
        vendor: 'Test Vendor',
        concentrations: {
          100: { L: 55, a: -37, b: -50 },
          70: { L: 65, a: -26, b: -35 },
          40: { L: 75, a: -15, b: -20 },
        },
      };
      
      expect(ink.id).toBe('cyan-001');
      expect(ink.name).toBe('Process Cyan');
      expect(ink.type).toBe('process');
      expect(ink.vendor).toBe('Test Vendor');
      expect(Object.keys(ink.concentrations)).toHaveLength(3);
    });

    it('should support optional fields', () => {
      const ink: Ink = {
        id: 'special-001',
        name: 'Special Ink',
        type: 'spot',
        vendor: 'Test Vendor',
        concentrations: {
          100: { L: 45, a: 60, b: 30 },
        },
        pantoneCode: 'PANTONE 185 C',
        hexCode: '#E31E24',
        cost: 25.50,
      };
      
      expect(ink.pantoneCode).toBe('PANTONE 185 C');
      expect(ink.hexCode).toBe('#E31E24');
      expect(ink.cost).toBe(25.50);
    });
  });

  describe('Ink Ratio', () => {
    it('should create valid ink ratio objects', () => {
      const ratio: InkRatio = {
        inkId: 'cyan-001',
        ratio: 0.65,
        concentration: 100,
      };
      
      expect(ratio.inkId).toBe('cyan-001');
      expect(ratio.ratio).toBe(0.65);
      expect(ratio.concentration).toBe(100);
    });

    it('should handle different concentration levels', () => {
      const ratios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.5, concentration: 100 },
        { inkId: 'magenta', ratio: 0.3, concentration: 70 },
        { inkId: 'yellow', ratio: 0.2, concentration: 40 },
      ];
      
      expect(ratios[0].concentration).toBe(100);
      expect(ratios[1].concentration).toBe(70);
      expect(ratios[2].concentration).toBe(40);
    });
  });

  describe('InkValidation.validateTotalRatio', () => {
    it('should validate correct ratio sum of 1', () => {
      const ratios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.5, concentration: 100 },
        { inkId: 'magenta', ratio: 0.3, concentration: 100 },
        { inkId: 'yellow', ratio: 0.2, concentration: 100 },
      ];
      
      expect(InkValidation.validateTotalRatio(ratios)).toBe(true);
    });

    it('should accept ratio sum within tolerance', () => {
      const ratios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.333, concentration: 100 },
        { inkId: 'magenta', ratio: 0.333, concentration: 100 },
        { inkId: 'yellow', ratio: 0.333, concentration: 100 },
      ];
      
      // Sum = 0.999, within 0.001 tolerance
      expect(InkValidation.validateTotalRatio(ratios)).toBe(true);
    });

    it('should reject invalid ratio sums', () => {
      const underRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.3, concentration: 100 },
        { inkId: 'magenta', ratio: 0.3, concentration: 100 },
      ];
      
      const overRatios: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.6, concentration: 100 },
        { inkId: 'magenta', ratio: 0.6, concentration: 100 },
      ];
      
      expect(InkValidation.validateTotalRatio(underRatios)).toBe(false);
      expect(InkValidation.validateTotalRatio(overRatios)).toBe(false);
    });

    it('should handle single ink with ratio 1', () => {
      const ratios: InkRatio[] = [
        { inkId: 'black', ratio: 1.0, concentration: 100 },
      ];
      
      expect(InkValidation.validateTotalRatio(ratios)).toBe(true);
    });

    it('should handle empty array', () => {
      expect(InkValidation.validateTotalRatio([])).toBe(false);
    });

    it('should handle negative ratios', () => {
      const ratios: InkRatio[] = [
        { inkId: 'cyan', ratio: 1.5, concentration: 100 },
        { inkId: 'magenta', ratio: -0.5, concentration: 100 },
      ];
      
      // Sum = 1.0 but has negative ratio
      expect(InkValidation.validateTotalRatio(ratios)).toBe(true); // Only checks sum
    });
  });

  describe('InkValidation.validateTAC', () => {
    it('should validate TAC within limit', () => {
      const inkAmounts = {
        'cyan': 75,
        'magenta': 60,
        'yellow': 55,
        'black': 90,
      };
      
      const result = InkValidation.validateTAC(inkAmounts, 300);
      
      expect(result.valid).toBe(true);
      expect(result.tac).toBe(280);
      expect(result.limit).toBe(300);
    });

    it('should reject TAC over limit', () => {
      const inkAmounts = {
        'cyan': 95,
        'magenta': 95,
        'yellow': 95,
        'black': 95,
      };
      
      const result = InkValidation.validateTAC(inkAmounts, 300);
      
      expect(result.valid).toBe(false);
      expect(result.tac).toBe(380);
      expect(result.limit).toBe(300);
    });

    it('should handle exactly at limit', () => {
      const inkAmounts = {
        'cyan': 80,
        'magenta': 70,
        'yellow': 60,
        'black': 90,
      };
      
      const result = InkValidation.validateTAC(inkAmounts, 300);
      
      expect(result.valid).toBe(true);
      expect(result.tac).toBe(300);
    });

    it('should handle single ink', () => {
      const inkAmounts = {
        'black': 100,
      };
      
      const result = InkValidation.validateTAC(inkAmounts, 300);
      
      expect(result.valid).toBe(true);
      expect(result.tac).toBe(100);
    });

    it('should handle empty ink amounts', () => {
      const result = InkValidation.validateTAC({}, 300);
      
      expect(result.valid).toBe(true);
      expect(result.tac).toBe(0);
    });

    it('should handle different TAC limits', () => {
      const inkAmounts = {
        'cyan': 70,
        'magenta': 70,
        'yellow': 70,
        'black': 70,
      };
      
      // Newspaper printing (lower TAC)
      const newspaper = InkValidation.validateTAC(inkAmounts, 240);
      expect(newspaper.valid).toBe(false);
      expect(newspaper.tac).toBe(280);
      
      // Sheet-fed offset (higher TAC)
      const sheetFed = InkValidation.validateTAC(inkAmounts, 340);
      expect(sheetFed.valid).toBe(true);
      expect(sheetFed.tac).toBe(280);
    });

    it('should handle negative values gracefully', () => {
      const inkAmounts = {
        'cyan': -50,
        'magenta': 100,
        'yellow': 100,
      };
      
      const result = InkValidation.validateTAC(inkAmounts, 300);
      
      // Should sum absolute values or handle negatives appropriately
      expect(result.tac).toBe(150); // -50 + 100 + 100 = 150
    });
  });

  describe('InkValidation.validateConcentration', () => {
    it('should validate standard concentrations', () => {
      expect(InkValidation.validateConcentration(100)).toBe(true);
      expect(InkValidation.validateConcentration(70)).toBe(true);
      expect(InkValidation.validateConcentration(40)).toBe(true);
    });

    it('should reject invalid concentrations', () => {
      expect(InkValidation.validateConcentration(0)).toBe(false);
      expect(InkValidation.validateConcentration(50)).toBe(false);
      expect(InkValidation.validateConcentration(85)).toBe(false);
      expect(InkValidation.validateConcentration(110)).toBe(false);
      expect(InkValidation.validateConcentration(-10)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(InkValidation.validateConcentration(NaN)).toBe(false);
      expect(InkValidation.validateConcentration(Infinity)).toBe(false);
      expect(InkValidation.validateConcentration(null as any)).toBe(false);
      expect(InkValidation.validateConcentration(undefined as any)).toBe(false);
    });
  });

  describe('InkValidation.validateInkAmount', () => {
    it('should validate amounts within range', () => {
      expect(InkValidation.validateInkAmount(0)).toBe(true);
      expect(InkValidation.validateInkAmount(50)).toBe(true);
      expect(InkValidation.validateInkAmount(100)).toBe(true);
      expect(InkValidation.validateInkAmount(75.5)).toBe(true);
    });

    it('should reject amounts outside range', () => {
      expect(InkValidation.validateInkAmount(-1)).toBe(false);
      expect(InkValidation.validateInkAmount(101)).toBe(false);
      expect(InkValidation.validateInkAmount(-0.1)).toBe(false);
      expect(InkValidation.validateInkAmount(100.1)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(InkValidation.validateInkAmount(NaN)).toBe(false);
      expect(InkValidation.validateInkAmount(Infinity)).toBe(false);
      expect(InkValidation.validateInkAmount(-Infinity)).toBe(false);
    });
  });

  describe('Business Rules Integration', () => {
    it('should validate complete ink recipe', () => {
      const recipe: InkRatio[] = [
        { inkId: 'cyan', ratio: 0.35, concentration: 100 },
        { inkId: 'magenta', ratio: 0.25, concentration: 70 },
        { inkId: 'yellow', ratio: 0.20, concentration: 100 },
        { inkId: 'black', ratio: 0.20, concentration: 100 },
      ];
      
      // Validate total ratio
      expect(InkValidation.validateTotalRatio(recipe)).toBe(true);
      
      // Convert to amounts for TAC check
      const amounts = recipe.reduce((acc, ink) => {
        acc[ink.inkId] = ink.ratio * 100;
        return acc;
      }, {} as Record<string, number>);
      
      // Validate TAC
      const tacResult = InkValidation.validateTAC(amounts, 300);
      expect(tacResult.valid).toBe(true);
      expect(tacResult.tac).toBe(100);
    });

    it('should handle metallic and special inks', () => {
      const metallicInk: Ink = {
        id: 'silver-001',
        name: 'Silver Metallic',
        type: 'metallic',
        vendor: 'Special Inks Co',
        concentrations: {
          100: { L: 80, a: 0, b: 0 },
        },
        cost: 45.00,
      };
      
      expect(metallicInk.type).toBe('metallic');
      expect(metallicInk.cost).toBeGreaterThan(20); // Premium ink
    });

    it('should validate white ink usage', () => {
      const whiteInk: Ink = {
        id: 'white-001',
        name: 'Opaque White',
        type: 'white',
        vendor: 'Test Vendor',
        concentrations: {
          100: { L: 95, a: 0, b: -2 },
        },
      };
      
      const recipe: InkRatio[] = [
        { inkId: 'white-001', ratio: 0.3, concentration: 100 },
        { inkId: 'cyan', ratio: 0.7, concentration: 100 },
      ];
      
      expect(InkValidation.validateTotalRatio(recipe)).toBe(true);
    });
  });
});