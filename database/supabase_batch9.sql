-- ============================================================
-- Batch 9: Stanford CS143 (Compilers) + Stanford CS223a (Robotics)
-- ============================================================

-- ============================================================
-- COMPILERS (Stanford CS143) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('compilers', 1, 'Introduction to Compilers and Lexical Analysis', $LEC$
## What is a Compiler?

A compiler translates a program written in a source language (C, Rust, Java) into an equivalent program in a target language (assembly, bytecode, another high-level language).

The compiler must preserve the meaning of the program while producing efficient output. This is a subtle balance: correctness first, then performance.

## Why Study Compilers?

Compilers teach you:
- How your code actually runs on the machine
- Why certain coding patterns are faster than others
- How to write programs that optimize well
- How to build any kind of language processor (interpreters, DSLs, transpilers)

Every serious programmer should build at least one compiler.

## The Compilation Pipeline

Modern compilers have many stages:

1. **Lexical analysis:** turn characters into tokens
2. **Syntax analysis (parsing):** turn tokens into a syntax tree
3. **Semantic analysis:** check types, resolve names
4. **Intermediate representation (IR):** lower to a simple language
5. **Optimization:** improve the IR
6. **Code generation:** produce assembly
7. **Assembly and linking:** produce an executable

Each stage has a clear input and output. This modularity makes compilers manageable.

## Lexical Analysis

The lexer reads the source character by character and produces a stream of tokens: identifiers, numbers, keywords, operators, punctuation.

Example: `int x = 42;`

Becomes: `[KEYWORD int] [IDENT x] [ASSIGN =] [NUMBER 42] [SEMICOLON ;]`

Lexers also handle whitespace and comments (usually discarded), and track line numbers for error messages.

## Regular Expressions

Lexical patterns are described with regular expressions:

- Identifier: `[a-zA-Z_][a-zA-Z0-9_]*`
- Integer: `[0-9]+`
- Float: `[0-9]+\.[0-9]+`
- Whitespace: `[ \t\n]+`

Each regex matches a family of strings. The lexer picks the longest match (maximal munch).

## Finite Automata

A regex can be converted to a finite automaton (DFA or NFA). The DFA reads the input one character at a time and transitions between states.

- NFA: has epsilon transitions, can be in multiple states
- DFA: deterministic, exactly one state at a time

Subset construction converts NFA to DFA. The DFA runs in O(n) time for n input characters.

## Building a Lexer

Tools like `lex`, `flex`, or `re2c` generate lexers from regex specifications. Or hand-write a lexer with a big switch statement for simple languages.

Example with flex:

    %%
    [a-zA-Z_][a-zA-Z0-9_]*    { return IDENTIFIER; }
    [0-9]+                    { return INTEGER; }
    [ \t\n]+                  { /* skip */ }
    "="                       { return ASSIGN; }
    ";"                       { return SEMICOLON; }
    %%

Each rule matches a pattern and returns a token type.

## Handling Keywords

Keywords (if, while, return) look like identifiers but have special meaning. Two strategies:

1. **Reserve them:** the lexer has separate rules for keywords before identifier rule.
2. **Post-process:** match as identifier, then check against a keyword table.

The second is simpler and often faster.

## Error Handling

Lexers must handle:
- Illegal characters (`@` in C)
- Unterminated strings
- Unterminated comments
- Invalid numeric literals (e.g., `12abc`)

Good error messages point to the exact line and column. "Unexpected character '@' at line 5, column 12" beats "syntax error."

## Real-World Lexers

- **C:** flex-generated or hand-written (GCC uses a hand-written lexer)
- **Python:** hand-written in CPython (tokenizer)
- **JavaScript:** hand-written in V8
- **Rust:** hand-written in rustc (using `logos` crate sometimes)

Hand-written lexers are often faster and more controllable than generated ones.

## Key Takeaways

- Compiler = source language to target language translation
- Pipeline: lex → parse → semantic → IR → optimize → codegen
- Lexer: characters to tokens via regex + DFA
- Keywords: reserve or post-process
- Error handling: precise line/column reporting
- Modern compilers often hand-write the lexer for speed
$LEC$, 50),

('compilers', 2, 'Parsing and Grammar', $LEC$
## What is Parsing?

The parser takes the token stream from the lexer and builds a **syntax tree** (or parse tree) that captures the grammatical structure of the program.

    int x = 42;    →    Declaration
                          ├── Type: int
                          ├── Name: x
                          └── Value: 42

The tree is what the semantic analyzer and code generator work with.

## Context-Free Grammars

Grammar rules describe valid programs:

    expression → expression + term
               | expression - term
               | term
    term       → term * factor
               | term / factor
               | factor
    factor     → ( expression )
               | number

Non-terminals: expression, term, factor.
Terminals: +, -, *, /, (, ), number.

## Derivation and Parse Trees

Starting from a start symbol (e.g., program), apply production rules until you get terminals.

A derivation is a sequence of rule applications. A parse tree shows the structure of a derivation.

## Ambiguity

A grammar is ambiguous if some string has multiple parse trees.

Classic example: `a + b * c` — do we add or multiply first?

Standard fix: encode precedence in the grammar (as above with expression/term/factor).

Another example: `if a then if b then c else d` — does else bind to the first or second if? Grammar must specify.

## Top-Down Parsing

Start from the start symbol, try to derive the input.

**Recursive descent:** one function per non-terminal. Each function tries the rules in order.

    parseExpression() {
        parseTerm();
        while (peek() == '+' || peek() == '-') {
            consume();
            parseTerm();
        }
    }

Simple, easy to understand, hand-written. Used in many production compilers.

**LL(1):** predicts which rule to use by looking at 1 token. Requires the grammar to be LL(1).

## Bottom-Up Parsing

Start from the input, reduce to the start symbol.

**LR parsing:** shifts tokens onto a stack and reduces when the top matches a rule's right-hand side.

LR parsers are more powerful than LL: can handle more grammars, including left-recursive ones.

Variants: SLR(1), LALR(1), LR(1). Most parser generators use LALR(1).

## Tools

- **yacc/bison:** LALR(1) parser generator
- **ANTLR:** LL(*) parser generator
- **PEG.js:** Parsing Expression Grammars
- **Tree-sitter:** incremental parser (used in editors)

Generating parsers from grammars is convenient but often yields slower parsers than hand-written recursive descent.

## Operator Precedence and Associativity

Real grammars need:
- Precedence: `*` binds tighter than `+`
- Associativity: `a - b - c` is `(a - b) - c`

Encode with grammar layers (expression → term → factor) or use Pratt parsing (precedence climbing).

Pratt parsing is elegant and fast — used in many production compilers.

## Abstract Syntax Tree (AST)

The parse tree has too much detail (parentheses, intermediate non-terminals). The AST collapses to just the meaningful nodes.

For `1 + 2 * 3`:

    Parse tree:                    AST:
        +                              +
       / \                            / \
      1   *                          1   *
         / \                            / \
        2   3                          2   3

The AST is what the rest of the compiler works with.

## Error Recovery

Real parsers must handle errors gracefully:
- **Panic mode:** skip tokens until a sync point (semicolon, closing brace)
- **Error productions:** add rules for common mistakes
- **Automatic repair:** try to fix missing tokens

Good error messages are a competitive advantage. Modern compilers (Rust, Swift) invest heavily in this.

## Key Takeaways

- Parser: tokens → syntax tree
- Context-free grammars define syntax
- Ambiguity: fix with precedence layers
- Top-down (LL, recursive descent) vs bottom-up (LR)
- Tools: yacc, bison, ANTLR, tree-sitter
- AST collapses parse tree to meaningful nodes
- Error recovery is essential for usability
$LEC$, 50),

('compilers', 3, 'Semantic Analysis and Type Checking', $LEC$
## What is Semantic Analysis?

The parser checks syntax. The semantic analyzer checks meaning:
- Are all variables declared before use?
- Are types compatible?
- Are functions called with the right arguments?
- Are break/continue inside loops?
- Are classes used correctly?

Semantic errors are valid syntax but invalid meaning.

    int x = "hello";   // syntax OK, type error

## Symbol Tables

Track what names are in scope and their attributes (type, storage, etc.).

A symbol table is a mapping from identifier to a symbol record.

Symbols are organized in nested scopes:
- Global scope
- Function scope
- Block scope
- Class scope

When leaving a scope, its symbols are removed.

## Scope Rules

**Lexical (static) scoping:** a name resolves to the nearest enclosing scope. This is what C, Java, Python, Rust use.

    int x = 1;
    void f() {
        int x = 2;
        print(x);  // prints 2
    }

**Dynamic scoping:** a name resolves to the most recent declaration on the call stack. Rare; Lisp has an option.

## Type Systems

Types classify values and constrain operations:
- Int + Int = Int
- Float + Int = Float
- String + Int = error (in statically typed languages)

Types catch bugs early, document intent, and enable optimization.

## Static vs Dynamic Typing

**Static:** types checked at compile time. C, C++, Java, Rust, Haskell.

Pros: errors caught early, faster runtime, better optimization.
Cons: more verbose, requires explicit annotations (or inference).

**Dynamic:** types checked at runtime. Python, JavaScript, Ruby.

Pros: flexible, concise.
Cons: errors at runtime, slower.

**Gradual:** allow both. TypeScript, Python with type hints.

## Type Inference

Infer types without annotations:

    let x = 42;        // x is Int
    let y = x + 1;     // y is Int
    let f = |n| n * 2; // f: (Int) → Int

Hindley-Milner type inference is the classic algorithm. Used in Haskell, ML, Rust (partially).

## Type Checking Rules

For each operation, define rules:

    ⊢ e1 : Int    ⊢ e2 : Int
    ─────────────────────────
        ⊢ e1 + e2 : Int

This says: if e1 and e2 are both Int, then e1 + e2 is Int.

The ⊢ symbol means "in context, has type." Rules are read bottom-up (to check the conclusion, check the premises).

## Subtyping

Some types are subtypes of others:

    Dog <: Animal

Then anywhere an Animal is expected, a Dog can be used.

Used in OOP languages: a Cat and Dog are both Animals, a pointer to Animal can hold either.

**Covariance:** List<Dog> <: List<Animal>? (No, usually — because you could add a Cat to List<Animal>.)

**Contravariance:** Function(Animal) <: Function(Dog)? (Yes — a function that handles any Animal can handle a Dog.)

Variance rules are subtle and cause real bugs.

## Type Systems in Practice

- **Java:** nominative (types declared, no structural matching)
- **TypeScript:** structural (shape matters, not name)
- **Go:** mostly nominal, some structural (interfaces)
- **Rust:** nominal + traits (like interfaces)
- **Haskell:** powerful inference, type classes

Each has trade-offs in expressiveness and complexity.

## Attribute Grammars

Semantic analysis can be formalized as attribute grammars:
- **Synthesized attributes:** computed from children
- **Inherited attributes:** passed down from parents

Type information often flows both ways.

## Key Takeaways

- Semantic analysis checks meaning beyond syntax
- Symbol tables track declarations and scopes
- Lexical (static) vs dynamic scoping
- Type systems catch errors early or late
- Static typing: fast, safe. Dynamic: flexible
- Type inference reduces annotation burden
- Subtyping and variance rules are subtle
- Attribute grammars formalize semantic checks
$LEC$, 50),

('compilers', 4, 'Intermediate Representation and Optimization', $LEC$
## Why an Intermediate Representation?

A compiler could go directly from AST to assembly. So why insert an IR?

- **Portability:** N frontends × M backends → N + M (instead of N × M)
- **Optimization:** optimize the IR once, benefit all languages and targets
- **Simplicity:** the IR has few constructs; algorithms are simpler

LLVM IR, GCC's GIMPLE, and Java bytecode are famous IRs.

## Three-Address Code

The most common IR form:

    t1 = a + b
    t2 = t1 * c
    t3 = t2 - d

Each instruction has at most one operator. Results are stored in temporaries.

This makes data flow explicit, which enables optimization.

## Control Flow Graph (CFG)

Basic blocks (straight-line code) connected by edges (branches).

    BB1: entry
       │
    BB2: condition
       ├── BB3: then
       └── BB4: else
       │
    BB5: exit

Optimizations operate on the CFG: remove unreachable blocks, merge blocks, simplify branches.

## Static Single Assignment (SSA)

A variant of IR where each variable is assigned exactly once.

Original:
    x = 1
    x = x + 1
    y = x * 2

SSA:
    x1 = 1
    x2 = x1 + 1
    y1 = x2 * 2

When control flow merges, a **phi function** picks the right version:

    if (cond) x1 = 1; else x2 = 2;
    x3 = phi(x1, x2)

SSA makes many optimizations trivial. Used in LLVM, GCC (partially), Go, Swift.

## Optimization Categories

**Local:** within a basic block.
- Constant folding: `2 + 3` → `5`
- Algebraic simplification: `x * 1` → `x`
- Strength reduction: `x * 2` → `x << 1`

**Global:** across blocks.
- Common subexpression elimination (CSE)
- Copy propagation
- Dead code elimination
- Loop-invariant code motion

**Interprocedural:** across functions.
- Inlining
- Whole-program analysis
- Devirtualization

## Constant Folding and Propagation

Compute constant expressions at compile time.

    x = 3 + 4       →  x = 7
    y = x * 2       →  y = 14

Propagate constants through variables, then fold.

## Dead Code Elimination

Remove code whose results are never used:

    x = compute()    // x never used
    y = 42           // y never used
    return z

Remove the first two lines. Improves both size and speed (no wasted computation).

## Common Subexpression Elimination

If the same expression is computed twice, compute once:

    a = b + c
    d = b + c       →  d = a

With SSA, this is automatic: two occurrences with the same operands are the same value.

## Loop Optimization

Loops dominate runtime. Optimizations target them:

**Loop-invariant code motion:**

    for (i = 0; i < n; i++) {
        x = a * b;    // invariant
        arr[i] = x + i;
    }

Hoist `x = a * b` outside the loop.

**Loop unrolling:** execute multiple iterations in one loop body, reducing loop overhead.

**Loop fusion:** merge adjacent loops over the same range.

**Loop interchange:** reorder nested loops for cache locality.

## Inlining

Replace a function call with the function body. Eliminates call overhead and enables further optimizations.

Trade-off: code size growth. Compilers use heuristics (function size, call frequency).

## Vectorization

Use SIMD instructions (SSE, AVX, NEON) to process multiple values at once.

    for (i = 0; i < n; i++) c[i] = a[i] + b[i];  // scalar
    // becomes 4 or 8 adds in one instruction (SIMD)

Auto-vectorization by the compiler is hard. Explicit SIMD via intrinsics is common.

## Register Allocation

Map infinite virtual registers (SSA values) to finite physical registers (16 on x86-64, 31 on RISC-V).

Approach: graph coloring. Two values interfere if they're live at the same time → can't share a register.

NP-hard in general; heuristics used in practice (Chaitin-Briggs).

Spilling: if not enough registers, spill to stack. Adds loads/stores.

## Optimization Levels

- **-O0:** no optimization, fast compile, easy debug
- **-O1:** basic optimizations
- **-O2:** more aggressive, standard for release
- **-O3:** most aggressive, including vectorization
- **-Os:** optimize for size
- **-Ofast:** -O3 + fast math (breaks IEEE compliance)

## Key Takeaways

- IR decouples frontend and backend
- Three-address code: one operation per instruction
- CFG organizes control flow
- SSA simplifies analysis
- Optimizations: local, global, interprocedural
- Common: folding, DCE, CSE, inlining, vectorization
- Register allocation via graph coloring
- Choose optimization level based on need
$LEC$, 50),

('compilers', 5, 'Code Generation and Runtime Systems', $LEC$
## From IR to Machine Code

The code generator translates the optimized IR into target machine code. Tasks:

1. Instruction selection: which instructions implement each IR op?
2. Instruction scheduling: reorder for pipeline efficiency
3. Register allocation: virtual → physical registers
4. Peephole optimization: local cleanups
5. Assembly emission: write the .s file

## Instruction Selection

IR: `a = b + c`

For x86-64, use `add`:
    mov rax, [b]
    add rax, [c]
    mov [a], rax

For ARM, use `ADD`:
    ldr r0, [b]
    ldr r1, [c]
    add r0, r0, r1
    str r0, [a]

Selection uses pattern matching or tree rewriting. Modern compilers use a universal pattern (LLVM uses SelectionDAG, then MachineInstr).

## Instruction Scheduling

Reorder instructions to hide latencies:

    load r1, [mem]
    add r2, r1, r3    // stalls waiting for load

Better:
    load r1, [mem]
    add r4, r5, r6    // independent
    add r2, r1, r3

Modern CPUs are out-of-order, so scheduling matters less. But it still helps in-order cores (ARM Cortex-M).

## Peephole Optimization

Look at small windows of instructions and replace with better ones.

    mov rax, 0        →    xor rax, rax    ; smaller, faster
    add rsp, 0        →    (removed)

Simple, local, and effective.

## Calling Conventions

Every function call follows a standard:

**x86-64 System V (Linux, macOS):**
- Args 1-6 in RDI, RSI, RDX, RCX, R8, R9
- Args 7+ on the stack
- Return value in RAX
- Callee-saves RBX, RBP, R12-R15
- Caller-saves RAX, RCX, RDX, RSI, RDI, R8-R11

**ARM64:**
- Args 1-8 in X0-X7
- Return in X0
- Callee-saves X19-X29

The compiler must follow the convention or else C interop fails.

## Stack Frames

Each function call creates a stack frame:

    ┌─────────────────┐ ← higher addresses
    │  caller's frame │
    ├─────────────────┤
    │  return address │
    ├─────────────────┤ ← RBP (frame pointer)
    │  saved RBP      │
    ├─────────────────┤
    │  local variables│
    │  spilled regs   │
    ├─────────────────┤ ← RSP (stack pointer)
    │  outgoing args  │
    └─────────────────┘ ← lower addresses

Prologue: push RBP; mov RBP, RSP; sub RSP, N.
Epilogue: leave (mov RSP, RBP; pop RBP); ret.

Frame pointers are optional (-fomit-frame-pointer), freeing RBP as a general register.

## Object Files and Linking

Compilation produces an object file (.o) with:
- Code (text section)
- Data (initialized, uninitialized)
- Symbols (defined and undefined)
- Relocations (fix up addresses at load time)

The linker combines .o files and libraries into an executable, resolving symbols and applying relocations.

**Static linking:** all code copied into executable. Large but self-contained.

**Dynamic linking:** shared libraries (.so) loaded at runtime. Smaller, shareable, but version-dependent.

## Runtime Systems

The compiler emits calls to a **runtime library** for:
- Memory allocation (malloc, free)
- Garbage collection (in GC languages)
- Exception handling
- Thread management
- Dynamic dispatch (vtable lookups)

Some compilers emit code that relies on libc; others (Go, Rust) ship their own runtime.

## Garbage Collection

For GC languages, the runtime manages memory. Techniques:

**Mark-and-sweep:** start from roots, mark reachable, sweep unreachable.

**Copying:** copy live objects to a new space, discard the rest. Fast but needs 2x memory.

**Generational:** most objects die young. Collect young objects frequently, old rarely. Java, C#, JavaScript use this.

**Reference counting:** count references; free when zero. Python uses it. Cycles need extra handling.

**Tracing:** various algorithms (Go, Java G1, ZGC).

## JIT Compilation

Just-In-Time: compile at runtime, optimizing for the actual use case.

- **V8 (JavaScript):** compiles hot functions to machine code
- **PyPy (Python):** JIT for Python
- **.NET CLR:** compiles IL to native on first call

JITs can beat static compilers on long-running programs (profile-guided), but startup is slower.

## AOT vs JIT

- **AOT (Ahead-Of-Time):** compile before running. Fast startup, slower peak performance.
- **JIT:** compile at runtime. Slower startup, faster peak performance for hot code.

Modern systems mix: Android ART uses AOT for common functions + JIT for others.

## Key Takeaways

- Codegen: IR → machine code
- Instruction selection, scheduling, register allocation
- Peephole optimization: local cleanups
- Calling conventions ensure interop
- Stack frames: locals, spill, return
- Linker combines objects into executables
- Runtime systems for memory, exceptions, threads
- GC: mark-sweep, copying, generational
- JIT for dynamic languages, AOT for ahead-of-time
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;


-- ============================================================
-- ROBOTICS (Stanford CS223a) — 5 lectures
-- ============================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes) values

('robotics', 1, 'Introduction to Robotics and Kinematics', $LEC$
## What is Robotics?

Robotics is the study of machines that sense, plan, and act in the physical world. Robots combine:
- **Mechanical systems:** joints, links, actuators
- **Sensors:** cameras, IMUs, force/torque, tactile
- **Computation:** perception, planning, control

Robotics integrates mechanical engineering, electrical engineering, computer science, and AI.

## Types of Robots

- **Manipulators:** industrial arms (6-DOF typical)
- **Mobile robots:** wheeled, legged, aerial, aquatic
- **Humanoids:** bipedal, complex dynamics
- **Swarm robots:** many simple units
- **Soft robots:** compliant, safe for humans
- **Medical robots:** surgery, rehabilitation

Each has unique challenges.

## Degrees of Freedom (DOF)

The number of independent parameters describing the configuration.

- 2D planar arm with 2 joints: 2 DOF
- 3D arm with 6 joints: 6 DOF (enough to reach any pose)
- 6-DOF + gripper: 7 DOF

More DOF = more flexibility, but also more complexity.

## Kinematics

**Forward kinematics (FK):** given joint angles, compute end-effector pose.

**Inverse kinematics (IK):** given desired pose, compute joint angles.

FK is straightforward (matrix multiplication). IK is hard (may have 0, 1, or many solutions).

## Rigid Body Transformations

A pose in 3D has 6 DOF: position (x, y, z) + orientation (roll, pitch, yaw).

**Rotation matrix R (3×3):** orthogonal, det = +1.

**Homogeneous transform T (4×4):**

    T = [ R  p ]
        [ 0  1 ]

Where p is position and R is orientation.

Composing transforms: T_total = T1 × T2 × T3 for a serial chain.

## Forward Kinematics Example

For a planar 2-link arm with lengths L1, L2 and angles θ1, θ2:

    x = L1 cos(θ1) + L2 cos(θ1 + θ2)
    y = L1 sin(θ1) + L2 sin(θ1 + θ2)

Simple trig. For longer chains, matrix multiplication.

## Denavit-Hartenberg (DH) Parameters

A standard convention for assigning frames to robot links.

Four parameters per link:
- θ (joint angle, revolute)
- d (link offset, prismatic)
- a (link length)
- α (link twist)

With a DH table, FK is a product of 4×4 matrices.

## Workspace and Reachability

The workspace is the set of poses the end-effector can reach.

- **Reachable workspace:** at least one IK solution
- **Dexterous workspace:** end-effector can achieve any orientation

For a 2-link arm, reachable workspace is an annulus (ring) with inner radius |L1 - L2| and outer radius L1 + L2.

## Jacobian

The Jacobian matrix J relates joint velocities to end-effector velocity:

    ẋ = J(q) × q̇

Where ẋ is end-effector velocity (6D), q̇ is joint velocity (n), and J is 6×n.

For a redundant robot (n > 6), J is rectangular. Uses:

- **Velocity control:** given desired ẋ, solve for q̇ = J⁻¹ ẋ (if square and invertible)
- **Singularities:** det(J) = 0 → loss of DOF, infinite joint velocities
- **Statics:** τ = J^T F, joint torques for end-effector force

## Singularities

Configuration where Jacobian loses rank. Common types:
- **Boundary singularity:** arm fully extended
- **Interior singularity:** axes align

Behavior near singularity: infinite joint velocities for finite end-effector motion. Controllers must handle (damping, avoid).

## Redundancy

When n > 6, robot is redundant. Infinite IK solutions. Use extra DOF for:
- Obstacle avoidance
- Joint limit avoidance
- Optimal pose (minimize energy)
- Singularity avoidance

Resolved via null-space projection: q̇ = J⁺ ẋ + (I - J⁺J) z, where z is a secondary objective.

## Key Takeaways

- Robotics integrates mechanical, electrical, CS, AI
- DOF = number of independent joints
- FK: joint angles → pose (easy)
- IK: pose → joint angles (hard, multiple solutions)
- Homogeneous transforms compose kinematics
- DH parameters standardize link frames
- Jacobian relates velocities
- Singularities lose DOF
- Redundancy enables secondary goals
$LEC$, 50),

('robotics', 2, 'Dynamics and Equations of Motion', $LEC$
## Why Dynamics?

Kinematics describes motion. Dynamics describes the forces and torques that cause motion. For control, we need dynamics.

Newton's second law in robot form: τ = M(q) q̈ + C(q, q̇) q̇ + g(q) + friction

Where:
- M(q): mass matrix (positive definite, symmetric)
- C(q, q̇): Coriolis and centrifugal terms
- g(q): gravity vector
- friction: joint friction (viscous + Coulomb)

This is the equation of motion for a robot manipulator.

## Lagrangian Formulation

Derive equations from energy:

    L = T - V (kinetic - potential)

    d/dt (∂L/∂q̇) - ∂L/∂q = τ

This yields the equations of motion systematically. Works for any mechanical system.

## Newton-Euler Formulation

Recursive algorithm using Newton's laws on each link. Two passes:

1. **Forward pass:** velocities and accelerations from base to tip
2. **Backward pass:** forces and torques from tip to base

Efficient for real-time control (O(n) instead of O(n³) for Lagrangian).

## The Mass Matrix

M(q) is symmetric, positive definite. It generalizes "mass" to multiple joints.

For a 2-link planar arm, M is 2×2 with entries involving link masses, inertias, and cos(θ2).

Off-diagonal terms mean joint 1's acceleration depends on joint 2's motion.

## Coriolis and Centrifugal

C(q, q̇) q̇ captures:
- **Centrifugal:** velocity-squared terms
- **Coriolis:** cross-velocity terms

For fast robots, these dominate. Slow robots can ignore them.

## Gravity

g(q) is the torque required to hold the robot against gravity. For each joint, depends on configuration.

For a revolute joint holding a link of mass m at distance r: τ_gravity = m g r cos(θ).

Important for gravity compensation in controllers.

## Computing Dynamics

Three main algorithms:

1. **Lagrangian (symbolic):** derive equations, implement directly. Inefficient for n > 4.
2. **Newton-Euler (recursive):** O(n) algorithm. Standard for real-time.
3. **Composite Rigid Body:** O(n²) for mass matrix, used in advanced control.

Libraries: RBDL, Pinocchio, Drake implement these efficiently.

## Forward Dynamics

Given joint torques τ, compute accelerations q̈:

    q̈ = M⁻¹(q) (τ - C(q, q̇) q̇ - g(q) - friction)

This is used in simulation: integrate q̈ to get velocities and positions.

Cost: inverting M is O(n³) per timestep. Newton-Euler solves it in O(n).

## Inverse Dynamics

Given desired accelerations q̈, compute required torques:

    τ = M(q) q̈ + C(q, q̇) q̇ + g(q)

Used in feedforward control: compute torques to achieve a trajectory.

## Control with Dynamics

**PD control:** τ = Kp (q_d - q) + Kd (q̇_d - q̇). Simple, but gravity sags.

**Computed torque (inverse dynamics):** τ = M (q̈_d + Kd ė + Kp e) + C q̇ + g. Perfect tracking if model is exact.

**Adaptive control:** estimate parameters online.

**Robust control:** handle model uncertainty.

## Impedance and Admittance Control

**Impedance:** robot behaves like a spring-damper. τ = K (x_d - x) + D (ẋ_d - ẋ).

**Admittance:** robot responds to external force as if it had mass. Used in collaborative robots (cobots).

Important for safe human-robot interaction.

## Simulation

Physics engines solve forward dynamics:
- **Gazebo:** ROS standard, general robotics
- **MuJoCo:** fast, contact-rich, reinforcement learning
- **PyBullet:** Python, easy to use
- **Drake:** MIT, optimization-focused
- **Isaac Sim:** NVIDIA, GPU-accelerated, photorealistic

Simulation is essential for testing before real-world deployment.

## Contact Dynamics

When robot touches the environment:
- **Rigid contact:** hard constraint, impulsive forces
- **Compliant contact:** springs between surfaces
- **Friction:** Coulomb model, stick-slip

Contact is hard to simulate accurately. Modern engines use convex optimization (Drake) or impulse-based methods.

## Learning Dynamics

Neural networks can learn dynamics from data:
- Feedforward NN: predict next state from current state + action
- Long Short-Term Memory: handle history
- Physics-informed NN: incorporate known physics

Used in model-based RL and adaptive control.

## Key Takeaways

- Dynamics: forces cause motion (τ = M q̈ + C q̇ + g)
- Lagrangian: energy-based derivation
- Newton-Euler: recursive, O(n)
- Mass matrix, Coriolis, gravity
- Forward dynamics: torques → accelerations
- Inverse dynamics: accelerations → torques
- Control: PD, computed torque, impedance
- Simulation essential for testing
- Contact dynamics is hard
$LEC$, 50),

('robotics', 3, 'Trajectory Planning and Motion Control', $LEC$
## Why Trajectory Planning?

A robot must move from point A to point B smoothly. Joint trajectories must be:
- Continuous (no jumps)
- Smooth (continuous velocity, ideally acceleration)
- Within joint limits
- Avoiding obstacles

## Joint Space vs Task Space

**Joint space:** plan in joint angles. Simple, but end-effector path is unpredictable.

**Task space:** plan end-effector path, then IK to joints. More intuitive, but IK can have issues.

**Hybrid:** plan in joint space with waypoints in task space.

## Point-to-Point Motion

Simple case: move from q_start to q_goal.

**Linear interpolation:** q(t) = q_start + (q_goal - q_start) × (t/T).

Problem: discontinuity in velocity at start and end → infinite acceleration.

## Polynomial Trajectories

**Cubic polynomial:** q(t) = a0 + a1 t + a2 t² + a3 t³.

Boundary conditions: q(0) = q_start, q(T) = q_goal, q̇(0) = q̇(T) = 0.

Four constraints → four coefficients.

**Quintic polynomial:** adds q̈ boundary conditions for smooth acceleration. Used in high-precision applications.

## Trapezoidal Velocity Profile

Constant acceleration, then constant velocity, then constant deceleration.

Velocity: rises linearly, holds, falls linearly.
Position: S-curve.

Popular for industrial robots. Ensures smooth motion with bounded acceleration.

## S-Curve Profile

Further smooths the jerk (derivative of acceleration):

Acceleration is trapezoidal, jerk is bounded. Smoothest but slowest.

Used in CNC machines, pick-and-place.

## Multi-Waypoint Trajectories

Spline through waypoints. B-splines are popular: local control, smooth, stay near control points.

For a sequence of waypoints q0, q1, ..., qn, fit a B-spline. Each segment connects adjacent waypoints with C² continuity.

## Obstacle Avoidance

If there are obstacles, plan a collision-free path.

**Potential fields:** attract to goal, repel from obstacles. Simple but can get stuck in local minima.

**RRT (Rapidly-exploring Random Tree):** random sampling, tree growth. Probabilistically complete.

**RRT*:** asymptotically optimal version.

**PRM (Probabilistic Roadmap):** build graph in free space, search it.

**A*:** grid-based search, optimal if heuristic is admissible.

**Trajectory optimization:** minimize cost (time, energy) subject to constraints. Direct collocation, direct shooting.

## Trajectory Optimization

Formulate as optimization:

    minimize ∫ L(q, q̇, q̈) dt
    subject to: dynamics, joint limits, obstacle constraints

Methods:
- **Direct collocation:** discretize time, solve NLP
- **Direct shooting:** parameterize controls, simulate
- **CHOMP, STOMP:** gradient-based smoothing

Tools: TrajOpt, Drake, CasADi.

## Feedback Control

Open-loop trajectories fail with disturbances. Feedback corrects in real time.

**PID per joint:** simple, effective for stiff robots.

**Computed torque:** uses full dynamics for high performance.

**Model Predictive Control (MPC):** solve optimization at each timestep, apply first control. Handles constraints.

**Learning-based:** neural network policies trained via RL or imitation.

## Impedance Control

Instead of tracking a trajectory, control the robot's interaction dynamics:

    F = M_d (ẍ_d - ẍ) + B_d (ẋ_d - ẋ) + K_d (x_d - x)

Robot behaves like a mass-spring-damper. Useful for:
- Assembly (peg-in-hole)
- Polishing, grinding
- Human collaboration

## Force Control

When the robot interacts with the environment, position control fails. Use force control:

**Direct force control:** measure force, control to desired.
**Hybrid:** position in some directions, force in others.
**Admittance:** measure force, respond with motion.

Used in:
- Deburring, grinding
- Surgery
- Human-robot collaboration
- Legged robots (foot contact)

## Real-Time Constraints

Control loops must run at fixed rates:
- Position: 1 kHz typical
- Force: 1-10 kHz
- Impedance: 1 kHz

Missed deadlines cause instability. Use real-time OS or dedicated hardware.

## ROS and Motion Planning

ROS (Robot Operating System) is the standard framework:
- **MoveIt:** motion planning library
- **ROS Control:** controller management
- **TF:** coordinate transforms
- **RViz:** visualization

Nodes communicate via topics, services, actions.

## Key Takeaways

- Trajectory: smooth, feasible joint paths
- Polynomials for point-to-point
- Trapezoidal and S-curve profiles
- Splines for multi-waypoint
- Obstacle avoidance: RRT, PRM, optimization
- Feedback control: PID, computed torque, MPC
- Impedance/force control for interaction
- Real-time: fixed loop rates
- ROS + MoveIt for practical planning
$LEC$, 50),

('robotics', 4, 'Perception: Sensors and State Estimation', $LEC$
## Why Perception?

A robot must know its state (position, velocity) and environment (obstacles, objects). Sensors provide measurements; estimation fuses them into a coherent picture.

## Common Sensors

**Encoders:** measure joint angles. High precision, direct.

**IMU (Inertial Measurement Unit):** accelerometer + gyroscope (+ magnetometer). Measures orientation and acceleration. Drifts over time.

**Cameras:** RGB, depth (stereo, structured light, ToF), event. Rich data, computationally heavy.

**LiDAR:** 2D or 3D scanning. Accurate range, expensive. Used in autonomous vehicles.

**GPS:** global position, ~1 m accuracy (worse in urban canyons).

**Force/torque sensors:** measure interaction forces. Essential for manipulation.

**Tactile sensors:** contact, pressure. Growing area.

**Ultrasonic:** cheap range sensing, low resolution.

## Sensor Characteristics

- **Accuracy:** how close to truth
- **Precision:** repeatability
- **Range:** min/max measurable
- **Resolution:** smallest change detected
- **Bandwidth:** how often updated
- **Noise:** random error
- **Bias:** systematic error

Every sensor has trade-offs. Fusion combines complementary strengths.

## State Estimation

Estimate the robot's state (pose, velocity) from noisy measurements.

**Bayes filter:** probabilistic framework. Maintain belief over state.

**Kalman filter:** optimal for linear Gaussian systems.

    Predict: x̂ = F x̂ + B u; P = F P F^T + Q
    Update:  K = P H^T (H P H^T + R)^-1
             x̂ = x̂ + K (z - H x̂)
             P = (I - K H) P

Where F is dynamics, H is measurement, Q and R are noise covariances.

## Extended Kalman Filter (EKF)

For nonlinear systems, linearize around current estimate.

    F = ∂f/∂x |_{x̂}
    H = ∂h/∂x |_{x̂}

Standard in robotics for years.

## Unscented Kalman Filter (UKF)

Better for strongly nonlinear systems. Uses sigma points (deterministic samples) propagated through the nonlinear function.

More accurate than EKF at similar cost.

## Particle Filter

Represent belief as a set of weighted samples (particles).

1. **Predict:** sample each particle through dynamics
2. **Update:** weight by measurement likelihood
3. **Resample:** pick particles proportional to weight

Handles multimodal distributions. Used in SLAM (Monte Carlo Localization).

## SLAM (Simultaneous Localization and Mapping)

Chicken-and-egg problem: to localize, need a map; to build a map, need to know location.

Solutions:
- **EKF-SLAM:** joint estimation of robot and landmarks.
- **FastSLAM:** particle filter for robot, EKF for landmarks.
- **GraphSLAM:** poses and landmarks as nodes in a graph; solve optimization.
- **Visual SLAM:** ORB-SLAM, LSD-SLAM use cameras.

Modern SLAM is mature — used in robots, drones, AR/VR.

## Sensor Fusion Examples

**Drone pose:** IMU (fast, drifts) + GPS (slow, no drift) + barometer + magnetometer → EKF.

**Self-driving car:** LiDAR + cameras + radar + GPS + IMU → Kalman / particle.

**Mobile robot:** wheel encoders + IMU + LiDAR → EKF SLAM.

Fusion benefits: better accuracy, robustness to sensor failure, higher rate.

## Deep Learning for Perception

Classical methods struggle with complex scenes. Neural networks excel:
- **Object detection:** YOLO, Faster R-CNN
- **Semantic segmentation:** U-Net, DeepLab
- **Depth estimation:** stereo matching, monocular depth
- **Pose estimation:** OpenPose, MediaPipe
- **SLAM features:** SuperPoint, DROID-SLAM

Training data: real (expensive), synthetic (free from simulators), self-supervised.

## Sensor Calibration

Sensors have intrinsics (internal) and extrinsics (relative poses).

**Camera intrinsics:** focal length, principal point, distortion. Calibrate with a checkerboard (Zhang's method).

**Extrinsics:** camera to IMU, camera to LiDAR. Calibrate by observing known patterns.

Poor calibration ruins fusion. Invest in this.

## Key Takeaways

- Robots need to know their state and environment
- Many sensors, each with trade-offs
- Bayes filter for probabilistic estimation
- Kalman filter: linear Gaussian optimal
- EKF, UKF for nonlinear
- Particle filter for multimodal
- SLAM: joint localization and mapping
- Sensor fusion combines complementary sensors
- Deep learning for complex perception
- Calibration is critical
$LEC$, 50),

('robotics', 5, 'Manipulation and Grasping', $LEC$
## Why Manipulation?

Moving objects is fundamental to robots in manufacturing, logistics, surgery, home assistance. It's hard: contact, friction, uncertainty.

## Grasp Types

- **Power grasp:** entire hand wraps object. Stable, no fine control.
- **Precision grasp:** fingertips pinch. Fine control, less stable.
- **Pinch, tripod, spherical:** various taxonomies.

Choice depends on task and object.

## Grasp Quality

Metrics:
- **Force closure:** can resist arbitrary external forces via contact forces
- **Form closure:** geometric constraint, no friction needed
- **Grasp isotropy:** uniform manipulation in all directions
- **Stability margin:** how far from slipping

Optimize grasps for robustness.

## Contact Modeling

Rigid body contact with Coulomb friction:

    |F_t| ≤ μ |F_n|

Tangential force bounded by normal force times friction coefficient.

Contact state: sticking (no slip), sliding (tangential force at limit).

Compliant contact (soft finger): elastic model, force proportional to deformation.

## Grasp Planning

**Analytical:** given object model and gripper, compute force-closure grasps. Requires exact geometry.

**Data-driven:** learn from simulation or demonstrations. Handles uncertainty.

**Sampling-based:** generate random contacts, evaluate, keep good ones.

**Deep learning:** DexNet, GraspNet predict grasp quality from vision.

## Underactuated Hands

More DOF than actuators. Examples: tendon-driven, adaptive grippers.

Benefits: compliance, simplicity, robustness to uncertainty.

Cost: less control, complex dynamics.

## Dexterous Manipulation

Multi-finger hands (like human) can manipulate within the hand.

Challenges:
- High DOF (20+)
- Contact state changes
- Tactile sensing required
- Complex dynamics

Applications: tool use, in-hand reorientation, assembly.

## Task and Motion Planning (TAMP)

Combines symbolic task planning (what to do) with motion planning (how to move).

Example: "put the cup on the shelf" →
1. Move arm near cup
2. Grasp cup
3. Lift
4. Move to shelf
5. Place
6. Release

Each step has motion constraints. TAMP integrates them.

## Learning Manipulation

**Imitation learning:** record human demonstrations, learn policy. DAgger, behavior cloning.

**Reinforcement learning:** reward-based trial and error. Sample inefficient, but powerful.

**Sim-to-real:** train in simulation, transfer to real robot. Domain randomization handles the gap.

**Self-supervised:** robot generates its own data. Grasping, pushing, opening.

## Real-World Manipulation Systems

- **Amazon Picking Challenge:** pick items from shelves.
- **Dexterity:** OpenAI's Rubik's cube, in-hand manipulation.
- **Cooking:** PR2, Mobile ALOHA cook meals.
- **Surgery:** da Vinci, autonomous suturing.
- **Warehouse:** Kiva, Fetch robots.

Each has unique constraints.

## Force Control in Manipulation

When contact is critical, use force control:

**Impedance:** robot behaves like spring-damper, compliant to environment.

**Admittance:** sense force, command motion.

**Hybrid:** position in free directions, force in contact directions.

Used for peg-in-hole, polishing, assembly.

## Assembly Tasks

**Peg-in-hole:** classic. Challenges: tight tolerances, chamfers, jamming.

Solutions:
- Compliance (RCC, remote center compliance)
- Force feedback + search
- Learning from demonstration
- Reinforcement learning

**Snap-fit:** plastic parts with interlocking features. Requires force profile.

**Screwing:** rotation + force control.

## Grippers

- **Parallel jaw:** simple, versatile, most common
- **Vacuum:** flat surfaces, no residual marks
- **Magnetic:** ferrous objects
- **Soft grippers:** delicate objects (fruit, glass)
- **Universal gripper:** granular jamming, adapts to shape

Choose based on object variety and cycle time.

## Key Takeaways

- Manipulation: moving objects with contact
- Grasp quality: force closure, stability
- Contact modeling with friction
- Grasp planning: analytical or learned
- Dexterous manipulation challenges
- TAMP combines task and motion planning
- Learning: imitation, RL, sim-to-real
- Force control for contact-rich tasks
- Assembly, screwing, snap-fit
- Gripper choice depends on task
$LEC$, 50)

on conflict (course_slug, number) do update
set title = excluded.title,
    content = excluded.content,
    duration_minutes = excluded.duration_minutes;

-- Verify
select course_slug, count(*) as lectures
from public.lectures
where course_slug in ('compilers', 'robotics')
group by course_slug;