import React from 'react';
import type { DeltaEMethod, DeltaEWeights } from '../types';

interface DeltaESettingsProps {
  method: DeltaEMethod;
  weights: DeltaEWeights;
  onMethodChange: (method: DeltaEMethod) => void;
  onWeightsChange: (weights: DeltaEWeights) => void;
}

const DeltaESettings: React.FC<DeltaESettingsProps> = ({
  method,
  weights,
  onMethodChange,
  onWeightsChange
}) => {
  const presets = [
    { name: '표준', weights: { kL: 1, kC: 1, kH: 1 } },
    { name: '측정기 호환', weights: { kL: 0.65, kC: 1, kH: 1 } },
    { name: '텍스타일', weights: { kL: 2, kC: 1, kH: 1 } },
    { name: '그래픽', weights: { kL: 1, kC: 1, kH: 1 } }
  ];

  return (
    <div className="deltae-settings">
      <div className="method-selector">
        <label>계산 방법:</label>
        <select value={method} onChange={(e) => onMethodChange(e.target.value as DeltaEMethod)}>
          <option value="E00">Delta E 2000 (CIE2000)</option>
          <option value="E94">Delta E 1994 (CIE1994)</option>
          <option value="E76">Delta E 1976 (CIE76)</option>
          <option value="CMC">Delta E CMC</option>
        </select>
      </div>

      {method === 'E00' && (
        <div className="weights-settings">
          <div className="presets">
            <label>프리셋:</label>
            {presets.map(preset => (
              <button
                key={preset.name}
                className="preset-btn"
                onClick={() => onWeightsChange(preset.weights)}
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="weight-sliders">
            <div className="weight-control">
              <label>kL (명도):</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={weights.kL}
                onChange={(e) => onWeightsChange({ ...weights, kL: parseFloat(e.target.value) })}
              />
              <span>{weights.kL.toFixed(2)}</span>
            </div>

            <div className="weight-control">
              <label>kC (채도):</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={weights.kC}
                onChange={(e) => onWeightsChange({ ...weights, kC: parseFloat(e.target.value) })}
              />
              <span>{weights.kC.toFixed(2)}</span>
            </div>

            <div className="weight-control">
              <label>kH (색조):</label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.05"
                value={weights.kH}
                onChange={(e) => onWeightsChange({ ...weights, kH: parseFloat(e.target.value) })}
              />
              <span>{weights.kH.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeltaESettings;