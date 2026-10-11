-- ============================================================
-- Real University Course Content — Batch 1
-- ============================================================

-- ============================================================
-- 1. COMPUTER ARCHITECTURE (Berkeley CS61C) — 6 lectures
-- ============================================================

insert into public.lectures (course_slug, number, title, content, duration_minutes) values
('computer-architecture', 1, 'Introduction to Computer Architecture', $LEC$
## What is Computer Architecture?

Computer architecture is the study of how to design the interface between software and hardware. It answers the question: what set of instructions should a processor execute, and how should those instructions be implemented in silicon?

## The Abstraction Layers

Modern computers are built in layers:

- Application programs (Python, JavaScript)
- High-level languages compiled to assembly
- Assembly translated to machine code
- Microarchitecture executes machine code
- Logic gates implement the microarchitecture
- Transistors implement logic gates
- Physics enables transistors

Each layer hides complexity from the one above. Computer architecture focuses on the boundary between the ISA (Instruction Set Architecture) and the microarchitecture.

## Instruction Set Architecture

The ISA defines:
- What instructions exist (add, load, branch)
- What registers exist (32 general-purpose on RISC-V)
- How memory is addressed
- How exceptions and interrupts work

The ISA is a contract: software written for an ISA will run on any processor implementing that ISA, regardless of the underlying microarchitecture.

Examples of ISAs:
- x86-64 (Intel, AMD) — the dominant desktop/server ISA
- ARMv8 (Apple M-series, mobile, servers) — dominant in mobile and growing in servers
- RISC-V — open-source, growing fast
- MIPS — historically popular in education

## RISC vs CISC

Two philosophies:

RISC (Reduced Instruction Set Computer):
- Simple, fixed-length instructions
- Load/store architecture (only load/store access memory)
- Many registers
- Compiler does the hard work

CISC (Complex Instruction Set Computer):
- Variable-length instructions
- Many instructions can access memory directly
- Fewer registers
- Hardware does more work

RISC-V is RISC. x86 is CISC. ARM is technically RISC.

Modern x86 CPUs decode CISC instructions into RISC-like micro-ops internally, so the boundary is blurry.

## Why Study Computer Architecture?

Because performance matters, and performance comes from the architecture:

- A well-designed cache can speed up a program 10x
- Pipelining improves throughput by up to 5x
- SIMD (vector instructions) can give 8-16x speedup
- Understanding the memory hierarchy explains why linked lists are slow and arrays are fast

You cannot write fast code without understanding the machine underneath.

## Key Takeaways

- Architecture = interface between software and hardware
- ISA is a stable contract; microarchitecture changes
- RISC vs CISC is a design philosophy, not a religion
- Performance depends on the architecture you target
- Memory hierarchy is the single most important topic
$LEC$, 50),

('computer-architecture', 2, 'RISC-V Assembly Basics', $LEC$
## Why Learn Assembly?

Modern programmers rarely write assembly. But reading assembly teaches you:

- What the compiler actually does with your code
- Why some C code is fast and other C code is slow
- How to debug at the lowest level
- Why certain optimizations work

RISC-V is ideal for learning because it has a small, clean instruction set.

## Registers

RISC-V has 32 general-purpose registers, each 32 or 64 bits wide. By convention:

- x0 / zero — always contains 0
- x1 / ra — return address
- x2 / sp — stack pointer
- x5-7 / t0-2 — temporaries
- x8 / s0 / fp — saved register / frame pointer
- x10-11 / a0-1 — function arguments and return value
- x12-17 / a2-7 — more function arguments
- x18-27 / s1-11 — saved registers
- x28-31 / t3-6 — more temporaries

## Basic Instructions

Arithmetic:
    add rd, rs1, rs2    # rd = rs1 + rs2
    sub rd, rs1, rs2    # rd = rs1 - rs2
    addi rd, rs1, imm   # rd = rs1 + imm

Load/store (the ONLY memory access instructions):
    lw rd, offset(rs1)  # load 32-bit word
    sw rs2, offset(rs1) # store 32-bit word
    lb, lh, sb, sh      # byte and halfword variants

Control flow:
    beq rs1, rs2, label # branch if equal
    bne rs1, rs2, label # branch if not equal
    blt rs1, rs2, label # branch if less than
    j label             # unconditional jump
    jal rd, label       # jump and link (function call)
    jalr rd, rs1, imm   # jump and link register

## A Complete Example

Translate this C function to assembly:

    int sum_array(int *arr, int n) {
        int sum = 0;
        for (int i = 0; i < n; i++) {
            sum += arr[i];
        }
        return sum;
    }

Assembly:

    sum_array:
        # a0 = arr, a1 = n, return in a0
        li t0, 0            # sum = 0
        li t1, 0            # i = 0
        beq a1, zero, done  # if n == 0, return 0
    loop:
        slli t2, t1, 2      # t2 = i * 4 (byte offset)
        add t3, a0, t2      # t3 = &arr[i]
        lw t4, 0(t3)        # t4 = arr[i]
        add t0, t0, t4      # sum += arr[i]
        addi t1, t1, 1      # i++
        blt t1, a1, loop    # if i < n, continue
    done:
        mv a0, t0           # return sum
        ret

## The Stack and Calling Convention

When calling a function:

1. Caller places arguments in a0-a7
2. Caller executes jal to jump to function
3. Function saves return address (already in ra)
4. Function allocates stack frame: addi sp, sp, -N
5. Function runs, saves s-registers if used
6. Function places return value in a0
7. Function restores stack: addi sp, sp, N
8. Function returns: ret (jalr zero, ra, 0)

## Key Takeaways

- RISC-V has a small, orthogonal instruction set
- Only load/store access memory
- Branches and jumps are the only control flow
- The calling convention is a social contract
- Reading assembly reveals what your C compiler really does
$LEC$, 50),

('computer-architecture', 3, 'Datapath and Control', $LEC$
## From ISA to Hardware

The datapath is the collection of hardware components that execute instructions: registers, ALU, memory. The control unit tells the datapath what to do based on the current instruction.

## Single-Cycle Datapath

The simplest design executes each instruction in one clock cycle.

Components:
- Program Counter (PC) — holds address of next instruction
- Instruction Memory — stores the program
- Register File — 32 registers, 2 read ports, 1 write port
- ALU — arithmetic and logic
- Data Memory — for loads/stores
- Control Unit — decodes opcode, sets control signals

For each instruction, the datapath:
1. Fetches instruction at PC
2. Reads source registers
3. Executes ALU operation
4. Accesses memory (if needed)
5. Writes result back
6. Updates PC

## Example: add x1, x2, x3

1. PC = address of add instruction
2. Read x2 and x3 from register file
3. ALU computes x2 + x3
4. Write result to x1
5. PC += 4

## Example: lw x1, 0(x2)

1. PC = address of lw instruction
2. Read x2 from register file
3. ALU computes x2 + 0 (address)
4. Read data memory at that address
5. Write value to x1
6. PC += 4

## Control Unit

The control unit is a state machine that, given the instruction opcode, produces control signals:

- RegWrite — enable writing to register file
- MemRead — enable memory read
- MemWrite — enable memory write
- ALUSrc — choose between register and immediate for second ALU input
- PCSrc — choose between PC+4 and branch target
- ALUOp — determines ALU operation

For RISC-V, the opcode determines everything. A ROM or PLA implements the mapping.

## Clock Period

In a single-cycle design, the clock period must be long enough for the longest instruction. For RISC-V:

- Load instruction: PC → IMem → RegFile → ALU → DMem → RegFile (write)

That's the critical path, maybe 800 ps.

But most instructions are much faster. So a single-cycle design wastes time on simple instructions.

## Multi-Cycle Datapath

Split each instruction into 3-5 cycles:

1. Instruction Fetch (IF)
2. Instruction Decode (ID)
3. Execute (EX)
4. Memory Access (MEM)
5. Write Back (WB)

Each cycle does less work, so the clock is faster. Instructions that don't need a stage skip it (e.g., add doesn't use MEM).

But now the control unit is a bigger state machine, and we need latches between stages to hold intermediate values.

## The Real Win: Pipelining

Multi-cycle is a stepping stone. The real performance comes from pipelining — overlapping instructions so multiple are in flight at once.

That's next lecture.

## Key Takeaways

- Datapath = hardware that executes instructions
- Control = state machine that sets control signals
- Single-cycle: simple but slow (clock = slowest instruction)
- Multi-cycle: complex control but faster clock
- All designs implement the same ISA
$LEC$, 50),

('computer-architecture', 4, 'Pipelining', $LEC$
## The Assembly Line Analogy

A car factory doesn't build one car at a time. It has stations: chassis, engine, paint, wheels. Each station works on a different car. When car A moves from paint to wheels, car B moves from engine to paint.

Pipelining applies the same idea to instruction execution.

## The 5-Stage RISC Pipeline

Split instruction execution into 5 stages:

1. **IF** — Instruction Fetch: read instruction at PC
2. **ID** — Instruction Decode: read registers, decode opcode
3. **EX** — Execute: ALU operation
4. **MEM** — Memory: load/store access
5. **WB** — Write Back: write result to register

Each stage takes one clock cycle. With pipelining, 5 instructions can be in different stages at once.

## Throughput vs Latency

Without pipelining:
- Latency = 5 cycles per instruction
- Throughput = 1/5 instructions per cycle

With pipelining:
- Latency = 5 cycles per instruction (unchanged)
- Throughput = 1 instruction per cycle (5x better)

Pipelining improves throughput, not latency. In practice, it's a huge win.

## Hazards

Pipelining isn't free. Three types of hazards can stall the pipeline:

## 1. Structural Hazards

Two instructions want the same hardware at the same time. Example: one instruction is fetching from memory while another is loading data from memory. Solution: separate instruction and data memories (Harvard architecture) or add more ports.

## 2. Data Hazards

An instruction needs a value that a previous instruction hasn't written yet.

    add x1, x2, x3    # writes x1
    sub x4, x1, x5    # reads x1 (needs the value from add)

The sub can't run until add finishes. Solutions:

**Forwarding (bypassing):** The ALU result from add's EX stage can be forwarded directly to sub's EX stage without waiting for WB. This eliminates most stalls.

**Stalling:** If forwarding isn't possible (e.g., a load followed immediately by a use of the loaded value), insert NOPs.

**Code reordering:** The compiler can insert independent instructions between the dependent ones.

## 3. Control Hazards

Branches create uncertainty. We don't know the next PC until we evaluate the branch.

    beq x1, x2, target
    add x3, x4, x5   # should this execute?
    ...

Solutions:

**Stall:** wait until branch resolves. Simple but slow.

**Predict not taken:** assume branch is not taken, fetch the next instruction. If wrong, flush and restart. Works well when branches are rarely taken.

**Predict taken:** assume branch is taken. Works well for loops.

**Delayed branch:** RISC's original solution — the instruction after the branch always executes. Compiler fills the slot with something useful. Rarely used today.

**Branch prediction:** Modern CPUs use sophisticated predictors (2-bit, gshare, tournament, TAGE) that achieve >95% accuracy. Wrong predictions cost ~15 cycles to flush.

## Superscalar and Out-of-Order

Modern CPUs go beyond simple pipelining:

- **Superscalar:** multiple pipelines, issue 2-6 instructions per cycle
- **Out-of-order execution:** instructions can complete in any order as long as dependencies are respected
- **Register renaming:** removes false dependencies
- **Speculative execution:** run instructions before knowing if they should run

These techniques give another 2-4x speedup.

## Key Takeaways

- Pipelining overlaps instruction execution for higher throughput
- 5-stage RISC pipeline: IF, ID, EX, MEM, WB
- Hazards: structural, data, control
- Forwarding eliminates most data stalls
- Branch prediction is critical for performance
- Modern CPUs add superscalar and out-of-order on top
$LEC$, 50),

('computer-architecture', 5, 'Caches and the Memory Hierarchy', $LEC$
## The Memory Wall

Since 1980:
- CPU speed has grown 10,000x
- DRAM latency has improved only 10x

The gap means that fetching from DRAM can take 200+ cycles. If every instruction had to wait that long, CPUs would be useless.

The solution: a hierarchy of caches. Small, fast, expensive memory close to the CPU; large, slow, cheap memory far away.

## The Hierarchy

    Registers       1 KB     0.3 ns
    L1 Cache        32 KB    1 ns
    L2 Cache        256 KB   4 ns
    L3 Cache        8 MB     15 ns
    DRAM            16 GB    80 ns
    SSD             1 TB     100 us
    HDD             4 TB     10 ms

Each level is ~10x larger and ~10x slower than the one above. Data moves up on demand.

## Locality

Caches work because programs exhibit locality:

**Temporal locality:** recently accessed data is likely to be accessed again soon (loop counters, hot variables).

**Spatial locality:** data near recently accessed data is likely to be accessed soon (array traversal, struct fields).

If a program has good locality, it hits in the cache most of the time.

## Cache Organization

A cache is divided into lines (blocks), typically 64 bytes. Each line stores a chunk of memory plus metadata:

- **Valid bit** — is this line real?
- **Tag** — which memory address does this line hold?
- **Data** — the actual bytes

On access, the cache:
1. Splits the address into tag, index, offset
2. Looks up the set at that index
3. Compares tags
4. If hit: return data. If miss: fetch from next level.

## Three Types of Cache

**Direct-mapped:** each address maps to exactly one line.

    Index = (address / line_size) mod num_lines

Simple, fast, but collisions cause misses.

**Fully associative:** any address can go anywhere. Needs a comparator per line. Expensive.

**Set-associative:** compromise. Each address maps to a set of N lines; the address can go in any of the N. Typical: 4-way or 8-way.

    Index = (address / line_size) mod num_sets

## Replacement Policies

When a set is full, which line to evict?

- **LRU** (Least Recently Used) — evict the line not used longest
- **Random** — sometimes as good as LRU
- **FIFO** — first in first out
- **Pseudo-LRU** — approximation, cheaper to implement

## Writing to Cache

**Write-through:** write to cache AND to memory. Simple, but slow.

**Write-back:** write only to cache. Mark line dirty. Write to memory when evicted. Fast, but complex.

Most modern caches are write-back.

## Real Numbers

Consider a loop over 1 MB of data. L1 = 32 KB, L2 = 256 KB, L3 = 8 MB.

First pass:
- L1 misses: nearly 100%
- L2 misses: ~90%
- L3 misses: 0% (data fits in L3)
- DRAM accesses: 1 MB / 64 B = 16,384

Second pass:
- L1 misses: 100% (data evicted)
- L2 misses: 0% (data still in L2? no, L2 too small)
- L3 misses: 0% (data fits)
- DRAM: 0

Third and later passes: same as second.

Total time dominated by first-pass DRAM latency.

## Cache-Aware Programming

To write fast code:

- Access arrays sequentially, not randomly
- Use contiguous data structures (arrays > linked lists)
- Block algorithms to fit in cache (matrix multiply blocking)
- Avoid pointer chasing
- Align hot data to cache lines

The famous example: iterating a linked list is 10-30x slower than iterating an array of the same size, because of cache misses.

## Key Takeaways

- Caches hide the CPU-memory latency gap
- Locality makes caches work
- 3 organizations: direct, fully associative, set-associative
- Write-back is faster than write-through
- 10x speedup for cache-friendly code is common
- Cache awareness is essential for high-performance programming
$LEC$, 50),

('computer-architecture', 6, 'Virtual Memory', $LEC$
## The Problem

Multiple programs run on a single machine. Each wants its own address space. Memory is finite and shared.

Solution: virtual memory. Each process sees a large, private, contiguous address space. The hardware translates virtual addresses to physical addresses.

## Benefits

- **Isolation:** process A can't read process B's memory
- **Protection:** can't write to read-only pages
- **Flexibility:** programs don't need to know physical layout
- **Overcommit:** more virtual memory than physical RAM
- **Sharing:** libraries shared across processes

## Pages and Frames

Virtual memory is divided into fixed-size pages (typically 4 KB). Physical memory is divided into frames of the same size.

A page table maps virtual page numbers to physical frame numbers. The MMU (Memory Management Unit) does the translation in hardware.

    Virtual address:  | VPN | offset |
    Physical address: | PFN | offset |

The offset is preserved. Only the page number is translated.

## Page Tables

The simplest page table is a flat array with one entry per virtual page. For a 48-bit address space with 4 KB pages:

- 2^36 virtual pages × 8 bytes per entry = 512 GB page table

That's too big. So we use multi-level page tables.

## Multi-Level Page Tables

Split the VPN into pieces. Each level indexes a smaller table.

For 48-bit addresses with 4-level page tables:

    | L4 | L3 | L2 | L1 | offset |
     9    9    9    9    12

Each level's table has 512 entries × 8 bytes = 4 KB (one page).

Most VPN ranges are unused, so most L4 entries are null. Total memory cost: a few MB per process, not 512 GB.

## The TLB

Every memory access needs a page table walk: 4 memory reads. That's 4x slower.

Solution: the TLB (Translation Lookaside Buffer). A small, fast cache of recent translations.

Typical TLB: 64-2048 entries, fully associative, ~1 cycle access.

Hit rate is usually >99% because of locality.

With a TLB hit, the translation is free. With a miss, we walk the page table (~20 cycles).

## Page Faults

If a virtual page has no valid mapping:

1. CPU raises a page fault exception
2. OS handles it
3. If page is in swap: load it into a free frame, update page table, resume
4. If page is illegal: kill process with SIGSEGV

Page faults are expensive (~10,000 cycles), but rare.

## Demand Paging

Programs don't need all their memory resident. The OS loads pages lazily, on first access. This lets processes use more virtual memory than physical RAM.

Physical memory holds the working set — the pages actually in use. The rest sit in swap on disk.

## Page Replacement

When physical memory is full and a new page is needed, evict a page.

Algorithms:
- **OPT** (optimal) — evict the page used furthest in the future. Impossible to implement, but useful as a benchmark.
- **LRU** — evict least recently used. Good, but expensive.
- **Clock** — approximation of LRU with a reference bit.
- **FIFO** — can be pathological (Belady's anomaly).

Linux uses a variant of LRU with active/inactive lists.

## Memory-Mapped Files

A file can be mapped into memory. Reads and writes become memory accesses. The OS handles paging from disk.

Advantages:
- Simple I/O: no read/write calls
- Shared between processes
- Lazy loading: only pages actually accessed are loaded

Disadvantages:
- Page faults on access are slower than buffered I/O for random access
- Can't handle files larger than virtual address space

## Key Takeaways

- Virtual memory gives each process a private, contiguous address space
- Page tables map virtual pages to physical frames
- Multi-level page tables save memory
- TLBs make translation free in the common case
- Page faults handle missing pages
- Demand paging allows overcommit
- LRU is the standard replacement algorithm
$LEC$, 50)

on conflict do nothing;

-- ============================================================
-- DONE — Computer Architecture (6 lectures)
-- ============================================================
select 'Computer Architecture lectures added: ' || count(*) as result
from public.lectures
where course_slug = 'computer-architecture';