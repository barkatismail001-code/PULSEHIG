-- TechPulse — Real Lecture Content
-- Uses dollar-quoting ($$...$$) so no escaping issues

update public.lectures set content = $LEC$
## What is a Data Structure?

A data structure is a way of organizing data in memory so that it can be used efficiently. It is NOT just an implementation detail - it is a design decision that determines what operations are fast, what operations are slow, and how much memory you need.

Every program performs operations on data:
- Insert: add a new element
- Delete: remove an element
- Search: find an element
- Iterate: visit all elements in order
- Sort: arrange elements in some order

Different data structures make different operations fast or slow.

## The Central Trade-off: Time vs Space

There is no perfect data structure. Every choice is a trade-off:

- Arrays are compact (no extra memory) and allow O(1) access by index, but inserting in the middle is O(n).
- Linked lists allow O(1) insert at the head, but accessing the k-th element requires O(k) traversal.
- Hash tables give O(1) average lookup, but use extra memory for the hash table itself.
- Trees give O(log n) insert/search in balanced form, but require pointers.

## Asymptotic Analysis Preview

The standard way to compare data structures is Big-O notation:

- O(1): constant time (same regardless of n)
- O(log n): logarithmic (very fast even for huge n)
- O(n): linear (proportional to n)
- O(n log n): typical for good sorting
- O(n^2): quadratic (slow for large n)

## A Concrete Example

Suppose you need to store 1,000,000 customer records:

Array:
- Memory: 1,000,000 x 100 bytes = ~100 MB
- Look up by ID: O(n) if unsorted, O(log n) if sorted
- Insert new customer: O(n) (must shift later elements)

Hash table:
- Memory: 1,000,000 x 100 bytes + 30% overhead = ~130 MB
- Look up by ID: O(1) average
- Insert new customer: O(1) average

The hash table is 30% bigger but ~1,000,000x faster on lookups. For most applications, this is the right trade-off.

## Key Takeaways

- Data structures are about trade-offs, not universal solutions
- The choice can change O(n^2) into O(n log n)
- Always ask: what operations do I need to be FAST?
- Big-O is the language we use to compare them
$LEC$ where course_slug = 'data-structures' and number = 1;

update public.lectures set content = $LEC$
## Arrays

An array is a contiguous block of memory holding elements of the same type:

    int[] a = new int[10];  // allocates 10 integers
    a[0] = 42;               // O(1) access

Indexing is O(1) - the JVM computes base + index * element_size.

Advantages:
- Extremely fast random access
- Compact memory layout (no pointers)
- Cache-friendly (contiguous memory)

Disadvantages:
- Fixed size (Java arrays cannot grow)
- Insertion/deletion in the middle is O(n)

## Implementing a Dynamic Array (ArrayList)

To grow, we allocate a bigger array and copy. The trick is doubling:

    public class ArrayList {
        private int[] data;
        private int size;
        
        public ArrayList() {
            data = new int[10];
            size = 0;
        }
        
        public void add(int value) {
            if (size == data.length) grow();
            data[size++] = value;
        }
        
        private void grow() {
            int[] bigger = new int[data.length * 2];
            System.arraycopy(data, 0, bigger, 0, size);
            data = bigger;
        }
        
        public int get(int index) {
            if (index < 0 || index >= size) throw new IndexOutOfBoundsException();
            return data[index];
        }
    }

## Linked Lists

A linked list stores each element in a node with a reference to the next node:

    class Node {
        int value;
        Node next;
        Node(int value, Node next) { this.value = value; this.next = next; }
    }
    
    public class LinkedList {
        private Node head;
        private int size;
        
        public void addFirst(int value) {
            head = new Node(value, head);
            size++;
        }
        
        public int get(int index) {
            Node cur = head;
            for (int i = 0; i < index; i++) cur = cur.next;
            return cur.value;
        }
    }

## The Trade-off in Practice

Operation        | ArrayList      | LinkedList
-----------------|----------------|----------------
get(i)           | O(1)           | O(n)
add at end       | O(1) amortized | O(1) with tail
add at front     | O(n)           | O(1)
remove at front  | O(n)           | O(1)
Memory per item  | 4 bytes        | 4 + 8 bytes

## When to Use Which

Use ArrayList when:
- You mostly read/access by index
- You add/remove at the end
- Memory matters

Use LinkedList when:
- You add/remove frequently at the front
- You need a queue or stack (both O(1) at head)
- Random access is rare

## Key Takeaways

- ArrayList = fast random access, slow middle insert
- LinkedList = fast front insert, slow random access
- Doubling strategy gives O(1) amortized add
- Always measure before optimizing
$LEC$ where course_slug = 'data-structures' and number = 2;

update public.lectures set content = $LEC$
## Abstract Data Types: Stack and Queue

A Stack is Last-In-First-Out (LIFO). A Queue is First-In-First-Out (FIFO). These are abstract data types - they define behavior, not implementation.

Stack operations:
- push(x) - add x on top
- pop() - remove and return top
- peek() - return top without removing
- isEmpty() - true if empty

Queue operations:
- enqueue(x) - add x to back
- dequeue() - remove and return front
- peek() - return front
- isEmpty() - true if empty

## Array-Backed Stack

    public class ArrayStack {
        private int[] data;
        private int top;
        
        public ArrayStack() { data = new int[10]; top = 0; }
        
        public void push(int value) {
            if (top == data.length) grow();
            data[top++] = value;
        }
        
        public int pop() {
            if (top == 0) throw new RuntimeException("Empty stack");
            return data[--top];
        }
        
        public int peek() { return data[top - 1]; }
        public boolean isEmpty() { return top == 0; }
        
        private void grow() {
            int[] bigger = new int[data.length * 2];
            System.arraycopy(data, 0, bigger, 0, top);
            data = bigger;
        }
    }

All operations are O(1) amortized.

## Linked-List Stack

    public class LinkedStack {
        private Node top;
        
        public void push(int value) { top = new Node(value, top); }
        
        public int pop() {
            int v = top.value;
            top = top.next;
            return v;
        }
    }

## Linked-List Queue

Keep pointers to BOTH head and tail:

    public class LinkedQueue {
        private Node head, tail;
        
        public void enqueue(int value) {
            Node n = new Node(value, null);
            if (head == null) {
                head = tail = n;
            } else {
                tail.next = n;
                tail = n;
            }
        }
        
        public int dequeue() {
            int v = head.value;
            head = head.next;
            if (head == null) tail = null;
            return v;
        }
    }

All operations O(1).

## Real-World Applications

Stacks:
- Function call stack (recursion)
- Undo/redo in editors
- Balanced parentheses checking
- Depth-First Search (DFS)
- Expression evaluation

Queues:
- Print spooler
- Task schedulers
- Breadth-First Search (BFS)
- Message queues (RabbitMQ, Kafka)
- Request buffering in web servers

## Balanced Parentheses - Classic Stack Problem

    public boolean isBalanced(String s) {
        ArrayStack stack = new ArrayStack();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if (c == ')' && open != '(') return false;
                if (c == ']' && open != '[') return false;
                if (c == '}' && open != '{') return false;
            }
        }
        return stack.isEmpty();
    }

## Key Takeaways

- Stack = LIFO, Queue = FIFO
- Both can be array-backed or list-backed
- O(1) for all core operations
- Queue needs both head AND tail pointers
- Circular arrays give better cache locality
$LEC$ where course_slug = 'data-structures' and number = 3;

update public.lectures set content = $LEC$
## The BST Invariant

A Binary Search Tree is a binary tree where for every node:
- All values in the left subtree are LESS than the node
- All values in the right subtree are GREATER than the node

This gives a powerful guarantee: in-order traversal visits nodes in sorted order.

## Node Structure

    class BSTNode {
        int value;
        BSTNode left, right;
        BSTNode(int value) { this.value = value; }
    }
    
    public class BST {
        private BSTNode root;
        private int size;
    }

## Insert

    public void insert(int value) {
        root = insert(root, value);
    }
    
    private BSTNode insert(BSTNode node, int value) {
        if (node == null) {
            size++;
            return new BSTNode(value);
        }
        if (value < node.value) {
            node.left = insert(node.left, value);
        } else if (value > node.value) {
            node.right = insert(node.right, value);
        }
        return node;
    }

Time complexity: O(h) where h is the height.

## Search

    public boolean contains(int value) {
        BSTNode cur = root;
        while (cur != null) {
            if (value == cur.value) return true;
            cur = value < cur.value ? cur.left : cur.right;
        }
        return false;
    }

Also O(h).

## Delete - The Hard Case

Three cases:

Case 1: Leaf node - just remove it.

Case 2: One child - replace node with its child.

Case 3: Two children - find the in-order successor (smallest value in right subtree), copy its value into this node, then delete the successor.

    private BSTNode delete(BSTNode node, int value) {
        if (node == null) return null;
        
        if (value < node.value) {
            node.left = delete(node.left, value);
        } else if (value > node.value) {
            node.right = delete(node.right, value);
        } else {
            if (node.left == null) return node.right;
            if (node.right == null) return node.left;
            
            BSTNode successor = findMin(node.right);
            node.value = successor.value;
            node.right = delete(node.right, successor.value);
        }
        return node;
    }
    
    private BSTNode findMin(BSTNode node) {
        while (node.left != null) node = node.left;
        return node;
    }

## In-Order Traversal

    public void inOrder(BSTNode node) {
        if (node == null) return;
        inOrder(node.left);
        System.out.println(node.value);
        inOrder(node.right);
    }

Visits nodes in sorted order. Time: O(n).

## The Imbalance Problem

Insert values in sorted order: 1, 2, 3, 4, 5, 6, 7.

    1
     \
      2
       \
        3
         \
          4

This tree has height n, not log n! Every operation is O(n) instead of O(log n). The tree has degenerated into a linked list.

Real-world data is often nearly sorted:
- Time series data
- User IDs
- Auto-incrementing keys
- Sorted file names

## BST vs Hash Table

Operation           | BST (balanced) | Hash Table
--------------------|----------------|------------
Insert              | O(log n)       | O(1) avg
Search              | O(log n)       | O(1) avg
Delete              | O(log n)       | O(1) avg
In-order traversal  | O(n)           | not possible
Min/Max             | O(log n)       | O(n)
Range query         | O(log n + k)   | O(n)

Use BSTs when you need ORDERED operations.
Use hash tables when you only need lookup.

## Key Takeaways

- BST gives O(log n) operations when balanced
- Delete has three cases; two-children is tricky
- In-order traversal produces sorted output
- Sorted insertion degenerates to O(n)
- Self-balancing variants fix this
$LEC$ where course_slug = 'data-structures' and number = 4;

update public.lectures set content = $LEC$
## Why Balance Matters

In the previous lecture, we saw that an unbalanced BST can degenerate to O(n). AVL trees were the first self-balancing BST, invented in 1962 by Adelson-Velsky and Landis.

The AVL invariant: for every node, the heights of the left and right subtrees differ by at most 1.

The balance factor: height(left) - height(right) is in {-1, 0, 1}.

## AVL Tree Height

Claim: an AVL tree with n nodes has height <= 1.44 log2(n).

Proof sketch: the minimum number of nodes in an AVL tree of height h follows the Fibonacci recurrence N(h) = N(h-1) + N(h-2) + 1. Solving gives N(h) ~ phi^h where phi = 1.618. So h ~ 1.44 log2(n).

## Rotations

To restore the AVL property after insert/delete, we use rotations - local restructuring operations that preserve the BST invariant.

Right Rotation:

          y                x
         / \              / \
        x   T3    ->     T1   y
       / \                  / \
      T1  T2              T2  T3

x becomes the parent, y becomes x's right child, and x's old right subtree T2 becomes y's new left subtree.

Left Rotation (mirror):

        x                  y
       / \                / \
      T1  y      ->       x   T3
         / \            / \
        T2  T3         T1  T2

## Insertion Algorithm

1. Insert as in a normal BST.
2. Walk back up the path, updating heights.
3. At each node, compute the balance factor.
4. If |balance| > 1, apply one of four rotation cases:

LL case (Left-Left): single right rotation
RR case (Right-Right): single left rotation
LR case (Left-Right): left rotation on left child, then right rotation
RL case (Right-Left): right rotation on right child, then left rotation

## Insert Example

Insert 30, 20, 10 in order:

Step 1:  30
Step 2:  30         (no rotation)
        /
       20

Step 3:  30         (balance factor at 30 is +2)
        /           -> Right rotate at 30
       20
       /
      10

Result:
       20
       / \
      10  30

## Delete Algorithm

Delete is trickier: after deleting a node, we may need to rebalance multiple levels up the tree. In the worst case, O(log n) rotations.

## AVL vs Red-Black

Both guarantee O(log n) height, but with different trade-offs:

Aspect              | AVL            | Red-Black
--------------------|----------------|------------
Height (worst)      | 1.44 log n     | 2 log n
Faster for...       | Lookups        | Inserts/Deletes
Implementation      | Simpler        | More complex
Rotation frequency  | More           | Fewer

AVL is better when reads dominate.
Red-Black is better when writes dominate.

Java's TreeMap and TreeSet use Red-Black trees.
C++'s std::map typically uses Red-Black.

## Real-World Uses

- Database indexes - B-trees (generalization)
- File systems - NTFS, ext4, HFS+ use B-trees
- Language standard libraries - std::map, TreeMap
- In-memory sorted sets - Redis sorted sets

## Key Takeaways

- AVL invariant: |height(L) - height(R)| <= 1
- Height is bounded by 1.44 log2(n)
- Rotations are O(1) and preserve the BST property
- Four rotation cases: LL, RR, LR, RL
- Insert/delete/search are all O(log n)
- Choose Red-Black over AVL when writes dominate
$LEC$ where course_slug = 'data-structures' and number = 5;

update public.lectures set content = $LEC$
## The Hashing Idea

A hash table stores key-value pairs and provides O(1) average-case insert, search, and delete. The idea: use a hash function to map keys to array indices.

    hash("apple")  -> 42
    hash("banana") -> 17
    hash("cherry") -> 42   // collision with apple!

## Hash Functions

A good hash function should:
1. Be deterministic (same key -> same hash)
2. Be fast to compute
3. Distribute keys uniformly
4. Minimize collisions

Java's hashCode():

    Integer.hashCode(42)             // 42
    "hello".hashCode()               // 99162322
    Arrays.hashCode(new int[]{1,2})  // 994

For custom classes:

    @Override
    public int hashCode() {
        int result = 17;
        result = 31 * result + name.hashCode();
        result = 31 * result + age;
        return result;
    }

Why 31? It's a prime, and 31 * x can be optimized to (x << 5) - x.

## Collision Resolution Strategy 1: Chaining

Each array slot holds a linked list of entries with the same hash.

    class ChainHashTable {
        private Node[] buckets;
        private int size;
        private int capacity;
        
        private static class Node {
            Object key, value;
            Node next;
        }
        
        public void put(Object key, Object value) {
            int idx = Math.floorMod(key.hashCode(), capacity);
            for (Node n = buckets[idx]; n != null; n = n.next) {
                if (n.key.equals(key)) {
                    n.value = value;
                    return;
                }
            }
            Node newNode = new Node();
            newNode.key = key;
            newNode.value = value;
            newNode.next = buckets[idx];
            buckets[idx] = newNode;
            size++;
            
            if ((double) size / capacity > 0.75) resize();
        }
        
        public Object get(Object key) {
            int idx = Math.floorMod(key.hashCode(), capacity);
            for (Node n = buckets[idx]; n != null; n = n.next) {
                if (n.key.equals(key)) return n.value;
            }
            return null;
        }
        
        private void resize() {
            Node[] old = buckets;
            capacity *= 2;
            buckets = new Node[capacity];
            size = 0;
            for (Node head : old) {
                for (Node n = head; n != null; n = n.next) {
                    put(n.key, n.value);
                }
            }
        }
    }

## Strategy 2: Open Addressing

No linked lists. On collision, probe for the next empty slot.

Linear probing: try idx+1, idx+2, idx+3...
Quadratic probing: try idx+1^2, idx+2^2, idx+3^2...
Double hashing: use a second hash function

Linear probing is fastest due to cache locality but suffers from clustering (runs of occupied slots).

## Load Factor

The load factor is size / capacity. Java's HashMap resizes when it exceeds 0.75.

- Too low (< 0.5): wastes memory
- Too high (> 0.9): many collisions, slow
- Sweet spot: 0.7 - 0.75

## Why O(1) Average?

Assume simple uniform hashing (each key equally likely to hash to any slot). The expected length of a chain is n/m = load factor alpha.

With alpha = 0.75, expected search time is O(1 + alpha) = O(1).

## Worst-Case O(n)

If all keys hash to the same bucket, the table becomes a linked list: O(n). Adversaries can craft keys that all collide (hash flooding attack).

Java 8+ mitigates this by converting long chains into red-black trees, giving O(log n) worst case.

## Real-World Applications

- Databases: hash indexes for equality queries
- Compilers: symbol tables
- Caches: memcached, Redis
- Deduplication: finding duplicate files
- Set membership: Bloom filters
- Cryptographic hashing: SHA-256, bcrypt

## Hash Tables in Java

    Map<String, Integer> map = new HashMap<>();
    map.put("apple", 42);
    map.put("banana", 17);
    int x = map.get("apple");     // 42
    
    Set<String> set = new HashSet<>();
    set.add("hello");
    boolean has = set.contains("hello");  // true

## Key Takeaways

- Hash tables give O(1) average performance
- Hash functions must be deterministic and uniform
- Collisions handled by chaining or open addressing
- Load factor around 0.75 is optimal
- Worst case is O(n) but rarely hit
- Java 8+ uses Red-Black trees for long chains
$LEC$ where course_slug = 'data-structures' and number = 6;

update public.lectures set content = $LEC$
## What is a Heap?

A binary heap is a complete binary tree that satisfies the heap property:
- Min-heap: every parent is <= its children
- Max-heap: every parent is >= its children

A complete binary tree has all levels full except possibly the last, which is filled left-to-right.

Because it's complete, we can store it in an array without pointers:

            10
           /  \
          20   30
         / \   /
        40 50 60

    Array: [10, 20, 30, 40, 50, 60]

For a node at index i:
- Left child: 2i + 1
- Right child: 2i + 2
- Parent: (i - 1) / 2

## Insert (bubble up)

1. Add the new element at the end
2. While it's smaller than its parent, swap
3. Continue until the heap property is restored

    public void insert(int value) {
        data[size] = value;
        int i = size++;
        while (i > 0) {
            int parent = (i - 1) / 2;
            if (data[parent] <= data[i]) break;
            swap(i, parent);
            i = parent;
        }
    }

Time: O(log n).

## Extract Min (bubble down)

1. Save the root value
2. Move the last element to the root
3. Bubble it down until it's smaller than both children
4. Decrease size

    public int extractMin() {
        int min = data[0];
        data[0] = data[--size];
        int i = 0;
        while (true) {
            int left = 2 * i + 1;
            int right = 2 * i + 2;
            int smallest = i;
            if (left < size && data[left] < data[smallest]) smallest = left;
            if (right < size && data[right] < data[smallest]) smallest = right;
            if (smallest == i) break;
            swap(i, smallest);
            i = smallest;
        }
        return min;
    }

Time: O(log n).

## Peek Min

    public int peekMin() { return data[0]; }

Time: O(1).

## Heapify (build from array in O(n))

Given an arbitrary array, we can build a heap in O(n) by bubbling down from the middle to the start:

    public static void heapify(int[] arr) {
        for (int i = arr.length / 2 - 1; i >= 0; i--) {
            bubbleDown(arr, i);
        }
    }

Why O(n) and not O(n log n)? Because most nodes are leaves and don't need to sink.

## Heapsort

1. Build a max-heap from the array (O(n))
2. Repeatedly swap root with last, shrink, bubble down (O(n log n))

    public static void heapSort(int[] arr) {
        int n = arr.length;
        for (int i = n / 2 - 1; i >= 0; i--) bubbleDown(arr, i, n);
        for (int i = n - 1; i > 0; i--) {
            int temp = arr[0];
            arr[0] = arr[i];
            arr[i] = temp;
            bubbleDown(arr, 0, i);
        }
    }

O(n log n) worst case, O(1) extra space.

## Priority Queue

Task scheduling, Dijkstra's algorithm, A* search, Huffman coding.

    PriorityQueue<Integer> pq = new PriorityQueue<>();
    pq.add(5); pq.add(1); pq.add(3);
    pq.poll();  // returns 1
    pq.peek();  // returns 3

## Dijkstra's Algorithm Using a Heap

    int[] dijkstra(Graph g, int start) {
        int[] dist = new int[g.n];
        Arrays.fill(dist, Integer.MAX_VALUE);
        dist[start] = 0;
        
        PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]);
        pq.add(new int[]{start, 0});
        
        while (!pq.isEmpty()) {
            int[] cur = pq.poll();
            if (cur[1] > dist[cur[0]]) continue;
            
            for (Edge e : g.edges[cur[0]]) {
                int nd = cur[1] + e.weight;
                if (nd < dist[e.to]) {
                    dist[e.to] = nd;
                    pq.add(new int[]{e.to, nd});
                }
            }
        }
        return dist;
    }

## Heap vs Sorted Array

Operation    | Heap       | Sorted Array
-------------|------------|--------------
Insert       | O(log n)   | O(n)
Extract min  | O(log n)   | O(1)
Peek min     | O(1)       | O(1)
Build        | O(n)       | O(n log n)

Heaps win when you have a mix of insert and extract.

## Key Takeaways

- Heap = complete binary tree with heap property
- Stored as array - no pointers needed
- Insert/extract = O(log n)
- Peek = O(1)
- Heapify in O(n)
- Powers priority queues, heapsort, Dijkstra
$LEC$ where course_slug = 'data-structures' and number = 7;

update public.lectures set content = $LEC$
## Graph Representations

A graph G = (V, E) consists of vertices V and edges E. Two standard representations:

## Adjacency Matrix

A 2D array adj[i][j] = weight if there's an edge from i to j.

          0  1  2  3
    0 [   0  1  1  0 ]
    1 [   1  0  0  1 ]
    2 [   1  0  0  1 ]
    3 [   0  1  1  0 ]

Pros: O(1) edge lookup, simple
Cons: O(V^2) space (bad for sparse graphs)

## Adjacency List

Array of lists: adj[i] = list of neighbors of i.

    List<Integer>[] adj = new List[n];
    for (int i = 0; i < n; i++) adj[i] = new ArrayList<>();
    adj[0].add(1); adj[0].add(2);
    adj[1].add(0); adj[1].add(3);

Pros: O(V + E) space
Cons: Edge lookup is O(degree)

For most applications, use adjacency lists.

## Breadth-First Search (BFS)

BFS explores level by level - all neighbors of start, then all neighbors of those, etc.

    void bfs(Graph g, int start) {
        boolean[] visited = new boolean[g.n];
        Queue<Integer> q = new LinkedList<>();
        
        q.add(start);
        visited[start] = true;
        
        while (!q.isEmpty()) {
            int u = q.poll();
            System.out.println(u);
            
            for (int v : g.adj[u]) {
                if (!visited[v]) {
                    visited[v] = true;
                    q.add(v);
                }
            }
        }
    }

Time: O(V + E), Space: O(V)

## BFS Finds Shortest Paths in Unweighted Graphs

Track parents during BFS:

    int[] bfs(int start, int goal) {
        int[] parent = new int[g.n];
        Arrays.fill(parent, -1);
        parent[start] = start;
        
        Queue<Integer> q = new LinkedList<>();
        q.add(start);
        
        while (!q.isEmpty()) {
            int u = q.poll();
            if (u == goal) break;
            for (int v : g.adj[u]) {
                if (parent[v] == -1) {
                    parent[v] = u;
                    q.add(v);
                }
            }
        }
        
        if (parent[goal] == -1) return null;
        List<Integer> path = new ArrayList<>();
        for (int cur = goal; cur != start; cur = parent[cur]) {
            path.add(cur);
        }
        path.add(start);
        Collections.reverse(path);
        return path.stream().mapToInt(i -> i).toArray();
    }

## Depth-First Search (DFS)

DFS goes as deep as possible before backtracking.

Recursive:

    void dfs(Graph g, int u, boolean[] visited) {
        visited[u] = true;
        System.out.println(u);
        for (int v : g.adj[u]) {
            if (!visited[v]) dfs(g, v, visited);
        }
    }

Iterative (with explicit stack):

    void dfsIter(Graph g, int start) {
        boolean[] visited = new boolean[g.n];
        Stack<Integer> stack = new Stack<>();
        stack.push(start);
        
        while (!stack.isEmpty()) {
            int u = stack.pop();
            if (visited[u]) continue;
            visited[u] = true;
            System.out.println(u);
            for (int v : g.adj[u]) {
                if (!visited[v]) stack.push(v);
            }
        }
    }

Time: O(V + E)

## Connected Components

    int countComponents(Graph g) {
        boolean[] visited = new boolean[g.n];
        int count = 0;
        for (int u = 0; u < g.n; u++) {
            if (!visited[u]) {
                dfs(g, u, visited);
                count++;
            }
        }
        return count;
    }

## Cycle Detection

Undirected: DFS with parent tracking

    boolean hasCycle(Graph g, int u, int parent, boolean[] visited) {
        visited[u] = true;
        for (int v : g.adj[u]) {
            if (!visited[v]) {
                if (hasCycle(g, v, u, visited)) return true;
            } else if (v != parent) {
                return true;
            }
        }
        return false;
    }

Directed: DFS with three colors (white/gray/black). Cycle exists if we see a gray node.

## Topological Sort

For a DAG (directed acyclic graph), produce a linear ordering where every edge goes from earlier to later.

Kahn's algorithm (BFS-based):

    List<Integer> topologicalSort(Graph g) {
        int[] inDegree = new int[g.n];
        for (int u = 0; u < g.n; u++) {
            for (int v : g.adj[u]) inDegree[v]++;
        }
        
        Queue<Integer> q = new LinkedList<>();
        for (int i = 0; i < g.n; i++) if (inDegree[i] == 0) q.add(i);
        
        List<Integer> order = new ArrayList<>();
        while (!q.isEmpty()) {
            int u = q.poll();
            order.add(u);
            for (int v : g.adj[u]) {
                if (--inDegree[v] == 0) q.add(v);
            }
        }
        
        if (order.size() != g.n) throw new RuntimeException("Cycle detected");
        return order;
    }

Applications: build systems (Make), course prerequisites, package managers (npm, pip).

## Key Takeaways

- Adjacency list: O(V+E) space, most common
- BFS uses a queue - finds shortest paths in unweighted graphs
- DFS uses a stack - natural for cycles, topological sort
- Both O(V+E) time
- Topological sort orders DAGs; fails if cycle exists
$LEC$ where course_slug = 'data-structures' and number = 8;

-- ============================================================
-- CIRCLES I (MIT 6.002) - Lecture 1
-- ============================================================
update public.lectures set content = $LEC$
## The Lumped Element Abstraction

In real circuits, signals propagate at the speed of light. Every wire is an antenna, every component has parasitic capacitance, and Maxwell's equations describe reality precisely - but they are incredibly hard to solve.

The lumped element abstraction lets us ignore most of this. We model a circuit as a network of ideal components (R, L, C, V-source, I-source) connected by ideal wires. The abstraction is valid when the circuit's physical size is much smaller than the wavelength of the signals.

## When Does the Abstraction Break Down?

Rule of thumb: the lumped model is valid when the propagation delay through the circuit is much smaller than the signal's rise time:

    t_propagation << t_rise

Where:
- t_propagation = L / v (L = length, v ~ 2x10^8 m/s for PCB traces)
- t_rise = rise time of the fastest signal

Example: A 10 cm PCB trace with a 1 ns rise time:
- t_prop = 0.1 / (2x10^8) = 0.5 ns
- 0.5 ns vs 1 ns: the abstraction is marginal
- Rule of thumb: need t_prop < t_rise / 10, so 0.5 ns < 0.1 ns fails

At 100 MHz+ or with fast digital signals, you must think about transmission lines.

## Ideal Circuit Elements

Resistor (R): V = I * R (Ohm's law). Unit: ohm.
- Power: P = V*I = I^2*R = V^2/R
- Dissipates energy as heat

Capacitor (C): I = C * dV/dt. Unit: farad.
- Stores energy in electric field: E = 0.5 * C * V^2
- Blocks DC, passes AC

Inductor (L): V = L * dI/dt. Unit: henry.
- Stores energy in magnetic field: E = 0.5 * L * I^2
- Passes DC, blocks AC

Voltage source: provides V regardless of current drawn.
Current source: provides I regardless of voltage across it.

## Kirchhoff's Laws

Kirchhoff's Current Law (KCL): The sum of currents entering any node equals the sum leaving.

    Sum I_in = Sum I_out

Kirchhoff's Voltage Law (KVL): The sum of voltage drops around any closed loop is zero.

    Sum V_loop = 0

## Series and Parallel Resistors

Series: R_eq = R1 + R2 + ... + Rn

    --[R1]--[R2]--[R3]--    equivalent to    --[R_eq]--

Parallel: 1/R_eq = 1/R1 + 1/R2 + ... + 1/Rn

For two: R_eq = (R1 * R2) / (R1 + R2)

        +--[R1]--+
    ----+         +----    equivalent to    --[R_eq]--
        +--[R2]--+

## Voltage Divider

          R1
    Vin --/\/\/\--+-- Vout
                  |
                  R2
                  |
                 GND

    Vout = Vin * R2 / (R1 + R2)

This is the most common circuit in all of electronics. Use it to:
- Scale a sensor output to a safe ADC range
- Set a reference voltage
- Bias a transistor

Current draw: I = Vin / (R1 + R2). Make R1+R2 large enough to avoid wasting power, but small enough to avoid loading effects.

## Example Problem

Question: Design a voltage divider to produce 3.3 V from a 5 V source, with total current draw under 1 mA.

Solution:
- Need R2 / (R1 + R2) = 3.3 / 5 = 0.66
- Total R >= 5 V / 1 mA = 5 kohm
- Pick R1 = 1.7 kohm, R2 = 3.3 kohm
- Verify: 5 * 3.3 / (1.7 + 3.3) = 5 * 3.3 / 5 = 3.3 V correct
- Current: 5 V / 5 kohm = 1 mA correct

## Power in Circuits

Every element has a power rating. Exceed it and it smokes.

- Resistor: typical 0.25 W, 0.5 W
- Small LED: 20 mA, V_f ~ 2 V, P = 40 mW
- ESP32 GPIO pin: 20 mA max, 3.3 V, P = 66 mW

Use P = I^2*R or P = V^2/R to check before connecting.

## Why This Matters

The lumped model is the foundation of all circuit analysis. Every SPICE simulator uses it. Every schematic capture tool assumes it. Without it, we'd have to solve Maxwell's equations for every LED blinker - which would take hours instead of milliseconds.

The abstraction lets us reason about circuits using algebra, not calculus. It's one of the most successful engineering abstractions ever devised.

## Key Takeaways

- Lumped model valid when t_prop << t_rise
- KCL: currents in = currents out at every node
- KVL: voltages around any loop sum to zero
- Series: R adds; Parallel: 1/R adds
- Voltage divider: Vout = Vin * R2/(R1+R2)
- Check power ratings BEFORE connecting
$LEC$ where course_slug = 'circuits-i' and number = 1;

-- ============================================================
-- PROGRAMMING IN C (Stanford CS107) - Lecture 1
-- ============================================================
update public.lectures set content = $LEC$
## Why Learn C in 2026?

C is over 50 years old, yet it powers:
- Operating systems - Linux, Windows kernel, macOS core
- Embedded systems - from ESP32 to satellites
- Databases - PostgreSQL, SQLite, Redis
- Compilers - CPython, the JVM itself
- Everything under Python, Ruby, Node.js

Learning C teaches you how memory actually works. Once you understand pointers, you understand why Python is slow, why garbage collection exists, and why Rust was invented.

## Hello, World - But Let's Understand What Happens

    #include <stdio.h>
    
    int main(void) {
        printf("Hello, World!\n");
        return 0;
    }

Compile and run:

    gcc -o hello hello.c
    ./hello

But what actually happens?

## The Compilation Pipeline

C compilation has four stages:

### 1. Preprocessing

    gcc -E hello.c

Expands:
- #include <stdio.h> inserts the entire stdio.h header (thousands of lines)
- #define PI 3.14 text replacement
- #ifdef DEBUG ... #endif conditional compilation

Output: a single .i file with no more # directives.

### 2. Compilation

    gcc -S hello.i

Translates C to assembly (.s file). Example for int x = a + b:

    movl  -4(%rbp), %eax     # load a
    movl  -8(%rbp), %edx     # load b
    addl  %edx, %eax         # a + b
    movl  %eax, -12(%rbp)    # store to x

This is where the compiler optimizes.

### 3. Assembly

    gcc -c hello.s

Assembles to machine code, producing hello.o (object file).

### 4. Linking

    gcc -o hello hello.o

Links your object file with:
- C runtime library (libc.so)
- Your other object files
- Any libraries you link against (-lm for math)

Output: hello executable.

## Types in C

C has a small set of primitive types:

Type      | Typical size | Range
----------|--------------|-------
char      | 1 byte       | -128 to 127
short     | 2 bytes      | -32,768 to 32,767
int       | 4 bytes      | +/- 2.1 billion
long      | 8 bytes      | +/- 9.2 quintillion
float     | 4 bytes      | ~7 digits precision
double    | 8 bytes      | ~15 digits precision
void*     | 8 bytes      | any pointer

Use stdint.h for exact sizes:

    #include <stdint.h>
    int32_t x = 42;    // exactly 32 bits, guaranteed
    uint8_t y = 255;   // exactly 8 bits, unsigned

## Variables and Memory

Every variable lives at a memory address:

    int a = 10;
    int b = 20;
    int c = a + b;

In memory:

    Address       Value   Name
    0x7ffe1000    10      a
    0x7ffe1004    20      b
    0x7ffe1008    30      c

The & operator gives the address:

    printf("%p\n", (void*)&a);   // prints 0x7ffe1000

The * operator dereferences a pointer:

    int *p = &a;                 // p points to a
    printf("%d\n", *p);          // prints 10
    *p = 42;                     // changes a to 42

## Functions and the Call Stack

    int add(int x, int y) {
        return x + y;
    }
    
    int main(void) {
        int result = add(3, 4);
        printf("%d\n", result);
        return 0;
    }

When main calls add:
1. The caller pushes arguments onto the stack
2. A new stack frame is created for add with room for locals
3. add runs, places result in a register
4. add returns, stack frame is destroyed

The stack grows downward on most architectures (x86, ARM).

## Common Beginner Mistakes

1. Forgetting & when calling scanf:

    int x;
    scanf("%d", &x);   // correct
    scanf("%d", x);    // WRONG - segfault

2. Using = instead of ==:

    if (x = 5) { ... }    // always true; assigns 5 to x
    if (x == 5) { ... }   // correct

3. Buffer overflow:

    char buf[10];
    strcpy(buf, "Hello, World!");  // overflow! 14 bytes into 10-byte buffer

4. Uninitialized variables:

    int x;
    printf("%d\n", x);   // undefined value

5. Dangling pointers:

    int *p = malloc(sizeof(int));
    free(p);
    *p = 5;   // undefined behavior

## Debugging with GDB

    gcc -g -o hello hello.c   # -g adds debug symbols
    gdb ./hello

Inside GDB:
- break main - set breakpoint
- run - start program
- next - step over
- step - step into
- print x - print variable
- bt - backtrace

## Valgrind for Memory Bugs

    valgrind --leak-check=full ./hello

Detects:
- Memory leaks
- Use of uninitialized values
- Buffer overflows
- Invalid frees

## Key Takeaways

- C compilation = preprocess -> compile -> assemble -> link
- Types have fixed sizes; use stdint.h for portability
- Every variable has an address; pointers store addresses
- Stack grows downward; each function call creates a frame
- The 5 most common bugs: missing &, = vs ==, overflow, uninit, dangling
- Always use -Wall -Wextra and Valgrind
$LEC$ where course_slug = 'programming-c' and number = 1;

-- Verify
select course_slug, number, length(content) as length
from public.lectures
where course_slug in ('data-structures', 'circuits-i', 'programming-c')
order by course_slug, number;