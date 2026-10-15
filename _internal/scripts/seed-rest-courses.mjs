import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const L = (overview, ideas, example, pitfalls, why) =>
`## Overview

${overview}

## Key ideas

${ideas}

## Worked example

${example}

## Common pitfalls

${pitfalls}

## Why it matters

${why}`;

const courses = {
'mit-6-0002-computational-thinking': [
  ['Optimisation and the Knapsack Problem','The knapsack problem asks you to choose items to maximise value under a weight limit. It appears in budgeting, cargo loading, and resource allocation.','- Greedy approach: pick the best value/weight ratio first.\n- Brute-force: try all subsets.\n- Dynamic programming: pseudo-polynomial, exact.','Greedy fails: capacity 10, items (6,6),(5,5),(5,5). Greedy picks 6/6; optimal picks two 5/5.','- Assuming greedy is optimal.\n- Ignoring the weight budget.','Not every problem has a fast exact solution.'],
  ['Graph Problems and Search','Graphs model networks, dependencies, and state spaces.','- BFS explores by levels.\n- DFS goes deep first.\n- Both run in O(V+E).','Course prerequisite chains form a DAG. Topological sort gives a valid study order.','- Using DFS when shortest paths are needed.','Traversal is the foundation of routing and scheduling.'],
  ['Stochastic Thinking','Real data is noisy. Probability gives us a language for uncertainty.','- Random variables, distributions.\n- Independence vs dependence.\n- Law of large numbers.','Roll two dice 10,000 times. Average sum is ~7. Error scales as 1/sqrt(N).','- Confusing correlation with causation.','Every later topic rests on probability.'],
  ['Random Walks and Monte Carlo','A random walk is a path of random steps. Monte Carlo estimates quantities by sampling.','- Simulate many walks.\n- Error ~ 1/sqrt(N).\n- Used in physics and finance.','Estimate pi: N random points, pi ~ 4*(inside/total).','- Too few samples gives high variance.','Complex integrals can be estimated by simulation.'],
  ['Probability Distributions and Inference','Distributions describe how likely each outcome is.','- Discrete: Bernoulli, binomial, Poisson.\n- Continuous: uniform, normal.\n- Maximum likelihood.','8 heads in 10 flips gives MLE p=0.8.','- Assuming normality without checking.','Inference is how we learn from data.'],
  ['Linear Regression','The simplest predictive model: fit a line to data.','- Minimise squared error.\n- Normal equations.\n- Regularisation prevents overfitting.','Slope = cov(x,y)/var(x). Intercept = mean(y) - slope*mean(x).','- Extrapolating beyond range.','Regression is the entry to supervised learning.'],
  ['Classification and Logistic Regression','When target is a category, regression is not enough.','- Sigmoid squashes output to (0,1).\n- Linear decision boundary.\n- Log-loss minimisation.','Predict spam from word counts.','- Thresholding at 0.5 on imbalanced data.','Classification is the workhorse of practical ML.'],
  ['Clustering','Unsupervised learning: group data without labels.','- k-means alternates assign/recompute.\n- Hierarchical builds a merge tree.\n- Silhouette evaluation.','Cluster customers by purchase history with k=5.','- Assuming spherical clusters.','Clustering reveals hidden structure.'],
  ['Model Selection and Cross-Validation','A model fitting training data perfectly may be useless on new data.','- Split: train/validation/test.\n- k-fold cross-validation.\n- Occams razor.','Train 80%, tune 10%, test 10% with 5 splits.','- Tuning on test set.','Reliable evaluation separates a model from a guess.'],
  ['Bias, Fairness, and the Limits of Models','Data-driven systems can amplify social biases.','- Bias enters at collection, labelling, modelling, deployment.\n- Multiple fairness definitions.\n- Model cards.','A hiring model trained on historical data may reproduce past discrimination.','- Assuming math is neutral.','A model is not neutral because it is mathematical.'],
],
'mit-6-002-circuits-electronics': [
  ['Lumped Abstraction and KVL/KCL','Lumped-element abstraction treats each component as a two-terminal black box.','- KVL: voltages around a loop sum to zero.\n- KCL: currents into a node sum to zero.\n- Plus V-I relations, solves any linear circuit.','Series loop with 9V source and two resistors: V1 + V2 = 9.','- Forgetting KVL needs a closed loop.','When circuit size approaches signal wavelength, you need Maxwell.'],
  ['Resistive Networks and Node Analysis','Resistors obey Ohm law. Node analysis is systematic.','- Choose ground.\n- Write KCL at every node.\n- Solve linear system.','Two unknown nodes, three resistors, one source gives two equations.','- Missing currents at a node.','With N nodes, you always get N-1 equations.'],
  ['Superposition and Thevenin/Norton','Two powerful simplifications for linear circuits.','- Superposition: sum of single-source responses.\n- Thevenin: Vth in series with Rth.\n- Norton: current source in parallel with R.','Rth = Voc/Isc. Then any load sees a simple two-element source.','- Applying to nonlinear circuits.','Reduces a complex circuit to two numbers.'],
  ['Capacitors and Inductors','Two components that store energy.','- Capacitor: i = C dV/dt.\n- Inductor: v = L di/dt.\n- Energy: 0.5 C V^2, 0.5 L I^2.','1 uF at 5V holds 12.5 uJ.','- Forgetting discontinuity constraints.','These are the memory elements of analog design.'],
  ['First-Order Transients','RC and RL circuits respond with an exponential curve.','- tau = RC or L/R.\n- After 1 tau, ~63% done.\n- After 5 tau, settled.','10 kohm and 1 uF: tau = 10 ms. A 5V step reaches 3.16V after 10 ms.','- Wrong sign in the exponential.','The time constant is the fundamental timescale.'],
  ['Second-Order Transients','RLC circuits are second-order.','- omega_0 = 1/sqrt(LC).\n- zeta determines damping.\n- Underdamped: oscillations with decay.','L=1mH, C=1uF: omega_0 ~ 31,623 rad/s.','- Ignoring R controls damping.','Second-order behaviour is everywhere.'],
  ['Operational Amplifiers','High-gain differential amplifier with feedback.','- Ideal: infinite gain, infinite input Z, zero output Z.\n- Virtual short with feedback.\n- Inverting, non-inverting, summing.','Non-inverting gain 5: Rf/R1 = 4.','- Forgetting feedback.','Op-amps are the workhorse of analog design.'],
  ['MOSFETs and Digital Logic','The MOSFET is a voltage-controlled switch.','- Digital: on or off.\n- CMOS inverter: one PMOS, one NMOS.\n- NAND/NOR are the building blocks.','CMOS inverter with input 0 outputs VDD.','- Assuming perfect switches.','Every processor is billions of MOSFETs.'],
],
'mit-6-004-computation-structures': [
  ['From Electrons to Logic Gates','Bridge analog to digital design.','- MOSFETs as switches; CMOS as logic.\n- Digital signal is a voltage range.\n- Noise margins make it reliable.','3.3V logic high might be 2.4-3.3V. Above 2.0V is 1.','- Assuming exact voltages.','Ladder: transistors -> gates -> modules -> processor.'],
  ['Combinational Logic and Boolean Algebra','Boole algebra is the math of digital logic.','- AND, OR, NOT, XOR, NAND, NOR.\n- Truth tables.\n- Karnaugh maps.','Simplify A_NOT_B + A_B_NOT + AB to A + B.','- Ignoring dont-cares.','Fewer gates is not always faster.'],
  ['Sequential Logic and Flip-Flops','Storage requires feedback.','- Latch: level-sensitive.\n- Flip-flop: edge-triggered.\n- Setup and hold times.','D flip-flop stores one bit on rising edge.','- Ignoring setup/hold violations.','Synchronous design makes timing tractable.'],
  ['Finite State Machines','States, inputs, transitions, outputs.','- Moore: output = f(state).\n- Mealy: output = f(state, input).\n- Any FSM can be built from flip-flops and gates.','Traffic light states red/yellow/green with timer transitions.','- Missing transitions.','Traffic lights, protocols, and CPU control units.'],
  ['Instruction Set Architectures','The ISA is the contract between hardware and software.','- Registers, memory, PC.\n- RISC vs CISC.\n- Beta ISA is a clean RISC for teaching.','To add two numbers: load, add, store.','- Assuming complex ISAs are faster.','Compilers target an ISA; OSes save and restore its state.'],
  ['Pipelining','Execute instructions in parallel by overlapping stages.','- Five stages: fetch, decode, execute, memory, write-back.\n- Hazards: data, control, structural.\n- Forwarding handles most.','Ideal CPI = 1.','- Forgetting pipeline fill/drain.','Ideal speedup 5x, real workloads 3-4x.'],
  ['Caches and Memory Hierarchy','CPU speed grows faster than memory speed.','- Temporal and spatial locality.\n- Direct-mapped, set-associative, fully associative.\n- Write-through vs write-back.','Good locality runs several times faster on identical hardware.','- Ignoring cache-line effects.','Programming for locality is highest-leverage.'],
  ['Virtual Memory','Private, contiguous address space per process.','- Pages, page tables, TLB.\n- Page faults load from disk.\n- Protection falls out of translation.','Two processes both use virtual 0x1000, mapped differently.','- Forgetting TLB is a cache.','On 64-bit, VM is more about protection.'],
],
'mit-6-006-intro-algorithms': [
  ['Algorithmic Thinking and Peak Finding','An algorithm transforms input to output.','- 1-D: linear scan O(n) vs binary search O(log n).\n- 2-D: extend to a grid.','For [1,3,5,2,4,0], 5 is a peak.','- Assuming binary search works on unsorted data.','Divide and conquer beats linear scan.'],
  ['Models of Computation and Document Distance','Word RAM treats each operation as O(1).','- Document = vector of word frequencies.\n- Distance = angle between vectors.\n- Naive O(n^2) vs dictionary O(n).','Two 1000-word docs: naive = 1M comparisons; hash = 2000.','- Ignoring data structure cost.','Choosing the right structure is the biggest win.'],
  ['Sorting: Insertion, Merge, Heap','Three classic comparison sorts.','- Insertion: O(n^2).\n- Merge: O(n log n), stable.\n- Heap: O(n log n) in place.','1M integers: insertion takes hours, merge takes seconds.','- Using insertion on large arrays.','Any comparison sort is Omega(n log n).'],
  ['Hashing with Chaining and Open Addressing','Hash tables provide average O(1) lookup.','- Chaining: linked lists.\n- Open addressing: probing.\n- Good hash spreads uniformly.','1000 keys in table of 1013 gives average chain 1.','- Ignoring load factor.','Worst case O(n); randomised hashing mitigates.'],
  ['Binary Search Trees and AVL','BST stores keys so in-order traversal is sorted.','- Insert/search/delete: O(h).\n- Degenerate trees: h = n.\n- AVL maintains h = O(log n).','Inserting sorted keys gives a linked list. AVL rebalances.','- Forgetting to update heights.','A balanced tree turns a list into a fast dictionary.'],
  ['Graph Search: BFS and DFS','Graphs model networks, dependencies, state spaces.','- BFS: levels, shortest unweighted paths.\n- DFS: deep first, cycles.\n- Both O(V+E).','Friendship graph: BFS finds degrees of separation.','- Using DFS for shortest paths.','Traversal underlies routing and scheduling.'],
  ['Shortest Paths: Dijkstra and Bellman-Ford','Cheapest path from a source to every vertex.','- Dijkstra: non-negative, O((V+E)logV).\n- Bellman-Ford: negative, O(VE).','GPS routing: cities as vertices, roads as edges.','- Using Dijkstra with negative edges.','Shortest paths underlie routing and network analysis.'],
  ['Dynamic Programming','Overlapping subproblems and optimal substructure.','- Break into subproblems.\n- Store answers.\n- Build up to final.','LCS of "ABCBDAB" and "BDCABA" is 4.','- Defining subproblem incorrectly.','DP solves problems that look exponential.'],
],
'mit-6-034-artificial-intelligence': [
  ['Introduction to AI and Search','Symbolic reasoning and search.','- Uninformed: BFS, DFS.\n- Informed: greedy, A*.\n- Admissibility guarantees A* optimality.','Map with straight-line heuristic: A* expands fewer nodes than BFS.','- Using inadmissible heuristic with A*.','Search is the foundation of planning and optimisation.'],
  ['Games: Minimax and Alpha-Beta','Two-player deterministic games.','- Model as game tree.\n- Minimax assumes optimal play.\n- Alpha-beta prunes branches.','Tic-tac-toe minimax: 255,168 nodes; alpha-beta halves.','- Forgetting terminal states.','Real engines add evaluation and deepening.'],
  ['Constraint Satisfaction','Assign values to variables subject to constraints.','- Backtracking with propagation.\n- Forward checking.\n- Arc consistency.','Sudoku: 27 constraints. Propagation solves many puzzles.','- Ignoring propagation power.','Propagation removes whole subtrees.'],
  ['Knowledge Representation and Inference','Telling a machine what we know.','- Propositional and first-order logic.\n- Forward and backward chaining.\n- Resolution.','"All humans are mortal" + "Socrates is human" -> mortal.','- Ignoring computational cost.','Real systems combine rules with search.'],
  ['Bayesian Networks and HMMs','Graphical models for probability.','- DAG encodes conditional independence.\n- Inference is NP-hard generally.\n- HMM: latent state chain.','Medical diagnosis: symptoms -> diseases.','- Ignoring arc direction.','HMMs powered speech recognition for decades.'],
  ['Machine Learning: Decision Trees and Nearest Neighbours','Two foundational supervised learners.','- Trees: split on best feature.\n- k-NN: majority vote of neighbours.\n- Trees: low bias high variance.','Classify iris from petal length.','- Growing trees until pure.','Understanding bias/variance is key.'],
  ['Neural Networks and Deep Learning','From perceptron to multi-layer networks.','- Perceptron: weighted sum + activation.\n- Stacking gives universal approximator.\n- Backprop via chain rule.','2-layer network approximates XOR.','- Linear activation in hidden layers.','ReLU, dropout, batch norm, Adam made it practical.'],
  ['Natural Language Processing','Language is sequential and ambiguous.','- Tokenisation, stemming, POS.\n- Constituency and dependency parsing.\n- Embeddings and transformers.','Sentiment: "not bad" positive, "not good" negative.','- Ignoring context window.','Pre-trained LMs dominate NLP benchmarks.'],
],
};

async function seedCourse(slug, lectures) {
  console.log('\n=== ' + slug + ' ===');
  const { error: delErr } = await supabase.from('lectures').delete().eq('course_slug', slug);
  if (delErr) { console.warn('  delete failed: ' + delErr.message); return; }

  let n = 1;
  for (const [title, overview, ideas, example, pitfalls, why] of lectures) {
    const body = L(overview, ideas, example, pitfalls, why);
    const minutes = Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));
    const { error } = await supabase.from('lectures').insert({
      course_slug: slug, number: n, title, content: body, duration_minutes: minutes
    });
    if (error) console.warn('  x ' + n + '. ' + title + ' - ' + error.message);
    else console.log('  v ' + n + '. ' + title + ' (' + minutes + ' min)');
    n++;
  }
}

async function fixDurations() {
  console.log('\n=== Fixing course duration_hours ===');
  const { data: courses } = await supabase.from('courses').select('id,slug,code');
  for (const c of courses) {
    const { data: lec } = await supabase.from('lectures').select('duration_minutes').eq('course_slug', c.slug);
    const totalMin = (lec || []).reduce((s, l) => s + (l.duration_minutes || 0), 0);
    const hours = Math.max(1, Math.round(totalMin / 60));
    await supabase.from('courses').update({ duration_hours: hours }).eq('id', c.id);
    console.log('  ' + c.code + ' -> ' + hours + 'h (' + totalMin + ' min)');
  }
}

async function main() {
  for (const [slug, lectures] of Object.entries(courses)) await seedCourse(slug, lectures);
  await fixDurations();
  console.log('\nDone.');
}
main().catch(e => { console.error(e); process.exit(1); });