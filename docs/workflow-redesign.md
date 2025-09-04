# 워크플로우 재설계 문서

## 현재 시스템 문제점

### 1. 레시피 선택 프로세스 부재
- 여러 레시피 생성 후 어떤 것을 사용할지 선택하는 기능 없음
- currentRecipe와 optimizedRecipes가 독립적으로 존재
- 실제 작업에 사용할 레시피를 명시적으로 지정할 수 없음

### 2. 작업 상태 관리 부재
- 레시피의 작업 진행 상태를 추적할 수 없음
- 언제 조색 작업이 완료되었는지 알 수 없음
- 보정이 필요한지, 완료되었는지 구분 불가

### 3. 색상 보정 컨텍스트 문제
- 어떤 레시피를 사용한 결과인지 명확하지 않음
- currentRecipe에만 보정이 적용되는 제한

## 제안하는 새로운 워크플로우

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  색상 입력  │ --> │ 레시피 계산 │ --> │ 레시피 목록 │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │ 레시피 선택 │
                                        │ (작업 시작) │
                                        └──────────────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │  상태: 진행중 │
                                        │   (조색 중)  │
                                        └──────────────┘
                                                │
                                                ▼
                                        ┌──────────────┐
                                        │  색상 측정   │
                                        └──────────────┘
                                                │
                            ┌───────────────────┴───────────────────┐
                            ▼                                       ▼
                    ┌──────────────┐                       ┌──────────────┐
                    │  Delta E < 2 │                       │  Delta E ≥ 2 │
                    │  상태: 완료  │                       │   색상 보정  │
                    └──────────────┘                       └──────────────┘
                                                                    │
                                                                    ▼
                                                            ┌──────────────┐
                                                            │ 보정 레시피  │
                                                            │    적용      │
                                                            └──────────────┘
```

## 구현 계획

### 1단계: 데이터 구조 개선
```typescript
interface Recipe {
  id: string;                    // 고유 ID
  name: string;                   // 레시피 이름 (예: "선택된 잉크", "최적화 #1")
  type: 'selected' | 'optimized'; // 레시피 유형
  status: RecipeStatus;          // 작업 상태
  createdAt: string;             // 생성 시간
  startedAt?: string;            // 작업 시작 시간
  completedAt?: string;          // 작업 완료 시간
  // ... 기존 필드들
}

enum RecipeStatus {
  CALCULATED = 'calculated',     // 계산 완료 (초기 상태)
  SELECTED = 'selected',         // 작업용으로 선택됨
  IN_PROGRESS = 'in_progress',   // 조색 진행 중
  MEASURING = 'measuring',       // 색상 측정 중
  COMPLETED = 'completed',       // 작업 완료
  NEEDS_CORRECTION = 'needs_correction', // 보정 필요
  CORRECTING = 'correcting',     // 보정 중
  CORRECTED = 'corrected'        // 보정 완료
}
```

### 2단계: UI 컴포넌트 개선

#### A. RecipeResults 컴포넌트
- 각 레시피에 "이 레시피로 작업 시작" 버튼 추가
- 선택된 레시피 하이라이트 표시
- 작업 상태 배지 표시

#### B. RecipeManagement 탭
- 작업 상태별 필터링
- 상태 변경 버튼 (진행중 → 측정 → 완료/보정필요)
- 작업 타임라인 표시

#### C. ColorCorrectionModal
- 작업 중인 레시피 자동 선택
- 레시피 정보 표시

### 3단계: 상태 관리 로직

```typescript
// ProfessionalApp.tsx에 추가할 상태
const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);
const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);

// 레시피 선택 함수
const selectRecipeForWork = (recipeId: string) => {
  setActiveRecipeId(recipeId);
  updateRecipeStatus(recipeId, RecipeStatus.SELECTED);
  // 작업 시작 시간 기록
};

// 상태 변경 함수
const updateRecipeStatus = (recipeId: string, status: RecipeStatus) => {
  setAllRecipes(prev => 
    prev.map(recipe => 
      recipe.id === recipeId 
        ? { ...recipe, status, updatedAt: new Date().toISOString() }
        : recipe
    )
  );
};
```

### 4단계: 워크플로우 통합

1. **레시피 계산 시**
   - 모든 레시피를 allRecipes에 저장
   - 각 레시피에 고유 ID 부여
   - 초기 상태: CALCULATED

2. **작업 시작 시**
   - 레시피 선택 → activeRecipeId 설정
   - 상태를 IN_PROGRESS로 변경
   - 작업 시작 시간 기록

3. **색상 보정 시**
   - activeRecipeId의 레시피 사용
   - 보정 결과를 해당 레시피에 연결

4. **작업 완료 시**
   - 상태를 COMPLETED로 변경
   - 완료 시간 기록
   - 레시피 이력에 저장

## 예상 효과

1. **명확한 작업 흐름**: 어떤 레시피로 작업 중인지 명확
2. **상태 추적**: 각 레시피의 진행 상황 파악 가능
3. **이력 관리**: 완료된 작업과 진행 중인 작업 구분
4. **보정 컨텍스트**: 어떤 레시피에 대한 보정인지 명확
5. **레시피 관리 탭 활성화**: 실제 운영 가능한 관리 시스템

## 구현 우선순위

1. Recipe 타입 확장 (id, status, timestamps 추가)
2. 레시피 선택 UI 구현
3. 작업 상태 관리 로직
4. 레시피 관리 탭 개선
5. 색상 보정 워크플로우 통합