-- ============================================================
-- Batch 8: MIT 6.341 (DSP) + MIT 6.S081 (Operating Systems)
-- ============================================================

-- ============================================================
-- DIGITAL SIGNAL PROCESSING (MIT 6.341) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('dsp', 1, 'Discrete-Time Signals and Systems', $LEC$
## The Digital Signal Processing Revolution

DSP changed everything. Before DSP, filters were analog circuits: op-amps, resistors, capacitors. Now they're algorithms: multiply, add, store. Why does this matter?

- **Reproducibility:** a digital filter gives the same result every time
- **Flexibility:** change the coefficients, change the filter
- **Complexity:** implement filters that are impossible in analog
- **Storage:** record and replay exact signals
- **Compression:** reduce data before transmission

DSP powers your phone, your music player, your Wi-Fi router, your camera, medical imaging, radar.

## Discrete-Time Signals

A discrete-time signal x[n] is defined for integer n only. Between samples, nothing exists (mathematically). In practice, we reconstruct continuous signals via interpolation.

Common signals:
- **Unit impulse δ[n]:** 1 at n=0, 0 elsewhere
- **Unit step u[n]:** 1 for n≥0, 0 for n<0
- **Exponential:** x[n] = a^n
- **Sinusoid:** x[n] = A cos(Ωn + φ)
- **Complex exponential:** x[n] = e^(jΩn)

## The Key Difference: Frequency is Periodic

For continuous sinusoids, cos(ωt) has a unique frequency ω ∈ [0, ∞). For discrete sinusoids, cos(Ωn) is periodic in Ω with period 2π:

    cos((Ω + 2π)n) = cos(Ωn + 2πn) = cos(Ωn)

So Ω and Ω+2πk describe the same signal. Only Ω ∈ [0, π] is unique. The range [π, 2π] is symmetric with [0, π].

This is a fundamental difference. It leads to aliasing and the Nyquist limit.

## Basic Operations

**Time shift:** y[n] = x[n - n0]. Delays the signal.

**Time reversal:** y[n] = x[-n].

**Scaling:** y[n] = A × x[n].

**Addition:** y[n] = x1[n] + x2[n].

**Multiplication:** y[n] = x1[n] × x2[n]. This is important in modulation.

## LTI Systems and Convolution

A system is Linear and Time-Invariant (LTI) if:
- Superposition holds
- Behavior doesn't change with time

LTI systems are fully described by their **impulse response** h[n].

Output for any input x[n]:

    y[n] = x[n] * h[n] = Σ_{k=-∞}^{∞} x[k] h[n-k]

Convolution. This is the fundamental operation of DSP.

## Stability and Causality

**Causal:** h[n] = 0 for n < 0. Cannot respond to future inputs.

**BIBO stable:** Bounded input → Bounded output. Condition: Σ|h[n]| < ∞.

Causal + BIBO stable is the standard for real-time DSP.

## Difference Equations

LTI systems are described by difference equations:

    y[n] = -a1 y[n-1] - a2 y[n-2] + b0 x[n] + b1 x[n-1] + b2 x[n-2]

This is the general IIR (Infinite Impulse Response) form. If all a's are zero, it's FIR (Finite Impulse Response).

## FIR vs IIR

**FIR:** h[n] has finite length. Always stable. Can have exact linear phase. More computation.

**IIR:** h[n] infinite (feedback). Can be unstable. Nonlinear phase usually. Less computation for sharp filters.

FIR for audio, IIR for control.

## Example: Moving Average

    y[n] = (x[n] + x[n-1] + x[n-2] + x[n-3]) / 4

FIR filter with h = [0.25, 0.25, 0.25, 0.25]. Low-pass, simple smoothing.

Length L moving average: cutoff at approximately fs/L.

## Example: One-Pole IIR

    y[n] = α × x[n] + (1 - α) × y[n-1]

Alpha close to 1: slow smoothing. Alpha close to 0: fast smoothing.

This is an exponential moving average. Simple, efficient low-pass filter.

## Key Takeaways

- Discrete signals defined for integer n only
- Frequency is periodic with period 2π
- LTI systems described by impulse response
- Convolution: y = x * h
- Difference equations describe LTI systems
- FIR (finite) vs IIR (feedback)
- DSP gives reproducibility, flexibility, complexity
$LEC$, 50),

('dsp', 2, 'The Z-Transform and Transfer Functions', $LEC$
## Why the Z-Transform?

Just as the Laplace transform handles continuous-time systems, the Z-transform handles discrete-time systems. It converts difference equations into algebraic equations, making analysis and design much easier.

## Definition

For a discrete-time signal x[n]:

    X(z) = Σ_{n=-∞}^{∞} x[n] z^(-n)

where z is a complex variable. The set of z values for which the sum converges is the Region of Convergence (ROC).

## Common Transforms

| x[n] | X(z) |
|------|------|
| δ[n] | 1 |
| u[n] | z/(z-1) |
| a^n u[n] | z/(z-a) |
| n a^n u[n] | az/(z-a)² |
| cos(Ω0 n) u[n] | (z² - z cos Ω0) / (z² - 2z cos Ω0 + 1) |

## Properties

**Linearity:** a x1[n] + b x2[n] ↔ a X1(z) + b X2(z)

**Time shift:** x[n - n0] ↔ z^(-n0) X(z)

**Scaling in z:** a^n x[n] ↔ X(z/a)

**Time reversal:** x[-n] ↔ X(1/z)

**Convolution:** x[n] * h[n] ↔ X(z) × H(z)

**Initial value:** x[0] = lim(z→∞) X(z)

The convolution property is the most important. It turns convolution into multiplication.

## Transfer Function

For an LTI system with input x[n] and output y[n]:

    H(z) = Y(z) / X(z)

For a difference equation:

    y[n] = Σ b_k x[n-k] - Σ a_k y[n-k]

The transfer function is:

    H(z) = (Σ b_k z^(-k)) / (1 + Σ a_k z^(-k))

The numerator gives the zeros, the denominator gives the poles.

## Poles and Stability

For a causal system, it's BIBO stable if all poles are **inside the unit circle** (|z| < 1).

This is the discrete-time analog of "poles in the left half-plane" for continuous systems.

Poles on the unit circle: marginally stable (oscillates forever).
Poles outside the unit circle: unstable (exponential growth).

## Example: One-Pole System

    y[n] = α x[n] + (1-α) y[n-1]

Taking Z-transform:

    Y(z) = α X(z) + (1-α) z^(-1) Y(z)

    H(z) = α / (1 - (1-α) z^(-1))

Pole at z = 1 - α. For 0 < α < 1, pole is inside unit circle → stable.

For α = 0.1, pole at 0.9. Slow decay.
For α = 0.9, pole at 0.1. Fast decay.

## Frequency Response

Evaluate H(z) on the unit circle (z = e^(jΩ)):

    H(e^(jΩ)) = H(z) |_{z = e^(jΩ)}

This gives the frequency response — the gain and phase for each digital frequency Ω.

|H(e^(jΩ))| is the magnitude response.
∠H(e^(jΩ)) is the phase response.

Plot vs Ω from 0 to π (higher frequencies are symmetric).

## Geometric Interpretation

The frequency response is the product of distances from e^(jΩ) to each zero, divided by distances to each pole.

Zeros near the unit circle → dips in magnitude response.
Poles near the unit circle → peaks in magnitude response.

## Stability Condition Revisited

For an IIR filter, stability requires all poles inside the unit circle. If even one pole is outside, the filter is unstable and useless.

In practice, design with margins — poles 0.99 or less.

## Key Takeaways

- Z-transform converts difference equations to algebra
- Transfer function H(z) = Y(z)/X(z)
- Poles and zeros determine frequency response
- Stable iff all poles inside unit circle
- Frequency response: H(e^(jΩ))
- Geometric interpretation: distances from poles and zeros
- Design with pole margins for robustness
$LEC$, 50),

('dsp', 3, 'The Discrete Fourier Transform and FFT', $LEC$
## From Continuous to Discrete Frequency

We've seen the Fourier series for periodic signals, the Fourier transform for aperiodic, and the DTFT for discrete signals. Now: the DFT, which is what computers actually compute.

## The Discrete Fourier Transform

For a length-N sequence x[0..N-1]:

    X[k] = Σ_{n=0}^{N-1} x[n] e^(-j 2π k n / N),  k = 0, 1, ..., N-1

The inverse:

    x[n] = (1/N) Σ_{k=0}^{N-1} X[k] e^(j 2π k n / N)

The DFT transforms N time samples into N frequency samples.

## Why N Samples?

The DFT assumes x[n] is periodic with period N. The frequency resolution is fs/N Hz. The maximum frequency represented is fs(N-1)/N ≈ fs/2 (Nyquist).

For a 1024-point DFT at 44.1 kHz:
- Frequency resolution: 43 Hz
- Frequency range: 0 to ~22 kHz

## DFT as Matrix Multiplication

    X = W × x

where W is the N×N DFT matrix with entries W[k][n] = e^(-j 2π k n / N).

Computing this naively takes O(N²) operations.

## The FFT

The Fast Fourier Transform (Cooley-Tukey, 1965) computes the DFT in O(N log N).

For N = 1,048,576:
- Naive DFT: 10¹² operations
- FFT: 2 × 10⁷ operations

A 50,000x speedup. This is why FFT made DSP practical.

## The FFT Algorithm (Radix-2)

Split length-N sequence into even and odd indices:

    X[k] = Σ x[2m] e^(-j 2π k (2m) / N) + Σ x[2m+1] e^(-j 2π k (2m+1) / N)
         = E[k] + e^(-j 2π k / N) O[k]

where E is the DFT of the even-indexed subsequence and O of the odd.

Recursively split until length-1. Combine results. Total complexity O(N log N).

Requires N to be a power of 2 (or a product of small primes).

## Properties

**Linearity:** DFT of ax + by is aX + bY.

**Parseval:** Σ|x[n]|² = (1/N) Σ|X[k]|². Energy preserved.

**Convolution:** Circular convolution in time = multiplication in frequency.

This is used for fast convolution (multiply in frequency, IFFT back).

## Circular vs Linear Convolution

DFT computes **circular** convolution, not linear. For linear convolution via FFT, zero-pad to at least length(x) + length(h) - 1.

This is the standard technique for fast FIR filtering.

## Windowing

The DFT assumes the signal is periodic. If you chop a longer signal into blocks, discontinuities at block edges cause spectral leakage.

Apply a window (Hamming, Hann, Blackman) before the DFT to reduce leakage. Trade-off: narrower main lobe vs lower side lobes.

## Applications

- **Spectrum analysis:** identify frequencies in a signal
- **Fast convolution:** for FIR filters
- **OFDM:** modulation for Wi-Fi, 4G/5G
- **Audio processing:** pitch shifting, time stretching
- **Image processing:** JPEG uses 2D DCT (related to DFT)
- **Radar:** matched filtering
- **Astronomy:** pulsar detection
- **Medical:** CT reconstruction

## The FFT in Practice

Libraries: FFTW, KissFFT, CMSIS-DSP (ARM), Intel MKL.

On an MCU (Cortex-M4 with FPU): 1024-point FFT in ~1 ms.

For real-time audio: 1024-point FFT at 44.1 kHz, block rate ~43 Hz.

## Key Takeaways

- DFT: N samples → N frequency samples
- O(N²) naive, O(N log N) with FFT
- FFT is what makes DSP practical
- Circular convolution via DFT; zero-pad for linear
- Windowing reduces spectral leakage
- FFT is universal: audio, image, radar, communications
- Libraries handle the implementation; you focus on the application
$LEC$, 50),

('dsp', 4, 'FIR Filter Design', $LEC$
## What is an FIR Filter?

Finite Impulse Response: h[n] is nonzero only for a finite range.

    y[n] = Σ_{k=0}^{M-1} h[k] × x[n-k]

M is the filter length. Output is a weighted sum of the last M inputs.

FIR filters are always stable (no feedback) and can have exactly linear phase.

## The Ideal Low-Pass Filter

In frequency domain, ideal low-pass:

    H(e^(jΩ)) = 1 for |Ω| < Ωc
                 0 for Ωc < |Ω| < π

Taking the inverse DTFT gives an infinite sinc impulse response:

    h[n] = sin(Ωc n) / (π n)

Truncate to length M for a real FIR filter. Truncation causes ripples (Gibbs phenomenon).

## Windowing Method

Multiply the ideal impulse response by a window w[n]:

    h_windowed[n] = h_ideal[n] × w[n]

Common windows:
- **Rectangular:** sharp cutoff, big ripples
- **Hamming:** good compromise, 43 dB side lobe
- **Hann:** smoother, 31 dB side lobe
- **Blackman:** best side lobes, widest main lobe

Trade-off: narrower main lobe (sharper transition) means higher side lobes (worse stopband).

## Example Design

Design a low-pass FIR with:
- Cutoff: 1 kHz
- Sample rate: 8 kHz
- Length: 65 taps
- Window: Hamming

Normalized cutoff: Ωc = 2π × 1000/8000 = π/4.

Ideal: h_ideal[n] = sin(π n/4) / (π n), truncated to 65 taps (centered at n = 32).

Apply Hamming window. Result: sharp transition at 1 kHz, stopband attenuation ~53 dB.

## Parks-McClellan Algorithm

Optimal equiripple FIR design. Gives the best possible filter for a given length and tolerance.

Instead of settling for window side lobes, distribute the error uniformly across the band.

Requires an iterative optimization (Remez exchange).

Available in MATLAB (`firpm`), Python (`scipy.signal.remez`), and other tools.

## Linear Phase FIR

If h[n] is symmetric (h[n] = h[M-1-n]) or antisymmetric, the filter has exactly linear phase.

Linear phase = constant group delay = no phase distortion.

Critical for audio, image processing, communications.

Linear phase requires FIR (IIR cannot have exactly linear phase).

## Types of Linear Phase FIR

Four types based on symmetry and length:
- **Type I:** even length, symmetric — good for lowpass
- **Type II:** even length, antisymmetric — good for highpass
- **Type III:** odd length, symmetric — good for bandpass
- **Type IV:** odd length, antisymmetric — good for differentiators

## Moving Average Filter

Simplest FIR: h[n] = 1/M for n = 0..M-1.

Low-pass with cutoff ~fs/M. Poor transition but simple and efficient.

Useful for smoothing noisy sensors.

## Bandpass and Highpass

Design a lowpass prototype, then frequency-shift:

    h_bp[n] = 2 h_lp[n] cos(Ω0 n)

For highpass:

    h_hp[n] = δ[n] - h_lp[n]

Modular design — build from lowpass prototype.

## Implementation

Direct form:

    y[n] = h[0] x[n] + h[1] x[n-1] + ... + h[M-1] x[n-M+1]

Use a circular buffer for x[]:

    x[head] = new_input;
    head = (head + 1) % M;
    sum = 0;
    for (int i = 0; i < M; i++) {
        sum += h[i] * x[(head - i + M) % M];
    }

For high-performance, use SIMD or a DSP with dedicated MAC units.

## Fixed-Point vs Floating-Point

DSPs often use fixed-point for speed and cost.
- Q15: 1 sign bit + 15 fractional bits, range [-1, 1)
- Q31: 32-bit fixed-point

Careful with scaling to avoid overflow. Coefficient quantization affects the response slightly.

## Key Takeaways

- FIR: finite, always stable, can be linear phase
- Design by windowing or Parks-McClellan
- Linear phase requires symmetric h[n]
- Moving average: simplest FIR
- Build bandpass/highpass from lowpass prototype
- Circular buffer for streaming
- Fixed-point for embedded, float for desktop
- Linear phase essential for audio and images
$LEC$, 50),

('dsp', 5, 'Adaptive Filters and Applications', $LEC$
## What Are Adaptive Filters?

A filter whose coefficients change over time to optimize some performance criterion. Used when the signal statistics are unknown or time-varying.

Examples:
- Echo cancellation in phones
- Channel equalization in modems
- Noise cancellation in headphones
- System identification
- Beamforming in radar
- Active vibration control

## The General Structure

Input x[n], desired signal d[n]. Filter produces y[n] = w^T x[n]. Error e[n] = d[n] - y[n]. Update weights to minimize E[e²[n]].

## The LMS Algorithm

Least Mean Squares: simplest adaptive filter.

For each sample:

    y[n] = w^T x[n]
    e[n] = d[n] - y[n]
    w[n+1] = w[n] + μ e[n] x[n]

μ is the step size. Small μ: slow but stable. Large μ: fast but may diverge.

Stability: μ < 2 / (M × P_x), where P_x is the input power.

## Example: Noise Cancellation

Reference microphone captures noise. Main microphone captures signal + noise. Adaptive filter estimates noise from reference and subtracts.

Classic application: Bose noise-canceling headphones.

## Echo Cancellation

In a phone call, the far-end signal echoes back through the local speaker-microphone path. An adaptive filter estimates the echo path and subtracts it.

Long echo paths (100+ ms) require 1000+ taps. Uses NLMS (normalized LMS) for faster convergence.

## Channel Equalization

In a communication channel, the received signal is distorted. Adaptive filter inverts the channel to recover the transmitted data.

Used in modems, DSL, wireless.

Training phase: send known sequence, adapt filter to match. Data phase: use adapted filter to equalize.

## Recursive Least Squares (RLS)

Converges faster than LMS. Uses the inverse of the autocorrelation matrix.

    w[n+1] = w[n] + k[n] e[n]

where k[n] = R^(-1)[n] x[n].

Complexity: O(M²) per sample vs O(M) for LMS. Faster convergence but more computation.

## Applications

**Active Noise Cancellation (ANC):**
- Feedforward: reference mic + error mic
- Feedback: only error mic
- Hybrid: both

Used in headphones, cars, HVAC ducts.

**Adaptive Beamforming:**
- Multiple antennas
- Adaptive weights to steer null toward interference
- Used in radar, sonar, 5G massive MIMO

**Adaptive Predistortion:**
- Compensate for nonlinear power amplifier
- Used in 5G base stations

**Adaptive Control:**
- Self-tuning regulators
- Model Reference Adaptive Control (MRAC)

## Convergence and Misadjustment

LMS converges when input is stationary. The final error has two parts:
- Minimum mean-square error (unavoidable)
- Misadjustment (from gradient noise)

Trade-off: larger μ → faster convergence, higher misadjustment.

Rule of thumb: μ ≈ 0.01 / (M × P_x) for reasonable balance.

## Modern Extensions

- **NLMS:** normalized step size, more robust
- **AP (Affine Projection):** between LMS and RLS
- **Kalman filter:** optimal for linear Gaussian systems
- **Deep learning:** replace adaptive filters with neural networks for very complex problems

## DSP in Practice

Real-time DSP requires:
- Efficient algorithms (LMS, FFT, convolution)
- Fixed-point or SIMD optimized code
- Interrupt-driven I/O (ADC, DAC, DMA)
- Ring buffers for streaming
- Careful attention to latency

An ESP32 can run 48 kHz stereo audio filters. A dedicated DSP (TI C6000) runs GHz-rate processing. GPU tensors handle AI.

## Key Takeaways

- Adaptive filters optimize coefficients online
- LMS: simple, O(M) per sample, μ controls trade-off
- RLS: fast convergence, O(M²) per sample
- Applications: noise cancel, echo cancel, equalization
- ANC uses adaptive filters for anti-noise
- Beamforming steers nulls toward interference
- Modern deep learning complements classic DSP
- Real-time DSP needs efficient implementation
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- OPERATING SYSTEMS (MIT 6.S081) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('operating-systems', 1, 'Introduction to Operating Systems', $LEC$
## What is an Operating System?

An OS is software that manages hardware resources and provides services to applications. It's the layer between your code and the bare metal.

Components:
- **Kernel:** the core, runs in privileged mode
- **Shells and utilities:** user-facing tools
- **Libraries:** standard functions (libc)
- **System calls:** interface from user to kernel

Examples: Linux, Windows, macOS, FreeBSD, xv6 (teaching OS).

## Why Do We Need an OS?

Multiple programs want to run simultaneously. They compete for:
- CPU time
- Memory
- Disk space
- Network bandwidth
- I/O devices

The OS multiplexes these resources, ensures isolation, and provides abstractions.

## The Three Big Ideas

**Virtualization:** each process thinks it has the machine to itself. The OS multiplexes the CPU, memory, disk.

**Concurrency:** many activities happen at once. The OS must coordinate them safely.

**Persistence:** data survives across crashes and reboots. The OS provides filesystems.

## Kernel Mode vs User Mode

CPUs have at least two privilege levels:
- **Kernel mode (Ring 0):** can execute any instruction, access any memory
- **User mode (Ring 3):** limited instruction set, restricted memory

System calls transition from user to kernel mode. The CPU switches privilege, jumps to the kernel's handler, then returns.

This protects the kernel from misbehaving applications.

## Processes

A process is a running program with:
- Address space (virtual memory)
- Threads of execution
- Open file descriptors
- Registers, stack, heap
- PID, parent, children

The OS switches between processes using a **context switch**: save one process's state, load another's.

Context switch overhead: 1-5 microseconds typically.

## System Calls

The interface from user programs to the kernel:

- **Process:** fork, exec, wait, exit, getpid
- **File:** open, read, write, close, lseek, stat
- **Memory:** mmap, brk, sbrk
- **Network:** socket, bind, listen, accept
- **IPC:** pipe, shmget, msgget

POSIX defines a standard API implemented by most Unix-like systems.

## Example: Running `ls`

1. Shell forks a child process
2. Child calls exec("ls")
3. Kernel loads ls binary, sets up its address space
4. ls runs, opens the current directory (open syscall)
5. ls reads directory entries (getdents syscall)
6. For each entry, ls calls stat to get metadata
7. ls writes output to stdout (write syscall)
8. ls exits, kernel notifies parent
9. Shell prints prompt

Hundreds of syscalls for a simple command.

## The Kernel Interface

Applications should never call the kernel directly. They use libc wrappers:

    // C code
    fd = open("/etc/passwd", O_RDONLY);
    
    // Assembly equivalent (x86-64)
    mov $2, %rax          ; SYS_open
    lea filename(%rip), %rdi
    mov $0, %rsi          ; O_RDONLY
    syscall

The wrapper handles the syscall instruction and error return.

## Monolithic vs Microkernel

**Monolithic kernel:** all OS services in kernel space. Linux, Windows, xv6.

Pros: fast (no message passing). Cons: less isolation, harder to debug.

**Microkernel:** only essential services (scheduling, IPC, memory) in kernel. Servers in user space. QNX, L4, Mach.

Pros: better isolation, more modular. Cons: slower IPC.

**Hybrid:** most in kernel, some as servers. macOS (XNU).

## Layered OS Structure

Modern OS architecture (bottom to top):
1. Hardware
2. Kernel (memory, processes, drivers)
3. System calls
4. Libraries (libc, libc++)
5. Applications

Each layer trusts the one below, provides services to the one above.

## Key Takeaways

- OS = manager of hardware + provider of services
- Virtualization, concurrency, persistence are the three big ideas
- Kernel mode vs user mode protects the system
- Processes are isolated execution contexts
- System calls are the interface
- Monolithic vs microkernel trade-offs
- Layered architecture scales from phone to server
$LEC$, 50),

('operating-systems', 2, 'Processes and Scheduling', $LEC$
## What is a Process?

A process is a program in execution. It has:
- **Address space:** virtual memory, code, data, heap, stack
- **Thread of control:** PC, registers, stack
- **Resources:** open files, sockets, signals
- **Metadata:** PID, parent PID, owner, priority, state

The kernel maintains a process table (or list of task_struct in Linux).

## Process States

- **New:** being created
- **Ready:** waiting for CPU
- **Running:** executing on CPU
- **Blocked:** waiting for I/O or event
- **Terminated:** finished

Transitions:
- New → Ready: admitted
- Ready → Running: scheduled
- Running → Ready: preempted (time slice)
- Running → Blocked: I/O request or wait
- Blocked → Ready: I/O complete or event
- Running → Terminated: exit

## Context Switch

When the OS switches from process A to process B:

1. Save A's registers to its PCB (process control block)
2. Restore B's registers from its PCB
3. Switch page tables (memory management)
4. Flush TLB (unless tagged)
5. Resume B

Cost: 1-10 µs, depending on architecture. Heavy in virtualized environments.

## fork() — Creating a Process

`fork()` creates a copy of the calling process. Both parent and child continue from the same instruction.

    pid_t pid = fork();
    if (pid == 0) {
        // child
    } else if (pid > 0) {
        // parent (pid is child's PID)
    } else {
        // error
    }

The child gets a copy of the parent's address space (copy-on-write optimization). File descriptors are duplicated.

## exec() — Replacing the Program

`exec()` replaces the current process's image with a new program:

    execl("/bin/ls", "ls", "-l", NULL);

The address space is replaced. Only the PID, open file descriptors, and some signals survive.

## The fork-exec Pattern

To run a program:
1. fork() to create a child
2. Child calls exec() to replace itself
3. Parent wait()s for the child to finish

This is how the shell runs commands.

## wait() — Reaping Children

    int status;
    pid_t pid = wait(&status);

Blocks until a child exits. Returns the child's PID and exit status.

Zombies: children that exited but weren't waited for. Occupy a process slot. Must be reaped.

Orphans: children whose parent exited first. Reparented to init (PID 1).

## Scheduling Algorithms

**FCFS (First-Come First-Served):** simple, non-preemptive. Convoy effect — long jobs block short ones.

**SJF (Shortest Job First):** optimal average wait time. Requires knowing execution time (impossible in advance).

**Round Robin:** each process runs for a time slice (quantum). Fair, responsive.

**Priority:** higher priority runs first. Starvation risk — aging fixes it.

**Multilevel Feedback Queue:** multiple queues with different priorities. Process moves between queues based on behavior. Used in general-purpose OSes.

**CFS (Completely Fair Scheduler):** Linux's current scheduler. Uses a red-black tree keyed by virtual runtime. O(log n) per decision.

## Scheduling Metrics

- **Throughput:** jobs completed per unit time
- **Turnaround time:** from submission to completion
- **Waiting time:** time spent ready, not running
- **Response time:** from submission to first output
- **Fairness:** how evenly CPU is distributed

Different systems optimize different metrics. Batch systems want throughput, interactive systems want response time.

## Threads

A thread is a lightweight unit of execution. Multiple threads share the process's address space.

Benefits:
- Concurrency (overlap I/O with compute)
- Parallelism (use multiple cores)
- Responsiveness (UI thread stays free)

Costs:
- Race conditions (shared data)
- Lock overhead
- Debugging complexity

Kernel threads vs user threads vs hybrid (most common).

## Context Switching Cost

Direct cost: saving/restoring registers (~100 ns).

Indirect cost: cache pollution. Switching between processes touches different memory, evicting cached data. Can cost microseconds in cache misses.

Reducing context switches is a key optimization.

## Key Takeaways

- Process = running program + address space + resources
- fork, exec, wait are the basic primitives
- fork creates, exec replaces, wait reaps
- Many scheduling algorithms, each with trade-offs
- CFS uses virtual runtime and a red-black tree
- Threads share address space, process switch is heavier
- Context switch cost includes cache pollution
$LEC$, 50),

('operating-systems', 3, 'Virtual Memory and Paging', $LEC$
## The Problem

Each process wants its own private address space. Physical memory is shared and limited.

Solution: virtual memory. The CPU translates virtual addresses to physical addresses. Each process sees a large, contiguous, private space.

## Benefits

- **Isolation:** process A can't read B's memory
- **Protection:** read-only regions enforced by hardware
- **Flexibility:** programs don't need physical layout
- **Overcommit:** sum of virtual spaces > physical RAM
- **Sharing:** libraries mapped read-only into many processes

## Pages and Frames

Virtual memory is divided into fixed-size **pages** (typically 4 KB).
Physical memory is divided into **frames** of the same size.

    Virtual address: [ VPN | offset ]
    Physical address: [ PFN | offset ]

The offset is copied directly. The page number is translated via the page table.

On x86-64: 48-bit virtual (256 TB), 52-bit physical (4 PB). 4 KB pages.

## Page Tables

A page table is an array of **page table entries (PTEs)**. Each PTE contains:
- Physical frame number
- Valid bit
- Read/write/execute permissions
- Accessed and dirty bits
- Cache control bits

Flat page table for 48-bit virtual with 4 KB pages: 2^36 × 8 bytes = 512 GB. Impossible.

## Multi-Level Page Tables

Split the virtual address into pieces. Each level indexes a smaller table.

For 48-bit addresses, 4-level page table:
    [ PGD 9b | PUD 9b | PMD 9b | PTE 9b | offset 12b ]

Each table has 512 entries × 8 bytes = 4 KB (one page).

Sparse allocation: unused address ranges have null pointers. Typically a few MB per process.

## The TLB

Every memory access requires a page table walk (4 reads). That's 4x slower.

Solution: the Translation Lookaside Buffer. A small cache of recent translations. Typically 32-2048 entries, fully associative.

TLB hit: translation is essentially free.
TLB miss: walk the page table (~20-100 cycles).

Hit rate >99% typical because of locality.

## Page Faults

If the VPN has no valid PTE:

1. CPU raises page fault exception
2. Kernel's page fault handler runs
3. If page is in swap: allocate frame, read from disk, update PTE, return
4. If page is illegal: send SIGSEGV to process

Page fault cost: ~1-10 microseconds (dominated by disk I/O).

## Demand Paging

Don't load pages until accessed. Lazy allocation.

Advantages:
- Faster program startup
- Less memory used
- Allows overcommit

Disadvantages:
- Page faults during execution
- Must track which pages are on disk

## Page Replacement

When physical memory is full, evict a page.

**OPT (Belady):** evict page used furthest in future. Optimal but unimplementable.

**LRU:** evict least recently used. Good but expensive to track.

**Clock:** approximate LRU with a reference bit. Used in Linux.

**FIFO:** simple but can exhibit Belady's anomaly.

Linux uses a variant of LRU with active/inactive lists.

## Working Set

The set of pages a process is actively using. If physical memory ≥ sum of working sets, no thrashing. If < , thrashing — pages are evicted before they're reused.

Detect: high page fault rate. Fix: reduce multiprogramming (swap out processes) or add memory.

## Copy-on-Write (COW)

When fork() is called, don't copy all pages. Mark them read-only and shared. On write, copy the page and update the PTE.

Benefits:
- fork is fast
- Memory shared until modified
- Used by Linux, macOS, Windows

## Memory-Mapped Files

Map a file into the address space:

    void *addr = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, offset);

Access the file like memory. Kernel handles paging.

Used for:
- Executables (text and data sections)
- Shared libraries
- Databases (SQLite uses mmap)
- Shared memory between processes

## Huge Pages

Standard 4 KB pages require many TLB entries. Huge pages (2 MB or 1 GB) cover more memory per entry.

Used for:
- Databases (MySQL, PostgreSQL)
- Virtual machines
- Scientific computing

Trade-off: internal fragmentation (page is allocated whole).

## Swapping

When memory is overcommitted, evict pages to disk. Linux uses swap files or partitions.

Cost: 1-10 ms per page (SSD) to 10-100 ms (HDD). Minimize swapping for performance.

## Key Takeaways

- Virtual memory gives isolation and flexibility
- Multi-level page tables save memory
- TLB makes translation fast in the common case
- Page faults handle missing pages
- Demand paging allows overcommit
- LRU/Clock for replacement
- COW speeds up fork
- mmap for file-backed memory
- Huge pages reduce TLB pressure
- Swapping is expensive
$LEC$, 50),

('operating-systems', 4, 'Concurrency and Synchronization', $LEC$
## Why Concurrency?

Multiple threads or processes need to coordinate access to shared resources: memory, files, devices.

Without synchronization, race conditions occur — the result depends on timing.

## Race Condition Example

Two threads increment a shared counter:

    counter = counter + 1;

In assembly:
    load  r1, [counter]
    add   r1, r1, 1
    store r1, [counter]

If both threads execute simultaneously:

    Thread A              Thread B              counter
    load r1 = 0
                          load r1 = 0         0
    add r1 = 1
                          add r1 = 1
    store [counter] = 1
                          store [counter] = 1  1 (lost update!)

Expected: 2. Got: 1. Classic race condition.

## Critical Section

The part of code that must run atomically (no interleaving).

Solution properties:
- **Mutual exclusion:** only one thread in CS at a time
- **Progress:** if no thread in CS and one wants in, it gets in
- **Bounded waiting:** a waiting thread eventually enters

## Locks (Mutexes)

    lock(m);
    // critical section
    unlock(m);

A mutex ensures only one thread in the CS.

Implementation requires hardware support:
- **Test-and-set:** atomically sets a flag and returns old value
- **Compare-and-swap (CAS):** atomically compares and swaps

    while (test_and_set(&lock)) { /* spin */ }
    // critical section
    lock = 0;

Spinlock: busy-wait. Good for short critical sections on multicore.

Blocking lock: put waiting threads to sleep, wake on release. Better for long CS.

## Semaphores

Dijkstra's semaphore: an integer with two atomic operations:

    P(s): wait until s > 0, then s--  (Dutch: proberen)
    V(s): s++                        (Dutch: verhogen)

Used for:
- Mutual exclusion (s initialized to 1)
- Signaling between threads (s initialized to 0)
- Resource counting (s initialized to N)

## Condition Variables

Wait for a condition to become true:

    pthread_mutex_lock(&m);
    while (!condition) {
        pthread_cond_wait(&c, &m);
    }
    // condition is true
    pthread_mutex_unlock(&m);

    // In another thread:
    pthread_mutex_lock(&m);
    condition = 1;
    pthread_cond_signal(&c);
    pthread_mutex_unlock(&m);

Always wait in a loop. Spurious wakeups are allowed.

## Monitors

Higher-level abstraction: a lock + condition variables bundled with data. Languages like Java provide synchronized methods.

    public synchronized void deposit(int amount) {
        balance += amount;
        notifyAll();
    }

The compiler inserts lock/unlock automatically.

## Classic Problems

**Producer-Consumer:**
- Bounded buffer
- Producers wait if full, consumers wait if empty
- Uses a mutex + two condition variables

**Readers-Writers:**
- Multiple readers can access simultaneously
- Writers need exclusive access
- Variants: reader-priority, writer-priority

**Dining Philosophers:**
- Five philosophers, five forks
- Each needs two forks to eat
- Deadlock if all grab left fork simultaneously

## Deadlock

Four conditions for deadlock (all must hold):
1. Mutual exclusion
2. Hold and wait
3. No preemption
4. Circular wait

Break any one to prevent deadlock.

Solutions:
- **Prevention:** eliminate one of the four conditions
- **Avoidance:** Banker's algorithm (rarely used)
- **Detection and recovery:** find cycles, kill a process
- **Ignore:** most OSes do this

## Atomic Operations

Hardware provides primitives:
- Compare-and-swap (CAS)
- Fetch-and-add
- Load-linked / store-conditional (LL/SC, ARM, RISC-V)

Lock-free data structures use these to avoid locks entirely. Powerful but tricky.

## Memory Barriers

Modern CPUs reorder memory operations for performance. A barrier forces ordering:

    store x
    barrier
    store y

Ensures store to y doesn't happen before store to x from another core's view.

Critical for lock-free code and device drivers.

## Concurrency Bugs

- **Race condition:** timing-dependent result
- **Deadlock:** circular wait
- **Livelock:** threads keep retrying, no progress
- **Starvation:** a thread never gets to run
- **Priority inversion:** low-priority thread holds lock needed by high-priority

Careful design and tools (ThreadSanitizer, Helgrind) help.

## Key Takeaways

- Race conditions arise from unsynchronized access
- Locks, semaphores, condition variables synchronize
- Monitors for higher-level abstraction
- Classic problems: producer-consumer, readers-writers, dining philosophers
- Deadlock: four conditions, break any one
- Atomics and barriers for lock-free code
- Many concurrency bugs; use tools
$LEC$, 50),

('operating-systems', 5, 'File Systems and Persistence', $LEC$
## What is a File System?

A file system organizes data on persistent storage (disk, SSD). It provides:
- Named files
- Hierarchical directories
- Byte-addressable files
- Metadata (permissions, timestamps)
- Atomic operations (rename)

The filesystem is an abstraction over block devices.

## Block Devices

Disks expose a linear array of fixed-size blocks (typically 512 B or 4 KB).

Operations:
- Read a block
- Write a block

The filesystem maps file operations to block operations.

## The File Abstraction

A file is a sequence of bytes with a name. The kernel maintains:
- **inode:** metadata (size, permissions, timestamps, block pointers)
- **dentry:** directory entry (name → inode)
- **file descriptor:** per-process open file handle (offset, mode)

## Directory Structure

A directory is a special file that maps names to inodes.

    /home/alice/Documents/report.pdf

Lookup: start at root inode, find "home", then "alice", then "Documents", then "report.pdf".

Each lookup is a filesystem operation. Path walk can be slow. Caches (dentry cache) help.

## inodes

The inode stores:
- File type (regular, directory, symlink, device)
- Size in bytes
- Owner, group, permissions
- Timestamps (atime, mtime, ctime)
- Link count
- Pointers to data blocks

In ext4: 12 direct pointers + 1 single indirect + 1 double indirect + 1 triple indirect.

Small files (≤12 blocks) fit entirely in direct pointers. Large files use indirect blocks.

## Block Allocation

**Contiguous:** simple, fast, but fragmentation. Rare in practice.

**Linked:** each block points to next. Simple but slow random access.

**Indexed:** inode points to blocks. Common (ext, XFS).

**Extent-based:** inode stores extents (start block + length). Reduces metadata for large files. Used in ext4, XFS, btrfs.

## Free Space Management

Track which blocks are free:
- **Bitmap:** one bit per block. Simple, fast.
- **Free list:** linked list of free blocks.

Bitmaps are common in modern filesystems.

## Journaling

A crash during a write can leave the filesystem inconsistent. Journaling prevents this.

Write the intended change to a **journal** (log) first, then apply to the actual location.

On crash, replay the journal — the change is either fully done or not at all.

Modes:
- **writeback:** journal only metadata
- **ordered:** metadata journaled, data written before metadata
- **journal:** everything journaled (slowest, safest)

ext4, XFS, NTFS use journaling.

## Log-Structured File Systems

Alternative: never overwrite. Always write to fresh locations. Old versions become garbage, collected later.

Benefits:
- Sequential writes (good for SSD)
- Fast crash recovery (only check the tail)
- Snapshots easy

Used in: NILFS2, F2FS, and (partially) in ZFS.

## Copy-on-Write (CoW) Filesystems

Modify by writing new copies, never overwrite existing blocks.

Benefits:
- Atomic updates (write new tree, swap root pointer)
- Easy snapshots
- Data integrity (checksums)

Used in: ZFS, btrfs.

## SSD-Specific Optimizations

SSDs have unique characteristics:
- No seek time (random = sequential)
- Limited write cycles per cell
- Must erase blocks before writing
- **Wear leveling:** spread writes evenly

Filesystems for SSD: **F2FS** (Flash-Friendly File System), designed by Samsung.

TRIM: OS tells SSD which blocks are free. Improves performance and longevity.

## The Read/Write Path

When you call read(fd, buf, n):

1. Look up fd in process's file table → file struct
2. Get offset from file struct
3. Look up inode in inode cache
4. Translate offset to block numbers
5. Check page cache for those blocks
6. If hit: copy from page cache to buf
7. If miss: read from disk into page cache, then copy

The page cache is critical for performance. Most reads hit it.

Writes go to the page cache first ("write-back" caching). Synced to disk later.

## fsync() and Durability

By default, writes are not immediately durable. To force:

    fsync(fd);  // flush file data to disk
    fdatasync(fd);  // flush data, skip metadata if safe

Essential for databases, editors.

## fsck — File System Check

After a crash, run fsck to verify consistency:
- inode link counts
- Block allocation bitmaps
- Directory structure
- Free inode counts

Journaling filesystems avoid long fsck — replay is faster.

## Modern Filesystems

- **ext4:** Linux default. Stable, mature.
- **XFS:** Linux, high-performance parallel.
- **btrfs:** Linux, CoW, snapshots, checksums.
- **ZFS:** Solaris, FreeBSD, Linux. Powerful, complex.
- **APFS:** macOS. Snapshots, encryption.
- **NTFS:** Windows. Journaling, ACLs.

## Distributed Filesystems

- **NFS:** network file system, POSIX-like
- **SMB/CIFS:** Windows file sharing
- **HDFS:** Hadoop distributed file system
- **Ceph:** scalable distributed storage
- **S3:** object storage (not a filesystem)

## Key Takeaways

- File systems abstract block devices
- inodes + dentries + file descriptors
- Block allocation: indexed, extent-based
- Journaling for crash consistency
- Log-structured and CoW for special cases
- SSD-optimized: F2FS, TRIM, wear leveling
- Page cache is critical for performance
- fsync for durability
- Many filesystems for different needs
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('dsp', 'operating-systems')
group by course_slug;