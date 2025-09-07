# 🧪 Testing Guide

## 📋 Overview

This guide covers testing strategies, patterns, and best practices for the WonLabel Color Maker application. We use Vitest as our testing framework with React Testing Library for component testing.

## 🎯 Testing Philosophy

### Testing Pyramid

```
         E2E Tests
        /    5%    \
       /           \
    Integration Tests
      /    25%     \
     /             \
    Unit Tests
       70%
```

- **Unit Tests (70%)**: Test individual functions and components in isolation
- **Integration Tests (25%)**: Test interactions between multiple components
- **E2E Tests (5%)**: Test complete user workflows

### Core Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **Arrange-Act-Assert** - Structure tests clearly
3. **One assertion per test** - Keep tests focused
4. **Fast and deterministic** - Tests should be reliable and quick
5. **Test edge cases** - Include boundary values and error conditions

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once
npm run test:run

# Run with coverage
npm run test:coverage

# Run tests matching a pattern
npm test color

# Run tests in UI mode
npm run test:ui
```

### Test File Location

```
src/
├── core/
│   ├── domain/
│   │   ├── color.ts
│   │   └── __tests__/
│   │       └── color.test.ts
│   └── services/
│       ├── colorConverter.ts
│       └── __tests__/
│           └── colorConverter.test.ts
```

## 🔧 Test Setup

### Configuration (`vitest.config.ts`)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },
});
```

### Test Setup File (`src/test/setup.ts`)

```typescript
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock browser APIs
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

## 📝 Writing Tests

### Unit Tests

#### Testing Pure Functions

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDeltaE76 } from '../deltaE';

describe('calculateDeltaE76', () => {
  it('should return 0 for identical colors', () => {
    // Arrange
    const color = { L: 50, a: 20, b: -30 };
    
    // Act
    const deltaE = calculateDeltaE76(color, color);
    
    // Assert
    expect(deltaE).toBe(0);
  });
  
  it('should calculate correct delta E for known values', () => {
    // Arrange
    const color1 = { L: 50, a: 2.6772, b: -79.7751 };
    const color2 = { L: 50, a: 0, b: -82.7485 };
    
    // Act
    const deltaE = calculateDeltaE76(color1, color2);
    
    // Assert
    expect(deltaE).toBeCloseTo(4.0011, 2);
  });
  
  it('should handle edge cases', () => {
    // Test with extreme values
    const black = { L: 0, a: 0, b: 0 };
    const white = { L: 100, a: 0, b: 0 };
    
    const deltaE = calculateDeltaE76(black, white);
    
    expect(deltaE).toBe(100);
  });
});
```

#### Testing Classes

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ColorConverter } from '../colorConverter';

describe('ColorConverter', () => {
  let converter: ColorConverter;
  
  beforeEach(() => {
    converter = new ColorConverter();
  });
  
  describe('labToRGB', () => {
    it('should convert Lab white to RGB white', () => {
      const labWhite = { L: 100, a: 0, b: 0 };
      const rgb = converter.labToRGB(labWhite);
      
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });
    
    it('should clamp out-of-gamut colors', () => {
      const outOfGamut = { L: 50, a: 100, b: 100 };
      const rgb = converter.labToRGB(outOfGamut);
      
      expect(rgb.r).toBeGreaterThanOrEqual(0);
      expect(rgb.r).toBeLessThanOrEqual(255);
      expect(rgb.g).toBeGreaterThanOrEqual(0);
      expect(rgb.g).toBeLessThanOrEqual(255);
      expect(rgb.b).toBeGreaterThanOrEqual(0);
      expect(rgb.b).toBeLessThanOrEqual(255);
    });
  });
});
```

### Component Tests

#### Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker } from '../ColorPicker';

describe('ColorPicker', () => {
  it('should render with initial value', () => {
    const color = { L: 50, a: 20, b: -30 };
    
    render(<ColorPicker value={color} onChange={() => {}} />);
    
    expect(screen.getByLabelText('Lightness')).toHaveValue('50');
    expect(screen.getByLabelText('a* (green-red)')).toHaveValue('20');
    expect(screen.getByLabelText('b* (blue-yellow)')).toHaveValue('-30');
  });
  
  it('should call onChange when value changes', () => {
    const handleChange = vi.fn();
    const color = { L: 50, a: 0, b: 0 };
    
    render(<ColorPicker value={color} onChange={handleChange} />);
    
    const lightnessInput = screen.getByLabelText('Lightness');
    fireEvent.change(lightnessInput, { target: { value: '75' } });
    
    expect(handleChange).toHaveBeenCalledWith({
      L: 75,
      a: 0,
      b: 0
    });
  });
  
  it('should validate input ranges', () => {
    const handleChange = vi.fn();
    const color = { L: 50, a: 0, b: 0 };
    
    render(<ColorPicker value={color} onChange={handleChange} />);
    
    const lightnessInput = screen.getByLabelText('Lightness');
    fireEvent.change(lightnessInput, { target: { value: '150' } });
    
    expect(screen.getByText('Value must be between 0 and 100')).toBeInTheDocument();
    expect(handleChange).not.toHaveBeenCalled();
  });
});
```

#### Testing Hooks

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useColorCalculation } from '../useColorCalculation';

describe('useColorCalculation', () => {
  it('should calculate derived colors', () => {
    const { result } = renderHook(() => 
      useColorCalculation({ L: 50, a: 20, b: -30 })
    );
    
    expect(result.current.rgb).toEqual({ r: 147, g: 108, b: 172 });
    expect(result.current.hex).toBe('#936CAC');
  });
  
  it('should update when input changes', () => {
    const { result, rerender } = renderHook(
      ({ color }) => useColorCalculation(color),
      {
        initialProps: { color: { L: 50, a: 20, b: -30 } }
      }
    );
    
    expect(result.current.hex).toBe('#936CAC');
    
    rerender({ color: { L: 0, a: 0, b: 0 } });
    
    expect(result.current.hex).toBe('#000000');
  });
});
```

### Integration Tests

#### Testing Component Interactions

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ColorMixer } from '../ColorMixer';
import { ToastProvider } from '../Toast';

describe('ColorMixer Integration', () => {
  it('should mix colors and show result', async () => {
    render(
      <ToastProvider>
        <ColorMixer />
      </ToastProvider>
    );
    
    // Add first color
    fireEvent.click(screen.getByText('Add Color'));
    fireEvent.change(screen.getByLabelText('Color 1 L'), {
      target: { value: '50' }
    });
    
    // Add second color
    fireEvent.click(screen.getByText('Add Color'));
    fireEvent.change(screen.getByLabelText('Color 2 L'), {
      target: { value: '75' }
    });
    
    // Mix colors
    fireEvent.click(screen.getByText('Mix Colors'));
    
    // Check result
    await waitFor(() => {
      expect(screen.getByText(/Mixed Color:/)).toBeInTheDocument();
      expect(screen.getByText(/L: 62.5/)).toBeInTheDocument();
    });
  });
  
  it('should show error for invalid ratios', async () => {
    render(
      <ToastProvider>
        <ColorMixer />
      </ToastProvider>
    );
    
    // Add colors with invalid ratios
    fireEvent.click(screen.getByText('Add Color'));
    fireEvent.change(screen.getByLabelText('Ratio 1'), {
      target: { value: '0.3' }
    });
    
    fireEvent.click(screen.getByText('Add Color'));
    fireEvent.change(screen.getByLabelText('Ratio 2'), {
      target: { value: '0.5' }
    });
    
    fireEvent.click(screen.getByText('Mix Colors'));
    
    await waitFor(() => {
      expect(screen.getByText('Ratios must sum to 100%')).toBeInTheDocument();
    });
  });
});
```

### Testing Error Scenarios

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ErrorBoundary } from '../ErrorBoundary';
import { render, screen } from '@testing-library/react';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch errors and display fallback', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument();
    expect(screen.getByText('다시 시도')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});
```

## 🎭 Mocking

### Mocking Modules

```typescript
import { vi } from 'vitest';

// Mock a module
vi.mock('../services/api', () => ({
  fetchRecipes: vi.fn(() => Promise.resolve([])),
  saveRecipe: vi.fn(() => Promise.resolve({ id: '123' })),
}));

// Use in test
import { fetchRecipes } from '../services/api';

it('should fetch recipes', async () => {
  const recipes = await fetchRecipes();
  expect(recipes).toEqual([]);
});
```

### Mocking Browser APIs

```typescript
import { vi } from 'vitest';

describe('NetworkGuard', () => {
  it('should detect offline status', () => {
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });
    
    render(<NetworkGuard />);
    
    expect(screen.getByText('오프라인 상태입니다')).toBeInTheDocument();
  });
});
```

## 📊 Code Coverage

### Coverage Requirements

- **Minimum**: 80% for all metrics
- **Target**: 90% for critical paths
- **Excluded**: Generated files, types, constants

### Viewing Coverage

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html  # Mac/Linux
start coverage/index.html # Windows
```

### Coverage Comments

```typescript
/* istanbul ignore next - Defensive code that should never execute */
if (!window) {
  throw new Error('Window is not defined');
}

/* istanbul ignore file - Configuration file */
```

## 🏃 Performance Testing

### Testing Performance

```typescript
import { describe, it, expect } from 'vitest';
import { measurePerformance } from '../utils/performance';

describe('Performance', () => {
  it('should calculate delta E in under 10ms', () => {
    const start = performance.now();
    
    calculateDeltaE(color1, color2);
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(10);
  });
  
  it('should render 1000 items efficiently', () => {
    const items = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
    }));
    
    const start = performance.now();
    render(<VirtualList items={items} />);
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
    expect(screen.getAllByRole('listitem')).toHaveLength(20); // Virtualized
  });
});
```

## ♿ Accessibility Testing

### Testing Accessibility

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ColorPicker />);
    const results = await axe(container);
    
    expect(results).toHaveNoViolations();
  });
  
  it('should have proper ARIA labels', () => {
    render(<ColorPicker />);
    
    expect(screen.getByLabelText('Lightness')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemin', '0');
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuemax', '100');
  });
});
```

## 📸 Snapshot Testing

### Using Snapshots

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('RecipeCard', () => {
  it('should match snapshot', () => {
    const recipe = {
      id: '1',
      name: 'Blue Mix',
      inks: [
        { id: 'cyan', ratio: 0.7 },
        { id: 'blue', ratio: 0.3 },
      ],
    };
    
    const { container } = render(<RecipeCard recipe={recipe} />);
    
    expect(container).toMatchSnapshot();
  });
});
```

### Updating Snapshots

```bash
# Update snapshots when intentional changes are made
npm test -- -u
```

## 🐛 Debugging Tests

### Debug Output

```typescript
import { debug } from '@testing-library/react';

it('should debug component', () => {
  const { container } = render(<ColorPicker />);
  
  // Print formatted HTML
  debug(container);
  
  // Print specific element
  debug(screen.getByRole('button'));
});
```

### VS Code Debugging

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Tests",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["test"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## ✅ Testing Checklist

Before committing:

- [ ] All tests pass
- [ ] Coverage meets thresholds
- [ ] No console errors in tests
- [ ] Mocks are properly cleaned up
- [ ] Test names are descriptive
- [ ] Edge cases are covered
- [ ] Accessibility tests pass
- [ ] Performance benchmarks met
- [ ] Snapshots are updated if needed
- [ ] No `.only` or `.skip` left in tests

## 🚨 Common Issues

### Issue: Test Timeouts
```typescript
// Increase timeout for slow operations
it('should handle large dataset', async () => {
  // Test code
}, 10000); // 10 second timeout
```

### Issue: Async Testing
```typescript
// Always use async/await or return promises
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### Issue: State Not Updating
```typescript
// Use waitFor for async state updates
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

---

*Comprehensive testing guide for maintaining high code quality*