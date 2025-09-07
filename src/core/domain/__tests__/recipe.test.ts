import { describe, it, expect } from 'vitest';
import { RecipeStatus, RecipeBusinessRules } from '../recipe';
import type { Recipe, RecipeMetadata, RecipeFilterOptions } from '../recipe';
import type { LabColor } from '../color';
import type { InkRatio } from '../ink';

describe('Recipe Domain', () => {
  const createTestRecipe = (overrides: Partial<Recipe> = {}): Recipe => ({
    id: 'recipe-001',
    name: 'Test Recipe',
    type: 'selected',
    status: RecipeStatus.CALCULATED,
    createdAt: new Date().toISOString(),
    target: { L: 50, a: 20, b: -30 },
    mixed: { L: 49.5, a: 19.8, b: -29.5 },
    deltaE: 0.8,
    inks: [
      { inkId: 'cyan', ratio: 0.6, concentration: 100 },
      { inkId: 'magenta', ratio: 0.4, concentration: 100 },
    ],
    method: 'lab',
    optimization: 'simple',
    ...overrides,
  });

  describe('Recipe Status Enum', () => {
    it('should have all required status values', () => {
      expect(RecipeStatus.CALCULATED).toBe('calculated');
      expect(RecipeStatus.SELECTED).toBe('selected');
      expect(RecipeStatus.IN_PROGRESS).toBe('in_progress');
      expect(RecipeStatus.MEASURING).toBe('measuring');
      expect(RecipeStatus.COMPLETED).toBe('completed');
      expect(RecipeStatus.NEEDS_CORRECTION).toBe('needs_correction');
      expect(RecipeStatus.CORRECTING).toBe('correcting');
      expect(RecipeStatus.CORRECTED).toBe('corrected');
    });
  });

  describe('Recipe Entity', () => {
    it('should create valid recipe objects', () => {
      const recipe = createTestRecipe();
      
      expect(recipe.id).toBe('recipe-001');
      expect(recipe.name).toBe('Test Recipe');
      expect(recipe.type).toBe('selected');
      expect(recipe.status).toBe(RecipeStatus.CALCULATED);
      expect(recipe.deltaE).toBe(0.8);
      expect(recipe.inks).toHaveLength(2);
    });

    it('should support optimized recipe type', () => {
      const recipe = createTestRecipe({
        type: 'optimized',
        optimization: 'pso',
      });
      
      expect(recipe.type).toBe('optimized');
      expect(recipe.optimization).toBe('pso');
    });

    it('should support correction fields', () => {
      const recipe = createTestRecipe({
        isCorrection: true,
        correctionDate: '2025-09-07T12:00:00Z',
        originalDeltaE: 3.5,
        correctionIteration: 2,
      });
      
      expect(recipe.isCorrection).toBe(true);
      expect(recipe.correctionDate).toBe('2025-09-07T12:00:00Z');
      expect(recipe.originalDeltaE).toBe(3.5);
      expect(recipe.correctionIteration).toBe(2);
    });

    it('should support metadata', () => {
      const metadata: RecipeMetadata = {
        totalIterations: 150,
        convergenceRate: 0.95,
        printMethod: 'offset',
        substrate: 'coated paper',
        notes: 'Test notes',
      };
      
      const recipe = createTestRecipe({ metadata });
      
      expect(recipe.metadata?.totalIterations).toBe(150);
      expect(recipe.metadata?.convergenceRate).toBe(0.95);
      expect(recipe.metadata?.printMethod).toBe('offset');
      expect(recipe.metadata?.substrate).toBe('coated paper');
      expect(recipe.metadata?.notes).toBe('Test notes');
    });

    it('should support time tracking', () => {
      const now = new Date().toISOString();
      const later = new Date(Date.now() + 3600000).toISOString();
      
      const recipe = createTestRecipe({
        createdAt: now,
        startedAt: now,
        completedAt: later,
      });
      
      expect(recipe.createdAt).toBe(now);
      expect(recipe.startedAt).toBe(now);
      expect(recipe.completedAt).toBe(later);
    });
  });

  describe('RecipeBusinessRules.canTransitionTo', () => {
    it('should allow valid state transitions', () => {
      // CALCULATED -> SELECTED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CALCULATED,
        RecipeStatus.SELECTED
      )).toBe(true);
      
      // SELECTED -> IN_PROGRESS
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.SELECTED,
        RecipeStatus.IN_PROGRESS
      )).toBe(true);
      
      // IN_PROGRESS -> MEASURING
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.IN_PROGRESS,
        RecipeStatus.MEASURING
      )).toBe(true);
      
      // MEASURING -> COMPLETED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.MEASURING,
        RecipeStatus.COMPLETED
      )).toBe(true);
      
      // MEASURING -> NEEDS_CORRECTION
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.MEASURING,
        RecipeStatus.NEEDS_CORRECTION
      )).toBe(true);
      
      // NEEDS_CORRECTION -> CORRECTING
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.NEEDS_CORRECTION,
        RecipeStatus.CORRECTING
      )).toBe(true);
      
      // CORRECTING -> CORRECTED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CORRECTING,
        RecipeStatus.CORRECTED
      )).toBe(true);
      
      // CORRECTED -> COMPLETED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CORRECTED,
        RecipeStatus.COMPLETED
      )).toBe(true);
    });

    it('should reject invalid state transitions', () => {
      // CALCULATED cannot go directly to COMPLETED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CALCULATED,
        RecipeStatus.COMPLETED
      )).toBe(false);
      
      // COMPLETED is terminal state
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.COMPLETED,
        RecipeStatus.SELECTED
      )).toBe(false);
      
      // Cannot go backwards from MEASURING to CALCULATED
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.MEASURING,
        RecipeStatus.CALCULATED
      )).toBe(false);
      
      // CORRECTED cannot go back to NEEDS_CORRECTION
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CORRECTED,
        RecipeStatus.NEEDS_CORRECTION
      )).toBe(false);
    });

    it('should allow going back from SELECTED to CALCULATED', () => {
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.SELECTED,
        RecipeStatus.CALCULATED
      )).toBe(true);
    });

    it('should allow going back from IN_PROGRESS to SELECTED', () => {
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.IN_PROGRESS,
        RecipeStatus.SELECTED
      )).toBe(true);
    });

    it('should allow correction loop', () => {
      // CORRECTING -> NEEDS_CORRECTION (retry correction)
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.CORRECTING,
        RecipeStatus.NEEDS_CORRECTION
      )).toBe(true);
    });

    it('should handle invalid status gracefully', () => {
      expect(RecipeBusinessRules.canTransitionTo(
        'INVALID' as RecipeStatus,
        RecipeStatus.SELECTED
      )).toBe(false);
      
      expect(RecipeBusinessRules.canTransitionTo(
        RecipeStatus.SELECTED,
        'INVALID' as RecipeStatus
      )).toBe(false);
    });
  });

  describe('RecipeBusinessRules.evaluateQuality', () => {
    it('should evaluate excellent quality', () => {
      expect(RecipeBusinessRules.evaluateQuality(0)).toBe('excellent');
      expect(RecipeBusinessRules.evaluateQuality(0.5)).toBe('excellent');
      expect(RecipeBusinessRules.evaluateQuality(0.99)).toBe('excellent');
    });

    it('should evaluate good quality', () => {
      expect(RecipeBusinessRules.evaluateQuality(1.0)).toBe('good');
      expect(RecipeBusinessRules.evaluateQuality(1.5)).toBe('good');
      expect(RecipeBusinessRules.evaluateQuality(1.99)).toBe('good');
    });

    it('should evaluate acceptable quality', () => {
      expect(RecipeBusinessRules.evaluateQuality(2.0)).toBe('acceptable');
      expect(RecipeBusinessRules.evaluateQuality(3.0)).toBe('acceptable');
      expect(RecipeBusinessRules.evaluateQuality(3.49)).toBe('acceptable');
    });

    it('should evaluate poor quality', () => {
      expect(RecipeBusinessRules.evaluateQuality(3.5)).toBe('poor');
      expect(RecipeBusinessRules.evaluateQuality(5.0)).toBe('poor');
      expect(RecipeBusinessRules.evaluateQuality(10.0)).toBe('poor');
      expect(RecipeBusinessRules.evaluateQuality(100.0)).toBe('poor');
    });

    it('should handle edge cases', () => {
      expect(RecipeBusinessRules.evaluateQuality(-1)).toBe('excellent'); // Negative deltaE
      expect(RecipeBusinessRules.evaluateQuality(NaN)).toBe('poor'); // NaN
      expect(RecipeBusinessRules.evaluateQuality(Infinity)).toBe('poor'); // Infinity
    });
  });

  describe('RecipeBusinessRules.needsCorrection', () => {
    it('should identify recipes needing correction', () => {
      expect(RecipeBusinessRules.needsCorrection(2.5)).toBe(true);
      expect(RecipeBusinessRules.needsCorrection(3.0)).toBe(true);
      expect(RecipeBusinessRules.needsCorrection(10.0)).toBe(true);
    });

    it('should identify acceptable recipes', () => {
      expect(RecipeBusinessRules.needsCorrection(0.5)).toBe(false);
      expect(RecipeBusinessRules.needsCorrection(1.0)).toBe(false);
      expect(RecipeBusinessRules.needsCorrection(1.99)).toBe(false);
    });

    it('should respect custom threshold', () => {
      // Stricter threshold
      expect(RecipeBusinessRules.needsCorrection(1.5, 1.0)).toBe(true);
      expect(RecipeBusinessRules.needsCorrection(0.9, 1.0)).toBe(false);
      
      // Looser threshold
      expect(RecipeBusinessRules.needsCorrection(3.5, 4.0)).toBe(false);
      expect(RecipeBusinessRules.needsCorrection(4.1, 4.0)).toBe(true);
    });

    it('should handle exactly at threshold', () => {
      expect(RecipeBusinessRules.needsCorrection(2.0, 2.0)).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(RecipeBusinessRules.needsCorrection(-1)).toBe(false); // Negative deltaE
      expect(RecipeBusinessRules.needsCorrection(NaN)).toBe(true); // NaN treated as poor
      expect(RecipeBusinessRules.needsCorrection(Infinity)).toBe(true); // Infinity
    });
  });

  describe('Recipe Filter Options', () => {
    it('should create valid filter options', () => {
      const filter: RecipeFilterOptions = {
        status: [RecipeStatus.COMPLETED, RecipeStatus.CORRECTED],
        type: ['optimized'],
        maxDeltaE: 2.0,
        dateFrom: '2025-09-01T00:00:00Z',
        dateTo: '2025-09-30T23:59:59Z',
      };
      
      expect(filter.status).toHaveLength(2);
      expect(filter.type).toContain('optimized');
      expect(filter.maxDeltaE).toBe(2.0);
      expect(filter.dateFrom).toBeDefined();
      expect(filter.dateTo).toBeDefined();
    });

    it('should allow partial filter options', () => {
      const filter1: RecipeFilterOptions = {
        status: [RecipeStatus.COMPLETED],
      };
      
      const filter2: RecipeFilterOptions = {
        maxDeltaE: 1.5,
      };
      
      const filter3: RecipeFilterOptions = {
        dateFrom: '2025-09-01T00:00:00Z',
      };
      
      expect(filter1.status).toHaveLength(1);
      expect(filter2.maxDeltaE).toBe(1.5);
      expect(filter3.dateFrom).toBeDefined();
    });
  });

  describe('Recipe Workflow Scenarios', () => {
    it('should handle complete successful workflow', () => {
      const recipe = createTestRecipe();
      
      // Start with CALCULATED
      expect(recipe.status).toBe(RecipeStatus.CALCULATED);
      expect(RecipeBusinessRules.evaluateQuality(recipe.deltaE)).toBe('excellent');
      
      // Select for production
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.SELECTED
      )).toBe(true);
      recipe.status = RecipeStatus.SELECTED;
      
      // Start mixing
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.IN_PROGRESS
      )).toBe(true);
      recipe.status = RecipeStatus.IN_PROGRESS;
      recipe.startedAt = new Date().toISOString();
      
      // Measure result
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.MEASURING
      )).toBe(true);
      recipe.status = RecipeStatus.MEASURING;
      
      // Complete successfully
      expect(RecipeBusinessRules.needsCorrection(recipe.deltaE)).toBe(false);
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.COMPLETED
      )).toBe(true);
      recipe.status = RecipeStatus.COMPLETED;
      recipe.completedAt = new Date().toISOString();
    });

    it('should handle correction workflow', () => {
      const recipe = createTestRecipe({
        deltaE: 4.5, // Poor match
      });
      
      // Start workflow
      recipe.status = RecipeStatus.MEASURING;
      
      // Needs correction
      expect(RecipeBusinessRules.needsCorrection(recipe.deltaE)).toBe(true);
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.NEEDS_CORRECTION
      )).toBe(true);
      recipe.status = RecipeStatus.NEEDS_CORRECTION;
      
      // Start correction
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.CORRECTING
      )).toBe(true);
      recipe.status = RecipeStatus.CORRECTING;
      recipe.originalDeltaE = recipe.deltaE;
      recipe.correctionIteration = 1;
      
      // Apply correction
      recipe.deltaE = 1.8; // Improved
      recipe.isCorrection = true;
      recipe.correctionDate = new Date().toISOString();
      
      // Mark as corrected
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.CORRECTED
      )).toBe(true);
      recipe.status = RecipeStatus.CORRECTED;
      
      // Complete
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.COMPLETED
      )).toBe(true);
      recipe.status = RecipeStatus.COMPLETED;
    });

    it('should handle multiple correction iterations', () => {
      const recipe = createTestRecipe({
        deltaE: 5.0,
        correctionIteration: 0,
      });
      
      // First correction attempt
      recipe.status = RecipeStatus.CORRECTING;
      recipe.correctionIteration = 1;
      recipe.deltaE = 3.5; // Still not good enough
      
      // Need more correction
      expect(RecipeBusinessRules.needsCorrection(recipe.deltaE, 2.0)).toBe(true);
      expect(RecipeBusinessRules.canTransitionTo(
        recipe.status,
        RecipeStatus.NEEDS_CORRECTION
      )).toBe(true);
      recipe.status = RecipeStatus.NEEDS_CORRECTION;
      
      // Second correction attempt
      recipe.status = RecipeStatus.CORRECTING;
      recipe.correctionIteration = 2;
      recipe.deltaE = 1.5; // Good enough
      
      // Success
      expect(RecipeBusinessRules.needsCorrection(recipe.deltaE, 2.0)).toBe(false);
      recipe.status = RecipeStatus.CORRECTED;
    });
  });
});