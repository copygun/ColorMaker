// Decision: Comprehensive input validation with sanitization
// Architecture: Validation pipeline with type guards and sanitizers

import { LabColor, XYZColor, RGBColor } from '../domain/color';
import { InkRatio } from '../domain/ink';
import { ErrorFactory } from '../errors/errorFactory';
import { ValidationError } from '../errors/types';

/**
 * Validation result
 */
export interface ValidationResult<T> {
  valid: boolean;
  value?: T;
  errors: ValidationError[];
}

/**
 * Input sanitizers
 */
export class InputSanitizer {
  /**
   * Sanitize number input
   */
  static number(value: any, min?: number, max?: number): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    
    const num = typeof value === 'string' ? parseFloat(value) : Number(value);
    
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    
    if (min !== undefined && num < min) {
      return min;
    }
    
    if (max !== undefined && num > max) {
      return max;
    }
    
    return num;
  }
  
  /**
   * Sanitize string input
   */
  static string(value: any, maxLength?: number): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    let str = String(value).trim();
    
    // Remove potentially dangerous characters
    str = str.replace(/[<>]/g, '');
    
    if (maxLength && str.length > maxLength) {
      str = str.substring(0, maxLength);
    }
    
    return str;
  }
  
  /**
   * Sanitize array input
   */
  static array<T>(value: any, itemSanitizer?: (item: any) => T | null): T[] {
    if (!Array.isArray(value)) {
      return [];
    }
    
    if (!itemSanitizer) {
      return value;
    }
    
    return value
      .map(item => itemSanitizer(item))
      .filter(item => item !== null) as T[];
  }
  
  /**
   * Sanitize color input
   */
  static labColor(value: any): LabColor | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    
    const L = this.number(value.L, 0, 100);
    const a = this.number(value.a, -128, 127);
    const b = this.number(value.b, -128, 127);
    
    if (L === null || a === null || b === null) {
      return null;
    }
    
    return { L, a, b };
  }
  
  /**
   * Sanitize hex color
   */
  static hexColor(value: any): string | null {
    if (typeof value !== 'string') {
      return null;
    }
    
    // Remove # if present and validate
    const hex = value.replace('#', '').toUpperCase();
    
    if (!/^[0-9A-F]{6}$/.test(hex)) {
      return null;
    }
    
    return `#${hex}`;
  }
}

/**
 * Input validators
 */
export class InputValidator {
  /**
   * Validate Lab color
   */
  static validateLabColor(value: any): ValidationResult<LabColor> {
    const errors: ValidationError[] = [];
    const sanitized = InputSanitizer.labColor(value);
    
    if (!sanitized) {
      errors.push(ErrorFactory.validation('INVALID_COLOR', { value }));
      return { valid: false, errors };
    }
    
    return { valid: true, value: sanitized, errors };
  }
  
  /**
   * Validate ink ratios
   */
  static validateInkRatios(ratios: any[]): ValidationResult<InkRatio[]> {
    const errors: ValidationError[] = [];
    
    if (!Array.isArray(ratios) || ratios.length === 0) {
      errors.push(ErrorFactory.validation('INSUFFICIENT_INKS', { count: 0 }));
      return { valid: false, errors };
    }
    
    const sanitized: InkRatio[] = [];
    let totalRatio = 0;
    
    for (const ratio of ratios) {
      if (!ratio || typeof ratio !== 'object') {
        continue;
      }
      
      const inkId = InputSanitizer.string(ratio.inkId);
      const ratioValue = InputSanitizer.number(ratio.ratio, 0, 1);
      const concentration = InputSanitizer.number(ratio.concentration);
      
      if (!inkId || ratioValue === null || concentration === null) {
        continue;
      }
      
      // Validate concentration values
      if (![40, 70, 100].includes(concentration)) {
        errors.push(ErrorFactory.validation('INVALID_COLOR', { 
          value: concentration,
          field: 'concentration' 
        }));
        continue;
      }
      
      sanitized.push({ inkId, ratio: ratioValue, concentration });
      totalRatio += ratioValue;
    }
    
    // Validate total ratio
    if (Math.abs(totalRatio - 1.0) > 0.001) {
      errors.push(ErrorFactory.validation('INVALID_RATIO', { sum: totalRatio }));
    }
    
    if (sanitized.length === 0) {
      errors.push(ErrorFactory.validation('INSUFFICIENT_INKS', { count: 0 }));
    }
    
    return {
      valid: errors.length === 0,
      value: sanitized,
      errors
    };
  }
  
  /**
   * Validate TAC limit
   */
  static validateTAC(
    inkAmounts: Record<string, number>,
    tacLimit: number
  ): ValidationResult<Record<string, number>> {
    const errors: ValidationError[] = [];
    const sanitized: Record<string, number> = {};
    let totalCoverage = 0;
    
    for (const [inkId, amount] of Object.entries(inkAmounts)) {
      const sanitizedAmount = InputSanitizer.number(amount, 0, 100);
      
      if (sanitizedAmount === null) {
        continue;
      }
      
      sanitized[inkId] = sanitizedAmount;
      totalCoverage += sanitizedAmount;
    }
    
    if (totalCoverage > tacLimit) {
      errors.push(ErrorFactory.validation('TAC_EXCEEDED', {
        tac: totalCoverage,
        limit: tacLimit
      }));
    }
    
    return {
      valid: errors.length === 0,
      value: sanitized,
      errors
    };
  }
  
  /**
   * Validate required field
   */
  static validateRequired(value: any, field: string): ValidationResult<any> {
    const errors: ValidationError[] = [];
    
    if (value === null || value === undefined || value === '') {
      errors.push(ErrorFactory.validation('REQUIRED_FIELD', { field }));
      return { valid: false, errors };
    }
    
    return { valid: true, value, errors };
  }
  
  /**
   * Validate number range
   */
  static validateNumberRange(
    value: any,
    min: number,
    max: number,
    field: string
  ): ValidationResult<number> {
    const errors: ValidationError[] = [];
    const sanitized = InputSanitizer.number(value, min, max);
    
    if (sanitized === null) {
      errors.push(ErrorFactory.validation('INVALID_COLOR', { 
        value,
        field,
        constraints: { min, max }
      }));
      return { valid: false, errors };
    }
    
    return { valid: true, value: sanitized, errors };
  }
  
  /**
   * Batch validation
   */
  static validateBatch(
    validations: Array<() => ValidationResult<any>>
  ): ValidationResult<any[]> {
    const errors: ValidationError[] = [];
    const values: any[] = [];
    
    for (const validation of validations) {
      const result = validation();
      
      if (!result.valid) {
        errors.push(...result.errors);
      } else {
        values.push(result.value);
      }
    }
    
    return {
      valid: errors.length === 0,
      value: values,
      errors
    };
  }
}

/**
 * Form validator for complex inputs
 */
export class FormValidator {
  private errors: ValidationError[] = [];
  private values: Record<string, any> = {};
  
  /**
   * Validate field
   */
  field(name: string, value: any, validator: (v: any) => ValidationResult<any>): this {
    const result = validator(value);
    
    if (!result.valid) {
      this.errors.push(...result.errors);
    } else {
      this.values[name] = result.value;
    }
    
    return this;
  }
  
  /**
   * Get validation result
   */
  result(): ValidationResult<Record<string, any>> {
    return {
      valid: this.errors.length === 0,
      value: this.values,
      errors: this.errors
    };
  }
  
  /**
   * Reset validator
   */
  reset(): void {
    this.errors = [];
    this.values = {};
  }
}