import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { LabColor } from '../types';
import { pantoneDB } from '../../core/pantoneDatabase.js';

interface ColorInputProps {
  value: LabColor;
  onChange: (color: LabColor) => void;
  onValidate?: (color: LabColor) => boolean;
  labToRgb?: (L: number, a: number, b: number) => { r: number; g: number; b: number };
}

const ColorInput: React.FC<ColorInputProps> = ({ value, onChange, onValidate, labToRgb }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const [pantoneInput, setPantoneInput] = useState('');
  const [closestPantones, setClosestPantones] = useState<any[]>([]);
  const [showPantoneSearch, setShowPantoneSearch] = useState(false);
  const [inputMode, setInputMode] = useState<'lab' | 'rgb' | 'hex' | 'cmyk'>('lab');
  const [recentColors, setRecentColors] = useState<Array<{lab: LabColor, name: string}>>([]);
  
  // 입력 필드용 문자열 상태 (음수 입력 지원)
  const [inputValues, setInputValues] = useState({
    L: value.L.toString(),
    a: value.a.toString(),
    b: value.b.toString()
  });

  // RGB 입력 상태
  const [rgbInputValues, setRgbInputValues] = useState({ r: '', g: '', b: '' });
  
  // HEX 입력 상태
  const [hexInputValue, setHexInputValue] = useState('');
  
  // CMYK 입력 상태
  const [cmykInputValues, setCmykInputValues] = useState({ c: '', m: '', y: '', k: '' });

  // 최근 사용 색상 로드
  useEffect(() => {
    const saved = localStorage.getItem('recentColors');
    if (saved) {
      try {
        setRecentColors(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load recent colors:', e);
      }
    }
  }, []);

  // value prop이 외부에서 변경될 때만 업데이트
  useEffect(() => {
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && 
      activeElement.tagName === 'INPUT' && 
      (activeElement.id === 'lab-L' || activeElement.id === 'lab-a' || activeElement.id === 'lab-b');
    
    if (!isInputFocused) {
      setLocalValue(value);
      setInputValues({
        L: value.L.toString(),
        a: value.a.toString(),
        b: value.b.toString()
      });
      
      // RGB 값도 업데이트
      const rgb = convertLabToRgb(value.L, value.a, value.b);
      setRgbInputValues({
        r: rgb.r.toString(),
        g: rgb.g.toString(),
        b: rgb.b.toString()
      });
      
      // HEX 값 업데이트 (대문자로 표기)
      const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
      setHexInputValue(`#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`);
    }
  }, [value]);

  // Lab to RGB 변환
  const convertLabToRgb = (L: number, a: number, b: number) => {
    if (labToRgb) {
      return labToRgb(L, a, b);
    }
    
    // Lab to XYZ
    const fy = (L + 16) / 116;
    const fx = a / 500 + fy;
    const fz = fy - b / 200;
    
    const xr = fx ** 3 > 0.008856 ? fx ** 3 : (fx * 116 - 16) / 903.3;
    const yr = L > 7.9996 ? fy ** 3 : L / 903.3;
    const zr = fz ** 3 > 0.008856 ? fz ** 3 : (fz * 116 - 16) / 903.3;
    
    const X = xr * 95.047;
    const Y = yr * 100.000;
    const Z = zr * 108.883;
    
    // XYZ to RGB
    let rVal = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
    let gVal = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
    let bVal = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
    
    rVal = rVal > 0.0031308 ? 1.055 * (rVal ** (1 / 2.4)) - 0.055 : 12.92 * rVal;
    gVal = gVal > 0.0031308 ? 1.055 * (gVal ** (1 / 2.4)) - 0.055 : 12.92 * gVal;
    bVal = bVal > 0.0031308 ? 1.055 * (bVal ** (1 / 2.4)) - 0.055 : 12.92 * bVal;
    
    return {
      r: Math.max(0, Math.min(255, Math.round(rVal * 255))),
      g: Math.max(0, Math.min(255, Math.round(gVal * 255))),
      b: Math.max(0, Math.min(255, Math.round(bVal * 255)))
    };
  };

  // RGB to Lab 변환
  const convertRgbToLab = (rInput: number, gInput: number, bInput: number): LabColor => {
    // RGB to XYZ
    let rVal = rInput / 255;
    let gVal = gInput / 255;
    let bVal = bInput / 255;
    
    rVal = rVal > 0.04045 ? Math.pow((rVal + 0.055) / 1.055, 2.4) : rVal / 12.92;
    gVal = gVal > 0.04045 ? Math.pow((gVal + 0.055) / 1.055, 2.4) : gVal / 12.92;
    bVal = bVal > 0.04045 ? Math.pow((bVal + 0.055) / 1.055, 2.4) : bVal / 12.92;
    
    const X = (rVal * 0.4124564 + gVal * 0.3575761 + bVal * 0.1804375) * 100;
    const Y = (rVal * 0.2126729 + gVal * 0.7151522 + bVal * 0.0721750) * 100;
    const Z = (rVal * 0.0193339 + gVal * 0.1191920 + bVal * 0.9503041) * 100;
    
    // XYZ to Lab
    const xr = X / 95.047;
    const yr = Y / 100.000;
    const zr = Z / 108.883;
    
    const fx = xr > 0.008856 ? Math.cbrt(xr) : (903.3 * xr + 16) / 116;
    const fy = yr > 0.008856 ? Math.cbrt(yr) : (903.3 * yr + 16) / 116;
    const fz = zr > 0.008856 ? Math.cbrt(zr) : (903.3 * zr + 16) / 116;
    
    const labL = 116 * fy - 16;
    const labA = 500 * (fx - fy);
    const labB = 200 * (fy - fz);
    
    return { L: labL, a: labA, b: labB };
  };

  // HEX to RGB
  const hexToRgb = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return { r, g, b };
    } else if (cleanHex.length === 6) {
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return { r, g, b };
    }
    return null;
  };

  // CMYK to RGB
  const cmykToRgb = (c: number, m: number, y: number, k: number) => {
    const r = Math.round(255 * (1 - c / 100) * (1 - k / 100));
    const g = Math.round(255 * (1 - m / 100) * (1 - k / 100));
    const b = Math.round(255 * (1 - y / 100) * (1 - k / 100));
    return { r, g, b };
  };

  // RGB 색상 계산
  const rgbColor = useMemo(() => {
    const rgb = convertLabToRgb(localValue.L, localValue.a, localValue.b);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }, [localValue, labToRgb]);

  // HEX 색상 계산 (대문자로 표기)
  const hexColor = useMemo(() => {
    const rgb = convertLabToRgb(localValue.L, localValue.a, localValue.b);
    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }, [localValue, labToRgb]);

  // CMYK 계산
  const cmykColor = useMemo(() => {
    const rgb = convertLabToRgb(localValue.L, localValue.a, localValue.b);
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    
    const k = 1 - Math.max(r, g, b);
    const c = k === 1 ? 0 : (1 - r - k) / (1 - k);
    const m = k === 1 ? 0 : (1 - g - k) / (1 - k);
    const y = k === 1 ? 0 : (1 - b - k) / (1 - k);
    
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100)
    };
  }, [localValue, labToRgb]);

  // Lab 입력 처리
  const handleInputChange = (component: keyof LabColor, newValue: string) => {
    setInputValues(prev => ({
      ...prev,
      [component]: newValue
    }));
  };

  const handleInputBlur = (component: keyof LabColor) => {
    const inputValue = inputValues[component];
    
    if (inputValue === '') {
      const updated = { ...localValue, [component]: 0 };
      setLocalValue(updated);
      setInputValues(prev => ({ ...prev, [component]: '0' }));
      onChange(updated);
      return;
    }
    
    if (inputValue === '-' || inputValue === '.' || inputValue === '-.') {
      setInputValues(prev => ({ 
        ...prev, 
        [component]: localValue[component].toString() 
      }));
      return;
    }
    
    const numValue = parseFloat(inputValue);
    
    if (isNaN(numValue)) {
      setInputValues(prev => ({ 
        ...prev, 
        [component]: localValue[component].toString() 
      }));
      return;
    }
    
    let validValue = numValue;
    if (component === 'L') {
      validValue = Math.max(0, Math.min(100, numValue));
    } else {
      validValue = Math.max(-128, Math.min(128, numValue));
    }
    
    if (validValue !== numValue) {
      setInputValues(prev => ({ 
        ...prev, 
        [component]: validValue.toString() 
      }));
    }
    
    const updated = { ...localValue, [component]: validValue };
    setLocalValue(updated);

    if (onValidate) {
      const valid = onValidate(updated);
      setIsValid(valid);
    }

    onChange(updated);
    saveToRecent(updated);
  };

  // RGB 입력 처리
  const handleRgbInputChange = (component: 'r' | 'g' | 'b', value: string) => {
    setRgbInputValues(prev => ({ ...prev, [component]: value }));
  };

  const handleRgbInputBlur = (component: 'r' | 'g' | 'b') => {
    const value = parseInt(rgbInputValues[component]);
    if (!isNaN(value)) {
      const clampedValue = Math.max(0, Math.min(255, value));
      setRgbInputValues(prev => ({ ...prev, [component]: clampedValue.toString() }));
      
      const r = component === 'r' ? clampedValue : parseInt(rgbInputValues.r) || 0;
      const g = component === 'g' ? clampedValue : parseInt(rgbInputValues.g) || 0;
      const b = component === 'b' ? clampedValue : parseInt(rgbInputValues.b) || 0;
      
      const lab = convertRgbToLab(r, g, b);
      setLocalValue(lab);
      setInputValues({
        L: lab.L.toFixed(1),
        a: lab.a.toFixed(1),
        b: lab.b.toFixed(1)
      });
      onChange(lab);
      saveToRecent(lab);
    }
  };

  // HEX 입력 처리
  const handleHexInputChange = (value: string) => {
    setHexInputValue(value);
  };

  const handleHexInputBlur = () => {
    const rgb = hexToRgb(hexInputValue);
    if (rgb) {
      const lab = convertRgbToLab(rgb.r, rgb.g, rgb.b);
      setLocalValue(lab);
      setInputValues({
        L: lab.L.toFixed(1),
        a: lab.a.toFixed(1),
        b: lab.b.toFixed(1)
      });
      setRgbInputValues({
        r: rgb.r.toString(),
        g: rgb.g.toString(),
        b: rgb.b.toString()
      });
      onChange(lab);
      saveToRecent(lab);
    }
  };

  // CMYK 입력 처리
  const handleCmykInputChange = (component: 'c' | 'm' | 'y' | 'k', value: string) => {
    setCmykInputValues(prev => ({ ...prev, [component]: value }));
  };

  const handleCmykInputBlur = (component: 'c' | 'm' | 'y' | 'k') => {
    const value = parseFloat(cmykInputValues[component]);
    if (!isNaN(value)) {
      const clampedValue = Math.max(0, Math.min(100, value));
      setCmykInputValues(prev => ({ ...prev, [component]: clampedValue.toString() }));
      
      const c = component === 'c' ? clampedValue : parseFloat(cmykInputValues.c) || 0;
      const m = component === 'm' ? clampedValue : parseFloat(cmykInputValues.m) || 0;
      const y = component === 'y' ? clampedValue : parseFloat(cmykInputValues.y) || 0;
      const k = component === 'k' ? clampedValue : parseFloat(cmykInputValues.k) || 0;
      
      const rgb = cmykToRgb(c, m, y, k);
      const lab = convertRgbToLab(rgb.r, rgb.g, rgb.b);
      
      setLocalValue(lab);
      setInputValues({
        L: lab.L.toFixed(1),
        a: lab.a.toFixed(1),
        b: lab.b.toFixed(1)
      });
      setRgbInputValues({
        r: rgb.r.toString(),
        g: rgb.g.toString(),
        b: rgb.b.toString()
      });
      onChange(lab);
      saveToRecent(lab);
    }
  };

  // 최근 사용 색상 저장
  const saveToRecent = (lab: LabColor) => {
    const newColor = {
      lab,
      name: `L:${lab.L.toFixed(1)} a:${lab.a.toFixed(1)} b:${lab.b.toFixed(1)}`
    };
    
    setRecentColors(prev => {
      const filtered = prev.filter(c => 
        Math.abs(c.lab.L - lab.L) > 0.5 || 
        Math.abs(c.lab.a - lab.a) > 0.5 || 
        Math.abs(c.lab.b - lab.b) > 0.5
      );
      const updated = [newColor, ...filtered].slice(0, 8);
      localStorage.setItem('recentColors', JSON.stringify(updated));
      return updated;
    });
  };

  // 최근 색상 선택
  const selectRecentColor = (color: { lab: LabColor, name: string }) => {
    setLocalValue(color.lab);
    setInputValues({
      L: color.lab.L.toString(),
      a: color.lab.a.toString(),
      b: color.lab.b.toString()
    });
    onChange(color.lab);
  };

  // PANTONE 검색
  const handlePantoneSearch = () => {
    if (pantoneInput) {
      const exactMatch = pantoneDB.findByCode(pantoneInput);
      if (exactMatch) {
        const newLab = { L: exactMatch.L, a: exactMatch.a, b: exactMatch.b };
        setLocalValue(newLab);
        onChange(newLab);
        setClosestPantones([exactMatch]);
        saveToRecent(newLab);
      } else {
        const searchResults = pantoneDB.searchByKeyword(pantoneInput);
        if (searchResults.length > 0) {
          setClosestPantones(searchResults.slice(0, 3));
        }
      }
    }
  };

  // Lab 값이 변경될 때마다 가장 가까운 PANTONE 찾기
  useEffect(() => {
    const closest = pantoneDB.findClosestColors(localValue, 3);
    setClosestPantones(closest);
  }, [localValue]);

  // PANTONE 선택
  const selectPantone = (pantone: any) => {
    const newLab = { L: pantone.L, a: pantone.a, b: pantone.b };
    setLocalValue(newLab);
    setInputValues({
      L: pantone.L.toString(),
      a: pantone.a.toString(),
      b: pantone.b.toString()
    });
    onChange(newLab);
    setPantoneInput(pantone.code);
    saveToRecent(newLab);
  };

  return (
    <div className="color-input-container">
      {/* 입력 모드 선택 탭 */}
      <div className="input-mode-tabs" style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '10px'
      }}>
        <button
          className={`mode-tab ${inputMode === 'lab' ? 'active' : ''}`}
          onClick={() => setInputMode('lab')}
          style={{
            padding: '8px 16px',
            backgroundColor: inputMode === 'lab' ? '#667eea' : '#f7fafc',
            color: inputMode === 'lab' ? '#fff' : '#4a5568',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: inputMode === 'lab' ? '600' : '400'
          }}
        >
          Lab
        </button>
        <button
          className={`mode-tab ${inputMode === 'rgb' ? 'active' : ''}`}
          onClick={() => setInputMode('rgb')}
          style={{
            padding: '8px 16px',
            backgroundColor: inputMode === 'rgb' ? '#667eea' : '#f7fafc',
            color: inputMode === 'rgb' ? '#fff' : '#4a5568',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: inputMode === 'rgb' ? '600' : '400'
          }}
        >
          RGB
        </button>
        <button
          className={`mode-tab ${inputMode === 'hex' ? 'active' : ''}`}
          onClick={() => setInputMode('hex')}
          style={{
            padding: '8px 16px',
            backgroundColor: inputMode === 'hex' ? '#667eea' : '#f7fafc',
            color: inputMode === 'hex' ? '#fff' : '#4a5568',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: inputMode === 'hex' ? '600' : '400'
          }}
        >
          HEX
        </button>
        <button
          className={`mode-tab ${inputMode === 'cmyk' ? 'active' : ''}`}
          onClick={() => setInputMode('cmyk')}
          style={{
            padding: '8px 16px',
            backgroundColor: inputMode === 'cmyk' ? '#667eea' : '#f7fafc',
            color: inputMode === 'cmyk' ? '#fff' : '#4a5568',
            border: 'none',
            borderRadius: '6px 6px 0 0',
            cursor: 'pointer',
            fontWeight: inputMode === 'cmyk' ? '600' : '400'
          }}
        >
          CMYK
        </button>
      </div>

      {/* Lab 색상 입력 */}
      {inputMode === 'lab' && (
        <div className="color-input">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>
            🎯 Lab 색상 값 입력
          </h3>
          <div className="input-group">
            <label>L*</label>
            <input
              type="text"
              id="lab-L"
              value={inputValues.L}
              onChange={(e) => handleInputChange('L', e.target.value)}
              onBlur={() => handleInputBlur('L')}
              onFocus={(e) => e.target.select()}
              placeholder="50"
              title="명도값 (0-100)"
            />
            <span className="range">(0-100) 명도</span>
          </div>
          <div className="input-group">
            <label>a*</label>
            <input
              type="text"
              id="lab-a"
              value={inputValues.a}
              onChange={(e) => handleInputChange('a', e.target.value)}
              onBlur={() => handleInputBlur('a')}
              onFocus={(e) => e.target.select()}
              placeholder="-20"
              title="빨강(+) ↔ 녹색(-)"
              style={{
                color: parseFloat(inputValues.a) < 0 ? '#22863a' : 
                       parseFloat(inputValues.a) > 0 ? '#dc3545' : 'inherit'
              }}
            />
            <span className="range">(-128 to 128) 빨강-녹색</span>
          </div>
          <div className="input-group">
            <label>b*</label>
            <input
              type="text"
              id="lab-b"
              value={inputValues.b}
              onChange={(e) => handleInputChange('b', e.target.value)}
              onBlur={() => handleInputBlur('b')}
              onFocus={(e) => e.target.select()}
              placeholder="-30"
              title="노랑(+) ↔ 파랑(-)"
              style={{
                color: parseFloat(inputValues.b) < 0 ? '#0366d6' : 
                       parseFloat(inputValues.b) > 0 ? '#ffc107' : 'inherit'
              }}
            />
            <span className="range">(-128 to 128) 노랑-파랑</span>
          </div>
        </div>
      )}

      {/* RGB 색상 입력 */}
      {inputMode === 'rgb' && (
        <div className="color-input">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>
            🎨 RGB 색상 값 입력
          </h3>
          <div className="input-group">
            <label>R</label>
            <input
              type="text"
              value={rgbInputValues.r}
              onChange={(e) => handleRgbInputChange('r', e.target.value)}
              onBlur={() => handleRgbInputBlur('r')}
              onFocus={(e) => e.target.select()}
              placeholder="255"
            />
            <span className="range">(0-255)</span>
          </div>
          <div className="input-group">
            <label>G</label>
            <input
              type="text"
              value={rgbInputValues.g}
              onChange={(e) => handleRgbInputChange('g', e.target.value)}
              onBlur={() => handleRgbInputBlur('g')}
              onFocus={(e) => e.target.select()}
              placeholder="255"
            />
            <span className="range">(0-255)</span>
          </div>
          <div className="input-group">
            <label>B</label>
            <input
              type="text"
              value={rgbInputValues.b}
              onChange={(e) => handleRgbInputChange('b', e.target.value)}
              onBlur={() => handleRgbInputBlur('b')}
              onFocus={(e) => e.target.select()}
              placeholder="255"
            />
            <span className="range">(0-255)</span>
          </div>
        </div>
      )}

      {/* HEX 색상 입력 */}
      {inputMode === 'hex' && (
        <div className="color-input">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>
            #️⃣ HEX 색상 코드 입력
          </h3>
          <div className="input-group">
            <label>HEX</label>
            <input
              type="text"
              value={hexInputValue}
              onChange={(e) => handleHexInputChange(e.target.value)}
              onBlur={handleHexInputBlur}
              onFocus={(e) => e.target.select()}
              placeholder="#FF5733"
              style={{ fontFamily: 'monospace', fontSize: '16px' }}
            />
            <span className="range">예: #FF5733</span>
          </div>
        </div>
      )}

      {/* CMYK 색상 입력 */}
      {inputMode === 'cmyk' && (
        <div className="color-input">
          <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: '700', color: '#2d3748' }}>
            🖨️ CMYK 색상 값 입력
          </h3>
          <div className="input-group">
            <label>C</label>
            <input
              type="text"
              value={cmykInputValues.c}
              onChange={(e) => handleCmykInputChange('c', e.target.value)}
              onBlur={() => handleCmykInputBlur('c')}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
            <span className="range">(0-100%)</span>
          </div>
          <div className="input-group">
            <label>M</label>
            <input
              type="text"
              value={cmykInputValues.m}
              onChange={(e) => handleCmykInputChange('m', e.target.value)}
              onBlur={() => handleCmykInputBlur('m')}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
            <span className="range">(0-100%)</span>
          </div>
          <div className="input-group">
            <label>Y</label>
            <input
              type="text"
              value={cmykInputValues.y}
              onChange={(e) => handleCmykInputChange('y', e.target.value)}
              onBlur={() => handleCmykInputBlur('y')}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
            <span className="range">(0-100%)</span>
          </div>
          <div className="input-group">
            <label>K</label>
            <input
              type="text"
              value={cmykInputValues.k}
              onChange={(e) => handleCmykInputChange('k', e.target.value)}
              onBlur={() => handleCmykInputBlur('k')}
              onFocus={(e) => e.target.select()}
              placeholder="0"
            />
            <span className="range">(0-100%)</span>
          </div>
        </div>
      )}
      
      {/* 색상 미리보기 */}
      <div className="color-preview-panel">
        <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: '600', color: '#2d3748' }}>
          색상 변환 값
        </h3>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <div 
            className="color-preview-large"
            style={{ 
              backgroundColor: rgbColor,
              width: '100px',
              height: '100px',
              borderRadius: '8px',
              border: '2px solid #2d3748',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
          <div className="color-values" style={{ 
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            alignItems: 'start'
          }}>
            <div className="color-space-group">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px', color: '#000' }}>Lab</h4>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>L*: {localValue.L.toFixed(1)}</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>a*: {localValue.a.toFixed(1)}</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>b*: {localValue.b.toFixed(1)}</div>
            </div>
            <div className="color-space-group">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px', color: '#000' }}>RGB</h4>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>R: {rgbColor.match(/\d+/g)?.[0] || 0}</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>G: {rgbColor.match(/\d+/g)?.[1] || 0}</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>B: {rgbColor.match(/\d+/g)?.[2] || 0}</div>
            </div>
            <div className="color-space-group">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px', color: '#000' }}>HEX</h4>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>{hexColor}</div>
            </div>
            <div className="color-space-group">
              <h4 style={{ fontSize: '0.8125rem', fontWeight: '700', marginBottom: '6px', color: '#000' }}>CMYK</h4>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>C: {cmykColor.c}%</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>M: {cmykColor.m}%</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>Y: {cmykColor.y}%</div>
              <div style={{ fontSize: '0.8125rem', color: '#4a5568' }}>K: {cmykColor.k}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 사용 색상 */}
      {recentColors.length > 0 && (
        <div className="recent-colors" style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#f7fafc',
          borderRadius: '8px'
        }}>
          <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: '600', color: '#4a5568' }}>
            최근 사용 색상
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {recentColors.map((color, idx) => {
              const rgb = convertLabToRgb(color.lab.L, color.lab.a, color.lab.b);
              const bgColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
              return (
                <div
                  key={idx}
                  onClick={() => selectRecentColor(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: bgColor,
                    borderRadius: '6px',
                    border: '2px solid #cbd5e0',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }
                  }}
                  title={color.name}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* PANTONE 입력 섹션 */}
      <div className="pantone-section">
        <h3>🎨 PANTONE 색상 검색</h3>
        <div className="pantone-input-group">
          <input
            type="text"
            value={pantoneInput}
            onChange={(e) => setPantoneInput(e.target.value)}
            placeholder="예: 185 C, Reflex Blue C"
            onKeyPress={(e) => e.key === 'Enter' && handlePantoneSearch()}
          />
          <button 
            className="btn-pantone-search"
            onClick={handlePantoneSearch}
          >
            검색
          </button>
          <button 
            className="btn-pantone-toggle"
            onClick={() => setShowPantoneSearch(!showPantoneSearch)}
          >
            {showPantoneSearch ? '닫기' : '가까운 색상'}
          </button>
        </div>
        
        {/* 가장 가까운 PANTONE 표시 */}
        {showPantoneSearch && closestPantones.length > 0 && (
          <div className="pantone-matches">
            <h4>가장 가까운 PANTONE 색상</h4>
            {closestPantones.map((pantone, idx) => {
              const deltaClass = pantone.deltaE < 2 ? 'excellent' : 
                                pantone.deltaE < 5 ? 'good' : 'fair';
              return (
                <div 
                  key={idx} 
                  className="pantone-item"
                  onClick={() => selectPantone(pantone)}
                  style={{ cursor: 'pointer' }}
                  title="클릭하여 적용"
                >
                  <div 
                    className="pantone-swatch" 
                    style={{ backgroundColor: pantone.hex }}
                  />
                  <div className="pantone-info">
                    <div className="pantone-code">{pantone.code}</div>
                    <div className={`pantone-delta ${deltaClass}`}>
                      ΔE: {pantone.deltaE?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorInput;