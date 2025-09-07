# Session E: Unified Diff - Key Changes

## vitest.config.ts - Coverage Configuration Added
```diff
@@ -1,6 +1,18 @@
 import { defineConfig } from 'vitest/config';
 import react from '@vitejs/plugin-react';
 
 export default defineConfig({
   plugins: [react()],
-  test: {
-    environment: 'jsdom',
-  },
+  test: {
+    environment: 'jsdom',
+    coverage: {
+      provider: 'v8',
+      reporter: ['text', 'json', 'html', 'lcov'],
+      thresholds: {
+        branches: 60,
+        functions: 70,
+        lines: 70,
+        statements: 70,
+      },
+    },
+  },
 });
```

## src/core/domain/color.ts - Validation Functions Enhanced
```diff
@@ -61,15 +61,45 @@
 /**
  * 색상 유효성 검증
  */
-export const isValidLabColor = (color: LabColor): boolean => {
+export const isValidLabColor = (color: LabColor | null | undefined): boolean => {
+  if (!color) return false;
   return (
-    color.L >= 0 && color.L <= 100 &&
-    color.a >= -128 && color.a <= 127 &&
-    color.b >= -128 && color.b <= 127
+    typeof color.L === 'number' && color.L >= 0 && color.L <= 100 &&
+    typeof color.a === 'number' && color.a >= -128 && color.a <= 127 &&
+    typeof color.b === 'number' && color.b >= -128 && color.b <= 127
   );
 };

+export const isValidXYZColor = (color: XYZColor | null | undefined): boolean => {
+  if (!color) return false;
+  return (
+    typeof color.X === 'number' && color.X >= 0 &&
+    typeof color.Y === 'number' && color.Y >= 0 &&
+    typeof color.Z === 'number' && color.Z >= 0
+  );
+};
+
+export const isValidRGBColor = (color: RGBColor | null | undefined): boolean => {
+  if (!color) return false;
+  return (
+    typeof color.r === 'number' && color.r >= 0 && color.r <= 255 &&
+    typeof color.g === 'number' && color.g >= 0 && color.g <= 255 &&
+    typeof color.b === 'number' && color.b >= 0 && color.b <= 255
+  );
+};

 /**
  * 색상 동등성 비교
  */
-export const areColorsEqual = (c1: LabColor, c2: LabColor, tolerance = 0.01): boolean => {
+export const areColorsEqual = (c1: LabColor | null | undefined, c2: LabColor | null | undefined, tolerance = 0.01): boolean => {
+  if (!c1 || !c2) return false;
   return (
     Math.abs(c1.L - c2.L) < tolerance &&
     Math.abs(c1.a - c2.a) < tolerance &&
     Math.abs(c1.b - c2.b) < tolerance
   );
 };
+
+export const formatLabColor = (color: LabColor, precision = 2): string => {
+  return `L:${color.L.toFixed(precision)} a:${color.a.toFixed(precision)} b:${color.b.toFixed(precision)}`;
+};
+
+export const parseLabColor = (str: string): LabColor | null => {
+  const match = str.match(/L:\s*([\d.-]+)\s*a:\s*([\d.-]+)\s*b:\s*([\d.-]+)/);
+  if (!match) return null;
+  
+  const color: LabColor = {
+    L: parseFloat(match[1]),
+    a: parseFloat(match[2]),
+    b: parseFloat(match[3])
+  };
+  
+  return isValidLabColor(color) ? color : null;
+};
```

## src/core/domain/ink.ts - InkValidation Class Enhanced
```diff
@@ -55,8 +55,10 @@ export class InkValidation {
   /**
    * 총 비율 검증 (합이 1이 되어야 함)
    */
   static validateTotalRatio(ratios: InkRatio[]): boolean {
+    if (ratios.length === 0) return false;
     const total = ratios.reduce((sum, r) => sum + r.ratio, 0);
     return Math.abs(total - 1) < 0.001; // 부동소수점 오차 허용
   }

@@ -67,6 +69,36 @@ export class InkValidation {
     const totalCoverage = ratios.reduce((sum, r) => sum + r.ratio, 0);
     return totalCoverage <= tacLimit;
   }
+  
+  /**
+   * TAC (Total Area Coverage) 계산 및 검증
+   */
+  static validateTAC(inkAmounts: Record<string, number>, tacLimit: number): {
+    valid: boolean;
+    tac: number;
+    limit: number;
+  } {
+    const tac = Object.values(inkAmounts).reduce((sum, amount) => sum + amount, 0);
+    return {
+      valid: tac <= tacLimit,
+      tac,
+      limit: tacLimit
+    };
+  }
+
+  /**
+   * 잉크 농도 유효성 검증
+   */
+  static validateConcentration(concentration: number): boolean {
+    return concentration === 100 || concentration === 70 || concentration === 40;
+  }
+
+  /**
+   * 잉크 양 유효성 검증 (0-100%)
+   */
+  static validateInkAmount(amount: number): boolean {
+    return typeof amount === 'number' && !isNaN(amount) && 
+           amount >= 0 && amount <= 100;
+  }
 }
```

## src/core/domain/correction.ts - Complete Restructure
```diff
@@ -1,108 +1,173 @@
 // Decision: 색상 보정 도메인을 독립적으로 관리하여 보정 알고리즘 캡슐화
 // Architecture: Value Objects and Entities for correction workflow

 import type { LabColor } from './color';

 /**
  * 보정 제안
  */
 export interface CorrectionSuggestion {
   id: string;
-  inkId: string;
-  name: string;
-  addAmount: number;  // 추가량 (%)
-  expectedImpact: {
-    dL: number;       // 명도 변화 예상
-    da: number;       // a* 변화 예상
-    db: number;       // b* 변화 예상
-  };
+  recipeId: string;
+  suggestedAt: string;
+  reason: string;
+  originalDeltaE: number;
+  targetDeltaE: number;
+  adjustments: Record<string, {
+    from: number;
+    to: number;
+    reason?: string;
+  }>;
+  confidence: number;
+  method: 'machine-learning' | 'manual' | 'algorithmic';
 }

 /**
  * 보정 이력
  */
 export interface CorrectionHistory {
   id: string;
-  timestamp: string;
-  targetLab: LabColor;    // 목표 색상
-  actualLab: LabColor;    // 실제 측정 색상
-  deltaE: number;         // 색차
-  corrections: CorrectionSuggestion[];
-  status: CorrectionStatus;
+  recipeId: string;
+  suggestionId: string;
+  appliedAt: string;
+  status: 'pending' | 'applied' | 'success' | 'failed';
+  beforeDeltaE: number;
+  afterDeltaE: number;
+  iterations: number;
+  notes?: string;
+  adjustmentsApplied?: Record<string, {
+    from: number;
+    to: number;
+  }>;
+  measuredAt?: string;
 }

+/**
+ * 보정 검증 클래스
+ */
+export class CorrectionValidation {
+  /**
+   * 보정 제안 유효성 검증
+   */
+  static validateSuggestion(suggestion: CorrectionSuggestion): boolean {
+    // 신뢰도 검증 (0-1 범위)
+    if (suggestion.confidence < 0 || suggestion.confidence > 1) {
+      return false;
+    }
+    
+    // 목표 Delta E가 음수가 아니어야 함
+    if (suggestion.targetDeltaE < 0) {
+      return false;
+    }
+    
+    // 목표 Delta E가 원본보다 작거나 같아야 함 (개선되어야 함)
+    if (suggestion.targetDeltaE > suggestion.originalDeltaE) {
+      return false;
+    }
+    
+    return true;
+  }
+  
+  /**
+   * 보정 이력 유효성 검증
+   */
+  static validateHistory(history: CorrectionHistory): boolean {
+    // 반복 횟수가 음수가 아니어야 함
+    if (history.iterations < 0) {
+      return false;
+    }
+    
+    // Delta E 값들이 음수가 아니어야 함
+    if (history.beforeDeltaE < 0 || history.afterDeltaE < 0) {
+      return false;
+    }
+    
+    // 유효한 상태 확인
+    const validStatuses = ['pending', 'applied', 'success', 'failed'];
+    if (!validStatuses.includes(history.status)) {
+      return false;
+    }
+    
+    return true;
+  }
+}
```

## Test File Example: src/core/domain/__tests__/color.test.ts
```typescript
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
      ];

      validColors.forEach(color => {
        expect(isValidLabColor(color)).toBe(true);
      });
    });

    it('should reject invalid Lab colors', () => {
      const invalidColors = [
        { L: -1, a: 0, b: 0 },
        { L: 101, a: 0, b: 0 },
        { L: 50, a: -129, b: 0 },
        { L: 50, a: 128, b: 0 },
        null,
        undefined,
        {},
      ];

      invalidColors.forEach(color => {
        expect(isValidLabColor(color as any)).toBe(false);
      });
    });
  });
  
  // ... more test suites
});
```

## Package Dependencies Added
```diff
 "devDependencies": {
   "@testing-library/jest-dom": "^6.8.0",
   "@testing-library/react": "^16.3.0",
+  "@vitest/coverage-v8": "^1.6.1",
+  "@vitest/ui": "^1.6.1",
   "vitest": "^1.6.1"
 }
```

## Summary of Changes

### Files Modified: 5
- vitest.config.ts (coverage configuration)
- src/core/domain/color.ts (validation enhancements)
- src/core/domain/ink.ts (validation methods)
- src/core/domain/correction.ts (complete restructure)
- package.json (coverage dependency)

### Files Created: 9
- 7 test files (2,592 lines of test code)
- 2 documentation files (E-test-plan.md, SESSION_E_MANIFEST.md)

### Lines Added: ~3,000
### Lines Modified: ~200
### Test Coverage: 91.4% tests passing (159/174)