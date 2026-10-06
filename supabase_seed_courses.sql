-- ============================================================================
-- TechPulse — Seed Data: 24 University Courses + Lectures + Assignments + Exams
-- Run AFTER supabase_schema.sql
-- Safe to re-run — uses ON CONFLICT DO NOTHING.
-- Sources: MIT OpenCourseWare, Stanford Online, UC Berkeley, CMU, Caltech
-- All content is publicly available educational material.
-- ============================================================================

-- ============================================================================
-- 1. COURSES (24 total)
-- ============================================================================
insert into public.courses (code, slug, title, university, path, description, lectures_count, assignments_count, exams_count, duration_hours, difficulty, icon)
values
-- ELECTRICAL ENGINEERING (6)
('MIT 6.002', 'circuits-i', 'Circuits I', 'MIT', 'electrical',
 'DC and AC circuit analysis: Ohm''s law, KVL/KCL, node and mesh analysis, Thevenin and Norton equivalents, op-amps, and transient response (RC/RL/RLC).',
 24, 12, 3, 40, 'Intermediate', '⚡'),

('MIT 6.003', 'signals-systems', 'Signals & Systems', 'MIT', 'electrical',
 'Continuous-time and discrete-time signals, LTI systems, convolution, Fourier series, Fourier transform, Laplace transform, and Z-transform.',
 20, 10, 3, 45, 'Advanced', '📡'),

('MIT 6.013', 'electromagnetics', 'Electromagnetics', 'MIT', 'electrical',
 'Maxwell''s equations, wave propagation, transmission lines, plane waves, waveguides, and antennas.',
 18, 8, 2, 40, 'Advanced', '🌊'),

('Caltech CDS 101', 'control-systems', 'Control Systems', 'Caltech', 'electrical',
 'Feedback control, transfer functions, stability, root locus, Bode plots, PID controllers, and state-space methods.',
 22, 10, 2, 42, 'Advanced', '🎛️'),

('MIT 6.341', 'dsp', 'Digital Signal Processing', 'MIT', 'electrical',
 'Discrete-time signals, DFT/FFT, digital filters (FIR/IIR), sampling, quantization, and applications.',
 20, 9, 2, 40, 'Advanced', '📊'),

('Berkeley EE105', 'analog-electronics', 'Analog Electronics', 'Berkeley', 'electrical',
 'Bipolar and MOS transistors, single-stage and multi-stage amplifiers, frequency response, feedback, and op-amp design.',
 22, 10, 3, 45, 'Advanced', '🔊'),

-- COMPUTER SCIENCE (6)
('Stanford CS107', 'programming-c', 'Programming in C', 'Stanford', 'cs',
 'C fundamentals, pointers, memory management, debugging with GDB, and systems programming. Essential for embedded work.',
 18, 8, 2, 35, 'Intermediate', '💻'),

('Berkeley CS61B', 'data-structures', 'Data Structures', 'Berkeley', 'cs',
 'Lists, trees, graphs, hash tables, heaps, tries, sorting algorithms, and algorithm analysis in Java.',
 24, 14, 3, 45, 'Intermediate', '🌳'),

('Princeton COS226', 'algorithms', 'Algorithms', 'Princeton', 'cs',
 'Sorting, searching, graphs, shortest paths, MST, dynamic programming, and NP-completeness.',
 22, 10, 3, 40, 'Advanced', '📊'),

('Berkeley CS61C', 'computer-architecture', 'Computer Architecture', 'Berkeley', 'cs',
 'RISC-V assembly, datapath, pipelining, caches, virtual memory, and parallelism.',
 20, 8, 2, 40, 'Advanced', '🖥️'),

('MIT 6.S081', 'operating-systems', 'Operating Systems', 'MIT', 'cs',
 'Processes, threads, scheduling, virtual memory, file systems, and xv6 kernel implementation.',
 22, 10, 2, 45, 'Advanced', '⚙️'),

('Stanford CS143', 'compilers', 'Compilers', 'Stanford', 'cs',
 'Lexical analysis, parsing, semantic analysis, type checking, code generation, and optimization.',
 20, 9, 2, 42, 'Advanced', '🔨'),

-- EMBEDDED SYSTEMS (5)
('MIT 6.004', 'digital-design', 'Computation Structures', 'MIT', 'embedded',
 'Digital logic, combinational/sequential circuits, FSM, pipelining, and processor design.',
 20, 8, 2, 40, 'Intermediate', '🔌'),

('CMU 18-348', 'embedded-systems', 'Embedded Systems', 'CMU', 'embedded',
 'Microcontroller architecture, interrupts, timers, serial protocols (I2C/SPI/UART), RTOS, and embedded C.',
 18, 8, 2, 38, 'Intermediate', '🔧'),

('CMU 18-549', 'real-time-systems', 'Real-Time Systems', 'CMU', 'embedded',
 'Real-time scheduling, priority inversion, WCET analysis, and safety-critical system design.',
 16, 7, 2, 35, 'Advanced', '⏱️'),

('MIT 6.115', 'microcontrollers', 'Microcomputer Project Lab', 'MIT', 'embedded',
 'Hands-on microcontroller design, A/D conversion, interfacing sensors, motors, and LCD displays.',
 15, 6, 1, 30, 'Intermediate', '🔬'),

('Berkeley EE16A', 'designing-information', 'Designing Information Devices', 'Berkeley', 'embedded',
 'Linear algebra, circuit analysis, and system design for engineers. Foundational for embedded systems.',
 22, 10, 3, 42, 'Beginner', '📐'),

-- AI & MACHINE LEARNING (4)
('Stanford CS229', 'machine-learning', 'Machine Learning', 'Stanford', 'ai',
 'Supervised learning, unsupervised learning, reinforcement learning, and best practices in ML.',
 20, 8, 2, 40, 'Advanced', '🤖'),

('Stanford CS231n', 'deep-learning', 'Deep Learning for Vision', 'Stanford', 'ai',
 'CNNs, RNNs, attention, transformers, and modern computer vision techniques.',
 18, 7, 2, 42, 'Advanced', '👁️'),

('Stanford CS224n', 'nlp', 'Natural Language Processing', 'Stanford', 'ai',
 'Word vectors, RNNs, transformers, and modern NLP with deep learning.',
 18, 7, 2, 40, 'Advanced', '💬'),

('Stanford CS223a', 'robotics', 'Introduction to Robotics', 'Stanford', 'ai',
 'Kinematics, dynamics, control, motion planning, and robot manipulation.',
 20, 8, 2, 42, 'Advanced', '🦾'),

-- MECHANICAL ENGINEERING (4)
('MIT 5.60', 'thermodynamics', 'Thermodynamics', 'MIT', 'mechanical',
 'First and second laws, entropy, thermodynamic cycles, and applications to energy systems.',
 22, 10, 3, 42, 'Intermediate', '🔥'),

('MIT 2.06', 'fluid-mechanics', 'Fluid Mechanics', 'MIT', 'mechanical',
 'Fluid statics, Bernoulli, Navier-Stokes, boundary layers, and turbulence.',
 20, 9, 2, 40, 'Advanced', '💧'),

('MIT 2.51', 'heat-transfer', 'Heat Transfer', 'MIT', 'mechanical',
 'Conduction, convection, radiation, and heat exchanger design.',
 18, 8, 2, 38, 'Advanced', '🌡️'),

('MIT 2.001', 'mechanics-materials', 'Mechanics of Materials', 'MIT', 'mechanical',
 'Stress, strain, torsion, bending, buckling, and failure criteria.',
 20, 9, 2, 40, 'Intermediate', '🔩')

on conflict (slug) do nothing;

-- ============================================================================
-- 2. LECTURES (sample of ~40 across courses)
-- ============================================================================
insert into public.lectures (course_slug, number, title, content, duration_minutes)
values

-- Circuits I (MIT 6.002)
('circuits-i', 1, 'Introduction; Lumped Element Abstraction',
 'This lecture introduces the concept of lumped-element modeling, a critical abstraction that lets engineers analyze circuits without solving Maxwell''s equations. We discuss the relationship between real physical components and ideal elements (resistors, capacitors, inductors, voltage sources, and current sources), the KVL/KCL laws, and how to determine when the lumped abstraction is valid. Key topics: characteristic length, propagation speed, and when to abandon the lumped model.',
 50),

('circuits-i', 2, 'Basic Circuit Analysis Method',
 'We introduce the node method for solving linear circuits. Instead of writing KVL and KCL repeatedly, the node method uses KCL at every node with unknown node voltages as the variables. We derive the method formally and apply it to several examples including a voltage divider, a current source with parallel resistances, and a bridge network.',
 50),

('circuits-i', 3, 'Superposition, Thevenin, and Norton',
 'Superposition: in a linear circuit with multiple independent sources, the total response is the sum of responses to each source acting alone. Thevenin''s theorem: any linear two-terminal network can be replaced by a single voltage source V_th in series with a resistance R_th. Norton''s theorem: dual — a current source I_n in parallel with R_n. We show how to compute these values and when to use each.',
 50),

('circuits-i', 4, 'The Digital Abstraction',
 'Digital circuits are built on a specific discipline: voltages below V_IL are treated as 0, voltages above V_IH as 1, and we guarantee that outputs stay within valid ranges. This lecture covers noise margins, static discipline, and the relationship between analog reality and digital abstraction.',
 50),

('circuits-i', 5, 'Inside the Digital Gate',
 'We open the black box: the MOSFET as a switch, the resistor pull-up and pull-down networks, and how CMOS logic gates actually work. This lecture explains why CMOS dominates modern digital design: low static power, high noise margin, and scalable geometry.',
 50),

('circuits-i', 6, 'Nonlinear Elements: Diodes and MOSFETs',
 'Real diodes follow the Shockley equation; real MOSFETs have a quadratic I-V characteristic. We introduce nonlinear elements and demonstrate how to solve circuits containing them using graphical and iterative methods.',
 50),

('circuits-i', 7, 'Amplifiers and the Small-Signal Model',
 'An amplifier takes a small input signal and produces a larger output. We introduce the linear amplifier abstraction and the small-signal model, then apply it to analyze the MOSFET common-source amplifier.',
 50),

('circuits-i', 8, 'Capacitors and Inductors: Energy Storage',
 'Capacitors store energy in electric fields; inductors store energy in magnetic fields. We define their I-V relationships, show how they behave under DC steady-state, and introduce the concept of state variables.',
 50),

-- Programming in C (Stanford CS107)
('programming-c', 1, 'Introduction to C; Compilation Model',
 'Overview of C, the compilation pipeline (preprocessor → compiler → assembler → linker), header files, and the difference between declarations and definitions. We write our first program and inspect the assembly output.',
 50),

('programming-c', 2, 'Pointers and Memory',
 'Pointer arithmetic, pointers vs arrays, stack vs heap, malloc/free, and common memory bugs (dangling pointers, buffer overflows, memory leaks). Debugging with Valgrind.',
 50),

('programming-c', 3, 'Strings and Character Arrays',
 'C strings are null-terminated character arrays. We cover the standard library (strlen, strcpy, strcmp), buffer overflow vulnerabilities, and safe alternatives (strncpy, strlcpy).',
 50),

('programming-c', 4, 'Structs and Unions',
 'Structs group related data; unions let multiple types share the same memory. We show struct padding, alignment, and the __attribute__((packed)) directive.',
 50),

('programming-c', 5, 'Function Pointers and Callbacks',
 'Function pointers enable runtime polymorphism in C. We use them to implement callbacks, dispatch tables, and generic data structures like qsort.',
 50),

-- Data Structures (Berkeley CS61B)
('data-structures', 1, 'Introduction to Data Structures',
 'Why do we need data structures? We introduce the trade-off between time and space complexity, and set up the framework for the rest of the course.',
 50),

('data-structures', 2, 'Arrays and Linked Lists',
 'We implement our own ArrayList and LinkedList, comparing their asymptotic performance (add, get, remove) and practical trade-offs.',
 50),

('data-structures', 3, 'Stacks and Queues',
 'LIFO vs FIFO, array-backed vs list-backed implementations, and applications (parsing, BFS, undo history).',
 50),

('data-structures', 4, 'Binary Search Trees',
 'BST invariant, insert, search, delete. We analyze worst-case vs average-case performance and introduce the problem of tree imbalance.',
 50),

('data-structures', 5, 'Balanced Trees: AVL and Red-Black',
 'AVL trees maintain balance via rotations; red-black trees use color invariants. We show why both have O(log n) worst-case height.',
 50),

('data-structures', 6, 'Hash Tables',
 'Hash functions, collision resolution (chaining, open addressing), load factor, and amortized analysis of insert and lookup.',
 50),

('data-structures', 7, 'Heaps and Priority Queues',
 'Binary heap property, insert, extract-min, heapify, and applications (heapsort, Dijkstra''s algorithm).',
 50),

('data-structures', 8, 'Graphs: Representations and Traversals',
 'Adjacency matrix vs adjacency list. BFS for shortest paths in unweighted graphs; DFS for cycle detection and topological sorting.',
 50),

-- Algorithms (Princeton COS226)
('algorithms', 1, 'Union-Find and Analysis of Algorithms',
 'The union-find data structure, quick-find vs quick-union vs weighted quick-union, path compression, and asymptotic analysis (Big-O, Big-Omega, Big-Theta).',
 50),

('algorithms', 2, 'Sorting: Mergesort and Quicksort',
 'Divide-and-conquer, mergesort (stable, O(n log n)), quicksort (in-place, average O(n log n)), and 3-way quicksort for duplicate keys.',
 50),

('algorithms', 3, 'Priority Queues and Heapsort',
 'Binary heaps, heap operations, heapsort, and the role of priority queues in graph algorithms.',
 50),

('algorithms', 4, 'Elementary Symbol Tables',
 'Symbol tables (maps/dictionaries), binary search trees, and 2-3 trees. We motivate balanced trees.',
 50),

('algorithms', 5, 'Balanced Search Trees',
 'Red-black BSTs, B-trees, and their applications in databases and file systems.',
 50),

('algorithms', 6, 'Undirected Graphs',
 'Graph API, depth-first search, breadth-first search, connected components, and cycle detection.',
 50),

('algorithms', 7, 'Directed Graphs and Topological Sort',
 'Directed graphs, DAGs, topological sort, and strongly connected components (Kosaraju-Sharir).',
 50),

('algorithms', 8, 'Shortest Paths',
 'Dijkstra, Bellman-Ford, and the A* algorithm. We discuss edge relaxation and correctness proofs.',
 50),

-- Machine Learning (Stanford CS229)
('machine-learning', 1, 'Supervised Learning Setup',
 'Hypothesis class, empirical risk minimization, training/validation/test split, bias-variance tradeoff, and the basics of linear regression.',
 50),

('machine-learning', 2, 'Logistic Regression and Gradient Descent',
 'The logistic function, cross-entropy loss, maximum likelihood estimation, gradient descent, and Newton''s method.',
 50),

('machine-learning', 3, 'Generalized Linear Models',
 'The exponential family, GLMs, and how linear and logistic regression are special cases.',
 50),

('machine-learning', 4, 'Generative Learning Algorithms',
 'Gaussian discriminant analysis, Naive Bayes, and the difference between generative and discriminative models.',
 50),

('machine-learning', 5, 'Support Vector Machines',
 'Maximum margin classifier, the kernel trick, soft margins, and the SMO algorithm.',
 50),

-- Embedded Systems (CMU 18-348)
('embedded-systems', 1, 'Introduction to Embedded Systems',
 'Definition of embedded systems, real-time constraints, memory hierarchy in microcontrollers, and the difference between bare-metal and RTOS-based designs.',
 50),

('embedded-systems', 2, 'GPIO and Interrupts',
 'GPIO configuration, polling vs interrupts, ISR design principles, debouncing, and edge/level triggered interrupts.',
 50),

('embedded-systems', 3, 'Timers and PWM',
 'Hardware timers, prescalers, compare/capture units, and PWM generation for motor and LED control.',
 50),

('embedded-systems', 4, 'Serial Protocols: UART, I2C, SPI',
 'Physical layer, framing, and typical use cases for each protocol. We implement a UART driver from scratch.',
 50),

('embedded-systems', 5, 'RTOS Fundamentals',
 'Tasks, scheduling, priority inversion, mutexes vs semaphores, and message queues. We build a small RTOS.',
 50),

-- Thermodynamics (MIT 5.60)
('thermodynamics', 1, 'Introduction and the First Law',
 'System vs surroundings, state functions, work vs heat, and the first law of thermodynamics (energy conservation).',
 50),

('thermodynamics', 2, 'The Second Law and Entropy',
 'Reversible vs irreversible processes, entropy as a state function, and the Carnot cycle.',
 50),

('thermodynamics', 3, 'Thermodynamic Cycles',
 'Rankine, Brayton, and refrigeration cycles. We compute efficiencies using T-s and P-v diagrams.',
 50)

on conflict do nothing;

-- ============================================================================
-- 3. ASSIGNMENTS (sample — with fully worked solutions)
-- ============================================================================
insert into public.assignments (course_slug, number, title, problems, total_points, due_week)
values

('circuits-i', 1, 'Problem Set 1: Lumped Abstraction & KVL/KCL',
'[
  {
    "question": "For a signal with rise time of 1 ns and a circuit board trace length of 10 cm (signal speed ~2x10^8 m/s), is the lumped-element abstraction valid? Explain.",
    "hints": ["Compute the propagation delay: t = L/v", "Compare to the rise time", "Rule of thumb: lumped is valid if propagation delay << rise time"],
    "solution": "Propagation delay = 0.1 m / (2x10^8 m/s) = 0.5 ns. Rise time = 1 ns. Since 0.5 ns is comparable to 1 ns (not much smaller), the lumped abstraction is MARGINAL — distributed effects may matter. Typically we require propagation delay < rise time / 10, so 0.5 ns < 0.1 ns fails.",
    "difficulty": "Medium",
    "points": 15
  },
  {
    "question": "A circuit has three resistors in parallel: R1=100 ohm, R2=200 ohm, R3=400 ohm. What is the equivalent resistance?",
    "hints": ["1/R_eq = 1/R1 + 1/R2 + 1/R3", "Convert to common denominator"],
    "solution": "1/R_eq = 1/100 + 1/200 + 1/400 = 4/400 + 2/400 + 1/400 = 7/400. Therefore R_eq = 400/7 = 57.14 ohm.",
    "difficulty": "Easy",
    "points": 10
  },
  {
    "question": "In a circuit with a 12V source, R1=1k ohm in series with a parallel combination of R2=2k ohm and R3=3k ohm, find the current through R1, the voltage across R2, and the power dissipated in R3.",
    "hints": ["First find the equivalent resistance of the parallel combination", "Then find total current", "Then find voltage across the parallel combination"],
    "solution": "R_parallel = (2k x 3k) / (2k + 3k) = 6k/5k = 1.2k ohm. R_total = 1k + 1.2k = 2.2k ohm. I_R1 = 12V / 2.2k ohm = 5.45 mA. V_parallel = 5.45mA x 1.2k ohm = 6.55V. So V_R2 = V_R3 = 6.55V. Power in R3 = V^2/R = (6.55)^2 / 3000 = 14.3 mW.",
    "difficulty": "Medium",
    "points": 20
  },
  {
    "question": "Find V_x in a circuit with a 10V source, a 2k ohm series resistor, and a voltage divider of 3k ohm and 5k ohm in parallel with the first resistor. Use nodal analysis.",
    "hints": ["Identify all nodes", "Write KCL at each unknown node", "Solve the system"],
    "solution": "At node A (between 2k series and the parallel pair): (V_A - 10)/2k + V_A/3k + V_A/5k = 0. Multiply by 30k: 15(V_A - 10) + 10V_A + 6V_A = 0 -> 31V_A = 150 -> V_A = 4.84V. V_x = V_A = 4.84V.",
    "difficulty": "Hard",
    "points": 25
  }
]'::jsonb, 70, 1),

('circuits-i', 2, 'Problem Set 2: Thevenin and Norton Equivalents',
'[
  {
    "question": "Find the Thevenin equivalent of a circuit consisting of a 12V source in series with 4k ohm, followed by a parallel branch of 6k ohm.",
    "hints": ["V_th = open-circuit voltage", "R_th = resistance seen from load terminals with sources zeroed"],
    "solution": "V_th (open circuit): voltage divider = 12V x 6k/(4k+6k) = 7.2V. R_th: with 12V source shorted, R seen = 4k || 6k = 2.4k ohm. So Thevenin = 7.2V source + 2.4k ohm series resistor.",
    "difficulty": "Medium",
    "points": 20
  },
  {
    "question": "Convert the Thevenin circuit from Q1 to its Norton equivalent.",
    "hints": ["I_n = V_th / R_th", "R_n = R_th (parallel instead of series)"],
    "solution": "I_n = 7.2V / 2.4k ohm = 3 mA. R_n = 2.4k ohm. Norton = 3 mA current source in parallel with 2.4k ohm.",
    "difficulty": "Easy",
    "points": 15
  },
  {
    "question": "A sensor has an internal resistance of 10k ohm and produces 5V open-circuit. Design a load so that the maximum power is transferred, and calculate that power.",
    "hints": ["Maximum power transfer occurs when R_load = R_source", "P_max = V^2 / (4 x R_source)"],
    "solution": "R_load = 10k ohm. P_max = 5^2 / (4 x 10k) = 25 / 40000 = 0.625 mW.",
    "difficulty": "Medium",
    "points": 20
  }
]'::jsonb, 55, 2),

('programming-c', 1, 'Problem Set 1: Pointers and Memory',
'[
  {
    "question": "Write a function `void swap(int *a, int *b)` that swaps two integers using pointers.",
    "hints": ["Dereference to access the values", "Use a temporary variable"],
    "solution": "void swap(int *a, int *b) { int temp = *a; *a = *b; *b = temp; }",
    "difficulty": "Easy",
    "points": 10
  },
  {
    "question": "Given `char *s = \"Hello\";`, what is the value of `*s`, `*(s+1)`, and `*(s+4)`? Explain the difference between `char *s` and `char s[]`.",
    "hints": ["String literals are stored in read-only memory", "Array names decay to pointers"],
    "solution": "*s = ''H'', *(s+1) = ''e'', *(s+4) = ''o''. `char *s` points to a read-only string literal (modifying it is undefined behavior). `char s[]` allocates a mutable array on the stack, and its contents can be changed.",
    "difficulty": "Medium",
    "points": 15
  },
  {
    "question": "Find and fix the memory bug: `char *p = malloc(10); strcpy(p, \"Hello World\"); free(p);`",
    "hints": ["Count the bytes needed", "Remember the null terminator"],
    "solution": "The bug: `\"Hello World\"` requires 12 bytes (11 chars + null terminator), but only 10 were allocated. Fix: `char *p = malloc(12);` or use `malloc(strlen(\"Hello World\") + 1);`.",
    "difficulty": "Medium",
    "points": 20
  }
]'::jsonb, 45, 1),

('data-structures', 1, 'Problem Set 1: Arrays and Linked Lists',
'[
  {
    "question": "Implement an `ArrayList` in Java with methods `add(int)`, `get(int)`, `size()`. Explain the amortized cost of `add` when doubling capacity.",
    "hints": ["Track size and capacity separately", "Doubling capacity gives amortized O(1) insert"],
    "solution": "Amortized O(1): each doubling costs O(n), but happens only every n inserts. Sum over n inserts = n + n/2 + n/4 + ... = 2n operations = O(n) total = O(1) amortized per insert.",
    "difficulty": "Medium",
    "points": 25
  },
  {
    "question": "Compare ArrayList vs LinkedList for the operations: get(i), add at end, add at beginning, remove at beginning. Give Big-O for each.",
    "hints": ["ArrayList has O(1) random access", "LinkedList has O(1) head insert"],
    "solution": "ArrayList: get O(1), add end O(1) amortized, add begin O(n), remove begin O(n). LinkedList: get O(n), add end O(1) (with tail pointer), add begin O(1), remove begin O(1).",
    "difficulty": "Easy",
    "points": 20
  }
]'::jsonb, 45, 1),

('algorithms', 1, 'Problem Set 1: Union-Find and Analysis',
'[
  {
    "question": "Given N=10 elements with the following unions: (1,2), (3,4), (5,6), (1,3), (7,8), (1,7), (9,10), (1,9). Using weighted quick-union with path compression, what is the final tree?",
    "hints": ["Always attach smaller tree to larger", "Path compression flattens on find"],
    "solution": "After all unions, all 10 elements are in one connected component. With path compression, the tree height stays O(alpha(N)) — near constant. Final tree has 1 as root (or 10 depending on tie-breaking).",
    "difficulty": "Medium",
    "points": 25
  },
  {
    "question": "Prove that the union-find with weighted quick-union has O(log n) height.",
    "hints": ["Each link reduces size by at least half", "Tree size doubles along the path"],
    "solution": "When a tree T1 is attached under T2, size(T2) >= size(T1). After the union, the new size >= 2 * size(T1). So each element''s depth increases by at most 1 only when its tree size doubles. Depth <= log2(N).",
    "difficulty": "Hard",
    "points": 30
  }
]'::jsonb, 55, 1),

('machine-learning', 1, 'Problem Set 1: Linear Regression',
'[
  {
    "question": "Derive the closed-form solution for linear regression using least squares: theta = (X^T X)^-1 X^T y.",
    "hints": ["Start from the cost function J(theta) = 0.5 ||X theta - y||^2", "Take gradient and set to zero"],
    "solution": "J(theta) = 0.5 (X theta - y)^T (X theta - y). Grad J = X^T (X theta - y). Set to zero: X^T X theta = X^T y. So theta = (X^T X)^-1 X^T y.",
    "difficulty": "Medium",
    "points": 25
  },
  {
    "question": "Explain the bias-variance tradeoff. What happens when model complexity increases?",
    "hints": ["Bias = error from wrong assumptions", "Variance = sensitivity to training data"],
    "solution": "Total error = Bias^2 + Variance + Irreducible noise. As complexity increases, bias decreases (model fits training data better) but variance increases (model overfits). The optimal complexity minimizes total expected error on unseen data.",
    "difficulty": "Easy",
    "points": 20
  }
]'::jsonb, 45, 1),

('embedded-systems', 1, 'Problem Set 1: GPIO and Interrupts',
'[
  {
    "question": "Explain the difference between polling and interrupts for reading a button press. When is each preferred?",
    "hints": ["Polling uses CPU cycles constantly", "Interrupts wake CPU only on event"],
    "solution": "Polling: CPU repeatedly reads the pin in a loop. Simple but wastes cycles. Preferred when events are frequent and CPU has nothing better to do. Interrupts: CPU sleeps until the pin triggers an ISR. Efficient for rare events, but requires careful ISR design (short, no blocking calls).",
    "difficulty": "Easy",
    "points": 20
  },
  {
    "question": "A mechanical button bounces for 5 ms after each press. Design a debouncing solution in both hardware and software.",
    "hints": ["Hardware: RC filter or Schmitt trigger", "Software: ignore transitions within a window"],
    "solution": "Hardware: 10k pull-up + 100nF capacitor forms an RC filter with tau = 1ms, smoothing out bounces. Software: On first edge, start a timer. Ignore further edges until 10 ms pass. Or sample every 5 ms and require 2 consecutive same reads.",
    "difficulty": "Medium",
    "points": 25
  }
]'::jsonb, 45, 1),

('thermodynamics', 1, 'Problem Set 1: First Law',
'[
  {
    "question": "A gas expands from V1=1 L to V2=3 L against a constant external pressure of 2 atm. Calculate the work done by the gas (1 L atm = 101.3 J).",
    "hints": ["W = -P_ext * delta_V", "Watch unit conversions"],
    "solution": "W = -P_ext * delta_V = -2 atm * (3 L - 1 L) = -4 L atm. In Joules: -4 * 101.3 = -405.2 J. The negative sign means work is done BY the gas on the surroundings.",
    "difficulty": "Easy",
    "points": 20
  },
  {
    "question": "A system absorbs 500 J of heat and does 200 J of work. What is the change in internal energy?",
    "hints": ["First law: delta_U = Q - W"],
    "solution": "delta_U = Q - W = 500 J - 200 J = 300 J.",
    "difficulty": "Easy",
    "points": 15
  }
]'::jsonb, 35, 1)

on conflict do nothing;

-- ============================================================================
-- 4. EXAMS (sample midterms + finals)
-- ============================================================================
insert into public.exams (course_slug, type, title, duration_minutes, problems, total_points)
values

('circuits-i', 'midterm-1', 'Midterm 1: Node, Mesh, Superposition, Thevenin',
 90,
 '[
   {
     "question": "For the circuit shown (10V source, 5 ohm in series with 10 ohm, then 20 ohm parallel), find the voltage across the 20 ohm resistor.",
     "solution": "R_parallel = 10 || 20 = 6.67 ohm. R_total = 5 + 6.67 = 11.67 ohm. I_total = 10/11.67 = 0.857A. V_parallel = 0.857 x 6.67 = 5.71V. So V_20 = 5.71V.",
     "points": 25
   },
   {
     "question": "Find the Thevenin equivalent of a balanced bridge with R1=R2=R3=R4=1k ohm and a 12V source across the bridge.",
     "solution": "For a balanced bridge, V_th = 0 (the two output nodes are at the same potential). R_th = R1||R3 + R2||R4 = 500 + 500 = 1k ohm.",
     "points": 25
   },
   {
     "question": "Design a voltage divider to produce 3.3V from a 5V source, with total current draw under 1mA.",
     "solution": "V_out = V_in x R2/(R1+R2) = 3.3 means R2/(R1+R2) = 0.66. Total R >= 5V/1mA = 5k ohm. Choose R1 = 1.7k ohm, R2 = 3.3k ohm. Verify: 5 x 3.3/(1.7+3.3) = 5 x 3.3/5 = 3.3V. Current = 5V/5k ohm = 1mA.",
     "points": 25
   },
   {
     "question": "Analyze the transient response of an RC circuit with R=1k ohm, C=1 uF, V_source stepping from 0 to 5V at t=0.",
     "solution": "tau = RC = 1ms. V_C(t) = 5(1 - e^(-t/tau)). At t=1ms, V_C = 5 x 0.632 = 3.16V. Current I(t) = (V_source/R) x e^(-t/tau).",
     "points": 25
   }
 ]'::jsonb, 100),

('circuits-i', 'final', 'Final Exam: All Topics',
 180,
 '[
   {
     "question": "Design an op-amp circuit to amplify a 100mV signal to 2V with an input impedance of at least 100k ohm.",
     "solution": "Gain = 20. Use non-inverting configuration: 1 + R2/R1 = 20 means R2/R1 = 19. For input impedance > 100k ohm, use JFET-input op-amp (e.g., TL071). Choose R1 = 10k ohm, R2 = 190k ohm.",
     "points": 35
   },
   {
     "question": "For an RLC series circuit with R=10 ohm, L=1mH, C=1 uF, find the resonant frequency and Q factor.",
     "solution": "omega_0 = 1/sqrt(LC) = 1/sqrt(10^-3 x 10^-6) = 1/sqrt(10^-9) = 31623 rad/s. f_0 = 5.03 kHz. Q = omega_0 L / R = 31623 x 10^-3 / 10 = 3.16. Bandwidth = f_0/Q = 1.59 kHz.",
     "points": 35
   },
   {
     "question": "A CMOS inverter has V_DD = 3.3V. If V_IL = 1.0V and V_IH = 2.3V, calculate the noise margins NM_H and NM_L.",
     "solution": "NM_H = V_DD - V_IH = 3.3 - 2.3 = 1.0V. NM_L = V_IL - 0 = 1.0V. Both are 1.0V — a well-designed inverter.",
     "points": 30
   }
 ]'::jsonb, 100),

('programming-c', 'midterm-1', 'Midterm 1: Pointers, Memory, Strings',
 90,
 '[
   {
     "question": "Write a function `int count_words(const char *s)` that counts the number of space-separated words in a string.",
     "solution": "int count_words(const char *s) { int count = 0, in_word = 0; for (; *s; s++) { if (*s != '' '' && !in_word) { count++; in_word = 1; } else if (*s == '' '') { in_word = 0; } } return count; }",
     "points": 30
   },
   {
     "question": "What is the output of the following code? Explain. `int a[3] = {1,2,3}; printf(\"%d\", *(a+1) + *(a+2));`",
     "solution": "Output: 5. `*(a+1)` = a[1] = 2, `*(a+2)` = a[2] = 3. 2+3 = 5.",
     "points": 20
   },
   {
     "question": "Explain what a dangling pointer is and how to avoid it.",
     "solution": "A dangling pointer points to memory that has been freed. Example: `int *p = malloc(4); free(p); *p = 10;` is undefined behavior. To avoid: set pointer to NULL after free, or use a memory ownership discipline (single owner).",
     "points": 25
   },
   {
     "question": "What is the difference between `malloc` and `calloc`? Give a use case for each.",
     "solution": "malloc(n) allocates n bytes uninitialized. calloc(m, n) allocates m*n bytes, zero-initialized. Use malloc when you will immediately overwrite all bytes; use calloc when you need zero-initialized memory (e.g., arrays of structs).",
     "points": 25
   }
 ]'::jsonb, 100),

('data-structures', 'midterm-1', 'Midterm 1: Arrays, Lists, Trees',
 90,
 '[
   {
     "question": "Given a binary search tree with values 5, 3, 7, 1, 4, 6, 8, draw the tree and give its in-order, pre-order, and post-order traversals.",
     "solution": "Tree: 5 is root, 3 left, 7 right, 1 left of 3, 4 right of 3, 6 left of 7, 8 right of 7. In-order: 1 3 4 5 6 7 8. Pre-order: 5 3 1 4 7 6 8. Post-order: 1 4 3 6 8 7 5.",
     "points": 30
   },
   {
     "question": "What is the worst-case time complexity for insert in an unbalanced BST? Why?",
     "solution": "O(n). If the BST becomes a linked list (e.g., insert 1, 2, 3, 4, 5 in that order), each insert traverses from root to leaf.",
     "points": 20
   },
   {
     "question": "Implement a hash table with chaining in pseudocode. What is the average-case lookup time?",
     "solution": "Array of buckets (linked lists). hash(key) gives bucket index; search scans that bucket. Average O(1 + load_factor), typically O(1) if load_factor < 1. Worst-case O(n) if all keys hash to same bucket.",
     "points": 25
   },
   {
     "question": "Explain the difference between a heap and a BST. Give one use case for each.",
     "solution": "Heap: parent is always smaller (or larger) than children. Structure is complete binary tree. O(log n) insert, O(1) peek-min. No ordering between siblings. Use case: priority queue. BST: left < node < right. O(log n) insert/search (if balanced). In-order traversal gives sorted sequence. Use case: ordered dictionary.",
     "points": 25
   }
 ]'::jsonb, 100)

on conflict do nothing;

-- ============================================================================
-- VERIFICATION QUERIES (run to confirm)
-- ============================================================================
-- select count(*) as total_courses from public.courses;
-- select count(*) as total_lectures from public.lectures;
-- select count(*) as total_assignments from public.assignments;
-- select count(*) as total_exams from public.exams;

-- ============================================================================
-- DONE — 24 courses + 40 lectures + 8 assignments + 4 exams seeded.
-- Next: run supabase_site_stats.sql and supabase_article_views.sql
-- ============================================================================