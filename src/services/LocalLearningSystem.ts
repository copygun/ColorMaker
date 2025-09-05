/**
 * 로컬 학습 시스템
 * 실측 데이터를 기반으로 계산 정확도를 개선하는 자체 학습 시스템
 */

import type { LabColor, Recipe } from '../types';

export interface PrintResult {
  id: string;
  recipeId: string;
  recipeName?: string;
  predictedLab: LabColor;
  actualLab: LabColor;
  deltaE: number;
  recipe: {
    inks: Array<{
      inkId: string;
      name: string;
      ratio: number;
      concentration: number;
    }>;
    totalAmount: number;
  };
  printConditions: {
    substrate: string;
    printMethod: string;
    meshCount?: number;
    squeegeeAngle?: number;
    pressure?: number;
    temperature?: number;
    humidity?: number;
    dotGain?: number;
    inkBrand?: string;
    notes?: string;
  };
  timestamp: string;
  isValid: boolean;
}

export interface CalibrationProfile {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dataPoints: number;
  averageDeltaE: number;
  
  // 전역 보정 계수
  globalBias: {
    L: number;
    a: number;
    b: number;
  };
  
  // 잉크별 보정 계수
  inkCorrections: Map<string, {
    concentrationFactors: {
      100: number;
      70: number;
      40: number;
    };
    colorShift: {
      L: number;
      a: number;
      b: number;
    };
  }>;
  
  // 색상 범위별 보정
  colorRangeCorrections: Array<{
    range: {
      minL: number;
      maxL: number;
      minA: number;
      maxA: number;
      minB: number;
      maxB: number;
    };
    correction: {
      L: number;
      a: number;
      b: number;
    };
    confidence: number;
  }>;
  
  // 신뢰도 메트릭
  confidence: {
    overall: number;
    byInk: Map<string, number>;
    byColorRange: Map<string, number>;
  };
}

export interface DeviationPattern {
  type: 'systematic' | 'ink-specific' | 'concentration-specific' | 'color-range';
  description: string;
  affectedInks?: string[];
  correction: {
    L?: number;
    a?: number;
    b?: number;
    factor?: number;
  };
  confidence: number;
  sampleSize: number;
}

class LocalLearningSystem {
  private readonly STORAGE_KEY = 'printResults';
  private readonly PROFILE_KEY = 'calibrationProfiles';
  private readonly ACTIVE_PROFILE_KEY = 'activeCalibrationProfile';
  private readonly MIN_SAMPLES_FOR_LEARNING = 5;
  private readonly OUTLIER_THRESHOLD = 3.0; // 표준편차 기준
  
  /**
   * 실측 결과 저장
   */
  savePrintResult(result: Omit<PrintResult, 'id' | 'timestamp'>): PrintResult {
    const printResult: PrintResult = {
      ...result,
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      isValid: this.validateResult(result)
    };
    
    const results = this.getAllPrintResults();
    results.push(printResult);
    
    // 최대 1000개까지만 저장 (오래된 것부터 삭제)
    if (results.length > 1000) {
      results.splice(0, results.length - 1000);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(results));
    
    // 자동 학습 트리거
    if (results.length % 10 === 0) {
      this.analyzeAndLearn();
    }
    
    return printResult;
  }
  
  /**
   * 모든 실측 결과 조회
   */
  getAllPrintResults(): PrintResult[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * 특정 레시피의 실측 결과 조회
   */
  getResultsByRecipe(recipeId: string): PrintResult[] {
    return this.getAllPrintResults().filter(r => r.recipeId === recipeId);
  }
  
  /**
   * 편차 분석 및 학습
   */
  analyzeAndLearn(): DeviationPattern[] {
    const results = this.getAllPrintResults().filter(r => r.isValid);
    
    if (results.length < this.MIN_SAMPLES_FOR_LEARNING) {
      return [];
    }
    
    const patterns: DeviationPattern[] = [];
    
    // 1. 전체적인 체계적 편차 분석
    const systematicBias = this.analyzeSystematicBias(results);
    if (systematicBias) patterns.push(systematicBias);
    
    // 2. 잉크별 편차 분석
    const inkPatterns = this.analyzeInkSpecificPatterns(results);
    patterns.push(...inkPatterns);
    
    // 3. 농도별 편차 분석
    const concentrationPatterns = this.analyzeConcentrationPatterns(results);
    patterns.push(...concentrationPatterns);
    
    // 4. 색상 범위별 편차 분석
    const colorRangePatterns = this.analyzeColorRangePatterns(results);
    patterns.push(...colorRangePatterns);
    
    // 학습 결과를 프로파일에 반영
    if (patterns.length > 0) {
      this.updateCalibrationProfile(patterns);
    }
    
    return patterns;
  }
  
  /**
   * 체계적 편차 분석
   */
  private analyzeSystematicBias(results: PrintResult[]): DeviationPattern | null {
    const deviations = results.map(r => ({
      dL: r.actualLab.L - r.predictedLab.L,
      da: r.actualLab.a - r.predictedLab.a,
      db: r.actualLab.b - r.predictedLab.b
    }));
    
    const avgDeviation = {
      L: deviations.reduce((sum, d) => sum + d.dL, 0) / deviations.length,
      a: deviations.reduce((sum, d) => sum + d.da, 0) / deviations.length,
      b: deviations.reduce((sum, d) => sum + d.db, 0) / deviations.length
    };
    
    // 표준편차 계산
    const stdDev = {
      L: Math.sqrt(deviations.reduce((sum, d) => sum + Math.pow(d.dL - avgDeviation.L, 2), 0) / deviations.length),
      a: Math.sqrt(deviations.reduce((sum, d) => sum + Math.pow(d.da - avgDeviation.a, 2), 0) / deviations.length),
      b: Math.sqrt(deviations.reduce((sum, d) => sum + Math.pow(d.db - avgDeviation.b, 2), 0) / deviations.length)
    };
    
    // 유의미한 체계적 편차가 있는지 확인
    const threshold = 0.5;
    if (Math.abs(avgDeviation.L) > threshold || 
        Math.abs(avgDeviation.a) > threshold || 
        Math.abs(avgDeviation.b) > threshold) {
      
      return {
        type: 'systematic',
        description: `전체적으로 L:${avgDeviation.L.toFixed(2)}, a:${avgDeviation.a.toFixed(2)}, b:${avgDeviation.b.toFixed(2)} 편차 발견`,
        correction: {
          L: -avgDeviation.L,
          a: -avgDeviation.a,
          b: -avgDeviation.b
        },
        confidence: 1 - (stdDev.L + stdDev.a + stdDev.b) / 30, // 신뢰도 계산
        sampleSize: results.length
      };
    }
    
    return null;
  }
  
  /**
   * 잉크별 패턴 분석
   */
  private analyzeInkSpecificPatterns(results: PrintResult[]): DeviationPattern[] {
    const patterns: DeviationPattern[] = [];
    const inkDeviations = new Map<string, Array<{dL: number, da: number, db: number}>>();
    
    // 잉크별로 편차 수집
    results.forEach(result => {
      result.recipe.inks.forEach(ink => {
        if (!inkDeviations.has(ink.inkId)) {
          inkDeviations.set(ink.inkId, []);
        }
        
        // 해당 잉크의 기여도에 비례한 편차 계산
        const contribution = ink.ratio / result.recipe.totalAmount;
        inkDeviations.get(ink.inkId)!.push({
          dL: (result.actualLab.L - result.predictedLab.L) * contribution,
          da: (result.actualLab.a - result.predictedLab.a) * contribution,
          db: (result.actualLab.b - result.predictedLab.b) * contribution
        });
      });
    });
    
    // 각 잉크별 평균 편차 계산
    inkDeviations.forEach((deviations, inkId) => {
      if (deviations.length >= 3) {
        const avgDev = {
          L: deviations.reduce((sum, d) => sum + d.dL, 0) / deviations.length,
          a: deviations.reduce((sum, d) => sum + d.da, 0) / deviations.length,
          b: deviations.reduce((sum, d) => sum + d.db, 0) / deviations.length
        };
        
        const magnitude = Math.sqrt(avgDev.L**2 + avgDev.a**2 + avgDev.b**2);
        
        if (magnitude > 0.3) {
          patterns.push({
            type: 'ink-specific',
            description: `${inkId} 잉크 색상 편차`,
            affectedInks: [inkId],
            correction: {
              L: -avgDev.L,
              a: -avgDev.a,
              b: -avgDev.b
            },
            confidence: Math.min(deviations.length / 10, 1),
            sampleSize: deviations.length
          });
        }
      }
    });
    
    return patterns;
  }
  
  /**
   * 농도별 패턴 분석
   */
  private analyzeConcentrationPatterns(results: PrintResult[]): DeviationPattern[] {
    const patterns: DeviationPattern[] = [];
    const concentrationGroups = new Map<number, PrintResult[]>();
    
    // 농도별로 그룹화
    results.forEach(result => {
      const concentrations = [...new Set(result.recipe.inks.map(ink => ink.concentration))];
      concentrations.forEach(conc => {
        if (!concentrationGroups.has(conc)) {
          concentrationGroups.set(conc, []);
        }
        concentrationGroups.get(conc)!.push(result);
      });
    });
    
    // 각 농도별 편차 분석
    concentrationGroups.forEach((group, concentration) => {
      if (group.length >= 3) {
        const avgDeltaE = group.reduce((sum, r) => sum + r.deltaE, 0) / group.length;
        const baselineAvg = results.reduce((sum, r) => sum + r.deltaE, 0) / results.length;
        
        if (Math.abs(avgDeltaE - baselineAvg) > 1.0) {
          patterns.push({
            type: 'concentration-specific',
            description: `${concentration}% 농도에서 평균 ${(avgDeltaE - baselineAvg).toFixed(2)} 높은 오차`,
            correction: {
              factor: baselineAvg / avgDeltaE
            },
            confidence: Math.min(group.length / 10, 1),
            sampleSize: group.length
          });
        }
      }
    });
    
    return patterns;
  }
  
  /**
   * 색상 범위별 패턴 분석
   */
  private analyzeColorRangePatterns(results: PrintResult[]): DeviationPattern[] {
    const patterns: DeviationPattern[] = [];
    
    // 색상 공간을 구역으로 나누기
    const colorRanges = [
      { name: 'dark', minL: 0, maxL: 30 },
      { name: 'mid', minL: 30, maxL: 70 },
      { name: 'light', minL: 70, maxL: 100 },
      { name: 'red', minA: 20, maxA: 80 },
      { name: 'green', minA: -80, maxA: -20 },
      { name: 'yellow', minB: 20, maxB: 80 },
      { name: 'blue', minB: -80, maxB: -20 }
    ];
    
    colorRanges.forEach(range => {
      const inRange = results.filter(r => {
        const lab = r.predictedLab;
        return (range.minL === undefined || lab.L >= range.minL) &&
               (range.maxL === undefined || lab.L <= range.maxL) &&
               (range.minA === undefined || lab.a >= range.minA) &&
               (range.maxA === undefined || lab.a <= range.maxA) &&
               (range.minB === undefined || lab.b >= range.minB) &&
               (range.maxB === undefined || lab.b <= range.maxB);
      });
      
      if (inRange.length >= 3) {
        const avgDev = {
          L: inRange.reduce((sum, r) => sum + (r.actualLab.L - r.predictedLab.L), 0) / inRange.length,
          a: inRange.reduce((sum, r) => sum + (r.actualLab.a - r.predictedLab.a), 0) / inRange.length,
          b: inRange.reduce((sum, r) => sum + (r.actualLab.b - r.predictedLab.b), 0) / inRange.length
        };
        
        const magnitude = Math.sqrt(avgDev.L**2 + avgDev.a**2 + avgDev.b**2);
        
        if (magnitude > 0.5) {
          patterns.push({
            type: 'color-range',
            description: `${range.name} 영역에서 색상 편차`,
            correction: {
              L: -avgDev.L,
              a: -avgDev.a,
              b: -avgDev.b
            },
            confidence: Math.min(inRange.length / 5, 1),
            sampleSize: inRange.length
          });
        }
      }
    });
    
    return patterns;
  }
  
  /**
   * 보정 프로파일 업데이트
   */
  private updateCalibrationProfile(patterns: DeviationPattern[]): void {
    const profileId = this.getActiveProfileId() || this.createNewProfile();
    const profile = this.getCalibrationProfile(profileId);
    
    if (!profile) return;
    
    // 패턴을 프로파일에 반영
    patterns.forEach(pattern => {
      switch (pattern.type) {
        case 'systematic':
          if (pattern.correction.L !== undefined) {
            profile.globalBias.L = pattern.correction.L * 0.7 + profile.globalBias.L * 0.3;
          }
          if (pattern.correction.a !== undefined) {
            profile.globalBias.a = pattern.correction.a * 0.7 + profile.globalBias.a * 0.3;
          }
          if (pattern.correction.b !== undefined) {
            profile.globalBias.b = pattern.correction.b * 0.7 + profile.globalBias.b * 0.3;
          }
          break;
          
        case 'ink-specific':
          if (pattern.affectedInks) {
            pattern.affectedInks.forEach(inkId => {
              const existing = profile.inkCorrections.get(inkId) || {
                concentrationFactors: { 100: 1, 70: 1, 40: 1 },
                colorShift: { L: 0, a: 0, b: 0 }
              };
              
              if (pattern.correction.L !== undefined) {
                existing.colorShift.L = pattern.correction.L * 0.5 + existing.colorShift.L * 0.5;
              }
              if (pattern.correction.a !== undefined) {
                existing.colorShift.a = pattern.correction.a * 0.5 + existing.colorShift.a * 0.5;
              }
              if (pattern.correction.b !== undefined) {
                existing.colorShift.b = pattern.correction.b * 0.5 + existing.colorShift.b * 0.5;
              }
              
              profile.inkCorrections.set(inkId, existing);
            });
          }
          break;
      }
    });
    
    profile.updatedAt = new Date().toISOString();
    profile.dataPoints = this.getAllPrintResults().length;
    
    // 평균 Delta E 업데이트
    const validResults = this.getAllPrintResults().filter(r => r.isValid);
    if (validResults.length > 0) {
      profile.averageDeltaE = validResults.reduce((sum, r) => sum + r.deltaE, 0) / validResults.length;
    }
    
    this.saveCalibrationProfile(profile);
  }
  
  /**
   * 보정된 색상 계산
   */
  applyCorrectionToColor(color: LabColor, recipeInks?: Array<{inkId: string, ratio: number}>): LabColor {
    const profileId = this.getActiveProfileId();
    if (!profileId) return color;
    
    const profile = this.getCalibrationProfile(profileId);
    if (!profile) return color;
    
    let correctedColor = { ...color };
    
    // 전역 보정 적용
    correctedColor.L += profile.globalBias.L;
    correctedColor.a += profile.globalBias.a;
    correctedColor.b += profile.globalBias.b;
    
    // 잉크별 보정 적용
    if (recipeInks) {
      const totalRatio = recipeInks.reduce((sum, ink) => sum + ink.ratio, 0);
      
      recipeInks.forEach(ink => {
        const correction = profile.inkCorrections.get(ink.inkId);
        if (correction) {
          const weight = ink.ratio / totalRatio;
          correctedColor.L += correction.colorShift.L * weight;
          correctedColor.a += correction.colorShift.a * weight;
          correctedColor.b += correction.colorShift.b * weight;
        }
      });
    }
    
    // 색상 범위별 보정 적용
    const rangeCorrection = profile.colorRangeCorrections.find(rc => 
      color.L >= rc.range.minL && color.L <= rc.range.maxL &&
      color.a >= rc.range.minA && color.a <= rc.range.maxA &&
      color.b >= rc.range.minB && color.b <= rc.range.maxB
    );
    
    if (rangeCorrection && rangeCorrection.confidence > 0.5) {
      correctedColor.L += rangeCorrection.correction.L * rangeCorrection.confidence;
      correctedColor.a += rangeCorrection.correction.a * rangeCorrection.confidence;
      correctedColor.b += rangeCorrection.correction.b * rangeCorrection.confidence;
    }
    
    return correctedColor;
  }
  
  /**
   * 보정 프로파일 관리
   */
  createNewProfile(name?: string): string {
    const profile: CalibrationProfile = {
      id: this.generateId(),
      name: name || `프로파일 ${new Date().toLocaleDateString()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataPoints: 0,
      averageDeltaE: 0,
      globalBias: { L: 0, a: 0, b: 0 },
      inkCorrections: new Map(),
      colorRangeCorrections: [],
      confidence: {
        overall: 0,
        byInk: new Map(),
        byColorRange: new Map()
      }
    };
    
    this.saveCalibrationProfile(profile);
    this.setActiveProfile(profile.id);
    
    return profile.id;
  }
  
  getCalibrationProfile(id: string): CalibrationProfile | null {
    const profiles = this.getAllProfiles();
    return profiles.find(p => p.id === id) || null;
  }
  
  getAllProfiles(): CalibrationProfile[] {
    try {
      const stored = localStorage.getItem(this.PROFILE_KEY);
      if (!stored) return [];
      
      const profiles = JSON.parse(stored);
      // Map 객체 복원
      return profiles.map((p: any) => ({
        ...p,
        inkCorrections: new Map(p.inkCorrections),
        confidence: {
          ...p.confidence,
          byInk: new Map(p.confidence.byInk),
          byColorRange: new Map(p.confidence.byColorRange)
        }
      }));
    } catch {
      return [];
    }
  }
  
  saveCalibrationProfile(profile: CalibrationProfile): void {
    const profiles = this.getAllProfiles().filter(p => p.id !== profile.id);
    
    // Map 객체를 배열로 변환하여 저장
    const serializable = {
      ...profile,
      inkCorrections: Array.from(profile.inkCorrections.entries()),
      confidence: {
        ...profile.confidence,
        byInk: Array.from(profile.confidence.byInk.entries()),
        byColorRange: Array.from(profile.confidence.byColorRange.entries())
      }
    };
    
    profiles.push(serializable as any);
    localStorage.setItem(this.PROFILE_KEY, JSON.stringify(profiles));
  }
  
  getActiveProfileId(): string | null {
    return localStorage.getItem(this.ACTIVE_PROFILE_KEY);
  }
  
  setActiveProfile(profileId: string): void {
    localStorage.setItem(this.ACTIVE_PROFILE_KEY, profileId);
  }
  
  /**
   * 데이터 내보내기/가져오기
   */
  exportData(): string {
    const data = {
      printResults: this.getAllPrintResults(),
      calibrationProfiles: this.getAllProfiles(),
      activeProfile: this.getActiveProfileId(),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    return JSON.stringify(data, null, 2);
  }
  
  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.printResults) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.printResults));
      }
      
      if (data.calibrationProfiles) {
        localStorage.setItem(this.PROFILE_KEY, JSON.stringify(data.calibrationProfiles));
      }
      
      if (data.activeProfile) {
        localStorage.setItem(this.ACTIVE_PROFILE_KEY, data.activeProfile);
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * 통계 정보
   */
  getStatistics() {
    const results = this.getAllPrintResults();
    const validResults = results.filter(r => r.isValid);
    
    if (validResults.length === 0) {
      return null;
    }
    
    const deltaEs = validResults.map(r => r.deltaE);
    const avgDeltaE = deltaEs.reduce((sum, de) => sum + de, 0) / deltaEs.length;
    const minDeltaE = Math.min(...deltaEs);
    const maxDeltaE = Math.max(...deltaEs);
    
    // 표준편차
    const variance = deltaEs.reduce((sum, de) => sum + Math.pow(de - avgDeltaE, 2), 0) / deltaEs.length;
    const stdDev = Math.sqrt(variance);
    
    // 성공률 (Delta E < 2.0 기준)
    const successRate = deltaEs.filter(de => de < 2.0).length / deltaEs.length * 100;
    
    return {
      totalSamples: results.length,
      validSamples: validResults.length,
      averageDeltaE: avgDeltaE,
      minDeltaE: minDeltaE,
      maxDeltaE: maxDeltaE,
      stdDeviation: stdDev,
      successRate: successRate,
      lastUpdated: results[results.length - 1]?.timestamp || null
    };
  }
  
  /**
   * 유틸리티 함수들
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private validateResult(result: Partial<PrintResult>): boolean {
    if (!result.predictedLab || !result.actualLab) return false;
    if (!result.recipe || result.recipe.inks.length === 0) return false;
    if (result.deltaE === undefined || result.deltaE < 0) return false;
    
    // 이상치 검출 (Delta E > 30은 측정 오류 가능성)
    if (result.deltaE > 30) return false;
    
    return true;
  }
  
  /**
   * 학습 리셋
   */
  resetLearning(): void {
    if (confirm('모든 학습 데이터와 보정 프로파일이 삭제됩니다. 계속하시겠습니까?')) {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.PROFILE_KEY);
      localStorage.removeItem(this.ACTIVE_PROFILE_KEY);
    }
  }
}

export const learningSystem = new LocalLearningSystem();