-- ============================================================
-- Batch 5: Real-Time Systems (CMU 18-549) + Designing Information Devices (Berkeley EE16A)
-- ============================================================

-- ============================================================
-- REAL-TIME SYSTEMS (CMU 18-549) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('real-time-systems', 1, 'Introduction to Real-Time Systems', $LEC$
## What is a Real-Time System?

A real-time system is one where the correctness of the system depends not only on the logical result of computation, but also on the time at which the result is produced. A late answer is a wrong answer.

Examples:
- Airbag deployment: must fire within milliseconds of impact
- Pacemaker: must deliver a pulse at exactly the right moment
- ABS brakes: must release pressure at the right time
- Flight control: must respond to pilot input within 50 ms
- Industrial robots: must complete tasks within cycle time

## Hard vs Soft Real-Time

**Hard real-time:** missing a deadline is catastrophic. Failure modes: airbag doesn't fire, pacemaker misses a beat, plane crashes.

**Firm real-time:** missing a deadline makes the result useless, but not catastrophic. Example: video frame decoding — a late frame is dropped.

**Soft real-time:** missing a deadline degrades quality but the system continues. Example: audio streaming — occasional glitches are tolerated.

## Why Not Just "Fast"?

Real-time isn't about being fast — it's about being **predictable**. A system that's usually fast but occasionally takes 100 ms is worse for real-time than one that's always 5 ms.

Deterministic timing is the goal. That's why real-time systems avoid:
- Garbage collection (unpredictable pauses)
- Dynamic memory allocation (fragmentation, unpredictable timing)
- Caches (usually helpful, but can cause timing variability)
- Complex scheduling algorithms with high overhead

## The Real-Time Challenge

Three sources of unpredictability:
1. **Interrupt latency:** how long until the CPU responds to an external event
2. **Scheduling latency:** how long until the right task runs
3. **Execution time variability:** how long a task takes to run

Real-time systems must bound all three.

## Deadline Types

- **Absolute deadline:** a specific time (e.g., "complete by 3:00:00 PM")
- **Relative deadline:** a time from release (e.g., "complete within 50 ms of activation")
- **Periodic tasks:** released at regular intervals
- **Aperiodic tasks:** released at arbitrary times
- **Sporadic tasks:** aperiodic, but with minimum inter-arrival times

## A Classic Example: Cruise Control

A car's cruise control is a periodic real-time task:
- Sample the speed sensor every 10 ms
- Compute control output
- Send to throttle actuator
- Deadline: 10 ms (if missed, control loop becomes unstable)

If the deadline is missed occasionally, the car may jerk. If missed frequently, the car oscillates dangerously.

## Key Takeaways

- Real-time = correctness depends on timing
- Hard, firm, soft categories based on consequences of missing deadlines
- Predictability > raw speed
- Interrupt latency, scheduling latency, execution variability are the three unpredictability sources
- Periodic, aperiodic, sporadic tasks are the basic types
$LEC$, 50),

('real-time-systems', 2, 'Task Scheduling: RM and EDF', $LEC$
## The Scheduling Problem

Given a set of tasks with deadlines, how do we schedule them on one (or more) CPUs to meet all deadlines?

For periodic tasks, a schedule is a repeating pattern. If all deadlines are met in the first "hyperperiod" (LCM of periods), they'll be met forever.

## Task Model

Each task Ti is characterized by:
- **Period Ti:** release interval
- **Execution time Ci:** worst-case compute time
- **Deadline Di:** usually = Ti (implicit deadlines)
- **Utilization Ui = Ci / Ti**

Total utilization: U = Σ Ui.

If U > 1, no schedule can meet all deadlines. If U ≤ 1, we need the right algorithm.

## Rate Monotonic (RM) Scheduling

**Priority = 1 / period.** Shorter period = higher priority. Static priorities (fixed at design time).

For RMS, we assign priorities based on rate. Faster tasks get higher priority.

**Utilization bound:** RMS is guaranteed to meet all deadlines if:

    U ≤ n × (2^(1/n) - 1)

where n is the number of tasks. This bound approaches ln(2) ≈ 0.693 as n grows.

For 2 tasks: bound = 0.828
For 3 tasks: bound = 0.780
For large n: bound = 0.693

If U ≤ 0.693, RMS always works. If U > bound but ≤ 1, RMS may or may not work (depends on specific task parameters).

## Example: RMS Utilization Test

Tasks:
- T1: C=2, P=5 (U1 = 0.4)
- T2: C=2, P=7 (U2 = 0.286)
- T3: C=1, P=10 (U3 = 0.1)

Total U = 0.786 < 3 × (2^(1/3) - 1) = 0.780... Actually 0.786 > 0.780.

So RMS bound is not satisfied. But RMS might still work — need to check the schedule explicitly.

## Earliest Deadline First (EDF)

**Priority = earliest deadline.** Dynamic priorities (change every release).

The currently-executing task is the one with the earliest absolute deadline.

**Utilization bound:** EDF is optimal for single-processor scheduling. If U ≤ 1, EDF meets all deadlines.

This is a stronger guarantee than RMS.

## RMS vs EDF

| Property | RMS | EDF |
|----------|-----|-----|
| Priority | Static | Dynamic |
| Bound | n(2^(1/n)-1) | 1 |
| Optimality | Optimal for static priorities | Optimal overall |
| Overhead | Low | Moderate |
| Predictability | High | Moderate |
| Implementation | Simple | More complex |

RMS is used in small embedded systems (predictable, low overhead). EDF is used when utilization is high (> 70%) or when tasks are aperiodic.

## Priority Inversion

A famous problem in real-time systems. Scenario:
- Low-priority task L holds a mutex
- High-priority task H needs the mutex, blocks
- Medium-priority task M preempts L
- H is now waiting on M, even though H >> M

This famously caused the Mars Pathfinder mission to reset repeatedly in 1997.

## Priority Inheritance

Solution: when H blocks on a mutex held by L, temporarily boost L to H's priority. This prevents M from preempting L. When L releases the mutex, restore its original priority.

The Mars Pathfinder fix was to enable priority inheritance.

## Priority Ceiling

Alternative solution: assign each mutex a ceiling priority = max priority of any task that might use it. When a task acquires the mutex, boost to the ceiling.

Prevents deadlock and reduces blocking.

## Key Takeaways

- RMS: static priorities, bound ≈ 0.693, easy to implement
- EDF: dynamic priorities, bound = 1, optimal for single CPU
- Priority inversion: high-priority task blocked by low-priority via medium task
- Priority inheritance: temporarily boost blocker's priority
- Priority ceiling: prevent deadlock too
$LEC$, 50),

('real-time-systems', 3, 'FreeRTOS: Practical RTOS on Microcontrollers', $LEC$
## Why an RTOS?

For simple projects, a superloop (main while loop) works fine. But as complexity grows, you need:
- Task isolation
- Priority-based scheduling
- Inter-task communication
- Timing guarantees

A real-time operating system (RTOS) provides all of this with minimal overhead.

FreeRTOS is the most popular embedded RTOS:
- Tiny footprint (6-12 KB)
- Portable across dozens of architectures (ARM, ESP32, AVR, RISC-V)
- MIT license
- Rich ecosystem

## Tasks

A FreeRTOS task is a function that runs "forever":

    void vTaskBlinkLED(void *pvParameters) {
        while (1) {
            gpio_set_level(LED_PIN, 1);
            vTaskDelay(pdMS_TO_TICKS(500));
            gpio_set_level(LED_PIN, 0);
            vTaskDelay(pdMS_TO_TICKS(500));
        }
    }
    
    xTaskCreate(vTaskBlinkLED, "Blink", 2048, NULL, 1, NULL);

Key parameters:
- **Name:** for debugging
- **Stack size:** in words (2048 = 8 KB on 32-bit)
- **Parameters:** void pointer passed to task
- **Priority:** 0 (lowest) to configMAX_PRIORITIES-1
- **Handle:** returns a TaskHandle_t

## Scheduling

FreeRTOS uses **preemptive priority scheduling**:
- Higher priority task always runs
- Equal-priority tasks share CPU round-robin (if time slicing enabled)
- If no task is ready, the idle task runs

Key insight: **no task blocks the CPU waiting**. Instead, tasks delay, block on queues, or wait for notifications.

## vTaskDelay vs vTaskDelayUntil

**vTaskDelay(ticks):** delay from now. Not suitable for periodic tasks — the period drifts by execution time.

**vTaskDelayUntil(&lastWake, period):** delay until a specific time. Used for periodic tasks.

    TickType_t lastWake = xTaskGetTickCount();
    while (1) {
        do_work();
        vTaskDelayUntil(&lastWake, pdMS_TO_TICKS(100));
    }

This guarantees exactly 100 ms period regardless of do_work() duration.

## Queues

Inter-task communication:

    QueueHandle_t xQueue = xQueueCreate(10, sizeof(int));
    
    // Producer
    int value = 42;
    xQueueSend(xQueue, &value, portMAX_DELAY);
    
    // Consumer
    int received;
    if (xQueueReceive(xQueue, &received, pdMS_TO_TICKS(100))) {
        // got a value
    }

Queues are thread-safe, block-based, and can have any item size.

## Semaphores

**Binary semaphore:** like a flag, used for signaling.

**Counting semaphore:** counts events.

**Mutex:** mutual exclusion, with priority inheritance.

    SemaphoreHandle_t xMutex = xSemaphoreCreateMutex();
    
    if (xSemaphoreTake(xMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
        // critical section
        xSemaphoreGive(xMutex);
    }

## Task Notifications

Faster than queues/semaphores for simple cases:

    // From ISR:
    vTaskNotifyGiveFromISR(taskHandle, &higherPriorityWoken);
    
    // In task:
    ulTaskNotifyTake(pdTRUE, portMAX_DELAY);

No allocation, no queue overhead, ~45% faster than a binary semaphore.

## Interrupts and ISRs

ISRs must be short. Do minimal work, then notify a task:

    void IRAM_ATTR buttonISR() {
        BaseType_t xHigherPriorityTaskWoken = pdFALSE;
        vTaskNotifyGiveFromISR(buttonTaskHandle, &xHigherPriorityTaskWoken);
        portYIELD_FROM_ISR(xHigherPriorityTaskWoken);
    }

Use `FromISR` versions of FreeRTOS API in interrupts.

## Memory Management

FreeRTOS offers 5 heap implementations (heap_1 to heap_5):
- **heap_1:** static, no free
- **heap_2:** free, but no coalescing
- **heap_3:** wraps malloc/free
- **heap_4:** coalescing, common choice
- **heap_5:** multiple memory regions

For hard real-time, prefer static allocation (xTaskCreateStatic).

## Real-World Example: ESP32 Data Logger

Tasks:
1. **Sensor task** (priority 3): reads sensor every 100 ms
2. **Storage task** (priority 2): writes to SD card
3. **Wi-Fi task** (priority 1): uploads to server every 5 min
4. **Button task** (priority 4): handles user input

Queue between sensor and storage. Notification between button and Wi-Fi. Mutex protects SD card.

## Key Takeaways

- FreeRTOS is a small, portable RTOS
- Tasks are functions running "forever"
- Preemptive priority scheduling
- Use vTaskDelayUntil for periodic tasks
- Queues, semaphores, notifications for IPC
- Keep ISRs short, defer to tasks
- Static allocation for hard real-time
$LEC$, 50),

('real-time-systems', 4, 'Timing Analysis and WCET', $LEC$
## Why WCET Matters

To prove a real-time system meets deadlines, you need the **worst-case execution time** (WCET) of each task. Not the average, not the best — the worst.

WCET analysis is hard because:
- Inputs affect execution time (loop bounds, branches)
- Caches make timing input-dependent
- Pipelines and out-of-order execution complicate analysis
- Interrupts can occur at any time

## Sources of Timing Variability

**Instruction count:** depends on data (branches, loops).

**Cache behavior:** a cache hit is fast, a miss is ~100× slower.

**Pipeline stalls:** data dependencies, branch mispredicts.

**Memory latency:** DRAM access is slow, but predictable if prefetched.

**Interrupts:** add delay but bounded.

## WCET Analysis Techniques

**Static analysis:** analyze the binary, compute upper bounds on execution time by:
- Counting instructions
- Modeling cache behavior
- Modeling pipeline behavior
- Summing worst-case contributions

Tools: aiT, Bound-T, RapiTime.

Pros: sound (guaranteed upper bound). Cons: pessimistic (overestimates).

**Measurement-based:** run the task many times, take the maximum observed time. Multiply by a safety factor.

Pros: realistic, easy. Cons: not guaranteed (may miss rare worst cases).

**Hybrid:** use static analysis for critical paths, measurement for others.

## Loop Bounds

The analyzer must know how many times each loop runs:

    for (int i = 0; i < 100; i++) { ... }   // bound = 100

    for (int i = 0; i < n; i++) { ... }     // bound = ? (n unknown)

For dynamic loops, add annotations:

    #pragma loop_bound(100)
    for (int i = 0; i < n; i++) { ... }

## Cache Analysis

Worst-case: every access is a miss (upper bound) — pessimistic.

Better: analyze cache behavior using abstract interpretation. Classify each access as always hit, always miss, or unknown.

Some real-time systems disable caches to make WCET deterministic. This slows the average case but improves predictability.

## Interrupt Latency

Time from interrupt assertion to first ISR instruction. Bounded by:
- Hardware interrupt processing (~10 cycles)
- Saving context (~20-50 cycles)
- Vector table lookup (~5 cycles)

On ARM Cortex-M: ~12 cycles best case, ~30 typical.

For hard real-time, interrupt latency must be < the tightest deadline in the system.

## Response Time Analysis

For a task Ti, the worst-case response time is:

    R_i = C_i + Σ_{j ∈ hp(i)} ceil(R_i / T_j) × C_j

where hp(i) is the set of higher-priority tasks.

Solve by iteration:
- Start with R_i = C_i
- Compute new R_i
- Repeat until convergence or R_i > deadline (failure)

If R_i ≤ D_i for all i, the system is schedulable.

## Example

Tasks:
- T1: C=1, T=4 (high priority)
- T2: C=2, T=6 (medium)
- T3: C=3, T=12 (low)

For T3:
- R = 3
- R = 3 + ceil(3/4)×1 + ceil(3/6)×2 = 3 + 1 + 2 = 6
- R = 3 + ceil(6/4)×1 + ceil(6/6)×2 = 3 + 2 + 2 = 7
- R = 3 + ceil(7/4)×1 + ceil(7/6)×2 = 3 + 2 + 4 = 9
- R = 3 + ceil(9/4)×1 + ceil(9/6)×2 = 3 + 3 + 4 = 10
- R = 3 + ceil(10/4)×1 + ceil(10/6)×2 = 3 + 3 + 4 = 10 (converged)

R_3 = 10 ≤ D_3 = 12. So T3 is schedulable.

## Key Takeaways

- WCET is essential for real-time guarantees
- Static analysis is sound but pessimistic
- Measurement is realistic but not guaranteed
- Loop bounds must be provided
- Response time analysis computes worst-case delay per task
- Iterate R = C + Σ interference until convergence
- If R ≤ D for all tasks, system is schedulable
$LEC$, 50),

('real-time-systems', 5, 'Real-Time Communication and Safety', $LEC$
## Communication in Real-Time Systems

Real-time systems communicate over:
- **Shared memory:** fastest, but needs synchronization
- **Message passing:** safer, but slower
- **Fieldbuses:** industrial networks (CAN, Profibus, EtherCAT)
- **Time-triggered protocols:** deterministic (TTP, FlexRay)

## CAN Bus

The Controller Area Network (CAN) is the dominant automotive and industrial bus:
- 1 Mbps max (CAN FD: 8 Mbps)
- Multi-master, differential, 120Ω terminated
- Message IDs determine priority (lower = higher priority)
- Non-destructive arbitration: higher-priority message always wins
- CRC + automatic retransmission

CAN messages are small (8 bytes classic, 64 bytes CAN FD). Perfect for sensors, actuators, control commands.

## Deterministic Ethernet (TSN, EtherCAT)

Standard Ethernet isn't deterministic (CSMA/CD collisions, best-effort switches). Extensions:

**TSN (Time-Sensitive Networking):** IEEE 802.1 standards. Time-synchronized scheduling.

**EtherCAT:** processing-on-the-fly, < 100 µs cycle times.

**PROFINET IRT:** isochronous real-time, < 1 ms cycles.

These are used in industrial automation where cycle times must be guaranteed.

## Safety Standards

**IEC 61508:** functional safety (general).

**ISO 26262:** automotive (ASIL A-D).

**DO-178C:** aerospace (DAL A-E).

**IEC 62304:** medical devices.

Each defines processes for developing safety-critical software, from requirements through testing and verification.

## Safety Integrity Levels (SIL)

SIL 1-4, with SIL 4 being the most stringent:
- SIL 1: probability of dangerous failure 10⁻⁵ to 10⁻⁶ per hour
- SIL 2: 10⁻⁶ to 10⁻⁷
- SIL 3: 10⁻⁷ to 10⁻⁸
- SIL 4: 10⁻⁸ to 10⁻⁹

ASIL D (automotive) is roughly equivalent to SIL 3.

## Redundancy

Safety-critical systems use redundancy:
- **Hot standby:** duplicate runs in parallel, output switch on failure
- **Cold standby:** backup activated on failure
- **Triple modular redundancy (TMR):** three units vote, majority wins
- **2oo3:** two-out-of-three voting

Example: spacecraft use TMR for critical subsystems. Aircraft use dual-channel flight control.

## Fail-Safe Design

When a system fails, it should fail to a safe state:
- Airbag: deploy (safe = fire)
- Pacemaker: continue at fixed rate (safe = pacing)
- Industrial robot: stop motion (safe = halt)
- Elevator: brakes engage (safe = stop)

Fail-safe means "the safest action on failure", not "do nothing".

## Watchdog Timers

A hardware counter that resets the CPU if not "fed" periodically:

    while (1) {
        do_work();
        feed_watchdog();
    }

If the CPU hangs (infinite loop, deadlock), the watchdog isn't fed and the system resets. Simple but effective.

Advanced: windowed watchdog — must be fed within a specific time window (not too early, not too late). Catches both hang and runaway loop bugs.

## Testing Real-Time Systems

- **Unit testing** for logic
- **Integration testing** for timing
- **Stress testing** at maximum load
- **Fault injection** to test error paths
- **Hardware-in-the-loop** for realistic I/O

Formal verification (model checking, theorem proving) is used at SIL 3-4.

## Key Takeaways

- CAN is the workhorse of automotive/industrial
- Deterministic Ethernet (TSN, EtherCAT) for high-performance RT
- Safety standards (IEC 61508, ISO 26262) define development processes
- SIL/ASIL levels define required reliability
- Redundancy (TMR, 2oo3) for critical systems
- Fail-safe design: on failure, go to safest state
- Watchdog timers detect hangs
- Testing + formal verification for safety-critical systems
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- DESIGNING INFORMATION DEVICES (Berkeley EE16A) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('designing-information', 1, 'Linear Systems and Circuit Basics', $LEC$
## Why Linear Systems?

Linear systems are the foundation of all engineering analysis. If a system is linear, superposition applies: the response to a sum of inputs is the sum of the individual responses.

Most real systems are approximately linear over some range. Even nonlinear systems are often analyzed by linearizing around an operating point.

## Linearity Definition

A system S is linear if for all inputs x₁, x₂ and scalars a, b:

    S(a x₁ + b x₂) = a S(x₁) + b S(x₂)

This is the **superposition principle**.

Linearity implies:
- Homogeneity: S(ax) = a S(x)
- Additivity: S(x₁ + x₂) = S(x₁) + S(x₂)
- Zero input → zero output (for linear systems with no offset)

## Circuit Elements as Linear Systems

**Resistor:** V = I × R. Linear.

**Capacitor:** I = C × dV/dt. Linear (differential operator).

**Inductor:** V = L × dI/dt. Linear.

**Op-amp (ideal):** Vout = A × (V+ - V-). Linear.

**Diode:** I = Is × (e^(V/Vt) - 1). Nonlinear.

## Nodal Analysis

The standard method for solving circuits:

1. Choose a reference node (ground)
2. Assign node voltages to all other nodes
3. Write KCL at each node: sum of currents leaving = 0
4. Solve the system of equations

For n-1 unknown nodes, we get n-1 equations. Express in matrix form: G × v = i.

## Example: Two-Node Circuit

    Vin ──R1──┬──R2── GND
              │
              R3
              │
             GND

KCL at node 1:

    (V1 - Vin)/R1 + V1/R2 + V1/R3 = 0

    V1 × (1/R1 + 1/R2 + 1/R3) = Vin/R1

    V1 = Vin/R1 / (1/R1 + 1/R2 + 1/R3)

The circuit is a voltage divider (R2 || R3 in series with R1).

## Matrix Form

For larger circuits, the conductance matrix G is symmetric, which allows efficient solution.

    G = [g11 g12 ...; g21 g22 ...; ...]

where gii = sum of conductances at node i, and gij = -conductance between i and j (i ≠ j).

Modern circuit simulators (SPICE) solve circuits this way.

## Thevenin and Norton Equivalents

Any linear two-terminal network can be replaced by:

**Thevenin:** a voltage source V_th in series with a resistor R_th.

**Norton:** a current source I_n in parallel with a resistor R_n.

Conversion: V_th = I_n × R_n, R_th = R_n.

Finding Thevenin:
1. Compute open-circuit voltage V_oc = V_th
2. Zero out sources (short V sources, open I sources)
3. Compute resistance between terminals = R_th

This is fundamental to circuit design.

## Superposition Example

Given a circuit with two sources, compute the response by:
1. Turn off source 1, compute response to source 2
2. Turn off source 2, compute response to source 1
3. Add the two responses

This is often easier than solving the full system at once.

## Key Takeaways

- Linearity = superposition principle
- Nodal analysis is the standard method
- G × v = i matrix form for larger circuits
- Thevenin and Norton equivalents simplify analysis
- Linear approximations work for small signals
- Superposition applies only to linear systems
$LEC$, 50),

('designing-information', 2, 'Matrix Methods for Circuits', $LEC$
## Why Matrices?

Real circuits have many nodes and meshes. Hand-solving becomes impractical. Matrix methods let computers solve circuits with thousands of nodes efficiently.

## Node vs Mesh Analysis

**Node analysis:** variables are node voltages. KCL at each node.

**Mesh analysis:** variables are loop currents. KVL around each mesh.

Node analysis is more general (works with any circuit including non-planar). Mesh analysis is simpler for planar circuits.

For a circuit with n nodes (excluding ground) and m meshes:
- Node: n equations
- Mesh: m equations

## The Node Conductance Matrix

For a circuit with n nodes, the conductance matrix G is n × n:

    G = [G11 G12 ... G1n;
         G21 G22 ... G2n;
         ...              ;
         Gn1 Gn2 ... Gnn]

Diagonal Gii = sum of conductances connected to node i.

Off-diagonal Gij = -conductance between nodes i and j.

G is symmetric: Gij = Gji.

The system:

    G × v = i

where v is the vector of node voltages and i is the vector of current sources.

## Example: 3-Node Circuit

Nodes: 1, 2, 3. Ground is 0.

    R12 between nodes 1 and 2
    R13 between 1 and 3
    R23 between 2 and 3
    Current source I1 into node 1
    Current source I3 into node 3

G matrix:

    G11 = 1/R12 + 1/R13
    G12 = -1/R12
    G13 = -1/R13
    G21 = -1/R12
    G22 = 1/R12 + 1/R23
    G23 = -1/R23
    G31 = -1/R13
    G32 = -1/R23
    G33 = 1/R13 + 1/R23

Current vector:

    i1 = I1
    i2 = 0
    i3 = I3

Solve G × v = i for v. Then currents are computed from Ohm's law.

## Gaussian Elimination

The standard algorithm for solving G × v = i:

1. Forward elimination: eliminate variables to get upper triangular form
2. Back substitution: solve from last equation upward

Time: O(n³) for dense systems. Much faster for sparse (most circuit matrices are sparse).

## LU Decomposition

Factor G = L × U where L is lower triangular and U is upper triangular.

Then solve L × y = i (easy forward substitution), then U × v = y (easy back substitution).

The factorization is done once and reused if only i changes. Useful when the circuit topology is fixed but sources vary.

## Sparse Matrix Methods

Real circuits have very sparse G (most entries are zero). Sparse solvers store only the nonzero entries:

- Compressed sparse row (CSR)
- Compressed sparse column (CSC)

They use graph-based reordering (e.g., Markowitz, minimum degree, nested dissection) to reduce fill-in during elimination.

SPICE uses these techniques to handle millions of nodes.

## Iterative Methods

For very large systems, direct methods are too slow. Iterative methods (Jacobi, Gauss-Seidel, conjugate gradient) converge to the solution gradually.

Used in:
- Power grid simulation (millions of nodes)
- Thermal simulation
- 3D circuit extraction

Conjugate gradient is the workhorse for symmetric positive definite systems.

## Applications Beyond Circuits

The same matrix methods apply to:
- Structural analysis (FEA)
- Fluid dynamics (CFD)
- Heat transfer
- Electromagnetics
- Any physical system described by linear PDEs

Learn matrix methods for circuits, and you can apply them anywhere.

## Key Takeaways

- G × v = i is the master equation for circuits
- Node conductance matrix is symmetric
- Gaussian elimination is O(n³) for dense
- LU decomposition reuses factorization
- Sparse methods essential for large circuits
- Iterative methods for very large systems
- Same methods apply across engineering
$LEC$, 50),

('designing-information', 3, 'Capacitors, Inductors, and Transients', $LEC$
## Energy Storage Elements

Unlike resistors (which dissipate energy), capacitors and inductors store energy:

**Capacitor:** stores energy in electric field.

    I = C × dV/dt
    E = ½ × C × V²

**Inductor:** stores energy in magnetic field.

    V = L × dI/dt
    E = ½ × L × I²

## RC Circuit — Charging

Given a resistor and capacitor in series with a DC voltage source:

    Vin ──R──┬── Vcap
             │
             C
             │
            GND

The differential equation:

    Vin = I × R + Vcap = RC × dVcap/dt + Vcap

Solution (charging from 0):

    Vcap(t) = Vin × (1 - e^(-t/τ))

where τ = RC is the **time constant**.

After 1τ: 63% of final value.
After 5τ: 99.3% of final value (considered fully charged).

## RC Circuit — Discharging

Starting from Vcap(0) = Vin, with the source removed:

    Vcap(t) = Vin × e^(-t/τ)

The capacitor discharges to 37% after 1τ.

## RL Circuit

Same math with inductor:

    I(t) = (Vin/R) × (1 - e^(-t/τ))

where τ = L/R.

## Step Response

The general form for a first-order system:

    y(t) = y_final + (y_initial - y_final) × e^(-t/τ)

This applies to RC, RL, and any first-order linear system.

## Second-Order Systems — RLC

Add an inductor to an RC circuit:

    Vin ──R──L──┬── Vcap
                │
                C
                │
               GND

The equation:

    LC × d²Vcap/dt² + RC × dVcap/dt + Vcap = Vin

Standard form:

    d²V/dτ² + 2ζ × dV/dτ + V = Vin

where ζ (zeta) is the **damping ratio**, and ω_n = 1/√(LC).

Three regimes:
- ζ > 1: overdamped (two real poles, slow response)
- ζ = 1: critically damped (fastest without overshoot)
- ζ < 1: underdamped (oscillates, decays)

## Damping Ratio

    ζ = (R/2) × √(C/L)

For ζ < 1, the natural frequency of oscillation:

    ω_d = ω_n × √(1 - ζ²)

The period of oscillation:

    T = 2π / ω_d

## Applications

**RC low-pass filter:** smooths out high-frequency noise.

**RLC resonant circuit:** tuned circuits in radios (selective frequency).

**Snubber circuits:** RC across switches to absorb voltage spikes.

**Timing circuits:** 555 timer uses RC to generate delays.

**Speaker crossover:** LC filters separate high and low frequencies to different drivers.

## Key Insights

- Capacitors resist voltage changes
- Inductors resist current changes
- Time constant τ = RC or L/R
- After 5τ, transient is essentially over
- Second-order response depends on ζ
- RLC oscillations decay at rate determined by R

## Key Takeaways

- Capacitors and inductors store energy
- RC/RL time constant τ
- First-order step response: exponential approach
- Second-order RLC: depends on damping ratio ζ
- Underdamped → oscillations, critically damped → fastest without overshoot
- Applications everywhere in electronics
$LEC$, 50),

('designing-information', 4, 'Fourier Analysis and Frequency Response', $LEC$
## Why Fourier?

Any periodic signal can be decomposed into a sum of sinusoids at harmonic frequencies. This lets us:
- Analyze any input as a sum of sine waves
- Apply linear system theory to each sine wave
- Reconstruct the output by summing

The Fourier transform is the most powerful tool in signal processing.

## Fourier Series

For a periodic signal with period T:

    f(t) = a₀/2 + Σ [a_n × cos(2πnt/T) + b_n × sin(2πnt/T)]

Coefficients:

    a_n = (2/T) × ∫ f(t) cos(2πnt/T) dt
    b_n = (2/T) × ∫ f(t) sin(2πnt/T) dt

The signal is decomposed into harmonics at 1/T, 2/T, 3/T, ...

## Square Wave Example

A square wave of amplitude A and period T decomposes as:

    f(t) = (4A/π) × [sin(ωt) + sin(3ωt)/3 + sin(5ωt)/5 + ...]

Only odd harmonics. Amplitudes decrease as 1/n. This is why a square wave sounds "buzzy" — it has lots of high harmonics.

## Fourier Transform

For aperiodic signals, extend the period to infinity:

    F(ω) = ∫ f(t) × e^(-jωt) dt

The inverse:

    f(t) = (1/2π) × ∫ F(ω) × e^(jωt) dω

F(ω) is the **spectrum** — how much of each frequency is present.

## Common Transform Pairs

| Time signal | Fourier transform |
|-------------|-------------------|
| δ(t) | 1 |
| u(t) (step) | 1/(jω) + πδ(ω) |
| e^(-at) u(t) | 1/(a + jω) |
| sin(ω₀t) | π[δ(ω - ω₀) - δ(ω + ω₀)]/j |
| Rect pulse | Sinc function |

## Frequency Response

For a linear time-invariant system with impulse response h(t), the frequency response is H(ω) = Fourier transform of h(t).

If the input is x(t) with spectrum X(ω), the output spectrum is:

    Y(ω) = H(ω) × X(ω)

The system multiplies each frequency component by H(ω). Amplitude and phase change but not frequency.

## Bode Plots

Plot |H(ω)| in dB vs ω on log scale, and ∠H(ω) in degrees vs ω.

Key features:
- Poles → -20 dB/decade per pole, -90° phase
- Zeros → +20 dB/decade, +90° phase
- Crossover where |H| = 0 dB (unity gain)

## RC Low-Pass Filter

    H(ω) = 1 / (1 + jωRC)

Magnitude: |H| = 1 / √(1 + (ωRC)²)

At ω = 1/RC: |H| = 1/√2 = -3 dB. This is the cutoff frequency.

Above cutoff: -20 dB/decade.

Phase: 0° at DC, -45° at cutoff, -90° at high frequencies.

## RC High-Pass Filter

Swap R and C. Magnitude increases with frequency up to 1, then flat. Used for AC coupling.

## Bandpass and Notch

Cascade low-pass and high-pass for bandpass.

Parallel LC forms a notch (rejects one frequency).

## Applications

**Audio:** equalizers split signal into frequency bands.

**Communications:** filters select the desired channel.

**Power:** filters remove 50/60 Hz noise.

**Imaging:** 2D Fourier transform for image processing.

**Vibration analysis:** FFT to find resonances.

## FFT — the Algorithm

The Discrete Fourier Transform (DFT) computes N frequency samples from N time samples in O(N²).

The Fast Fourier Transform (FFT) computes it in O(N log N). For N = 1,000,000: 10¹² vs 10⁷ operations — a 100,000x speedup.

FFT is one of the most important algorithms ever invented. It enables:
- Real-time audio processing
- Radar
- Medical imaging (MRI, CT)
- 5G communications
- Astronomy (signal detection)

## Key Takeaways

- Fourier series: decompose periodic signals into harmonics
- Fourier transform: extend to aperiodic signals
- Frequency response H(ω) describes LTI system behavior
- Bode plots visualize magnitude and phase
- RC filters are first-order low/high-pass
- FFT makes frequency analysis practical
- Fourier analysis is universal in engineering
$LEC$, 50),

('designing-information', 5, 'Information Theory and Coding', $LEC$
## What is Information?

Claude Shannon (1948) defined information as the reduction of uncertainty. If a message tells you something you already knew, it contains no information.

Information is measured in **bits**. One bit is the information content of a yes/no answer when both are equally likely.

## Shannon Entropy

For a discrete random variable X with probabilities p₁, p₂, ..., pn:

    H(X) = -Σ p_i × log₂(p_i)

Units: bits.

Examples:
- Fair coin: H = -0.5 log 0.5 - 0.5 log 0.5 = 1 bit
- Biased coin (p=0.9): H = -0.9 log 0.9 - 0.1 log 0.1 ≈ 0.47 bits
- Certain event (p=1): H = 0 bits

Higher entropy = more information per symbol.

## Source Coding Theorem

Shannon's theorem: the minimum average number of bits per symbol needed to encode a source is H(X).

You cannot compress below the entropy. You can get arbitrarily close with the right code.

This is the foundation of data compression.

## Huffman Coding

A simple optimal prefix code:
1. Build a binary tree from symbol frequencies
2. Assign shorter codes to frequent symbols
3. Longer codes to rare symbols

Example:
- A: 0.4, B: 0.3, C: 0.2, D: 0.1
- Huffman: A → 0, B → 10, C → 110, D → 111
- Average length: 0.4 + 0.6 + 0.6 + 0.3 = 1.9 bits/symbol
- Entropy: 1.846 bits/symbol (close!)

Used in JPEG, DEFLATE, MP3, and many other formats.

## Channel Capacity

A **channel** has noise, which limits how much information can be reliably transmitted.

Shannon's channel capacity for a channel with bandwidth B and signal-to-noise ratio SNR:

    C = B × log₂(1 + SNR)

Units: bits per second.

Example: a phone line with B = 3 kHz and SNR = 30 dB (1000 linear):

    C = 3000 × log₂(1001) ≈ 30 kbps

This is why early modems topped out at 33.6 kbps.

## Error-Correcting Codes

To combat channel noise, add redundancy so errors can be detected and corrected.

**Repetition code:** send each bit 3 times, majority vote. Simple, but only 1/3 efficiency.

**Parity bit:** add one bit to detect single-bit errors. No correction.

**Hamming codes:** detect and correct single-bit errors. Hamming(7,4) uses 7 bits to send 4 data bits.

**Reed-Solomon:** corrects bursts of errors. Used in CDs, DVDs, QR codes, deep space probes.

**LDPC and Turbo codes:** near-Shannon-limit performance. Used in 4G/5G, Wi-Fi, DVB.

**Polar codes:** the first codes to achieve Shannon capacity. Used in 5G control channels.

## The Shannon Limit

For any noisy channel, there's a maximum rate C below which error-free communication is possible (with the right code). Above C, errors are unavoidable.

This is a profound result. Before Shannon, engineers thought noise imposed fundamental limits. Shannon showed that with clever coding, you can approach zero error rate.

## Applications

**Compression:** ZIP, JPEG, MP3, MP4 — all use Huffman, LZ, or arithmetic coding.

**Storage:** CDs, DVDs, hard drives — Reed-Solomon corrects physical defects.

**Communication:** 4G/5G, Wi-Fi, Bluetooth — LDPC, Turbo, Polar codes.

**Space:** deep space probes use powerful Reed-Solomon and convolutional codes.

**Cryptography:** information-theoretic security (one-time pad) requires key as long as message.

## Key Takeaways

- Information = reduction of uncertainty
- Shannon entropy H(X) = -Σ p log p
- Source coding theorem: minimum bits = entropy
- Huffman codes are optimal prefix codes
- Channel capacity C = B log₂(1 + SNR)
- Error-correcting codes approach Shannon limit
- Information theory is the foundation of all communication
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('real-time-systems', 'designing-information')
group by course_slug;

-- Full summary
select 
  c.code,
  c.title,
  c.university,
  count(l.id) as lectures
from public.courses c
left join public.lectures l on l.course_slug = c.slug
group by c.id, c.code, c.title, c.university
order by lectures desc, c.code;