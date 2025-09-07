# 🏗️ Architecture Overview

## 📐 System Architecture

WonLabel Color Maker follows **Clean Architecture** principles with Domain-Driven Design (DDD) to ensure maintainability, testability, and scalability.

```
┌─────────────────────────────────────────────────────────────┐
│                      Presentation Layer                      │
│                    (React Components, UI)                    │
├─────────────────────────────────────────────────────────────┤
│                      Application Layer                       │
│                  (Hooks, State Management)                   │
├─────────────────────────────────────────────────────────────┤
│                        Domain Layer                          │
│              (Business Logic, Domain Models)                 │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│              (External APIs, Local Storage)                  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Core Design Principles

### 1. Separation of Concerns
- **Domain**: Pure business logic, no framework dependencies
- **Application**: Use cases and orchestration
- **Infrastructure**: External services and persistence
- **Presentation**: UI components and user interaction

### 2. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Abstractions don't depend on details

### 3. Single Responsibility
- Each module has one reason to change
- Clear boundaries between responsibilities
- Focused, cohesive components

## 📦 Module Structure

### Core Domain (`src/core/domain/`)

```typescript
// Domain models are pure TypeScript with no external dependencies
export interface LabColor {
  L: number;  // Lightness (0-100)
  a: number;  // Green-Red (-128 to 127)
  b: number;  // Blue-Yellow (-128 to 127)
}

export interface Recipe {
  id: string;
  name: string;
  targetColor: LabColor;
  inks: InkRatio[];
  status: RecipeStatus;
  metadata: RecipeMetadata;
}
```

**Key Domain Entities:**
- `Color`: Lab, XYZ, RGB color representations
- `Ink`: Base ink properties and characteristics
- `Recipe`: Ink mixing recipes and formulations
- `Settings`: Application configuration
- `Correction`: Color correction suggestions

### Core Services (`src/core/services/`)

```typescript
// Services implement business logic using domain models
export class DeltaEService {
  calculateDeltaE76(color1: LabColor, color2: LabColor): number
  calculateDeltaE94(color1: LabColor, color2: LabColor): number
  calculateDeltaE00(color1: LabColor, color2: LabColor): number
  calculateCMC(color1: LabColor, color2: LabColor): number
}
```

**Key Services:**
- `ColorConverter`: Color space conversions
- `DeltaEService`: Color difference calculations
- `ColorMixingService`: Ink mixing predictions
- `RecipeService`: Recipe management
- `ValidationService`: Business rule validation

### Error Handling (`src/core/errors/`)

```typescript
// Hierarchical error system with user/developer separation
AppError
├── ValidationError    // Input validation failures
├── CalculationError   // Computation errors
├── NetworkError       // API/network issues
└── BusinessError      // Business rule violations
```

### Infrastructure Layer

```typescript
// Adapters for external services
export interface StorageAdapter {
  save<T>(key: string, data: T): Promise<void>
  load<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
}

export class LocalStorageAdapter implements StorageAdapter {
  // Implementation using browser localStorage
}
```

## 🔄 Data Flow

### Unidirectional Data Flow

```
User Action → Component → Hook → Service → Domain → State Update → UI Update
```

1. **User Action**: Click, input, or gesture
2. **Component**: Captures event, calls hook
3. **Hook**: Orchestrates business logic
4. **Service**: Executes domain operations
5. **Domain**: Pure business logic execution
6. **State Update**: Immutable state change
7. **UI Update**: React re-render

### Example: Color Calculation Flow

```typescript
// 1. User inputs color values
<ColorInput onChange={handleColorChange} />

// 2. Component handles change
const handleColorChange = (color: LabColor) => {
  // 3. Hook orchestrates
  const result = useColorCalculation(color);
  // ...
};

// 4. Hook uses services
const useColorCalculation = (color: LabColor) => {
  const converter = new ColorConverter();
  const validator = new ColorValidator();
  
  // 5. Validate input
  if (!validator.isValid(color)) {
    throw new ValidationError();
  }
  
  // 6. Execute business logic
  const rgb = converter.labToRGB(color);
  
  // 7. Update state
  setState({ color, rgb });
};
```

## 🧩 Component Architecture

### Component Hierarchy

```
App
├── ErrorBoundary
│   ├── ToastProvider
│   │   ├── NetworkGuard
│   │   │   ├── AccessibilityGuard
│   │   │   │   ├── Layout
│   │   │   │   │   ├── Header
│   │   │   │   │   ├── Main
│   │   │   │   │   │   ├── ColorMixer
│   │   │   │   │   │   ├── RecipeManager
│   │   │   │   │   │   └── Analysis
│   │   │   │   │   └── Footer
```

### Component Categories

1. **Guards**: Error boundaries, network monitoring, accessibility
2. **Layout**: Page structure and navigation
3. **Features**: Business functionality components
4. **Common**: Reusable UI components
5. **Notifications**: Toast, alerts, modals

## 🎨 Design Patterns

### 1. Factory Pattern
```typescript
export class ErrorFactory {
  static validation(code: string, context?: any): ValidationError
  static calculation(code: string, context?: any): CalculationError
  static network(code: string, context?: any): NetworkError
}
```

### 2. Strategy Pattern
```typescript
interface DeltaEStrategy {
  calculate(color1: LabColor, color2: LabColor): number
}

class DeltaE76Strategy implements DeltaEStrategy { /* ... */ }
class DeltaE94Strategy implements DeltaEStrategy { /* ... */ }
class DeltaE00Strategy implements DeltaEStrategy { /* ... */ }
```

### 3. Observer Pattern
```typescript
// Event-driven notifications
window.dispatchEvent(new CustomEvent('app-error', { detail: error }));
window.addEventListener('app-error', handleError);
```

### 4. Singleton Pattern
```typescript
export class Logger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
}
```

### 5. Repository Pattern
```typescript
export interface RecipeRepository {
  findById(id: string): Promise<Recipe>
  save(recipe: Recipe): Promise<void>
  delete(id: string): Promise<void>
  findAll(): Promise<Recipe[]>
}
```

## 🔐 Security Architecture

### Input Validation Pipeline

```
User Input → Sanitization → Validation → Business Logic
           ↓              ↓            ↓
       Clean Data    Valid Data   Safe Processing
```

### Security Layers

1. **Input Sanitization**: Remove dangerous characters
2. **Type Validation**: Ensure correct data types
3. **Range Validation**: Enforce business constraints
4. **XSS Prevention**: Escape HTML entities
5. **CORS Policy**: Restrict cross-origin requests

## ⚡ Performance Optimization

### Code Splitting
```typescript
// Lazy load heavy components
const ColorAnalysis = lazy(() => import('./components/ColorAnalysis'));
```

### Memoization
```typescript
// Expensive calculations are memoized
const deltaE = useMemo(
  () => calculateDeltaE(color1, color2),
  [color1, color2]
);
```

### Virtual Rendering
```typescript
// Large lists use virtualization
<VirtualList
  items={recipes}
  itemHeight={80}
  renderItem={renderRecipeCard}
/>
```

## 🧪 Testing Architecture

### Testing Pyramid

```
        E2E Tests (5%)
       /            \
    Integration (25%) 
   /                \
Unit Tests (70%)
```

### Test Organization

```
src/
├── core/
│   ├── domain/
│   │   └── __tests__/
│   │       ├── color.test.ts
│   │       └── recipe.test.ts
│   └── services/
│       └── __tests__/
│           ├── deltaE.test.ts
│           └── colorMixing.test.ts
```

## 📊 State Management

### Local State
- Component-specific state using `useState`
- Form state using controlled components

### Shared State
- Context API for cross-component state
- Custom hooks for business logic

### Persistent State
- LocalStorage for user preferences
- IndexedDB for large datasets

## 🔄 Build Pipeline

```
Source Code → TypeScript Compilation → Bundling → Optimization → Distribution
            ↓                        ↓          ↓              ↓
        Type Checking            Tree Shaking  Minification  CDN Deploy
```

## 📈 Monitoring & Telemetry

### Application Metrics
- Performance timing
- Error rates
- User interactions
- Feature usage

### Technical Metrics
- Bundle size
- Load time
- Runtime performance
- Memory usage

## 🚀 Deployment Architecture

### Production Environment

```
CloudFlare CDN
     ↓
Vercel Edge Network
     ↓
Static Assets (React App)
     ↓
API Gateway
     ↓
Backend Services (Future)
```

### Development Environment

```
Local Development Server (Vite)
     ↓
Hot Module Replacement
     ↓
TypeScript Compiler
     ↓
Browser
```

## 🔮 Future Architecture Considerations

### Microservices (v2.0)
- Color calculation service
- Recipe management service
- User management service
- Analytics service

### Event-Driven Architecture
- Event sourcing for recipe history
- CQRS for read/write separation
- Message queue for async operations

### Scalability
- Horizontal scaling for API
- Database sharding
- Redis caching layer
- CDN for global distribution

---

*Architecture document following Clean Architecture principles with DDD*