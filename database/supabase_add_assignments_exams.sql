-- ============================================================
-- Assignments + Exams for all courses
-- Each course gets: 1 assignment (3 problems) + 1 exam (3 problems)
-- ============================================================

-- ============================================================
-- CIRCUITS I — assignment 3, exam final
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('circuits-i', 3, 'Problem Set 3: Op-Amps and Transients', $ASG$
[
  {"question": "Design a non-inverting op-amp amplifier with a gain of 11 and an input impedance of at least 100 kΩ. Choose standard resistor values and verify.", "hints": ["Gain = 1 + R2/R1", "Input impedance of non-inverting is very high (MΩ)", "Pick R1 = 10kΩ, solve for R2"], "solution": "Gain = 1 + R2/R1 = 11, so R2/R1 = 10. Choose R1 = 10 kΩ, R2 = 100 kΩ. Non-inverting input impedance is set by the op-amp's input stage, typically 10^12 Ω (CMOS) or 10^6 Ω (BJT), so >100 kΩ is easily satisfied. Verify: gain = 1 + 100/10 = 11. ✓", "difficulty": "Medium", "points": 30},
  {"question": "For an RC circuit with R=2 kΩ, C=100 nF, and V_in stepping from 0V to 10V at t=0, find the time constant, the voltage at t=τ, and the time to reach 99% of final value.", "hints": ["τ = RC", "V_C(t) = V_in(1 - e^(-t/τ))", "99% at t = 5τ"], "solution": "τ = RC = 2000 × 100e-9 = 200 µs. At t=τ, V_C = 10 × (1 - e^-1) = 10 × 0.632 = 6.32 V. 99% is reached at t = 5τ = 1000 µs = 1 ms.", "difficulty": "Easy", "points": 20},
  {"question": "Calculate the RMS value of a sine wave with amplitude 5V, and compute the average power it delivers to a 50Ω resistor.", "hints": ["V_RMS = V_peak / √2", "P = V_RMS² / R"], "solution": "V_RMS = 5 / √2 = 3.54 V. P = 3.54² / 50 = 12.5 / 50 = 0.25 W.", "difficulty": "Easy", "points": 15}
]
$ASG$::jsonb, 65, 3)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('circuits-i', 'midterm-2', 'Midterm 2: Transients, Op-Amps, Frequency Response', 90, $EXM$
[
  {"question": "Design an inverting amplifier with gain -10 using an op-amp with an input resistance of 1 kΩ. What is the bandwidth if the op-amp GBW is 1 MHz?", "solution": "Gain = -R2/R1 = -10, so R2/R1 = 10. Choose R1 = 1kΩ, R2 = 10kΩ. Bandwidth = GBW / |Gain| = 1 MHz / 10 = 100 kHz.", "points": 30},
  {"question": "A parallel RLC circuit has R=1kΩ, L=1mH, C=1µF. Find the resonant frequency and the Q factor.", "solution": "f_0 = 1/(2π√(LC)) = 1/(2π√(1e-3 × 1e-6)) = 1/(2π × 3.16e-5) = 5.03 kHz. Q = R√(C/L) = 1000 × √(1e-6/1e-3) = 1000 × 0.0316 = 31.6.", "points": 35},
  {"question": "Given the circuit with Vin=12V, R1=4.7kΩ (to node A), R2=2.2kΩ (node A to ground), R3=3.3kΩ (node A to node B), R4=1kΩ (node B to ground), find V_A and V_B using nodal analysis.", "solution": "Node A: (V_A-12)/4.7k + V_A/2.2k + (V_A-V_B)/3.3k = 0. Node B: (V_B-V_A)/3.3k + V_B/1k = 0. Solve: V_A(1/4.7 + 1/2.2 + 1/3.3) - V_B/3.3 = 12/4.7. From B: V_A/3.3 = V_B(1/3.3 + 1/1) = V_B × 1.303, V_A = 4.3 V_B. Substitute: 4.3V_B × 0.637 - V_B/3.3 = 2.553. 2.739V_B - 0.303V_B = 2.553. 2.436V_B = 2.553. V_B = 1.048 V. V_A = 4.3 × 1.048 = 4.5 V.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- SIGNALS & SYSTEMS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('signals-systems', 1, 'Problem Set 1: Signals, Convolution, LTI Systems', $ASG$
[
  {"question": "Is the system y(t) = x(t)cos(2πt) linear? Time-invariant? Justify.", "hints": ["Test superposition: S(ax1+bx2) = aS(x1)+bS(x2)?", "Test shift: S(x(t-t0)) = y(t-t0)?"], "solution": "Linear: y = cos(2πt)(ax1+bx2) = a cos(2πt)x1 + b cos(2πt)x2 ✓. Time-variant: S(x(t-t0)) = x(t-t0)cos(2πt), but y(t-t0) = x(t-t0)cos(2π(t-t0)) ≠. So it's time-varying.", "difficulty": "Medium", "points": 25},
  {"question": "Compute the convolution of x[n] = {1, 2, 3} and h[n] = {1, 1} (both starting at n=0).", "hints": ["y[n] = Σ x[k]h[n-k]", "Length = Nx + Nh - 1 = 3+2-1 = 4"], "solution": "y[0] = 1×1 = 1. y[1] = 2×1 + 1×1 = 3. y[2] = 3×1 + 2×1 = 5. y[3] = 3×1 = 3. So y = {1, 3, 5, 3}.", "difficulty": "Easy", "points": 20},
  {"question": "Find the Fourier series coefficients of a periodic square wave with amplitude A, period T, 50% duty cycle.", "hints": ["a_n = (2/T)∫x(t)cos(2πnt/T)dt", "Odd function → only sine terms"], "solution": "For a 50% duty-cycle square wave, a_0 = 0, a_n = 0. b_n = (2A/(nπ))(1-cos(nπ)) = 0 for even n, 4A/(nπ) for odd n. So x(t) = (4A/π)[sin(ωt) + sin(3ωt)/3 + sin(5ωt)/5 + ...].", "difficulty": "Hard", "points": 35}
]
$ASG$::jsonb, 80, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('signals-systems', 'midterm-1', 'Midterm 1: Signals, LTI, Fourier', 90, $EXM$
[
  {"question": "Compute the Fourier transform of x(t) = e^(-3t)u(t). Plot the magnitude spectrum.", "solution": "X(jω) = ∫₀^∞ e^(-3t)e^(-jωt)dt = 1/(3+jω). |X(jω)| = 1/√(9+ω²). At ω=0, |X|=1/3. At ω→∞, |X|→0. -3dB cutoff at ω=3 rad/s.", "points": 30},
  {"question": "A system has impulse response h(t) = e^(-2t)u(t). Find the output for input x(t) = u(t).", "solution": "y(t) = ∫₀^t e^(-2τ)dτ = (1/2)(1 - e^(-2t)) for t ≥ 0. So y(t) = 0.5(1 - e^(-2t))u(t).", "points": 30},
  {"question": "Is the system y(t) = x(2t) causal? Stable? Time-invariant? Justify.", "solution": "Causal: y(t) depends on x(2t), which for t>0 uses x at future time >t. So NOT causal. Stable: |x|≤M → |y|≤M ✓ BIBO stable. Time-varying: S(x(t-t0)) = x(2t-t0), but y(t-t0) = x(2(t-t0)) = x(2t-2t0). Not equal → time-varying.", "points": 40}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- ELECTROMAGNETICS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('electromagnetics', 1, 'Problem Set 1: Maxwell Equations, Plane Waves', $ASG$
[
  {"question": "Starting from Maxwell equations in vacuum, derive the wave equation for E.", "hints": ["Take curl of Faraday law", "Use vector identity ∇×(∇×E) = ∇(∇·E) - ∇²E"], "solution": "∇×E = -∂B/∂t. Take curl: ∇×(∇×E) = -∂(∇×B)/∂t. Use identity: ∇(∇·E) - ∇²E = -μ₀ε₀ ∂²E/∂t². In vacuum ∇·E = 0, so ∇²E = μ₀ε₀ ∂²E/∂t². Wave speed c = 1/√(μ₀ε₀).", "difficulty": "Medium", "points": 30},
  {"question": "A uniform plane wave in vacuum has E = 10cos(6π×10⁸t - 2πz) âx V/m. Find frequency, wavelength, direction of propagation, and H field.", "hints": ["ω = 6π×10⁸, so f = ω/2π", "λ = c/f", "Direction from sign of kz", "H = (1/η₀) k̂ × E"], "solution": "ω = 6π×10⁸ → f = 3×10⁸ Hz = 300 MHz. λ = c/f = 1 m. Direction: +z. η₀ = 377 Ω. H = (10/377)cos(ωt-2πz) ây = 26.5cos(...) ây mA/m.", "difficulty": "Easy", "points": 25},
  {"question": "Calculate the skin depth in copper at 60 Hz and at 1 GHz. (σ_Cu = 5.8×10⁷ S/m)", "hints": ["δ = √(2/(ωμσ))", "μ = μ₀ for copper"], "solution": "δ = √(2/(2πf × 4π×10⁻⁷ × 5.8×10⁷)). At 60 Hz: δ = √(2/(2π×60×4π×10⁻⁷×5.8×10⁷)) = 8.5 mm. At 1 GHz: δ = 2.1 µm. This is why RF currents flow on the surface.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 80, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('electromagnetics', 'midterm-1', 'Midterm 1: Maxwell, Plane Waves, Transmission Lines', 90, $EXM$
[
  {"question": "A 50Ω coaxial line is terminated with a 75Ω load. What is the reflection coefficient and VSWR?", "solution": "Γ = (75-50)/(75+50) = 25/125 = 0.2. VSWR = (1+0.2)/(1-0.2) = 1.5.", "points": 30},
  {"question": "Calculate the critical angle for total internal reflection at a glass-air interface (n_glass = 1.5).", "solution": "sin(θ_c) = n₂/n₁ = 1/1.5 = 0.667. θ_c = 41.8°.", "points": 30},
  {"question": "A quarter-wave dipole antenna operates at 100 MHz. Find its physical length and input impedance.", "solution": "λ = c/f = 3m. Half-wave dipole length = λ/2 = 1.5 m. Input impedance ≈ 73Ω. A quarter-wave monopole would be 0.75 m with ~36Ω impedance.", "points": 40}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- CONTROL SYSTEMS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('control-systems', 1, 'Problem Set 1: Transfer Functions, PID, Bode', $ASG$
[
  {"question": "For a plant P(s) = 10/(s+2), design a P controller to achieve a steady-state error < 5% for a unit step, and calculate the closed-loop pole.", "hints": ["Steady-state error for step with P control: 1/(1+Kp·P(0))"], "solution": "P(0) = 10/2 = 5. Need 1/(1+5Kp) < 0.05 → Kp > 3.8. Choose Kp = 4. Closed loop: T(s) = 40/(s+42). Pole at s=-42. Fast, well-damped.", "difficulty": "Medium", "points": 30},
  {"question": "Find the phase margin of L(s) = 10/(s(s+1)(s+5)) at crossover frequency ω_c ≈ 1.4 rad/s.", "hints": ["Substitute s=jω", "Compute |L(jω_c)| = 1", "PM = 180° + ∠L(jω_c)"], "solution": "At ω=1.4: |L| = 10/(1.4 × √(1+1.96) × √(1+49)) = 10/(1.4×1.72×7.07) ≈ 0.59. Not unity. ω_c is at ~1.0: |L| = 10/(1×1.41×5.1) ≈ 1.39. ω_c ≈ 1.15. ∠L(j1.15) = -90° - atan(1.15) - atan(1.15/5) = -90 - 49 - 13 = -152°. PM = 28°. Marginal — increase gain margin or add lead compensator.", "difficulty": "Hard", "points": 35},
  {"question": "A PID controller has Kp=2, Ki=1, Kd=0.5. Write its transfer function and explain the effect of each term on the closed-loop response.", "hints": ["C(s) = Kp + Ki/s + Kd·s"], "solution": "C(s) = 2 + 1/s + 0.5s = (0.5s² + 2s + 1)/s. P term (Kp=2): speed. I term (Ki=1): eliminates steady-state error. D term (Kd=0.5): damps oscillations, predicts future error.", "difficulty": "Easy", "points": 20}
]
$ASG$::jsonb, 85, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('control-systems', 'midterm-1', 'Midterm 1: System Modeling, Stability, PID', 90, $EXM$
[
  {"question": "Determine stability of a system with characteristic equation s³ + 4s² + 5s + 2 = 0 using Routh-Hurwitz.", "solution": "Routh array: s³: 1, 5; s²: 4, 2; s¹: (20-2)/4 = 4.5, 0; s⁰: 2. All elements in first column are positive: 1, 4, 4.5, 2. System is stable.", "points": 35},
  {"question": "Sketch the Bode magnitude plot of G(s) = 100/(s(s+10)). Find crossover frequency and phase margin.", "solution": "L(s) = 100/(s(s+10)) = 10/(s(0.1s+1)). Magnitude: at low ω, -20 dB/dec; after ω=10, -40 dB/dec. Crossover at ω ≈ 9.5 rad/s. Phase: -90° - atan(0.1ω). At ω=9.5, phase = -90 - 43 = -133°. PM = 47°. Reasonably stable.", "points": 35},
  {"question": "Design a PI controller for plant P(s) = 1/(s+1)(s+2) to eliminate steady-state error and achieve PM > 45°.", "solution": "PI: C(s) = Kp(1 + 1/(Ti·s)). Choose Ti = 1 (integrator zero at s=-1 cancels plant pole at s=-1). Plant becomes 1/(s+2). Choose Kp so crossover is at ω_c = 1: |Kp/s × 1/(s+2)| = 1 at ω=1. Kp = |jω(jω+2)| = √(1)(2.24) = 2.24. PM = 180 - 90 - atan(1/2) = 63°. Good.", "points": 30}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- DSP
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('dsp', 1, 'Problem Set 1: Discrete-Time Signals, Z-Transform, DFT', $ASG$
[
  {"question": "Compute the Z-transform of x[n] = (0.5)^n u[n]. Find poles and ROC.", "hints": ["X(z) = Σ x[n]z^-n"], "solution": "X(z) = Σ (0.5)^n z^-n = 1/(1 - 0.5z^-1) = z/(z-0.5), |z| > 0.5. Pole at z = 0.5. ROC: |z| > 0.5.", "difficulty": "Easy", "points": 20},
  {"question": "Design a 5-tap moving average FIR filter. Find its frequency response and -3dB cutoff.", "hints": ["h[n] = 1/5 for n=0..4", "H(ω) = Σ h[n]e^-jωn"], "solution": "H(ω) = (1/5)(1 + e^-jω + e^-2jω + e^-3jω + e^-4jω). |H(0)| = 1, |H(π)| = 0. Using Dirichlet kernel: |H(ω)| = |sin(5ω/2)/(5sin(ω/2))|. -3dB at ω ≈ 0.72 rad/sample (f ≈ 0.115 fs).", "difficulty": "Medium", "points": 30},
  {"question": "Compute the 4-point DFT of x = [1, 2, 3, 4].", "hints": ["X[k] = Σ x[n]e^-j2πnk/4"], "solution": "X[0] = 1+2+3+4 = 10. X[1] = 1 + 2(-j) + 3(-1) + 4(j) = -2 + 2j. X[2] = 1 - 2 + 3 - 4 = -2. X[3] = 1 + 2(j) + 3(-1) + 4(-j) = -2 - 2j.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('dsp', 'midterm-1', 'Midterm 1: Signals, Z-Transform, DFT', 90, $EXM$
[
  {"question": "Is the system y[n] = x[n] - x[n-1] linear? Causal? Stable?", "solution": "Linear: y = (ax1+bx2)[n] - (ax1+bx2)[n-1] = a(x1[n]-x1[n-1]) + b(x2[n]-x2[n-1]) ✓. Causal ✓. Impulse response h[n] = {1,-1} — finite length, so BIBO stable ✓.", "points": 30},
  {"question": "Design a first-order IIR low-pass filter with cutoff at 0.1·fs. Find the difference equation.", "solution": "Use y[n] = α·x[n] + (1-α)·y[n-1]. For -3dB at f_c: α = 1 - exp(-2π·f_c/fs) ≈ 2π·f_c/fs for f_c << fs. With f_c/fs = 0.1: α ≈ 0.47. y[n] = 0.47x[n] + 0.53y[n-1].", "points": 35},
  {"question": "An 8-point FFT requires how many complex multiplications? Compare with direct DFT.", "solution": "Direct DFT: N² = 64 multiplications. FFT (radix-2): (N/2)·log₂N = 4 × 3 = 12 multiplications. Speedup: 5.3×. For large N, speedup grows as N/log₂N.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- ANALOG ELECTRONICS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('analog-electronics', 1, 'Problem Set 1: MOSFETs, BJTs, Amplifiers', $ASG$
[
  {"question": "A MOSFET has kn' = 100 µA/V², W/L = 20, Vth = 1V, Vgs = 2V, λ = 0. Find Id and gm in saturation.", "hints": ["Id = (1/2)kn'(W/L)(Vgs-Vth)²", "gm = kn'(W/L)(Vgs-Vth)"], "solution": "Vov = Vgs - Vth = 1V. Id = 0.5 × 100e-6 × 20 × 1² = 1 mA. gm = 100e-6 × 20 × 1 = 2 mA/V.", "difficulty": "Easy", "points": 20},
  {"question": "Design a common-source amplifier with gain -20 using a MOSFET with gm = 5 mA/V, ro = 100 kΩ. Choose RD.", "hints": ["Av = -gm(RD || ro)"], "solution": "Want -20 = -5m × (RD || 100k). RD || 100k = 4 kΩ. Solve: RD = 4k × 100k / (100k - 4k) = 4.17 kΩ. Choose RD = 4.3 kΩ standard value.", "difficulty": "Medium", "points": 30},
  {"question": "For a BJT current mirror with Iref = 1 mA, β = 100, and identical transistors, what is Iout? What happens if β drops to 50?", "hints": ["Iout = Iref × 1/(1 + 2/β)"], "solution": "Iout = 1mA × 1/(1+2/100) = 0.98 mA. For β=50: Iout = 1 × 1/(1+2/50) = 0.96 mA. Difference is small — current mirrors are robust to β variation.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('analog-electronics', 'midterm-1', 'Midterm 1: MOSFET, BJT, Amplifiers', 90, $EXM$
[
  {"question": "Explain the difference between triode and saturation regions of a MOSFET. Which is used for amplification?", "solution": "Triode (Vds < Vov): acts like a voltage-controlled resistor, Id depends on both Vgs and Vds. Saturation (Vds > Vov): Id depends mainly on Vgs, channel is pinched off at drain. Saturation is used for amplification because it gives high gain (Id independent of Vds → high ro).", "points": 30},
  {"question": "Design a differential pair with tail current 1 mA and gain 20. Assume gm = 2 mA/V per transistor and ro = 50 kΩ.", "solution": "Differential gain = gm × (ro || RD). Want 20 = 2m × (50k || RD). 50k || RD = 10 kΩ. RD = 12.5 kΩ. Choose 12 kΩ standard.", "points": 35},
  {"question": "For a common-emitter amplifier with Rc = 5 kΩ, gm = 40 mA/V, ro = 100 kΩ, β = 200, find the voltage gain.", "solution": "Av = -gm × (Rc || ro) = -0.04 × (5k || 100k) = -0.04 × 4.76k = -190. Very high gain.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- COMPUTER ARCHITECTURE
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('computer-architecture', 1, 'Problem Set 1: RISC-V, Pipelining, Caches', $ASG$
[
  {"question": "Translate this C to RISC-V assembly: `int sum = 0; for(int i=0;i<n;i++) sum += a[i];`", "hints": ["Use t0=sum, t1=i, a0=&a, a1=n", "slli for index * 4"], "solution": "li t0, 0; li t1, 0; loop: beq t1, a1, done; slli t2, t1, 2; add t3, a0, t2; lw t4, 0(t3); add t0, t0, t4; addi t1, t1, 1; j loop; done: mv a0, t0; ret", "difficulty": "Medium", "points": 30},
  {"question": "A 5-stage pipeline has stage delays 200, 150, 250, 200, 150 ps. What is the maximum clock frequency? Ignore pipeline register overhead.", "hints": ["Clock period = max stage delay"], "solution": "Clock period = 250 ps (slowest stage). Max frequency = 1/250ps = 4 GHz.", "difficulty": "Easy", "points": 20},
  {"question": "A direct-mapped cache has 64 lines of 32 bytes each. Given a 32-bit address, how many bits for tag, index, offset?", "hints": ["Offset bits = log2(line size)", "Index bits = log2(num lines)"], "solution": "Offset = log2(32) = 5 bits. Index = log2(64) = 6 bits. Tag = 32 - 5 - 6 = 21 bits.", "difficulty": "Easy", "points": 20}
]
$ASG$::jsonb, 70, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('computer-architecture', 'midterm-1', 'Midterm 1: ISA, Pipelining, Memory', 90, $EXM$
[
  {"question": "Given a program with 30% branches, 95% prediction accuracy, and a 3-cycle mispredict penalty, what is the average CPI for a single-cycle-execution pipeline?", "solution": "Mispredict rate = 5%. CPI = 1 + 0.3 × 0.05 × 3 = 1 + 0.045 = 1.045.", "points": 30},
  {"question": "Design a 4-way set-associative cache with 64 sets, 32-byte lines. How many sets? Total cache size?", "solution": "Sets = 64. Line size = 32 B. Ways = 4. Total size = 64 × 4 × 32 = 8192 B = 8 KB. Index bits = log2(64) = 6. Offset = 5. Tag = 32 - 6 - 5 = 21.", "points": 35},
  {"question": "Compare a single-cycle, multi-cycle, and pipelined processor for a program with 100 instructions. Assume 5-stage pipeline, 3-cycle memory, other stages 1 cycle.", "solution": "Single-cycle: clock = 8 cycles (slowest instr). Total = 800 cycles. Multi-cycle: 100 × 4 = 400 cycles (avg). Pipelined: 5 + 99 = 104 cycles. Pipelining wins massively.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- OPERATING SYSTEMS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('operating-systems', 1, 'Problem Set 1: Processes, Scheduling, VM', $ASG$
[
  {"question": "Explain what fork() returns to parent and child, and how the OS uses copy-on-write to optimize it.", "hints": ["Parent gets child's PID, child gets 0"], "solution": "Parent: returns child PID (>0). Child: returns 0. On error: returns -1. COW: after fork, all pages marked read-only and shared. On first write by either process, a page fault triggers a copy of that page. Only modified pages are duplicated — saves memory and time.", "difficulty": "Medium", "points": 25},
  {"question": "Trace through SJF scheduling: processes A(8ms), B(4ms), C(2ms), D(1ms), arriving at t=0. Calculate average waiting time.", "hints": ["Sort by burst time: D, C, B, A"], "solution": "Order: D(1), C(2), B(4), A(8). Wait times: D=0, C=1, B=3, A=7. Average = (0+1+3+7)/4 = 2.75 ms.", "difficulty": "Easy", "points": 20},
  {"question": "A 32-bit virtual address uses 4 KB pages and 2-level page table (10-bit each level). How many page table entries per table?", "hints": ["2^10 = 1024 entries per table"], "solution": "Each level has 2^10 = 1024 entries. Offset = log2(4096) = 12 bits. VPN = 32 - 12 = 20 bits, split into 10+10. Each PTE = 4 bytes, so each table = 4 KB (fits exactly in one page).", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 70, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('operating-systems', 'midterm-1', 'Midterm 1: Processes, Scheduling, Memory', 90, $EXM$
[
  {"question": "Compare round-robin (quantum=4ms) vs FCFS for processes A(8ms), B(2ms), C(6ms) all arriving at t=0. Which has lower average waiting time?", "solution": "FCFS: A waits 0, B waits 8, C waits 10. Avg = 6 ms. RR(q=4): A runs 0-4, B 4-6, C 6-10, A 10-14, C 14-16. Wait times: A=6, B=4, C=10. Avg = 6.67 ms. FCFS wins here but has worse worst-case.", "points": 35},
  {"question": "A system has 3 frames and the reference string 1,2,3,4,1,2,5,1,2,3,4,5. How many page faults with LRU vs FIFO?", "solution": "LRU: 10 page faults. FIFO: 15 page faults. Belady's anomaly: for some reference strings, adding frames can increase faults in FIFO, but not LRU.", "points": 35},
  {"question": "Explain how two threads both executing 'counter++' can lose an update, and how to fix it with a mutex.", "solution": "counter++ decomposes to load, add, store. If T1 loads 0, T2 loads 0, both compute 1, both store 1 → counter = 1 instead of 2. Fix: lock mutex before incrementing, unlock after. Ensures load-add-store is atomic.", "points": 30}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- COMPILERS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('compilers', 1, 'Problem Set 1: Lexing, Parsing, Type Checking', $ASG$
[
  {"question": "Write a regular expression for an identifier that starts with a letter and contains letters, digits, and underscores.", "solution": "[a-zA-Z_][a-zA-Z0-9_]*", "difficulty": "Easy", "points": 15},
  {"question": "Given the grammar E → E+T | T, T → T*F | F, F → id, parse 'a+b*c'. Show the parse tree.", "hints": ["* binds tighter than +", "Left associative"], "solution": "E → E+T → T+T → F+T → a+T → a+T*F → a+F*F → a+b*F → a+b*c. Parse tree: + at root, a on left, * on right; * has b and c as children.", "difficulty": "Medium", "points": 30},
  {"question": "Explain how type inference works for `let f = |x| x + 1` in a Hindley-Milner system.", "solution": "x is used with +, so x must be numeric (Int or Float). + is Int → Int → Int in default. So x : Int, and f : Int → Int. Unification algorithm: assign fresh type vars, unify constraints as you traverse the AST.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 70, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('compilers', 'midterm-1', 'Midterm 1: Lex, Parse, Types, Optimization', 90, $EXM$
[
  {"question": "Explain why the grammar S → if E then S | if E then S else S is ambiguous. Rewrite to fix.", "solution": "String 'if a then if b then c else d' — does else bind to inner or outer if? Ambiguous. Standard fix: S → M | U, M → if E then M else M | other, U → if E then S | if E then M else U. Forces else to bind to nearest unmatched if.", "points": 35},
  {"question": "Apply constant folding and dead code elimination to: x = 3 + 4; y = x * 2; return z;", "solution": "Constant folding: x = 7. Then y = 14. Dead code: x and y never used. Remove both lines. Result: return z;", "points": 30},
  {"question": "Sketch the pipeline for compiling 'a = b + c * d' through lexing, parsing, IR, optimization, and codegen.", "solution": "Lex: [id a] [=] [id b] [+] [id c] [*] [id d]. Parse: Assign(a, Add(b, Mul(c, d))). IR: t1 = c*d; t2 = b+t1; a = t2. Optimize: possible CSE if reused. Codegen (x86-64): imul rcx, rdx; add rbx, rcx; mov [a], rbx.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- DIGITAL DESIGN
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('digital-design', 1, 'Problem Set 1: Boolean Logic, FFs, FSMs', $ASG$
[
  {"question": "Simplify F(A,B,C) = Σ(0,1,2,3,4,5,6,7) using a K-map.", "solution": "All cells are 1. So F = 1 (constant 1). Trivial but valid — a common case for ground/power pins.", "difficulty": "Easy", "points": 15},
  {"question": "Design a D flip-flop-based 4-bit synchronous counter (mod-16). Sketch the logic.", "hints": ["Use T or D FFs with XOR-based next-state"], "solution": "Use 4 D FFs. Next D0 = ¬Q0. Next D1 = Q1 XOR Q0. Next D2 = Q2 XOR (Q0 AND Q1). Next D3 = Q3 XOR (Q0 AND Q1 AND Q2). This is a standard binary ripple-through counter.", "difficulty": "Medium", "points": 35},
  {"question": "What is metastability? How is it mitigated in a 2-FF synchronizer?", "solution": "Metastability: FF's output is undefined when its input changes near the clock edge. If a downstream FF samples it, unpredictable values propagate. Fix: 2 (or 3) FFs in series. First FF may go metastable; by the time it settles, the second FF samples it cleanly. MTBF depends on clock frequency and settling time.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('digital-design', 'midterm-1', 'Midterm 1: Logic, FFs, Pipelining', 90, $EXM$
[
  {"question": "Design a 2-bit comparator with outputs LT, EQ, GT. Write the boolean equations.", "solution": "For bits A1A0 and B1B0: EQ = (A1 XNOR B1) AND (A0 XNOR B0). GT = (A1 AND ¬B1) OR (A1 XNOR B1 AND A0 AND ¬B0). LT = ¬GT AND ¬EQ.", "points": 35},
  {"question": "A pipeline has 5 stages. Compute the throughput and latency for 1000 instructions.", "solution": "Throughput: 1 instruction per cycle at steady state → 1000 cycles total (5-cycle latency filled by 1000 instructions). Latency: 5 cycles per instruction. Total time = 5 + 999 = 1004 cycles ≈ 1000 cycles. Speedup vs non-pipelined (5000 cycles) = 5x.", "points": 30},
  {"question": "Explain the difference between a Moore and Mealy FSM. Which is faster? Which has fewer states?", "solution": "Moore: output depends only on current state. Mealy: output depends on state AND inputs. Mealy reacts faster (output changes with input, no clock wait). Mealy often has fewer states. Moore is safer (glitch-free outputs on state change).", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- REAL-TIME SYSTEMS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('real-time-systems', 1, 'Problem Set 1: RMS, EDF, FreeRTOS', $ASG$
[
  {"question": "Three periodic tasks: T1(C=1,T=4), T2(C=2,T=6), T3(C=2,T=12). Check schedulability with RMS.", "hints": ["U = Σ C/T", "RMS bound = n(2^(1/n)-1)"], "solution": "U = 1/4 + 2/6 + 2/12 = 0.25 + 0.333 + 0.167 = 0.75. RMS bound for n=3: 3×(2^(1/3)-1) = 0.780. U=0.75 < 0.780 → schedulable with RMS.", "difficulty": "Medium", "points": 30},
  {"question": "Explain priority inversion and how priority inheritance solves it.", "solution": "Priority inversion: high-priority task H waits on a lock held by low-priority L. Medium-priority M preempts L, blocking H indefinitely. Priority inheritance: when H blocks on L's lock, L is temporarily boosted to H's priority. M can no longer preempt L, so L finishes quickly and releases the lock.", "difficulty": "Medium", "points": 25},
  {"question": "In FreeRTOS, explain the difference between vTaskDelay and vTaskDelayUntil. Which is used for periodic tasks?", "solution": "vTaskDelay(n): delays n ticks from now. If loop body takes time T, period = T + n (drifts). vTaskDelayUntil(&last, period): delays until last+period. Period stays constant regardless of body execution time. Use vTaskDelayUntil for periodic control loops.", "difficulty": "Easy", "points": 20}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('real-time-systems', 'midterm-1', 'Midterm 1: Scheduling, WCET, RTOS', 90, $EXM$
[
  {"question": "Response time analysis for T3(C=2,T=10,D=10) with higher-priority tasks T1(C=1,T=4) and T2(C=2,T=6).", "solution": "R_3 = C_3 + Σ ceil(R_3/T_i) × C_i for i=1,2. Start R=2. R=2+ceil(2/4)×1+ceil(2/6)×2 = 2+1+2 = 5. R=2+ceil(5/4)×1+ceil(5/6)×2 = 2+2+2 = 6. R=2+ceil(6/4)×1+ceil(6/6)×2 = 2+2+2 = 6. Converged: R_3 = 6 ≤ D_3 = 10. Schedulable.", "points": 35},
  {"question": "Design a watchdog-based recovery for a system that must respond within 100 ms. Choose timeout and explain.", "solution": "Watchdog timeout should be < 100 ms to detect hangs before deadline. Choose 50 ms. If task misses feeding watchdog within 50 ms, CPU resets. Log reset reason to diagnose. Add independent hardware watchdog (external chip) for maximum reliability.", "points": 30},
  {"question": "Explain how CAN bus achieves deterministic communication despite being a shared medium.", "solution": "CAN uses non-destructive bit-wise arbitration: each message has an ID; when two nodes transmit, lower ID wins. Loser retries without data loss. Priority = message ID. This ensures highest-priority message always wins without collision. Combined with bounded frame size and CRC, CAN is deterministic.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- MICROCONTROLLERS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('microcontrollers', 1, 'Problem Set 1: GPIO, Interrupts, Communication', $ASG$
[
  {"question": "Write C code to blink an LED on GPIO 5 every 500 ms using non-blocking millis().", "hints": ["Store last time", "Check millis() - last >= 500"], "solution": "unsigned long last = 0; void loop() { if (millis() - last >= 500) { last = millis(); digitalWrite(5, !digitalRead(5)); } }", "difficulty": "Easy", "points": 20},
  {"question": "Design an I2C temperature sensor interface. Why are pull-up resistors needed, and what value?", "solution": "I2C lines are open-drain: the bus can only be pulled LOW. Pull-ups (2.2kΩ-10kΩ) restore HIGH when no device is pulling. Lower values → faster rise, more current. Higher values → slower rise, less current. Use 4.7kΩ for 100 kHz, 2.2kΩ for 400 kHz with typical bus capacitance.", "difficulty": "Medium", "points": 25},
  {"question": "Write pseudocode to read an HC-SR04 ultrasonic sensor and convert the echo time to distance.", "hints": ["Trigger 10 µs high pulse", "Measure echo pulse width", "distance = time × 0.034 / 2"], "solution": "digitalWrite(TRIG, LOW); delayMicroseconds(2); digitalWrite(TRIG, HIGH); delayMicroseconds(10); digitalWrite(TRIG, LOW); duration = pulseIn(ECHO, HIGH); distance_cm = duration × 0.034 / 2;", "difficulty": "Easy", "points": 20}
]
$ASG$::jsonb, 65, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('microcontrollers', 'midterm-1', 'Midterm 1: Architecture, Peripherals, Protocols', 90, $EXM$
[
  {"question": "Choose between UART, I2C, SPI, and CAN for: (a) SD card, (b) temperature sensor, (c) automotive ECU, (d) USB-serial debug. Justify.", "solution": "(a) SD card: SPI (fast, 25 MHz, simple). (b) Temperature sensor: I2C (2 wires, multiple devices). (c) Automotive ECU: CAN (differential, robust, priority). (d) USB-serial: UART (direct PC communication).", "points": 30},
  {"question": "Explain how an ISR and the main loop should cooperate to handle a button press without losing events.", "solution": "ISR: sets a volatile flag or pushes event into a queue. ISR must be short — no heavy processing. Main loop polls flag/queue and does the real work. Use volatile for shared variables, and a mutex or critical section if data is complex. Alternatively use FreeRTOS notification.", "points": 35},
  {"question": "A 12-bit ADC with Vref = 3.3V reads 2048. What is the input voltage? What is the resolution in mV/LSB?", "solution": "Resolution = 3.3 / 4096 = 0.806 mV/LSB. Reading 2048 → V = 2048 × 0.806mV = 1.65 V (mid-scale).", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- DESIGNING INFORMATION DEVICES
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('designing-information', 1, 'Problem Set 1: Linear Systems, Nodal Analysis', $ASG$
[
  {"question": "Use superposition to find V_out in a circuit with a 5V source through R1=1kΩ to node A, a 2mA current source into node A, and R2=2kΩ from node A to ground.", "solution": "Source 1 (5V, kill current): V_A1 = 5 × 2k/(1k+2k) = 3.33V. Source 2 (2mA, kill 5V): V_A2 = 2mA × (1k || 2k) = 2mA × 667Ω = 1.33V. V_A = 3.33 + 1.33 = 4.67V.", "difficulty": "Medium", "points": 30},
  {"question": "Find the Thevenin equivalent of a circuit with a 12V source, R1=4kΩ in series, R2=6kΩ to ground, and load R_L at the R1-R2 junction.", "solution": "V_th = 12 × 6/(4+6) = 7.2V. R_th = 4k || 6k = 2.4kΩ. Thevenin = 7.2V source + 2.4kΩ series resistor.", "difficulty": "Easy", "points": 20},
  {"question": "Design a voltage divider to produce 1.8V from 3.3V with current draw under 100 µA.", "solution": "R_total ≥ 3.3V/100µA = 33kΩ. V_out/V_in = R2/(R1+R2) = 1.8/3.3 = 0.545. Choose R1 = 15kΩ, R2 = 18kΩ. Total = 33kΩ. Check: 3.3 × 18/33 = 1.8V ✓. Current = 100 µA ✓.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('designing-information', 'midterm-1', 'Midterm 1: Linear Systems, Thevenin, Transients', 90, $EXM$
[
  {"question": "Design an RC low-pass filter with cutoff at 1 kHz. Choose R and C. What is the attenuation at 10 kHz?", "solution": "f_c = 1/(2πRC). Choose C = 100 nF. R = 1/(2π × 1000 × 100e-9) = 1.59 kΩ. At 10 kHz, |H| = 1/√(1+(10)²) = 0.0995 → -20 dB. 20 dB/decade roll-off.", "points": 30},
  {"question": "Find the impulse response of an LTI system described by y[n] = 0.5y[n-1] + x[n].", "solution": "h[0] = 1. h[1] = 0.5. h[2] = 0.25. General: h[n] = (0.5)^n u[n]. This is an IIR low-pass filter.", "points": 35},
  {"question": "A signal x(t) = 3cos(2π1000t) + 2cos(2π3000t) is sampled at 8 kHz. What frequencies appear in the spectrum?", "solution": "Sampling at 8 kHz → Nyquist = 4 kHz. Both frequencies are below 4 kHz → no aliasing. Spectrum: peaks at 1 kHz (amp 3) and 3 kHz (amp 2). If sampling at 5 kHz → 3 kHz would alias to 2 kHz.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- DEEP LEARNING
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('deep-learning', 1, 'Problem Set 1: CNNs, Training, Backprop', $ASG$
[
  {"question": "A conv layer has input 32×32×3, 64 filters of size 3×3, stride 1, no padding. What is the output size and parameter count?", "hints": ["Output H = (H - K + 2P)/S + 1", "Params per filter = K×K×Cin + 1 (bias)"], "solution": "Output: (32 - 3 + 0)/1 + 1 = 30, so 30×30×64. Params per filter: 3×3×3 + 1 = 28. Total: 64 × 28 = 1792.", "difficulty": "Medium", "points": 25},
  {"question": "Compute the output of a 2×2 max-pool on the matrix [[1,3,2,4],[5,6,7,8],[9,1,2,3],[4,5,6,7]] with stride 2.", "solution": "Top-left 2×2: max(1,3,5,6)=6. Top-right: max(2,4,7,8)=8. Bottom-left: max(9,1,4,5)=9. Bottom-right: max(2,3,6,7)=7. Output: [[6,8],[9,7]].", "difficulty": "Easy", "points": 20},
  {"question": "Explain why batch normalization helps training and where the learned parameters γ and β come in.", "solution": "BatchNorm normalizes activations to zero mean and unit variance per mini-batch, then scales by γ and shifts by β (both learned). This stabilizes activations, allows higher LR, reduces sensitivity to init, and acts as mild regularization. γ/β let the network undo normalization if needed.", "difficulty": "Medium", "points": 30}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('deep-learning', 'midterm-1', 'Midterm 1: CNNs, Training, Detection', 90, $EXM$
[
  {"question": "Compute gradients for a 2-layer network: h = ReLU(W1 x), y = softmax(W2 h), loss = -log(y_true). Show dL/dW2 and dL/dW1.", "solution": "dL/dz2 = y - y_true (softmax + CE gradient). dL/dW2 = (y - y_true) h^T. dL/dh = W2^T (y - y_true). dL/dz1 = dL/dh ⊙ (z1 > 0). dL/dW1 = dL/dz1 × x^T.", "points": 35},
  {"question": "Explain the difference between semantic, instance, and panoptic segmentation. Give a use case for each.", "solution": "Semantic: each pixel classified by class (road, car, person) — no distinction between instances. Used in scene understanding. Instance: each object instance separate (car 1, car 2). Used in counting, robotics. Panoptic: combines both — every pixel labeled with class + instance. Used in autonomous driving.", "points": 30},
  {"question": "A YOLO model outputs 3 boxes at a location: [(0.1, 0.4), (0.2, 0.3), (0.15, 0.35)] with confidences (0.9, 0.8, 0.7). Apply NMS with IoU threshold 0.5.", "solution": "Sort by confidence: (0.1,0.4)@0.9, (0.2,0.3)@0.8, (0.15,0.35)@0.7. Box 1 kept. Compute IoU with box 2: high overlap → suppress. IoU with box 3: high overlap → suppress. Final: only box 1 remains.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- NLP
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('nlp', 1, 'Problem Set 1: Word Embeddings, Attention', $ASG$
[
  {"question": "Given embeddings king = [0.2, 0.5], man = [0.1, 0.3], woman = [0.4, 0.6], compute the nearest word to 'king - man + woman'.", "solution": "king - man + woman = [0.2-0.1+0.4, 0.5-0.3+0.6] = [0.5, 0.8]. Compare to queen = [0.5, 0.7]. Close! Nearest word in vocab is likely queen.", "difficulty": "Easy", "points": 20},
  {"question": "Compute self-attention for tokens x1 = [1, 0], x2 = [0, 1], with W_Q = W_K = W_V = I (identity).", "solution": "Q = X, K = X, V = X. Scores: QK^T = [[1, 0], [0, 1]]. Scaled by 1/√2: [[0.707, 0], [0, 0.707]]. Softmax row 1: [0.67, 0.33]. Row 2: [0.33, 0.67]. Output row 1: 0.67×[1,0] + 0.33×[0,1] = [0.67, 0.33]. Row 2: [0.33, 0.67].", "difficulty": "Medium", "points": 30},
  {"question": "Explain why transformer attention is O(n²) in sequence length and how recent models address this.", "solution": "Attention matrix is n×n (every token attends to every other). n=10k → 100M entries. Solutions: (1) Sparse attention (Longformer, BigBird), (2) Linear attention (Performer), (3) Recurrent memory (Transformer-XL), (4) State-space models (Mamba, S4), (5) Flash attention — same complexity but IO-efficient.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('nlp', 'midterm-1', 'Midterm 1: Embeddings, RNNs, Transformers', 90, $EXM$
[
  {"question": "Compute the output of a 2-unit RNN at time t=2, given x1=[1,0], x2=[0,1], h0=[0,0], W_hh = [[0.5, 0], [0, 0.5]], W_xh = I, b_h = 0, tanh activation.", "solution": "t=1: h1 = tanh(W_hh h0 + W_xh x1) = tanh([1, 0]) = [0.762, 0]. t=2: h2 = tanh(W_hh h1 + W_xh x2) = tanh([0.381+0, 0+1]) = tanh([0.381, 1]) = [0.363, 0.762].", "points": 35},
  {"question": "Explain why BERT is bidirectional but GPT is not. How does this affect their use cases?", "solution": "BERT: MLM objective — some tokens masked, model sees context on both sides. Bidirectional. Good for understanding (classification, QA, NER). GPT: causal LM — each token only sees earlier tokens. Unidirectional. Good for generation (text completion, dialogue). Bidirectional is stronger for encoding; unidirectional matches generation's autoregressive nature.", "points": 35},
  {"question": "A language model assigns probability 0.01 to each of the 100 tokens in a sentence. What is the perplexity?", "solution": "PPL = exp(-(1/N) Σ log P(w_i)) = exp(-log(0.01)) = exp(4.605) = 100. Perplexity = 100 means the model is as uncertain as choosing uniformly among 100 options.", "points": 30}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- ROBOTICS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('robotics', 1, 'Problem Set 1: Kinematics, Jacobian, Dynamics', $ASG$
[
  {"question": "For a 2-link planar arm with L1 = L2 = 1, θ1 = 30°, θ2 = 60°, compute the end-effector position.", "hints": ["x = L1 cos(θ1) + L2 cos(θ1+θ2)", "y = L1 sin(θ1) + L2 sin(θ1+θ2)"], "solution": "x = 1×cos(30°) + 1×cos(90°) = 0.866 + 0 = 0.866. y = sin(30°) + sin(90°) = 0.5 + 1 = 1.5. Position: (0.866, 1.5).", "difficulty": "Easy", "points": 20},
  {"question": "Compute the Jacobian of the 2-link arm at θ1 = θ2 = 0.", "hints": ["J = [[-L1 sin θ1 - L2 sin(θ1+θ2), -L2 sin(θ1+θ2)], [L1 cos θ1 + L2 cos(θ1+θ2), L2 cos(θ1+θ2)]]"], "solution": "At θ1=θ2=0: J = [[0, 0], [L1+L2, L2]] = [[0, 0], [2, 1]]. Rank = 1 (not 2) → singularity! Arm fully extended.", "difficulty": "Medium", "points": 30},
  {"question": "A mobile robot has a differential drive with wheel radius r = 0.1 m, wheelbase L = 0.5 m. If left wheel speed = 1 m/s and right = 1.5 m/s, find linear and angular velocity of the robot.", "hints": ["v = (v_L + v_R)/2", "ω = (v_R - v_L)/L"], "solution": "v = (1 + 1.5)/2 = 1.25 m/s. ω = (1.5 - 1)/0.5 = 1 rad/s. Turning left.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('robotics', 'midterm-1', 'Midterm 1: Kinematics, Dynamics, Control', 90, $EXM$
[
  {"question": "For a 2-link arm with masses m1=m2=1kg, lengths L1=L2=1m, in horizontal plane (no gravity), compute the mass matrix at θ = (0, 0).", "solution": "M11 = m1 L1²/3 + m2 (L1² + L1 L2 cos θ2 + L2²/3) = 0.333 + (1 + 1 + 0.333) = 2.667. M12 = m2 (L2²/3 + L1 L2 cos θ2 / 2) = 0.333 + 0.5 = 0.833. M22 = m2 L2²/3 = 0.333. M = [[2.667, 0.833], [0.833, 0.333]].", "points": 35},
  {"question": "Design a PD controller for a joint with inertia J = 0.1 kg·m², target natural frequency ω_n = 10 rad/s, damping ratio ζ = 0.7. Compute Kp and Kd.", "solution": "For J·θ'' + Kd·θ' + Kp·θ = 0: ω_n = √(Kp/J) = 10 → Kp = 100 × 0.1 = 10. 2ζω_n = Kd/J → Kd = 2 × 0.7 × 10 × 0.1 = 1.4.", "points": 35},
  {"question": "Explain the difference between computed torque control and PD control. When is each appropriate?", "solution": "PD: τ = Kp e + Kd ė. Simple, doesn't use dynamics. Works for stiff robots, slow motions. Computed torque: τ = M(q)(q̈_d + Kd ė + Kp e) + C q̇ + g. Uses full dynamics — cancels nonlinearities. Better for fast, accurate motions or light robots. Requires accurate dynamic model.", "points": 30}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- MECHANICS OF MATERIALS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('mechanics-materials', 1, 'Problem Set 1: Stress, Strain, Bending', $ASG$
[
  {"question": "A steel rod 2m long with cross-section 100 mm² carries 20 kN. If E = 200 GPa, find stress and elongation.", "hints": ["σ = F/A", "δ = FL/(AE)"], "solution": "σ = 20000/100e-6 = 200 MPa. δ = 20000 × 2 / (100e-6 × 200e9) = 40000 / (2e7) = 2 mm.", "difficulty": "Easy", "points": 20},
  {"question": "A simply supported beam of length 4 m carries a 10 kN point load at midspan. Max moment? Max deflection? (E = 200 GPa, I = 50×10⁶ mm⁴)", "hints": ["M_max = PL/4", "δ_max = PL³/(48EI)"], "solution": "M_max = 10,000 × 4 / 4 = 10 kN·m. δ = 10,000 × 4³ / (48 × 200e9 × 50e-6) = 640,000 / (480e6) = 1.33 mm.", "difficulty": "Medium", "points": 30},
  {"question": "A solid shaft of diameter 50 mm transmits 100 kW at 1500 rpm. Find the maximum shear stress.", "hints": ["P = Tω", "ω = 2πN/60", "τ = 16T/(πd³)"], "solution": "ω = 2π × 1500/60 = 157 rad/s. T = 100000/157 = 637 N·m. τ = 16 × 637 / (π × 0.05³) = 10192 / 0.0003927 = 25.9 MPa.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 75, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('mechanics-materials', 'midterm-1', 'Midterm 1: Stress, Bending, Torsion, Buckling', 90, $EXM$
[
  {"question": "For a cantilever beam 3 m long with distributed load w = 5 kN/m, find the maximum bending moment and deflection (E = 200 GPa, I = 100×10⁶ mm⁴).", "solution": "M_max = wL²/2 = 5000 × 9 / 2 = 22.5 kN·m. δ = wL⁴/(8EI) = 5000 × 81 / (8 × 200e9 × 100e-6) = 405,000 / (160e6) = 2.53 mm.", "points": 35},
  {"question": "A hollow shaft has outer diameter 100 mm, inner 70 mm. What is the polar moment of inertia?", "solution": "J = π(d_o⁴ - d_i⁴)/32 = π(0.1⁴ - 0.07⁴)/32 = π(0.0001 - 0.00002401)/32 = π × 0.00007599/32 = 7.46e-6 m⁴.", "points": 30},
  {"question": "A 3 m steel column is pinned at both ends with square cross-section 50×50 mm. Find the buckling load (E = 200 GPa).", "solution": "I = b⁴/12 = 0.05⁴/12 = 5.2e-7 m⁴. P_cr = π²EI/L² = π² × 200e9 × 5.2e-7 / 3² = 1.03e6/9 = 114 kN. Now check: σ_cr = P_cr/A = 114000/0.0025 = 45.6 MPa < yield (250 MPa) → buckling governs.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- THERMODYNAMICS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('thermodynamics', 1, 'Problem Set 1: First Law, Second Law, Cycles', $ASG$
[
  {"question": "1 kg of air is heated at constant volume from 300K to 500K. Find the heat added (Cv = 0.718 kJ/kg·K).", "hints": ["Q = m·Cv·ΔT"], "solution": "Q = 1 × 0.718 × 200 = 143.6 kJ.", "difficulty": "Easy", "points": 20},
  {"question": "A Carnot engine operates between 500°C and 30°C. What is its maximum efficiency?", "hints": ["η = 1 - T_C/T_H (in Kelvin)"], "solution": "T_H = 773K, T_C = 303K. η = 1 - 303/773 = 0.608 = 60.8%.", "difficulty": "Easy", "points": 20},
  {"question": "An ideal gas expands isothermally at 400K from 1L to 5L. Find the work done on 1 mole of gas.", "hints": ["W = nRT ln(V2/V1)"], "solution": "W = 1 × 8.314 × 400 × ln(5) = 3325.6 × 1.609 = 5353 J ≈ 5.35 kJ.", "difficulty": "Medium", "points": 25}
]
$ASG$::jsonb, 65, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('thermodynamics', 'midterm-1', 'Midterm 1: First Law, Cycles, Entropy', 90, $EXM$
[
  {"question": "A steam power plant operates between 600°C and 40°C with efficiency 40%. Compare to Carnot efficiency.", "solution": "Carnot: η_C = 1 - (313/873) = 0.641 = 64.1%. Actual: 40%. Ratio = 40/64.1 = 0.624. A typical real power plant achieves ~60% of Carnot.", "points": 30},
  {"question": "Calculate entropy change when 1 kg of water at 20°C is heated to 80°C (Cp = 4.18 kJ/kg·K).", "solution": "ΔS = m·Cp·ln(T2/T1) = 1 × 4.18 × ln(353/293) = 4.18 × 0.186 = 0.778 kJ/K.", "points": 35},
  {"question": "A refrigerator maintains 4°C in a 25°C room with COP = 3. How much work does it consume to remove 1 kJ of heat from the cold space?", "solution": "COP = Q_C / W. W = Q_C / COP = 1/3 = 0.333 kJ = 333 J.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- FLUID MECHANICS
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('fluid-mechanics', 1, 'Problem Set 1: Hydrostatics, Bernoulli, Pipe Flow', $ASG$
[
  {"question": "Find the pressure at 20 m depth in water (ρ = 1000 kg/m³, g = 9.81 m/s²).", "solution": "P = ρgh = 1000 × 9.81 × 20 = 196,200 Pa ≈ 196 kPa (gauge). Plus atmospheric = 296 kPa absolute.", "difficulty": "Easy", "points": 20},
  {"question": "Water flows through a pipe that narrows from 100 mm to 50 mm diameter. If velocity in the wide section is 1 m/s, find the velocity in the narrow section.", "hints": ["A1V1 = A2V2"], "solution": "A1/A2 = (100/50)² = 4. So V2 = 4 × V1 = 4 m/s.", "difficulty": "Easy", "points": 20},
  {"question": "Water flows at 2 m/s through a 50 mm pipe that is 100 m long. If f = 0.02, find the head loss.", "hints": ["h_L = f(L/D)(V²/2g)"], "solution": "h_L = 0.02 × (100/0.05) × (4/19.62) = 0.02 × 2000 × 0.204 = 8.16 m.", "difficulty": "Medium", "points": 30}
]
$ASG$::jsonb, 70, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('fluid-mechanics', 'midterm-1', 'Midterm 1: Hydrostatics, Bernoulli, Viscous Flow', 90, $EXM$
[
  {"question": "A Pitot tube measures a pressure difference of 500 Pa in air (ρ = 1.2 kg/m³). What is the airspeed?", "solution": "V = √(2ΔP/ρ) = √(2 × 500 / 1.2) = √833 = 28.9 m/s.", "points": 30},
  {"question": "A sphere of radius 5 cm is dropped in oil (ρ=900 kg/m³, μ=0.5 Pa·s). Find the terminal velocity if sphere density is 2500 kg/m³.", "solution": "At terminal velocity: F_buoy + F_drag = Weight. Stokes: F_drag = 6πμrv. Weight = (4/3)πr³ρ_s g. F_buoy = (4/3)πr³ρ_f g. So 6πμrv = (4/3)πr³g(ρ_s - ρ_f). v = 2r²g(ρ_s - ρ_f)/(9μ) = 2×0.0025×9.81×1600/(9×0.5) = 78.5/4.5 = 17.4 m/s.", "points": 35},
  {"question": "A pump lifts water 20 m through a pipe. Find the minimum power required to move 10 L/s.", "solution": "P = ρgQh = 1000 × 9.81 × 0.01 × 20 = 1962 W ≈ 2 kW. Add pump efficiency: if 70%, actual = 2.8 kW.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- HEAT TRANSFER
-- ============================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week) values
('heat-transfer', 1, 'Problem Set 1: Conduction, Convection, Radiation', $ASG$
[
  {"question": "A wall 0.2 m thick with k = 0.8 W/m·K has inner surface at 25°C and outer at 5°C. Find heat flux.", "solution": "q/A = kΔT/L = 0.8 × 20 / 0.2 = 80 W/m².", "difficulty": "Easy", "points": 20},
  {"question": "A surface at 100°C loses heat by natural convection to air at 20°C (h = 10 W/m²·K) and radiation (ε = 0.9). Find total heat flux.", "solution": "q_conv = 10 × 80 = 800 W/m². q_rad = 0.9 × 5.67e-8 × (373⁴ - 293⁴) = 0.9 × 5.67e-8 × (1.936e10 - 7.37e9) = 0.9 × 5.67e-8 × 1.199e10 = 612 W/m². Total = 1412 W/m².", "difficulty": "Medium", "points": 30},
  {"question": "A fin has efficiency 0.7 and area 0.01 m². Base is at 80°C, ambient 25°C, h = 20 W/m²·K. Find heat transfer from the fin.", "hints": ["q_fin = η × h × A × (T_b - T_∞)"], "solution": "q = 0.7 × 20 × 0.01 × 55 = 7.7 W.", "difficulty": "Easy", "points": 20}
]
$ASG$::jsonb, 70, 1)
on conflict (course_slug, number) do update set
  title = excluded.title, problems = excluded.problems,
  total_points = excluded.total_points, due_week = excluded.due_week;

insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points) values
('heat-transfer', 'midterm-1', 'Midterm 1: Conduction, Convection, Radiation, HX', 90, $EXM$
[
  {"question": "A composite wall has two layers: 5 cm of brick (k=0.7) and 10 cm of insulation (k=0.04). Total ΔT = 30°C over 1 m². Find the heat rate.", "solution": "R_brick = 0.05/0.7 = 0.0714 K/W. R_insul = 0.1/0.04 = 2.5 K/W. R_total = 2.571 K/W. q = 30/2.571 = 11.7 W.", "points": 35},
  {"question": "A CPU dissipates 65 W. Heatsink has R_sa = 0.3 K/W, paste R_cs = 0.1 K/W. Ambient 25°C. Find the CPU case temperature.", "solution": "T_case = 25 + 65 × (0.3 + 0.1) = 25 + 26 = 51°C.", "points": 30},
  {"question": "A counterflow heat exchanger has U = 500 W/m²·K, A = 2 m². Hot fluid: 90°C in, 60°C out. Cold: 20°C in, 40°C out. Find heat duty.", "solution": "ΔT1 = 90-40 = 50. ΔT2 = 60-20 = 40. LMTD = (50-40)/ln(50/40) = 10/0.223 = 44.8°C. Q = 500 × 2 × 44.8 = 44,800 W = 44.8 kW.", "points": 35}
]
$EXM$::jsonb, 100)
on conflict (course_slug, type) do update set
  title = excluded.title, duration_minutes = excluded.duration_minutes,
  problems = excluded.problems, total_points = excluded.total_points;

-- ============================================================
-- FINAL VERIFICATION
-- ============================================================
select
  c.code,
  c.title,
  count(distinct a.id) as assignments,
  count(distinct e.id) as exams
from public.courses c
left join public.assignments a on a.course_slug = c.slug
left join public.exams e on e.course_slug = c.slug
group by c.id, c.code, c.title
order by c.code;