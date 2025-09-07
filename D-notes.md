# D-notes: 세션 D 리팩토링 의사결정 근거

## 📋 개요
세션 D에서는 TypeScript/React 코드베이스를 Clean Architecture 원칙에 따라 재구조화했습니다.

## 🎯 목표
1. **명확한 레이어 분리**: core(도메인) / ui(표현) / infra(인프라)
2. **순환 의존성 제거**: 단방향 의존성 그래프 구축
3. **테스트 용이성**: 비즈니스 로직을 순수 함수로 분리
4. **유지보수성**: 모듈 간 경계 명확화

## 🏗️ 아키텍처 결정

### 1. 레이어 구조
```
src/
├── core/           # 비즈니스 로직 (프레임워크 독립적)
│   ├── domain/     # 엔티티, 값 객체, 비즈니스 규칙
│   ├── services/   # 도메인 서비스, 유스케이스
│   └── utils/      # 순수 유틸리티 함수
├── ui/            # React 프레젠테이션 레이어
│   ├── components/ # 재사용 가능한 UI 컴포넌트
│   ├── containers/ # 페이지 레벨 컨테이너
│   ├── contexts/   # React Context providers
│   └── hooks/      # Custom React hooks
└── infra/         # 외부 시스템 연동
    ├── storage/    # LocalStorage, IndexedDB
    └── api/        # HTTP clients, WebSocket
```

**근거**: 
- Dependency Rule 준수 (내부 → 외부 의존성만 허용)
- 비즈니스 로직의 프레임워크 독립성
- 테스트 피라미드 지원 (단위 > 통합 > E2E)

### 2. 도메인 모델 설계

#### Color Domain
- **Value Object Pattern**: 불변 색상 표현
- **타입 안전성**: LabColor, XYZColor, RGBColor 분리
- **검증 로직**: isValidLabColor, areColorsEqual

#### Ink Domain
- **Entity Pattern**: 고유 ID를 가진 잉크
- **Business Invariants**: TAC 제한, 비율 검증
- **농도 관리**: 40%, 70%, 100% 지원

#### Recipe Domain
- **Aggregate Root**: 레시피가 중심 집합체
- **State Machine**: RecipeStatus 상태 전이
- **품질 평가**: Delta E 기반 자동 평가

#### Settings Domain
- **Configuration Objects**: 계산 옵션, 프린터 프로파일
- **Feature Flags**: 기능 토글 지원
- **Validation**: 설정값 유효성 검증

#### Correction Domain
- **Workflow Management**: 보정 프로세스 관리
- **Learning Integration**: 머신러닝 연동 준비
- **History Tracking**: 보정 이력 추적

### 3. 서비스 레이어 설계

#### Delta E Service
- **순수 함수**: 부작용 없는 색차 계산
- **다양한 알고리즘**: E76, E94, E00, CMC
- **Strategy Pattern**: 알고리즘 선택 가능

#### Color Mixing Service
- **물리 모델**: Lab, XYZ, Kubelka-Munk
- **농도 보간**: 선형/비선형 보간
- **검증 로직**: 비율 합계 검증

### 4. 하위 호환성 전략

#### types/index.ts 마이그레이션
```typescript
// 기존 코드 호환성 유지
export type { LabColor, Ink, Recipe } from '../core/domain';

// 점진적 마이그레이션 지원
declare module '../core/domain' {
  interface Recipe {
    // 레거시 필드 임시 유지
    targetColor?: LabColor;
    mixedColor?: LabColor;
  }
}
```

**근거**:
- Breaking changes 최소화
- 점진적 마이그레이션 가능
- 기존 컴포넌트 즉시 작동

## 📊 개선 효과

### Before (모놀리틱)
- types/index.ts: 164줄 (모든 타입 혼재)
- 순환 의존성 존재
- 비즈니스 로직과 UI 결합
- 테스트 어려움

### After (레이어드)
- core/domain/*: 5개 모듈로 분리
- 단방향 의존성 그래프
- 순수 함수 비즈니스 로직
- 단위 테스트 용이

## 🔄 마이그레이션 계획

### Phase 1: 타입 분리 ✅
- core/domain 모듈 생성
- types/index.ts 리다이렉트
- 하위 호환성 유지

### Phase 2: 서비스 추출 (진행중)
- useColorCalculation → core/services
- LocalLearningSystem → core/services + infra/storage

### Phase 3: UI 정리 (예정)
- 컴포넌트 재구성
- 컨테이너/프레젠테이션 분리
- Context 통합

### Phase 4: 인프라 격리 (예정)
- Storage 추상화
- API 클라이언트 분리

## 🚀 다음 단계

1. **useColorCalculation 리팩토링**
   - 539줄 → 3개 서비스로 분리
   - React 의존성 제거

2. **LocalLearningSystem 분해**
   - 718줄 → core + infra로 분리
   - 저장소 패턴 적용

3. **ProfessionalApp 재구성**
   - 1923줄 → 컨테이너 + 컨텍스트로 분리
   - 상태 관리 개선

## 📝 교훈

### 성공 요인
- 점진적 마이그레이션 전략
- 하위 호환성 유지
- 명확한 레이어 경계

### 주의사항
- 과도한 추상화 경계
- 성급한 최적화 자제
- 팀 합의 필요

## 🔗 참고자료
- Clean Architecture (Robert C. Martin)
- Domain-Driven Design (Eric Evans)
- Refactoring (Martin Fowler)