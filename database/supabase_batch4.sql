-- ============================================================
-- Batch 4: Fluid Mechanics (MIT 2.06) + Heat Transfer (MIT 2.51)
-- ============================================================

-- ============================================================
-- FLUID MECHANICS (MIT 2.06) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('fluid-mechanics', 1, 'Fluid Properties and Hydrostatics', $LEC$
## What is a Fluid?

A fluid is a substance that deforms continuously under shear stress, no matter how small. Gases and liquids are fluids; solids are not. This distinction matters because fluids flow, and their behavior is governed by different equations than solids.

## Key Fluid Properties

**Density (ρ):** mass per unit volume. Water: 1000 kg/m³, air at sea level: 1.2 kg/m³.

**Specific weight (γ):** weight per unit volume. γ = ρg.

**Viscosity (μ):** resistance to shear. Water at 20°C: 0.001 Pa·s. Honey: 10 Pa·s.

**Kinematic viscosity (ν):** ν = μ/ρ. Water: 10⁻⁶ m²/s. Important in boundary layer analysis.

**Surface tension (σ):** energy per unit area at a liquid-gas interface. Water-air: 0.072 N/m. Explains capillary action, droplet formation, and why insects can walk on water.

**Bulk modulus (K):** resistance to compression. Water: 2.2 GPa. Liquids are almost incompressible, which is why hydraulic systems work.

## Pressure

Pressure is force per unit area:

    P = F/A

Units: pascal (Pa), bar (10⁵ Pa), atmosphere (101,325 Pa), psi (6895 Pa).

**Absolute vs gauge pressure:** absolute pressure is measured from vacuum; gauge pressure is measured relative to atmospheric:

    P_abs = P_gauge + P_atm

Most pressure gauges read gauge pressure.

## Hydrostatic Pressure

Pressure in a static fluid increases with depth:

    P = P₀ + ρ × g × h

For water, each 10 m of depth adds ~1 atm of pressure.

This is why:
- Submarines have thick hulls
- Dams are thicker at the base
- Ears hurt at the bottom of a pool

## Hydrostatic Force on a Surface

For a submerged flat plate:

    F = ρ × g × h_c × A

where h_c is the depth of the centroid and A is the area.

The center of pressure (where the resultant force acts) is always below the centroid for a vertical surface, because pressure increases with depth.

    y_cp = y_c + I_c / (y_c × A)

where I_c is the moment of inertia about the centroidal axis.

## Buoyancy — Archimedes' Principle

A body immersed in a fluid experiences an upward buoyant force equal to the weight of the displaced fluid:

    F_b = ρ_fluid × g × V_displaced

If F_b > weight, the body floats. If F_b < weight, it sinks.

A floating body displaces a volume of fluid equal to its weight. This is how ships float, how hot air balloons rise, and how fish control depth with their swim bladders.

## Stability of Floating Bodies

A floating body is stable if, when tilted, the restoring moment brings it back upright. The key point is the **metacenter** — the intersection of the buoyancy force line with the body's axis.

- If metacenter is above center of gravity: stable
- If metacenter is below center of gravity: unstable

This is why ships carry ballast low in the hull — to keep the center of gravity low.

## Manometry

Manometers measure pressure using columns of liquid:

    P₁ - P₂ = ρ × g × Δh

U-tube manometers are the classic instrument. Inclined manometers amplify the reading for small pressure differences.

## Key Takeaways

- Fluids deform continuously under shear
- Hydrostatic pressure: P = ρgh
- Buoyancy: F = ρ_fluid × g × V_displaced
- Metacenter determines stability of floating bodies
- Manometers measure pressure via liquid columns
- Viscosity, surface tension, and bulk modulus are the key fluid properties
$LEC$, 50),

('fluid-mechanics', 2, 'Fluid Kinematics and Bernoulli Equation', $LEC$
## Describing Fluid Motion

Two frameworks:

**Lagrangian:** follow individual particles. Good for tracking.

**Eulerian:** observe what happens at fixed points. Standard in fluid mechanics.

In the Eulerian view, velocity is a field v(x, y, z, t).

## Types of Flow

- **Steady:** properties don't change with time at any point
- **Unsteady:** properties change with time
- **Laminar:** smooth, orderly, parallel streamlines
- **Turbulent:** chaotic, with random fluctuations
- **Incompressible:** density is constant (liquids and low-speed gases)
- **Inviscid:** viscosity is negligible
- **1D, 2D, 3D:** number of spatial dimensions needed

## Streamlines, Pathlines, Streaklines

- **Streamline:** curve tangent to velocity at every point (instantaneous)
- **Pathline:** trajectory of a single particle over time
- **Streakline:** locus of particles that passed a given point

In steady flow, all three coincide.

## Continuity Equation

Mass conservation:

    ρ₁ A₁ V₁ = ρ₂ A₂ V₂

For incompressible flow:

    A₁ V₁ = A₂ V₂

Flow rate Q = A × V is constant. A wide pipe has slow flow; a narrow pipe has fast flow.

## The Bernoulli Equation

For steady, incompressible, inviscid flow along a streamline:

    P + ½ ρ V² + ρ g z = constant

Each term is energy per unit volume:
- P: pressure energy (static pressure)
- ½ρV²: kinetic energy (dynamic pressure)
- ρgz: potential energy (hydrostatic)

The Bernoulli equation is the most-used equation in fluid mechanics.

## Applications of Bernoulli

**Pitot tube:** measures velocity from stagnation pressure.

    V = √(2 × (P_stagnation - P_static) / ρ)

Used on aircraft (airspeed indicator) and in wind tunnels.

**Venturi meter:** narrow section speeds up flow, drops pressure; measure ΔP to find Q.

**Atomizer:** fast air past a liquid surface creates low pressure that sucks liquid up and disperses it.

**Airfoil:** faster air over the top of the wing = lower pressure = lift.

**Curveball:** spinning ball drags air, creating asymmetric pressure → sideways force.

## Limitations of Bernoulli

Bernoulli assumes:
- Steady flow
- Incompressible
- Inviscid (no friction)
- Along a streamline

Real flows have viscosity, which causes energy losses. The extended Bernoulli with head loss:

    P₁/ρg + V₁²/2g + z₁ = P₂/ρg + V₂²/2g + z₂ + h_L

where h_L is the head loss (energy lost to friction).

## Energy Line and Hydraulic Grade Line

**Energy Line (EL):** total energy = P/ρg + V²/2g + z. Always decreasing in real flow.

**Hydraulic Grade Line (HGL):** piezometric head = P/ρg + z. The HGL is always below the EL by V²/2g.

These lines are used in pipe network analysis to visualize pressure distribution.

## Key Takeaways

- Eulerian viewpoint describes velocity fields
- Laminar vs turbulent, steady vs unsteady
- Continuity: A₁V₁ = A₂V₂
- Bernoulli: P + ½ρV² + ρgz = constant
- Applies only to steady, inviscid, incompressible flow
- Pitot, Venturi, airfoil all use Bernoulli
- Real flows have losses — extended Bernoulli includes h_L
$LEC$, 50),

('fluid-mechanics', 3, 'Viscous Flow and the Navier-Stokes Equations', $LEC$
## Viscosity Revisited

Viscosity is the internal friction of a fluid. Newton's law of viscosity:

    τ = μ × du/dy

where τ is shear stress and du/dy is the velocity gradient. Fluids obeying this are "Newtonian" (water, air, most gases and simple liquids). Non-Newtonian fluids (blood, ketchup, polymer melts) have more complex behavior.

## Reynolds Number

The single most important dimensionless number in fluid mechanics:

    Re = ρ V L / μ = V L / ν

It's the ratio of inertial forces to viscous forces:
- Low Re (< 2300 in pipes): laminar
- High Re (> 4000): turbulent
- 2300-4000: transitional

The same geometry has the same behavior at the same Re, regardless of scale. This is why model testing in wind tunnels works.

## The Navier-Stokes Equations

Newton's second law for a fluid element:

    ρ (∂v/∂t + v·∇v) = -∇P + μ ∇²v + ρ g

This is a system of nonlinear partial differential equations. Solving them is one of the hardest problems in mathematics (one of the Millennium Prize problems).

Terms:
- ρ ∂v/∂t: unsteady acceleration
- ρ v·∇v: convective acceleration (nonlinear)
- -∇P: pressure force
- μ ∇²v: viscous force
- ρg: gravity

## Exact Solutions

For simple geometries, analytic solutions exist:

**Couette flow:** flow between two parallel plates, one moving. Linear velocity profile.

**Poiseuille flow:** flow through a circular pipe. Parabolic profile.

    V(r) = (ΔP / (4 μL)) × (R² - r²)

    Q = π R⁴ ΔP / (8 μL)

This is the **Hagen-Poiseuille equation**. Flow rate depends on R⁴ — doubling the pipe radius gives 16× the flow.

**Stokes flow:** very low Re, inertia negligible. Used for swimming microorganisms and sedimentation.

## Boundary Layers

Near a solid surface, viscosity dominates in a thin layer called the boundary layer. Outside this layer, flow is essentially inviscid.

Boundary layer thickness grows as δ ~ √(νx/V). For air at 10 m/s over a 1 m plate, δ ≈ 5 mm.

Inside the boundary layer:
- Velocity goes from 0 at the wall to V∞ at the edge
- Shear stress at the wall causes drag

## Laminar vs Turbulent Boundary Layers

**Laminar:** smooth, low drag (skin friction only).

**Turbulent:** chaotic, higher skin friction, but delays separation → less pressure drag.

This is why golf balls have dimples: they trip the boundary layer to turbulent, delaying separation, reducing total drag.

## Separation and Drag

When the pressure gradient is adverse (pressure increasing along flow), the boundary layer can separate from the surface, creating a wake with low pressure behind the body → pressure drag.

Streamlined shapes delay separation; blunt shapes separate early.

Drag force:

    F_D = ½ ρ V² C_D A

where C_D is the drag coefficient (from experiments or CFD).

## Key Takeaways

- Newton's law of viscosity: τ = μ du/dy
- Reynolds number: Re = ρVL/μ
- Navier-Stokes: nonlinear PDEs governing all fluid flow
- Poiseuille: Q ∝ R⁴ for pipe flow
- Boundary layers form near surfaces
- Laminar vs turbulent boundary layers differ greatly
- Drag depends on shape and Re
$LEC$, 50),

('fluid-mechanics', 4, 'Pipe Flow and Head Loss', $LEC$
## Laminar Pipe Flow

For laminar flow in a circular pipe, the Hagen-Poiseuille equation gives:

    ΔP = 128 μ L Q / (π D⁴)

The velocity profile is parabolic, with V_max = 2 × V_avg.

This is a beautiful, exact solution — but valid only for Re < 2300.

## Turbulent Pipe Flow

For turbulent flow, no exact solution exists. We rely on:

- Empirical correlations
- Moody chart (or Colebrook equation)
- Experimental data

The velocity profile is much flatter (almost uniform in the core, steep near the wall).

## The Darcy-Weisbach Equation

The standard formula for head loss in a pipe:

    h_L = f × (L/D) × (V² / 2g)

where:
- f = friction factor (dimensionless)
- L = pipe length
- D = pipe diameter
- V = average velocity
- g = gravity

Head loss is energy lost to friction — measured in meters of fluid column.

## Friction Factor

**Laminar:** f = 64 / Re (exact, from Poiseuille)

**Turbulent (smooth pipe):** f depends on Re

**Turbulent (rough pipe):** f depends on Re AND relative roughness ε/D

## Moody Chart

The Moody chart plots f vs Re for various ε/D ratios. It's the most-used chart in fluid mechanics.

The Colebrook equation (implicit) gives the same result:

    1/√f = -2 log₁₀(ε/(3.7D) + 2.51/(Re√f))

Solved iteratively or via approximations like Swamee-Jain:

    f = 0.25 / [log₁₀(ε/(3.7D) + 5.74/Re^0.9)]²

## Minor Losses

Fittings, valves, bends, and other components also cause head loss:

    h_m = K × V² / 2g

where K is the loss coefficient (from tables):
- 90° elbow: K ≈ 0.9
- Tee (branch flow): K ≈ 1.8
- Gate valve (open): K ≈ 0.2
- Globe valve (open): K ≈ 10

Total head loss is the sum of major (friction) and minor (fittings) losses.

## The Energy Equation for Pipes

Combining Bernoulli with losses:

    P₁/γ + V₁²/2g + z₁ = P₂/γ + V₂²/2g + z₂ + h_L

where γ = ρg is the specific weight.

For a pump, add pump head h_p. For a turbine, subtract turbine head h_t.

## Example: Water Supply Pipe

Water flows from a reservoir through 100 m of 50 mm cast iron pipe (ε = 0.26 mm) at a rate of 2 L/s. Find the head loss.

1. Velocity: V = Q/A = 0.002 / (π × 0.025²) = 1.02 m/s
2. Reynolds: Re = V×D/ν = 1.02 × 0.05 / 10⁻⁶ = 51,000 (turbulent)
3. Relative roughness: ε/D = 0.26/50 = 0.0052
4. From Moody chart: f ≈ 0.031
5. Head loss: h_L = 0.031 × (100/0.05) × (1.02² / (2 × 9.81)) = 3.3 m

Plus fitting losses if there are bends, valves, etc.

## Pumps and System Curves

A pump must overcome:
- Static head (elevation difference)
- Friction losses
- Minor losses
- Pressure difference

The **system curve** shows required head vs flow. The **pump curve** shows what the pump delivers. Their intersection is the operating point.

If the operating point is far from the pump's best efficiency point (BEP), efficiency drops and the pump may cavitate.

## Key Takeaways

- Laminar flow: exact solution (Hagen-Poiseuille)
- Turbulent flow: empirical (Moody, Colebrook)
- Darcy-Weisbach: h_L = f(L/D)(V²/2g)
- Friction factor from Moody chart or Colebrook
- Minor losses: h_m = K V²/2g
- Pumps add head; system curve determines operating point
- Cavitation occurs when local pressure drops below vapor pressure
$LEC$, 50),

('fluid-mechanics', 5, 'Dimensional Analysis and Similarity', $LEC$
## Why Dimensional Analysis?

Experiments are expensive. If we can identify the dimensionless groups that govern a problem, we can:

- Reduce the number of variables
- Design scale models that predict full-scale behavior
- Compare data across different systems

## The Buckingham Pi Theorem

If a physical problem has n variables and m fundamental dimensions (M, L, T), there are n - m independent dimensionless groups.

Procedure:
1. List all variables
2. Express each in fundamental dimensions
3. Choose m repeating variables (with independent dimensions)
4. Form each Pi group from the remaining variables

## Classic Example: Drag on a Sphere

Variables: F_D (force), V (velocity), D (diameter), ρ (density), μ (viscosity)

Dimensions: [M L T⁻²], [L T⁻¹], [L], [M L⁻³], [M L⁻¹ T⁻¹]

n = 5 variables, m = 3 dimensions → 2 Pi groups

Choose repeating variables: ρ, V, D

π₁ = F_D / (ρ V² D²) — this is the drag coefficient
π₂ = μ / (ρ V D) — this is 1/Re

So: F_D / (ρV²D²) = f(Re)

The drag coefficient depends only on Reynolds number. Thousands of experiments collapse to a single curve.

## Important Dimensionless Numbers

**Reynolds (Re) = ρVL/μ:** inertial / viscous. Governs laminar vs turbulent transition.

**Mach (Ma) = V/c:** flow speed / speed of sound. Ma > 0.3 = compressible.

**Froude (Fr) = V/√(gL):** inertial / gravitational. Governs free-surface flows (ships, open channels).

**Weber (We) = ρV²L/σ:** inertial / surface tension. Governs droplet breakup.

**Euler (Eu) = ΔP / ρV²:** pressure / inertial. Used in pipe flow.

**Prandtl (Pr) = μCp/k:** momentum / thermal diffusivity. Governs heat transfer.

**Nusselt (Nu) = hL/k:** convective / conductive heat transfer. Governs heat transfer coefficients.

## Similarity Requirements

For a scale model to represent a full-scale system, all relevant dimensionless groups must match.

**Geometric similarity:** same shape, scaled by factor L_r

**Kinematic similarity:** same velocity ratios everywhere

**Dynamic similarity:** same force ratios

In practice, we can't always match all groups. For ships, matching both Fr and Re is impossible at reduced scale — we prioritize Fr and correct for Re.

## Modeling Example: Ship Resistance

A 1:50 scale ship model is tested in a towing tank. If the model's drag is measured, the full-scale drag is predicted by:

    F_full = F_model × (ρ_full / ρ_model) × (L_full / L_model)³ × (C_D_full / C_D_model)

Since C_D is a function of Fr (matched) and Re (corrected via empirical formulas), we can compute full-scale drag from model tests.

## Benefits of Dimensional Analysis

- Reduces experiments dramatically
- Reveals the physics via dimensionless groups
- Enables scale modeling
- Guides CFD validation
- Universal — applies to heat transfer, structures, chemistry, biology

## Key Takeaways

- Buckingham Pi: n variables, m dimensions → n-m groups
- Re, Ma, Fr, We, Pr, Nu are the key dimensionless numbers
- Similarity requires matching the relevant groups
- Scale models enable prediction of full-scale behavior
- Dimensional analysis is universal across physics
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- HEAT TRANSFER (MIT 2.51) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('heat-transfer', 1, 'Introduction to Heat Transfer Modes', $LEC$
## What is Heat Transfer?

Heat transfer is the study of energy movement due to temperature differences. It's distinct from thermodynamics: thermodynamics tells us whether a process is possible; heat transfer tells us how fast it happens.

Three modes:
1. **Conduction:** through solids or stationary fluids
2. **Convection:** between a surface and a moving fluid
3. **Radiation:** electromagnetic waves, no medium needed

## Conduction — Fourier's Law

    q = -k × A × dT/dx

where q is the heat rate (W), k is thermal conductivity (W/m·K), A is area (m²), and dT/dx is the temperature gradient.

For a plane wall of thickness L:

    q = k × A × (T₁ - T₂) / L

Thermal resistance:

    R_cond = L / (k × A)

## Thermal Conductivity

| Material | k (W/m·K) |
|----------|-----------|
| Air | 0.026 |
| Foam | 0.03 |
| Water | 0.6 |
| Glass | 1.0 |
| Stainless steel | 16 |
| Aluminum | 205 |
| Copper | 385 |
| Diamond | 2000 |

The huge range (5 orders of magnitude) explains why insulation works so well and why heat sinks are made of aluminum or copper.

## Convection — Newton's Law of Cooling

    q = h × A × (T_s - T_∞)

where h is the convection heat transfer coefficient (W/m²·K):
- Natural convection (air): 5-25
- Forced convection (air): 25-250
- Natural convection (water): 20-100
- Forced convection (water): 500-10,000
- Boiling: 3,000-100,000
- Condensation: 5,000-100,000

Convective thermal resistance:

    R_conv = 1 / (h × A)

## Radiation — Stefan-Boltzmann

    q = ε × σ × A × (T_s⁴ - T_surr⁴)

where ε is emissivity (0-1), σ = 5.67 × 10⁻⁸ W/m²·K⁴.

For small temperature differences, we can linearize:

    q ≈ h_r × A × (T_s - T_surr)

where h_r = 4εσT_m³ is the radiative heat transfer coefficient.

At room temperature, h_r ≈ 6 W/m²·K for ε = 1. So radiation is comparable to natural convection at room temperature.

## Combined Heat Transfer

Real systems often have all three modes simultaneously. Use thermal resistance networks:

    R_total = R_conv1 + R_cond + R_conv2

For a composite wall with N layers:

    R_total = Σ (L_i / k_i A) + 1/(h₁A) + 1/(h₂A)

Heat rate:

    q = ΔT / R_total

## Overall Heat Transfer Coefficient

For a wall separating two fluids:

    q = U × A × ΔT

where U is the overall coefficient:

    1/U = 1/h₁ + Σ(L_i/k_i) + 1/h₂

U values:
- Single glass window: U = 5.7 W/m²·K
- Double glazed: U = 2.8 W/m²·K
- Well-insulated wall: U = 0.3 W/m²·K
- Vacuum flask: U < 0.05

## Key Takeaways

- Three modes: conduction, convection, radiation
- Fourier: q = -kA dT/dx
- Newton: q = hA(T_s - T_∞)
- Stefan-Boltzmann: q = εσA(T_s⁴ - T_surr⁴)
- Thermal resistance networks combine modes
- U-value summarizes overall heat transfer
$LEC$, 50),

('heat-transfer', 2, 'Steady-State Conduction', $LEC$
## The Heat Diffusion Equation

The general equation for conduction:

    ∂/∂x (k ∂T/∂x) + ∂/∂y (k ∂T/∂y) + ∂/∂z (k ∂T/∂z) + q_gen = ρ Cp ∂T/∂t

For 1D, steady, no generation:

    d/dx (k dT/dx) = 0

For constant k:

    d²T/dx² = 0

Solution: T(x) is linear in a plane wall.

## Plane Wall

Temperature profile: T(x) = T₁ + (T₂ - T₁) × x/L

Heat rate: q = kA(T₁ - T₂)/L

Constant heat rate through the wall.

## Cylindrical Wall (Pipe Insulation)

For a cylinder of inner radius r₁ and outer radius r₂:

    q = 2πkL(T₁ - T₂) / ln(r₂/r₁)

Thermal resistance:

    R = ln(r₂/r₁) / (2πkL)

The critical radius of insulation:

    r_cr = k / h

Adding insulation increases heat loss until r = r_cr, then decreases. For thin wires, adding a small amount of insulation can actually increase heat loss.

## Spherical Shell

    q = 4πk(T₁ - T₂) / (1/r₁ - 1/r₂)

Used for spherical tanks and spheres of insulating material.

## Composite Walls

For N layers in series:

    q = (T₁ - T_{N+1}) / Σ R_i

where R_i = L_i / (k_i A).

Interface temperatures are found by working through the resistances.

## Contact Resistance

Real surfaces have microscopic roughness, creating an interface resistance:

    R_contact = 1 / (h_c A)

where h_c is the contact conductance (W/m²·K). Typical values:
- Metal-metal, smooth, high pressure: 10,000-30,000
- Metal-metal, rough, low pressure: 1,000-5,000
- With thermal paste: 5,000-20,000
- With air gap: 100-1,000

This matters for electronics cooling — a bad CPU-heatsink interface can dominate thermal resistance.

## Extended Surfaces (Fins)

Fins increase surface area for convective heat transfer. Common types:
- Straight fins (rectangular cross-section)
- Pin fins (circular)
- Annular fins (around pipes)

Fin efficiency:

    η_fin = actual heat transfer / maximum possible (if entire fin at base temperature)

For a straight fin with adiabatic tip:

    η_fin = tanh(mL) / (mL)

where m = √(hP/(kA_c)).

Overall surface efficiency:

    η_o = 1 - (A_fin/A_total) × (1 - η_fin)

Fin effectiveness:

    ε_fin = q_fin / (h A_c θ_b)

Effective fins have ε > 2. For ε < 2, the fin isn't worth the cost.

## Applications

- Heat sinks for electronics (aluminum fins)
- Radiators in cars
- Fins on air-cooled engines
- Heat exchanger tubes (often finned on the air side)

## Key Takeaways

- 1D steady conduction: T is linear in a plane wall, logarithmic in a cylinder
- Composite walls: resistances add
- Contact resistance is often the bottleneck
- Fins increase surface area; efficiency depends on geometry
- Critical radius of insulation for cylinders
- Fin effectiveness must exceed 2 for a fin to be worthwhile
$LEC$, 50),

('heat-transfer', 3, 'Convection Fundamentals', $LEC$
## The Convection Coefficient

Convection depends on:
- Fluid properties (k, μ, Cp, ρ)
- Flow velocity
- Surface geometry
- Whether flow is laminar or turbulent
- Whether it's natural or forced

The convection coefficient h bundles all of this. Typical values range from 5 to 100,000 W/m²·K — a huge range.

## The Nusselt Number

Dimensionless heat transfer coefficient:

    Nu = h × L / k_fluid

Nu = 1 means pure conduction; Nu >> 1 means convection dominates.

For a flat plate in laminar flow:

    Nu = 0.332 × Re^0.5 × Pr^(1/3)

For turbulent:

    Nu = 0.037 × Re^0.8 × Pr^(1/3)

## Reynolds and Prandtl Numbers

Re = ρVL/μ characterizes flow regime.

Pr = μCp/k = ν/α characterizes the fluid:
- Liquid metals: Pr << 1
- Gases: Pr ≈ 0.7
- Water: Pr ≈ 7
- Oils: Pr >> 100

## External Flow over a Flat Plate

Laminar boundary layer until Re_x = 5 × 10⁵. Then transition to turbulent.

Local Nusselt number:
    Laminar: Nu_x = 0.332 Re_x^0.5 Pr^(1/3)
    Turbulent: Nu_x = 0.0296 Re_x^0.8 Pr^(1/3)

Average Nusselt number over a plate of length L:
    Laminar: Nu_L = 0.664 Re_L^0.5 Pr^(1/3)
    Turbulent: Nu_L = 0.037 Re_L^0.8 Pr^(1/3)

## Flow over Cylinders and Spheres

The Churchill-Bernstein correlation covers a wide Re range for cylinders:

    Nu_D = 0.3 + 0.62 Re^0.5 Pr^(1/3) / [1 + (0.4/Pr)^(2/3)]^0.25 × [1 + (Re/282000)^0.625]^0.8

For spheres, the Whitaker correlation is standard.

## Internal Flow (Pipe Flow)

Entry length: L_e/D ≈ 0.05 Re (laminar), 10 (turbulent).

For laminar fully developed flow:
    Nu_D = 3.66 (constant wall temperature)
    Nu_D = 4.36 (constant heat flux)

For turbulent (Dittus-Boelter):
    Nu_D = 0.023 Re^0.8 Pr^n
    where n = 0.4 for heating, 0.3 for cooling

## Natural Convection

When buoyancy drives flow, use:

    Nu = C × Ra^n

where Ra = Gr × Pr is the Rayleigh number:

    Gr = g β ΔT L³ / ν² (Grashof number)

Typical for a vertical plate:
    Laminar (10⁴ < Ra < 10⁹): Nu = 0.59 Ra^0.25
    Turbulent (Ra > 10⁹): Nu = 0.13 Ra^(1/3)

Natural convection gives much lower h than forced. Air-cooled heat sinks rely on natural convection, so they need to be large.

## Boiling and Condensation

Boiling has different regimes:
- **Nucleate boiling:** bubbles form at nucleation sites, very high h
- **Transition boiling:** unstable, h decreases
- **Film boiling:** vapor blanket, low h (this is why quenching in water works — the film boiling phase cools slowly)

Condensation:
- **Filmwise:** liquid film on surface, moderate h
- **Dropwise:** droplets form and fall off, much higher h (10× filmwise)

## Key Takeaways

- Convection coefficient h is the key unknown
- Nusselt number relates h to k
- Correlations exist for common geometries
- Laminar vs turbulent matters (different Nu formulas)
- Natural convection gives lower h than forced
- Boiling and condensation have extremely high h
- Always check which correlation applies to your case
$LEC$, 50),

('heat-transfer', 4, 'Radiation Heat Transfer', $LEC$
## The Nature of Radiation

All objects emit electromagnetic radiation. The intensity and spectrum depend on temperature.

Thermal radiation is in the infrared (wavelength 0.1-100 µm) for room-temperature objects, and extends into visible for very hot objects (like the sun).

## Blackbody Radiation

A blackbody absorbs all incident radiation. Its emission is described by:

**Planck's law** (spectral distribution):

    E_λb = (2πhc² / λ⁵) × 1 / (e^(hc/λkT) - 1)

**Wien's displacement law** (peak wavelength):

    λ_max = 2898 / T (µm, with T in K)

At T = 3000 K, λ_max = 0.97 µm (infrared, near-visible).

**Stefan-Boltzmann law** (total emission):

    E_b = σ T⁴

where σ = 5.67 × 10⁻⁸ W/m²·K⁴.

## Real Surfaces

Real surfaces emit less than a blackbody. The ratio is **emissivity** ε:

    E = ε × σ × T⁴

Emissivity ranges:
- Polished aluminum: ε = 0.05
- Oxidized aluminum: ε = 0.3
- White paint: ε = 0.9
- Black paint: ε = 0.95
- Human skin: ε = 0.98

High-emissivity surfaces radiate well; low-emissivity surfaces (like polished metal) do not. This is why silvered surfaces are used in vacuum flasks.

## Absorptivity, Reflectivity, Transmissivity

Incident radiation is distributed among:
- Absorptivity α (absorbed)
- Reflectivity ρ (reflected)
- Transmissivity τ (transmitted)

    α + ρ + τ = 1

For opaque surfaces, τ = 0, so α + ρ = 1.

**Kirchhoff's law:** for a surface in thermal equilibrium, α = ε at each wavelength. Good absorbers are good emitters.

## View Factors

Radiative exchange between surfaces depends on geometry through the view factor F_ij — the fraction of radiation leaving surface i that reaches surface j.

Reciprocity: A_i F_ij = A_j F_ji

Summation: Σ F_ij = 1

For common geometries, F values are tabulated:
- Two parallel plates: F = 1 for infinite plates
- Small object in large enclosure: F = 1 (all emission reaches enclosure)
- Two perpendicular plates: F ≈ 0.2

## Radiation Exchange Between Surfaces

For two gray diffuse surfaces forming an enclosure:

    q_12 = σ × (T₁⁴ - T₂⁴) / [(1-ε₁)/(ε₁A₁) + 1/(A₁F₁₂) + (1-ε₂)/(ε₂A₂)]

This is the general formula. For common cases, simplifications exist:

**Small object in large enclosure:**

    q = ε × σ × A × (T_s⁴ - T_surr⁴)

## Combined Convection and Radiation

Real surfaces lose heat by both convection and radiation. Add the two:

    q_total = h_conv × A × (T_s - T_air) + ε × σ × A × (T_s⁴ - T_surr⁴)

For small ΔT, linearize radiation:

    h_r = 4 × ε × σ × T_m³

So total h = h_conv + h_r. At room temperature, h_r ≈ 6 W/m²·K for ε = 1.

## Radiation Shields

To reduce radiation, insert a low-emissivity shield between surfaces. Each shield reduces heat transfer.

For N shields between two surfaces:

    q_with_shields / q_without = 1 / (N + 1)

This is how multi-layer insulation (MLI) works in spacecraft — many aluminized Mylar layers reduce radiative heat loss dramatically.

## Key Takeaways

- All objects radiate; blackbodies are ideal emitters
- Stefan-Boltzmann: E = εσT⁴
- Wien's law: peak wavelength = 2898/T
- Kirchhoff: α = ε (good absorbers are good emitters)
- View factors describe geometric exchange
- Radiation shields reduce heat transfer
- At room temperature, radiation ≈ convection (h_r ≈ 6)
- At high temperature, radiation dominates (T⁴)
$LEC$, 50),

('heat-transfer', 5, 'Heat Exchangers', $LEC$
## What is a Heat Exchanger?

A device that transfers heat between two fluids without mixing them. Everywhere:
- Car radiators
- Air conditioners
- Power plant condensers
- Chemical plant preheaters
- Computer CPU coolers
- Refrigerators

## Classification

**By flow arrangement:**
- **Parallel flow:** both fluids enter at the same end, flow in the same direction
- **Counterflow:** fluids enter at opposite ends, flow in opposite directions
- **Crossflow:** fluids flow perpendicular to each other
- **Shell and tube:** one fluid in tubes, one in the shell

**By construction:**
- **Tubular:** concentric tubes, shell-and-tube, spiral
- **Plate:** flat plates stacked, compact
- **Extended surface:** finned tubes (for gas-liquid)

## The Overall Heat Transfer Coefficient

    Q = U × A × ΔT_lm

where:
- Q = heat duty (W)
- U = overall heat transfer coefficient
- A = heat transfer area
- ΔT_lm = log mean temperature difference

U depends on the individual resistances:

    1/UA = 1/(h_i A_i) + R_wall + 1/(h_o A_o)

where i and o refer to inner and outer surfaces.

Typical U values:
- Water-to-water: 800-1500 W/m²·K
- Water-to-air (finned): 25-100
- Steam-to-water: 1000-3000
- Gas-to-gas: 10-50

## Log Mean Temperature Difference

For counterflow or parallel flow:

    ΔT_lm = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)

where ΔT₁ and ΔT₂ are the temperature differences at the two ends.

Counterflow gives higher ΔT_lm than parallel flow for the same inlet/outlet temperatures → smaller heat exchanger for the same duty.

## Counterflow vs Parallel

Consider hot fluid cooling from 100°C to 60°C, cold fluid heating from 20°C to 50°C.

Parallel flow:
- ΔT₁ = 100 - 20 = 80°C
- ΔT₂ = 60 - 50 = 10°C
- ΔT_lm = (80-10)/ln(8) = 43.3°C

Counterflow:
- ΔT₁ = 100 - 50 = 50°C
- ΔT₂ = 60 - 20 = 40°C
- ΔT_lm = (50-40)/ln(1.25) = 44.8°C

Similar in this case, but counterflow can achieve much more when the hot outlet would be lower than the cold outlet.

## Effectiveness-NTU Method

When outlet temperatures are unknown (they depend on the heat exchanger), the LMTD method requires iteration. The **effectiveness-NTU** method avoids this.

**Effectiveness (ε):**

    ε = Q_actual / Q_max

where Q_max = C_min × (T_h,in - T_c,in).

C_min is the smaller of C_h = m_h × Cp_h and C_c = m_c × Cp_c.

**NTU (Number of Transfer Units):**

    NTU = U × A / C_min

For each flow arrangement, there's a relation between ε and NTU:

**Parallel flow:**
    ε = [1 - exp(-NTU(1 + Cr))] / (1 + Cr)

**Counterflow:**
    ε = [1 - exp(-NTU(1 - Cr))] / [1 - Cr × exp(-NTU(1 - Cr))]

where Cr = C_min / C_max.

For Cr = 1 counterflow: ε = NTU / (1 + NTU).

## Design Procedure

1. Compute heat duty Q = m_h × Cp_h × (T_h,in - T_h,out)
2. Compute C_min, C_max, Cr
3. Compute Q_max = C_min × (T_h,in - T_c,in)
4. Required ε = Q / Q_max
5. From ε-NTU relation, find NTU
6. A = NTU × C_min / U

## Fouling

Over time, deposits on heat transfer surfaces add resistance. Fouling factors R_f are added to the U calculation:

    1/U_dirty = 1/U_clean + R_f,i + R_f,o

Typical fouling factors: 0.0001-0.001 m²·K/W.

Fouling is often the dominant resistance after months of operation. Regular cleaning (chemical or mechanical) is essential.

## Key Takeaways

- Heat exchangers transfer heat between fluids
- Counterflow is more efficient than parallel flow
- LMTD method: Q = UA ΔT_lm
- ε-NTU method when outlet temps are unknown
- U depends on both fluid-side resistances
- Fouling adds resistance over time
- Compact heat exchangers use fins for gas-side enhancement
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('fluid-mechanics', 'heat-transfer')
group by course_slug;