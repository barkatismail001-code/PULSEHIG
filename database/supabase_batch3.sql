-- ============================================================
-- Batch 3: Mechanics of Materials (MIT 2.001) + Thermodynamics (MIT 5.60)
-- ============================================================

-- ============================================================
-- MECHANICS OF MATERIALS (MIT 2.001) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('mechanics-materials', 1, 'Stress, Strain, and Material Behavior', $LEC$
## Why Study Mechanics of Materials?

Every structure — bridges, buildings, aircraft, chips, bones — must carry loads without failing. Mechanics of materials gives engineers the tools to predict when a structure will bend, break, or buckle. It bridges the gap between statics (forces in equilibrium) and real material behavior (deformation, yielding, fracture).

## Normal Stress and Strain

**Stress** σ is force per unit area:

    σ = F / A

Units: pascals (Pa), or MPa (10⁶ Pa), or psi (pounds per square inch).

**Strain** ε is the fractional change in length:

    ε = ΔL / L₀

Strain is dimensionless. Typical elastic strains in metals are 0.001 to 0.005 (0.1% to 0.5%).

## Hooke's Law

For linear elastic materials, stress and strain are proportional:

    σ = E × ε

E is **Young's modulus** — a material property.

| Material | E (GPa) |
|----------|---------|
| Rubber | 0.01-0.1 |
| Wood | 10 |
| Aluminum | 70 |
| Steel | 200 |
| Diamond | 1000 |

For a bar under axial load:

    δ = F × L / (A × E)

This is the fundamental deformation formula.

## Poisson's Ratio

When stretched in one direction, materials usually contract in the perpendicular directions:

    ν = -ε_lateral / ε_axial

Typical values: 0.3 (steel), 0.33 (aluminum), 0.5 (rubber, incompressible).

## Shear Stress and Strain

Shear stress τ acts parallel to a surface:

    τ = V / A

Shear strain γ is the change in angle (radians):

    τ = G × γ

where G = E / (2(1+ν)) is the shear modulus.

## Stress-Strain Curve

For a typical ductile metal:

1. **Elastic region:** linear, reversible, slope = E
2. **Yield point:** σ_y, where plastic deformation begins
3. **Strain hardening:** stress rises as the material deforms plastically
4. **Ultimate strength:** σ_u, maximum stress
5. **Necking and fracture:** material locally narrows and breaks

Ductile materials (steel) have large plastic strain. Brittle materials (cast iron, ceramics) fracture with little deformation.

## Allowable Stress and Safety Factor

Design stress must be below yield:

    σ_allow = σ_y / SF

Safety factors: 1.5-2 for well-understood loads, 3-4 for uncertain, 5+ for critical (pressure vessels, aircraft).

## Thermal Stress

Temperature changes cause thermal strain:

    ε_thermal = α × ΔT

If the material is constrained, thermal strain becomes thermal stress:

    σ = -E × α × ΔT

where α is the coefficient of thermal expansion (CTE). Typical: 12 × 10⁻⁶ /°C for steel.

This is why bridges have expansion joints and railroad tracks can buckle on hot days.

## Key Takeaways

- Stress = force / area; strain = ΔL / L
- Hooke's law: σ = Eε in the elastic region
- Poisson's ratio: lateral contraction under axial load
- Yield strength is the design limit for ductile materials
- Thermal expansion causes stress in constrained structures
- Safety factor accounts for uncertainty
$LEC$, 50),

('mechanics-materials', 2, 'Axial Loading and Torsion', $LEC$
## Axial Loading of Bars

A bar under axial load has uniform stress (away from load application points):

    σ = F / A
    δ = FL / (AE)

For a bar with varying cross-section or load, integrate:

    δ = ∫₀^L F(x) / (A(x) E) dx

## Statically Indeterminate Problems

When equilibrium equations are not enough to find the reactions (too many supports), the problem is statically indeterminate. Add compatibility equations (deformations must be consistent).

**Example:** A bar fixed at both ends, loaded in the middle.

1. Equilibrium: R_A + R_B = F
2. Compatibility: total elongation = 0
3. Compatibility equation: R_A L₁ / (AE) = R_B L₂ / (AE)
4. Solve: R_A = F × L₂ / (L₁ + L₂)

## Stress Concentrations

Holes, notches, and sudden changes in cross-section concentrate stress. The stress at the concentration is:

    σ_max = K × σ_nominal

where K is the stress concentration factor (from tables).

Typical K values:
- Circular hole in a wide plate: K = 3
- Sharp notch: K = 5-10
- Sharp crack: K → ∞ (fracture mechanics needed)

Design rule: avoid sharp corners. Use fillets with radius ≥ 0.1 × the section width.

## Torsion of Circular Shafts

A torque T applied to a circular shaft produces shear stress:

    τ = T × r / J

where r is the radial distance and J is the polar moment of inertia:

    J = π × d⁴ / 32 (solid)
    J = π × (d_o⁴ - d_i⁴) / 32 (hollow)

Maximum shear stress at the outer surface:

    τ_max = T × c / J

where c is the outer radius.

## Angle of Twist

The shaft twists by:

    φ = T × L / (J × G)

where G is the shear modulus. This is the torsion analog of axial deformation.

## Power Transmission

Torsion is how shafts transmit power:

    P = T × ω

where ω is angular velocity (rad/s). For a shaft running at N rpm:

    ω = 2π × N / 60

Given a power P and speed N, find the required shaft diameter:

    T = P / ω
    d³ = 16 T / (π × τ_allow)

This is the basic shaft sizing equation.

## Combined Loading

Real components often experience axial, bending, and torsion simultaneously. Use **principal stresses** to combine them.

For a point under σ_x and τ_xy, the principal stresses are:

    σ₁,₂ = σ_x/2 ± √((σ_x/2)² + τ_xy²)

Maximum shear stress:

    τ_max = √((σ_x/2)² + τ_xy²)

Use the **von Mises** or **Tresca** criterion to predict yielding:
- Tresca: yield when τ_max = σ_y / 2
- von Mises: yield when √(σ₁² - σ₁σ₂ + σ₂²) = σ_y

## Key Takeaways

- Axial: δ = FL/(AE)
- Statically indeterminate problems need compatibility equations
- Stress concentrations multiply stress (K factor)
- Torsion: τ = Tr/J, φ = TL/(JG)
- Power: P = Tω, d³ = 16T/(πτ)
- Combined loads: use principal stresses
- Tresca and von Mises predict yielding
$LEC$, 50),

('mechanics-materials', 3, 'Bending of Beams', $LEC$
## Beam Basics

A beam is a slender member loaded perpendicular to its axis. It carries:
- **Shear force V(x):** internal force perpendicular to the axis
- **Bending moment M(x):** internal moment that bends the beam

## Sign Conventions

Standard convention:
- Positive V: forces the left section up
- Positive M: causes the beam to sag (concave up)

## Relation Between Load, Shear, and Moment

    dV/dx = -w(x)     (w is distributed load, positive down)
    dM/dx = V(x)

These differential relations are extremely useful:

- Slope of V diagram = -w
- Slope of M diagram = V
- M is maximum where V = 0
- Area under w diagram = change in V
- Area under V diagram = change in M

## Bending Stress

For a beam in pure bending:

    σ = -M × y / I

where:
- M = bending moment
- y = distance from the neutral axis
- I = moment of inertia of the cross-section

Maximum stress occurs at the outermost fibers (y = c):

    σ_max = M × c / I

Define section modulus S = I / c. Then:

    σ_max = M / S

## Moments of Inertia

For a rectangular cross-section b × h:

    I = b × h³ / 12

For a circular section of diameter d:

    I = π × d⁴ / 64

For a hollow circle:

    I = π × (d_o⁴ - d_i⁴) / 64

The I-beam shape concentrates material far from the neutral axis, maximizing I for a given mass.

## Deflection of Beams

The beam equation:

    EI × d²y/dx² = M(x)

Integrating twice gives deflection y(x). Boundary conditions fix the constants.

For a simply supported beam with a point load P at the center:

    δ_max = P × L³ / (48 × E × I)

For a cantilever with point load P at the tip:

    δ_max = P × L³ / (3 × E × I)

For a uniformly loaded simple beam (total load W):

    δ_max = 5 × W × L³ / (384 × E × I)

These formulas are in every engineering handbook.

## Beam Design

The goal: choose a cross-section that satisfies both strength and stiffness.

**Strength:** σ_max ≤ σ_allow → S ≥ M / σ_allow

**Stiffness:** δ_max ≤ δ_allow → I ≥ f(M, L, δ_allow)

Usually stiffness governs for long spans. That's why large deflection limits (L/360 for floors, L/500 for precision) drive beam sizes.

## Shear Stress in Beams

    τ = V × Q / (I × t)

where Q is the first moment of area above the point, and t is the thickness at that point.

For a rectangular section, τ is parabolic, peaking at the neutral axis:

    τ_max = 3V / (2A)

For an I-beam, τ_max is at the neutral axis, in the web.

## Composite Beams

When a beam is made of two materials (e.g., steel and concrete), transform one material into an equivalent section of the other using the modular ratio n = E₂/E₁.

## Key Takeaways

- dV/dx = -w, dM/dx = V
- Bending stress: σ = Mc/I, max at outer fibers
- Deflection formulas are ready-made for common cases
- I-beam shape maximizes I for mass
- Shear stress: τ = VQ/(It)
- Composite beams need the modular ratio
$LEC$, 50),

('mechanics-materials', 4, 'Column Buckling and Stability', $LEC$
## Buckling — The Sudden Failure

A slender column under compression can fail suddenly by buckling — sideways deflection — at a load far below the material's yield strength. This is why a plastic ruler can carry tension but buckles easily in compression.

## Euler's Buckling Formula

For a pin-ended column of length L, the critical buckling load is:

    P_cr = π² × E × I / L²

where:
- E = Young's modulus
- I = minimum moment of inertia
- L = effective length (see below)

This is the **Euler buckling load**. Above P_cr, the column is unstable; below it, it's stable.

## Effective Length

Real columns have different end conditions. The effective length L_e accounts for this:

| End condition | L_e |
|---------------|-----|
| Pinned-pinned | L |
| Fixed-fixed | 0.5L |
| Fixed-pinned | 0.7L |
| Fixed-free (cantilever) | 2L |

So P_cr for a cantilever is only 1/4 of the pin-ended value. Fixing the base helps a lot.

## Critical Stress

    σ_cr = P_cr / A = π² × E / (L_e/r)²

where r = √(I/A) is the radius of gyration. The ratio L_e/r is the **slenderness ratio**.

For steel with E = 200 GPa:
- L/r = 100 → σ_cr = 200 MPa (near yield)
- L/r = 200 → σ_cr = 50 MPa (well below yield)

Buckling governs for slender columns (L/r > ~100 for steel).

## When Buckling Doesn't Apply

If σ_cr > σ_y, the column yields before buckling. Then the column fails by yielding, not buckling. Use yield criteria.

The transition slenderness ratio:

    (L/r)_transition = π × √(E / σ_y)

For steel (E = 200 GPa, σ_y = 250 MPa):

    (L/r)_transition = π × √(200,000/250) = π × 28.3 = 89

So for L/r < 89, yielding governs. For L/r > 89, buckling governs.

## Real Columns: Initial Imperfections

Real columns are never perfectly straight. Initial crookedness and eccentric loads reduce the buckling load.

The Johnson parabola and other empirical formulas account for this. Real design codes (AISC, Eurocode) use semi-empirical curves calibrated to test data.

## Rankine-Gordon Formula

A useful interpolation between yielding and Euler:

    P_cr = P_yield × P_euler / (P_yield + P_euler)

This smoothly transitions between the two regimes.

## Other Buckling Modes

- **Local buckling:** thin-walled sections buckle locally (e.g., the flange of an I-beam)
- **Torsional buckling:** columns with asymmetric cross-sections can twist
- **Lateral-torsional buckling:** beams loaded in bending can buckle sideways

Each has its own critical load formula.

## Design Implications

For a column:
1. Compute L/r and P_cr
2. Check P_cr > applied load with safety factor
3. If slender, increase I (use a hollow or I-shaped section)
4. If short, check yielding

For very slender structures (towers, drill strings, space frames), buckling is often the governing failure mode.

## Key Takeaways

- Buckling is sudden instability under compression
- Euler formula: P_cr = π²EI/L²
- Effective length depends on end conditions
- Slenderness ratio L/r determines if buckling or yielding governs
- Real columns have reduced capacity due to imperfections
- Hollow and I-sections are efficient against buckling
- Buckling governs for slender structures
$LEC$, 50),

('mechanics-materials', 5, 'Failure Theories and Fatigue', $LEC$
## Failure — What Does It Mean?

Failure can be:
- **Yielding:** permanent deformation
- **Fracture:** sudden breaking
- **Buckling:** instability
- **Fatigue:** failure after many cycles

Different materials fail differently. Ductile materials (steel, aluminum) yield and then fracture. Brittle materials (cast iron, ceramics, glass) fracture without warning.

## Ductile vs Brittle

Ductile:
- Large plastic deformation before fracture
- Warning signs (yielding, necking)
- Examples: mild steel, aluminum, copper

Brittle:
- Little to no plastic deformation
- Sudden fracture
- Examples: cast iron, glass, ceramics, high-strength steel at low temperature

Fracture mechanics handles brittle failure; mechanics of materials handles ductile failure.

## Yield Criteria for Ductile Materials

Under multiaxial stress, when does yielding occur?

**Tresca (Maximum Shear Stress):** yielding when maximum shear stress equals half the yield strength:

    τ_max = σ_y / 2

Conservative; matches experiments for many ductile metals.

**von Mises (Maximum Distortion Energy):** yielding when the distortion energy equals the yield strength in uniaxial tension:

    σ_vm = √(σ₁² - σ₁σ₂ + σ₂² - σ₂σ₃ + σ₃σ₁) = σ_y

More accurate for most ductile metals. Standard in FEA software.

For a simple uniaxial tension test, both criteria reduce to σ = σ_y.

## Fracture Criteria for Brittle Materials

**Maximum Normal Stress:** fracture when the largest principal stress reaches the ultimate tensile strength.

Used for cast iron, ceramics, and other brittle materials. Does not depend on shear.

## Fatigue — The Silent Killer

Fatigue is failure under repeated cyclic loading at stress levels far below yield. A paperclip bent back and forth 20 times breaks — not because of a single high load, but because of accumulated microcracks.

Fatigue causes ~90% of all service failures in metals. Bridges, aircraft, machine parts, medical implants.

## S-N Curve

Fatigue testing produces an S-N curve: stress amplitude S vs number of cycles to failure N.

For steel, the curve has a **fatigue limit** (endurance limit) — below this stress, the material survives indefinitely. Typical: 0.4-0.5 × ultimate tensile strength.

For aluminum and most other metals, no fatigue limit — the S-N curve keeps decreasing. Design is based on a specified life (e.g., 10⁷ cycles).

## Fatigue Life Prediction

Basquin's equation:

    σ_a = σ_f' × (2N_f)^b

where σ_f' is the fatigue strength coefficient and b is the fatigue strength exponent (typically -0.05 to -0.12).

Miner's rule for variable amplitude:

    Σ (n_i / N_i) = 1

Accumulate damage until the sum reaches 1 (failure).

## Stress Concentrations and Fatigue

Notches and holes concentrate stress, dramatically reducing fatigue life. The fatigue notch factor K_f:

    K_f = 1 + q × (K_t - 1)

where q is the notch sensitivity (0 to 1) and K_t is the elastic stress concentration factor.

Design: round all corners, avoid sharp changes in section, polish surfaces in high-stress regions.

## Surface Effects

Fatigue cracks start at the surface. Surface treatments improve fatigue life:

- **Shot peening:** compresses the surface, adds residual compressive stress
- **Carburizing:** hardens the surface
- **Polishing:** removes stress-raisers
- **Coating:** protects from corrosion

Surface finish can change fatigue life by 2-3×.

## Design for Fatigue

1. Keep stress amplitudes below the fatigue limit (if applicable)
2. Avoid sharp changes in section
3. Use smooth surface finishes
4. Apply compressive residual stress (shot peening)
5. Account for stress concentrations
6. Test prototypes

## Key Takeaways

- Ductile materials yield; brittle materials fracture
- von Mises is the standard yield criterion
- Fatigue is failure under cyclic loading, below yield
- Steel has an endurance limit; aluminum does not
- Notches and surface finish strongly affect fatigue
- Miner's rule for variable-amplitude loading
- Design for fatigue is critical for safety
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- THERMODYNAMICS (MIT 5.60) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('thermodynamics', 1, 'Introduction and the First Law', $LEC$
## What is Thermodynamics?

Thermodynamics is the study of energy: how it's stored, transferred, and converted. It began with steam engines in the 1800s and now underpins everything from power plants to refrigerators to biology.

## Systems and Surroundings

A **system** is what we're studying (a gas in a cylinder, a chemical reactor, a biological cell). The **surroundings** are everything else. The **boundary** separates them.

Systems are:
- **Open:** matter can cross the boundary (a pump, a turbine)
- **Closed:** matter cannot cross, but energy can (a piston-cylinder)
- **Isolated:** neither matter nor energy crosses (an ideal thermos)

## State Variables

The state of a system is described by properties like:
- **Temperature T** (K)
- **Pressure P** (Pa, atm, bar)
- **Volume V** (m³)
- **Internal energy U** (J)
- **Enthalpy H = U + PV** (J)
- **Entropy S** (J/K)

These are **state functions** — they depend only on the current state, not on how the system got there.

## Path Functions

Heat Q and work W are **path functions** — their values depend on the specific process. That's why we write δQ and δW (inexact differentials) rather than dQ and dW.

## The First Law

Energy is conserved:

    ΔU = Q - W

where:
- ΔU = change in internal energy
- Q = heat added to the system (positive if added)
- W = work done by the system (positive if done by the system)

This is the thermodynamic version of energy conservation. You cannot create or destroy energy — only convert it.

## Sign Convention

Two conventions exist. We use:
- Q > 0: heat added to system
- W > 0: work done BY system
- ΔU > 0: internal energy increases

Alternative (chemistry): W > 0 means work done ON system. Be careful when reading textbooks.

## Work in Various Processes

**Isochoric (constant V):** W = 0 (no volume change)

**Isobaric (constant P):** W = P × ΔV

**Isothermal (constant T, ideal gas):** W = nRT × ln(V₂/V₁)

**Adiabatic (no heat exchange, Q = 0):** W = -ΔU

## Heat Capacity

    Cv = (∂U/∂T)_V    (constant volume)
    Cp = (∂H/∂T)_P    (constant pressure)

For an ideal gas:

    Cp - Cv = R

The ratio γ = Cp/Cv is 5/3 for monatomic gases, 7/5 for diatomic gases.

## Example: Gas Expansion

A gas expands from V₁ = 1 L to V₂ = 3 L against a constant external pressure P_ext = 2 atm. How much work is done?

    W = P_ext × ΔV = 2 atm × (3 - 1) L = 4 L·atm = 405 J

The gas does 405 J of work on the surroundings. If the process is adiabatic (Q = 0), the internal energy drops by 405 J — the gas cools.

## Enthalpy

For constant-pressure processes (most chemical reactions), it's convenient to use enthalpy:

    H = U + PV

    ΔH = Q_p (heat at constant pressure)

Combustion, phase changes, and most chemical reactions happen at constant pressure. Enthalpy is the natural variable.

## Key Takeaways

- First law: energy is conserved: ΔU = Q - W
- State functions depend only on current state
- Path functions (Q, W) depend on the process
- Work = area under P-V diagram
- Enthalpy is convenient for constant-P processes
- Heat capacity relates temperature change to heat
$LEC$, 50),

('thermodynamics', 2, 'The Second Law and Entropy', $LEC$
## Why We Need a Second Law

The first law says energy is conserved. But it doesn't tell us which processes happen. A cup of hot coffee never spontaneously heats up by absorbing heat from the room — even though that would conserve energy. The second law tells us why.

## Spontaneous Processes

Processes have a direction:
- Heat flows from hot to cold
- Gas expands to fill a vacuum
- Salt dissolves in water
- Iron rusts in air

The reverse never happens spontaneously, even though it conserves energy.

## Entropy

Entropy S is a measure of the number of ways a system can be arranged — its "disorder" or, more precisely, the number of microstates consistent with the macrostate.

Boltzmann's equation:

    S = k_B × ln(Ω)

where Ω is the number of microstates.

Units: J/K.

## The Second Law

For any spontaneous process in an isolated system:

    ΔS ≥ 0

Entropy never decreases in an isolated system. The universe tends toward disorder.

For a system + surroundings (non-isolated):

    ΔS_universe = ΔS_system + ΔS_surroundings ≥ 0

## Entropy Change Calculations

**Reversible isothermal process:**

    ΔS = Q_rev / T

**Heating or cooling at constant pressure:**

    ΔS = ∫ Cp / T dT

For a constant Cp: ΔS = Cp × ln(T₂/T₁)

**Ideal gas expansion:**

    ΔS = nR × ln(V₂/V₁)

## The Carnot Cycle

The most efficient heat engine possible operates between temperatures T_H (hot) and T_C (cold):

    η_Carnot = 1 - T_C / T_H

This is the theoretical maximum. No real engine can beat it.

For a heat pump (heating):

    COP_heating = T_H / (T_H - T_C)

For a refrigerator (cooling):

    COP_cooling = T_C / (T_H - T_C)

## Real Engines

Real engines (gas turbines, steam turbines, internal combustion) have efficiencies well below Carnot due to:
- Friction
- Heat losses
- Irreversible combustion
- Finite-rate heat transfer

Typical:
- Coal power plant: 33-40%
- Combined cycle gas: 55-62%
- Internal combustion engine: 25-35%
- Solar cell: 15-25%

## Entropy and Information

Shannon's information entropy:

    H = -Σ p_i × log₂(p_i)

This has the same mathematical form as thermodynamic entropy. The connection is deep: information is physical, and erasing information costs energy (Landauer's principle: kT ln 2 per bit).

## Statistical View

The second law is statistical. For a small number of particles, entropy can decrease briefly. For 10²³ particles, entropy decrease is astronomically unlikely.

This is why the second law is so reliable in practice — it's true with overwhelming probability, not as an absolute law.

## Key Takeaways

- Second law: entropy of an isolated system never decreases
- Entropy measures number of microstates (S = k ln Ω)
- Carnot efficiency sets the upper bound for heat engines
- Real engines are far below Carnot due to irreversibility
- Entropy connects to information theory
- Second law is statistical, not absolute
$LEC$, 50),

('thermodynamics', 3, 'Thermodynamic Cycles', $LEC$
## What is a Cycle?

A thermodynamic cycle returns the working fluid to its initial state. Net work is the area enclosed by the cycle on a P-V diagram.

    W_net = ∮ P dV

Engines and refrigerators operate on cycles.

## The Rankine Cycle (Steam Power Plants)

The standard cycle for steam power generation:

1. **Pump:** compress liquid water from low to high pressure
2. **Boiler:** heat water to steam at high P and T
3. **Turbine:** steam expands, producing work
4. **Condenser:** steam condenses back to liquid

Efficiency: 35-45% for typical plants. Higher T_H and lower T_C improve efficiency.

## The Brayton Cycle (Gas Turbines)

The standard cycle for jet engines and gas turbines:

1. **Compressor:** raises air pressure
2. **Combustor:** adds heat by burning fuel
3. **Turbine:** expands hot gas, producing work
4. **Exhaust:** hot gas exits

Efficiency: 30-40% simple cycle, 55-62% in combined cycle (with a Rankine bottoming cycle).

## The Otto Cycle (Gasoline Engines)

Used in spark-ignition engines:

1. **Intake:** air-fuel mixture enters
2. **Compression:** piston compresses mixture
3. **Combustion:** spark ignites, pressure spikes
4. **Expansion:** hot gas pushes piston
5. **Exhaust:** gases leave

Efficiency: 25-35%, limited by knock (premature ignition) and heat losses.

## The Diesel Cycle

Compression-ignition engines:
- Air compressed to 15-20:1 (vs 8-10:1 for gasoline)
- Fuel injected at high pressure, auto-ignites
- Higher efficiency than Otto (35-45%)

The high compression ratio is why diesels are more efficient.

## The Carnot Cycle

The most efficient cycle possible:

1. Isothermal expansion (T_H)
2. Adiabatic expansion (T_H → T_C)
3. Isothermal compression (T_C)
4. Adiabatic compression (T_C → T_H)

Efficiency: 1 - T_C/T_H.

Real cycles differ from Carnot in that they're not reversible. Irreversibilities (finite-rate heat transfer, friction) reduce efficiency.

## Refrigeration Cycles

The **vapor-compression cycle** is used in air conditioners and refrigerators:

1. **Compressor:** raises refrigerant pressure (and temperature)
2. **Condenser:** rejects heat to the environment, refrigerant condenses
3. **Expansion valve:** pressure drops suddenly, refrigerant cools
4. **Evaporator:** absorbs heat from the cold space

COP: 2-4 typical. Higher with better insulation and smaller temperature lift.

## Combined Cycles

Stack two cycles to use heat rejected by the top cycle as input to the bottom cycle:

Gas turbine (Brayton) → waste heat → steam turbine (Rankine)

Efficiency: 55-62%, the best in commercial power generation.

## Absorption Refrigeration

Instead of a mechanical compressor, use a heat source to drive the cycle. Used in RV fridges (propane) and industrial chillers (waste heat).

Lower efficiency than vapor compression, but no moving parts and can run on waste heat.

## Key Takeaways

- Cycles convert heat to work (or work to heat)
- Carnot sets the upper bound on efficiency
- Rankine for steam, Brayton for gas, Otto/Diesel for combustion
- Combined cycles achieve the highest real efficiencies
- Refrigeration moves heat against the gradient using work
- Efficiency improves with higher T_H and lower T_C
$LEC$, 50),

('thermodynamics', 4, 'Phase Equilibria and Mixtures', $LEC$
## Phases of Matter

Materials exist in phases: solid, liquid, gas, and sometimes plasma. Which phase is stable depends on temperature and pressure.

A **phase diagram** shows the stable phase at each (T, P).

## The Phase Diagram of Water

Key features:
- **Triple point:** (0.01°C, 0.006 atm) — all three phases coexist
- **Critical point:** (374°C, 218 atm) — liquid and gas become indistinguishable
- **Melting line:** solid-liquid boundary
- **Sublimation line:** solid-gas boundary
- **Vaporization line:** liquid-gas boundary

Above the critical point, water is a supercritical fluid — used industrially for extraction and as a green solvent.

## Phase Transitions

- **Melting:** solid → liquid (latent heat of fusion, 334 kJ/kg for water)
- **Vaporization:** liquid → gas (latent heat of vaporization, 2257 kJ/kg for water at 100°C)
- **Sublimation:** solid → gas directly

Latent heats are large. Boiling 1 kg of water takes 7× more energy than heating it from 0 to 100°C.

## Clausius-Clapeyron Equation

Relates vapor pressure to temperature:

    dP/dT = L / (T × Δv)

where L is the latent heat and Δv is the volume change.

Integrating (for small ranges):

    ln(P₂/P₁) = -(L/R) × (1/T₂ - 1/T₁)

This is how pressure cookers work: higher pressure → higher boiling point → faster cooking.

## Humidity and Psychrometrics

For air-water mixtures:

- **Relative humidity (RH):** ratio of actual vapor pressure to saturation vapor pressure
- **Absolute humidity:** mass of water per mass of dry air
- **Dew point:** temperature at which condensation begins

If you cool air below its dew point, water condenses. This is why glasses sweat on humid days.

HVAC engineers use **psychrometric charts** to design air conditioning and drying systems.

## Mixtures and Partial Pressure

For a mixture of ideal gases:

**Dalton's law:**

    P_total = Σ P_i

Each gas has its own partial pressure P_i = y_i × P_total, where y_i is the mole fraction.

**Raoult's law for liquid mixtures:**

    P_i = x_i × P_i_sat

The vapor pressure of each component is proportional to its mole fraction in the liquid.

**Henry's law for dissolved gases:**

    P_i = k_H × x_i

Used for solubility of gases in liquids (e.g., CO₂ in water — carbonated drinks).

## Distillation

Separation by differences in volatility. Used everywhere:
- Refineries (crude oil → gasoline, diesel, jet fuel)
- Chemical plants (purify solvents)
- Whiskey production (separate ethanol)

Fractional distillation uses a column with many stages, each enriching the vapor in the more volatile component.

## Key Takeaways

- Phase diagrams show stable phases at each (T, P)
- Latent heats are large — phase changes dominate energy balances
- Clausius-Clapeyron relates vapor pressure to temperature
- Humidity is a key variable in HVAC and drying
- Dalton, Raoult, Henry: the three laws for mixtures
- Distillation separates by volatility
$LEC$, 50),

('thermodynamics', 5, 'Heat Transfer Modes', $LEC$
## Three Modes of Heat Transfer

Heat can move by:
1. **Conduction:** through a solid or stationary fluid
2. **Convection:** via a moving fluid
3. **Radiation:** electromagnetic waves

Real systems often have all three.

## Conduction — Fourier's Law

    q = -k × A × dT/dx

where:
- q = heat flow rate (W)
- k = thermal conductivity (W/m·K)
- A = area (m²)
- dT/dx = temperature gradient

For a plane wall of thickness L with T₁ on one side and T₂ on the other:

    q = k × A × (T₁ - T₂) / L

The **thermal resistance** is:

    R = L / (k × A)

This lets us use electrical circuit analogies: resistances in series add.

## Thermal Conductivity

| Material | k (W/m·K) |
|----------|-----------|
| Air | 0.026 |
| Water | 0.6 |
| Wood | 0.15 |
| Glass | 1.0 |
| Steel | 50 |
| Copper | 400 |
| Diamond | 2000 |

Metals conduct well (free electrons), gases poorly (few molecules). This is why vacuum flasks work.

## Convection — Newton's Law of Cooling

    q = h × A × (T_surface - T_fluid)

where h is the convection coefficient (W/m²·K):
- Natural convection (air): h = 5-25
- Forced convection (air): h = 25-250
- Boiling water: h = 3,000-100,000

Forced convection is much better than natural — this is why computers have fans.

## Radiation — Stefan-Boltzmann Law

    q = ε × σ × A × (T_s⁴ - T_env⁴)

where:
- ε = emissivity (0 to 1)
- σ = 5.67 × 10⁻⁸ W/m²·K⁴ (Stefan-Boltzmann constant)

Radiative heat transfer is significant at high temperatures (T⁴ dependence). At room temperature, radiation is usually small compared to convection, but at 1000°C it dominates.

## Combined Heat Transfer

For a wall with convection on both sides:

    q = (T_hot - T_cold) / R_total

where R_total = R_conv1 + R_cond + R_conv2.

Each resistance:
    R_conv = 1 / (h × A)
    R_cond = L / (k × A)

This is the standard approach for building insulation, heat exchangers, and electronics cooling.

## Thermal Resistance Example

A CPU generates 65 W. The heatsink has R_sa = 0.3 K/W (sink-to-air), and the thermal paste has R_cs = 0.1 K/W. Ambient is 25°C.

Case temperature: T_case = T_ambient + P × (R_sa + R_cs) = 25 + 65 × 0.4 = 51°C

Adequate cooling. If R_total were 0.8, we'd hit 77°C — too close to the limit.

## Heat Exchangers

Devices that transfer heat between two fluids without mixing them:
- **Parallel flow:** both fluids flow in the same direction. Temp difference decreases along the length. Limited performance.
- **Counterflow:** fluids flow in opposite directions. Higher effectiveness. Standard for most applications.

Log Mean Temperature Difference (LMTD):

    Q = U × A × LMTD

where U is the overall heat transfer coefficient (1/R_total).

## Key Takeaways

- Three modes: conduction, convection, radiation
- Conduction: Fourier's law q = -kA dT/dx
- Convection: Newton's cooling q = hA(Ts - T∞)
- Radiation: Stefan-Boltzmann q = εσA(Ts⁴ - T∞⁴)
- Thermal resistance lets us use circuit analogies
- Heat exchangers use counterflow for efficiency
- Radiation dominates at high temperatures
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('mechanics-materials', 'thermodynamics')
group by course_slug;