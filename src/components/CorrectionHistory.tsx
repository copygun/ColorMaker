import React from 'react';

interface CorrectionEntry {
  timestamp: string;
  targetColor: { L: number; a: number; b: number };
  originalRecipe: any;
  correctedRecipe: any;
  corrections: any[];
  predictedDeltaE: number;
}

interface CorrectionHistoryProps {
  correctionHistory: CorrectionEntry[];
  onClearHistory?: () => void;
}

const CorrectionHistory: React.FC<CorrectionHistoryProps> = ({
  correctionHistory,
  onClearHistory,
}) => {
  if (!correctionHistory || correctionHistory.length === 0) {
    return (
      <div className="pro-card">
        <div className="pro-card-header">
          <h2 className="pro-card-title">📊 보정 이력</h2>
        </div>
        <div
          className="pro-card-body"
          style={{ textAlign: 'center', padding: '40px', color: '#999' }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div>아직 보정 이력이 없습니다</div>
          <div style={{ fontSize: '14px', marginTop: '8px' }}>
            색상 보정을 수행하면 여기에 기록됩니다
          </div>
        </div>
      </div>
    );
  }

  const getDeltaEStatus = (deltaE: number) => {
    if (deltaE < 1) return { text: '우수', color: '#4CAF50' };
    if (deltaE < 2) return { text: '양호', color: '#2196F3' };
    if (deltaE < 3) return { text: '보통', color: '#FF9800' };
    return { text: '미흡', color: '#f44336' };
  };

  return (
    <div className="pro-card">
      <div className="pro-card-header">
        <h2 className="pro-card-title">
          📊 보정 이력
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '14px',
              fontWeight: 'normal',
              color: '#666',
            }}
          >
            총 {correctionHistory.length}건
          </span>
        </h2>
        {onClearHistory && correctionHistory.length > 0 && (
          <button
            onClick={onClearHistory}
            className="pro-button"
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              marginLeft: '12px',
            }}
          >
            이력 삭제
          </button>
        )}
      </div>
      <div className="pro-card-body">
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {correctionHistory.map((entry, index) => {
            const improvement = entry.originalRecipe?.deltaE
              ? entry.originalRecipe.deltaE - entry.predictedDeltaE
              : 0;
            const status = getDeltaEStatus(entry.predictedDeltaE);

            return (
              <div
                key={index}
                style={{
                  padding: '12px',
                  borderBottom: index < correctionHistory.length - 1 ? '1px solid #e0e0e0' : 'none',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      {new Date(entry.timestamp).toLocaleString('ko-KR', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      목표: L*{entry.targetColor.L.toFixed(1)}
                      a*{entry.targetColor.a.toFixed(1)}
                      b*{entry.targetColor.b.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      보정 잉크: {entry.corrections.map((c) => c.name).join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: status.color,
                      }}
                    >
                      ΔE {entry.predictedDeltaE.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '12px', color: status.color }}>{status.text}</div>
                    {improvement > 0 && (
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#4CAF50',
                          marginTop: '4px',
                        }}
                      >
                        ↓ {improvement.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* 보정 상세 정보 */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    background: '#f9f9f9',
                    borderRadius: '4px',
                    fontSize: '13px',
                  }}
                >
                  {entry.corrections.map((corr, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '2px 0',
                      }}
                    >
                      <span>{corr.name}</span>
                      <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                        +{corr.addAmount.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 통계 요약 */}
        {correctionHistory.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f0f7ff',
              borderRadius: '8px',
              border: '1px solid #2196F3',
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1976D2' }}>
              📈 보정 통계
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                fontSize: '14px',
              }}
            >
              <div>
                평균 개선도:{' '}
                <strong>
                  {(
                    correctionHistory.reduce((sum, e) => {
                      const imp = e.originalRecipe?.deltaE
                        ? e.originalRecipe.deltaE - e.predictedDeltaE
                        : 0;
                      return sum + imp;
                    }, 0) / correctionHistory.length
                  ).toFixed(2)}
                </strong>
              </div>
              <div>
                성공률 (ΔE &lt; 1):{' '}
                <strong>
                  {(
                    (correctionHistory.filter((e) => e.predictedDeltaE < 1).length /
                      correctionHistory.length) *
                    100
                  ).toFixed(0)}
                  %
                </strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionHistory;
