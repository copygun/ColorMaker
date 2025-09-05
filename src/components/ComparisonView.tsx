import React from 'react';

interface ComparisonViewProps {
  comparison: {
    legacy: { mixed: any; deltaE: number; ratios: number[] };
    modern: { mixed: any; deltaE: number; ratios: number[] };
    difference: number;
    recommendation: string;
  };
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ comparison, onClose }) => {
  const getBetterMethod = () => {
    if (comparison.difference < 0.1) return '동등';
    return comparison.recommendation === 'legacy' ? 'Legacy' : 'Modern';
  };

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <h3>계산 방식 비교</h3>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="comparison-grid">
        <div
          className={`method-result ${comparison.recommendation === 'legacy' ? 'recommended' : ''}`}
        >
          <h4>Legacy (Lab 직접 혼합)</h4>
          <div className="result-values">
            <div>L*: {comparison.legacy.mixed.L.toFixed(1)}</div>
            <div>a*: {comparison.legacy.mixed.a.toFixed(1)}</div>
            <div>b*: {comparison.legacy.mixed.b.toFixed(1)}</div>
          </div>
          <div className="delta-e">ΔE: {comparison.legacy.deltaE.toFixed(3)}</div>
        </div>

        <div
          className={`method-result ${comparison.recommendation === 'modern' ? 'recommended' : ''}`}
        >
          <h4>Modern (XYZ 혼합)</h4>
          <div className="result-values">
            <div>L*: {comparison.modern.mixed.L.toFixed(1)}</div>
            <div>a*: {comparison.modern.mixed.a.toFixed(1)}</div>
            <div>b*: {comparison.modern.mixed.b.toFixed(1)}</div>
          </div>
          <div className="delta-e">ΔE: {comparison.modern.deltaE.toFixed(3)}</div>
        </div>
      </div>

      <div className="comparison-summary">
        <div className="summary-item">
          <span>차이:</span>
          <span>{comparison.difference.toFixed(3)}</span>
        </div>
        <div className="summary-item">
          <span>추천:</span>
          <span className="recommendation">{getBetterMethod()}</span>
        </div>
      </div>

      <div className="comparison-info">
        {comparison.difference < 0.1 && (
          <p>✓ 두 방식의 결과가 거의 동일합니다. Legacy 모드 사용을 권장합니다 (더 빠름).</p>
        )}
        {comparison.difference >= 0.1 && comparison.recommendation === 'modern' && (
          <p>✓ Modern 방식이 더 정확한 결과를 제공합니다. XYZ 혼합 사용을 권장합니다.</p>
        )}
        {comparison.difference >= 0.1 && comparison.recommendation === 'legacy' && (
          <p>✓ Legacy 방식이 이 경우 더 나은 결과를 제공합니다.</p>
        )}
      </div>
    </div>
  );
};

export default ComparisonView;
