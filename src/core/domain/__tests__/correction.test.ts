import { describe, it, expect } from 'vitest';
import { CorrectionValidation } from '../correction';
import type { CorrectionSuggestion, CorrectionHistory } from '../correction';

describe('Correction Domain', () => {
  describe('Correction Status', () => {
    it('should have valid correction status values', () => {
      const validStatuses = ['pending', 'applied', 'success', 'failed'];
      
      validStatuses.forEach(status => {
        expect(status).toMatch(/^(pending|applied|success|failed)$/);
      });
    });
  });

  describe('Correction Suggestion', () => {
    it('should create valid correction suggestions', () => {
      const suggestion: CorrectionSuggestion = {
        id: 'correction-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Delta E too high',
        originalDeltaE: 4.5,
        targetDeltaE: 2.0,
        adjustments: {
          cyan: { from: 0.5, to: 0.45, reason: 'Reduce cyan for better match' },
          magenta: { from: 0.3, to: 0.35, reason: 'Increase magenta slightly' },
          yellow: { from: 0.2, to: 0.2, reason: 'Yellow unchanged' },
        },
        confidence: 0.85,
        method: 'machine-learning',
      };
      
      expect(suggestion.id).toBe('correction-001');
      expect(suggestion.recipeId).toBe('recipe-001');
      expect(suggestion.originalDeltaE).toBe(4.5);
      expect(suggestion.targetDeltaE).toBe(2.0);
      expect(suggestion.confidence).toBe(0.85);
      expect(suggestion.method).toBe('machine-learning');
    });

    it('should support different correction methods', () => {
      const mlSuggestion: CorrectionSuggestion = {
        id: 'ml-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'ML-based correction',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: 0.92,
        method: 'machine-learning',
      };
      
      const manualSuggestion: CorrectionSuggestion = {
        id: 'manual-001',
        recipeId: 'recipe-002',
        suggestedAt: new Date().toISOString(),
        reason: 'Expert manual adjustment',
        originalDeltaE: 2.5,
        targetDeltaE: 1.0,
        adjustments: {},
        confidence: 0.95,
        method: 'manual',
      };
      
      const algorithmicSuggestion: CorrectionSuggestion = {
        id: 'algo-001',
        recipeId: 'recipe-003',
        suggestedAt: new Date().toISOString(),
        reason: 'Algorithmic optimization',
        originalDeltaE: 3.5,
        targetDeltaE: 1.8,
        adjustments: {},
        confidence: 0.78,
        method: 'algorithmic',
      };
      
      expect(mlSuggestion.method).toBe('machine-learning');
      expect(manualSuggestion.method).toBe('manual');
      expect(algorithmicSuggestion.method).toBe('algorithmic');
    });

    it('should handle complex adjustments', () => {
      const suggestion: CorrectionSuggestion = {
        id: 'complex-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Multi-ink adjustment needed',
        originalDeltaE: 5.0,
        targetDeltaE: 1.5,
        adjustments: {
          cyan: { from: 0.4, to: 0.35, reason: 'Reduce cyan dominance' },
          magenta: { from: 0.25, to: 0.3, reason: 'Increase warm tone' },
          yellow: { from: 0.15, to: 0.18, reason: 'Enhance yellow component' },
          black: { from: 0.2, to: 0.17, reason: 'Reduce darkness' },
        },
        confidence: 0.82,
        method: 'algorithmic',
      };
      
      expect(Object.keys(suggestion.adjustments)).toHaveLength(4);
      expect(suggestion.adjustments.cyan.from).toBe(0.4);
      expect(suggestion.adjustments.cyan.to).toBe(0.35);
      expect(suggestion.adjustments.black).toBeDefined();
    });
  });

  describe('Correction History', () => {
    it('should create valid correction history entries', () => {
      const history: CorrectionHistory = {
        id: 'history-001',
        recipeId: 'recipe-001',
        suggestionId: 'correction-001',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: 4.5,
        afterDeltaE: 1.8,
        iterations: 2,
        notes: 'Successfully corrected after 2 iterations',
      };
      
      expect(history.id).toBe('history-001');
      expect(history.status).toBe('success');
      expect(history.beforeDeltaE).toBe(4.5);
      expect(history.afterDeltaE).toBe(1.8);
      expect(history.iterations).toBe(2);
    });

    it('should track different correction statuses', () => {
      const pending: CorrectionHistory = {
        id: 'pending-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'pending',
        beforeDeltaE: 3.0,
        afterDeltaE: 0, // Not yet known
        iterations: 0,
      };
      
      const applied: CorrectionHistory = {
        id: 'applied-001',
        recipeId: 'recipe-002',
        suggestionId: 'suggestion-002',
        appliedAt: new Date().toISOString(),
        status: 'applied',
        beforeDeltaE: 2.5,
        afterDeltaE: 0, // Being measured
        iterations: 1,
      };
      
      const failed: CorrectionHistory = {
        id: 'failed-001',
        recipeId: 'recipe-003',
        suggestionId: 'suggestion-003',
        appliedAt: new Date().toISOString(),
        status: 'failed',
        beforeDeltaE: 4.0,
        afterDeltaE: 4.2, // Got worse
        iterations: 3,
        notes: 'Correction made result worse',
      };
      
      expect(pending.status).toBe('pending');
      expect(applied.status).toBe('applied');
      expect(failed.status).toBe('failed');
    });

    it('should support optional fields', () => {
      const minimalHistory: CorrectionHistory = {
        id: 'minimal-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'pending',
        beforeDeltaE: 3.0,
        afterDeltaE: 0,
        iterations: 0,
      };
      
      const detailedHistory: CorrectionHistory = {
        id: 'detailed-001',
        recipeId: 'recipe-002',
        suggestionId: 'suggestion-002',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: 3.5,
        afterDeltaE: 1.2,
        iterations: 2,
        notes: 'Excellent improvement achieved',
        adjustmentsApplied: {
          cyan: { from: 0.5, to: 0.45 },
          magenta: { from: 0.3, to: 0.33 },
        },
        measuredAt: new Date(Date.now() + 3600000).toISOString(),
      };
      
      expect(minimalHistory.notes).toBeUndefined();
      expect(minimalHistory.adjustmentsApplied).toBeUndefined();
      expect(detailedHistory.notes).toBeDefined();
      expect(detailedHistory.adjustmentsApplied).toBeDefined();
      expect(detailedHistory.measuredAt).toBeDefined();
    });
  });

  describe('CorrectionValidation.validateSuggestion', () => {
    it('should validate valid suggestions', () => {
      const suggestion: CorrectionSuggestion = {
        id: 'valid-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Valid reason',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: 0.8,
        method: 'algorithmic',
      };
      
      expect(CorrectionValidation.validateSuggestion(suggestion)).toBe(true);
    });

    it('should accept edge confidence values', () => {
      const minConfidence: CorrectionSuggestion = {
        id: 'min-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Low confidence',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: 0,
        method: 'algorithmic',
      };
      
      const maxConfidence: CorrectionSuggestion = {
        id: 'max-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'High confidence',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: 1,
        method: 'manual',
      };
      
      expect(CorrectionValidation.validateSuggestion(minConfidence)).toBe(true);
      expect(CorrectionValidation.validateSuggestion(maxConfidence)).toBe(true);
    });

    it('should reject invalid confidence values', () => {
      const negativeConfidence: CorrectionSuggestion = {
        id: 'neg-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Invalid',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: -0.1,
        method: 'algorithmic',
      };
      
      const overConfidence: CorrectionSuggestion = {
        id: 'over-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Invalid',
        originalDeltaE: 3.0,
        targetDeltaE: 1.5,
        adjustments: {},
        confidence: 1.1,
        method: 'algorithmic',
      };
      
      expect(CorrectionValidation.validateSuggestion(negativeConfidence)).toBe(false);
      expect(CorrectionValidation.validateSuggestion(overConfidence)).toBe(false);
    });

    it('should reject invalid target Delta E', () => {
      const negativeDeltaE: CorrectionSuggestion = {
        id: 'neg-delta-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Invalid',
        originalDeltaE: 3.0,
        targetDeltaE: -1,
        adjustments: {},
        confidence: 0.8,
        method: 'algorithmic',
      };
      
      expect(CorrectionValidation.validateSuggestion(negativeDeltaE)).toBe(false);
    });

    it('should reject target Delta E greater than original', () => {
      const worseDeltaE: CorrectionSuggestion = {
        id: 'worse-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'Invalid',
        originalDeltaE: 3.0,
        targetDeltaE: 4.0, // Worse than original
        adjustments: {},
        confidence: 0.8,
        method: 'algorithmic',
      };
      
      expect(CorrectionValidation.validateSuggestion(worseDeltaE)).toBe(false);
    });
  });

  describe('CorrectionValidation.validateHistory', () => {
    it('should validate valid history entries', () => {
      const history: CorrectionHistory = {
        id: 'valid-history-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: 3.0,
        afterDeltaE: 1.5,
        iterations: 2,
      };
      
      expect(CorrectionValidation.validateHistory(history)).toBe(true);
    });

    it('should validate all status types', () => {
      const statuses: CorrectionHistory['status'][] = ['pending', 'applied', 'success', 'failed'];
      
      statuses.forEach(status => {
        const history: CorrectionHistory = {
          id: `history-${status}`,
          recipeId: 'recipe-001',
          suggestionId: 'suggestion-001',
          appliedAt: new Date().toISOString(),
          status,
          beforeDeltaE: 3.0,
          afterDeltaE: status === 'failed' ? 3.5 : 1.5,
          iterations: 1,
        };
        
        expect(CorrectionValidation.validateHistory(history)).toBe(true);
      });
    });

    it('should reject negative iterations', () => {
      const negativeIterations: CorrectionHistory = {
        id: 'neg-iter-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: 3.0,
        afterDeltaE: 1.5,
        iterations: -1,
      };
      
      expect(CorrectionValidation.validateHistory(negativeIterations)).toBe(false);
    });

    it('should reject negative Delta E values', () => {
      const negativeBefore: CorrectionHistory = {
        id: 'neg-before-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: -1,
        afterDeltaE: 1.5,
        iterations: 1,
      };
      
      const negativeAfter: CorrectionHistory = {
        id: 'neg-after-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'success',
        beforeDeltaE: 3.0,
        afterDeltaE: -1,
        iterations: 1,
      };
      
      expect(CorrectionValidation.validateHistory(negativeBefore)).toBe(false);
      expect(CorrectionValidation.validateHistory(negativeAfter)).toBe(false);
    });

    it('should allow zero iterations for pending status', () => {
      const pendingZeroIter: CorrectionHistory = {
        id: 'pending-zero-001',
        recipeId: 'recipe-001',
        suggestionId: 'suggestion-001',
        appliedAt: new Date().toISOString(),
        status: 'pending',
        beforeDeltaE: 3.0,
        afterDeltaE: 0,
        iterations: 0,
      };
      
      expect(CorrectionValidation.validateHistory(pendingZeroIter)).toBe(true);
    });
  });

  describe('Correction Workflow', () => {
    it('should handle complete correction workflow', () => {
      // 1. Create suggestion
      const suggestion: CorrectionSuggestion = {
        id: 'workflow-suggestion-001',
        recipeId: 'recipe-001',
        suggestedAt: new Date().toISOString(),
        reason: 'High Delta E detected',
        originalDeltaE: 4.0,
        targetDeltaE: 1.5,
        adjustments: {
          cyan: { from: 0.5, to: 0.45, reason: 'Reduce cyan' },
          magenta: { from: 0.3, to: 0.33, reason: 'Increase magenta' },
        },
        confidence: 0.85,
        method: 'machine-learning',
      };
      
      expect(CorrectionValidation.validateSuggestion(suggestion)).toBe(true);
      
      // 2. Apply correction (pending)
      let history: CorrectionHistory = {
        id: 'workflow-history-001',
        recipeId: suggestion.recipeId,
        suggestionId: suggestion.id,
        appliedAt: new Date().toISOString(),
        status: 'pending',
        beforeDeltaE: suggestion.originalDeltaE,
        afterDeltaE: 0,
        iterations: 0,
      };
      
      expect(CorrectionValidation.validateHistory(history)).toBe(true);
      
      // 3. Mark as applied
      history.status = 'applied';
      history.iterations = 1;
      expect(CorrectionValidation.validateHistory(history)).toBe(true);
      
      // 4. Measure and mark success
      history.status = 'success';
      history.afterDeltaE = 1.6; // Close to target
      history.measuredAt = new Date().toISOString();
      history.notes = 'Successfully reduced Delta E';
      
      expect(CorrectionValidation.validateHistory(history)).toBe(true);
      expect(history.afterDeltaE).toBeLessThan(history.beforeDeltaE);
    });
  });
});