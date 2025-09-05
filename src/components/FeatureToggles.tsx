import React from 'react';
import type { FeatureFlags } from '../types';

interface FeatureTogglesProps {
  features: FeatureFlags;
  onToggle: (feature: keyof FeatureFlags) => void;
}

const FeatureToggles: React.FC<FeatureTogglesProps> = ({ features, onToggle }) => {
  const featureInfo = {
    USE_XYZ_MIXING: {
      label: 'XYZ 색공간 혼합',
      description: '물리적으로 정확한 색상 혼합',
    },
    USE_PSO_OPTIMIZER: {
      label: 'PSO 최적화',
      description: 'Particle Swarm 최적화 알고리즘',
    },
    USE_CATMULL_ROM: {
      label: 'Catmull-Rom 보간',
      description: '부드러운 농도 보간',
    },
    USE_KUBELKA_MUNK: {
      label: 'Kubelka-Munk 모델',
      description: '비선형 잉크 혼합 (고정밀)',
    },
    ENABLE_TAC_CHECK: {
      label: 'TAC 제약 검사',
      description: 'Total Area Coverage 제한',
    },
    ENABLE_DOT_GAIN: {
      label: 'Dot Gain 보정',
      description: '망점 확대 현상 보정',
    },
    ENABLE_SUBSTRATE: {
      label: '기질 영향 반영',
      description: '용지/필름 특성 반영',
    },
    ENABLE_METALLIC: {
      label: '메탈릭 잉크',
      description: '금속 특수 잉크 지원',
    },
    ENABLE_CERTIFICATE: {
      label: '성적서 생성',
      description: 'PDF 성적서 출력',
    },
  };

  return (
    <div className="feature-toggles">
      {(Object.keys(features) as Array<keyof FeatureFlags>).map((feature) => (
        <div key={feature} className="toggle-item">
          <label className="toggle-label">
            <input type="checkbox" checked={features[feature]} onChange={() => onToggle(feature)} />
            <span className="toggle-switch"></span>
            <div className="toggle-info">
              <div className="toggle-name">{featureInfo[feature].label}</div>
              <div className="toggle-desc">{featureInfo[feature].description}</div>
            </div>
          </label>
        </div>
      ))}
    </div>
  );
};

export default FeatureToggles;
