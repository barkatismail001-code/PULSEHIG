-- ============================================================
-- Batch 7: MIT 6.004 + MIT 6.013 + MIT 6.115
-- ============================================================

-- ============================================================
-- COMPUTATION STRUCTURES (MIT 6.004) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('digital-design', 1, 'Digital Abstraction and Boolean Logic', $LEC$
## The Digital Abstraction

Digital circuits don't exist. Every wire carries an analog voltage that could, in principle, take any value. The digital abstraction is a discipline we impose on top of that:

- Any voltage below V_IL is interpreted as logical 0
- Any voltage above V_IH is interpreted as logical 1
- The circuit must produce outputs below V_OL or above V_OH

The gaps V_IL - V_OL and V_OH - V_IH are the noise margins NM_L and NM_H. They let us ignore noise, crosstalk, and process variation as long as the noise stays below the margins.

## Why Digital?

Analog circuits amplify, filter, and process continuous signals. Digital circuits are robust, scalable, and programmable. Moore's law exists because digital circuits can shrink to nanometer dimensions while retaining their function. Analog circuits cannot.

Digital is a contract: as long as we honor the voltage thresholds, the circuit works.

## Boolean Algebra

Proposed by George Boole (1854). Variables take values in {0, 1}. Operations:

- AND: A AND B (1 if both are 1)
- OR: A OR B (1 if either is 1)
- NOT: inverts

Derived:
- NAND: NOT (A AND B)
- NOR: NOT (A OR B)
- XOR: A XOR B (1 if A != B)

## Truth Tables

Every boolean function of n variables is defined by a table with 2^n rows. Example, XOR:

    A | B | A XOR B
    0 | 0 | 0
    0 | 1 | 1
    1 | 0 | 1
    1 | 1 | 0

## Boolean Identities

- Commutative: A+B = B+A, A·B = B·A
- Associative: (A+B)+C = A+(B+C)
- Distributive: A(B+C) = AB + AC
- Identity: A + 0 = A, A · 1 = A
- Complement: A + NOT A = 1, A · NOT A = 0
- Idempotent: A + A = A, A · A = A
- Absorption: A + AB = A
- De Morgan: NOT(A+B) = NOT A · NOT B, NOT(A·B) = NOT A + NOT B

De Morgan is the most useful for circuit simplification.

## Sum of Products (SOP)

Any boolean function can be written as an OR of AND terms, one per row of the truth table where the output is 1. This is the canonical SOP form.

Example: XOR = (NOT A)·B + A·(NOT B)

## Karnaugh Maps

A graphical tool for minimizing boolean expressions. Arrange the truth table in a 2D grid with Gray-coded rows and columns (adjacent cells differ by one bit). Find the largest power-of-2 groups of 1s. Each group becomes one product term.

Example: minimize F(A,B,C) = sum of minterms 1, 3, 5, 7:
- Group all four cells: F = C
- Massive simplification.

## Logic Gates

Physical implementations of boolean operations:
- CMOS: complementary pull-up (PMOS) and pull-down (NMOS) networks
- TTL: bipolar transistors (legacy)
- Static CMOS is the dominant technology

NAND and NOR are the universal gates - any boolean function can be built from NAND alone (or NOR alone).

## Key Takeaways

- Digital abstraction imposes thresholds for robustness
- Noise margins enable reliable operation
- Boolean algebra is the mathematical foundation
- De Morgan's law is the workhorse for simplification
- SOP form is canonical but not minimal
- Karnaugh maps minimize small functions
- NAND/NOR are universal gates
$LEC$, 50),

('digital-design', 2, 'Combinational Logic Design', $LEC$
## From Truth Table to Circuit

The design flow:
1. Specify the function (truth table or boolean equation)
2. Minimize (algebraic or K-map)
3. Implement with available gates
4. Verify (simulation, timing analysis)

## Adders

The half adder: sum = A XOR B, carry = A AND B.

The full adder: takes A, B, Cin, produces Sum and Cout:

    Sum = A XOR B XOR Cin
    Cout = (A AND B) OR (Cin AND (A XOR B))

Cascading N full adders gives an N-bit ripple-carry adder. Carry propagates from LSB to MSB, causing delay proportional to N.

## Carry Lookahead

To speed up addition, compute carries in parallel:

    g_i = A_i AND B_i  (generate)
    p_i = A_i XOR B_i  (propagate)
    C_{i+1} = g_i OR (p_i AND C_i)

Recursively expanding gives all carries in O(log N) depth. Trade-off: more gates, but faster.

## Comparators

Equality: XNOR all bit pairs, AND the results.

Magnitude comparison: ripple from MSB. If A_i > B_i and all higher bits equal, then A > B.

## Multiplexers (MUX)

A 2:1 MUX selects between two inputs based on a select signal:

    Y = S ? B : A
    Y = S AND B OR (NOT S AND A)

Wider MUXes: 4:1 selects among 4 inputs with 2 select bits. Tree of 2:1 MUXes.

MUXes implement any function: apply all minterms as inputs and use the truth-table values as select signals.

## Decoders

An N-to-2^N decoder: activates exactly one of 2^N outputs based on N select bits. Used for memory addressing, instruction decoding.

## Encoders

Reverse of decoder: 2^N inputs to N outputs, giving the index of the active input. Priority encoder handles multiple active inputs by choosing the highest priority.

## Tri-State Buffers

Allow multiple drivers on the same wire by enabling only one at a time:

    Y = EN ? A : Z

Where Z is high impedance (disconnected). Used for shared buses.

## Read-Only Memory (ROM)

A ROM is a lookup table. Address in, data out. Internally, decoder + OR array.

ROMs implement arbitrary combinational functions - handy for complex logic.

## Programmable Logic Arrays (PLA)

Have both AND and OR planes that can be programmed. More flexible than ROM.

Used in FPGAs and CPLDs. Modern FPGAs use LUTs (lookup tables) that can implement any 4-6 input function.

## Timing

Combinational circuits have propagation delay. The critical path determines the maximum clock frequency. Setup and hold constraints must be satisfied for the downstream flip-flops.

## Key Takeaways

- Design flow: specify, minimize, implement, verify
- Adders: ripple vs lookahead (speed trade-off)
- MUXes implement any function
- Decoders address memories
- ROMs and PLAs are programmable logic
- Timing is critical: propagation delay limits clock speed
- Combinational logic: output depends only on current inputs
$LEC$, 50),

('digital-design', 3, 'Sequential Logic and Flip-Flops', $LEC$
## Sequential Logic

Combinational logic has no memory. Sequential logic has state - the output depends on current AND past inputs.

Two types:
- **Synchronous:** state changes on a clock edge
- **Asynchronous:** state changes whenever inputs change

Synchronous is easier to design and verify, and is standard for digital systems.

## Latches vs Flip-Flops

**SR Latch:** set/reset, level-sensitive. Problem: invalid state when both S and R are 1.

**D Latch:** transparent latch. When Enable = 1, Q follows D. When Enable = 0, Q holds.

**D Flip-Flop:** edge-triggered. Q only updates on a rising (or falling) clock edge. Two latches in a master-slave configuration.

D flip-flops are the workhorse of synchronous digital design.

## Timing Parameters

**Setup time t_setup:** D must be stable this long before the clock edge.

**Hold time t_hold:** D must remain stable this long after the clock edge.

**Clock-to-Q delay t_cq:** Q changes this long after the clock edge.

**Maximum clock frequency:** limited by t_cq + combinational delay + t_setup.

## Registers

N flip-flops with a shared clock form an N-bit register.

**Parallel load register:** D inputs from combinational logic; Q outputs to next stage.

**Shift register:** each FF's D comes from the previous FF's Q. Shifts data one bit per clock.

Used for serial-to-parallel conversion, delay lines, sequence generation.

## Counters

A counter increments (or decrements) on each clock edge.

**Ripple counter:** each FF clocks the next. Simple, but accumulates delay.

**Synchronous counter:** all FFs clocked together. Faster, but more logic.

**Johnson counter:** ring of FFs with inverted feedback. 2N distinct states.

**Ring counter:** one-hot circulating through N FFs.

## Finite State Machines (FSMs)

An FSM has:
- States (encoded as bits)
- Inputs
- Outputs
- Transition function
- Output function

**Moore machine:** output depends only on state.

**Mealy machine:** output depends on state AND inputs. Usually fewer states.

FSMs implement protocols, controllers, and algorithms.

## Example: Traffic Light Controller

States: RED, GREEN, YELLOW.
Inputs: timer_done.
Outputs: lights (R, Y, G).

Transitions:
- RED -> GREEN when timer done
- GREEN -> YELLOW when timer done
- YELLOW -> RED when timer done

Encode as 2-bit state, implement with D flip-flops and combinational logic.

## FSM Design Steps

1. Draw state diagram
2. Assign binary codes to states
3. Derive next-state logic (truth table)
4. Derive output logic
5. Minimize
6. Implement with FFs + combinational logic

## Metastability

When a FF's input changes near the clock edge, its output may be undefined for a short time (metastable). Synchronizers (two or three FFs in series) resolve this.

Critical for crossing clock domains.

## Key Takeaways

- Sequential = state + combinational logic
- D flip-flops are edge-triggered, synchronous
- Setup and hold times constrain timing
- Registers, shift registers, counters are building blocks
- FSMs organize complex control logic
- Metastability is real - use synchronizers
- Timing closure is the art of meeting clock constraints
$LEC$, 50),

('digital-design', 4, 'Memory and Pipelining', $LEC$
## Memory Hierarchy

Fast memory is small and expensive; large memory is slow and cheap. We use a hierarchy:

- Registers: a few bytes, ~1 cycle
- L1 cache: 32 KB, ~1-4 cycles
- L2 cache: 256 KB, ~10-20 cycles
- L3 cache: 8 MB, ~30-40 cycles
- DRAM: GB, ~200 cycles
- SSD: TB, ~100,000 cycles

Data moves up on demand. Locality determines hit rate.

## SRAM

Static RAM: 6 transistors per bit (4 for the cross-coupled inverters, 2 for access). Fast, but large. Used for caches.

Read/write at full clock speed. Retains data while powered.

## DRAM

Dynamic RAM: 1 transistor + 1 capacitor per bit. Compact and cheap, but needs periodic refresh (charge leaks).

Slower than SRAM. Used for main memory.

## Pipelining

Split a computation into stages, each of which can run independently. Multiple operations are in flight at once.

Classic 5-stage RISC pipeline:
1. IF - instruction fetch
2. ID - instruction decode / register read
3. EX - execute (ALU)
4. MEM - memory access
5. WB - write back

Throughput: 1 instruction per cycle (instead of 5).

## Pipeline Hazards

**Structural hazard:** two instructions want the same hardware. Fix: duplicate hardware (e.g., separate I$ and D$).

**Data hazard:** instruction needs a value that hasn't been written yet. Fix: forwarding (bypass) or stalling.

**Control hazard:** branch resolution delays fetching. Fix: branch prediction.

## Forwarding

The ALU result from one instruction can be forwarded directly to the next without waiting for WB:

    add r1, r2, r3      # r1 ready at end of EX
    sub r4, r1, r5      # needs r1 at start of EX

Forward from add's EX output to sub's EX input. Eliminates most stalls.

## Branch Prediction

Predict taken or not-taken. If wrong, flush the pipeline and restart.

Modern predictors: 2-bit saturating counters, gshare, tournament, TAGE. Accuracy > 95%.

## Superscalar

Issue multiple instructions per cycle. Requires:
- Multiple functional units
- Register renaming (removes false dependencies)
- Out-of-order execution

Modern CPUs issue 4-6 instructions per cycle.

## Deep Pipelines

More stages = faster clock, but higher penalty on mispredicts.

Pentium 4 had 31 stages - high clock but poor IPC. Modern CPUs use 14-20 stages as a balance.

## Key Takeaways

- Memory hierarchy: small+fast to large+slow
- SRAM (fast, big) vs DRAM (compact, cheap)
- Pipelining increases throughput, not latency
- Hazards: structural, data, control
- Forwarding and branch prediction key to performance
- Superscalar and out-of-order push further
- Balance pipeline depth vs mispredict penalty
$LEC$, 50),

('digital-design', 5, 'Instruction Set Architecture', $LEC$
## What is an ISA?

The Instruction Set Architecture is the contract between hardware and software. It defines:
- Instructions the CPU can execute
- Registers available
- Data types
- Addressing modes
- Exceptions and interrupts

Software written for an ISA runs on any microarchitecture implementing it.

## RISC vs CISC

**RISC (Reduced Instruction Set Computer):**
- Fixed-length instructions
- Load/store architecture
- Many registers
- Simple decoding
- Compiler does more

**CISC (Complex Instruction Set Computer):**
- Variable-length
- Many operations can access memory
- Fewer registers
- Complex decoding
- Hardware does more

Examples: x86 is CISC. ARM, RISC-V, MIPS are RISC.

Modern x86 CPUs decode CISC into RISC-like micro-ops internally. The boundary is blurry.

## RISC-V Basics

RISC-V is a clean, open ISA:

- 32 general-purpose registers (x0-x31)
- Fixed 32-bit instructions (with 16-bit compressed variant)
- Load/store architecture
- Simple addressing: base + offset

Instruction formats:
- R-type: register-register (add, sub, and)
- I-type: register-immediate (addi, lw)
- S-type: store
- B-type: branch
- J-type: jump

## Sample Instructions

    add x1, x2, x3     # x1 = x2 + x3
    addi x1, x2, 10    # x1 = x2 + 10
    lw x1, 0(x2)       # x1 = memory[x2 + 0]
    sw x1, 0(x2)       # memory[x2 + 0] = x1
    beq x1, x2, label  # branch if x1 == x2
    jal x1, func       # call function

## Addressing Modes

- Immediate: value is in the instruction
- Register: value is in a register
- Base + offset: memory[x_reg + imm]
- PC-relative: for branches and jumps

RISC-V keeps it simple. CISC has many more modes.

## Calling Convention

Function call protocol (standardized for RISC-V):

- Arguments passed in a0-a7
- Return value in a0
- Return address in ra
- Callee-saved: s0-s11 (must restore)
- Caller-saved: t0-t6 (may be clobbered)
- Stack pointer in sp

Registers make the compiler's job easier.

## Privilege Levels

RISC-V has three:
- **User (U):** application code
- **Supervisor (S):** OS kernel
- **Machine (M):** firmware / hypervisor

Transitions via system calls, exceptions, and interrupts.

## Extensions

Base ISA + optional extensions:
- M: integer multiply/divide
- A: atomic operations
- F: single-precision float
- D: double-precision float
- C: compressed 16-bit instructions
- V: vector

This modular design lets designers pick only what they need.

## Comparison: ISA vs Microarchitecture

ISA: what the software sees. Stable across generations.

Microarchitecture: how it's implemented. Changes every generation.

Example: x86 has been stable since 1978. The implementation went from 29,000 transistors (8086) to billions (modern).
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- ELECTROMAGNETICS (MIT 6.013) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('electromagnetics', 1, 'Maxwell Equations and Electromagnetic Waves', $LEC$
## The Four Maxwell Equations

James Clerk Maxwell (1865) unified electricity, magnetism, and light in four equations:

**Gauss's law (electric):**

    div D = rho

Electric flux diverges from electric charge.

**Gauss's law (magnetic):**

    div B = 0

Magnetic monopoles don't exist. Magnetic field lines are closed loops.

**Faraday's law:**

    curl E = -dB/dt

A changing magnetic field induces an electric field.

**Ampere-Maxwell law:**

    curl H = J + dD/dt

Current and changing electric field produce magnetic field.

## Differential vs Integral Form

Each law has both forms. Integral form uses integrals over surfaces or loops; differential form uses diverges and curls.

Both are equivalent via the divergence theorem and Stokes' theorem.

## Constitutive Relations

For linear media:

    D = epsilon × E
    B = mu × H
    J = sigma × E

Where epsilon is permittivity, mu is permeability, sigma is conductivity.

In vacuum:
- epsilon_0 = 8.854e-12 F/m
- mu_0 = 4pi e-7 H/m
- c = 1/sqrt(epsilon_0 mu_0) = 2.998e8 m/s

## The Wave Equation

Combining Faraday and Ampere laws gives the wave equation:

    d2E/dz2 = mu epsilon × d2E/dt2

Solutions are waves traveling at:

    v = 1/sqrt(mu epsilon)

In vacuum, v = c = speed of light.

Maxwell's discovery: light IS an electromagnetic wave.

## Plane Waves

A plane wave has E and B perpendicular to each other and to the direction of propagation.

    E × B points in the direction of propagation

In vacuum, |E|/|B| = c.

Wave impedance:

    eta_0 = sqrt(mu_0/epsilon_0) = 377 ohm

## Frequency and Wavelength

    lambda = c / f

At 1 MHz: lambda = 300 m
At 100 MHz: lambda = 3 m
At 1 GHz: lambda = 30 cm
At 10 GHz: lambda = 3 cm

Antennas are comparable to wavelength. That's why RF circuits are so different from low-frequency ones.

## Applications

- Wireless communication (radio, Wi-Fi, cellular)
- Radar and lidar
- Microwave ovens (2.45 GHz)
- MRI (magnetic resonance imaging)
- Optical fibers (guided light)
- Antennas and transmission lines

## Key Takeaways

- Four Maxwell equations unify EM
- Constitutive relations describe medium behavior
- Wave equation: signals propagate at v = 1/sqrt(mu epsilon)
- In vacuum, v = c
- Plane waves: E perpendicular to B perpendicular to propagation
- Wave impedance = 377 ohm in vacuum
- Frequency determines wavelength, which determines circuit behavior
$LEC$, 50),

('electromagnetics', 2, 'Transmission Lines', $LEC$
## Why Transmission Lines?

At low frequencies, wires are just wires. At high frequencies (or long distances), they become transmission lines with characteristic impedance, delay, and reflection.

Rule of thumb: consider transmission line effects when:

    length > lambda/10

Or when the rise time is comparable to the round-trip delay.

## The Telegrapher's Equations

For a line with series inductance L and shunt capacitance C per unit length:

    dV/dz = -L dI/dt
    dI/dz = -C dV/dt

Wave solutions propagate at:

    v = 1/sqrt(LC)

Characteristic impedance:

    Z_0 = sqrt(L/C)

Typical values:
- Coax (RG-58): 50 ohm
- Twisted pair (Cat5): 100 ohm
- TV coax: 75 ohm

## Reflections

When a wave encounters a change in impedance, part reflects back:

    Gamma = (Z_L - Z_0) / (Z_L + Z_0)

Where Gamma is the reflection coefficient.

- Z_L = Z_0: Gamma = 0, no reflection (matched)
- Z_L = infinity: Gamma = 1, full reflection (open circuit)
- Z_L = 0: Gamma = -1, full reflection inverted (short)

Voltage standing wave ratio (VSWR):

    VSWR = (1 + |Gamma|) / (1 - |Gamma|)

VSWR = 1 is perfect match. VSWR > 2 indicates a problem.

## Termination

To prevent reflections, terminate the line at its characteristic impedance:

- **Series termination:** resistor at source, Z_s = Z_0
- **Parallel termination:** resistor at load, Z_L = Z_0
- **Thevenin termination:** two resistors form a Thevenin equivalent of Z_0

Termination is essential for high-speed digital signals (DDR memory, PCIe, Ethernet).

## Impedance Matching Networks

For RF circuits, transformers or LC networks transform impedances:

- L-match: L-network for narrowband
- Pi-match: pi-network
- T-match: T-network

Common in amplifiers, antennas, filters.

## Standing Waves

When a wave reflects back and forth, it forms standing waves. Nodes (V=0) and antinodes (V=max) appear at specific positions.

    Node spacing = lambda/2

Standing waves waste power and cause signal degradation. Matching eliminates them.

## Time Domain Reflectometry (TDR)

Send a pulse down a line and observe the reflection. This reveals where impedance changes are (opens, shorts, connector mismatches). Used to diagnose cables and PCB traces.

## Microstrip and Stripline

On PCBs, transmission lines are:
- **Microstrip:** trace on top layer, ground plane below
- **Stripline:** trace between two ground planes

Characteristic impedance depends on width, height, dielectric constant.

For 50 ohm microstrip on FR4: typical width ~ 3 mm for 1.6 mm thick board.

## Key Takeaways

- Transmission line effects at high frequency/long length
- Telegrapher's equations describe V and I along the line
- Z_0 characteristic impedance
- Reflections from impedance mismatch
- Terminate to prevent reflections
- Matching networks for RF
- TDR for diagnosing cable faults
- Microstrip and stripline on PCBs
$LEC$, 50),

('electromagnetics', 3, 'Antennas and Radiation', $LEC$
## What is an Antenna?

An antenna converts guided waves (on a transmission line) to free-space waves (in air), or vice versa.

Antenna parameters:
- Gain: how much power is focused in a direction (vs isotropic)
- Directivity: same, but ignoring efficiency
- Efficiency: radiated power / input power
- Polarization: orientation of E field
- Bandwidth: range of frequencies

## The Hertzian Dipole

The simplest antenna: a short dipole. Radiation pattern is like a donut (null along the dipole axis).

Field strength in the far field:

    E = j (eta_0 I L / (2 lambda r)) sin(theta) e^(-jkr)

Where L is the dipole length and r is distance from antenna.

## Half-Wave Dipole

A dipole of length lambda/2 is resonant — the current forms a standing wave, maximizing radiation.

Input impedance: ~73 + j42 ohm.

The classic "rabbit ears" TV antenna is a half-wave dipole.

## Quarter-Wave Monopole

A lambda/4 vertical above a ground plane. Input impedance ~36 ohm.

Pattern: omnidirectional in azimuth. Used for cars, walkie-talkies, Wi-Fi.

## Radiation Resistance

The antenna presents a resistance to the driving circuit that represents radiated power.

For a half-wave dipole: R_rad = 73 ohm.

The radiation resistance is what the transmitter "sees" as load.

## Antenna Gain

Gain = directivity × efficiency. Measured in dBi (relative to isotropic).

Typical gains:
- Half-wave dipole: 2.15 dBi
- Quarter-wave monopole: 5 dBi (with ground plane)
- Yagi (directional): 10-15 dBi
- Parabolic dish: 30+ dBi
- Cell tower sector: 15-18 dBi

## Radiation Patterns

Patterns plotted in polar coordinates showing field or power vs angle.

- Isotropic: uniform sphere (theoretical)
- Dipole: donut
- Yagi: forward lobe with back lobes
- Horn: single beam
- Dish: narrow pencil beam

## Antenna Arrays

Multiple antennas combined to steer the beam electronically. This is how phased arrays work — radar, 5G, satellite dishes.

Steering angle:

    sin(theta) = delta_phi × lambda / (2 pi d)

Where delta_phi is the phase difference between elements and d is their spacing.

## Friis Equation

Power received vs distance:

    P_rx = P_tx × G_tx × G_rx × (lambda / (4 pi R))^2

The 1/R^2 dependence is why wireless range is limited. Doubling distance quarter the received power.

Also called the path loss.

## Antenna Types

- **Wire:** dipole, monopole, loop
- **Aperture:** horn, waveguide slot
- **Reflector:** parabolic, corner
- **Array:** phased array, Yagi
- **Planar:** patch, PIFA (in phones)
- **Chip:** tiny ceramic antennas for IoT

## Applications

- Cellular base stations (sector antennas)
- Wi-Fi routers (dipoles)
- GPS receivers (patch)
- Radar (phased arrays)
- Radio telescopes (huge parabolic dishes)
- Satellites (horn, reflector)
- RFID tags (small loops)

## Key Takeaways

- Antennas convert guided to free-space waves
- Gain, directivity, efficiency, polarization describe antennas
- Half-wave dipole: R_rad = 73 ohm, gain 2.15 dBi
- Arrays steer beams electronically
- Friis equation: P_rx ~ 1/R^2
- Many types: wire, aperture, array, planar
- Antenna size scales with wavelength
$LEC$, 50),

('electromagnetics', 4, 'Waveguides and Microwave Engineering', $LEC$
## Waveguides

At microwave frequencies (GHz and above), transmission lines become lossy. Waveguides — hollow metal tubes — guide EM waves with much lower loss.

Standard: rectangular waveguide with cross-section a × b.

## Waveguide Modes

Waves propagate in specific patterns called modes:
- **TE (transverse electric):** no E in the direction of propagation
- **TM (transverse magnetic):** no H in the direction of propagation
- **TEM:** both E and H transverse (only in coax, not hollow waveguide)

TE10 is the dominant mode in rectangular waveguide (lowest cutoff).

## Cutoff Frequency

Each mode has a cutoff frequency below which it doesn't propagate:

    fc = c / (2a)  (for TE10)

Above cutoff, the wave propagates. Below, it decays exponentially (evanescent).

Waveguide size determines the frequency band. X-band (8-12 GHz) uses ~22 mm × 10 mm guide.

## Phase and Group Velocity

In a waveguide:

    v_phase × v_group = c^2

Phase velocity is faster than c (no information transferred).

Group velocity (energy propagation) is slower than c.

## Impedance

Waveguide impedance for TE10 mode:

    Z_TE = eta_0 / sqrt(1 - (fc/f)^2)

At cutoff, impedance goes to infinity. Far above, it approaches eta_0.

## Waveguide Components

- **Flanges:** mechanical connectors
- **Bends and twists:** change direction of propagation
- **Tees:** split power
- **Couplers:** sample a fraction of the power
- **Isolators:** pass one direction only
- **Circulators:** 3-port nonreciprocal device
- **Filters:** resonant cavities
- **Loads:** dummy terminations

## Microwave Circuit Design

At microwave frequencies, circuits are distributed. Transmission line sections replace lumped elements:

- Inductor: high-impedance line
- Capacitor: low-impedance line
- Resonator: lambda/2 or lambda/4 section

The Smith chart is the graphical tool for matching and analysis.

## Smith Chart

A polar plot of reflection coefficient Gamma. Transformations:
- Adding series line: rotate clockwise
- Adding series reactance: move along constant-R circle
- Adding shunt susceptance: move along constant-G circle

Still used today for RF design.

## Microwave Applications

- **Radar:** weather, air traffic, automotive (77 GHz)
- **Satellite communications:** Ku, Ka band
- **5G:** sub-6 GHz and mmWave (24-40 GHz)
- **Microwave ovens:** 2.45 GHz heating
- **Medical:** hyperthermia, ablation
- **Material processing:** sintering, drying

## Key Takeaways

- Waveguides for low-loss microwave transmission
- Modes: TE, TM, TEM
- Cutoff frequency depends on dimensions
- Phase velocity > c, group velocity < c
- Many components: bends, tees, isolators, filters
- Smith chart for matching
- Applications in radar, comms, heating, medical
$LEC$, 50),

('electromagnetics', 5, 'Electromagnetic Compatibility (EMC)', $LEC$
## Why EMC?

Electronic devices must work in the presence of electromagnetic interference (EMI) without causing interference themselves. This is regulated (FCC in US, CE in EU).

Two aspects:
- **Emission:** device doesn't emit too much EMI
- **Immunity:** device tolerates external EMI

## Sources of EMI

- Switching power supplies (SMPS)
- Digital clocks and high-speed data lines
- Motors and relays (arcing)
- Wireless transmitters (Wi-Fi, cellular)
- ESD (electrostatic discharge)
- Lightning

## Coupling Mechanisms

**Conducted:** noise travels along wires (power lines, signal cables).

**Radiated:** noise travels through the air as EM waves.

**Capacitive (electric field):** between nearby conductors.

**Inductive (magnetic field):** between nearby current loops.

## Grounding

A good ground is the foundation of EMC.

**Single-point ground:** all returns meet at one point. Good for low-frequency, sensitive analog.

**Multi-point ground:** ground plane. Good for high-frequency, digital.

**Hybrid:** combine both, with capacitors or ferrites between.

Ground loops cause noise. Star grounding or transformer isolation breaks loops.

## Shielding

Metal enclosures block EM fields. Effectiveness depends on:
- Conductivity of the shield
- Thickness (skin depth)
- Frequency (higher frequency easier to block, but slots become antennas)

Skin depth:

    delta = sqrt(2 / (omega mu sigma))

At 1 MHz in copper: ~66 µm. At 1 GHz: ~2 µm.

Slots and holes in shields leak. Keep slots < lambda/20 for good attenuation.

## Filtering

Common-mode chokes, ferrite beads, and EMI filters remove noise on cables.

Common-mode choke: two windings on a common core. Differential signal passes; common-mode noise is attenuated.

Ferrite bead: absorbs high-frequency energy as heat. Used on power and signal lines.

## PCB Layout for EMC

- Keep high-speed signals short
- Ground planes under high-speed traces
- Terminate transmission lines
- Avoid split ground planes
- Route noisy traces away from sensitive ones
- Use differential signaling for critical signals (USB, Ethernet, HDMI)
- Bypass capacitors at every IC

## ESD Protection

ESD can be 30 kV. It destroys ICs or causes soft failures.

Protection:
- TVS diodes (transient voltage suppressors)
- ESD diodes on I/O pins
- Series resistors to limit current
- Ground planes and proper layout

IEC 61000-4-2 defines ESD test standards: contact discharge 8 kV, air 15 kV.

## Regulatory Standards

- **FCC Part 15:** US, limits on radiated and conducted emissions
- **CISPR 22/32:** international emissions
- **IEC 61000-4-x:** immunity tests
- **CE:** EU marking, requires EMC compliance
- **Automotive:** CISPR 25, ISO 11452

Testing is done in anechoic chambers with calibrated antennas.

## Key Takeaways

- EMC: emission + immunity, regulated by law
- EMI sources: SMPS, digital, motors, wireless
- Coupling: conducted, radiated, capacitive, inductive
- Grounding: single-point for low freq, plane for high freq
- Shielding: works if slots < lambda/20
- Filtering: common-mode chokes, ferrites
- PCB layout is critical for EMC
- ESD protection with TVS diodes
- Regulatory testing is mandatory
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- MICROCOMPUTER PROJECT LAB (MIT 6.115) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('microcontrollers', 1, 'Microcontroller Architecture and Programming', $LEC$
## What is a Microcontroller?

A microcontroller (MCU) is a complete computer on a chip:
- CPU core
- Flash memory (program)
- RAM (data)
- Peripherals (GPIO, timers, ADC, UART, SPI, I2C)
- Clock and power management

Unlike a microprocessor (which needs external RAM, ROM, and I/O), an MCU is self-contained. Perfect for embedded control.

## Popular MCU Families

- **8-bit:** ATmega (Arduino), PIC, 8051
- **16-bit:** MSP430 (ultra-low power)
- **32-bit:** ARM Cortex-M (STM32, nRF), ESP32, RISC-V
- **DSP:** TI C2000, ADI SHARC

ARM Cortex-M dominates the 32-bit space.

## Memory Map

Typical MCU layout (ARM Cortex-M):
- 0x00000000: Flash (program)
- 0x20000000: SRAM (data)
- 0x40000000: Peripherals (GPIO, timers, UART)
- 0xE0000000: System control (NVIC, SysTick)

Memory-mapped I/O: peripherals are accessed like memory. Reading/writing a register controls the hardware.

## GPIO

General-Purpose Input/Output pins. Each pin can be:
- Input (read external state)
- Output (drive high or low)
- Alternate function (UART, SPI, etc.)
- Analog (ADC input)

Configured via registers:

    // Set pin 5 as output (AVR)
    DDRB |= (1 << 5);
    PORTB |= (1 << 5);  // high

Or via HAL:

    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_5, GPIO_PIN_SET);

## Bit Manipulation

Embedded C uses bit operations extensively:

    x |= (1 << n);    // set bit n
    x &= ~(1 << n);   // clear bit n
    x ^= (1 << n);    // toggle bit n
    y = (x >> n) & 1; // read bit n

Bit fields and macros make this cleaner:

    #define BIT(n) (1 << (n))
    #define SET_BIT(reg, bit) ((reg) |= BIT(bit))

## Interrupts

External events trigger interrupts. The CPU:
1. Saves context
2. Jumps to ISR (interrupt service routine)
3. Executes ISR
4. Restores context
5. Returns to main

Keep ISRs short. Do heavy work in the main loop.

## Timers and Counters

Hardware timers count clock edges:
- Generate delays without blocking
- Measure pulse widths
- Generate PWM
- Count external events

16-bit timer at 16 MHz: max period = 65535/16e6 = 4 ms. Prescaler extends range.

## ADC (Analog to Digital Converter)

Converts analog voltage to digital number:
- Resolution: 8, 10, 12, 16 bits
- Sample rate: up to MSps
- Input range: typically 0 to V_ref

Example: 12-bit ADC with V_ref = 3.3 V gives 3.3/4096 = 0.8 mV resolution.

## Serial Protocols

- **UART:** asynchronous, 2 wires (TX/RX)
- **SPI:** synchronous, 4 wires, high speed
- **I2C:** synchronous, 2 wires, multiple devices

Each has trade-offs. UART simplest, SPI fastest, I2C most devices.

## Programming Workflow

1. Write C code
2. Compile with cross-compiler (gcc-arm-none-eabi)
3. Link with startup and libraries
4. Program flash via JTAG/SWD/bootloader
5. Debug via GDB + hardware debugger

Tools: Arduino IDE, PlatformIO, STM32CubeIDE, ESP-IDF.

## Key Takeaways

- MCU = CPU + memory + peripherals on one chip
- Memory-mapped I/O for peripherals
- GPIO for digital I/O, configured by registers
- Interrupts for responsive event handling
- Timers for delays, PWM, measurement
- ADC for analog input
- UART/SPI/I2C for serial communication
- Cross-compile and flash via debugger
$LEC$, 50),

('microcontrollers', 2, 'Interfacing Sensors and Actuators', $LEC$
## Sensors Overview

Sensors convert physical quantities to electrical signals:

- **Temperature:** thermistor, RTD, thermocouple, digital (DS18B20, DHT22)
- **Pressure:** strain gauge, piezo, capacitive
- **Light:** photoresistor (LDR), photodiode, digital (BH1750)
- **Motion:** PIR, accelerometer, gyroscope, IMU
- **Distance:** ultrasonic (HC-SR04), IR, laser (VL53L0X)
- **Humidity:** capacitive, resistive

Each has specific interface requirements.

## Analog Sensors

Output voltage or current proportional to the physical quantity.

**Thermistor:** resistance varies with temperature. Need voltage divider + ADC.

**Strain gauge:** tiny resistance change under strain. Need instrumentation amplifier (INA) + ADC.

**Photodiode:** tiny current. Need transimpedance amplifier (TIA) + ADC.

Analog sensors need signal conditioning: amplification, filtering, level shifting.

## Digital Sensors

On-chip ADC and digital interface (I2C or SPI).

**DS18B20:** 1-Wire digital temperature. Range -55 to +125°C, ±0.5°C accuracy.

**BME280:** I2C/SPI. Temperature, humidity, pressure.

**MPU6050:** I2C. 3-axis accelerometer + 3-axis gyroscope.

Advantages: no external ADC, calibrated, digital noise immunity.

## I2C Communication

Two wires: SDA (data) and SCL (clock). Multiple devices share the bus.

    Wire.beginTransmission(0x68);   // MPU6050 address
    Wire.write(0x75);               // WHO_AM_I register
    Wire.endTransmission(false);
    Wire.requestFrom(0x68, 1);
    byte id = Wire.read();

Pull-up resistors on both lines (2.2k-10k). Speeds: 100 kHz, 400 kHz, 1 MHz.

## SPI Communication

Four wires: MOSI, MISO, SCK, CS.

    digitalWrite(CS, LOW);
    SPI.transfer(0x80 | reg);
    byte value = SPI.transfer(0x00);
    digitalWrite(CS, HIGH);

Faster than I2C (up to 50 MHz), but needs one CS per device.

## Actuators

Output devices:
- **LEDs:** direct (with resistor), or via transistor for high power
- **Relays:** switch AC/DC loads, need driver + flyback diode
- **Motors:** DC, stepper, servo — need H-bridge or driver IC
- **Solenoids:** like relays, inductive load
- **Piezo buzzers:** direct or via transistor
- **Displays:** LCD, OLED, e-ink, TFT

## Driving Loads

GPIO can source/sink ~20 mA. For more, use:
- **BJT:** current-controlled, need base resistor
- **MOSFET:** voltage-controlled, logic-level needed
- **Relay:** opto-isolated module recommended

Example MOSFET circuit:

    GPIO ── 220Ω ── Gate
                    │
                   10kΩ to GND
                   
    Drain ── Load ── +12V
    Source ── GND

## PWM for Actuator Control

Pulse-width modulation controls average power:

- LED dimming: 1-2 kHz
- Motor speed: 10-25 kHz
- Servo position: 50 Hz, 1-2 ms pulses
- Heater: 1 Hz

AnalogWrite() on Arduino, LEDC on ESP32.

## Motor Drivers

**H-bridge:** controls direction + speed of DC motor. L293D, L298N, DRV8833.

**Stepper driver:** A4988, DRV8825. Takes step + direction signals.

**Servo:** built-in control, just send pulses.

## Sensor Fusion

Combining multiple sensors for better accuracy:

- IMU: accelerometer + gyroscope + magnetometer
- Kalman filter or complementary filter
- E.g., Bosch BNO055 does fusion in hardware

## Signal Conditioning

- **Amplification:** op-amp for small signals
- **Filtering:** RC low-pass to remove noise
- **Isolation:** opto-couplers for high voltage
- **Level shifting:** 3.3V ↔ 5V with MOSFETs or dedicated ICs

## Key Takeaways

- Many sensor types: analog, digital, MEMS
- I2C/SPI for digital sensors
- GPIO drives small loads; MOSFETs/BJTs for larger
- PWM controls power to actuators
- Motor drivers for DC, stepper, servo
- Sensor fusion improves accuracy
- Signal conditioning is often required
$LEC$, 50),

('microcontrollers', 3, 'Real-Time Programming Techniques', $LEC$
## The Superloop

Simple structure:

    while (1) {
        read_sensors();
        update_state();
        drive_outputs();
    }

Works for simple tasks. Fails when timing is critical or tasks compete.

## Cooperative Scheduling

Each task runs when it's ready:

    while (1) {
        if (time_for_task_a()) task_a();
        if (time_for_task_b()) task_b();
        // never blocks
    }

Each task must return quickly. No long delays.

## Non-Blocking Delays

Never use delay() in a loop with multiple tasks. Instead:

    unsigned long last = 0;
    const unsigned long INTERVAL = 100;
    
    void loop() {
        if (millis() - last >= INTERVAL) {
            last = millis();
            do_periodic_work();
        }
        do_other_work();
    }

millis() rolls over every ~49 days. The subtraction is rollover-safe.

## State Machines

Replace nested if/else with explicit states:

    enum State { IDLE, HEATING, COOLING };
    State current = IDLE;
    
    void loop() {
        switch (current) {
            case IDLE:
                if (temp < setpoint - 1) current = HEATING;
                break;
            case HEATING:
                heater_on();
                if (temp >= setpoint) current = IDLE;
                break;
            case COOLING:
                fan_on();
                if (temp <= setpoint) current = IDLE;
                break;
        }
    }

Clearer, easier to modify, less buggy.

## Interrupt-Driven Design

Main loop handles logic; ISRs handle timing-critical events:

    volatile bool button_pressed = false;
    
    void button_isr() {
        button_pressed = true;
    }
    
    void loop() {
        if (button_pressed) {
            button_pressed = false;
            handle_button();
        }
    }

Use volatile for variables shared between ISR and main.

## Watchdog Timer

Reset the CPU if it hangs:

    wdt_enable(WDTO_2S);   // 2 second timeout
    
    void loop() {
        wdt_reset();  // feed the watchdog
        do_work();
    }

If do_work() hangs for 2s, the CPU resets. Recovers from lockups.

## Watchdog for Reliability

For deployed devices:
- Enable watchdog
- Log reset reason on startup
- Retry failed operations
- Use brown-out detection

An ESP32 in the field may run for years. The watchdog is essential.

## Real-Time Constraints

Some operations must complete within a deadline:

- Motor commutation: microseconds
- Control loops: milliseconds
- User interface: ~100 ms
- Data logging: seconds

Match technique to constraint:
- Microseconds: hardware peripherals, DMA
- Milliseconds: interrupt-driven, RTOS
- Seconds: cooperative scheduling

## Power Management

For battery-powered devices:
- Sleep modes (idle, standby, deep sleep)
- Wake on interrupt or timer
- Turn off unused peripherals
- Lower clock frequency
- Use DMA to avoid CPU wake-ups

ESP32 deep sleep: 10 µA. Wake every 5 min for 3s: average current ~80 µA.

## Debugging Techniques

- **printf debugging:** simple, effective, but slow
- **Logic analyzer:** capture digital signals
- **Oscilloscope:** view analog waveforms
- **JTAG/SWD:** step through code
- **LED toggling:** poor man's trace
- **Serial logging:** extensive, structured

## Common Bugs

- **Buffer overflow:** reading beyond array bounds
- **Race condition:** ISR and main accessing shared data
- **Non-volatile variable:** compiler optimizes away
- **Stack overflow:** recursion or large local variables
- **Watchdog reset loop:** main loop starves watchdog
- **Priority inversion:** with RTOS

## Key Takeaways

- Superloop for simple tasks
- Cooperative scheduling with non-blocking delays
- State machines for complex logic
- Interrupts for timing-critical events
- Watchdog for reliability
- Power management for battery life
- Match technique to timing constraint
- Debug with scope, logic analyzer, JTAG
- Watch for classic embedded bugs
$LEC$, 50),

('microcontrollers', 4, 'Communication Protocols in Embedded Systems', $LEC$
## UART — Universal Asynchronous Receiver/Transmitter

Two wires (TX, RX). No clock. Baud rate agreed in advance.

Frame: start bit, 7-8 data bits, optional parity, stop bit(s).

Common baud: 9600, 115200, 921600.

    Serial.begin(115200);
    Serial.println("Hello");
    if (Serial.available()) {
        char c = Serial.read();
    }

Pros: simple, universal. Cons: point-to-point, modest speed.

## I2C — Inter-Integrated Circuit

Two wires (SDA, SCL). Multi-drop: up to 127 devices, each with unique address.

7-bit addressing. Standard speeds: 100 kHz, 400 kHz, 1 MHz.

Needs pull-up resistors: typically 4.7kΩ.

    Wire.begin();
    Wire.beginTransmission(0x48);
    Wire.write(0x00);
    Wire.endTransmission();
    Wire.requestFrom(0x48, 2);

Pros: only 2 pins for many devices. Cons: slower, sensitive to bus capacitance.

## SPI — Serial Peripheral Interface

Four wires (SCLK, MOSI, MISO, CS). Full duplex. High speed (10-50 MHz).

Each device needs its own CS pin.

    SPI.begin();
    digitalWrite(CS, LOW);
    SPI.transfer(0x80);
    uint8_t high = SPI.transfer(0x00);
    uint8_t low = SPI.transfer(0x00);
    digitalWrite(CS, HIGH);

Pros: fast, full duplex. Cons: more pins, no standard addressing.

## CAN — Controller Area Network

Automotive standard. Two wires (CANH, CANL), differential.

Multi-master. Priority via message ID. Automatic retransmission. CRC.

Speed: up to 1 Mbps (classic), 8 Mbps (CAN FD).

Used in every modern car for engine, brakes, dashboard.

    // With MCP2515 controller
    CAN.sendMsgBuf(0x100, 0, 8, data);

## RS-485

Differential serial for industrial environments. Up to 1200 m cable, 10 Mbps.

Multi-drop: up to 32 devices (or 256 with repeaters).

Used with Modbus protocol in factory automation.

## Modbus

Industrial protocol. Master-slave. Runs over RS-485 or TCP.

Data model: coils (bits), discrete inputs, holding registers, input registers.

    // Read holding register 100 on slave 1
    uint16_t value = modbus.readHoldingRegister(1, 100);

## 1-Wire

Single wire + ground. Dallas Semiconductor (now Maxim).

Used for DS18B20 temperature sensors, iButton.

Addressing: 64-bit unique ID per device.

    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);

## MQTT

High-level protocol over TCP. Publish-subscribe.

Broker (Mosquitto, EMQX) routes messages. Clients publish to topics and subscribe.

Topics hierarchical: home/livingroom/temperature.

QoS levels: 0 (at most once), 1 (at least once), 2 (exactly once).

    client.publish("home/temp", "22.5");
    client.subscribe("home/+/setpoint");

Used in IoT, smart home, industrial.

## LoRa / LoRaWAN

Long-range, low-power wireless. 10-15 km range in rural areas.

Data rate: 0.3-50 kbps. Very low power.

Used for remote sensors, smart agriculture, city infrastructure.

## BLE — Bluetooth Low Energy

Wireless, low-power. Pairs with phones.

GATT profile: services and characteristics.

Used in wearables, beacons, medical devices.

## Choosing the Right Protocol

| Need | Protocol |
|------|----------|
| Simple serial | UART |
| Many sensors, few pins | I2C |
| High speed, chip-to-chip | SPI |
| Automotive | CAN |
| Industrial, long cable | RS-485 |
| IoT, WiFi/internet | MQTT |
| Long range, low power | LoRa |
| Phone pairing | BLE |

## Key Takeaways

- UART: simple, point-to-point
- I2C: many devices, 2 pins, moderate speed
- SPI: fast, full-duplex, more pins
- CAN: automotive, robust, prioritized
- RS-485/Modbus: industrial, long cable
- MQTT: IoT, publish-subscribe, over TCP
- LoRa: long-range, low-power wireless
- BLE: phone pairing, wearables
- Choose based on speed, range, power, cost
$LEC$, 50),

('microcontrollers', 5, 'Embedded Systems Project Design', $LEC$
## From Idea to Product

Embedded development is not just coding. It's:

1. Requirements (what does it need to do?)
2. Architecture (how is it organized?)
3. Hardware design (schematic, PCB)
4. Firmware design (modules, interfaces)
5. Testing (unit, integration, HIL)
6. Deployment (programming, calibration)
7. Maintenance (updates, bug fixes)

## Requirements

**Functional:** what the device does.

**Non-functional:**
- Timing (response time, sample rate)
- Power (battery life, quiescent current)
- Cost (BOM, assembly)
- Size, weight
- Environmental (temperature, humidity, shock)
- Regulatory (FCC, CE, UL)
- Reliability (MTBF, mission lifetime)

Write requirements before designing.

## Architecture

Block diagram showing:
- MCU and its peripherals
- Sensors and actuators
- Communication interfaces
- Power supply
- External interfaces (USB, display, buttons)

Decide early: what runs on MCU, what runs in hardware, what runs on the cloud.

## Hardware Design

Schematic capture → PCB layout → fabrication → assembly → test.

Key considerations:
- Power supply (LDO vs buck, efficiency)
- Decoupling capacitors on every IC
- Ground planes
- Trace width for current
- Connectors and mounting holes
- Test points for debugging

## Firmware Architecture

Layered:
- **HAL (Hardware Abstraction Layer):** register-level drivers
- **Drivers:** GPIO, UART, SPI, I2C, timers
- **Middleware:** RTOS, filesystems, network stacks
- **Application:** business logic

Each layer tested separately.

## Modular Design

Each module has:
- A clear interface (header file)
- A single responsibility
- Unit tests

Example modules for a data logger:
- `sensor.c` — reads temperature
- `storage.c` — writes to SD card
- `comms.c` — sends over Wi-Fi
- `main.c` — orchestrates

## Version Control

Use git for firmware:
- Commit often
- Tag releases
- Branch for features
- .gitignore for build artifacts

For collaborative work: code review, CI.

## Testing

**Unit tests:** each module in isolation, on host.

**Integration tests:** modules together, on target.

**Hardware-in-the-loop (HIL):** real hardware, automated test.

**Field testing:** actual deployment conditions.

Automated testing catches regressions early.

## Debugging Tools

- **printf:** simple, but slows code
- **SWD/JTAG:** step through code, inspect variables
- **Logic analyzer:** view SPI/I2C/UART traffic
- **Oscilloscope:** analog signals, timing
- **Power profiler:** measure current draw over time
- **Segger RTT:** fast printf alternative

## Power Budget

Sum the current draw of every component in every state:

- Active: MCU + sensors + radio
- Idle: MCU low-power + sensors off
- Sleep: only RTC + wake source

Weight by duty cycle to get average current.

Example:
- 10 mA for 3s every 5 min: 10 × 3 / 300 = 0.1 mA average
- 10 µA in deep sleep: 0.01 mA
- Total: 0.11 mA
- Battery 2000 mAh: 18,000 hours = 2 years

## Cost Optimization

- Choose parts with multiple sources
- Reduce BOM count (integrate functions)
- Use MCU with all needed peripherals
- Consider assembly cost (SMT vs THT)
- Volume pricing

A $1 difference in BOM = $10,000 per 10k units.

## Deployment

- Production programming (bulk flash)
- Calibration (per unit)
- Testing (functional test)
- Packaging and shipping

## Field Updates

- OTA firmware update (Wi-Fi, cellular, BLE)
- Bootloader with rollback
- Signed firmware for security
- Staged rollout (small % first)

## Maintenance

- Remote diagnostics (logs to cloud)
- Bug reports from users
- Crash dump analysis
- Metrics (uptime, error rates)

## Key Takeaways

- Requirements first, then design
- Layered firmware architecture
- Modular, testable modules
- Version control everything
- Multiple testing levels (unit, integration, HIL, field)
- Power budget drives battery life
- Cost optimization at scale
- Deployment needs production programming
- OTA updates are essential for IoT
- Maintenance is ongoing
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('digital-design', 'electromagnetics', 'microcontrollers')
group by course_slug;