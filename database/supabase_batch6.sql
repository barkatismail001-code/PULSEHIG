-- ============================================================
-- Batch 6: MIT 6.003 + MIT 6.004 + MIT 6.013
-- ============================================================

-- ============================================================
-- SIGNALS & SYSTEMS (MIT 6.003) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('signals-systems', 1, 'Signals and Systems: An Introduction', $LEC$
## What is a Signal?

A signal is a function that carries information. Examples:
- Audio: air pressure vs time
- Video: pixel intensity vs (x, y, t)
- Sensor: voltage vs time
- Image: brightness vs (x, y)

Mathematically, a signal is a function of one or more independent variables.

## Continuous vs Discrete

**Continuous-time (CT):** x(t) defined for all t. Example: analog audio.

**Discrete-time (DT):** x[n] defined only for integer n. Example: sampled audio at 44.1 kHz.

Almost all modern signal processing is digital (DT), but CT analysis is the foundation.

## Common Signals

**Unit impulse δ(t):** infinite at t=0, zero elsewhere, area = 1.

**Unit step u(t):** 0 for t<0, 1 for t>0.

**Sinusoid:** x(t) = A cos(ωt + φ). Frequency ω (rad/s), phase φ.

**Complex exponential:** x(t) = e^(st), where s = σ + jω. The most fundamental signal — from it, all others are built.

**Unit ramp:** x(t) = t × u(t).

## Signal Operations

**Time shift:** x(t - t₀) shifts right by t₀.

**Time scale:** x(at) compresses by a (a > 1) or stretches (a < 1).

**Time reversal:** x(-t) flips around t=0.

**Amplitude scaling:** A × x(t).

**Addition:** (x₁ + x₂)(t) = x₁(t) + x₂(t).

## Signal Properties

**Even:** x(-t) = x(t). Symmetric about 0.

**Odd:** x(-t) = -x(t). Antisymmetric.

**Periodic:** x(t) = x(t + T) for all t. Smallest T is the fundamental period.

**Energy signal:** finite total energy ∫|x(t)|² dt < ∞.

**Power signal:** finite average power lim(T→∞) (1/T) ∫|x(t)|² dt < ∞.

**Causal:** x(t) = 0 for t < 0.

## What is a System?

A system transforms an input signal into an output signal. Examples:
- Amplifier: multiplies by gain
- Filter: removes frequency components
- Sampler: converts CT to DT
- Modulator: shifts frequency

## System Properties

**Linear:** superposition holds. S(ax₁ + bx₂) = aS(x₁) + bS(x₂).

**Time-invariant:** S(x(t - t₀)) = y(t - t₀). Same behavior at all times.

**Causal:** output depends only on present and past inputs.

**Stable (BIBO):** bounded input → bounded output.

**Memoryless:** output depends only on current input.

**Invertible:** distinct inputs give distinct outputs.

## LTI Systems — The Big Idea

Linear Time-Invariant (LTI) systems are the most important class. They are completely characterized by their **impulse response** h(t).

For any input x(t), the output is:

    y(t) = x(t) * h(t) = ∫ x(τ) h(t - τ) dτ

This convolution integral is the foundation of signals and systems.

## Key Takeaways

- Signals are functions carrying information
- CT vs DT, energy vs power, causal vs noncausal
- Systems transform signals
- Linear + time-invariant = LTI — the fundamental class
- LTI systems described by impulse response
- Convolution gives the output for any input
$LEC$, 50),

('signals-systems', 2, 'Convolution and LTI Systems', $LEC$
## Convolution

Convolution is the operation that combines two signals to produce a third:

    y(t) = (x * h)(t) = ∫_{-∞}^{∞} x(τ) h(t - τ) dτ

For discrete-time signals:

    y[n] = (x * h)[n] = Σ_{k=-∞}^{∞} x[k] h[n - k]

Convolution is the fundamental operation of LTI systems.

## Properties

**Commutative:** x * h = h * x

**Associative:** (x * h₁) * h₂ = x * (h₁ * h₂)

**Distributive:** x * (h₁ + h₂) = x * h₁ + x * h₂

These properties make it easy to combine systems.

## Impulse Response

If x(t) = δ(t), then y(t) = h(t). The impulse response is the output when the input is an impulse.

Everything about an LTI system is determined by its impulse response:
- Cascade of LTI systems → convolve their impulse responses
- Parallel combination → sum impulse responses

## Step Response

If x(t) = u(t), then y(t) = ∫h(τ)dτ (integral of impulse response).

The step response is often easier to measure than the impulse response.

## Convolution with Simple Signals

**Impulse:** x(t) * δ(t - t₀) = x(t - t₀). Just a shift.

**Step:** x(t) * u(t) = ∫_{-∞}^{t} x(τ) dτ. Integrator.

**Exponential:** x(t) * e^(-at)u(t) gives a smoothed version of x.

## Convolution as a Filter

Convolution smooths, sharpens, or shifts a signal, depending on h:
- Moving average → low-pass filter
- Differentiator → high-pass filter
- Gaussian → smoothing

Every FIR filter is a convolution with its coefficient sequence.

## Visual Example

Convolving a rectangle (width T) with itself gives a triangle (width 2T). This is the classic example — it's why pulse shapes change as they pass through filters.

## Convolution in Matrix Form

For discrete-time, convolution can be written as matrix multiplication:

    y = H × x

where H is a Toeplitz matrix containing shifted copies of h.

This is why convolution is a linear operator — it's a matrix.

## Deconvolution

Given y and h, recover x:

    X = Y / H (in frequency domain)

Often unstable due to noise amplification. Regularization (Tikhonov) helps.

## Applications

- Audio filtering (EQ, reverb)
- Image blurring and sharpening
- Radar and sonar pulse compression
- Communication channel equalization
- Seismic deconvolution
- Neural network convolution layers

## Key Takeaways

- Convolution: y = x * h
- LTI systems are fully described by h(t)
- Properties: commutative, associative, distributive
- Cascade = convolve, parallel = add
- Convolution is a linear operator (matrix form)
- The fundamental operation for filtering
$LEC$, 50),

('signals-systems', 3, 'Fourier Series and Fourier Transform', $LEC$
## Fourier Series

Any periodic signal x(t) with period T can be written as:

    x(t) = Σ_{k=-∞}^{∞} c_k × e^(j2πkt/T)

where the coefficients are:

    c_k = (1/T) × ∫₀^T x(t) × e^(-j2πkt/T) dt

The signal is decomposed into complex exponentials at frequencies k/T.

## Trigonometric Form

Equivalent form using sine and cosine:

    x(t) = a₀ + Σ a_k cos(2πkt/T) + Σ b_k sin(2πkt/T)

where a₀ is the DC component.

## Example: Square Wave

A square wave of amplitude A and period T:

    x(t) = (4A/π) × [sin(ωt) + sin(3ωt)/3 + sin(5ωt)/5 + ...]

Only odd harmonics. Amplitudes 1, 1/3, 1/5...

## Fourier Transform

For aperiodic signals, take T → ∞. The Fourier transform:

    X(jω) = ∫_{-∞}^{∞} x(t) × e^(-jωt) dt

Inverse:

    x(t) = (1/2π) × ∫_{-∞}^{∞} X(jω) × e^(jωt) dω

X(jω) tells us the "amount" of each frequency in x(t).

## Transform Pairs

| x(t) | X(jω) |
|------|-------|
| δ(t) | 1 |
| u(t) | 1/(jω) + πδ(ω) |
| e^(-at) u(t) | 1/(a + jω) |
| cos(ω₀t) | π[δ(ω-ω₀) + δ(ω+ω₀)] |
| sin(ω₀t)/πt | rect(ω) |

## Properties

**Linearity:** a x₁ + b x₂ ↔ a X₁ + b X₂

**Time shift:** x(t - t₀) ↔ e^(-jωt₀) X(jω)

**Frequency shift:** e^(jω₀t) x(t) ↔ X(j(ω - ω₀))

**Scaling:** x(at) ↔ (1/|a|) X(jω/a)

**Differentiation:** dx/dt ↔ jω X(jω)

**Integration:** ∫x dt ↔ X(jω)/(jω) + π X(0)δ(ω)

**Convolution:** x * h ↔ X × H

**Multiplication:** x × h ↔ (1/2π) X * H

## Parseval's Theorem

    ∫|x(t)|² dt = (1/2π) × ∫|X(jω)|² dω

Energy in time domain = energy in frequency domain.

## Frequency Response

For an LTI system with impulse response h(t), the frequency response is H(jω) = FT{h(t)}.

For input x(t), output spectrum:

    Y(jω) = H(jω) × X(jω)

The system multiplies the input spectrum by H. This is why frequency-domain analysis is so powerful.

## Applications

- Filter design (specify H(jω), find h(t))
- Modulation (shift signal to a new frequency band)
- Sampling theory (Nyquist rate)
- Power spectral density
- Image processing (2D FT)
- Solving differential equations
- Quantum mechanics (wave functions)

## Key Takeaways

- Fourier series decomposes periodic signals into harmonics
- Fourier transform extends to aperiodic signals
- X(jω) shows the frequency content of x(t)
- Convolution in time = multiplication in frequency
- Parseval: energy conservation between domains
- LTI systems act as frequency filters
- Every signal can be analyzed in the frequency domain
$LEC$, 50),

('signals-systems', 4, 'Laplace Transform and Transfer Functions', $LEC$
## The Laplace Transform

Generalizes the Fourier transform to complex frequencies:

    X(s) = ∫₀^∞ x(t) × e^(-st) dt

where s = σ + jω is a complex variable.

The Laplace transform handles signals that grow exponentially (Fourier doesn't), and is the natural tool for differential equations.

## Region of Convergence

The set of s values for which X(s) converges is the ROC. It's usually a vertical strip in the s-plane.

For a causal signal like e^(-at)u(t), ROC is Re(s) > -a.

## Common Transforms

| x(t) | X(s) |
|------|------|
| δ(t) | 1 |
| u(t) | 1/s |
| t u(t) | 1/s² |
| e^(-at) u(t) | 1/(s + a) |
| sin(ωt) u(t) | ω/(s² + ω²) |
| cos(ωt) u(t) | s/(s² + ω²) |

## Properties

**Linearity:** a x₁ + b x₂ ↔ a X₁ + b X₂

**Time shift:** x(t - T) u(t - T) ↔ e^(-sT) X(s)

**Scaling:** x(at) ↔ (1/a) X(s/a)

**Differentiation:** dx/dt ↔ sX(s) - x(0⁻)

**Integration:** ∫₀^t x dt ↔ X(s)/s

**Initial value:** x(0⁺) = lim(s→∞) sX(s)

**Final value:** lim(t→∞) x(t) = lim(s→0) sX(s)

**Convolution:** x * h ↔ X × H

The derivative and convolution properties are what make Laplace so useful for circuit and control analysis.

## Transfer Functions

For an LTI system with input u(t) and output y(t):

    H(s) = Y(s) / U(s) (zero initial conditions)

This is the transfer function. It fully describes the system.

For a linear ODE:

    a_n y^(n) + ... + a₁ y' + a₀ y = b_m u^(m) + ... + b₁ u' + b₀ u

Taking Laplace:

    H(s) = (b_m s^m + ... + b₀) / (a_n s^n + ... + a₀)

The numerator gives the zeros, the denominator gives the poles.

## Poles and Stability

A system is stable if all poles are in the left half-plane (Re(s) < 0).

Poles on the imaginary axis: marginally stable (constant amplitude oscillation).
Poles in the right half-plane: unstable (exponential growth).

This is why we compute poles for stability analysis.

## Example: RC Circuit

Circuit equation: RC × dV/dt + V = Vin

Laplace: (RC s + 1) V(s) = Vin(s)

Transfer function: H(s) = 1 / (RCs + 1)

Pole at s = -1/RC. Time constant τ = RC.

Step response: V(t) = Vin(1 - e^(-t/τ)).

## State-Space to Transfer Function

Given state-space equations:

    ẋ = A x + B u
    y = C x + D u

Transfer function:

    H(s) = C(sI - A)^(-1) B + D

This bridges the state-space and transfer-function views.

## Applications

- Circuit analysis (impedance method)
- Control system design
- Filter design
- Solving ODEs
- Process modeling
- Signal processing

## Key Takeaways

- Laplace generalizes Fourier to complex s
- Converts ODEs to algebraic equations
- Transfer function H(s) = Y(s)/U(s)
- Poles determine stability (LH plane = stable)
- Properties: derivative → sX, convolution → multiplication
- Foundation for circuit and control analysis
$LEC$, 50),

('signals-systems', 5, 'Sampling and the Discrete-Time World', $LEC$
## Why Sample?

Digital computers can't process continuous signals directly. We must sample: take instantaneous values at regular intervals.

Sampling rate fs determines everything about the resulting digital signal.

## Sampling Theorem (Nyquist-Shannon)

A bandlimited signal with maximum frequency fmax can be perfectly reconstructed from samples taken at:

    fs > 2 × fmax

2 × fmax is the **Nyquist rate**. fs/2 is the **Nyquist frequency**.

If fs < 2 fmax, aliasing occurs — high frequencies appear as low frequencies.

## Aliasing

When sampled below Nyquist, a frequency f appears as:

    f_alias = |f - k × fs| (closest to f)

Example: fs = 1000 Hz, f = 1200 Hz → alias = 200 Hz (indistinguishable from a real 200 Hz signal).

Aliasing is why:
- Audio is sampled at 44.1 kHz (human hearing to 20 kHz)
- Anti-aliasing filters are essential before ADCs
- "Wagon wheel effect" in movies

## Sampling in Frequency Domain

Sampling in time = periodic replication in frequency:

    X_s(jω) = (1/T) × Σ X(j(ω - k ωs))

The spectrum is repeated every ωs = 2π fs. If the original signal is not bandlimited, the replicas overlap → aliasing.

## Reconstruction

Ideal reconstruction uses a sinc filter:

    x(t) = Σ x[n] × sinc((t - nT)/T)

This is a perfect interpolation if the sampling theorem holds.

Real DACs use zero-order hold (staircase) followed by a smoothing filter.

## Discrete-Time Processing

Once sampled, we work in discrete time:

    y[n] = Σ h[k] × x[n - k]

The DTFT (discrete-time Fourier transform):

    X(e^(jΩ)) = Σ x[n] × e^(-jΩn)

Where Ω is digital frequency (rad/sample).

## The DFT and FFT

For finite-length sequences, use the Discrete Fourier Transform (DFT):

    X[k] = Σ_{n=0}^{N-1} x[n] × e^(-j2πnk/N)

Computes N frequency samples. Time: O(N²).

The FFT (Fast Fourier Transform) does it in O(N log N). This is one of the most important algorithms ever invented.

## Nyquist Zones

Above fs/2, frequencies fold back. The range 0 to fs/2 is the first Nyquist zone, fs/2 to fs is the second, and so on.

Undersampling (deliberately sampling below Nyquist) is used in radio receivers to down-convert signals to lower frequencies.

## Quantization

Real ADCs quantize amplitudes to a finite number of levels. This adds quantization noise.

For an N-bit ADC, the SNR due to quantization is:

    SNR = 6.02 N + 1.76 dB

A 12-bit ADC gives ~74 dB SNR.

## Oversampling

Sampling faster than needed allows:
- Higher SNR (noise spreads over wider band)
- Simpler anti-aliasing filter
- 4× oversampling gives 6 dB SNR improvement (1 extra bit)

Used in audio (delta-sigma converters) to achieve 24-bit effective resolution from 1-bit quantizers.

## Applications

- Digital audio (CD: 44.1 kHz, 16-bit)
- Digital video (multiple sampling rates)
- Software-defined radio (direct RF sampling)
- Medical imaging (CT, MRI)
- Industrial control (sensor sampling)

## Key Takeaways

- Sampling: fs > 2 fmax for perfect reconstruction
- Aliasing: high frequencies appear as low frequencies
- Anti-aliasing filters essential before ADC
- FFT: O(N log N) for frequency analysis
- Quantization adds noise: 6 dB per bit
- Oversampling improves SNR
- Nyquist zones and undersampling in RF
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('signals-systems')
group by course_slug;