-- ============================================================
-- Batch 2: Analog Electronics (Berkeley EE105) + Control Systems (Caltech CDS 101)
-- Safe to re-run: ON CONFLICT DO UPDATE
-- ============================================================

-- ============================================================
-- ANALOG ELECTRONICS (Berkeley EE105) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('analog-electronics', 1, 'Semiconductor Physics and the PN Junction', $LEC$
## From Silicon to Transistor

Silicon is a semiconductor: at absolute zero it is an insulator, at high temperature it conducts. Its four valence electrons form covalent bonds in a crystal lattice. Doping introduces impurities:

- **N-type:** add phosphorus (5 valence electrons) — extra free electrons
- **P-type:** add boron (3 valence electrons) — holes (missing electrons)

When N-type and P-type silicon touch, electrons diffuse across the junction, leaving behind charged ions. The resulting **depletion region** has a built-in electric field that opposes further diffusion.

## The Diode

A PN junction is a diode. Forward bias (P side +, N side -): the field is reduced, current flows. Reverse bias: the field grows, only leakage current flows.

The Shockley equation:

    I = Is × (e^(V/Vt) - 1)

where Is is the saturation current (10^-12 to 10^-15 A) and Vt = kT/q ≈ 26 mV at room temperature.

At 0.7 V forward, the exponential is enormous: e^(0.7/0.026) ≈ 10^12. This is why diodes "turn on" at ~0.7 V and act as a nearly-constant voltage drop.

## Real Diode Behavior

- Forward drop: 0.6-0.7 V (silicon), 0.2-0.3 V (Schottky), 1.8-3.4 V (LED)
- Reverse breakdown: 5-1000 V depending on design (Zener)
- Capacitance: junctions have parasitic capacitance, which limits high-frequency performance

## Applications

**Rectifier:** convert AC to DC. A bridge rectifier uses 4 diodes.

**Voltage reference:** a Zener diode in reverse breakdown holds a stable voltage.

**Protection:** a diode across a relay coil absorbs the inductive kick.

**Clamp:** a diode limits a signal to a maximum voltage.

## Small-Signal Model

For AC analysis, we linearize the diode around its DC operating point. The small-signal resistance is:

    rd = Vt / Id

At Id = 1 mA, rd = 26 ohms. At Id = 10 mA, rd = 2.6 ohms.

This lets us treat the diode as a linear resistor for small AC signals — the key trick for analyzing amplifiers.

## MOSFET Preview

A MOSFET is like a voltage-controlled resistor. The gate is separated from the channel by a thin oxide (insulator). Applying Vgs > Vth creates an inversion layer that conducts between source and drain.

Two modes:
- **Triode:** Vds < Vgs - Vth, acts like a resistor
- **Saturation:** Vds > Vgs - Vth, acts like a current source

The saturation current:

    Id = (1/2) × kn × (W/L) × (Vgs - Vth)²

This is the foundation of all analog and digital IC design.

## Key Takeaways

- Semiconductors are insulators until doped
- A PN junction is a diode with 0.7 V forward drop
- Shockley equation governs current-voltage relationship
- Small-signal linearization is the key analysis trick
- MOSFETs are voltage-controlled current sources
- All of modern electronics rests on this foundation
$LEC$, 50),

('analog-electronics', 2, 'MOSFET Large-Signal and Small-Signal Models', $LEC$
## The MOSFET Structure

A MOSFET has four terminals:
- **Gate (G)** — controls the channel
- **Source (S)** — where carriers enter
- **Drain (D)** — where carriers exit
- **Body (B)** — usually tied to source

The gate is separated from the channel by a thin oxide layer (SiO₂, ~2 nm for modern nodes). This makes the input impedance essentially infinite.

## Threshold Voltage

Vth is the gate-source voltage needed to create a conducting channel. For modern MOSFETs, Vth ≈ 0.3-0.7 V.

Below Vth (subthreshold): tiny current flows exponentially. This is the leakage current.

Above Vth: inversion layer forms, channel conducts.

## Large-Signal Model

**Triode region** (Vds < Vgs - Vth):

    Id = kn × (W/L) × [(Vgs - Vth) × Vds - Vds²/2]

This is a nonlinear resistor: for small Vds, it behaves like a resistor.

**Saturation region** (Vds > Vgs - Vth):

    Id = (1/2) × kn × (W/L) × (Vgs - Vth)² × (1 + λ × Vds)

The channel is "pinched off" near the drain. Current depends mainly on Vgs, with a small dependence on Vds through the channel-length modulation parameter λ.

## Transconductance gm

The small-signal gain of a MOSFET is its transconductance:

    gm = ∂Id/∂Vgs = kn × (W/L) × (Vgs - Vth) = 2×Id / (Vgs - Vth)

At 1 mA and Vov = 0.2 V, gm = 10 mA/V.

## Small-Signal Model

For AC analysis, replace the MOSFET with:

- A resistor ro = 1/(λ × Id) from drain to source (output resistance)
- A current source gm × Vgs from drain to source
- An open circuit from gate to source (infinite input impedance)

This gives the voltage gain of a common-source amplifier:

    Av = -gm × (ro || RD)

## Common Configurations

**Common Source:** highest voltage gain, inverting, moderate input/output impedance. Most common.

**Common Gate:** current buffer, low input impedance, non-inverting.

**Common Drain (Source Follower):** voltage buffer, gain ≈ 1, low output impedance. Used to drive heavy loads.

**Cascode:** common-source + common-gate stacked. Very high output impedance, high gain, good bandwidth.

## Bias and Operating Point

Every MOSFET amplifier must be biased into saturation. Common techniques:

- **Fixed bias:** resistor from VDD to gate. Simple, but sensitive to Vth variation.
- **Self-bias:** source resistor with gate returned to ground. More stable.
- **Current-source bias:** the workhorse of analog ICs. Stabilized by a current mirror.

## Current Mirrors

The current mirror copies a reference current into multiple branches:

    Iout = Iref × (W/L)out / (W/L)ref

This is the fundamental building block of analog IC design. It provides a stable bias current independent of VDD.

## Key Takeaways

- MOSFET: voltage-controlled current source
- Two regions: triode (resistor-like) and saturation (current source)
- Small-signal model: gm and ro
- Common configurations: CS, CG, CD, cascode
- Current mirror is the universal bias building block
- Analog design = biasing + small-signal analysis
$LEC$, 50),

('analog-electronics', 3, 'Bipolar Transistors and Current Mirrors', $LEC$
## The BJT Structure

A Bipolar Junction Transistor has three terminals: Base (B), Collector (C), Emitter (E). Two junctions: base-emitter and base-collector.

Current is carried by both electrons and holes (hence "bipolar"). The base is very thin and lightly doped.

## Active Region

In active mode (BE forward, BC reverse):

    Ic = Is × e^(Vbe/Vt)
    Ib = Ic / β

where β is the current gain, typically 100-300 for small-signal BJTs, 20-100 for power devices.

The base current is small but nonzero, unlike the MOSFET where gate current is essentially zero.

## Transconductance

    gm = Ic / Vt

At 1 mA, gm = 38 mA/V. This is the same transconductance formula as a MOSFET in weak inversion, and it's the maximum gm for a given current.

## BJT vs MOSFET

| Property | BJT | MOSFET |
|----------|-----|--------|
| Control | Current (Ib) | Voltage (Vgs) |
| gm at 1 mA | 38 mA/V | 5-10 mA/V |
| Input impedance | Moderate (rπ) | Infinite |
| Noise | Lower | Higher |
| Matching | Poor (process) | Excellent |
| Speed | High (fT > 100 GHz) | High |

BJT is still used for:
- High-speed circuits (RF, > 10 GHz)
- Low-noise amplifiers
- Bandgap voltage references
- Some high-voltage applications

## Current Mirrors

The BJT current mirror:

    Iout = Iref × exp((Vbe_out - Vbe_ref)/Vt)

If the two transistors are identical and at the same temperature:

    Iout = Iref

Practical circuits add emitter resistors to reduce sensitivity to Vbe mismatch.

## Differential Pair

The differential pair is the input stage of every op-amp. Two matched transistors with a shared tail current source.

Differential input: V+ - V-. Output: current difference.

Common-mode input: affects both equally — rejected by symmetry.

The tail current source is the key: it "steers" the tail current to one side or the other depending on the differential input.

## Key Parameters

- **gm:** transconductance
- **rπ:** small-signal input resistance = β/gm
- **ro:** output resistance = VA/Ic (VA is the Early voltage, typically 50-200 V)
- **fT:** transition frequency — where current gain drops to 1

## Applications

**Bandgap reference:** combines a BJT's predictable Vbe (~600 mV, -2 mV/°C) with a PTAT current (proportional to absolute temperature) to produce a stable 1.2 V reference.

**Gilbert cell:** a mixer that multiplies two analog signals. Foundation of all RF receivers.

**Current feedback amplifier:** high slew rate, used in video and RF.

## Key Takeaways

- BJTs are current-controlled, MOSFETs are voltage-controlled
- BJT has higher gm for the same current
- Current mirrors copy a reference current
- Differential pair is the input of every op-amp
- Modern analog ICs use both: BJT where speed/noise matters, MOS elsewhere
$LEC$, 50),

('analog-electronics', 4, 'Operational Amplifiers and Feedback', $LEC$
## The Ideal Op-Amp

An op-amp is a differential amplifier with very high gain. Ideal properties:

- Infinite open-loop gain (A → ∞)
- Infinite input impedance (no current into inputs)
- Zero output impedance
- Infinite bandwidth

Real op-amps (e.g., LM741, TL071, OPA192) approximate these:
- A = 10^5 to 10^7
- Input impedance: 10^6 (bipolar) to 10^12 (CMOS)
- Output impedance: 10-100 ohms
- Unity-gain bandwidth: 1-100 MHz

## The Golden Rules

For an op-amp in negative feedback:

1. **The output does whatever it takes** to make the two inputs equal (virtual short)
2. **No current flows into the inputs**

These two rules let you analyze any op-amp circuit.

## Inverting Amplifier

    Vin ──R1──┬── (−)
              │
              │
             (−)  op-amp
              │
              └──R2── Vout
              
    (+): GND

Virtual ground at the (−) input (since + is at 0 V). Current through R1: I = Vin/R1. This current must flow through R2 (no current into op-amp input). So Vout = -I × R2 = -Vin × R2/R1.

    Gain = -R2/R1

## Non-Inverting Amplifier

    Vin ── (+)
             op-amp
           (−)──R1──GND
             │
             └──R2── Vout

Virtual short: V(-) = V(+). So V(-) = Vin. Voltage divider from Vout to GND through R1 and R2:

    Vin = Vout × R1/(R1+R2)

    Gain = 1 + R2/R1

## Buffer (Voltage Follower)

    Vin ── (+)
             op-amp
           (−)──┐
                └── Vout

Gain = 1. Used to convert a high-impedance source to a low-impedance output. Perfect for driving heavy loads.

## Integrator

    Vin ──R1──┬── (−)
              │
              C
              │
              └── Vout

    Vout = -(1/(R1×C)) × ∫Vin dt

Applications: analog filters, charge amplifiers, ADCs.

## Differentiator

Capacitor at input, resistor at feedback. Vout = -RC × dVin/dt.

## Filters

Combine R, C, and op-amp to build:
- Low-pass: gain drops above cutoff
- High-pass: gain drops below cutoff
- Band-pass: combination
- Notch: rejects one frequency

The **Sallen-Key** topology gives a 2nd-order filter with one op-amp.

## Real Op-Amp Limitations

**Input offset voltage:** a few µV to a few mV. Limits DC precision.

**Input bias current:** nA (bipolar) to pA (CMOS). Causes offsets through source resistance.

**Gain-bandwidth product (GBW):** the closed-loop bandwidth is GBW / |Gain|. At 100 MHz GBW, a gain of 10 gives 10 MHz bandwidth.

**Slew rate:** max dVout/dt. Typically 1-20 V/µs. Limits large-signal bandwidth.

**Common-mode range:** inputs must stay within a range near the rails. Rail-to-rail op-amps extend this.

**Output swing:** how close Vout can get to the rails. Rail-to-rail output is 50 mV from each rail.

## Key Takeaways

- Ideal op-amp: infinite gain, infinite Zin, zero Zout
- Golden rules: virtual short, no input current
- Inverting: -R2/R1, Non-inverting: 1+R2/R1
- Integrator and differentiator are workhorses
- Real op-amps have offset, bias current, finite GBW, slew rate
- Choose op-amp based on: speed, precision, power, cost
$LEC$, 50),

('analog-electronics', 5, 'Analog Filter Design', $LEC$
## Why Filters?

Every real signal has noise. Filters separate signal from noise based on frequency content:

- **Low-pass:** keeps low frequencies, removes high (smoothing, anti-aliasing)
- **High-pass:** keeps high, removes low (AC coupling, removing DC offset)
- **Band-pass:** keeps a band (radio receivers, audio equalizers)
- **Notch:** removes a narrow band (60 Hz hum rejection)

## First-Order RC Low-Pass

    Vin ──R──┬── Vout
             │
             C
             │
            GND

Transfer function:

    H(jω) = 1 / (1 + jωRC)

Cutoff frequency (where |H| = 0.707):

    fc = 1 / (2πRC)

Roll-off: -20 dB/decade. At 10x fc, gain is -20 dB; at 100x fc, gain is -40 dB.

## Second-Order Filters

Two RC sections in series don't work well — they load each other. Use an active filter (Sallen-Key):

    Vin ──R1──┬──R2──┬── (+)
              C1    │    op-amp
              │     C2   │
             GND   GND  └── Vout
                       │
                     (−)──R3──R4──GND

The op-amp buffers and provides the feedback that creates the sharp roll-off.

Roll-off: -40 dB/decade (10x better than first-order).

## Butterworth Response

Maximally flat passband. No ripple. The standard "textbook" response.

For 2nd order:
    H(s) = ωc² / (s² + √2 ωc s + ωc²)

The Q factor is 0.707.

## Chebyshev Response

Ripple in the passband, but sharper roll-off than Butterworth.

For 0.5 dB ripple, Q = 1.4 for 2nd order.

Trade-off: more ripple = sharper roll-off = worse transient response.

## Bessel Response

Linear phase (constant group delay) — important for pulses and digital signals.

Roll-off is gentler than Butterworth.

## Higher-Order Filters

Cascade multiple 2nd-order sections. A 4th-order filter is two 2nd-order sections in series. A 6th-order is three.

Real components have tolerance, so higher-order filters are harder to build.

## Active Filter Design Example

Design a 2nd-order Butterworth low-pass at 1 kHz.

Given: fc = 1 kHz, Q = 0.707, C = 10 nF

    R = 1 / (2π × 1000 × 10 nF) = 15.9 kΩ

Use standard values: R = 16 kΩ, C = 10 nF, and a second stage with R = 16 kΩ, C = 4.7 nF for the Sallen-Key topology.

## Filter Order and Roll-off

| Order | Roll-off | Components |
|-------|----------|------------|
| 1st | -20 dB/dec | 1 R, 1 C |
| 2nd | -40 dB/dec | 2 R, 2 C, op-amp |
| 4th | -80 dB/dec | 4 R, 4 C, 2 op-amps |
| 6th | -120 dB/dec | 6 R, 6 C, 3 op-amps |

For each additional 20 dB of stopband attenuation, add one order.

## Anti-Aliasing Filters

Before sampling an analog signal, you must low-pass filter it to remove frequencies above Nyquist (fs/2). Otherwise, aliasing folds high frequencies into the baseband, corrupting the signal.

Rule: cutoff at 0.4 × fs, sharp enough that fs/2 is attenuated by >60 dB.

## Key Takeaways

- Filters separate signal from noise by frequency
- First-order: -20 dB/dec, simple RC
- Second-order: -40 dB/dec, needs op-amp
- Butterworth (flat), Chebyshev (ripple), Bessel (linear phase)
- Higher order = cascaded 2nd-order sections
- Anti-aliasing filter is mandatory before ADC
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- CONTROL SYSTEMS (Caltech CDS 101) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('control-systems', 1, 'Introduction to Feedback Control', $LEC$
## What is a Control System?

A control system is a system that regulates another system. Examples:

- Cruise control keeps a car at a set speed
- Thermostat keeps a room at a set temperature
- Autopilot keeps a plane on course
- Camera autofocus keeps a subject sharp

The core idea: measure the output, compare to the desired output, and adjust the input.

## Open-Loop vs Closed-Loop

**Open-loop:** apply a preset input, hope the output is right. No feedback. Simple, but sensitive to disturbances and model errors.

Example: a toaster has a timer. If the bread is thicker, it burns.

**Closed-loop:** measure the output, feed it back, correct the error. Robust to disturbances.

Example: a thermostat with a temperature sensor. When the room is cold, it heats. When warm, it stops.

## The Feedback Loop

    ┌─────────┐    ┌─────────┐    ┌────────┐
    │ Setpoint├───▶│ Error   ├───▶│Controller├──▶ u(t) ──▶ Plant ──▶ y(t)
    └─────────┘    └─────────┘    └────────┘                                 │
                          ▲                                                 │
                          │                                                 │
                          └──── r(t) ◀────── Sensor ◀─────────────────────┘

Where:
- r(t) = setpoint (what we want)
- y(t) = output (what we have)
- e(t) = r(t) - y(t) = error
- u(t) = control input

## The Controller

Three classical controllers (PID):

**Proportional (P):** u = Kp × e. Simple, but leaves steady-state error.

**Integral (I):** u = Ki × ∫e dt. Removes steady-state error, but can cause oscillation.

**Derivative (D):** u = Kd × de/dt. Predicts the future, damps oscillation, but amplifies noise.

Combined:

    u(t) = Kp×e + Ki×∫e + Kd×de/dt

This is the PID controller — the workhorse of industrial control.

## Why Feedback Works

Feedback rejects disturbances:

    If Plant = P, Controller = C, then:
    y/r = PC / (1 + PC)

As long as PC >> 1 at the relevant frequencies, the closed-loop transfer function ≈ 1.

Feedback also reduces sensitivity to plant variations:

    d(y/r)/(y/r) = (1/(1+PC)) × dP/P

So a 20% variation in plant becomes a 20%/(1+PC) variation in output.

## Stability

Not all feedback is good. Too much gain causes oscillation. The closed-loop poles must be in the left half-plane.

Classical tests:
- **Nyquist criterion:** plot PC in the complex plane, check encirclements of -1
- **Bode plots:** gain margin (how much more gain before oscillation) and phase margin (how much more phase lag before oscillation)
- **Root locus:** where closed-loop poles go as gain increases

Rule of thumb: phase margin > 45° for good damping, > 60° for excellent.

## Applications

- **Robotics:** joint control, trajectory tracking
- **Aerospace:** autopilot, missile guidance, satellite attitude
- **Process control:** temperature, pressure, flow
- **Automotive:** cruise control, ABS, engine management
- **Power systems:** grid frequency, voltage regulation

## Key Takeaways

- Feedback compares output to setpoint, adjusts input
- Closed-loop is robust; open-loop is not
- PID is the universal controller
- Feedback reduces sensitivity and rejects disturbances
- Stability is essential; tune for phase margin
- Control is everywhere in engineering
$LEC$, 50),

('control-systems', 2, 'System Modeling and Laplace Transforms', $LEC$
## Why Model Systems?

To design a controller, we need a mathematical model of the plant. The model doesn't have to be perfect — it just needs to capture the essential dynamics.

## Differential Equations

Most physical systems are described by ODEs:

**RC circuit:**
    RC × dVout/dt + Vout = Vin

**Mass-spring-damper:**
    m × x'' + c × x' + k × x = F(t)

**DC motor:**
    J × ω' + b × ω = Kt × I
    L × I' + R × I = V - Ke × ω

These couple the physical world (R, m, k) to the dynamics.

## The Laplace Transform

The Laplace transform converts ODEs to algebraic equations:

    L{f(t)} = F(s) = ∫₀^∞ f(t) × e^(-st) dt

Key properties:

- **Linearity:** L{af + bg} = aF + bG
- **Derivative:** L{f'} = sF(s) - f(0)
- **Integral:** L{∫f dt} = F(s)/s
- **Time shift:** L{f(t-T)} = e^(-sT) × F(s)
- **Final value theorem:** lim(t→∞) f(t) = lim(s→0) sF(s)

## Common Transforms

| f(t) | F(s) |
|------|------|
| δ(t) (impulse) | 1 |
| u(t) (step) | 1/s |
| t | 1/s² |
| e^(-at) | 1/(s+a) |
| sin(ωt) | ω/(s²+ω²) |
| 1 - e^(-t/τ) | 1/(s(sτ+1)) |

## Transfer Functions

For a linear time-invariant (LTI) system with zero initial conditions:

    H(s) = Y(s) / U(s)

This is the transfer function. It fully characterizes the system's input-output behavior.

For the RC circuit:

    H(s) = 1 / (RCs + 1)

The pole at s = -1/(RC) determines the time constant τ = RC.

## Poles and Zeros

The transfer function is a ratio of polynomials:

    H(s) = N(s) / D(s)

**Zeros:** roots of N(s). Cause the output to be zero at certain frequencies.

**Poles:** roots of D(s). Determine the natural response.

For a first-order system with pole at s = -a:

    h(t) = e^(-at)

Time constant τ = 1/a.

For a second-order system with poles at s = -σ ± jωd:

    h(t) = e^(-σt) × sin(ωd × t + φ)

Damping ratio ζ = σ / √(σ² + ωd²).

- ζ > 1: overdamped (no oscillation)
- ζ = 1: critically damped (fastest without overshoot)
- 0 < ζ < 1: underdamped (oscillates)
- ζ = 0: undamped (pure oscillation)

## Block Diagrams

Complex systems are built from simple blocks:

- **Series:** H = H1 × H2
- **Parallel:** H = H1 + H2
- **Feedback:** H = H1 / (1 + H1 × H2)

Feedback is the key block that changes system behavior dramatically.

## Example: DC Motor Position Control

    θ(s) / V(s) = Kt / (s × (Js + b) × (Ls + R) + Kt × Ke)

For a small motor, L is negligible, so:

    θ(s) / V(s) ≈ Kt / (s × (Js + b) × R + Kt × Ke)

This is a second-order system with one pole at origin (integrator) and one real pole.

## Key Takeaways

- Physical systems → ODEs → Laplace → transfer functions
- Poles and zeros characterize system behavior
- Second-order: ζ and ωn fully determine response
- Block diagrams compose simple systems
- Feedback changes the effective dynamics
- Modeling is the first step of any control design
$LEC$, 50),

('control-systems', 3, 'PID Controller Design', $LEC$
## The PID Controller

The most widely used controller in industry. Over 90% of control loops use PID.

    u(t) = Kp×e(t) + Ki×∫₀^t e(τ)dτ + Kd×de/dt

In Laplace form:

    C(s) = Kp + Ki/s + Kd×s

Or equivalently:

    C(s) = Kp × (1 + 1/(Ti×s) + Td×s)

where Ti = Kp/Ki is the integral time and Td = Kd/Kp is the derivative time.

## Proportional Term

u = Kp × e

Pros:
- Fast response
- Simple

Cons:
- Steady-state error for step input to type-0 plant
- Higher Kp = faster but more oscillatory

## Integral Term

u = Ki × ∫e dt

Pros:
- Eliminates steady-state error
- Handles constant disturbances

Cons:
- Adds phase lag → reduces stability
- Can cause "integral windup" during saturation

## Derivative Term

u = Kd × de/dt

Pros:
- Adds phase lead → improves stability
- Predicts future error → damps response

Cons:
- Amplifies high-frequency noise
- Difficult to implement in practice

## Tuning Methods

### Ziegler-Nichols (Closed-Loop)

1. Set Ki = Kd = 0
2. Increase Kp until system oscillates at constant amplitude. Call this Ku (ultimate gain), and the period Tu.
3. Set:
   - Kp = 0.6 × Ku
   - Ki = 2 × Kp / Tu
   - Kd = Kp × Tu / 8

This gives a "quarter-wave decay" response — moderately aggressive.

### Ziegler-Nichols (Open-Loop)

From the step response, find the inflection point. Draw a tangent. Read off the delay L and time constant T.

Then:
- Kp = 1.2 × T / (K × L)
- Ki = Kp / (2L)
- Kd = Kp × 0.5 × L

where K is the plant DC gain.

### Manual Tuning

1. Start with Ki = Kd = 0
2. Increase Kp until response is fast but stable (no sustained oscillation)
3. Add Ki to eliminate steady-state error — small at first
4. Add Kd to reduce overshoot and speed up response
5. Iterate

## Typical Issues

**Integral windup:** during saturation (e.g., actuator limit), the integrator keeps accumulating. When the error reverses, the integrator takes time to unwind → overshoot.

Solution: anti-windup — clamp the integrator or freeze it during saturation.

**Noise amplification:** the derivative term amplifies sensor noise. Solution: use a low-pass filter on the derivative, or use a "dirty derivative" (filtered derivative).

**Setpoint kick:** differentiating the setpoint causes a spike when the reference changes. Solution: differentiate only the measurement, not the error.

## PID in Discrete Time

Real controllers run on microcontrollers with a fixed sample period Ts.

    u[n] = u[n-1] + Kp×(e[n]-e[n-1]) + Ki×Ts×e[n] + (Kd/Ts)×(e[n]-2e[n-1]+e[n-2])

The sampling rate should be at least 10x the fastest dynamics.

## Example: Temperature Control

A 3D printer hot end has a thermal time constant of ~30 seconds. Sample at 1 Hz.

Typical PID gains: Kp = 20, Ki = 0.5, Kd = 100.

At startup, the heater runs full power until the temperature nears the setpoint. Then PID takes over.

## Key Takeaways

- PID is the universal industrial controller
- P = speed, I = eliminate steady-state error, D = damping
- Ziegler-Nichols gives starting gains
- Anti-windup is essential in practice
- Filter the derivative to reduce noise
- Discrete-time implementation is standard
$LEC$, 50),

('control-systems', 4, 'Stability Analysis: Bode and Nyquist', $LEC$
## Stability

A system is stable if its output returns to equilibrium after a disturbance. Formally, all poles of the closed-loop transfer function must be in the left half of the complex plane.

Feedback can make a stable plant unstable if the gain is too high. Understanding stability margins is essential.

## Gain and Phase Margin

Consider the loop transfer function L(s) = C(s) × P(s).

The **crossover frequency** ωc is where |L(jωc)| = 1 (0 dB).

The **phase margin** (PM) is the difference between the phase of L at crossover and -180°:

    PM = 180° + ∠L(jωc)

Rule of thumb:
- PM > 0: stable
- PM = 45°: good, moderate overshoot
- PM = 60°: excellent, minimal overshoot
- PM = 90°: very conservative, slow

The **gain margin** (GM) is how much the gain can increase before instability:

    GM = 1 / |L(jωpc)|

where ωpc is the phase crossover frequency (where ∠L = -180°).

## Bode Plots

Two plots:
1. Magnitude |L(jω)| in dB vs frequency (log scale)
2. Phase ∠L(jω) in degrees vs frequency (log scale)

Read off:
- Crossover frequency (where magnitude = 0 dB)
- Phase margin (180 + phase at crossover)
- Phase crossover (where phase = -180°)
- Gain margin (negative of magnitude at phase crossover)

## Rules of Thumb

Each pole contributes -20 dB/decade and -90° of phase.

Each zero contributes +20 dB/decade and +90° of phase.

For a typical system, if the slope at crossover is -20 dB/decade, phase margin is roughly 90°. If -40 dB/decade, phase margin is roughly 0°.

Rule: keep the slope at crossover at -20 dB/decade for good phase margin.

## Nyquist Criterion

Plot L(jω) for ω from 0 to ∞ in the complex plane. This is the Nyquist plot.

The number of encirclements of the point -1 equals the number of unstable closed-loop poles minus the number of unstable open-loop poles.

For a stable open-loop system:
- No encirclement of -1 → stable closed-loop
- Encirclement → unstable closed-loop

Nyquist is more powerful than Bode for two reasons:
1. It handles right-half-plane poles correctly
2. It captures the behavior at all frequencies

## Frequency Response Intuition

At low frequency, integrators give high gain — good for tracking.

At high frequency, the plant rolls off — good for noise rejection.

A well-designed controller has:
- High gain at low frequency (tracking)
- Crossover at a frequency where phase margin > 45°
- Low gain at high frequency (noise rejection)

This is the "loop shaping" approach to control design.

## Example: PI Control of First-Order Plant

Plant: P(s) = K / (τs + 1)

Controller: C(s) = Kp + Ki/s

Loop: L(s) = (Kp + Ki/s) × K / (τs + 1)

At low frequency, the integrator gives high gain. At high frequency, the plant rolls off.

Design Kp and Ki so crossover is at ωc with 60° phase margin.

## Key Takeaways

- Stability requires all closed-loop poles in the left half-plane
- Phase margin > 45° for good response
- Gain margin > 6 dB for robustness
- Bode plots are the standard visualization
- Nyquist is more rigorous
- Loop shaping: high gain low freq, crossover with margin, low gain high freq
$LEC$, 50),

('control-systems', 5, 'State-Space Control', $LEC$
## Beyond Transfer Functions

Transfer functions work for SISO systems with zero initial conditions. For MIMO systems, or systems with nonzero initial conditions, we use state-space.

## State-Space Representation

Any linear system can be written as:

    ẋ = A x + B u
    y = C x + D u

where:
- x ∈ R^n is the state vector
- u ∈ R^m is the input
- y ∈ R^p is the output
- A, B, C, D are constant matrices

## Example: Mass-Spring-Damper

    m x'' + c x' + k x = F

Define state: x1 = x, x2 = x'

    x1' = x2
    x2' = -k/m × x1 - c/m × x2 + 1/m × F

So:
    A = [0, 1; -k/m, -c/m]
    B = [0; 1/m]
    C = [1, 0]
    D = [0]

## Controllability

The system is controllable if we can drive the state from any initial value to any final value in finite time.

Controllability matrix:

    C = [B  AB  A²B  ...  A^(n-1)B]

The system is controllable iff C has full rank (rank n).

## Observability

The system is observable if the initial state can be determined from the output over time.

Observability matrix:

    O = [C; CA; CA²; ...; CA^(n-1)]

Full rank (n) → observable.

## Pole Placement

If the system is controllable, we can place the closed-loop poles anywhere via state feedback:

    u = -K x

The closed-loop system becomes:

    ẋ = (A - BK) x

Choose K so that the eigenvalues of (A - BK) are the desired poles.

This is like PID tuning but more powerful: we can shape the entire closed-loop response.

## Linear Quadratic Regulator (LQR)

Instead of picking poles directly, we minimize a cost function:

    J = ∫₀^∞ (x'Qx + u'Ru) dt

where Q and R are weighting matrices chosen by the designer.

The solution is:

    K = R^(-1) B' P

where P solves the algebraic Riccati equation:

    A'P + PA - PBR^(-1)B'P + Q = 0

LQR gives optimal trade-off between state regulation and control effort.

## Observer Design

If we can't measure all states, we build an observer:

    x̂' = A x̂ + B u + L(y - C x̂)

The observer error (x - x̂) evolves as:

    (x - x̂)' = (A - LC)(x - x̂)

Choose L so that A - LC is stable (eigenvalues in left half-plane).

The combined controller-observer is called a "compensator" and has the same input-output behavior as a state-feedback controller on the true state (separation principle).

## Applications

- Aerospace: rocket guidance, satellite attitude
- Robotics: multi-joint control, trajectory tracking
- Power systems: wide-area control
- Process control: distillation columns

## Key Takeaways

- State-space handles MIMO and nonzero ICs
- Controllability: can we steer the state anywhere?
- Observability: can we determine the state?
- Pole placement: put closed-loop poles where we want
- LQR: optimal state feedback via cost minimization
- Observer: reconstruct unmeasured states
- State-space is the modern approach to control
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('analog-electronics', 'control-systems')
group by course_slug;