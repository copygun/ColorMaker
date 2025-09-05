/**
 * Modern Color Input Component
 * Interactive and visually appealing color input with real-time preview
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { LabColor } from '../types';
import '../styles/modern-design.css';
import './ModernColorInput.css';

interface ModernColorInputProps {
  value: LabColor;
  onChange: (color: LabColor) => void;
  onValidate?: (color: LabColor) => boolean;
  labToRgb?: (l: number, a: number, b: number) => { r: number; g: number; b: number };
}

const ModernColorInput: React.FC<ModernColorInputProps> = ({
  value,
  onChange,
  onValidate,
  labToRgb = (l, a, b) => {
    // Simple Lab to RGB conversion for preview
    const y = (l + 16) / 116;
    const x = a / 500 + y;
    const z = y - b / 200;

    const x3 = x * x * x;
    const y3 = y * y * y;
    const z3 = z * z * z;

    const xr = x3 > 0.008856 ? x3 : (x - 16 / 116) / 7.787;
    const yr = y3 > 0.008856 ? y3 : (y - 16 / 116) / 7.787;
    const zr = z3 > 0.008856 ? z3 : (z - 16 / 116) / 7.787;

    const r = xr * 95.047;
    const g = yr * 100.0;
    const b_val = zr * 108.883;

    return {
      r: Math.round(Math.max(0, Math.min(255, r * 2.55))),
      g: Math.round(Math.max(0, Math.min(255, g * 2.55))),
      b: Math.round(Math.max(0, Math.min(255, b_val * 2.55))),
    };
  },
}) => {
  const [localColor, setLocalColor] = useState<LabColor>(value);
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const [hexInput, setHexInput] = useState('');
  const [isValid, setIsValid] = useState(true);

  // Update RGB preview
  useEffect(() => {
    const newRgb = labToRgb(localColor.L, localColor.a, localColor.b);
    setRgb(newRgb);

    // Update hex input
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    setHexInput(`#${toHex(newRgb.r)}${toHex(newRgb.g)}${toHex(newRgb.b)}`);
  }, [localColor, labToRgb]);

  // Sync with external value changes
  useEffect(() => {
    setLocalColor(value);
  }, [value]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (component: 'L' | 'a' | 'b', value: number) => {
      const newColor = { ...localColor, [component]: value };
      setLocalColor(newColor);

      // Validate if validator provided
      if (onValidate) {
        const valid = onValidate(newColor);
        setIsValid(valid);
      }

      // Debounced update to parent
      onChange(newColor);
    },
    [localColor, onChange, onValidate],
  );

  // Handle hex input
  const handleHexInput = (hex: string) => {
    setHexInput(hex);

    // Parse hex to RGB
    const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (match) {
      const r = parseInt(match[1], 16);
      const g = parseInt(match[2], 16);
      const b = parseInt(match[3], 16);

      // Convert RGB to Lab (simplified)
      const L = Math.round((r + g + b) / 3 / 2.55);
      const a = Math.round((r - g) / 2);
      const b_val = Math.round((g - b) / 2);

      const newColor = { L, a: a, b: b_val };
      setLocalColor(newColor);
      onChange(newColor);
    }
  };

  // Copy color to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Show toast notification
      const toast = document.createElement('div');
      toast.className = 'toast toast-success fade-in';
      toast.innerHTML = `
        <svg width="20" height="20" fill="currentColor">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
        </svg>
        <span>색상 코드가 복사되었습니다!</span>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s reverse';
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    });
  };

  // Preset colors
  const presets = [
    { name: 'Pure White', lab: { L: 100, a: 0, b: 0 } },
    { name: 'Pure Black', lab: { L: 0, a: 0, b: 0 } },
    { name: 'Cyan', lab: { L: 91, a: -48, b: -14 } },
    { name: 'Magenta', lab: { L: 60, a: 98, b: -61 } },
    { name: 'Yellow', lab: { L: 97, a: -21, b: 94 } },
    { name: 'Red', lab: { L: 53, a: 80, b: 67 } },
    { name: 'Green', lab: { L: 88, a: -86, b: 83 } },
    { name: 'Blue', lab: { L: 32, a: 79, b: -108 } },
  ];

  return (
    <div className="modern-color-input">
      {/* Main Color Display */}
      <div className="color-display-section">
        <div className="color-preview-large">
          <div
            className="color-preview-main"
            style={{
              backgroundColor: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
              boxShadow: isValid ? 'none' : '0 0 0 3px var(--error)',
            }}
          >
            <div className="color-info-overlay">
              <div className="color-values-display">
                <div
                  onClick={() =>
                    copyToClipboard(`L:${localColor.L} a:${localColor.a} b:${localColor.b}`)
                  }
                >
                  LAB: {localColor.L.toFixed(0)}, {localColor.a.toFixed(0)},{' '}
                  {localColor.b.toFixed(0)}
                </div>
                <div onClick={() => copyToClipboard(hexInput)}>{hexInput.toUpperCase()}</div>
                <div onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}>
                  RGB: {rgb.r}, {rgb.g}, {rgb.b}
                </div>
              </div>
            </div>
          </div>

          {/* Gamut Warning */}
          {!isValid && (
            <div className="gamut-warning">
              <svg width="16" height="16" fill="currentColor">
                <path d="M8 0a8 8 0 100 16A8 8 0 008 0zm0 12a1 1 0 110-2 1 1 0 010 2zm0-3a1 1 0 01-1-1V5a1 1 0 112 0v3a1 1 0 01-1 1z" />
              </svg>
              색상이 인쇄 가능 영역을 벗어났습니다
            </div>
          )}
        </div>

        {/* Hex Input */}
        <div className="hex-input-group">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInput(e.target.value)}
            placeholder="#000000"
            className="hex-input"
          />
          <button className="copy-btn" onClick={() => copyToClipboard(hexInput)} title="Copy HEX">
            <svg width="16" height="16" fill="currentColor">
              <path d="M10 3a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1h4zm0 1H6v8h4V4z" />
              <path d="M4 5H3a1 1 0 00-1 1v8a1 1 0 001 1h4a1 1 0 001-1v-1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Interactive Sliders */}
      <div className="color-sliders-section">
        <div className="color-slider-group">
          {/* L* Slider */}
          <div className="color-slider">
            <div className="color-slider-label">
              <span className="color-slider-name">명도 (L*)</span>
              <span className="color-slider-value">{localColor.L.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={localColor.L}
              onChange={(e) => handleSliderChange('L', parseFloat(e.target.value))}
              className="color-slider-track slider-l"
              style={{
                background: `linear-gradient(to right, 
                  lab(0% ${localColor.a} ${localColor.b}),
                  lab(50% ${localColor.a} ${localColor.b}),
                  lab(100% ${localColor.a} ${localColor.b})`,
              }}
            />
          </div>

          {/* a* Slider */}
          <div className="color-slider">
            <div className="color-slider-label">
              <span className="color-slider-name">적-녹 (a*)</span>
              <span className="color-slider-value">{localColor.a.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="-128"
              max="127"
              step="0.1"
              value={localColor.a}
              onChange={(e) => handleSliderChange('a', parseFloat(e.target.value))}
              className="color-slider-track slider-a"
              style={{
                background: `linear-gradient(to right,
                  lab(${localColor.L}% -128 ${localColor.b}),
                  lab(${localColor.L}% 0 ${localColor.b}),
                  lab(${localColor.L}% 127 ${localColor.b})`,
              }}
            />
          </div>

          {/* b* Slider */}
          <div className="color-slider">
            <div className="color-slider-label">
              <span className="color-slider-name">황-청 (b*)</span>
              <span className="color-slider-value">{localColor.b.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="-128"
              max="127"
              step="0.1"
              value={localColor.b}
              onChange={(e) => handleSliderChange('b', parseFloat(e.target.value))}
              className="color-slider-track slider-b"
              style={{
                background: `linear-gradient(to right,
                  lab(${localColor.L}% ${localColor.a} -128),
                  lab(${localColor.L}% ${localColor.a} 0),
                  lab(${localColor.L}% ${localColor.a} 127)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Preset Colors */}
      <div className="preset-colors">
        <h4>프리셋 색상</h4>
        <div className="preset-grid">
          {presets.map((preset) => {
            const presetRgb = labToRgb(preset.lab.L, preset.lab.a, preset.lab.b);
            return (
              <button
                key={preset.name}
                className="preset-color"
                style={{ backgroundColor: `rgb(${presetRgb.r}, ${presetRgb.g}, ${presetRgb.b})` }}
                onClick={() => {
                  setLocalColor(preset.lab);
                  onChange(preset.lab);
                }}
                title={preset.name}
              >
                <span className="preset-name">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Space Visualization */}
      <div className="color-space-viz">
        <canvas id="lab-space-canvas" width="200" height="200"></canvas>
        <div
          className="current-point"
          style={{
            left: `${((localColor.a + 128) / 256) * 100}%`,
            top: `${((128 - localColor.b) / 256) * 100}%`,
          }}
        ></div>
      </div>
    </div>
  );
};

export default ModernColorInput;
