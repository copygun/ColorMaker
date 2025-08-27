/**
 * Type definitions for core JavaScript modules
 * This allows TypeScript to understand the core module exports
 */

declare module '@core/colorScience.js' {
  export interface RGB {
    r: number;
    g: number;
    b: number;
  }

  export interface XYZ {
    X: number;
    Y: number;
    Z: number;
  }

  export class ColorScience {
    static labToRgb(L: number, a: number, b: number): RGB;
    static rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number };
    static labToXyz(L: number, a: number, b: number): XYZ;
    static xyzToLab(X: number, Y: number, Z: number, illuminant?: string): { L: number; a: number; b: number };
    static xyzToRgb(X: number, Y: number, Z: number): RGB;
    static rgbToXyz(r: number, g: number, b: number): XYZ;
    static calculateDeltaE00(L1: number, a1: number, b1: number, L2: number, a2: number, b2: number): number;
    static calculateDeltaE76(L1: number, a1: number, b1: number, L2: number, a2: number, b2: number): number;
    static mixLabColors(colors: Array<{ L: number; a: number; b: number }>, ratios: number[]): { L: number; a: number; b: number };
    static mixXyzColors(colors: XYZ[], ratios: number[]): XYZ;
  }
}

declare module '@core/inkDatabase.js' {
  export interface Ink {
    id: string;
    name: string;
    type: 'basic' | 'spot' | 'metallic' | 'fluorescent' | 'white' | 'medium';
    L: number;
    a: number;
    b: number;
    concentrations?: {
      100?: { L: number; a: number; b: number };
      70?: { L: number; a: number; b: number };
      40?: { L: number; a: number; b: number };
    };
    cost?: number;
    opacity?: number;
    pantone?: string;
  }

  export const inkDB: Ink[];
  export const baseInks: Ink[];
  export const metallicInks: Ink[];
  export const specialInks: Ink[];
}

declare module '@core/mixingEngine.js' {
  import { Ink } from '@core/inkDatabase.js';
  
  export interface MixResult {
    inks: Ink[];
    ratios: number[];
    mixed: { L: number; a: number; b: number };
    deltaE: number;
  }

  export class MixingEngine {
    constructor();
    calculateMix(
      targetLab: { L: number; a: number; b: number },
      selectedInks: string[],
      options?: {
        maxIterations?: number;
        tolerance?: number;
        weights?: { L?: number; a?: number; b?: number };
      }
    ): MixResult;
    mixColors(inks: Ink[], ratios: number[]): { L: number; a: number; b: number };
  }
}

declare module '@core/advancedMixingEngine.js' {
  import { MixingEngine, MixResult } from '@core/mixingEngine.js';
  
  export class AdvancedMixingEngine extends MixingEngine {
    useXYZMixing: boolean;
    usePSOptimizer: boolean;
    useCatmullRom: boolean;
    
    calculateAdvancedMix(
      targetLab: { L: number; a: number; b: number },
      selectedInks: string[],
      options?: any
    ): MixResult;
  }

  export class KubelkaMunkModel {
    constructor();
    predict(
      colors: Array<{ L: number; a: number; b: number }>,
      ratios: number[]
    ): { L: number; a: number; b: number };
  }
}

declare module '@core/optimizedMixingEngine.js' {
  import { Ink } from '@core/inkDatabase.js';
  
  export interface OptimizedResult {
    inks: Array<Ink & { concentration?: number; percentage?: number; ratio?: number }>;
    ratios: number[];
    mixedLab: { L: number; a: number; b: number };
    deltaE: number;
    cost?: number;
    quality?: string;
  }

  export class OptimizedMixingEngine {
    constructor();
    findOptimalMix(
      targetLab: { L: number; a: number; b: number },
      inkDatabase: Ink[],
      options: {
        maxInks?: number;
        preferredConcentrations?: number[];
        includeWhite?: boolean;
        costWeight?: number;
      }
    ): OptimizedResult;
    formatResult(result: OptimizedResult): {
      deltaE: string;
      quality: string;
      cost: string;
      recipe: Array<{
        name: string;
        concentration: number;
        percentage: string;
      }>;
    };
  }
}

declare module '@core/pantoneDatabase.js' {
  export interface PantoneColor {
    id: string;
    name: string;
    hex: string;
    lab: { L: number; a: number; b: number };
    cmyk?: { c: number; m: number; y: number; k: number };
  }

  export const pantoneDB: PantoneColor[];
}

declare module '@core/correctionEngine.js' {
  export interface CorrectionSuggestion {
    name: string;
    type: string;
    currentAmount: number;
    addAmount: number;
    expectedImprovement: number;
  }

  export default class CorrectionEngine {
    constructor();
    analyzeAndSuggest(
      targetLab: { L: number; a: number; b: number },
      actualLab: { L: number; a: number; b: number },
      currentRecipe: any,
      inkDatabase: any[]
    ): {
      deltaE: number;
      analysis: {
        brightnessError: number;
        redGreenError: number;
        yellowBlueError: number;
      };
      suggestions: CorrectionSuggestion[];
    };
  }
}