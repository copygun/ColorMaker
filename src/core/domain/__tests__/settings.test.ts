import { describe, it, expect } from 'vitest';
import { SettingsValidation, DEFAULT_SETTINGS } from '../settings';
import type { 
  CalculationMode, 
  CalculationOptions, 
  PrinterProfile, 
  FeatureFlags, 
  VendorProfile 
} from '../settings';

describe('Settings Domain', () => {
  describe('Calculation Mode', () => {
    it('should create valid calculation modes', () => {
      const legacyMode: CalculationMode = {
        mode: 'legacy',
        features: {
          mixing: 'lab',
          optimization: 'linear',
          interpolation: 'linear',
          deltaE: 'E00',
        },
      };
      
      expect(legacyMode.mode).toBe('legacy');
      expect(legacyMode.features.mixing).toBe('lab');
      expect(legacyMode.features.optimization).toBe('linear');
    });

    it('should support advanced mode', () => {
      const advancedMode: CalculationMode = {
        mode: 'advanced',
        features: {
          mixing: 'xyz',
          optimization: 'pso',
          interpolation: 'catmull-rom',
          deltaE: 'E00',
        },
      };
      
      expect(advancedMode.mode).toBe('advanced');
      expect(advancedMode.features.mixing).toBe('xyz');
      expect(advancedMode.features.optimization).toBe('pso');
      expect(advancedMode.features.interpolation).toBe('catmull-rom');
    });

    it('should support hybrid mode', () => {
      const hybridMode: CalculationMode = {
        mode: 'hybrid',
        features: {
          mixing: 'lab',
          optimization: 'pso',
          interpolation: 'linear',
          deltaE: 'E94',
        },
      };
      
      expect(hybridMode.mode).toBe('hybrid');
      expect(hybridMode.features.deltaE).toBe('E94');
    });
  });

  describe('SettingsValidation.validateCalculationOptions', () => {
    it('should validate valid options', () => {
      const validOptions: CalculationOptions = {
        maxInks: 4,
        includeWhite: true,
        use100: true,
        use70: true,
        use40: false,
        costWeight: 0.3,
        maxResults: 10,
      };
      
      expect(SettingsValidation.validateCalculationOptions(validOptions)).toBe(true);
    });

    it('should accept edge values', () => {
      const minOptions: CalculationOptions = {
        maxInks: 1,
        includeWhite: false,
        use100: true,
        use70: false,
        use40: false,
        costWeight: 0,
        maxResults: 1,
      };
      
      const maxOptions: CalculationOptions = {
        maxInks: 8,
        includeWhite: true,
        use100: true,
        use70: true,
        use40: true,
        costWeight: 1,
        maxResults: 100,
      };
      
      expect(SettingsValidation.validateCalculationOptions(minOptions)).toBe(true);
      expect(SettingsValidation.validateCalculationOptions(maxOptions)).toBe(true);
    });

    it('should reject invalid ink counts', () => {
      const tooFewInks: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        maxInks: 0,
      };
      
      const tooManyInks: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        maxInks: 9,
      };
      
      expect(SettingsValidation.validateCalculationOptions(tooFewInks)).toBe(false);
      expect(SettingsValidation.validateCalculationOptions(tooManyInks)).toBe(false);
    });

    it('should reject invalid cost weights', () => {
      const negativeCost: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        costWeight: -0.1,
      };
      
      const highCost: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        costWeight: 1.1,
      };
      
      expect(SettingsValidation.validateCalculationOptions(negativeCost)).toBe(false);
      expect(SettingsValidation.validateCalculationOptions(highCost)).toBe(false);
    });

    it('should require at least one concentration', () => {
      const noConcentrations: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        use100: false,
        use70: false,
        use40: false,
      };
      
      expect(SettingsValidation.validateCalculationOptions(noConcentrations)).toBe(false);
    });

    it('should reject invalid max results', () => {
      const zeroResults: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        maxResults: 0,
      };
      
      const tooManyResults: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        maxResults: 101,
      };
      
      expect(SettingsValidation.validateCalculationOptions(zeroResults)).toBe(false);
      expect(SettingsValidation.validateCalculationOptions(tooManyResults)).toBe(false);
    });

    it('should handle substrate Lab color', () => {
      const withSubstrate: CalculationOptions = {
        ...DEFAULT_SETTINGS.calculationOptions,
        substrateLab: { L: 95, a: 0, b: -2 },
      };
      
      expect(SettingsValidation.validateCalculationOptions(withSubstrate)).toBe(true);
    });
  });

  describe('SettingsValidation.validatePrinterProfile', () => {
    it('should validate valid printer profiles', () => {
      const validProfile: PrinterProfile = {
        id: 'offset-standard',
        name: 'Standard Offset',
        tacLimit: 300,
        dotGain: 15,
        inkLimit: {
          cyan: 100,
          magenta: 100,
          yellow: 100,
          black: 100,
        },
      };
      
      expect(SettingsValidation.validatePrinterProfile(validProfile)).toBe(true);
    });

    it('should accept different TAC limits', () => {
      const newspaper: PrinterProfile = {
        id: 'newspaper',
        name: 'Newspaper',
        tacLimit: 240,
        dotGain: 25,
        inkLimit: {},
      };
      
      const sheetFed: PrinterProfile = {
        id: 'sheet-fed',
        name: 'Sheet-fed Offset',
        tacLimit: 340,
        dotGain: 12,
        inkLimit: {},
      };
      
      const digitalPress: PrinterProfile = {
        id: 'digital',
        name: 'Digital Press',
        tacLimit: 400,
        dotGain: 5,
        inkLimit: {},
      };
      
      expect(SettingsValidation.validatePrinterProfile(newspaper)).toBe(true);
      expect(SettingsValidation.validatePrinterProfile(sheetFed)).toBe(true);
      expect(SettingsValidation.validatePrinterProfile(digitalPress)).toBe(true);
    });

    it('should reject invalid TAC limits', () => {
      const zeroTAC: PrinterProfile = {
        ...DEFAULT_SETTINGS.printerProfile,
        tacLimit: 0,
      };
      
      const excessiveTAC: PrinterProfile = {
        ...DEFAULT_SETTINGS.printerProfile,
        tacLimit: 401,
      };
      
      expect(SettingsValidation.validatePrinterProfile(zeroTAC)).toBe(false);
      expect(SettingsValidation.validatePrinterProfile(excessiveTAC)).toBe(false);
    });

    it('should reject invalid dot gain', () => {
      const negativeDotGain: PrinterProfile = {
        ...DEFAULT_SETTINGS.printerProfile,
        dotGain: -1,
      };
      
      const excessiveDotGain: PrinterProfile = {
        ...DEFAULT_SETTINGS.printerProfile,
        dotGain: 51,
      };
      
      expect(SettingsValidation.validatePrinterProfile(negativeDotGain)).toBe(false);
      expect(SettingsValidation.validatePrinterProfile(excessiveDotGain)).toBe(false);
    });

    it('should accept edge values', () => {
      const minProfile: PrinterProfile = {
        id: 'min',
        name: 'Minimum',
        tacLimit: 1,
        dotGain: 0,
        inkLimit: {},
      };
      
      const maxProfile: PrinterProfile = {
        id: 'max',
        name: 'Maximum',
        tacLimit: 400,
        dotGain: 50,
        inkLimit: {},
      };
      
      expect(SettingsValidation.validatePrinterProfile(minProfile)).toBe(true);
      expect(SettingsValidation.validatePrinterProfile(maxProfile)).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should create valid feature flags', () => {
      const features: FeatureFlags = {
        USE_XYZ_MIXING: true,
        USE_PSO_OPTIMIZER: false,
        USE_CATMULL_ROM: false,
        USE_KUBELKA_MUNK: true,
        ENABLE_CERTIFICATE: false,
        ENABLE_METALLIC: true,
        ENABLE_TAC_CHECK: true,
        ENABLE_DOT_GAIN: true,
        ENABLE_SUBSTRATE: false,
      };
      
      expect(features.USE_XYZ_MIXING).toBe(true);
      expect(features.USE_KUBELKA_MUNK).toBe(true);
      expect(features.ENABLE_METALLIC).toBe(true);
      expect(features.ENABLE_TAC_CHECK).toBe(true);
    });

    it('should support all features disabled', () => {
      const allDisabled: FeatureFlags = {
        USE_XYZ_MIXING: false,
        USE_PSO_OPTIMIZER: false,
        USE_CATMULL_ROM: false,
        USE_KUBELKA_MUNK: false,
        ENABLE_CERTIFICATE: false,
        ENABLE_METALLIC: false,
        ENABLE_TAC_CHECK: false,
        ENABLE_DOT_GAIN: false,
        ENABLE_SUBSTRATE: false,
      };
      
      Object.values(allDisabled).forEach(value => {
        expect(value).toBe(false);
      });
    });

    it('should support all features enabled', () => {
      const allEnabled: FeatureFlags = {
        USE_XYZ_MIXING: true,
        USE_PSO_OPTIMIZER: true,
        USE_CATMULL_ROM: true,
        USE_KUBELKA_MUNK: true,
        ENABLE_CERTIFICATE: true,
        ENABLE_METALLIC: true,
        ENABLE_TAC_CHECK: true,
        ENABLE_DOT_GAIN: true,
        ENABLE_SUBSTRATE: true,
      };
      
      Object.values(allEnabled).forEach(value => {
        expect(value).toBe(true);
      });
    });
  });

  describe('Vendor Profile', () => {
    it('should create valid vendor profiles', () => {
      const profile: VendorProfile = {
        id: 'vendor-001',
        name: 'Test Vendor Profile',
        company: 'Test Company',
        inkSystem: 'Custom Ink System',
        colorSpace: 'LAB',
      };
      
      expect(profile.id).toBe('vendor-001');
      expect(profile.company).toBe('Test Company');
      expect(profile.colorSpace).toBe('LAB');
    });

    it('should support calibration data', () => {
      const profile: VendorProfile = {
        id: 'calibrated',
        name: 'Calibrated Profile',
        company: 'Test Co',
        inkSystem: 'CMYK',
        colorSpace: 'XYZ',
        calibrationData: {
          whitePoint: { L: 100, a: 0, b: 0 },
          blackPoint: { L: 0, a: 0, b: 0 },
          primaryColors: {
            cyan: { L: 55, a: -37, b: -50 },
            magenta: { L: 48, a: 74, b: -3 },
            yellow: { L: 89, a: -5, b: 93 },
            black: { L: 0, a: 0, b: 0 },
          },
        },
      };
      
      expect(profile.calibrationData).toBeDefined();
      expect(profile.calibrationData?.whitePoint.L).toBe(100);
      expect(profile.calibrationData?.primaryColors.cyan).toBeDefined();
    });
  });

  describe('Default Settings', () => {
    it('should have valid default calculation options', () => {
      const options = DEFAULT_SETTINGS.calculationOptions;
      
      expect(options.maxInks).toBe(4);
      expect(options.includeWhite).toBe(false);
      expect(options.use100).toBe(true);
      expect(options.use70).toBe(true);
      expect(options.use40).toBe(false);
      expect(options.costWeight).toBe(0.3);
      expect(options.maxResults).toBe(10);
      
      expect(SettingsValidation.validateCalculationOptions(options)).toBe(true);
    });

    it('should have valid default Delta E weights', () => {
      const weights = DEFAULT_SETTINGS.deltaEWeights;
      
      expect(weights.kL).toBe(1.0);
      expect(weights.kC).toBe(1.0);
      expect(weights.kH).toBe(1.0);
    });

    it('should have valid default printer profile', () => {
      const profile = DEFAULT_SETTINGS.printerProfile;
      
      expect(profile.id).toBe('default');
      expect(profile.name).toBe('Standard Offset');
      expect(profile.tacLimit).toBe(300);
      expect(profile.dotGain).toBe(15);
      
      expect(SettingsValidation.validatePrinterProfile(profile)).toBe(true);
    });

    it('should be immutable', () => {
      // TypeScript const assertion ensures immutability
      // @ts-expect-error - Testing immutability
      expect(() => { DEFAULT_SETTINGS.calculationOptions.maxInks = 10; }).toThrow();
    });
  });
});