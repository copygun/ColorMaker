/**
 * Color Science Module
 * 검증된 색상 계산 로직 모음
 * v3.0에서 추출 및 모듈화
 */

// ΔE*00 (CIEDE2000) 계산 (가중치 지원)
export function calculateDeltaE00(L1, a1, b1, L2, a2, b2, weights = { kL: 1, kC: 1, kH: 1 }) {
    const { kL, kC, kH } = weights;
    
    // Calculate C and h
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    const Cb = (C1 + C2) / 2;
    
    const G = 0.5 * (1 - Math.sqrt(Math.pow(Cb, 7) / (Math.pow(Cb, 7) + Math.pow(25, 7))));
    const ap1 = a1 * (1 + G);
    const ap2 = a2 * (1 + G);
    
    const Cp1 = Math.sqrt(ap1 * ap1 + b1 * b1);
    const Cp2 = Math.sqrt(ap2 * ap2 + b2 * b2);
    
    let hp1 = Math.atan2(b1, ap1) * 180 / Math.PI;
    if (hp1 < 0) hp1 += 360;
    let hp2 = Math.atan2(b2, ap2) * 180 / Math.PI;
    if (hp2 < 0) hp2 += 360;
    
    // Calculate differences
    const dLp = L2 - L1;
    const dCp = Cp2 - Cp1;
    
    let dhp = hp2 - hp1;
    if (Math.abs(dhp) > 180) {
        if (dhp > 180) dhp -= 360;
        else dhp += 360;
    }
    
    const dHp = 2 * Math.sqrt(Cp1 * Cp2) * Math.sin((dhp * Math.PI / 180) / 2);
    
    // Calculate averages
    const Lbp = (L1 + L2) / 2;
    const Cbp = (Cp1 + Cp2) / 2;
    
    let hbp = (hp1 + hp2) / 2;
    if (Math.abs(hp1 - hp2) > 180) {
        if (hbp < 180) hbp += 180;
        else hbp -= 180;
    }
    
    // Calculate T
    const T = 1 - 0.17 * Math.cos((hbp - 30) * Math.PI / 180) +
             0.24 * Math.cos(2 * hbp * Math.PI / 180) +
             0.32 * Math.cos((3 * hbp + 6) * Math.PI / 180) -
             0.20 * Math.cos((4 * hbp - 63) * Math.PI / 180);
    
    // Calculate S factors
    const SL = 1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    const SC = 1 + 0.045 * Cbp;
    const SH = 1 + 0.015 * Cbp * T;
    
    // Calculate RT
    const dTheta = 30 * Math.exp(-Math.pow((hbp - 275) / 25, 2));
    const RC = 2 * Math.sqrt(Math.pow(Cbp, 7) / (Math.pow(Cbp, 7) + Math.pow(25, 7)));
    const RT = -RC * Math.sin(2 * dTheta * Math.PI / 180);
    
    // Final calculation
    const dE00 = Math.sqrt(
        Math.pow(dLp / (kL * SL), 2) +
        Math.pow(dCp / (kC * SC), 2) +
        Math.pow(dHp / (kH * SH), 2) +
        RT * (dCp / (kC * SC)) * (dHp / (kH * SH))
    );
    
    return dE00;
}

// ΔE*94 (CIE 1994) 계산
export function calculateDeltaE94(L1, a1, b1, L2, a2, b2) {
    const kL = 1, kC = 1, kH = 1;
    const K1 = 0.045, K2 = 0.015;
    
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    
    const deltaL = L2 - L1;
    const deltaA = a2 - a1;
    const deltaB = b2 - b1;
    const deltaC = C2 - C1;
    const deltaH = Math.sqrt(deltaA * deltaA + deltaB * deltaB - deltaC * deltaC);
    
    const SL = 1;
    const SC = 1 + K1 * C1;
    const SH = 1 + K2 * C1;
    
    return Math.sqrt(
        Math.pow(deltaL / (kL * SL), 2) +
        Math.pow(deltaC / (kC * SC), 2) +
        Math.pow(deltaH / (kH * SH), 2)
    );
}

// ΔE*76 (CIE 1976) 계산
export function calculateDeltaE76(L1, a1, b1, L2, a2, b2) {
    const deltaL = L2 - L1;
    const deltaA = a2 - a1;
    const deltaB = b2 - b1;
    return Math.sqrt(deltaL * deltaL + deltaA * deltaA + deltaB * deltaB);
}

// ΔE*CMC 계산
export function calculateDeltaECMC(L1, a1, b1, L2, a2, b2, l = 2, c = 1) {
    const C1 = Math.sqrt(a1 * a1 + b1 * b1);
    const C2 = Math.sqrt(a2 * a2 + b2 * b2);
    
    const H1 = Math.atan2(b1, a1) * 180 / Math.PI;
    
    const deltaL = L2 - L1;
    const deltaC = C2 - C1;
    const deltaA = a2 - a1;
    const deltaB = b2 - b1;
    const deltaH = Math.sqrt(deltaA * deltaA + deltaB * deltaB - deltaC * deltaC);
    
    let T;
    if (H1 >= 164 && H1 <= 345) {
        T = 0.56 + Math.abs(0.2 * Math.cos((H1 + 168) * Math.PI / 180));
    } else {
        T = 0.36 + Math.abs(0.4 * Math.cos((H1 + 35) * Math.PI / 180));
    }
    
    const F = Math.sqrt(Math.pow(C1, 4) / (Math.pow(C1, 4) + 1900));
    
    let SL;
    if (L1 < 16) {
        SL = 0.511;
    } else {
        SL = (0.040975 * L1) / (1 + 0.01765 * L1);
    }
    
    const SC = ((0.0638 * C1) / (1 + 0.0131 * C1)) + 0.638;
    const SH = SC * (F * T + 1 - F);
    
    return Math.sqrt(
        Math.pow(deltaL / (l * SL), 2) +
        Math.pow(deltaC / (c * SC), 2) +
        Math.pow(deltaH / SH, 2)
    );
}

// CIELAB to RGB 변환
export function labToRgb(L, a, b) {
    // CIELAB to XYZ
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;
    
    const delta = 6 / 29;
    const delta3 = delta * delta * delta;
    
    x = x > delta ? x * x * x : (x - 16 / 116) * 3 * delta * delta;
    y = y > delta ? y * y * y : (y - 16 / 116) * 3 * delta * delta;
    z = z > delta ? z * z * z : (z - 16 / 116) * 3 * delta * delta;
    
    // D65 illuminant
    x *= 0.95047;
    y *= 1.00000;
    z *= 1.08883;
    
    // XYZ to RGB
    let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    let b2 = x * 0.0557 + y * -0.2040 + z * 1.0570;
    
    // Gamma correction
    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    b2 = b2 > 0.0031308 ? 1.055 * Math.pow(b2, 1 / 2.4) - 0.055 : 12.92 * b2;
    
    return {
        r: Math.max(0, Math.min(255, Math.round(r * 255))),
        g: Math.max(0, Math.min(255, Math.round(g * 255))),
        b: Math.max(0, Math.min(255, Math.round(b2 * 255)))
    };
}

// CIELAB to XYZ 변환 (새로 추가)
export function labToXyz(L, a, b, illuminant = 'D65') {
    // Illuminant reference values
    const illuminants = {
        'D50': { X: 96.422, Y: 100.000, Z: 82.521 },
        'D65': { X: 95.047, Y: 100.000, Z: 108.883 }
    };
    
    const ref = illuminants[illuminant];
    
    let fy = (L + 16) / 116;
    let fx = a / 500 + fy;
    let fz = fy - b / 200;
    
    const delta = 6 / 29;
    const delta3 = Math.pow(delta, 3);
    
    let X = fx > delta ? Math.pow(fx, 3) : (fx - 16/116) * 3 * delta * delta;
    let Y = fy > delta ? Math.pow(fy, 3) : (fy - 16/116) * 3 * delta * delta;
    let Z = fz > delta ? Math.pow(fz, 3) : (fz - 16/116) * 3 * delta * delta;
    
    X *= ref.X / 100;
    Y *= ref.Y / 100;
    Z *= ref.Z / 100;
    
    return { X, Y, Z };
}

// XYZ to CIELAB 변환 (새로 추가)
export function xyzToLab(X, Y, Z, illuminant = 'D65') {
    const illuminants = {
        'D50': { X: 96.422, Y: 100.000, Z: 82.521 },
        'D65': { X: 95.047, Y: 100.000, Z: 108.883 }
    };
    
    const ref = illuminants[illuminant];
    
    X = X / (ref.X / 100);
    Y = Y / (ref.Y / 100);
    Z = Z / (ref.Z / 100);
    
    const delta = 6 / 29;
    const delta3 = Math.pow(delta, 3);
    
    const fx = X > delta3 ? Math.pow(X, 1/3) : (X / (3 * delta * delta)) + 16/116;
    const fy = Y > delta3 ? Math.pow(Y, 1/3) : (Y / (3 * delta * delta)) + 16/116;
    const fz = Z > delta3 ? Math.pow(Z, 1/3) : (Z / (3 * delta * delta)) + 16/116;
    
    const L = 116 * fy - 16;
    const a = 500 * (fx - fy);
    const b = 200 * (fy - fz);
    
    return { L, a, b };
}

// RGB to CIELAB 변환
export function rgbToLab(r, g, b) {
    // Normalize RGB values
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    // Inverse gamma correction
    r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
    g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
    b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
    
    // RGB to XYZ
    const X = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
    const Y = r * 0.2126729 + g * 0.7151522 + b * 0.0721750;
    const Z = r * 0.0193339 + g * 0.1191920 + b * 0.9503041;
    
    // XYZ to CIELAB
    return xyzToLab(X, Y, Z);
}

// 색상 유효성 검증
export function isValidLabColor(L, a, b) {
    // CIELAB 범위 검증
    if (L < 0 || L > 100) return false;
    if (Math.abs(a) > 128 || Math.abs(b) > 128) return false;
    
    // RGB 변환 가능 여부 검증
    const rgb = labToRgb(L, a, b);
    if (rgb.r < 0 || rgb.r > 255) return false;
    if (rgb.g < 0 || rgb.g > 255) return false;
    if (rgb.b < 0 || rgb.b > 255) return false;
    
    return true;
}

// Export all functions as a namespace
export const ColorScience = {
    calculateDeltaE00,
    calculateDeltaE94,
    calculateDeltaE76,
    calculateDeltaECMC,
    labToRgb,
    labToXyz,
    xyzToLab,
    rgbToLab,
    isValidLabColor
};

export default ColorScience;