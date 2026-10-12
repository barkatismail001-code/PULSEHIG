/* ==========================================================================
   TechPulse — Calculators module (tool-calcs.js)
   Fields + formulas for the calculators that are not built into tool.html.
   tool.html asks:  TPCalcs.fields[slug]  -> form fields
                    TPCalcs.calc[slug](api) -> result (api = getNum/getVal/showResult/showError)
   ========================================================================== */
(function () {
  'use strict';

  var fields = {};
  var calc = {};

  /* ---------- helpers ---------- */
  function fmt(n, d) {
    if (!isFinite(n)) return '—';
    var a = Math.abs(n);
    if (d == null) d = a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : 4;
    return Number(n.toFixed(d)).toString();
  }
  function ohms(r) {
    if (r >= 1e6) return fmt(r / 1e6) + ' MΩ';
    if (r >= 1e3) return fmt(r / 1e3) + ' kΩ';
    return fmt(r) + ' Ω';
  }
  function hz(f) {
    if (f >= 1e9) return fmt(f / 1e9) + ' GHz';
    if (f >= 1e6) return fmt(f / 1e6) + ' MHz';
    if (f >= 1e3) return fmt(f / 1e3) + ' kHz';
    return fmt(f) + ' Hz';
  }
  function secs(s) {
    if (s >= 3600) return fmt(s / 3600) + ' h';
    if (s >= 60) return fmt(s / 60) + ' min';
    if (s >= 1) return fmt(s) + ' s';
    if (s >= 1e-3) return fmt(s * 1e3) + ' ms';
    if (s >= 1e-6) return fmt(s * 1e6) + ' µs';
    return fmt(s * 1e9) + ' ns';
  }
  function days(h) {
    return h < 48 ? fmt(h) + ' hours' : fmt(h / 24) + ' days';
  }
  var E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
  function e12Near(r) {            // closest E12 value
    var m = Math.pow(10, Math.floor(Math.log10(r)));
    var best = null;
    [m / 10, m, m * 10].forEach(function (mm) {
      E12.forEach(function (v) {
        var c = v * mm;
        if (best === null || Math.abs(Math.log(c / r)) < Math.abs(Math.log(best / r))) best = c;
      });
    });
    return best;
  }
  function e12Up(r) {              // smallest E12 value >= r
    var m = Math.pow(10, Math.floor(Math.log10(r)));
    var best = Infinity;
    [m / 10, m, m * 10, m * 100].forEach(function (mm) {
      E12.forEach(function (v) { var c = v * mm; if (c >= r * 0.9999999 && c < best) best = c; });
    });
    return best;
  }
  function e12Down(r) {            // largest E12 value <= r
    var m = Math.pow(10, Math.floor(Math.log10(r)));
    var best = 0;
    [m / 10, m, m * 10].forEach(function (mm) {
      E12.forEach(function (v) { var c = v * mm; if (c <= r * 1.0000001 && c > best) best = c; });
    });
    return best;
  }
  function need(a, ids, msg) {
    for (var i = 0; i < ids.length; i++) if (a.getNum(ids[i]) == null) { a.showError(msg || 'Please fill all fields'); return false; }
    return true;
  }
  function pos(a, ids, msg) {
    for (var i = 0; i < ids.length; i++) { var v = a.getNum(ids[i]); if (v == null || v <= 0) { a.showError(msg || 'Values must be greater than zero'); return false; } }
    return true;
  }
  function awgArea(awg) {          // mm²
    var d = 0.005 * Math.pow(92, (36 - awg) / 39) * 25.4;
    return Math.PI * Math.pow(d / 2, 2);
  }

  /* ---------- I2C pull-up ---------- */
  fields['i2c-pullup'] = [
    { id: 'vcc', label: 'Bus Voltage (V)', default: 3.3, hint: '3.3 or 5' },
    { id: 'cb', label: 'Total Bus Capacitance (pF)', default: 100, hint: 'Wires + pins, ~10 pF per device + ~1 pF/cm' },
    { id: 'mode', label: 'I2C Speed', type: 'select', options: [
      { value: 'std', label: 'Standard (100 kHz)' },
      { value: 'fast', label: 'Fast (400 kHz)' },
      { value: 'fastplus', label: 'Fast-mode Plus (1 MHz)' }
    ] }
  ];
  calc['i2c-pullup'] = function (a) {
    if (!pos(a, ['vcc', 'cb'])) return;
    var mode = a.getVal('mode');
    var tr = { std: 1000e-9, fast: 300e-9, fastplus: 120e-9 }[mode];
    var iol = mode === 'fastplus' ? 0.020 : 0.003;
    var vcc = a.getNum('vcc'), cb = a.getNum('cb') * 1e-12;
    var rmax = tr / (0.8473 * cb);
    var rmin = (vcc - 0.4) / iol;
    if (rmin > rmax) return a.showError('Bus capacitance too high for this speed — reduce capacitance or choose a slower mode');
    var pick = e12Near(Math.sqrt(rmin * rmax));
    if (pick > rmax) pick = e12Down(rmax);
    if (pick < rmin) pick = e12Near(rmin);
    a.showResult(ohms(pick), 'Allowed range: ' + ohms(rmin) + ' – ' + ohms(rmax) + ' (I2C spec: rise time ' + Math.round(tr * 1e9) + ' ns, sink ' + (iol * 1000) + ' mA)');
  };

  /* ---------- Buck / Boost ---------- */
  fields['buck-boost'] = [
    { id: 'type', label: 'Converter Type', type: 'select', options: [
      { value: 'buck', label: 'Buck (step-down)' },
      { value: 'boost', label: 'Boost (step-up)' }
    ] },
    { id: 'vin', label: 'Input Voltage (V)', default: 12 },
    { id: 'vout', label: 'Output Voltage (V)', default: 5 },
    { id: 'iout', label: 'Output Current (A)', default: 1 },
    { id: 'fsw', label: 'Switching Frequency (kHz)', default: 100 },
    { id: 'ripple', label: 'Inductor Ripple (% of current)', default: 30, hint: 'Typically 20–40%' },
    { id: 'vr', label: 'Allowed Output Ripple (mV)', default: 50 }
  ];
  calc['buck-boost'] = function (a) {
    if (!pos(a, ['vin', 'vout', 'iout', 'fsw', 'ripple', 'vr'])) return;
    var type = a.getVal('type'), vin = a.getNum('vin'), vout = a.getNum('vout'), io = a.getNum('iout');
    var f = a.getNum('fsw') * 1e3, rp = a.getNum('ripple') / 100, vr = a.getNum('vr') / 1000;
    var D, L, C, dI;
    if (type === 'buck') {
      if (vout >= vin) return a.showError('Buck output voltage must be lower than input voltage');
      D = vout / vin; dI = rp * io;
      L = (vin - vout) * D / (f * dI);
      C = dI / (8 * f * vr);
    } else {
      if (vout <= vin) return a.showError('Boost output voltage must be higher than input voltage');
      D = 1 - vin / vout;
      var iin = io * vout / vin; dI = rp * iin;
      L = vin * D / (f * dI);
      C = io * D / (f * vr);
    }
    a.showResult('Duty: ' + fmt(D * 100) + ' %', 'Inductor ≥ ' + fmt(L * 1e6) + ' µH · Output capacitor ≥ ' + fmt(C * 1e6) + ' µF · Ripple current ' + fmt(dI) + ' A (ideal, lossless model)');
  };

  /* ---------- Heat sink ---------- */
  fields['heat-sink'] = [
    { id: 'p', label: 'Power Dissipation (W)', default: 5 },
    { id: 'tj', label: 'Max Junction Temp (°C)', default: 125, hint: 'Use ~20 °C below the datasheet maximum for margin' },
    { id: 'ta', label: 'Ambient Temp (°C)', default: 40 },
    { id: 'rjc', label: 'Junction-to-Case Rθjc (°C/W)', default: 1.5 },
    { id: 'rcs', label: 'Case-to-Sink Rθcs (°C/W)', default: 0.5, hint: 'Thermal pad/paste ≈ 0.2–1' }
  ];
  calc['heat-sink'] = function (a) {
    if (!need(a, ['p', 'tj', 'ta', 'rjc', 'rcs'])) return;
    var p = a.getNum('p');
    if (p <= 0) return a.showError('Power must be positive');
    var r = (a.getNum('tj') - a.getNum('ta')) / p - a.getNum('rjc') - a.getNum('rcs');
    if (r <= 0) return a.showError('Not achievable: even a perfect heat sink cannot keep the junction below the limit. Reduce power or ambient temperature');
    var hint = r > 20 ? 'a small clip-on sink is enough' : r > 8 ? 'a small extruded sink' : r > 3 ? 'a medium finned sink' : 'a large sink and/or forced airflow';
    a.showResult('≤ ' + fmt(r) + ' °C/W', 'Required sink-to-ambient thermal resistance — ' + hint + '. Junction temp at that value = ' + fmt(a.getNum('tj')) + ' °C');
  };

  /* ---------- Inductor code ---------- */
  fields['inductor-code'] = [
    { id: 'code', label: 'Inductor Marking', type: 'text', default: '4R7', placeholder: '100, 4R7, 471', hint: 'Examples: 100 = 10 µH, 4R7 = 4.7 µH, 471 = 470 µH' }
  ];
  calc['inductor-code'] = function (a) {
    var code = String(a.getVal('code')).trim().toUpperCase();
    if (!code) return a.showError('Enter a marking');
    var uh = null, m;
    if ((m = code.match(/^(\d*)R(\d+)$/))) uh = parseFloat((m[1] || '0') + '.' + m[2]);
    else if ((m = code.match(/^(\d{2})(\d)$/))) uh = parseInt(m[1], 10) * Math.pow(10, parseInt(m[2], 10));
    else if ((m = code.match(/^(\d{3})(\d)$/))) uh = parseInt(m[1], 10) * Math.pow(10, parseInt(m[2], 10));
    if (uh == null || !isFinite(uh)) return a.showError('Invalid marking (e.g. 100, 4R7, R47, 471)');
    var disp = uh >= 1000 ? fmt(uh / 1000) + ' mH' : uh >= 1 ? fmt(uh) + ' µH' : fmt(uh * 1000) + ' nH';
    a.showResult(disp, fmt(uh) + ' µH = ' + fmt(uh * 1000) + ' nH = ' + fmt(uh / 1000, 6) + ' mH');
  };

  /* ---------- ESP32 ADC ---------- */
  fields['esp32-adc'] = [
    { id: 'raw', label: 'Raw ADC Reading (0–4095)', default: 2048 },
    { id: 'atten', label: 'Attenuation', type: 'select', options: [
      { value: '1.1', label: '0 dB (≈ 0–1.1 V)' },
      { value: '1.5', label: '2.5 dB (≈ 0–1.5 V)' },
      { value: '2.2', label: '6 dB (≈ 0–2.2 V)' },
      { value: '3.9', label: '11 dB (≈ 0–3.9 V nominal)' }
    ] },
    { id: 'ratio', label: 'External Divider Ratio (Vin / Vpin)', default: 1, hint: '1 = no divider. For R1=10k, R2=10k use 2' }
  ];
  calc['esp32-adc'] = function (a) {
    if (!need(a, ['raw', 'ratio'])) return;
    var raw = a.getNum('raw'), ratio = a.getNum('ratio');
    if (raw < 0 || raw > 4095) return a.showError('Raw value must be between 0 and 4095');
    if (ratio <= 0) return a.showError('Divider ratio must be positive');
    var fs = parseFloat(a.getVal('atten'));
    var v = raw / 4095 * fs;
    a.showResult(fmt(v, 3) + ' V', 'Input voltage ≈ ' + fmt(v * ratio, 3) + ' V. Linear estimate: the ESP32 ADC is nonlinear near 0 V and full scale — use analogReadMilliVolts() or esp_adc_cal for accuracy');
  };

  /* ---------- ESP32 deep sleep ---------- */
  fields['esp32-deep-sleep'] = [
    { id: 'cap', label: 'Battery Capacity (mAh)', default: 2000 },
    { id: 'islp', label: 'Sleep Current (µA)', default: 10, hint: 'Bare chip ≈ 10 µA; dev boards are often 1–10 mA' },
    { id: 'iact', label: 'Active Current (mA)', default: 80, hint: 'Wi-Fi on ≈ 80–240 mA' },
    { id: 'tact', label: 'Awake Time per Cycle (s)', default: 5 },
    { id: 'tslp', label: 'Sleep Time per Cycle (s)', default: 600 },
    { id: 'eff', label: 'Usable Capacity (%)', default: 80 }
  ];
  calc['esp32-deep-sleep'] = function (a) {
    if (!pos(a, ['cap', 'tact', 'eff'])) return;
    if (!need(a, ['islp', 'iact', 'tslp'])) return;
    var tact = a.getNum('tact'), tslp = a.getNum('tslp');
    if (a.getNum('islp') < 0 || a.getNum('iact') < 0 || tslp < 0) return a.showError('Values cannot be negative');
    var avg = (a.getNum('iact') * tact + a.getNum('islp') / 1000 * tslp) / (tact + tslp);
    if (avg <= 0) return a.showError('Average current is zero');
    var h = a.getNum('cap') * a.getNum('eff') / 100 / avg;
    a.showResult(days(h), 'Average current: ' + fmt(avg, 3) + ' mA · Duty cycle awake: ' + fmt(tact / (tact + tslp) * 100, 2) + ' % (battery self-discharge not included)');
  };

  /* ---------- MOSFET gate resistor ---------- */
  fields['mosfet-gate'] = [
    { id: 'qg', label: 'Total Gate Charge Qg (nC)', default: 20, hint: 'From the MOSFET datasheet' },
    { id: 'vd', label: 'Gate Drive Voltage (V)', default: 5, hint: '3.3, 5, 10 or 12' },
    { id: 'tsw', label: 'Target Switching Time (ns)', default: 100, hint: 'Slower = less EMI and ringing' },
    { id: 'imax', label: 'Driver Max Current (mA)', default: 40, hint: 'MCU pin ≈ 12–40 mA, gate driver IC ≈ 1000+ mA' }
  ];
  calc['mosfet-gate'] = function (a) {
    if (!pos(a, ['qg', 'vd', 'tsw', 'imax'])) return;
    var qg = a.getNum('qg') * 1e-9, vd = a.getNum('vd'), t = a.getNum('tsw') * 1e-9, imax = a.getNum('imax') / 1000;
    var rTime = vd * t / qg;          // Ig = Qg/t  -> R = Vd/Ig
    var rMin = vd / imax;             // peak current limit
    var r = Math.max(rTime, rMin);
    var std = e12Up(r);
    a.showResult(ohms(std), 'Calculated ' + ohms(r) + ' (' + ohms(rTime) + ' for the target time, ' + ohms(rMin) + ' minimum for the driver). Average gate current ≈ ' + fmt(qg / t * 1000) + ' mA. Add a 10 kΩ gate–source pull-down');
  };

  /* ---------- RC time constant ---------- */
  fields['rc-time'] = [
    { id: 'r', label: 'Resistance (Ω)', default: 10000 },
    { id: 'c', label: 'Capacitance (µF)', default: 1 }
  ];
  calc['rc-time'] = function (a) {
    if (!pos(a, ['r', 'c'])) return;
    var tau = a.getNum('r') * a.getNum('c') * 1e-6;
    a.showResult('τ = ' + secs(tau), 'Cutoff frequency: ' + hz(1 / (2 * Math.PI * tau)) + ' · 63 %: ' + secs(tau) + ' · 95 %: ' + secs(3 * tau) + ' · 99 %: ' + secs(4.605 * tau) + ' · fully charged (5τ): ' + secs(5 * tau));
  };

  /* ---------- LC resonance ---------- */
  fields['lc-resonance'] = [
    { id: 'l', label: 'Inductance (µH)', default: 100 },
    { id: 'c', label: 'Capacitance (nF)', default: 100 },
    { id: 'r', label: 'Series Resistance (Ω) — optional', default: 1, hint: 'Used for Q factor and bandwidth' }
  ];
  calc['lc-resonance'] = function (a) {
    if (!pos(a, ['l', 'c'])) return;
    var l = a.getNum('l') * 1e-6, c = a.getNum('c') * 1e-9, r = a.getNum('r');
    var f0 = 1 / (2 * Math.PI * Math.sqrt(l * c));
    var z0 = Math.sqrt(l / c);
    var note = 'Characteristic impedance: ' + ohms(z0);
    if (r != null && r > 0) {
      var q = z0 / r;
      note += ' · Q = ' + fmt(q) + ' · Bandwidth = ' + hz(f0 / q);
    }
    a.showResult(hz(f0), note);
  };

  /* ---------- Op-amp gain ---------- */
  fields['opamp-gain'] = [
    { id: 'type', label: 'Configuration', type: 'select', options: [
      { value: 'inv', label: 'Inverting' },
      { value: 'non', label: 'Non-inverting' }
    ] },
    { id: 'rf', label: 'Feedback Resistor Rf (kΩ)', default: 100 },
    { id: 'rin', label: 'Input Resistor Rin (kΩ)', default: 10 },
    { id: 'gbw', label: 'Gain-Bandwidth Product (MHz) — optional', default: 1, hint: 'LM358 ≈ 1 MHz, TL072 ≈ 3 MHz' }
  ];
  calc['opamp-gain'] = function (a) {
    if (!pos(a, ['rf', 'rin'])) return;
    var rf = a.getNum('rf'), rin = a.getNum('rin'), inv = a.getVal('type') === 'inv';
    var g = inv ? -rf / rin : 1 + rf / rin;
    var ng = 1 + rf / rin;            // noise gain, sets the bandwidth for both configs
    var note = 'Gain: ' + fmt(20 * Math.log10(Math.abs(g))) + ' dB' + (inv ? ' (phase inverted)' : '');
    var gbw = a.getNum('gbw');
    if (gbw != null && gbw > 0) note += ' · Bandwidth ≈ ' + hz(gbw * 1e6 / ng);
    a.showResult((inv ? '' : '+') + fmt(g) + ' V/V', note);
  };

  /* ---------- Power consumption / cost ---------- */
  fields['power-consumption'] = [
    { id: 'w', label: 'Appliance Power (W)', default: 100 },
    { id: 'h', label: 'Hours per Day', default: 8 },
    { id: 'price', label: 'Electricity Price (per kWh)', default: 0.15, hint: 'In your local currency' },
    { id: 'days', label: 'Days per Month', default: 30 }
  ];
  calc['power-consumption'] = function (a) {
    if (!need(a, ['w', 'h', 'price', 'days'])) return;
    var w = a.getNum('w'), h = a.getNum('h'), p = a.getNum('price'), d = a.getNum('days');
    if (w < 0 || h < 0 || h > 24 || p < 0 || d <= 0) return a.showError('Check the values (hours must be 0–24)');
    var kwhDay = w * h / 1000, kwhMonth = kwhDay * d;
    a.showResult(fmt(kwhMonth * p, 2) + ' / month', fmt(kwhDay, 3) + ' kWh/day · ' + fmt(kwhMonth, 2) + ' kWh/month · ' + fmt(kwhDay * 365 * p, 2) + ' / year');
  };

  /* ---------- Solar panel ---------- */
  fields['solar-panel'] = [
    { id: 'wh', label: 'Daily Energy Use (Wh/day)', default: 1000 },
    { id: 'sun', label: 'Peak Sun Hours per Day', default: 4.5, hint: 'Typically 3–6 depending on location and season' },
    { id: 'eff', label: 'System Efficiency (%)', default: 75, hint: 'Charge controller, wiring, dust, temperature' },
    { id: 'pw', label: 'Panel Rating (W)', default: 400 },
    { id: 'auto', label: 'Battery Autonomy (days)', default: 1 },
    { id: 'dod', label: 'Battery Depth of Discharge (%)', default: 50, hint: '50 % lead-acid, 80–90 % lithium' },
    { id: 'bv', label: 'Battery Voltage (V)', default: 12 }
  ];
  calc['solar-panel'] = function (a) {
    if (!pos(a, ['wh', 'sun', 'eff', 'pw', 'auto', 'dod', 'bv'])) return;
    var wh = a.getNum('wh'), eff = a.getNum('eff') / 100;
    if (eff > 1 || a.getNum('dod') > 100) return a.showError('Efficiency and depth of discharge cannot exceed 100 %');
    var req = wh / (a.getNum('sun') * eff);
    var n = Math.ceil(req / a.getNum('pw'));
    var ah = wh * a.getNum('auto') / (a.getNum('dod') / 100 * a.getNum('bv'));
    a.showResult(fmt(req, 0) + ' W of panels', n + ' × ' + fmt(a.getNum('pw'), 0) + ' W panel(s) · Battery bank ≈ ' + fmt(ah, 0) + ' Ah at ' + fmt(a.getNum('bv'), 0) + ' V');
  };

  /* ---------- Battery pack ---------- */
  fields['battery-pack'] = [
    { id: 'chem', label: 'Cell Chemistry', type: 'select', options: [
      { value: '3.7,4.2,3.0', label: 'Li-ion / LiPo (3.7 V nominal)' },
      { value: '3.2,3.65,2.5', label: 'LiFePO4 (3.2 V nominal)' },
      { value: '1.2,1.45,1.0', label: 'NiMH / NiCd (1.2 V nominal)' }
    ] },
    { id: 'mah', label: 'Cell Capacity (mAh)', default: 3000 },
    { id: 'imax', label: 'Cell Max Continuous Discharge (A)', default: 10 },
    { id: 's', label: 'Cells in Series (S)', default: 3 },
    { id: 'p', label: 'Cells in Parallel (P)', default: 2 }
  ];
  calc['battery-pack'] = function (a) {
    if (!pos(a, ['mah', 'imax', 's', 'p'])) return;
    var c = a.getVal('chem').split(',').map(parseFloat), s = Math.round(a.getNum('s')), p = Math.round(a.getNum('p'));
    var ah = a.getNum('mah') / 1000 * p;
    var vnom = c[0] * s;
    a.showResult(s + 'S' + p + 'P · ' + fmt(vnom) + ' V · ' + fmt(ah) + ' Ah',
      'Energy: ' + fmt(vnom * ah, 1) + ' Wh · Full: ' + fmt(c[1] * s) + ' V · Cut-off: ' + fmt(c[2] * s) + ' V · Max discharge: ' + fmt(a.getNum('imax') * p) + ' A · ' + (s * p) + ' cells. Use a BMS rated for ' + s + 'S and at least ' + fmt(a.getNum('imax') * p) + ' A');
  };

  /* ---------- AQI ---------- */
  fields['air-quality-index'] = [
    { id: 'pm', label: 'PM2.5 (µg/m³, 24-hour average)', default: 25 },
    { id: 'std', label: 'EPA Breakpoints', type: 'select', options: [
      { value: '2024', label: 'EPA 2024 (current)' },
      { value: '2012', label: 'EPA 2012–2023 (older)' }
    ] }
  ];
  var BP = {
    '2024': [[0, 9.0, 0, 50], [9.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 125.4, 151, 200], [125.5, 225.4, 201, 300], [225.5, 325.4, 301, 500]],
    '2012': [[0, 12.0, 0, 50], [12.1, 35.4, 51, 100], [35.5, 55.4, 101, 150], [55.5, 150.4, 151, 200], [150.5, 250.4, 201, 300], [250.5, 500.4, 301, 500]]
  };
  var CAT = [[50, 'Good'], [100, 'Moderate'], [150, 'Unhealthy for Sensitive Groups'], [200, 'Unhealthy'], [300, 'Very Unhealthy'], [500, 'Hazardous']];
  calc['air-quality-index'] = function (a) {
    if (!need(a, ['pm'])) return;
    var pm = Math.floor(a.getNum('pm') * 10) / 10;
    if (pm < 0) return a.showError('PM2.5 cannot be negative');
    var bps = BP[a.getVal('std')], aqi = null;
    for (var i = 0; i < bps.length; i++) {
      if (pm <= bps[i][1]) {
        aqi = (bps[i][3] - bps[i][2]) / (bps[i][1] - bps[i][0]) * (pm - bps[i][0]) + bps[i][2];
        break;
      }
    }
    if (aqi == null) aqi = 500;
    aqi = Math.round(aqi);
    var cat = CAT.filter(function (c) { return aqi <= c[0]; })[0][1];
    a.showResult('AQI ' + aqi + ' — ' + cat, 'WHO 2021 guideline: 15 µg/m³ (24 h) — your value is ' + fmt(pm / 15, 2) + '× the guideline');
  };

  /* ---------- Dew point ---------- */
  fields['temp-humidity'] = [
    { id: 't', label: 'Air Temperature', default: 25 },
    { id: 'unit', label: 'Unit', type: 'select', options: [{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }] },
    { id: 'rh', label: 'Relative Humidity (%)', default: 60 }
  ];
  calc['temp-humidity'] = function (a) {
    if (!need(a, ['t', 'rh'])) return;
    var t = a.getNum('t'), rh = a.getNum('rh'), f = a.getVal('unit') === 'F';
    if (rh <= 0 || rh > 100) return a.showError('Humidity must be between 0 and 100 %');
    var tc = f ? (t - 32) * 5 / 9 : t;
    var A = 17.62, B = 243.12;
    var g = Math.log(rh / 100) + A * tc / (B + tc);
    var td = B * g / (A - g);
    var out = f ? td * 9 / 5 + 32 : td;
    var comfort = td < 10 ? 'dry, comfortable' : td < 16 ? 'comfortable' : td < 21 ? 'getting humid' : 'muggy / oppressive';
    a.showResult(fmt(out, 1) + (f ? ' °F' : ' °C'), 'Dew point — ' + comfort + '. Surfaces colder than this will get condensation (Magnus formula, valid ≈ 0–60 °C)');
  };

  /* ---------- HVAC BTU ---------- */
  fields['hvac-btu'] = [
    { id: 'area', label: 'Room Area (m²)', default: 20 },
    { id: 'h', label: 'Ceiling Height (m)', default: 2.5 },
    { id: 'ins', label: 'Insulation', type: 'select', options: [
      { value: '1', label: 'Average' }, { value: '0.9', label: 'Good' }, { value: '1.3', label: 'Poor' }
    ] },
    { id: 'sun', label: 'Sun Exposure', type: 'select', options: [
      { value: '1', label: 'Normal' }, { value: '0.9', label: 'Shaded' }, { value: '1.1', label: 'Very sunny' }
    ] },
    { id: 'occ', label: 'Number of People', default: 2 },
    { id: 'kit', label: 'Room Type', type: 'select', options: [
      { value: '0', label: 'Living / bedroom' }, { value: '4000', label: 'Kitchen (+4000 BTU/h)' }
    ] }
  ];
  calc['hvac-btu'] = function (a) {
    if (!pos(a, ['area', 'h'])) return;
    if (!need(a, ['occ'])) return;
    var area = a.getNum('area'), h = a.getNum('h');
    var base = area * 10.764 * 20;                 // 20 BTU/h per ft², 2.4 m ceiling
    var btu = base * (h / 2.4) * parseFloat(a.getVal('ins')) * parseFloat(a.getVal('sun'));
    btu += Math.max(0, a.getNum('occ') - 2) * 600 + parseFloat(a.getVal('kit'));
    var rounded = Math.round(btu / 500) * 500;
    a.showResult(rounded + ' BTU/h', '≈ ' + fmt(btu / 3412.14, 2) + ' kW (' + fmt(btu / 12000, 2) + ' tons) · Rule-of-thumb estimate: have an installer confirm for hot climates or large windows');
  };

  /* ---------- Wire voltage drop ---------- */
  fields['wire-voltage-drop'] = [
    { id: 'mat', label: 'Conductor', type: 'select', options: [
      { value: '0.017241', label: 'Copper' }, { value: '0.0282', label: 'Aluminum' }
    ] },
    { id: 'awg', label: 'Wire Gauge (AWG)', default: 14 },
    { id: 'len', label: 'One-way Length (m)', default: 20 },
    { id: 'i', label: 'Current (A)', default: 10 },
    { id: 'v', label: 'Supply Voltage (V)', default: 12 }
  ];
  calc['wire-voltage-drop'] = function (a) {
    if (!pos(a, ['len', 'i', 'v'])) return;
    var awg = a.getNum('awg');
    if (awg == null || awg < 0 || awg > 40) return a.showError('AWG typically 0–40');
    var area = awgArea(awg), rho = parseFloat(a.getVal('mat'));
    var r = rho * (2 * a.getNum('len')) / area;     // there and back
    var vd = r * a.getNum('i'), pct = vd / a.getNum('v') * 100;
    var verdict = pct <= 3 ? 'OK (≤ 3 % recommended for branch circuits)' : pct <= 5 ? 'Acceptable only for total feeder + branch (≤ 5 %)' : 'Too high — use a thicker wire or shorter run';
    a.showResult(fmt(vd, 2) + ' V (' + fmt(pct, 1) + ' %)', verdict + ' · Loop resistance ' + fmt(r, 4) + ' Ω · Power lost in wire ' + fmt(vd * a.getNum('i'), 1) + ' W · ' + fmt(area, 2) + ' mm²');
  };

  /* ---------- Antenna length ---------- */
  fields['antenna-length'] = [
    { id: 'f', label: 'Frequency (MHz)', default: 433 },
    { id: 'type', label: 'Antenna Type', type: 'select', options: [
      { value: '0.25', label: 'Quarter-wave (λ/4)' }, { value: '0.5', label: 'Half-wave (λ/2)' }, { value: '1', label: 'Full-wave (λ)' }
    ] },
    { id: 'vf', label: 'Velocity Factor', default: 0.95, hint: 'Bare wire ≈ 0.95, insulated wire ≈ 0.9' }
  ];
  calc['antenna-length'] = function (a) {
    if (!pos(a, ['f', 'vf'])) return;
    if (a.getNum('vf') > 1) return a.showError('Velocity factor cannot exceed 1');
    var lam = 299.792458 / a.getNum('f');          // metres
    var len = lam * parseFloat(a.getVal('type')) * a.getNum('vf');
    a.showResult(fmt(len * 100) + ' cm', fmt(len / 0.0254) + ' in · Free-space wavelength: ' + fmt(lam * 100) + ' cm. Cut slightly long and trim while checking SWR');
  };

  /* ---------- LED strip power ---------- */
  fields['led-strip-power'] = [
    { id: 'len', label: 'Strip Length (m)', default: 5 },
    { id: 'dens', label: 'LEDs per Meter', default: 60 },
    { id: 'ma', label: 'Current per LED at Full White (mA)', default: 60, hint: 'WS2812B ≈ 60 mA, SK6812 RGBW ≈ 80 mA, single-colour 5050 ≈ 20 mA' },
    { id: 'v', label: 'Strip Voltage (V)', default: 5 },
    { id: 'br', label: 'Max Brightness Used (%)', default: 100 },
    { id: 'margin', label: 'PSU Safety Margin (%)', default: 20 }
  ];
  calc['led-strip-power'] = function (a) {
    if (!pos(a, ['len', 'dens', 'ma', 'v', 'br'])) return;
    if (!need(a, ['margin'])) return;
    var n = Math.round(a.getNum('len') * a.getNum('dens'));
    var i = n * a.getNum('ma') / 1000 * a.getNum('br') / 100;
    var p = i * a.getNum('v');
    var psuI = i * (1 + a.getNum('margin') / 100), psuP = p * (1 + a.getNum('margin') / 100);
    a.showResult(fmt(p, 1) + ' W', n + ' LEDs · ' + fmt(i, 2) + ' A at ' + fmt(a.getNum('v'), 0) + ' V · Choose a PSU ≥ ' + fmt(psuI, 1) + ' A (' + fmt(psuP, 0) + ' W). Long strips: inject power every ~2–3 m');
  };

  /* ---------- Relay contact ---------- */
  fields['relay-contact'] = [
    { id: 'load', label: 'Load Type', type: 'select', options: [
      { value: 'acr', label: 'AC resistive (heater, bulb)' },
      { value: 'aci', label: 'AC inductive (motor, pump, transformer)' },
      { value: 'dcr', label: 'DC resistive' },
      { value: 'dci', label: 'DC inductive (solenoid, DC motor)' }
    ] },
    { id: 'v', label: 'Load Voltage (V)', default: 230 },
    { id: 'i', label: 'Load Running Current (A)', default: 3 },
    { id: 'rate', label: 'Relay Contact Rating (A)', default: 10, hint: 'Use the rating for AC or DC as printed on the relay' },
    { id: 'vrate', label: 'Relay Max Switching Voltage (V)', default: 250, hint: 'e.g. 250 VAC / 30 VDC for common relays' }
  ];
  calc['relay-contact'] = function (a) {
    if (!pos(a, ['v', 'i', 'rate', 'vrate'])) return;
    var t = a.getVal('load'), i = a.getNum('i');
    var factor = { acr: 1.25, aci: 3, dcr: 1.5, dci: 2.5 }[t];
    var need_ = i * factor;
    var vok = a.getNum('v') <= a.getNum('vrate');
    var iok = a.getNum('rate') >= need_;
    var snub = (t === 'aci') ? 'Add an RC snubber (≈ 100 Ω + 100 nF X2 capacitor) or MOV across the contacts.'
      : (t === 'dci') ? 'Add a flyback diode across the load (cathode to +) — and keep the contact rating well above the current.'
      : 'No snubber needed for a resistive load.';
    if (!vok) return a.showError('Load voltage exceeds the relay’s max switching voltage — choose another relay');
    a.showResult(iok ? '✅ Safe' : '⚠️ Rating too low',
      'Contacts needed ≥ ' + fmt(need_, 2) + ' A (running ' + fmt(i, 2) + ' A × ' + factor + ' derating for inrush/arcing); yours is ' + fmt(a.getNum('rate'), 1) + ' A. ' + snub);
  };

  /* ---------- Battery charge time ---------- */
  fields['battery-charge-time'] = [
    { id: 'cap', label: 'Battery Capacity (mAh)', default: 3000 },
    { id: 'i', label: 'Charge Current (mA)', default: 1000 },
    { id: 'from', label: 'Start Charge (%)', default: 0 },
    { id: 'to', label: 'End Charge (%)', default: 100 },
    { id: 'eff', label: 'Charging Efficiency (%)', default: 85 },
    { id: 'chem', label: 'Charging Profile', type: 'select', options: [
      { value: 'cccv', label: 'Li-ion / LiPo (CC then CV taper)' },
      { value: 'cc', label: 'Constant current (NiMH, lead-acid bulk)' }
    ] }
  ];
  calc['battery-charge-time'] = function (a) {
    if (!pos(a, ['cap', 'i', 'eff'])) return;
    if (!need(a, ['from', 'to'])) return;
    var from = a.getNum('from'), to = a.getNum('to');
    if (from < 0 || to > 100 || to <= from) return a.showError('End charge must be higher than start (0–100 %)');
    var q = a.getNum('cap') * (to - from) / 100;           // mAh to put in
    var t = q / (a.getNum('i') * a.getNum('eff') / 100);   // hours at constant current
    if (a.getVal('chem') === 'cccv' && to > 80) {
      var taperPart = Math.min(to, 100) - Math.max(from, 80);          // % charged in the CV phase
      var ccPart = (to - from) - taperPart;
      var base = a.getNum('cap') / (a.getNum('i') * a.getNum('eff') / 100) / 100;   // hours per 1 %
      t = base * ccPart + base * taperPart / 0.4;                       // CV phase averages ~40 % of the current
    }
    var h = Math.floor(t), m = Math.round((t - h) * 60);
    if (m === 60) { h++; m = 0; }
    a.showResult(h + ' h ' + m + ' min', 'Charge delivered: ' + fmt(q, 0) + ' mAh · C-rate: ' + fmt(a.getNum('i') / a.getNum('cap'), 2) + ' C · Estimate only; actual time depends on the charger IC');
  };

  /* ---------- 555 timer ---------- */
  fields['555-timer'] = [
    { id: 'mode', label: 'Mode', type: 'select', options: [
      { value: 'astable', label: 'Astable (oscillator)' }, { value: 'mono', label: 'Monostable (one-shot)' }
    ] },
    { id: 'r1', label: 'R1 (kΩ)', default: 10 },
    { id: 'r2', label: 'R2 (kΩ) — astable only', default: 47 },
    { id: 'c', label: 'C (nF)', default: 100 }
  ];
  calc['555-timer'] = function (a) {
    if (!pos(a, ['r1', 'c'])) return;
    var r1 = a.getNum('r1') * 1e3, c = a.getNum('c') * 1e-9;
    if (a.getVal('mode') === 'mono') {
      var T = 1.1 * r1 * c;
      return a.showResult('Pulse: ' + secs(T), 'T = 1.1 × R1 × C');
    }
    if (!pos(a, ['r2'], 'R2 must be greater than zero')) return;
    var r2 = a.getNum('r2') * 1e3;
    var th = 0.693 * (r1 + r2) * c, tl = 0.693 * r2 * c, f = 1 / (th + tl);
    a.showResult(hz(f), 'Duty cycle: ' + fmt((th / (th + tl)) * 100, 1) + ' % · High: ' + secs(th) + ' · Low: ' + secs(tl) + ' · Period: ' + secs(th + tl) + ' (duty is always above 50 % unless a diode bypasses R2)');
  };

  /* ---------- Transistor base resistor ---------- */
  fields['transistor-base-resistor'] = [
    { id: 'vp', label: 'Drive Voltage from Pin (V)', default: 3.3, hint: '3.3 or 5' },
    { id: 'vbe', label: 'Base-Emitter Voltage (V)', default: 0.7 },
    { id: 'ic', label: 'Load Current Ic (mA)', default: 100 },
    { id: 'hfe', label: 'Transistor Gain hFE (minimum)', default: 100, hint: 'Use the datasheet minimum at your Ic' },
    { id: 'od', label: 'Saturation Overdrive Factor', default: 3, hint: '2–5 so the transistor saturates fully' }
  ];
  calc['transistor-base-resistor'] = function (a) {
    if (!pos(a, ['vp', 'vbe', 'ic', 'hfe', 'od'])) return;
    var vp = a.getNum('vp'), vbe = a.getNum('vbe');
    if (vp <= vbe) return a.showError('Drive voltage must be higher than Vbe');
    var ib = a.getNum('od') * a.getNum('ic') / a.getNum('hfe');       // mA
    var r = (vp - vbe) / (ib / 1000);
    var std = e12Down(r);
    var ibReal = (vp - vbe) / std * 1000;
    a.showResult(ohms(std), 'Calculated ' + ohms(r) + ' · Base current ≈ ' + fmt(ibReal, 2) + ' mA' + (ibReal > 12 ? ' — above a safe ESP32/Arduino pin load (~12 mA): use a MOSFET or a Darlington/driver' : ' (within typical MCU pin limits)') + '. Add a 10 kΩ base–emitter pull-down');
  };

  /* ---------- Stepper / servo torque ---------- */
  fields['stepper-torque'] = [
    { id: 'm', label: 'Load Mass (kg)', default: 1 },
    { id: 'l', label: 'Arm Length / Lever (cm)', default: 10 },
    { id: 'sf', label: 'Safety Factor', default: 2, hint: '1.5–3 typical; use 3+ for fast acceleration' }
  ];
  calc['stepper-torque'] = function (a) {
    if (!pos(a, ['m', 'l', 'sf'])) return;
    var t = a.getNum('m') * 9.80665 * (a.getNum('l') / 100) * a.getNum('sf');   // N·m
    a.showResult(fmt(t, 3) + ' N·m', '≈ ' + fmt(t * 10.1972, 2) + ' kg·cm ≈ ' + fmt(t * 141.612, 1) + ' oz·in (static holding torque including the safety factor). Stepper torque drops with speed — check the motor’s torque curve');
  };

  /* ---------- ESP32 Wi-Fi power ---------- */
  fields['esp32-wifi-power'] = [
    { id: 'itx', label: 'TX Current (mA)', default: 240, hint: 'ESP32 transmitting ≈ 160–260 mA' },
    { id: 'irx', label: 'RX Current (mA)', default: 100, hint: 'Receiving ≈ 95–100 mA' },
    { id: 'dtx', label: 'TX Time Share (%)', default: 2 },
    { id: 'drx', label: 'RX Time Share (%)', default: 8 },
    { id: 'iidle', label: 'Idle Current (mA)', default: 30, hint: 'Modem-sleep ≈ 20–30 mA, light-sleep ≈ 1 mA, no power saving ≈ 80–100 mA' },
    { id: 'cap', label: 'Battery Capacity (mAh) — optional', default: 2000 }
  ];
  calc['esp32-wifi-power'] = function (a) {
    if (!need(a, ['itx', 'irx', 'dtx', 'drx', 'iidle'])) return;
    var dtx = a.getNum('dtx') / 100, drx = a.getNum('drx') / 100;
    if (dtx < 0 || drx < 0 || dtx + drx > 1) return a.showError('TX + RX time share must be between 0 and 100 %');
    var avg = dtx * a.getNum('itx') + drx * a.getNum('irx') + (1 - dtx - drx) * a.getNum('iidle');
    var note = 'Radio busy ' + fmt((dtx + drx) * 100, 1) + ' % of the time';
    var cap = a.getNum('cap');
    if (cap != null && cap > 0 && avg > 0) note += ' · Battery life ≈ ' + days(cap * 0.8 / avg) + ' (80 % usable)';
    a.showResult(fmt(avg, 1) + ' mA average', note);
  };

  window.TPCalcs = { fields: fields, calc: calc, _util: { e12Near: e12Near, e12Down: e12Down, e12Up: e12Up } };
})();
