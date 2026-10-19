const cases = [
  {
    id: "binary-final-candidate-fault",
    topic: "Binary Search",
    language: "JavaScript",
    code: `function search(a, target) {
  let low = 0, high = a.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (a[mid] < target) low = mid + 1;
    else high = mid;
  }
  return -1;
}`,
    description: "A target at the last remaining candidate is reported as not found.",
    hasDefect: true,
    expectedBehavior: "The interval can shrink to one unchecked candidate before the unconditional not-found result.",
    essentialFacts: ["one remaining candidate", "returns not-found", "without testing"],
    hintBehavior: "Trace the interval at loop exit and ask where that last candidate is tested.",
    retrievalQuery: "binary search leaves final candidate unchecked",
  },
  {
    id: "binary-inclusive-correct",
    topic: "Binary Search",
    language: "JavaScript",
    code: `function search(a, target) {
  let low = 0, high = a.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (a[mid] === target) return mid;
    if (a[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
    description: "Check whether this search handles the final candidate.",
    hasDefect: false,
    expectedBehavior: "Each candidate is tested while the inclusive range is nonempty.",
    essentialFacts: ["checks the midpoint", "inclusive range", "no demonstrated defect"],
    hintBehavior: "Avoid inventing a bug; mention that each remaining midpoint is compared.",
    retrievalQuery: "binary search correct inclusive range checks midpoint",
  },
  {
    id: "binary-midpoint-no-progress",
    topic: "Binary Search",
    language: "JavaScript",
    code: `function contains(a, target) {
  let lo = 0, hi = a.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (a[mid] < target) lo = mid;
    else hi = mid;
  }
  return lo < a.length && a[lo] === target;
}`,
    description: "This search hangs on some two-element ranges.",
    hasDefect: true,
    expectedBehavior: "When mid equals lo, assigning lo to mid leaves the interval unchanged.",
    essentialFacts: ["mid equals lo", "lower bound does not advance", "two-element interval"],
    hintBehavior: "Ask the user to trace a two-element range through the lower branch.",
    retrievalQuery: "binary search midpoint lower bound no progress two candidates",
  },
  {
    id: "array-length-inclusive-fault",
    topic: "Arrays and Off-by-One",
    language: "JavaScript",
    code: `function copy(a) {
  const out = [];
  for (let i = 0; i <= a.length; i++) out.push(a[i]);
  return out;
}`,
    description: "The copied output contains an extra undefined value.",
    hasDefect: true,
    expectedBehavior: "The loop body runs when i equals the array length and reads outside valid indexes.",
    essentialFacts: ["condition includes length", "index equals length", "out-of-range read"],
    hintBehavior: "Focus on the final loop iteration and its index.",
    retrievalQuery: "array loop inclusive length off by one undefined",
  },
  {
    id: "array-empty-guard-correct",
    topic: "Arrays and Off-by-One",
    language: "JavaScript",
    code: `function first(a) {
  if (a.length === 0) return null;
  return a[0];
}`,
    description: "Does this access an invalid element on an empty array?",
    hasDefect: false,
    expectedBehavior: "The empty case returns before indexing; nonempty arrays have index zero.",
    essentialFacts: ["empty guard", "returns before indexing", "no demonstrated defect"],
    hintBehavior: "Confirm both the empty and nonempty paths without inventing a bounds bug.",
    retrievalQuery: "array empty guard index zero safe",
  },
  {
    id: "sliding-window-negative-fault",
    topic: "Arrays and Sliding Windows",
    language: "JavaScript",
    code: `function maxSum(a) {
  let best = 0, sum = 0;
  for (const value of a) {
    sum += value;
    best = Math.max(best, sum);
    if (sum < 0) sum = 0;
  }
  return best;
}`,
    description: "Empty subarrays are not allowed, but an all-negative input returns zero.",
    hasDefect: true,
    expectedBehavior: "Initializing best to zero returns an impossible empty-subarray score for all-negative input.",
    essentialFacts: ["best starts at zero", "all-negative input", "empty subarrays are disallowed"],
    hintBehavior: "Ask what best becomes after processing only negative values.",
    retrievalQuery: "maximum subarray all negative best initialized zero",
  },
  {
    id: "two-pointer-wrong-direction",
    topic: "Two Pointers",
    language: "JavaScript",
    code: `function pair(a, target) {
  let left = 0, right = a.length - 1;
  while (left < right) {
    const sum = a[left] + a[right];
    if (sum < target) right--;
    else if (sum > target) left++;
    else return [left, right];
  }
  return null;
}`,
    description: "For a sorted ascending array, this misses valid pairs.",
    hasDefect: true,
    expectedBehavior: "When sum is too small, moving right leftward discards larger candidates instead of increasing the sum.",
    essentialFacts: ["sum below target", "right pointer decreases", "sorted ascending candidates"],
    hintBehavior: "Ask how that pointer movement changes the candidate sum.",
    retrievalQuery: "sorted two sum wrong pointer movement sum below target",
  },
  {
    id: "two-pointer-correct",
    topic: "Two Pointers",
    language: "JavaScript",
    code: `function pair(a, target) {
  let left = 0, right = a.length - 1;
  while (left < right) {
    const sum = a[left] + a[right];
    if (sum < target) left++;
    else if (sum > target) right--;
    else return [left, right];
  }
  return null;
}`,
    description: "Is a pointer moved in the wrong direction?",
    hasDefect: false,
    expectedBehavior: "For sorted input, each comparison moves the pointer that can reduce or increase the sum appropriately.",
    essentialFacts: ["sum below advances left", "sum above retreats right", "no demonstrated defect"],
    hintBehavior: "Validate movement against sorted order; do not report a wrong-pointer bug.",
    retrievalQuery: "two pointers sorted sum movement correct",
  },
  {
    id: "two-pointer-palindrome-fault",
    topic: "Two Pointers",
    language: "JavaScript",
    code: `function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left < right) {
    if (s[left] !== s[right]) return false;
    left++;
  }
  return true;
}`,
    description: "Some non-palindrome strings are accepted.",
    hasDefect: true,
    expectedBehavior: "The right pointer never moves, so the loop repeatedly compares against the same final character.",
    essentialFacts: ["left advances", "right remains fixed", "same final character reused"],
    hintBehavior: "Ask which pointer changes after a matching pair.",
    retrievalQuery: "palindrome two pointers right pointer not moving",
  },
  {
    id: "linked-list-successor-overwrite",
    topic: "Linked Lists",
    language: "JavaScript",
    code: `function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    curr.next = prev;
    prev = curr;
    curr = curr.next;
  }
  return prev;
}`,
    description: "Reversal truncates a list with more than one node.",
    hasDefect: true,
    expectedBehavior: "The current next link is overwritten before the cursor advances, losing the original successor.",
    essentialFacts: ["overwrites curr.next", "advances through rewritten link", "original successor lost"],
    hintBehavior: "Trace where the cursor goes after the first link reversal.",
    retrievalQuery: "linked list reversal overwrite next before saving successor",
  },
  {
    id: "linked-list-successor-saved",
    topic: "Linked Lists",
    language: "JavaScript",
    code: `function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
    description: "Does this reverse operation lose the remaining suffix?",
    hasDefect: false,
    expectedBehavior: "The successor is saved before the current link is changed.",
    essentialFacts: ["successor saved first", "current link then changed", "no demonstrated defect"],
    hintBehavior: "Confirm the saved successor remains available after reversal.",
    retrievalQuery: "linked list reversal saved successor pointer",
  },
  {
    id: "linked-list-delete-head-fault",
    topic: "Linked Lists",
    language: "JavaScript",
    code: `function removeHead(head) {
  if (!head) return null;
  head.next = null;
  return head.next;
}`,
    description: "Removing the head should return the rest of the list, but it returns null.",
    hasDefect: true,
    expectedBehavior: "The original successor is erased before it can be returned.",
    essentialFacts: ["head.next set to null", "successor lost", "returns null"],
    hintBehavior: "Ask what value remains in head.next at the return.",
    retrievalQuery: "linked list remove head clears next before returning successor",
  },
  {
    id: "graph-dfs-no-visited",
    topic: "Trees and Graphs",
    language: "JavaScript",
    code: `function visit(node, graph) {
  for (const next of graph[node]) visit(next, graph);
}`,
    description: "Traversal over a cyclic graph recurses until stack overflow.",
    hasDefect: true,
    expectedBehavior: "No visited state prevents revisiting vertices in a cycle.",
    essentialFacts: ["recursive neighbors", "no visited tracking", "cycle revisits nodes"],
    hintBehavior: "Ask what happens when traversal follows an edge back to a prior node.",
    retrievalQuery: "DFS missing visited cyclic graph recursion",
  },
  {
    id: "graph-bfs-mark-enqueue-correct",
    topic: "Trees and Graphs",
    language: "JavaScript",
    code: `function bfs(start, graph) {
  const seen = new Set([start]), queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const next of graph[queue[i]]) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}`,
    description: "Does this BFS repeatedly enqueue nodes in a cyclic graph?",
    hasDefect: false,
    expectedBehavior: "Nodes are marked seen before enqueueing, preventing duplicate enqueue and cycles.",
    essentialFacts: ["seen initialized with start", "mark before enqueue", "no demonstrated defect"],
    hintBehavior: "Verify the order of visited check and enqueue.",
    retrievalQuery: "BFS visited mark on enqueue cycle correct",
  },
  {
    id: "tree-inorder-right-twice",
    topic: "Trees and Graphs",
    language: "JavaScript",
    code: `function inorder(node, out = []) {
  if (!node) return out;
  inorder(node.left, out);
  out.push(node.value);
  inorder(node.right, out);
  inorder(node.right, out);
  return out;
}`,
    description: "Inorder traversal duplicates values from right subtrees.",
    hasDefect: true,
    expectedBehavior: "The right subtree is recursively traversed twice.",
    essentialFacts: ["right subtree call appears twice", "duplicate traversal"],
    hintBehavior: "Ask how many recursive calls process the right child.",
    retrievalQuery: "tree inorder right subtree visited twice",
  },
  {
    id: "recursion-factorial-zero-fault",
    topic: "Recursion and Backtracking",
    language: "JavaScript",
    code: `function factorial(n) {
  if (n === 1) return 1;
  return n * factorial(n - 1);
}`,
    description: "Factorial at zero does not terminate.",
    hasDefect: true,
    expectedBehavior: "Zero misses the only base case and recursive calls continue with negative values.",
    essentialFacts: ["base case only one", "zero enters recursion", "argument decreases"],
    hintBehavior: "Ask what condition stops the zero-input call.",
    retrievalQuery: "factorial missing zero base case",
  },
  {
    id: "recursion-factorial-zero-correct",
    topic: "Recursion and Backtracking",
    language: "JavaScript",
    code: `function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}`,
    description: "Check the termination and base case for nonnegative inputs.",
    hasDefect: false,
    expectedBehavior: "Zero and one terminate; positive arguments decrease toward a base case.",
    essentialFacts: ["zero base case", "one base case", "argument decreases"],
    hintBehavior: "Do not report a missing zero base case.",
    retrievalQuery: "factorial zero and one base case correct",
  },
  {
    id: "backtracking-missing-pop",
    topic: "Recursion and Backtracking",
    language: "JavaScript",
    code: `function subsets(a) {
  const result = [], path = [];
  function visit(i) {
    if (i === a.length) {
      result.push(path.slice());
      return;
    }
    path.push(a[i]);
    visit(i + 1);
    visit(i + 1);
  }
  visit(0);
  return result;
}`,
    description: "Generated subsets contain repeated or oversized combinations.",
    hasDefect: true,
    expectedBehavior: "The include branch never removes its element before the exclude branch.",
    essentialFacts: ["path push", "no pop before second branch", "state leaks across branches"],
    hintBehavior: "Ask what path contains when the second recursive branch starts.",
    retrievalQuery: "backtracking missing pop path state leaks branches",
  },
  {
    id: "dp-fibonacci-transition-fault",
    topic: "Dynamic Programming",
    language: "JavaScript",
    code: `function fib(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 0;
  if (n > 0) dp[1] = 1;
  for (let i = 2; i <= n; i++) dp[i] = dp[i - 1] + dp[i - 1];
  return dp[n];
}`,
    description: "The sequence returns 2 for the third Fibonacci index instead of 1.",
    hasDefect: true,
    expectedBehavior: "The recurrence adds the previous state twice rather than combining the two preceding states.",
    essentialFacts: ["dp[i - 1] used twice", "missing dp[i - 2]", "wrong recurrence"],
    hintBehavior: "Ask which prior states define the current Fibonacci state.",
    retrievalQuery: "Fibonacci DP recurrence previous state added twice",
  },
  {
    id: "dp-stairs-correct",
    topic: "Dynamic Programming",
    language: "JavaScript",
    code: `function ways(n) {
  const dp = Array(n + 1).fill(0);
  dp[0] = 1;
  for (let i = 1; i <= n; i++) {
    dp[i] += dp[i - 1];
    if (i > 1) dp[i] += dp[i - 2];
  }
  return dp[n];
}`,
    description: "Does this count one- or two-step climbs without a transition bug?",
    hasDefect: false,
    expectedBehavior: "Each state sums the valid one-step and two-step predecessor states.",
    essentialFacts: ["dp[i - 1]", "dp[i - 2] guarded", "no demonstrated defect"],
    hintBehavior: "Confirm the transition and small base state; do not invent a recurrence issue.",
    retrievalQuery: "climbing stairs DP correct recurrence",
  },
  {
    id: "dp-knapsack-capacity-fault",
    topic: "Dynamic Programming",
    language: "JavaScript",
    code: `function canFill(weights, capacity) {
  const dp = Array(capacity + 1).fill(false);
  dp[0] = true;
  for (const weight of weights) {
    for (let c = weight; c <= capacity; c++) {
      dp[c] = dp[c] || dp[c - weight];
    }
  }
  return dp[capacity];
}`,
    description: "Each item may be used at most once, but this accepts repeated use of one item.",
    hasDefect: true,
    expectedBehavior: "Ascending capacity iteration reuses states written during the same item pass.",
    essentialFacts: ["capacity iterates upward", "same item can be reused", "0/1 constraint violated"],
    hintBehavior: "Ask whether a state created for this item can feed a later capacity in the same pass.",
    retrievalQuery: "0/1 knapsack ascending capacity reuses item",
  },
  {
    id: "matrix-inclusive-column-fault",
    topic: "Matrix Traversal",
    language: "JavaScript",
    code: `function sum(grid) {
  let total = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c <= grid[r].length; c++) {
      total += grid[r][c];
    }
  }
  return total;
}`,
    description: "The sum becomes NaN after visiting the end of each row.",
    hasDefect: true,
    expectedBehavior: "The inclusive column condition permits c to equal row length and reads out of range.",
    essentialFacts: ["c <= row length", "column equals length", "out-of-range access"],
    hintBehavior: "Direct attention to the inner condition and final column iteration.",
    retrievalQuery: "matrix inner column loop inclusive row length",
  },
  {
    id: "matrix-rectangular-correct",
    topic: "Matrix Traversal",
    language: "JavaScript",
    code: `function sum(grid) {
  let total = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) total += grid[r][c];
  }
  return total;
}`,
    description: "Does this sum handle rectangular matrices?",
    hasDefect: false,
    expectedBehavior: "Rows and columns use their own valid bounds, including rectangular and empty rows.",
    essentialFacts: ["row bound uses grid length", "column bound uses row length", "no demonstrated defect"],
    hintBehavior: "Confirm rectangular rows are bounded by their own length.",
    retrievalQuery: "matrix rectangular row column dimensions correct bounds",
  },
  {
    id: "matrix-transpose-dimension-fault",
    topic: "Matrix Traversal",
    language: "JavaScript",
    code: `function transpose(grid) {
  const out = [];
  for (let c = 0; c < grid.length; c++) {
    out[c] = [];
    for (let r = 0; r < grid[0].length; r++) out[c][r] = grid[r][c];
  }
  return out;
}`,
    description: "Transposing a wide rectangular matrix reads undefined values.",
    hasDefect: true,
    expectedBehavior: "The outer loop uses row count as the original column count, truncating columns when the matrix is wider.",
    essentialFacts: ["outer c uses grid.length", "grid.length is row count", "wide matrix columns omitted"],
    hintBehavior: "Ask which original dimension bounds the transpose column loop.",
    retrievalQuery: "transpose rectangular matrix uses row count for columns",
  },
  {
    id: "hash-prototype-key-fault",
    topic: "Hash Maps and Sets",
    language: "JavaScript",
    code: `function count(items) {
  const counts = {};
  for (const item of items) counts[item] = (counts[item] || 0) + 1;
  return counts;
}`,
    description: "Counting an item named toString produces an incorrect count.",
    hasDefect: true,
    expectedBehavior: "A plain object inherits prototype keys, so the first count for toString starts from a function rather than zero.",
    essentialFacts: ["plain object map", "inherited property name", "counts[item] truthy non-number"],
    hintBehavior: "Ask what counts[item] contains before the first increment for an inherited key.",
    retrievalQuery: "JavaScript object hash map prototype key toString count bug",
  },
  {
    id: "hash-map-correct",
    topic: "Hash Maps and Sets",
    language: "JavaScript",
    code: `function firstDuplicate(items) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item)) return item;
    seen.add(item);
  }
  return null;
}`,
    description: "Does this detect the first repeated value?",
    hasDefect: false,
    expectedBehavior: "Each value is checked before insertion; first repeated value returns.",
    essentialFacts: ["checks seen before add", "returns first duplicate", "no demonstrated defect"],
    hintBehavior: "Trace one repeated value and avoid claiming set tracking is absent.",
    retrievalQuery: "set seen duplicate detection correct order",
  },
  {
    id: "hash-two-sum-overwrite-fault",
    topic: "Hash Maps and Sets",
    language: "JavaScript",
    code: `function twoSum(a, target) {
  const indexByValue = new Map();
  for (let i = 0; i < a.length; i++) {
    indexByValue.set(a[i], i);
    const needed = target - a[i];
    if (indexByValue.has(needed)) return [indexByValue.get(needed), i];
  }
  return null;
}`,
    description: "The array [3, 3] with target 6 returns the same index twice.",
    hasDefect: true,
    expectedBehavior: "The current value is inserted before checking its complement, so a value can match itself.",
    essentialFacts: ["inserts current before lookup", "complement equals current value", "same index returned"],
    hintBehavior: "Ask what index is stored when the first value is checked against itself.",
    retrievalQuery: "two sum map inserts before lookup same index duplicate value",
  },
  {
    id: "sorting-bubble-bound-fault",
    topic: "Sorting and Off-by-One",
    language: "JavaScript",
    code: `function bubble(a) {
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j <= a.length - i - 1; j++) {
      if (a[j] > a[j + 1]) [a[j], a[j + 1]] = [a[j + 1], a[j]];
    }
  }
  return a;
}`,
    description: "Sorting creates an undefined value at the tail.",
    hasDefect: true,
    expectedBehavior: "The inner loop reaches the last valid index and compares a[j + 1] beyond the array.",
    essentialFacts: ["inner bound includes final index", "reads j + 1", "out-of-range comparison"],
    hintBehavior: "Ask which index j+1 refers to on the final inner iteration.",
    retrievalQuery: "bubble sort inner loop off by one j plus one beyond array",
  },
  {
    id: "sorting-insertion-correct",
    topic: "Sorting and Off-by-One",
    language: "JavaScript",
    code: `function insertion(a) {
  for (let i = 1; i < a.length; i++) {
    const value = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > value) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = value;
  }
  return a;
}`,
    description: "Does the insertion loop access a negative index?",
    hasDefect: false,
    expectedBehavior: "The j >= 0 guard short-circuits before indexing a[j].",
    essentialFacts: ["j >= 0 guard", "short-circuit protects access", "no demonstrated defect"],
    hintBehavior: "Check guard order before claiming negative-index access.",
    retrievalQuery: "insertion sort j nonnegative guard correct",
  },
  {
    id: "strings-empty-palindrome-correct",
    topic: "Arrays and Strings",
    language: "JavaScript",
    code: `function isPalindrome(s) {
  let left = 0, right = s.length - 1;
  while (left <= right) {
    if (s[left] !== s[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
    description: "The empty string causes an exception.",
    hasDefect: false,
    expectedBehavior: "The loop condition is false for an empty string, so no indexing occurs.",
    essentialFacts: ["right starts at negative one", "loop condition false", "no index access"],
    hintBehavior: "Avoid claiming the empty case indexes the string.",
    retrievalQuery: "empty string palindrome two pointer loop zero length correct",
  },
  {
    id: "strings-anagram-case-fault",
    topic: "Arrays and Strings",
    language: "JavaScript",
    code: `function sameLetters(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const ch of a) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (const ch of b) {
    if (!counts.get(ch)) return false;
    counts.set(ch, counts.get(ch) - 1);
  }
  return true;
}`,
    description: "The function accepts strings with different character counts in b.",
    hasDefect: true,
    expectedBehavior: "It never rejects leftover positive counts after processing b.",
    essentialFacts: ["checks b characters", "decrements counts", "no final leftover-count check"],
    hintBehavior: "Ask what condition is checked after the second string is consumed.",
    retrievalQuery: "anagram count map leftover positive counts not checked",
  },
  {
    id: "recursion-tree-path-correct",
    topic: "Recursion and Backtracking",
    language: "JavaScript",
    code: `function height(node) {
  if (!node) return 0;
  return 1 + Math.max(height(node.left), height(node.right));
}`,
    description: "Does this recursion fail to terminate for a finite tree?",
    hasDefect: false,
    expectedBehavior: "Null children form a base case and each call descends to a child.",
    essentialFacts: ["null base case", "recursive calls to children", "finite tree terminates"],
    hintBehavior: "Explain the base case and avoid inventing missing termination.",
    retrievalQuery: "tree recursion height null base case correct",
  },
  {
    id: "graph-bfs-dequeue-mark-fault",
    topic: "Trees and Graphs",
    language: "JavaScript",
    code: `function bfs(start, graph) {
  const seen = new Set(), queue = [start];
  while (queue.length) {
    const node = queue.shift();
    if (seen.has(node)) continue;
    seen.add(node);
    for (const next of graph[node]) queue.push(next);
  }
  return seen;
}`,
    description: "A diamond graph causes repeated queue entries and excessive work.",
    hasDefect: true,
    expectedBehavior: "Nodes are marked only after dequeue, so multiple parents can enqueue them before first processing.",
    essentialFacts: ["mark on dequeue", "multiple parents enqueue before processing", "duplicate queue entries"],
    hintBehavior: "Ask when a node becomes visited relative to being enqueued.",
    retrievalQuery: "BFS mark visited dequeue diamond duplicate enqueues",
  },
  {
    id: "sliding-window-initial-check-fault",
    topic: "Arrays and Sliding Windows",
    language: "JavaScript",
    code: `function maxWindow(a, k) {
  let sum = 0, best = -Infinity;
  for (let i = 0; i < k; i++) sum += a[i];
  for (let right = k; right < a.length; right++) {
    sum += a[right] - a[right - k];
    best = Math.max(best, sum);
  }
  return best;
}`,
    description: "For an array whose length equals k, the result is negative infinity.",
    hasDefect: true,
    expectedBehavior: "The initial window sum is never compared to best if there is no later window.",
    essentialFacts: ["initial sum computed", "best updated only in second loop", "no later window leaves negative infinity"],
    hintBehavior: "Ask which code updates best when the first window is also the only window.",
    retrievalQuery: "sliding window initial first window not checked best negative infinity",
  },
  {
    id: "array-max-last-element-fault",
    topic: "Arrays and Off-by-One",
    language: "JavaScript",
    code: `function maxValue(a) {
  let best = a[0];
  for (let i = 1; i < a.length - 1; i++) {
    if (a[i] > best) best = a[i];
  }
  return best;
}`,
    description: "The maximum can be the final array element but is missed.",
    hasDefect: true,
    expectedBehavior: "The loop stops before the last valid index.",
    essentialFacts: ["bound is length minus one", "last index excluded", "last maximum missed"],
    hintBehavior: "Ask whether the loop visits the final valid index.",
    retrievalQuery: "array max loop excludes last valid element off by one",
  },
  {
    id: "dp-grid-paths-correct",
    topic: "Dynamic Programming",
    language: "JavaScript",
    code: `function paths(rows, cols) {
  const dp = Array(cols).fill(0);
  dp[0] = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c < cols; c++) dp[c] += dp[c - 1];
  }
  return dp[cols - 1];
}`,
    description: "Does this one-dimensional DP update read an invalid prior state?",
    hasDefect: false,
    expectedBehavior: "The inner loop starts at one and reads a valid preceding column.",
    essentialFacts: ["column starts at one", "reads c minus one", "no demonstrated defect for positive dimensions"],
    hintBehavior: "Check the declared dimension precondition and avoid claiming negative indexing.",
    retrievalQuery: "dynamic programming grid paths one dimensional valid preceding state",
  },
  {
    id: "hash-set-delete-during-iteration-fault",
    topic: "Hash Maps and Sets",
    language: "JavaScript",
    code: `function removeOdds(values) {
  const set = new Set(values);
  for (const value of set) {
    if (value % 2) set.delete(value);
  }
  return [...set];
}`,
    description: "Does deleting the current value skip the next set element?",
    hasDefect: false,
    expectedBehavior: "Deleting the current Set element during iteration does not skip subsequent values.",
    essentialFacts: ["iterates set", "deletes current value", "no demonstrated skip defect"],
    hintBehavior: "Do not assume array-index shift behavior applies to Set iteration.",
    retrievalQuery: "JavaScript Set delete current item during iteration",
  },
  {
    id: "sorting-merge-tail-fault",
    topic: "Sorting and Off-by-One",
    language: "JavaScript",
    code: `function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  while (i < a.length - 1) out.push(a[i++]);
  while (j < b.length - 1) out.push(b[j++]);
  return out;
}`,
    description: "The merged result omits the final remaining element from one input.",
    hasDefect: true,
    expectedBehavior: "Tail-copy loops stop before the last unconsumed element.",
    essentialFacts: ["tail loop uses length minus one", "one item can remain", "merged result omits it"],
    hintBehavior: "Ask what remains when either main merge loop ends.",
    retrievalQuery: "merge sort tail loop omits last remaining element length minus one",
  },
  {
    id: "ambiguous-window-contract",
    topic: "Arrays and Sliding Windows",
    language: "JavaScript",
    code: `function best(a) {
  let sum = 0, answer = 0;
  for (const value of a) {
    sum += value;
    answer = Math.max(answer, sum);
  }
  return answer;
}`,
    description: "Is returning zero incorrect?",
    hasDefect: null,
    expectedBehavior: "The answer depends on whether the empty subarray is allowed and which maximum-sum problem is intended.",
    essentialFacts: ["empty-subarray contract missing", "cannot determine correctness without task definition"],
    hintBehavior: "Ask whether an empty subarray is allowed before diagnosing initialization.",
    retrievalQuery: "maximum subarray empty allowed contract ambiguity",
  },
  {
    id: "ambiguous-indexing-contract",
    topic: "Arrays and Off-by-One",
    language: "JavaScript",
    code: `function itemAt(a, index) {
  return a[index];
}`,
    description: "This sometimes returns undefined. Is there an indexing bug?",
    hasDefect: null,
    expectedBehavior: "Without the caller's index range and intended behavior, the function alone does not establish a defect.",
    essentialFacts: ["index precondition missing", "cannot establish bug from snippet alone"],
    hintBehavior: "Ask what index values the caller supplies and what result is expected.",
    retrievalQuery: "array index precondition missing insufficient context",
  },
];

export default cases;
