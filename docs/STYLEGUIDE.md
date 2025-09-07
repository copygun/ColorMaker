# 📝 Coding Standards & Style Guide

## 🎯 Overview

This document defines the coding standards and conventions for the WonLabel Color Maker project. Following these guidelines ensures consistency, readability, and maintainability across the codebase.

## 📏 General Principles

### Core Values
1. **Clarity over cleverness** - Write code that is easy to understand
2. **Consistency over personal preference** - Follow team conventions
3. **Simplicity over complexity** - Choose the simplest solution that works
4. **Explicit over implicit** - Be clear about intentions

## 🔤 Naming Conventions

### TypeScript/JavaScript

#### Variables and Functions
```typescript
// ✅ Good - camelCase for variables and functions
const userColor = { L: 50, a: 20, b: -30 };
const calculateDeltaE = (color1: LabColor, color2: LabColor) => { /* ... */ };

// ❌ Bad - snake_case or PascalCase
const user_color = { /* ... */ };
const CalculateDeltaE = () => { /* ... */ };
```

#### Constants
```typescript
// ✅ Good - UPPER_SNAKE_CASE for constants
const MAX_TAC_LIMIT = 300;
const DEFAULT_ILLUMINANT = 'D65';

// ❌ Bad - camelCase for constants
const maxTacLimit = 300;
```

#### Classes and Interfaces
```typescript
// ✅ Good - PascalCase for classes and interfaces
class ColorConverter { /* ... */ }
interface LabColor { /* ... */ }

// ❌ Bad - camelCase for classes
class colorConverter { /* ... */ }
```

#### Enums
```typescript
// ✅ Good - PascalCase for enum name, UPPER_SNAKE_CASE for values
enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// ❌ Bad - Inconsistent casing
enum errorSeverity {
  Low = 'low',
  medium = 'medium'
}
```

#### File Names
```typescript
// ✅ Good - camelCase for files, PascalCase for components
colorConverter.ts       // Service/utility file
ColorPicker.tsx        // React component
useColorCalculation.ts // Hook
types.ts              // Type definitions

// ❌ Bad - Inconsistent naming
ColorConverter.ts      // Non-component should be camelCase
color-converter.ts     // Avoid kebab-case
```

### React Components

#### Component Structure
```tsx
// ✅ Good - Clear component structure
interface ColorPickerProps {
  value: LabColor;
  onChange: (color: LabColor) => void;
  disabled?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  disabled = false
}) => {
  // Hooks first
  const [localColor, setLocalColor] = useState(value);
  const { showError } = useToast();
  
  // Event handlers
  const handleChange = useCallback((color: LabColor) => {
    setLocalColor(color);
    onChange(color);
  }, [onChange]);
  
  // Render
  return (
    <div className="color-picker">
      {/* Component JSX */}
    </div>
  );
};
```

## 💻 TypeScript Guidelines

### Type Definitions

#### Use Interfaces for Objects
```typescript
// ✅ Good - Interface for object shapes
interface Recipe {
  id: string;
  name: string;
  inks: InkRatio[];
}

// ❌ Bad - Type alias for objects (use for unions/intersections)
type Recipe = {
  id: string;
  name: string;
};
```

#### Explicit Return Types
```typescript
// ✅ Good - Explicit return type
function calculateTAC(inks: InkRatio[]): number {
  return inks.reduce((sum, ink) => sum + ink.ratio, 0);
}

// ❌ Bad - Implicit return type
function calculateTAC(inks: InkRatio[]) {
  return inks.reduce((sum, ink) => sum + ink.ratio, 0);
}
```

#### Avoid `any`
```typescript
// ✅ Good - Specific types
function processData(data: unknown): ProcessedData {
  if (isValidData(data)) {
    return transformData(data);
  }
  throw new Error('Invalid data');
}

// ❌ Bad - Using any
function processData(data: any) {
  return transformData(data);
}
```

### Error Handling

```typescript
// ✅ Good - Comprehensive error handling
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', error);
  
  if (error instanceof NetworkError) {
    throw ErrorFactory.network('NETWORK_ERROR', { cause: error });
  }
  
  throw ErrorFactory.custom('UNKNOWN_ERROR', error.message);
}

// ❌ Bad - Silent failure
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.log(error);
  return null;
}
```

## ⚛️ React Best Practices

### Hooks Rules

```typescript
// ✅ Good - Hooks at top level
function ColorMixer() {
  const [color, setColor] = useState<LabColor>();
  const deltaE = useMemo(() => calculate(color), [color]);
  
  if (!color) return null;
  
  return <div>{/* ... */}</div>;
}

// ❌ Bad - Conditional hooks
function ColorMixer() {
  if (someCondition) {
    const [color, setColor] = useState(); // Never do this!
  }
}
```

### Component Composition

```tsx
// ✅ Good - Small, focused components
const ColorInput: React.FC<ColorInputProps> = ({ value, onChange }) => {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
};

const ColorForm: React.FC = () => {
  const [lab, setLab] = useState<LabColor>({ L: 50, a: 0, b: 0 });
  
  return (
    <form>
      <ColorInput value={lab.L} onChange={(L) => setLab({ ...lab, L })} />
      <ColorInput value={lab.a} onChange={(a) => setLab({ ...lab, a })} />
      <ColorInput value={lab.b} onChange={(b) => setLab({ ...lab, b })} />
    </form>
  );
};
```

### Performance Optimization

```typescript
// ✅ Good - Memoization for expensive operations
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const processedData = useMemo(
    () => expensiveProcessing(data),
    [data]
  );
  
  const handleClick = useCallback(() => {
    doSomething(processedData);
  }, [processedData]);
  
  return <div onClick={handleClick}>{/* ... */}</div>;
};

// ❌ Bad - Recreating functions on every render
const ExpensiveComponent: React.FC<Props> = ({ data }) => {
  const processedData = expensiveProcessing(data); // Runs every render!
  
  return (
    <div onClick={() => doSomething(processedData)}>
      {/* ... */}
    </div>
  );
};
```

## 🎨 CSS/Styling Guidelines

### Class Naming (BEM-inspired)

```css
/* ✅ Good - Clear, semantic class names */
.color-picker { }
.color-picker__input { }
.color-picker__input--disabled { }
.color-picker__button { }
.color-picker__button--primary { }

/* ❌ Bad - Unclear names */
.cp { }
.input-1 { }
.btn-blue { }
```

### Tailwind CSS Usage

```tsx
// ✅ Good - Organized, readable classes
<div className="
  flex flex-col gap-4
  p-6 rounded-lg
  bg-white shadow-md
  hover:shadow-lg transition-shadow
">

// ❌ Bad - Long, unorganized string
<div className="flex flex-col gap-4 p-6 rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow">
```

## 📁 File Organization

### Directory Structure

```
src/
├── core/                 # Business logic (no React)
│   ├── domain/          # Domain models
│   ├── services/        # Business services
│   └── utils/          # Pure utilities
├── components/          # React components
│   ├── common/         # Shared components
│   ├── features/       # Feature-specific components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── styles/             # Global styles
└── types/              # Shared TypeScript types
```

### Import Order

```typescript
// ✅ Good - Organized imports
// 1. External dependencies
import React, { useState, useCallback } from 'react';
import { toast } from 'react-toastify';

// 2. Internal absolute imports
import { ColorConverter } from '@/core/services/colorConverter';
import { LabColor } from '@/core/domain/color';

// 3. Internal relative imports
import { ColorPicker } from './ColorPicker';
import { useColorValidation } from '../hooks/useColorValidation';

// 4. Styles
import './ColorForm.css';

// 5. Types
import type { ColorFormProps } from './types';
```

## 📖 Documentation

### JSDoc Comments

```typescript
/**
 * Calculates the color difference between two Lab colors using the specified method.
 * 
 * @param color1 - First color in Lab space
 * @param color2 - Second color in Lab space
 * @param method - Delta E calculation method (default: 'CIE2000')
 * @returns Color difference value (0 = identical, 100 = maximum difference)
 * 
 * @example
 * const deltaE = calculateDeltaE(
 *   { L: 50, a: 20, b: -30 },
 *   { L: 52, a: 19, b: -28 },
 *   'CIE2000'
 * );
 * // Returns: 2.34
 */
export function calculateDeltaE(
  color1: LabColor,
  color2: LabColor,
  method: DeltaEMethod = 'CIE2000'
): number {
  // Implementation
}
```

### Inline Comments

```typescript
// ✅ Good - Explains WHY, not WHAT
// We need to normalize the hue angle to [0, 360) for proper calculation
const normalizedHue = hue < 0 ? hue + 360 : hue;

// ❌ Bad - Explains what the code already says
// Add 1 to count
count = count + 1;
```

## 🧪 Testing Conventions

### Test File Naming

```typescript
// Component tests
ColorPicker.test.tsx

// Service tests
colorConverter.test.ts

// Integration tests
colorWorkflow.integration.test.ts
```

### Test Structure

```typescript
describe('ColorConverter', () => {
  describe('labToRGB', () => {
    it('should convert Lab white to RGB white', () => {
      // Arrange
      const labWhite: LabColor = { L: 100, a: 0, b: 0 };
      
      // Act
      const rgb = converter.labToRGB(labWhite);
      
      // Assert
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });
    
    it('should handle out-of-gamut colors', () => {
      // Test edge cases
    });
  });
});
```

## 🚫 Anti-Patterns to Avoid

### 1. Magic Numbers
```typescript
// ❌ Bad
if (deltaE < 2.3) { /* ... */ }

// ✅ Good
const PERCEPTIBLE_DIFFERENCE_THRESHOLD = 2.3;
if (deltaE < PERCEPTIBLE_DIFFERENCE_THRESHOLD) { /* ... */ }
```

### 2. Nested Ternaries
```typescript
// ❌ Bad
const status = deltaE < 1 ? 'perfect' : deltaE < 5 ? 'good' : 'poor';

// ✅ Good
const getStatus = (deltaE: number): string => {
  if (deltaE < 1) return 'perfect';
  if (deltaE < 5) return 'good';
  return 'poor';
};
```

### 3. Mutation
```typescript
// ❌ Bad - Mutating state
const updateRecipe = (recipe: Recipe) => {
  recipe.name = 'New Name'; // Mutation!
  return recipe;
};

// ✅ Good - Immutable update
const updateRecipe = (recipe: Recipe): Recipe => {
  return {
    ...recipe,
    name: 'New Name'
  };
};
```

## 🛠️ Development Tools

### Required VS Code Extensions
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Error Lens

### ESLint Configuration

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "react/prop-types": "off"
  }
}
```

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

## ✅ Code Review Checklist

Before submitting a PR, ensure:

- [ ] Code follows naming conventions
- [ ] TypeScript types are properly defined
- [ ] No `any` types without justification
- [ ] Error handling is comprehensive
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Performance considerations addressed
- [ ] Accessibility requirements met
- [ ] Code is DRY (Don't Repeat Yourself)

---

*Style guide ensuring consistent, maintainable code across the project*