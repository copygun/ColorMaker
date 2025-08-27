# 🧹 Codebase Cleanup Plan

## Cleanup Scope
- **Target**: Entire ink mixing calculator codebase
- **Mode**: Safe cleanup (preserving functionality)
- **Date**: 2025-08-25

## Issues Identified

### 1. Test Files (18 files) 
- Multiple test HTML and JS files scattered in root
- Should be moved to `tests/` directory or removed if obsolete

### 2. TypeScript Issues (12 errors)
- Unused imports and variables
- @ts-ignore annotations (9 instances)
- Type safety issues in components

### 3. Console Statements (4 instances)
- Development console.log/error statements in production code

### 4. Code Quality Issues
- Missing type definitions for core modules
- Inconsistent error handling
- Duplicate styling in components

## Cleanup Actions

### Phase 1: Immediate Cleanup ✅
1. Remove unused imports
2. Remove console statements (keep error logs)  
3. Fix TypeScript errors
4. Remove unnecessary @ts-ignore

### Phase 2: Test File Organization 📁
1. Create `tests/` directory
2. Move test files to organized structure
3. Remove obsolete test files

### Phase 3: Type Safety 🔒
1. Create type definitions for core modules
2. Remove @ts-ignore annotations
3. Fix implicit any types

### Phase 4: Code Optimization 🚀
1. Extract inline styles to CSS modules
2. Consolidate duplicate code
3. Optimize imports

## Files to Modify

### High Priority
- `src/App.tsx` - Remove console.log, unused import
- `src/components/ColorCorrection.tsx` - Remove unused import
- `src/components/OptimizedMixing.tsx` - Fix jsx prop, type issues
- `src/components/ProfessionalMixing.tsx` - Fix jsx prop
- `src/hooks/useColorCalculation.ts` - Fix type issues

### Medium Priority
- Move 18 test files to `tests/` directory
- Create type definitions in `core/types.d.ts`

### Low Priority
- Extract inline styles
- Add ESLint configuration

## Safety Measures
- ✅ Create backup before changes
- ✅ Test after each phase
- ✅ Preserve all functionality
- ✅ Document changes made