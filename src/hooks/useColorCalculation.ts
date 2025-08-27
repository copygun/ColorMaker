/**
 * Color Calculation Hook
 * 코어 모듈과 React를 연결하는 커스텀 훅
 */

import { useState, useCallback, useMemo } from 'react';
import type { 
  LabColor, 
  Recipe, 
  CalculationMode, 
  DeltaEWeights,
  DeltaEMethod,
  FeatureFlags 
} from '../types';

// 코어 모듈 import
import { ColorScience } from '../../core/colorScience.js';
import { inkDB, baseInks } from '../../core/inkDatabase.js';
import { MixingEngine } from '../../core/mixingEngine.js';
import { AdvancedMixingEngine } from '../../core/advancedMixingEngine.js';
import { OptimizedMixingEngine } from '../../core/optimizedMixingEngine.js';

interface UseColorCalculationOptions {
  mode?: CalculationMode;
  features?: FeatureFlags;
  deltaEWeights?: DeltaEWeights;
  deltaEMethod?: DeltaEMethod;
}

export function useColorCalculation(options: UseColorCalculationOptions = {}) {
  // 기본값 설정
  const defaultMode: CalculationMode = {
    mode: 'legacy',
    features: {
      mixing: 'lab',
      optimization: 'linear',
      interpolation: 'linear',
      deltaE: 'E00'
    }
  };

  const defaultFeatures: FeatureFlags = {
    USE_XYZ_MIXING: false,
    USE_PSO_OPTIMIZER: false,
    USE_CATMULL_ROM: false,
    USE_KUBELKA_MUNK: false,
    ENABLE_CERTIFICATE: false,
    ENABLE_METALLIC: false,
    ENABLE_TAC_CHECK: true,
    ENABLE_DOT_GAIN: true,    // 기본적으로 dot gain 보정 활성화
    ENABLE_SUBSTRATE: true    // 기본적으로 기질 영향 반영
  };

  const [calculationMode, setCalculationMode] = useState<CalculationMode>(
    options.mode || defaultMode
  );
  
  const [features, setFeatures] = useState<FeatureFlags>(
    options.features || defaultFeatures
  );

  const [deltaEWeights, setDeltaEWeights] = useState<DeltaEWeights>(
    options.deltaEWeights || { kL: 1, kC: 1, kH: 1 }
  );

  const [deltaEMethod, setDeltaEMethod] = useState<DeltaEMethod>(
    options.deltaEMethod || 'E00'
  );

  // Mixing Engine 인스턴스 생성
  const mixingEngine = useMemo(() => {
    // Advanced 모드나 Kubelka-Munk 활성화 시 고급 엔진 사용
    if (calculationMode.mode === 'advanced' || features.USE_KUBELKA_MUNK) {
      return new AdvancedMixingEngine({
        printMethod: 'offset',
        substrateType: 'white_coated',
        enableDotGain: true,
        enableSubstrate: true,
        enableKubelkaMunk: true
      });
    }
    
    return new MixingEngine({
      mode: features.USE_XYZ_MIXING ? 'xyz' : 'lab',
      interpolation: features.USE_CATMULL_ROM ? 'catmull-rom' : 'linear',
      illuminant: 'D50' // 인쇄 표준 D50 사용
    });
  }, [features.USE_XYZ_MIXING, features.USE_CATMULL_ROM, features.USE_KUBELKA_MUNK, calculationMode.mode]);

  // Delta E 계산 함수 선택
  const calculateDeltaE = useCallback((L1: number, a1: number, b1: number, 
                                       L2: number, a2: number, b2: number) => {
    switch (deltaEMethod) {
      case 'E00':
        return ColorScience.calculateDeltaE00(L1, a1, b1, L2, a2, b2, deltaEWeights);
      case 'E94':
        return ColorScience.calculateDeltaE94(L1, a1, b1, L2, a2, b2);
      case 'E76':
        return ColorScience.calculateDeltaE76(L1, a1, b1, L2, a2, b2);
      case 'CMC':
        return ColorScience.calculateDeltaECMC(L1, a1, b1, L2, a2, b2);
      default:
        return ColorScience.calculateDeltaE00(L1, a1, b1, L2, a2, b2, deltaEWeights);
    }
  }, [deltaEMethod, deltaEWeights]);

  // 최적화된 레시피 계산 함수 (모든 농도 고려)
  const calculateOptimizedRecipe = useCallback(async (
    targetColor: LabColor,
    options: {
      maxInks?: number;
      includeWhite?: boolean;
      use100?: boolean;
      use70?: boolean;
      use40?: boolean;
      costWeight?: number;
    } = {}
  ): Promise<Recipe> => {
    // 기본 옵션 설정
    const defaultOptions = {
      maxInks: 4,
      includeWhite: true,
      use100: true,
      use70: true,
      use40: true,
      costWeight: 0.2
    };
    const finalOptions = { ...defaultOptions, ...options };

    // 선택된 농도들
    const concentrations = [];
    if (finalOptions.use100) concentrations.push(100);
    if (finalOptions.use70) concentrations.push(70);
    if (finalOptions.use40) concentrations.push(40);

    if (concentrations.length === 0) {
      throw new Error('최소 하나의 농도를 선택해야 합니다');
    }

    // OptimizedMixingEngine 사용
    const optimizedEngine = new OptimizedMixingEngine();
    
    // 모든 가용 잉크를 고려한 최적 배합 찾기
    const result = optimizedEngine.findOptimalMix(targetColor, baseInks, {
      maxInks: finalOptions.maxInks,
      preferredConcentrations: concentrations,
      includeWhite: finalOptions.includeWhite,
      costWeight: finalOptions.costWeight
    });

    if (!result) {
      throw new Error('최적 배합을 찾을 수 없습니다');
    }

    // 결과 포맷팅
    const formatted = optimizedEngine.formatResult(result);
    
    // Recipe 객체 생성
    const recipe: Recipe = {
      target: targetColor,
      inks: formatted.inks.map((ink: any) => ({
        inkId: ink.baseInk || ink.id,
        ratio: ink.percentage,  // 이미 백분율이므로 그대로 사용
        concentration: ink.concentration
      })),
      mixed: formatted.achievedLab,
      deltaE: parseFloat(formatted.deltaE),
      method: 'optimized',
      optimization: 'all-concentrations'
    };

    return recipe;
  }, []);

  // 기존 레시피 계산 함수 (선택된 잉크만 사용)
  const calculateRecipe = useCallback(async (
    targetColor: LabColor,
    selectedInkIds: string[],
    profileId: string = 'offset',
    printSettings: { printMethod?: string; substrateType?: string } = {}
  ): Promise<Recipe> => {
    // 선택된 잉크 데이터 가져오기
    const selectedInks = selectedInkIds.map(id => {
      const ink = inkDB.getInkById(id);
      if (!ink) throw new Error(`Ink ${id} not found`);
      return inkDB.getInkLab(id, 100); // 기본 100% 농도
    });

    let result;
    
    try {
      // 고급 모드 또는 하이브리드 모드
      if (calculationMode.mode === 'advanced' || 
          (calculationMode.mode === 'hybrid' && features.USE_PSO_OPTIMIZER)) {
        // Advanced mixing engine에 인쇄 설정 전달
        if ('updateSettings' in mixingEngine && typeof mixingEngine.updateSettings === 'function') {
          mixingEngine.updateSettings({
            printMethod: printSettings.printMethod || 'offset',
            substrateType: printSettings.substrateType || 'white_coated'
          });
        }
        
        // PSO 최적화 사용 (추후 구현)
        result = await mixingEngine.optimize(targetColor, selectedInks, {
          method: 'pso',
          maxIterations: 500,
          ...printSettings
        });
      } else {
        // 기존 simple 최적화 사용
        result = mixingEngine.optimize(targetColor, selectedInks, {
          method: 'simple',
          maxIterations: 100,
          ...printSettings
        });
      }
    } catch (error) {
      console.warn('Optimization failed, falling back to simple method', error);
      // 폴백: simple 최적화
      result = mixingEngine.optimize(targetColor, selectedInks, {
        method: 'simple',
        maxIterations: 100,
        ...printSettings
      });
    }

    // TAC 검증 (활성화된 경우)
    if (features.ENABLE_TAC_CHECK) {
      const tacValidation = inkDB.validateTAC(
        Object.fromEntries(
          selectedInkIds.map((id, i) => [id, result.ratios[i] * 100])
        ),
        profileId
      );

      if (!tacValidation.valid) {
        console.warn(`TAC limit exceeded: ${tacValidation.tac}% > ${tacValidation.limit}%`);
        // TAC 조정 로직 (추후 구현)
      }
    }

    // Recipe 객체 생성
    const recipe: Recipe = {
      target: targetColor,
      inks: selectedInkIds.map((id, i) => ({
        inkId: id,
        ratio: result.ratios[i] * 100,  // 0-1 범위를 백분율로 변환
        concentration: 100
      })),
      mixed: result.mixed,
      deltaE: result.deltaE,
      method: features.USE_XYZ_MIXING ? 'xyz' : 'lab',
      optimization: features.USE_PSO_OPTIMIZER ? 'pso' : 'simple'
    };

    return recipe;
  }, [calculationMode, features, mixingEngine]);

  // A/B 테스트: 두 방법 비교
  const compareCalculations = useCallback(async (
    targetColor: LabColor,
    selectedInkIds: string[]
  ) => {
    // Legacy 방식
    const legacyEngine = new MixingEngine({ mode: 'lab', interpolation: 'linear' });
    const legacyResult = legacyEngine.optimize(targetColor, 
      selectedInkIds.map(id => inkDB.getInkLab(id, 100)), 
      { method: 'simple' }
    );

    // Modern 방식
    const modernEngine = new MixingEngine({ mode: 'xyz', interpolation: 'catmull-rom' });
    const modernResult = modernEngine.optimize(targetColor,
      selectedInkIds.map(id => inkDB.getInkLab(id, 100)),
      { method: 'simple' }
    );

    return {
      legacy: {
        mixed: legacyResult.mixed,
        deltaE: legacyResult.deltaE,
        ratios: legacyResult.ratios
      },
      modern: {
        mixed: modernResult.mixed,
        deltaE: modernResult.deltaE,
        ratios: modernResult.ratios
      },
      difference: Math.abs(legacyResult.deltaE - modernResult.deltaE),
      recommendation: legacyResult.deltaE <= modernResult.deltaE ? 'legacy' : 'modern'
    };
  }, []);

  // 모드 전환
  const switchMode = useCallback((newMode: 'legacy' | 'advanced' | 'hybrid') => {
    setCalculationMode(prev => ({
      ...prev,
      mode: newMode
    }));

    // 모드에 따른 기능 자동 설정
    if (newMode === 'legacy') {
      setFeatures({
        ...defaultFeatures,
        USE_XYZ_MIXING: false,
        USE_PSO_OPTIMIZER: false,
        USE_CATMULL_ROM: false,
        USE_KUBELKA_MUNK: false,
        ENABLE_DOT_GAIN: false,
        ENABLE_SUBSTRATE: false
      });
    } else if (newMode === 'advanced') {
      setFeatures({
        ...defaultFeatures,
        USE_XYZ_MIXING: true,
        USE_PSO_OPTIMIZER: true,
        USE_CATMULL_ROM: true,
        USE_KUBELKA_MUNK: true,    // 고급 모드에서 Kubelka-Munk 활성화
        ENABLE_TAC_CHECK: true,
        ENABLE_DOT_GAIN: true,      // Dot gain 보정 활성화
        ENABLE_SUBSTRATE: true      // 기질 영향 반영
      });
    }
    // hybrid는 사용자가 개별 기능 토글 가능
  }, []);

  // 기능 토글
  const toggleFeature = useCallback((feature: keyof FeatureFlags) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  }, []);

  // 잉크 데이터베이스 가져오기 (LocalStorage 지원)
  const getInkDatabase = useCallback(() => {
    // LocalStorage에서 커스텀 값 확인
    const customValues = localStorage.getItem('customInkValues');
    if (customValues) {
      try {
        const parsed = JSON.parse(customValues);
        if (parsed.baseInks) {
          // 기존 잉크 업데이트
          parsed.baseInks.forEach((customInk: any) => {
            const index = inkDB.baseInks.findIndex((ink: any) => ink.id === customInk.id);
            if (index !== -1) {
              inkDB.baseInks[index] = customInk;
            }
          });
        }
        if (parsed.metallicInks) {
          // 메탈릭 잉크 업데이트
          parsed.metallicInks.forEach((customInk: any) => {
            const index = inkDB.metallicInks.findIndex((ink: any) => ink.id === customInk.id);
            if (index !== -1) {
              inkDB.metallicInks[index] = customInk;
            }
          });
        }
      } catch (e) {
        console.error('Failed to load custom ink values:', e);
      }
    }
    return inkDB;
  }, []);

  return {
    // 상태
    calculationMode,
    features,
    deltaEWeights,
    deltaEMethod,

    // 함수
    calculateRecipe,
    calculateOptimizedRecipe,  // 모든 농도를 고려한 최적화 레시피
    calculateDeltaE,
    compareCalculations,
    switchMode,
    toggleFeature,
    setDeltaEWeights,
    setDeltaEMethod,

    // 유틸리티
    labToRgb: ColorScience.labToRgb,
    isValidLabColor: ColorScience.isValidLabColor,
    getInkDatabase
  };
}