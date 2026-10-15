import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const SLUG = 'mit-6-0001-intro-cs-python';

const lectures = [
{
n:1, title:'What is Computation?',
body:`## Overview

Every program you write is a sequence of primitive operations that manipulate data. Programming is choosing the right operations, arranging them well, and packaging them so others can reuse them.

The course distinguishes two kinds of knowledge. **Declarative knowledge** is knowledge of facts: "Paris is the capital of France." **Imperative knowledge** is knowledge of how to do something: a recipe, an algorithm. A computer only understands the second kind.

## Key ideas

- A computer manipulates data according to a stored program.
- Programs are imperative: they say *how* to compute, not *what* is true.
- Python is a good first language because its syntax is close to English.
- The same computation can be expressed at many levels of abstraction.

## Worked example: Python as a calculator

\`\`\`
>>> 3 + 4
7
>>> 2 ** 10
1024
>>> 7 / 3
2.3333333333333335
>>> 7 // 3
2
>>> 7 % 3
1
\`\`\`

Each line is an *expression*. The interpreter evaluates it and prints a value. Notice the difference between \`/\` (true division) and \`//\` (floor division).

## Common pitfalls

- Confusing \`/\` and \`//\`. In Python 3, \`/\` always returns a float.
- Forgetting that \`**\` has higher precedence than \`*\`.
- Assuming all languages treat big integers exactly. Python does; most do not.

## Why it matters

Everything later — functions, recursion, classes, algorithms — builds on this idea: a program is a sequence of steps a machine can follow without thinking.`
},
{
n:2, title:'Branching and Iteration',
body:`## Overview

Programs that only do one thing are useless. Real programs make decisions and repeat actions. This lecture covers the two control-flow constructs that make this possible: *conditionals* and *loops*.

## Boolean expressions

\`\`\`
>>> 3 < 5
True
>>> 3 == 3.0
True
>>> "abc" < "abd"
True
\`\`\`

Combine with \`and\`, \`or\`, \`not\`.

## If statements

\`\`\`python
if x > 0:
    print("positive")
elif x < 0:
    print("negative")
else:
    print("zero")
\`\`\`

Python uses **indentation** to mark blocks. Mixing tabs and spaces raises an error.

## While loops

\`\`\`python
n = 10
while n > 0:
    print(n)
    n = n - 1
\`\`\`

The loop body must change something, or you get an infinite loop.

## For loops

\`\`\`python
for i in range(5):
    print(i)      # 0 1 2 3 4
for c in "hello":
    print(c)
\`\`\`

\`range(n)\` produces \`0, 1, ..., n-1\`.

## Loop invariants

A **loop invariant** is a statement true before and after every iteration. Reasoning about invariants is the professional way to convince yourself a loop is correct.

## Common pitfalls

- Forgetting the colon after \`if\`, \`while\`, or \`for\`.
- Mixing tabs and spaces.
- Using \`=\` (assignment) where \`==\` (comparison) is meant.

## Why it matters

Every algorithm reduces to decisions and repetitions.`
},
{
n:3, title:'String Manipulation and Guess-and-Check',
body:`## Overview

Strings are indexed sequences of characters. They introduce **indexing** and **iteration over structure**. This lecture uses strings to introduce the *guess-and-check* pattern.

## Strings as sequences

\`\`\`
>>> s = "pulse"
>>> s[0]
'p'
>>> s[-1]
'e'
>>> s[1:4]
'uls'
>>> len(s)
5
\`\`\`

Strings are **immutable**: \`s[0] = 'P'\` raises TypeError. Build a new string instead:

\`\`\`
>>> s = "P" + s[1:]
>>> s
'Pulse'
\`\`\`

## Guess-and-check

\`\`\`python
def is_prime(n):
    if n < 2:
        return False
    for d in range(2, n):
        if n % d == 0:
            return False
    return True
\`\`\`

Correct but slow: for \`n = 10**6\`, it tries a million divisions. Testing only up to \`sqrt(n)\` cuts the work enormously.

## Approximation

\`\`\`python
def cube_root(x, eps=1e-6):
    g = x / 3
    while abs(g**3 - x) > eps:
        g = (2*g + x/(g*g)) / 3
    return g
\`\`\`

This is Newton's method; it converges quadratically.

## Common pitfalls

- Off-by-one errors in slices. \`s[1:4]\` returns three characters.
- Forgetting strings are immutable.
- Comparing with \`is\` instead of \`==\`.

## Why it matters

Guess-and-check is the simplest algorithmic idea there is — and often a smart way to start thinking about a problem.`
},
{
n:4, title:'Functions and Abstraction',
body:`## Overview

Functions package a computation under a name and reuse it. This is the single biggest step in abstraction. Every serious language has functions; Python's are particularly flexible.

## Defining and calling

\`\`\`python
def area(width, height):
    return width * height

a = area(3, 4)   # a == 12
\`\`\`

\`def\` starts the definition. \`width\` and \`height\` are **parameters**. \`3\` and \`4\` are **arguments**.

## Scope

Variables created inside a function are **local**:

\`\`\`python
def f():
    x = 10
    return x

f()
print(x)   # NameError: x is not defined
\`\`\`

This is a feature. Local variables cannot accidentally break code elsewhere.

## Decomposition

\`\`\`python
def distance(x1, y1, x2, y2):
    return ((x2-x1)**2 + (y2-y1)**2) ** 0.5

def perimeter(points):
    total = 0
    for i in range(len(points)):
        x1, y1 = points[i]
        x2, y2 = points[(i+1) % len(points)]
        total += distance(x1, y1, x2, y2)
    return total
\`\`\`

Each function does one thing.

## Default arguments

\`\`\`python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Jon")                    # "Hello, Jon!"
greet("Jon", greeting="Hi")     # "Hi, Jon!"
\`\`\`

## Common pitfalls

- **Mutable default arguments**:

\`\`\`python
def bad(x, acc=[]):
    acc.append(x)
    return acc
\`\`\`

\`acc\` persists between calls. Use \`acc=None\` instead.

- Shadowing built-in names (\`list\`, \`str\`, \`sum\`).

## Why it matters

Abstraction is the difference between a hobby script and software.`
},
{
n:5, title:'Tuples, Lists, Aliasing, and Mutability',
body:`## Overview

Compound data types let you group values. Python has two workhorses: **tuples** (immutable) and **lists** (mutable). The distinction is small in syntax and enormous in consequence.

## Tuples

\`\`\`python
point = (3, 4)
x, y = point          # unpacking
print(point[0])       # 3
\`\`\`

Tuples are immutable. Safe to share, safe to hash, safe as dict keys.

## Lists

\`\`\`python
nums = [10, 20, 30]
nums[0] = 5
nums.append(40)
nums.sort()
\`\`\`

Mutable. \`append\`, \`pop\`, \`sort\` change the list in place and return \`None\`.

## Aliasing

\`\`\`python
a = [1, 2, 3]
b = a
b.append(4)
print(a)   # [1, 2, 3, 4]  <- a changed too
\`\`\`

\`a\` and \`b\` name the **same object**. This is **aliasing**.

## Copying

\`\`\`python
b = a[:]        # shallow copy
c = list(a)     # shallow copy
import copy
d = copy.deepcopy(a)   # deep copy
\`\`\`

Shallow copy is enough when the list contains only immutable values.

## Tuple vs list

- **Tuple** for fixed collections: a point, an RGB triple, a database row.
- **List** for growing collections: a queue, a shopping cart.

## Common pitfalls

- Assuming \`b = a\` copies the list. It does not.
- Mutating a list while iterating over it.
- Using a list as a dictionary key (unhashable).
- Forgetting \`sort()\` returns \`None\`.

## Why it matters

Aliasing is how references work in every modern language — Java, JavaScript, C++.`
},
{
n:6, title:'Recursion and Dictionaries',
body:`## Overview

Recursion solves a problem by solving a smaller version of the same problem. Dictionaries are Python's built-in hash map — constant-time lookup. Together, they turn exponential solutions into linear ones.

## Structure of recursion

Every recursive function has:

1. **Base case** — a simple input answered directly.
2. **Recursive step** — calls itself on smaller input.

\`\`\`python
def factorial(n):
    if n <= 1:          # base case
        return 1
    return n * factorial(n - 1)   # recursive step
\`\`\`

## The call stack

Each pending call keeps its own frame — its own \`n\`, its own locals. Python's default recursion limit is around 1000.

## When recursion shines

Trees, nested structures, divide-and-conquer:

\`\`\`python
def total_size(folder):
    size = 0
    for entry in folder:
        if entry.is_file():
            size += entry.size
        else:
            size += total_size(entry)
    return size
\`\`\`

## Dictionaries

\`\`\`python
d = {"a": 1, "b": 2}
d["c"] = 3
print(d.get("z", 0))   # 0 — safe lookup
\`\`\`

Average lookup, insert, delete are **O(1)**.

## Memoisation

\`\`\`python
memo = {}
def fib(n):
    if n in memo: return memo[n]
    if n < 2: return n
    memo[n] = fib(n-1) + fib(n-2)
    return memo[n]
\`\`\`

Without the cache, \`fib(40)\` takes billions of calls. With it, 40.

## Common pitfalls

- Missing base case → infinite recursion.
- Base case never reached.
- Rebuilding the same subproblem — the Fibonacci trap.

## Why it matters

Recursion is the natural language for self-similar problems. Combined with memoisation, it becomes **dynamic programming**.`
},
{
n:7, title:'Testing, Debugging, Exceptions, Assertions',
body:`## Overview

Writing code is one skill; making it **reliable** is another. This lecture covers unit tests, assertions, exception handling, and disciplined debugging.

## Why test

You cannot know a function is correct by reading it. You know it by running it against inputs where you already know the answer.

\`\`\`python
def add(a, b):
    return a + b

assert add(2, 3) == 5
assert add(-1, 1) == 0
\`\`\`

## Unit tests

\`\`\`python
import unittest

class TestSquare(unittest.TestCase):
    def test_positive(self):
        self.assertEqual(square(3), 9)
    def test_zero(self):
        self.assertEqual(square(0), 0)
    def test_negative(self):
        self.assertEqual(square(-4), 16)
\`\`\`

Cover normal cases, boundary cases, and error cases.

## Assertions

\`\`\`python
def average(nums):
    assert len(nums) > 0, "average of empty list is undefined"
    return sum(nums) / len(nums)
\`\`\`

Assertions document invariants. They stop the program before corrupt data spreads.

## Exceptions

\`\`\`python
try:
    n = int(input("number: "))
    result = 100 / n
except ValueError:
    print("not a number")
except ZeroDivisionError:
    print("cannot divide by zero")
else:
    print("result =", result)
finally:
    print("done")
\`\`\`

Catch **specific** exceptions. A bare \`except:\` swallows everything, including typos.

## Debugging

The professional debugger is \`print\`. Strategic prints show which branch was taken, values before failure, and loop counts. For bigger problems, use \`pdb\`.

## Common pitfalls

- Tests that pass regardless of the code.
- Over-broad \`except:\` that hides bugs.
- Assertions used for user input validation (should be exceptions).

## Why it matters

Professional software is defined less by what it does than by how it fails.`
},
{
n:8, title:'Object-Oriented Programming',
body:`## Overview

Classes bundle data and the operations on that data into a single unit. OOP is the dominant style in large Python codebases and the foundation of most libraries you will use.

## A first class

\`\`\`python
class Point:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def distance_to(self, other):
        return ((self.x - other.x)**2 + (self.y - other.y)**2) ** 0.5

p = Point(3, 4)
q = Point(0, 0)
print(p.distance_to(q))   # 5.0
\`\`\`

\`__init__\` runs when you call \`Point(3, 4)\`. \`self\` refers to the instance.

## Attributes and methods

- **Attributes** are data: \`self.x\`.
- **Methods** are behaviour: \`distance_to\`.

Class attribute shared by all instances:

\`\`\`python
class Counter:
    total = 0
    def __init__(self):
        Counter.total += 1
\`\`\`

## Inheritance

\`\`\`python
class Shape:
    def area(self):
        raise NotImplementedError

class Circle(Shape):
    def __init__(self, r): self.r = r
    def area(self): return 3.14159 * self.r ** 2
\`\`\`

Code that accepts a \`Shape\` accepts either. This is **polymorphism**.

## Composition over inheritance

Inheritance models **is-a**. Composition models **has-a**. Prefer composition when neither fits:

\`\`\`python
class Car:
    def __init__(self):
        self.engine = Engine()   # has-a
\`\`\`

## Magic methods

\`\`\`python
class Vec:
    def __init__(self, x, y): self.x, self.y = x, y
    def __add__(self, o): return Vec(self.x+o.x, self.y+o.y)
    def __repr__(self):   return f"Vec({self.x}, {self.y})"
\`\`\`

## Common pitfalls

- Forgetting \`self\` in method definitions.
- Mutating a class attribute when you meant an instance attribute.
- Deep inheritance hierarchies (5+ levels) that become hard to reason about.

## Why it matters

Classes package state and behaviour. Understanding them means reading library code — and writing libraries of your own.`
},
{
n:9, title:'Algorithmic Complexity',
body:`## Overview

Not all correct programs are equally good. **Algorithmic complexity** is the language for how running time grows with input size.

## Counting operations

\`\`\`python
def sum_list(nums):
    total = 0
    for n in nums:
        total += n
    return total
\`\`\`

Time is proportional to \`len(nums)\`. Double the list, double the time.

## Big-O notation

Three rules:

1. Drop constants: \`2n + 5\` becomes \`O(n)\`.
2. Drop lower-order terms: \`n^2 + n + 1\` becomes \`O(n^2)\`.
3. Keep only the fastest-growing term.

## The common classes

- **O(1)** — constant. Array indexing, dictionary lookup.
- **O(log n)** — logarithmic. Binary search, balanced trees.
- **O(n)** — linear. One pass over the data.
- **O(n log n)** — merge sort, heapsort.
- **O(n^2)** — nested loops.
- **O(2^n)** — exponential. Brute-force over subsets.

## Why shape matters

An O(n^2) algorithm takes 1 second for \`n = 1,000\`. For \`n = 1,000,000\`, it takes 1,000,000 seconds — over 11 days. Same hardware, same program. The algorithm did not get slower; the input grew.

An O(n log n) algorithm on \`n = 1,000,000\` takes roughly 20 seconds. The difference is not 10× — it is 50,000×.

## Amortised complexity

Python lists occasionally resize (an O(n) copy) but rarely. The **amortised** cost of \`append\` is O(1).

## Best, worst, average

- **Worst case** — the guarantee.
- **Average case** — requires input assumptions.

Always quote worst case unless you have a specific reason.

## Common pitfalls

- Confusing Big-O with actual time. A 1000×-smaller constant can dominate at small \`n\`.
- Assuming \`len(list)\` is O(n). It is O(1).
- String concatenation in a loop is O(n^2). Use \`"".join(parts)\`.

## Why it matters

Complexity analysis predicts whether your code survives growth.`
},
{
n:10, title:'Searching and Sorting',
body:`## Overview

Two problems dominate practical programming: *find this thing* and *put these things in order*.

## Linear search

\`\`\`python
def linear_search(nums, target):
    for i, n in enumerate(nums):
        if n == target:
            return i
    return -1
\`\`\`

O(n). Works on any list.

## Binary search

\`\`\`python
def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target: return mid
        if nums[mid] < target: lo = mid + 1
        else: hi = mid - 1
    return -1
\`\`\`

O(log n). For a million items, ~20 comparisons.

## Simple sorts

Insertion sort: O(n^2) worst case, fast on nearly sorted data.

\`\`\`python
for i in range(1, len(nums)):
    key = nums[i]
    j = i - 1
    while j >= 0 and nums[j] > key:
        nums[j+1] = nums[j]
        j -= 1
    nums[j+1] = key
\`\`\`

Selection and bubble sort: also O(n^2). Mostly teaching tools.

## Merge sort

\`\`\`python
def merge_sort(a):
    if len(a) <= 1: return a
    mid = len(a) // 2
    L = merge_sort(a[:mid])
    R = merge_sort(a[mid:])
    return merge(L, R)
\`\`\`

O(n log n) always. Stable. Predictable.

## Why O(n log n) is optimal

Any comparison sort must distinguish \`n!\` orderings. Each comparison has two outcomes. So \`log2(n!) ≈ n log n\` comparisons are needed.

## Common pitfalls

- Using bubble sort in production.
- Forgetting \`list.sort()\` returns \`None\`.
- Using \`sorted()\` when a heap would do.

## Why it matters

Sorting is a benchmark for algorithmic thinking: optimal solution, provable lower bound, multiple strategies.`
}
];

async function main() {
  console.log('Deleting existing 6.0001 lectures...');
  const { error: delErr } = await supabase.from('lectures').delete().eq('course_slug', SLUG);
  if (delErr) { console.error('Delete failed:', delErr.message); process.exit(1); }

  console.log('Inserting 10 lectures...');
  for (const l of lectures) {
    const minutes = Math.max(1, Math.round(l.body.split(/\s+/).filter(Boolean).length / 200));
    const { error } = await supabase.from('lectures').insert({
      course_slug: SLUG,
      number: l.n,
      title: l.title,
      content: l.body,
      duration_minutes: minutes
    });
    if (error) console.warn(`  ✗ ${l.n}. ${l.title} — ${error.message}`);
    else console.log(`  ✓ ${l.n}. ${l.title} (${minutes} min)`);
  }

  const { count } = await supabase.from('lectures').select('*', { count: 'exact', head: true }).eq('course_slug', SLUG);
  console.log(`\nTotal lectures for 6.0001: ${count}`);
}

main().catch(e => { console.error(e); process.exit(1); });