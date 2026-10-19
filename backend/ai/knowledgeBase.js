const knowledgeBase = [
  {
    id: "binary-search-boundary",
    topic: "Binary Search",
    bugType: "Boundary Error",
    title: "Incorrect Binary Search Boundary Update",
    content:
      "Concept: Binary search boundaries and loop invariants. Common assumption: assigning the midpoint to a bound always shrinks the remaining interval. This can fail when the midpoint equals a bound, especially with two candidates. Symptoms: the same midpoint and bounds recur, or a candidate is skipped. Questions: Is the interval closed or half-open? Has the midpoint been ruled out? Does each branch preserve the invariant that the answer remains in the interval? Checklist: write the interval before and after one branch; test the smallest interval with two candidates; verify strict progress and termination. Keywords and alternatives: low, high, left, right, mid, lo, hi, inclusive, exclusive, loop invariant, progress, binary search.",
  },
  {
    id: "binary-search-mid",
    topic: "Binary Search",
    bugType: "Mid Calculation",
    title: "Binary Search Midpoint Calculation",
    content:
      "Concept: midpoint arithmetic in binary search. Common assumption: adding two indexes is always safe. In fixed-width integer languages the intermediate sum can overflow even when both indexes are valid. Symptoms: a negative or unexpectedly distant midpoint on very large ranges. Questions: What are the operand limits and intermediate sum? Does the language use fixed-width integers? Checklist: inspect the largest possible bounds and trace intermediate arithmetic. Keywords: midpoint, mid, low, high, left, right, integer overflow, fixed-width, binary search.",
  },
  {
    id: "binary-search-loop",
    topic: "Binary Search",
    bugType: "Infinite Loop",
    title: "Binary Search Infinite Loop",
    content:
      "Concept: binary-search progress and termination. Common assumption: recalculating a midpoint means the search made progress. Symptoms: the same low, high, and mid recur, often in a two-candidate interval. Questions: Which branch runs? Which bound changes? Does the interval become strictly smaller? Checklist: trace low, high, mid, and the selected branch for a minimal failing interval. Keywords: infinite loop, stuck, no progress, low, high, left, right, mid, two candidates, loop invariant.",
  },
  {
    id: "binary-search-final-candidate",
    topic: "Binary Search",
    bugType: "Final Candidate",
    title: "Binary Search Leaves the Final Candidate Unchecked",
    content:
      "Concept: final candidate handling in a binary search. Common assumption: the loop condition or return condition guarantees the answer is already known after the loop ends. Symptoms: the search terminates without checking the last remaining candidate, or the result is off by one near the endpoint. Questions: Which candidate remains after the interval shrinks to one element? Is the last valid candidate evaluated before the function returns? Checklist: walk a tiny sorted list with two or three items, record the remaining interval, and confirm the final candidate is handled explicitly. Keywords and alternatives: final candidate, last element, answer check, inclusive interval, remaining interval, candidate selection, binary search boundary, low high final state.",
  },
  {
    id: "recursion-base-case",
    topic: "Recursion",
    bugType: "Missing Base Case",
    title: "Missing or Incorrect Base Case",
    content:
      "Concept: recursion termination through a reachable base case. Common assumptions: the input eventually becomes small by itself, or an existing base case is necessarily reachable. Symptoms: stack overflow, repeated states, or recursion that stops only for some inputs. Questions: Which exact condition stops calls? Can every recursive path reach it? Does each call move its argument toward that condition? Checklist: trace the smallest valid input and next recursive argument; inspect branches that skip the stopping condition. Keywords and alternatives: recursion, base case, stopping condition, termination, stack overflow, recursive call, progress.",
  },
  {
    id: "recursion-factorial-zero",
    topic: "Recursion",
    bugType: "Factorial Base Case",
    title: "Factorial Recursion Fails at Zero",
    content:
      "Concept: factorial recursion requires an explicit zero base case. Common assumption: the recursive call always reaches a stopping point, even when zero is not handled. Symptoms: factorial(0) or factorial(1) unexpectedly recurses forever or throws a stack overflow. Questions: What is the value when the argument is zero, and does the recursive branch still reach it? Checklist: trace the argument through successive calls and confirm the base condition is reachable for the smallest input, especially zero. Keywords: factorial, recursion, base case, zero, stopping condition, stack overflow, n equals zero.",
  },
  {
    id: "recursion-return",
    topic: "Recursion",
    bugType: "Incorrect Return",
    title: "Recursive Result Not Returned",
    content:
      "Concept: propagating recursive results. Common assumption: calling a recursive function automatically passes its result to the caller. Symptoms: a deeper call computes the expected value but an outer call produces a missing or default result. Questions: What value does each call receive from its child, and what does it return? Checklist: trace a two-level call and record each return value. Keywords: recursion, return value, propagation, call stack, missing return, result.",
  },
  {
    id: "recursion-state",
    topic: "Recursion",
    bugType: "State Error",
    title: "Incorrect Recursive State",
    content:
      "Concept: recursive state and progress. Common assumption: changing one argument is enough to represent the next subproblem. Symptoms: repeated states, skipped cases, or incorrect accumulated results. Questions: Which state describes the subproblem, which value must change, and is progress monotonic? Checklist: compare arguments and accumulated results across consecutive calls; check whether branches share unintended mutable state. Keywords: recursion, state, arguments, index, remaining choices, accumulator, repeated state, progress.",
  },
  {
    id: "two-pointer-movement",
    topic: "Two Pointers",
    bugType: "Pointer Movement",
    title: "Incorrect Pointer Movement",
    content:
      "Concept: two-pointer progress and invariants. Common assumptions: both pointers should always move together, or either pointer may move without invalidating candidates. Symptoms: repeated pairs, skipped valid pairs, or a loop that stalls. Questions: What ordering or invariant justifies moving this pointer? Is at least one pointer guaranteed to advance? Checklist: trace both pointers and their values on the smallest input; verify each movement discards only impossible candidates. Keywords and alternatives: two pointers, left, right, lo, hi, sorted array, pair sum, pointer movement, progress, invariant.",
  },
  {
    id: "sliding-window-shrink",
    topic: "Sliding Window",
    bugType: "Window Update",
    title: "Incorrect Window Shrinking",
    content:
      "Concept: sliding-window validity and boundary movement. Common assumptions: one left-boundary move always restores validity, or the window is valid before checking the result. Symptoms: an invalid window contributes to the answer, the running sum/count is wrong, or a state repeats. Questions: At what point is the window valid, and how many left-boundary advances are needed? Checklist: trace right, left, contents, and validity on a minimal example. Keywords: sliding window, left, right, window, shrink, invalid, condition, boundary, sum, count.",
  },
  {
    id: "sliding-window-negative-values",
    topic: "Sliding Window",
    bugType: "Initialization and Negative Values",
    title: "Sliding Window Initialization on All-Negative Inputs",
    content:
      "Concept: initializing an extremum when every input may be negative. Common assumption: zero is always a safe initial best sum, or that a positive running sum will eventually appear. Symptoms: an all-negative input incorrectly returns zero or an empty window. Questions: Is an empty window allowed? What should the best result be after the first non-empty element? Checklist: test one negative element and several negative elements; trace running sum and best value after each step. Keywords and alternatives: sliding window, all-negative, negative numbers, maximum subarray, best sum, initialization, zero, running sum, empty window.",
  },
  {
    id: "sliding-window-initial-window",
    topic: "Sliding Window",
    bugType: "Initial Window Check",
    title: "Sliding Window Ignores the Initial Window",
    content:
      "Concept: the first valid window is not optional when evaluating a maximum or minimum. Common assumption: the algorithm can begin after the first shrink or after the first add without ever checking the initial window. Symptoms: answers are too small, the first element is skipped, or the algorithm only works after a later adjustment. Questions: What is the first window after advancing the right pointer to the initial size, and should it be evaluated before shrinking? Checklist: test a short array where the best answer is the first window, trace the running sum, and confirm the initial window is considered before any left movement. Keywords: sliding window, initial window, first valid window, all-negative, start, maximum subarray, minimum window, shrink, evaluate before moving left.",
  },
  {
    id: "dp-state",
    topic: "Dynamic Programming",
    bugType: "State Definition",
    title: "Incorrect DP State",
    content:
      "Concept: dynamic-programming state definition. Common assumption: the current index alone always identifies a subproblem. Symptoms: distinct subproblems reuse one table entry or memoized value and produce inconsistent results. Questions: Which choices or constraints affect the remaining subproblem? Does the state distinguish cases with different futures? Checklist: compare subproblems sharing an index but differing in another relevant constraint. Keywords: dynamic programming, DP state, memoization, index, remaining capacity, dimension, subproblem.",
  },
  {
    id: "dp-transition",
    topic: "Dynamic Programming",
    bugType: "Transition Error",
    title: "Incorrect DP Transition",
    content:
      "Concept: DP recurrence and state transitions. Common assumptions: adjacent states are always sufficient, or a recurrence is correct because it works on one example. Symptoms: a choice or predecessor is missed, incompatible states are combined, or dp[i] first diverges at an index. Questions: Which predecessor states are valid, what combines them, and what does dp[i-1] represent? Checklist: hand-compute a tiny input; list legal predecessors for the first non-base state; compare the recurrence with that list. Keywords and alternatives: DP, dp[i], dp[i-1], recurrence, transition, predecessor, initialization, state, missing case.",
  },
  {
    id: "dp-initialization",
    topic: "Dynamic Programming",
    bugType: "Initialization",
    title: "Incorrect DP Initialization",
    content:
      "Concept: DP base-state initialization. Common assumption: zero-initialized entries represent every unreachable state. Symptoms: incorrect values propagate from the first transitions, especially for impossible states or all-negative inputs. Questions: What does each base entry mean, and is this state reachable? Checklist: hand-check the smallest subproblem and verify initialized entries against the recurrence. Keywords: DP, initialization, base case, unreachable, sentinel, zero, negative.",
  },
  {
    id: "array-off-by-one",
    topic: "Arrays",
    bugType: "Off-by-One",
    title: "Array Boundary Error",
    content:
      "Concept: zero-based array bounds. Common assumption: an index equal to the length is the final valid element; valid indexes end one below the length. Symptoms: out-of-bounds access, undefined/null values, or a boundary element omitted. Questions: Can the loop body run when its index equals the array length? Does that same index access the array? Checklist: test first and last valid positions plus the length value; compare loop condition and body access. Keywords and alternatives: array bounds, index, length, size, zero-based, off-by-one, out-of-bounds, out-of-range.",
  },
  {
    id: "integer-overflow",
    topic: "General",
    bugType: "Integer Overflow",
    title: "Integer Overflow",
    content:
      "Concept: fixed-width integer range and intermediate arithmetic. Common assumption: a valid final result means every intermediate value was representable. Symptoms: wrapped, negative, or discontinuous results near large limits. Questions: What is the range of each operand and intermediate result? Checklist: trace the largest intermediate calculation and determine the language's integer width. Keywords: integer overflow, fixed-width, midpoint, sum, multiplication, large input, wraparound.",
  },
  {
    id: "null-access",
    topic: "General",
    bugType: "Null Access",
    title: "Null or Missing Value Access",
    content:
      "Concept: nullable and missing values. Common assumption: a lookup or earlier branch always produces an object. Symptoms: null/undefined access exceptions or a missing field only on some paths. Questions: Which path produces this value, and is it initialized before dereferencing? Checklist: trace the value from its source and check empty, missing, and failure cases. Keywords and alternatives: null, undefined, missing value, dereference, property access, optional, initialization.",
  },
  {
    id: "graph-bfs-visited",
    topic: "Graph Traversal",
    bugType: "BFS Visited State",
    title: "BFS Duplicate Enqueue and Visited Timing",
    content:
      "Concept: BFS visited-set timing and queue invariants. Common assumption: marking a node only when dequeued prevents duplicates. In cyclic or converging graphs, multiple frontier nodes can enqueue the same neighbor first. Symptoms: duplicate queue entries, repeated processing, inflated distances, or excess work. Questions: When is a node marked, and can two current neighbors enqueue it first? Checklist: trace a triangle and diamond graph; record enqueue count and visited state for each vertex. Keywords and alternatives: BFS, breadth-first search, queue, visited, visited set, mark on enqueue, duplicate enqueue, graph cycle, shortest path, distance.",
  },
  {
    id: "graph-dfs-cycle",
    topic: "Graph Traversal",
    bugType: "DFS Visited State and Cycles",
    title: "DFS Revisits Nodes in a Cyclic Graph",
    content:
      "Concept: DFS cycle handling and visited-state ownership. Common assumptions: a graph is a tree, or a parent edge is harmless in every representation. Symptoms: repeated recursion, stack overflow, revisiting the parent in an undirected graph, or falsely reporting a cycle. Questions: Can an edge return to an active or explored vertex? Is the graph directed, and does cycle detection distinguish a parent edge from a back edge? Checklist: trace a two-node undirected edge and a small cycle; record visited and recursion-stack states. Keywords and alternatives: DFS, depth-first search, visited, visited set, cycle, graph, undirected, directed, parent, recursion stack, back edge.",
  },
  {
    id: "linked-list-reversal-pointers",
    topic: "Linked Lists",
    bugType: "Pointer Update Order",
    title: "Linked-List Reversal Loses a Node",
    content:
      "Concept: preserving the next link while reversing linked-list pointers. Common assumption: a node's successor remains reachable after its link is redirected. Symptoms: the list truncates, a suffix disappears, a cycle forms, or traversal never reaches the original tail. Questions: Before a link changes, where is the rest of the list reachable? What do prev, curr, and next refer to after each step? Checklist: trace one-node and two-node lists; draw links before and after every pointer assignment. Keywords and alternatives: linked list, reverse, reversal, prev, curr, current, next, pointer, successor, lost node, cycle.",
  },
  {
    id: "matrix-row-column-bounds",
    topic: "Matrices",
    bugType: "Row and Column Bounds",
    title: "Matrix Dimension and Index Confusion",
    content:
      "Concept: independent matrix row and column bounds. Common assumption: a matrix is square or row and column counts are interchangeable. Symptoms: failures only on rectangular or empty matrices, invalid row/column access, or skipped edge cells. Questions: Which dimension bounds this index? Are dimensions derived from the correct row? Checklist: test one-row, one-column, and rectangular matrices; inspect first and last valid row and column separately. Keywords and alternatives: matrix, grid, row, column, rows, cols, columns, dimensions, rectangular, out-of-bounds, indexing.",
  },
];

export default knowledgeBase;