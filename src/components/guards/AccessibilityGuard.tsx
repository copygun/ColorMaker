// Decision: Accessibility monitoring with contrast validation and alerts
// Architecture: WCAG compliance checking with user notifications

import React, { useState, useEffect, useCallback } from 'react';
import { LabColor, RGBColor } from '../../core/domain/color';
import { ColorConverter } from '../../core/services/colorConverter';
import { DeltaEService } from '../../core/services/deltaE';
import { useToast } from '../notifications/Toast';
import { logger } from '../../core/logging/logger';

/**
 * WCAG contrast levels
 */
export enum ContrastLevel {
  AA_NORMAL = 4.5,
  AA_LARGE = 3,
  AAA_NORMAL = 7,
  AAA_LARGE = 4.5
}

/**
 * Accessibility issue types
 */
export type AccessibilityIssue = 
  | 'low-contrast'
  | 'color-blind'
  | 'motion-sensitive'
  | 'keyboard-navigation'
  | 'screen-reader';

/**
 * Accessibility check result
 */
export interface AccessibilityCheckResult {
  passed: boolean;
  issues: AccessibilityIssue[];
  suggestions: string[];
  contrastRatio?: number;
  wcagLevel?: 'AA' | 'AAA' | 'Fail';
}

/**
 * Color blindness types
 */
export enum ColorBlindnessType {
  PROTANOPIA = 'protanopia',     // Red-blind
  DEUTERANOPIA = 'deuteranopia', // Green-blind
  TRITANOPIA = 'tritanopia',     // Blue-blind
  ACHROMATOPSIA = 'achromatopsia' // Total color blindness
}

/**
 * Accessibility utilities
 */
export class AccessibilityUtils {
  /**
   * Calculate luminance
   */
  static getLuminance(rgb: RGBColor): number {
    const sRGB = [rgb.r, rgb.g, rgb.b].map(val => {
      val = val / 255;
      return val <= 0.03928
        ? val / 12.92
        : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }
  
  /**
   * Calculate contrast ratio
   */
  static getContrastRatio(color1: RGBColor, color2: RGBColor): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  /**
   * Check WCAG compliance
   */
  static checkWCAGCompliance(
    foreground: RGBColor,
    background: RGBColor,
    isLargeText: boolean = false
  ): AccessibilityCheckResult {
    const ratio = this.getContrastRatio(foreground, background);
    
    const result: AccessibilityCheckResult = {
      passed: false,
      issues: [],
      suggestions: [],
      contrastRatio: ratio,
      wcagLevel: 'Fail'
    };
    
    // Check compliance levels
    if (isLargeText) {
      if (ratio >= ContrastLevel.AAA_LARGE) {
        result.wcagLevel = 'AAA';
        result.passed = true;
      } else if (ratio >= ContrastLevel.AA_LARGE) {
        result.wcagLevel = 'AA';
        result.passed = true;
      }
    } else {
      if (ratio >= ContrastLevel.AAA_NORMAL) {
        result.wcagLevel = 'AAA';
        result.passed = true;
      } else if (ratio >= ContrastLevel.AA_NORMAL) {
        result.wcagLevel = 'AA';
        result.passed = true;
      }
    }
    
    // Add issues and suggestions
    if (!result.passed) {
      result.issues.push('low-contrast');
      
      const required = isLargeText 
        ? ContrastLevel.AA_LARGE 
        : ContrastLevel.AA_NORMAL;
      
      result.suggestions.push(
        `색상 대비율이 ${ratio.toFixed(2)}입니다. ` +
        `WCAG AA 기준(${required})을 충족하려면 색상을 조정하세요.`
      );
    }
    
    return result;
  }
  
  /**
   * Simulate color blindness
   */
  static simulateColorBlindness(
    color: RGBColor,
    type: ColorBlindnessType
  ): RGBColor {
    // Simplified simulation matrices
    const matrices: Record<ColorBlindnessType, number[][]> = {
      [ColorBlindnessType.PROTANOPIA]: [
        [0.567, 0.433, 0],
        [0.558, 0.442, 0],
        [0, 0.242, 0.758]
      ],
      [ColorBlindnessType.DEUTERANOPIA]: [
        [0.625, 0.375, 0],
        [0.7, 0.3, 0],
        [0, 0.3, 0.7]
      ],
      [ColorBlindnessType.TRITANOPIA]: [
        [0.95, 0.05, 0],
        [0, 0.433, 0.567],
        [0, 0.475, 0.525]
      ],
      [ColorBlindnessType.ACHROMATOPSIA]: [
        [0.299, 0.587, 0.114],
        [0.299, 0.587, 0.114],
        [0.299, 0.587, 0.114]
      ]
    };
    
    const matrix = matrices[type];
    const r = color.r / 255;
    const g = color.g / 255;
    const b = color.b / 255;
    
    return {
      r: Math.round((matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b) * 255),
      g: Math.round((matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b) * 255),
      b: Math.round((matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b) * 255)
    };
  }
  
  /**
   * Check color distinguishability
   */
  static checkColorDistinguishability(
    colors: LabColor[]
  ): AccessibilityCheckResult {
    const result: AccessibilityCheckResult = {
      passed: true,
      issues: [],
      suggestions: []
    };
    
    const deltaEService = new DeltaEService();
    const minDistinguishable = 5; // Minimum Delta E for distinguishability
    
    // Check all color pairs
    for (let i = 0; i < colors.length; i++) {
      for (let j = i + 1; j < colors.length; j++) {
        const deltaE = deltaEService.calculateDeltaE00(colors[i], colors[j]);
        
        if (deltaE < minDistinguishable) {
          result.passed = false;
          result.issues.push('color-blind');
          result.suggestions.push(
            `색상 ${i + 1}과 ${j + 1}의 차이(ΔE=${deltaE.toFixed(2)})가 ` +
            `너무 작아 구분하기 어려울 수 있습니다.`
          );
        }
      }
    }
    
    return result;
  }
}

/**
 * Accessibility guard props
 */
interface AccessibilityGuardProps {
  children: React.ReactNode;
  checkContrast?: boolean;
  checkColorBlindness?: boolean;
  checkMotion?: boolean;
  announceChanges?: boolean;
  wcagLevel?: 'AA' | 'AAA';
}

/**
 * Accessibility guard component
 */
export const AccessibilityGuard: React.FC<AccessibilityGuardProps> = ({
  children,
  checkContrast = true,
  checkColorBlindness = true,
  checkMotion = true,
  announceChanges = true,
  wcagLevel = 'AA'
}) => {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const { showWarning } = useToast();
  
  /**
   * Check motion preferences
   */
  useEffect(() => {
    if (!checkMotion) return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      
      if (e.matches) {
        logger.info('User prefers reduced motion');
        showWarning('애니메이션이 감소된 모드로 전환되었습니다.');
      }
    };
    
    // Initial check
    setPrefersReducedMotion(mediaQuery.matches);
    
    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [checkMotion, showWarning]);
  
  /**
   * Announce changes for screen readers
   */
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!announceChanges) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [announceChanges]);
  
  // Provide context to children
  const contextValue = {
    issues,
    prefersReducedMotion,
    announce,
    wcagLevel
  };
  
  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

/**
 * Accessibility context
 */
const AccessibilityContext = React.createContext<{
  issues: AccessibilityIssue[];
  prefersReducedMotion: boolean;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  wcagLevel: 'AA' | 'AAA';
}>({
  issues: [],
  prefersReducedMotion: false,
  announce: () => {},
  wcagLevel: 'AA'
});

/**
 * Use accessibility hook
 */
export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  return context;
};

/**
 * Color contrast checker component
 */
export const ColorContrastChecker: React.FC<{
  foreground: LabColor;
  background: LabColor;
  isLargeText?: boolean;
  showAlert?: boolean;
}> = ({ foreground, background, isLargeText = false, showAlert = true }) => {
  const [result, setResult] = useState<AccessibilityCheckResult | null>(null);
  const { showWarning } = useToast();
  const { announce } = useAccessibility();
  
  useEffect(() => {
    const converter = new ColorConverter();
    const fgRGB = converter.labToRGB(foreground);
    const bgRGB = converter.labToRGB(background);
    
    const checkResult = AccessibilityUtils.checkWCAGCompliance(
      fgRGB,
      bgRGB,
      isLargeText
    );
    
    setResult(checkResult);
    
    // Show alert if needed
    if (showAlert && !checkResult.passed) {
      showWarning(checkResult.suggestions[0]);
      announce(checkResult.suggestions[0], 'assertive');
    }
    
    // Log accessibility check
    logger.info('Contrast check performed', {
      passed: checkResult.passed,
      ratio: checkResult.contrastRatio,
      wcagLevel: checkResult.wcagLevel
    });
  }, [foreground, background, isLargeText, showAlert, showWarning, announce]);
  
  if (!result) return null;
  
  return (
    <div 
      className={`p-2 rounded text-sm ${
        result.passed 
          ? 'bg-green-50 text-green-800' 
          : 'bg-red-50 text-red-800'
      }`}
      role="alert"
    >
      <div className="flex items-center justify-between">
        <span>
          대비율: {result.contrastRatio?.toFixed(2)} 
          ({result.wcagLevel})
        </span>
        {!result.passed && (
          <span className="text-xs">
            최소 요구: {isLargeText ? '3.0' : '4.5'}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Skip to content link
 */
export const SkipToContent: React.FC<{ targetId: string }> = ({ targetId }) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      본문으로 건너뛰기
    </a>
  );
};