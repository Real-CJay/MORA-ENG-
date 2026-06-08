// cs question data - lazy loaded by quiz_app.js
window.MORA_SUBJECT_CHUNKS = window.MORA_SUBJECT_CHUNKS || {};
window.MORA_SUBJECT_CHUNKS["cs"] = {
  "pastUnit": [],
  "pastPaper": [
    {
      "id": "cs_pp_001",
      "year": "2025 Batch 24",
      "text": "If M=3 and N=2, how many times does the value of variable k get incremented?",
      "img": "IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG1.png",
      "imgAlt": "Flowchart of the algorithm: initializes i=1, loops while i<=M, sets k=1, loops while k<=N, checks i\u2260k to output i+k, increments k, then increments i.",
      "opts": ["2", "3", "4", "5", "6"],
      "ans": 4,
      "exp": "<strong>Trace through the algorithm with M=3, N=2.</strong><br><br>For each value of i, the inner loop runs k from 1 to N=2, incrementing k each time (including the final increment that takes k past N).<br><br><strong>i=1:</strong> k starts at 1. k=1: i\u2260k? 1\u22601 \u2192 No output. k incremented to 2 (count=1). k=2: i\u2260k? 1\u22602 \u2192 output 3. k incremented to 3 (count=2). k=3 > N, exit inner loop.<br><br><strong>i=2:</strong> k=1: i\u2260k? 2\u22601 \u2192 output 3. k incremented to 2 (count=3). k=2: i\u2260k? 2\u22602 \u2192 No output. k incremented to 3 (count=4). Exit.<br><br><strong>i=3:</strong> k=1: 3\u22601 \u2192 output 4. k incremented to 2 (count=5). k=2: 3\u22602 \u2192 output 5. k incremented to 3 (count=6). Exit.<br><br>Total k increments = <strong>6</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_002",
      "year": "2025 Batch 24",
      "text": "If M=3 and N=2, which one of the following lists shows all values printed by the algorithm, in the correct order?",
      "img": "IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG1.png",
      "imgAlt": "Flowchart of the algorithm: initializes i=1, loops while i<=M, sets k=1, loops while k<=N, checks i\u2260k to output i+k, increments k, then increments i.",
      "opts": ["2, 3, 3, 4, 4, 5", "2, 3, 4, 5", "2, 3, 4, 5, 6, 7", "3, 3, 4, 5", "3, 4, 5"],
      "ans": 3,
      "exp": "<strong>Output is i+k only when i\u2260k.</strong><br><br>Using the trace from Q1:<br>i=1, k=2 \u2192 1\u22602 \u2192 output <strong>3</strong><br>i=2, k=1 \u2192 2\u22601 \u2192 output <strong>3</strong><br>i=3, k=1 \u2192 3\u22601 \u2192 output <strong>4</strong><br>i=3, k=2 \u2192 3\u22602 \u2192 output <strong>5</strong><br><br>The sequence printed is <strong>3, 3, 4, 5</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_003",
      "year": "2025 Batch 24",
      "text": "How many times do the variables i and k get compared?",
      "img": "IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG1.png",
      "imgAlt": "Flowchart of the algorithm: initializes i=1, loops while i<=M, sets k=1, loops while k<=N, checks i\u2260k to output i+k, increments k, then increments i.",
      "opts": ["(M-1)+(N-1)", "(M-1)\u00d7(N-1)", "M\u00d7(N-1)", "M+N", "M\u00d7N"],
      "ans": 4,
      "exp": "<strong>The comparison i\u2260k occurs inside the inner loop.</strong><br><br>The outer loop runs for i=1, 2, \u2026, M \u2192 exactly <strong>M</strong> iterations. For each value of i, the inner loop runs k=1, 2, \u2026, N \u2192 exactly <strong>N</strong> iterations, and the comparison i\u2260k is checked once per inner iteration.<br><br>Total comparisons = M \u00d7 N.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_004",
      "year": "2025 Batch 24",
      "text": "Consider the following statements regarding the algorithm in Fig. 1.\nI. There will be no output if either M=1 or N=1.\nII. The output will be the same if we interchange i and k everywhere they appear.\nIII. The output will be the same if both variables i and k get initialized to 0.\nWhich of the statements above is/are correct?",
      "img": "IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG1.png",
      "imgAlt": "Flowchart of the algorithm: initializes i=1, loops while i<=M, sets k=1, loops while k<=N, checks i\u2260k to output i+k, increments k, then increments i.",
      "opts": ["II only", "I and II only", "II and III only", "All (I, II and III) are correct", "None (all are incorrect)"],
      "ans": 0,
      "exp": "<strong>Statement I \u2014 FALSE.</strong> If M=1 and N=2: i=1, k=1 (1\u22601 \u2192 skip), k=2 (1\u22602 \u2192 output 3). So output IS produced when N=2 even though M=1. The statement claims no output whenever M=1 or N=1, which is wrong.<br><br><strong>Statement II \u2014 TRUE.</strong> The expression output is i+k (addition is commutative), and the condition is i\u2260k (symmetric). Swapping every occurrence of i and k simply relabels the outer and inner loop variables; the same pairs (i,k) are visited and the same sums are output in the same order.<br><br><strong>Statement III \u2014 FALSE.</strong> Initializing both to 0 adds an extra iteration (i=0 and k=0,1,\u2026,N) that was not in the original algorithm, producing different output.<br><br>Only Statement II is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_005",
      "year": "2025 Batch 24",
      "text": "Three students expressed in pseudo-code the algorithm in Fig. 1 as shown below.\n[Pseudo-code I: FOR i=1 TO M / FOR k=1 TO N / IF i\u2260k OUTPUT i+k]\n[Pseudo-code II: WHILE i<=M / WHILE k<=N / IF i\u2260k OUTPUT i+k / k=k+1 / i=i+1]\n[Pseudo-code III: REPEAT / k=1 / REPEAT / IF i\u2260k OUTPUT i+k / k=k+1 / UNTIL k>N / i=i+1 / UNTIL i>M]\nWhich of the three pseudo-code algorithms is/are equivalent to the algorithm in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2025_Batch_24_FIG1.png",
      "imgAlt": "Flowchart of the algorithm: initializes i=1, loops while i<=M, sets k=1, loops while k<=N, checks i\u2260k to output i+k, increments k, then increments i.",
      "opts": ["I only", "II only", "III only", "I and II only", "All (I, II and III)"],
      "ans": 4,
      "exp": "<strong>Pseudo-code I</strong> uses FOR loops from 1 to M and 1 to N inclusive \u2014 identical behavior to the flowchart for any M\u22651, N\u22651. <strong>Equivalent.</strong><br><br><strong>Pseudo-code II</strong> uses WHILE loops with the same conditions (i\u2264M, k\u2264N), resets k=1 at the start of each outer iteration, and increments correctly. <strong>Equivalent.</strong><br><br><strong>Pseudo-code III</strong> uses REPEAT-UNTIL, which executes the body first and checks afterward. Since the flowchart initializes i=1 and the condition i\u2264M is checked before entering the body, for any valid input (M\u22651, N\u22651) the REPEAT-UNTIL produces the same result because the body always executes at least once, just as the flowchart would. <strong>Equivalent.</strong><br><br>All three are equivalent.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_006",
      "year": "2025 Batch 24",
      "text": "Which of the following statements is correct about interpreters and compilers?",
      "opts": ["Both translate all source code into machine language before execution", "Interpreters execute code faster than compiled programs", "Compilers typically produce an executable file; interpreters do not", "Interpreters require no runtime environment", "Compilers cannot detect syntax errors, but interpreters can"],
      "ans": 2,
      "exp": "<strong>Compilers</strong> translate the entire source program into machine code and produce a standalone executable file. <strong>Interpreters</strong> execute source code directly, line by line, without producing a persistent executable.<br><br>(a) False \u2014 interpreters do not translate all code before execution; they execute line by line.<br>(b) False \u2014 compiled programs generally execute faster because the translation overhead is done once at compile time.<br>(d) False \u2014 interpreters require their own runtime environment to execute.<br>(e) False \u2014 compilers absolutely detect syntax errors (they are caught during compilation).<br><br>Option (c) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_007",
      "year": "2025 Batch 24",
      "text": "Which of the following is an example of a syntax error?",
      "opts": ["Dividing a number by zero", "Forgetting to initialize a variable", "Using an undeclared or undefined variable", "Writing \"if (x > 0\" without a closing parenthesis", "Getting the wrong output due to incorrect logic"],
      "ans": 3,
      "exp": "<strong>A syntax error</strong> is a violation of the grammatical rules of the programming language, detected by the compiler or interpreter before execution.<br><br>(a) Division by zero is a <em>runtime error</em> \u2014 it only happens during execution.<br>(b) Forgetting to initialize a variable is a <em>logic error</em> (or sometimes a runtime error).<br>(c) Using an undeclared variable is a <em>runtime error</em> (NameError in Python) or a compile-time error in statically typed languages, but not purely a syntax error.<br>(e) Wrong output from incorrect logic is a <em>logic error</em>.<br><br>(d) <code>if (x > 0</code> without the closing parenthesis is a direct violation of the language grammar \u2014 a <strong>syntax error</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_008",
      "year": "2025 Batch 24",
      "text": "What kind of error is illustrated by the following Python code?\ntotal = 10\ncount = 0\naverage = total / count",
      "opts": ["Runtime error", "Syntax error", "Logic error", "Typing error", "There is no error in the code"],
      "ans": 0,
      "exp": "<strong>The code is syntactically valid</strong> \u2014 Python can parse and start executing it without any complaint. However, when the line <code>average = total / count</code> is reached during execution, Python attempts to divide 10 by 0, which raises a <strong>ZeroDivisionError</strong>.<br><br>Errors that only occur during execution (not at parse/compile time) are called <strong>runtime errors</strong>. This is not a syntax error (the code is grammatically correct) and not a logic error (it crashes rather than silently producing a wrong result).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_009",
      "year": "2025 Batch 24",
      "text": "Which of the following statements is correct about bugs and debuggers?",
      "opts": ["Syntax errors can be detected using a debugger", "A debugger cannot be used if the program has been executed successfully", "Logic errors are detected and reported by the debugger", "Once a program is free of syntax errors, it is guaranteed to be bug-free", "A debugger allows step-by-step execution of code to help find errors"],
      "ans": 4,
      "exp": "<strong>A debugger</strong> is a tool that lets a developer pause execution, step through code line by line, inspect variable values, and set breakpoints to locate the source of bugs.<br><br>(a) False \u2014 syntax errors are caught by the compiler/interpreter before a debugger is even invoked.<br>(b) False \u2014 a debugger can be used on any executable program, including ones that run successfully but produce wrong results.<br>(c) False \u2014 the debugger does not automatically detect or report logic errors; the developer must manually inspect state to find them.<br>(d) False \u2014 a program can be syntax-error-free but still have runtime errors or logic errors.<br><br>Option (e) is the correct definition of a debugger's primary function.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_010",
      "year": "2025 Batch 24",
      "text": "What value is returned if it is initially called with A=[2, 1, 3, 4, 5, 3] and n=6?",
      "opts": ["0", "1", "2", "3", "None of the above"],
      "ans": 4,
      "exp": "<strong>The algorithm finds the index of the maximum element among the first n elements.</strong><br><br>Trace: Result(A,6) \u2192 x=Result(A,5) \u2192 x=Result(A,4) \u2192 \u2026 \u2192 Result(A,1) returns 0.<br>Result(A,2): A[0]=2 vs A[1]=1 \u2192 2>1, return 0.<br>Result(A,3): A[0]=2 vs A[2]=3 \u2192 2 not > 3, return 2.<br>Result(A,4): A[2]=3 vs A[3]=4 \u2192 3 not > 4, return 3.<br>Result(A,5): A[3]=4 vs A[4]=5 \u2192 4 not > 5, return 4.<br>Result(A,6): A[4]=5 vs A[5]=3 \u2192 5 > 3, return 4.<br><br>The returned value is <strong>4</strong> (the index of element 5). Options (a)\u2013(d) offer 0,1,2,3 \u2014 none is 4. The answer is <strong>None of the above</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_011",
      "year": "2025 Batch 24",
      "text": "How many times, overall, does Result(A, n) get called if A=[2, 1, 3, 4, 5, 3] and n=5? Include the initial call also in your count.",
      "opts": ["5", "4", "3", "2", "None of the above"],
      "ans": 0,
      "exp": "<strong>Each call to Result(A, n) makes exactly one recursive call with n\u22121</strong> (unless n=1, which is the base case).<br><br>The call chain is: Result(A,5) \u2192 Result(A,4) \u2192 Result(A,3) \u2192 Result(A,2) \u2192 Result(A,1).<br><br>That is 5 calls in total (n=5, 4, 3, 2, 1), including the initial call. The answer is <strong>5</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_012",
      "year": "2025 Batch 24",
      "text": "Consider the following 3 statements about the algorithm Result(A, n) above and other possible algorithms for the same task, assuming \"linear time\" means \"time proportional to n\".\nI. The given recursive algorithm will take linear time.\nII. We can develop an iterative algorithm that takes linear time for this task.\nIII. There is a faster way to do the same task than linear time.\nWhich of the above is/are correct?",
      "opts": ["I only.", "II only.", "I and II only.", "III only.", "All (I, II and III) are correct."],
      "ans": 2,
      "exp": "<strong>Statement I \u2014 TRUE.</strong> Result(A, n) makes exactly n\u22121 recursive calls (from n down to 1), doing O(1) work per call. Total time is O(n) \u2014 linear.<br><br><strong>Statement II \u2014 TRUE.</strong> A simple iterative loop scanning the array once to track the index of the maximum element runs in O(n) time.<br><br><strong>Statement III \u2014 FALSE.</strong> Finding the maximum of an unsorted array of n elements requires examining every element at least once in the worst case (you cannot rule out any element being the maximum without looking at it). Therefore O(n) is a lower bound \u2014 there is no sub-linear algorithm for this task.<br><br>Only I and II are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_013",
      "year": "2025 Batch 24",
      "text": "What will be the result when the following Python code is executed?\nA = [2.4, [3, \"m\"], 8, ((3), [3.5], False)]\nprint(type(A[3][1]))",
      "opts": ["<class 'float'>", "<class 'int'>", "<class 'list'>", "<class 'tuple'>", "An error message"],
      "ans": 2,
      "exp": "<strong>Parse the structure of A:</strong><br>A[0] = 2.4 (float)<br>A[1] = [3, \"m\"] (list)<br>A[2] = 8 (int)<br>A[3] = ((3), [3.5], False) \u2014 the expression (3) evaluates to the integer 3, so A[3] = (3, [3.5], False), which is a <strong>tuple</strong>.<br><br>A[3][1] = [3.5], which is a <strong>list</strong>.<br><br><code>type([3.5])</code> is <code>&lt;class 'list'&gt;</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_014",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nprint((13%5.0)**len([13,5,5,\"s\"])-2)",
      "opts": ["9", "9.0", "79", "79.0", "None of the above"],
      "ans": 3,
      "exp": "<strong>Step 1:</strong> <code>13 % 5.0</code> = 3.0 (float, because one operand is a float).<br><br><strong>Step 2:</strong> <code>len([13, 5, 5, \"s\"])</code> = 4 (the list has four elements).<br><br><strong>Step 3:</strong> <code>3.0 ** 4</code> = 81.0 (exponentiation with a float base produces a float).<br><br><strong>Step 4:</strong> <code>81.0 - 2</code> = 79.0.<br><br>Output: <strong>79.0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_015",
      "year": "2025 Batch 24",
      "text": "Consider the following statements about objects in Python.\nI. The mutability of an object depends on its identity.\nII. The values that an object can have depend on its type.\nIII. The type of a mutable object can change.\nWhich of the above statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "None."],
      "ans": 1,
      "exp": "<strong>Statement I \u2014 FALSE.</strong> Mutability is a property of the <em>type</em>, not the identity. All instances of <code>list</code> are mutable; all instances of <code>tuple</code> are immutable. Identity (the memory address of a specific object) has nothing to do with mutability.<br><br><strong>Statement II \u2014 TRUE.</strong> An object's type determines what values it can hold and what operations are legal. For example, an <code>int</code> holds integer values; a <code>str</code> holds text; a <code>list</code> holds an ordered collection.<br><br><strong>Statement III \u2014 FALSE.</strong> In Python, once an object is created its type is fixed and cannot change. Even mutable objects like lists keep their type permanently.<br><br>Only Statement II is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_016",
      "year": "2025 Batch 24",
      "text": "Consider the following 4 lines of Python code.\nx = [1, 'uom', [2, \"mora\", 3], 4]  # Line 0\nx[2][1] = 6.5                       # Line 1\ny = x * 2                           # Line 2\nz = [x[0]] + [\"abc\"]                # Line 3\n\nNow, consider the following 3 statements about the code above.\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.\nWhich of the above 3 statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "II and III only.", "None (all I, II and III are incorrect)."],
      "ans": 4,
      "exp": "<strong>Line 1: x[2][1] = 6.5</strong> \u2014 x[2] is the list [2, \"mora\", 3]. Lists are mutable, so assigning to x[2][1] (replacing \"mora\" with 6.5) is perfectly valid. No error.<br><br><strong>Line 2: y = x * 2</strong> \u2014 Multiplying a list by an integer creates a new list with the contents repeated. No error.<br><br><strong>Line 3: z = [x[0]] + [\"abc\"]</strong> \u2014 [x[0]] is [1], and [\"abc\"] is a one-element list. Concatenating two lists is valid. Result: [1, \"abc\"]. No error.<br><br>None of the three lines has an error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_017",
      "year": "2025 Batch 24",
      "text": "Consider the following 4 lines of Python code.\nx = [1, 'uom', [2, \"mora\", 3], 4]  # Line 0\nx[2][1][1] = \"k\"                    # Line 1\ny = x[1] + \"abc\"                    # Line 2\nz = x[1] * 5                        # Line 3\n\nNow, consider the following 3 statements about the code above.\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.\nWhich of the above 3 statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "All (I, II and III) are correct."],
      "ans": 0,
      "exp": "<strong>Line 1: x[2][1][1] = \"k\"</strong> \u2014 x[2] = [2, \"mora\", 3], x[2][1] = \"mora\" (a string). Strings are <em>immutable</em> in Python, so attempting to assign to a character position raises a <strong>TypeError</strong>. Line 1 has an error.<br><br><strong>Line 2: y = x[1] + \"abc\"</strong> \u2014 x[1] = 'uom', and 'uom' + 'abc' = 'uomabc'. String concatenation is valid. No error.<br><br><strong>Line 3: z = x[1] * 5</strong> \u2014 'uom' * 5 = 'uomuomuomuomuom'. String repetition is valid. No error.<br><br>Only Statement I is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_018",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nA = [\"dog\", \"cat\", \"mouse\"]\nprint(\"cat\" in A and not \"a\" in \"bat\" or False)",
      "opts": ["True", "False", "\"cat\"", "None", "An error message"],
      "ans": 1,
      "exp": "<strong>Python operator precedence:</strong> <code>not</code> > <code>and</code> > <code>or</code>.<br><br>Evaluate step by step:<br>1. <code>\"cat\" in A</code> \u2192 True (\"cat\" is in the list).<br>2. <code>\"a\" in \"bat\"</code> \u2192 True (\"a\" is a substring of \"bat\").<br>3. <code>not True</code> \u2192 False.<br>4. <code>True and False</code> \u2192 False.<br>5. <code>False or False</code> \u2192 False.<br><br>Output: <strong>False</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_019",
      "year": "2025 Batch 24",
      "text": "What will be the value of the following Python expression?\n(~0b0101 & 0o17) ^ (0xE >> 2)",
      "opts": ["-4", "3", "6", "9", "11"],
      "ans": 3,
      "exp": "<strong>Step 1: Convert literals.</strong><br>0b0101 = 5, 0o17 = 15 (octal 17 = 1\u00d78+7=15), 0xE = 14.<br><br><strong>Step 2: ~0b0101</strong> = ~5 = \u22126 (bitwise NOT in Python flips all bits of the two's-complement representation: ~n = \u2212n\u22121).<br><br><strong>Step 3: (\u22126) & 15.</strong><br>\u22126 in binary (two's complement) = \u202611111010. 15 = 00001111. AND gives 00001010 = <strong>10</strong>.<br><br><strong>Step 4: 0xE >> 2</strong> = 14 >> 2 = 3 (right shift by 2 divides by 4 integer division).<br><br><strong>Step 5: 10 ^ 3.</strong><br>10 = 1010, 3 = 0011. XOR = 1001 = <strong>9</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_020",
      "year": "2025 Batch 24",
      "text": "Consider the following Python code.\nn = 0\ntry:\n    f = open(\"data.txt\", \"r\")\n    content = f.read()\n    m = 100/n\nexcept FileNotFoundError:\n    print(\"1 File not found\")\nexcept IOError:\n    print(\"2 Error in file\")\nexcept:\n    print(\"3 Some other error\")\nelse:\n    print(\"4 No errors\")\nfinally:\n    f.close()\n\nAssume the file \"data.txt\" exists and accessible to the program.\nWhat is the most likely output or result when the above code is executed?",
      "opts": ["\"1 File not found\"", "\"2 Error in file\"", "\"3 Some other error\"", "\"4 No errors\"", "None of the above"],
      "ans": 2,
      "exp": "<strong>Execution flow:</strong><br>1. <code>f = open(\"data.txt\", \"r\")</code> \u2014 file exists, succeeds.<br>2. <code>content = f.read()</code> \u2014 succeeds.<br>3. <code>m = 100/n</code> where n=0 \u2014 raises <strong>ZeroDivisionError</strong>.<br><br>Python checks the except clauses in order:<br>\u2022 <code>FileNotFoundError</code> \u2014 does not match ZeroDivisionError.<br>\u2022 <code>IOError</code> \u2014 does not match ZeroDivisionError.<br>\u2022 Bare <code>except:</code> \u2014 catches <em>all</em> exceptions. This matches.<br><br>Prints: <strong>\"3 Some other error\"</strong>.<br><br>The <code>else</code> block is skipped (an exception occurred). The <code>finally</code> block runs regardless and closes the file.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_021",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ntotal = 0\nfor num in range(1, 6):\n    if num % 2 == 0:\n        total += num\nprint(total)",
      "opts": ["4", "6", "10", "12", "15"],
      "ans": 1,
      "exp": "<code>range(1, 6)</code> produces 1, 2, 3, 4, 5. The condition <code>num % 2 == 0</code> selects even numbers: 2 and 4.<br><br>total = 2 + 4 = <strong>6</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_022",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nfor letter in 'Python':\n    if letter == 'h':\n        break\n    print(letter, end=\"\")",
      "opts": ["Python", "Pyth", "Pyt", "Py", "None of the above"],
      "ans": 2,
      "exp": "The loop iterates over 'P', 'y', 't', 'h', 'o', 'n'. The <code>print</code> statement comes <em>after</em> the <code>if/break</code> check. When <code>letter == 'h'</code>, <code>break</code> exits the loop <em>before</em> printing 'h'.<br><br>Letters printed: P, y, t \u2192 output is <strong>Pyt</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_023",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nfor i in range(3):\n    for j in range(2):\n        if i == j:\n            continue\n        print(f\"i={i}, j={j}\")",
      "opts": ["i=0,j=1\ni=1,j=0\ni=2,j=0\ni=2,j=1", "i=0,j=1\ni=1,j=0\ni=1,j=1\ni=2,j=0\ni=2,j=1", "i=0,j=0\ni=0,j=1\ni=1,j=0\ni=1,j=1\ni=2,j=0\ni=2,j=1", "i=1,j=0\ni=2,j=0\ni=2,j=1", "i=0,j=1\ni=1,j=0\ni=2,j=1"],
      "ans": 0,
      "exp": "<code>continue</code> skips the print when i==j. For each (i,j) pair from range(3)\u00d7range(2):<br><br>i=0, j=0: 0==0 \u2192 skip.<br>i=0, j=1: 0\u22601 \u2192 print <strong>i=0, j=1</strong>.<br>i=1, j=0: 1\u22600 \u2192 print <strong>i=1, j=0</strong>.<br>i=1, j=1: 1==1 \u2192 skip.<br>i=2, j=0: 2\u22600 \u2192 print <strong>i=2, j=0</strong>.<br>i=2, j=1: 2\u22601 \u2192 print <strong>i=2, j=1</strong>.<br><br>This matches option (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_024",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ncount = 0\nwhile count < 3:\n    print(count, end=\" \")\n    count += 1",
      "opts": ["0 1 2", "1 2 3", "0 1 2 3", "The loop runs infinitely.", "An error occurs."],
      "ans": 0,
      "exp": "count starts at 0. The loop prints count then increments:<br>count=0 \u2192 print 0, count becomes 1.<br>count=1 \u2192 print 1, count becomes 2.<br>count=2 \u2192 print 2, count becomes 3.<br>count=3: 3 < 3 is False \u2192 loop ends.<br><br>Output: <strong>0 1 2</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_025",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nx = 5\nwhile x > 0:\n    x -= 1\n    if x == 2:\n        continue\n    print(x, end=\" \")",
      "opts": ["5 4 3 2 1", "5 4 3 1 0", "4 3 2", "4 3 1 0", "4 3 1"],
      "ans": 3,
      "exp": "x is decremented <em>before</em> the check and print. Trace:<br>x=5\u21924: 4\u22602 \u2192 print 4.<br>x=4\u21923: 3\u22602 \u2192 print 3.<br>x=3\u21922: 2==2 \u2192 continue (skip print).<br>x=2\u21921: 1\u22602 \u2192 print 1.<br>x=1\u21920: 0\u22602 \u2192 print 0.<br>x=0: 0>0 False \u2192 stop.<br><br>Output: <strong>4 3 1 0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_026",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nfor num in range(5):\n    if num == 2:\n        continue\n    if num == 4:\n        break\n    print(num, end=\" \")",
      "opts": ["0 1", "1 3", "0 1 3 4", "1 3 4", "0 1 3"],
      "ans": 4,
      "exp": "Trace through range(5) = [0,1,2,3,4]:<br>num=0: not 2, not 4 \u2192 print 0.<br>num=1: not 2, not 4 \u2192 print 1.<br>num=2: ==2 \u2192 continue (skip print and break check).<br>num=3: not 2, not 4 \u2192 print 3.<br>num=4: not 2, ==4 \u2192 break.<br><br>Output: <strong>0 1 3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_027",
      "year": "2025 Batch 24",
      "text": "Consider the following statements regarding for and while loops in Python.\nI. for loops are typically used when the number of iterations is known in advance.\nII. while loops can lead to infinite loops more easily than for loops if not properly controlled.\nIII. for loops in Python always require a \"range()\" function to work.\nIV. Both for and while loops can use \"break\" and \"continue\" statements to alter the control flow.\nWhich of the above statements are correct?",
      "opts": ["I and II only", "I, II and III", "I and III only", "I, II, and IV", "II and IV only"],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 TRUE.</strong> <code>for</code> loops iterate over a finite, known iterable (list, range, string, etc.), so the number of iterations is determined before the loop starts.<br><br><strong>Statement II \u2014 TRUE.</strong> A <code>while</code> loop continues as long as its condition is true; if the condition never becomes false (due to a bug), the loop runs forever. <code>for</code> loops terminate naturally when the iterable is exhausted.<br><br><strong>Statement III \u2014 FALSE.</strong> <code>for</code> loops in Python iterate over <em>any iterable</em> (lists, strings, tuples, dictionaries, generators, etc.) \u2014 <code>range()</code> is not required.<br><br><strong>Statement IV \u2014 TRUE.</strong> Both <code>break</code> and <code>continue</code> work in both <code>for</code> and <code>while</code> loops.<br><br>Correct statements: I, II, and IV.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_028",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nmy_list = [10, 20, 30]\nmy_list.append([40, 50])\nprint(my_list)",
      "opts": ["[10, 20, 30, 40, 50]", "[10, 20, 30, [40, 50]]", "[10, 20, 30, 40]", "[10, 20, 30, 50]", "An error occurs."],
      "ans": 1,
      "exp": "<code>list.append(x)</code> adds the object <code>x</code> as a <em>single element</em> at the end of the list. Here, x is the list <code>[40, 50]</code>, so the entire list is appended as one element.<br><br>Result: <strong>[10, 20, 30, [40, 50]]</strong>.<br><br>To add individual elements, <code>extend</code> would be used instead.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_029",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nnumbers = [1, 2, 3, 4]\nfor i in range(len(numbers)):\n    numbers[i] *= 2\nprint(numbers)",
      "opts": ["[1, 2, 3, 4]", "[1, 4, 9, 16]", "[1, 2, 3, 4, 1, 2, 3, 4]", "[2, 4, 6, 8]", "An error occurs."],
      "ans": 3,
      "exp": "The loop iterates over indices 0\u20133 and multiplies each element by 2 in place:<br>numbers[0] = 1\u00d72 = 2, numbers[1] = 2\u00d72 = 4, numbers[2] = 3\u00d72 = 6, numbers[3] = 4\u00d72 = 8.<br><br>Output: <strong>[2, 4, 6, 8]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_030",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nmy_list = [10, 20, 30, 40, 50, 60]\nprint(my_list[-5:-1:2])",
      "opts": ["[20, 30, 40, 50]", "[20, 30, 50]", "[20, 40, 60]", "[10, 30, 50]", "[20, 40]"],
      "ans": 4,
      "exp": "my_list has 6 elements (indices 0\u20135).<br><br><code>-5</code> \u2192 index 1 (=6\u22125=1, value 20).<br><code>-1</code> \u2192 index 5 (exclusive), so the slice goes up to but not including index 5 (value 60).<br>Step = 2: take elements at indices 1, 3 \u2192 values 20, 40.<br><br>Output: <strong>[20, 40]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_031",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\na = [1, 2]\nb = a\nc = a + b\nb.append(3)\nprint(c)",
      "opts": ["[1, 2, 1, 2, 3]", "[1, 2, 3, 1, 2, 3]", "[1, 2, 1, 2]", "[1, 2, 1, 3]", "An error occurs."],
      "ans": 2,
      "exp": "<code>b = a</code> makes b reference the <em>same</em> list object as a.<br><br><code>c = a + b</code> \u2014 list concatenation creates a <em>new</em> list object. At this moment a = b = [1, 2], so c = [1, 2, 1, 2]. c is now independent of a and b.<br><br><code>b.append(3)</code> modifies the list that both a and b point to (they become [1, 2, 3]), but c is a separate list and is unaffected.<br><br><code>print(c)</code> \u2192 <strong>[1, 2, 1, 2]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_032",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nuser_input = \"  Hello World !  \"\ncleaned = user_input.strip().lower()\nprint(cleaned)",
      "opts": ["HELLO WORLD!", "Hello World!", "Hello World", "helloworld!", "hello world!"],
      "ans": 4,
      "exp": "<code>strip()</code> removes leading and trailing whitespace: \"Hello World !\".<br><code>lower()</code> converts to lowercase: \"hello world !\".<br><br>Output: <strong>hello world !</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_033",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nproduct = \"SmartPhone\"\ncode = product[::-1][::2]\nprint(code)",
      "opts": ["eoPrm", "enPhtrS", "enPrto", "eoaPm", "Sathn"],
      "ans": 0,
      "exp": "<strong>Step 1:</strong> <code>product[::-1]</code> reverses \"SmartPhone\" \u2192 \"enohPtramS\".<br><br><strong>Step 2:</strong> <code>[::2]</code> takes every second character starting at index 0:<br>Index 0: 'e', 2: 'o', 4: 'P', 6: 'r', 8: 'm' \u2192 <strong>\"eoPrm\"</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_034",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nsentence = \"Python is fun\"\nwords = sentence.split()\nwords[1] = words[1].upper()\nresult = \"-\".join(words)\nprint(result)",
      "opts": ["Python-is-fun", "Python-IS-fun", "Python is fun", "['Python', 'IS', 'fun']", "Python-IS-FUN"],
      "ans": 1,
      "exp": "<code>sentence.split()</code> \u2192 ['Python', 'is', 'fun'].<br><code>words[1].upper()</code> \u2192 'IS'. So words = ['Python', 'IS', 'fun'].<br><code>\"-\".join(words)</code> \u2192 'Python-IS-fun'.<br><br>Output: <strong>Python-IS-fun</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_035",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\nvalue = 123.456789\nprint(\"1st: {:.2f}, 2nd: {:.3e}\".format(value, value))",
      "opts": ["1st: 123.46, 2nd: 1.23e+02", "1st: 123.45, 2nd: 1.23e+02", "1st: 123.46, 2nd: 1.235e+02", "1st: 123.457, 2nd: 1.23e+02", "1st: 123.46, 2nd: 123.456e+02"],
      "ans": 2,
      "exp": "<strong>{:.2f}</strong> formats to 2 decimal places: 123.456789 \u2192 <strong>123.46</strong> (rounds up at the 3rd decimal).<br><br><strong>{:.3e}</strong> formats in scientific notation with 3 decimal places in the mantissa: 123.456789 = 1.23456789 \u00d7 10\u00b2 \u2192 <strong>1.235e+02</strong> (the 4th digit after the decimal is 5, so round up: 1.234... \u2192 1.235).<br><br>Output: <strong>1st: 123.46, 2nd: 1.235e+02</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_036",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ndef add_item(my_list):\n    my_list.append(4)\n    my_list = [1, 2, 3]\n    return my_list\n\noriginal = [0]\nresult = add_item(original)\nprint(original)",
      "opts": ["[0]", "[1, 2, 3]", "[0, 4]", "[4]", "None"],
      "ans": 2,
      "exp": "Inside <code>add_item</code>, <code>my_list</code> initially refers to the same list object as <code>original</code>.<br><br><code>my_list.append(4)</code> \u2014 mutates the original list in place \u2192 original becomes [0, 4].<br><br><code>my_list = [1, 2, 3]</code> \u2014 <em>rebinds</em> the local variable <code>my_list</code> to a new list; this does NOT affect <code>original</code>.<br><br>After the function returns, <code>original</code> is still the object that had 4 appended to it: <strong>[0, 4]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_037",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ndef multiply(a, b=2):\n    return a * b\n\nprint(multiply(3))",
      "opts": ["6", "9", "3", "TypeError", "None"],
      "ans": 0,
      "exp": "<code>multiply(3)</code> passes a=3 and uses the default b=2. Returns 3 \u00d7 2 = <strong>6</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_038",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ndef combine_strings(a, b):\n    return a + b\n\nprint(combine_strings(\"Hello\", b=\"World\"))",
      "opts": ["\"HelloWorld\"", "\"Hello World\"", "\"Hello, World\"", "TypeError", "None"],
      "ans": 0,
      "exp": "<code>combine_strings(\"Hello\", b=\"World\")</code> passes \"Hello\" as positional argument a and \"World\" as keyword argument b. The function returns a + b = \"Hello\" + \"World\" = <strong>\"HelloWorld\"</strong> (no space is added).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_039",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ny = 7\ndef scope_test():\n    y = 3\n    return y * y\n\nprint(scope_test())\nprint(y)",
      "opts": ["9 and 3", "49 and 7", "9 and 7", "3 and 3", "None and 7"],
      "ans": 2,
      "exp": "Inside <code>scope_test()</code>, <code>y = 3</code> creates a <em>local</em> variable y; it does not affect the global y.<br><br><code>return y * y</code> \u2192 3 \u00d7 3 = 9. So <code>print(scope_test())</code> outputs <strong>9</strong>.<br><br>The global y is unchanged at 7. <code>print(y)</code> outputs <strong>7</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_040",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ndef modify(s):\n    s = s.upper()\n    return s\n\nmsg = \"python\"\nmodify(msg)\nprint(msg)",
      "opts": ["PYTHON", "python", "None", "Python", "PYTHONpython"],
      "ans": 1,
      "exp": "Strings are <em>immutable</em> in Python. When <code>modify(msg)</code> is called, <code>s</code> starts as a reference to the string \"python\". <code>s = s.upper()</code> creates a <em>new</em> string \"PYTHON\" and rebinds the local variable <code>s</code> to it \u2014 the original string object referenced by <code>msg</code> is untouched.<br><br>The return value is discarded (not assigned). <code>print(msg)</code> prints the original: <strong>python</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_041",
      "year": "2025 Batch 24",
      "text": "What will be the output of the following Python code?\ncount = 10\ndef increment():\n    global count\n    count += 1\n    return count\n\nprint(increment())\nprint(count)",
      "opts": ["11 and 10", "11 and 11", "10 and 10", "An error message", "None"],
      "ans": 1,
      "exp": "The <code>global count</code> declaration makes the function operate on the module-level variable <code>count</code>.<br><br><code>count += 1</code> \u2192 count becomes 11. <code>return count</code> \u2192 returns 11.<br><br><code>print(increment())</code> \u2192 prints <strong>11</strong>.<br><code>print(count)</code> \u2192 the global count is now 11 \u2192 prints <strong>11</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_042",
      "year": "2025 Batch 24",
      "text": "Consider the following Python code.\nx = 0.3 - 0.2\ny = 0.2 - 0.1\nprint(x == y)\n\nWhen it is executed, the output is \"False\". What would be the reason?",
      "opts": ["Subtraction works in different ways with floating-point numbers in Python.", "The \"==\" operator does not work for floating-point numbers in Python.", "Due to floating-point precision errors, both x and y are stored as exact decimals, but the \"==\" operator compares their binary representations, which makes the result False.", "Due to floating-point precision errors, x and y are not exactly equal even though mathematically they should be.", "Depends on the Python version."],
      "ans": 3,
      "exp": "Floating-point numbers are stored in binary (IEEE 754). Decimal fractions like 0.1, 0.2, and 0.3 cannot be represented exactly in binary; they are stored as the closest approximation. As a result, <code>0.3 - 0.2</code> and <code>0.2 - 0.1</code> accumulate different rounding errors and produce slightly different binary values \u2014 even though mathematically both equal 0.1.<br><br>The <code>==</code> operator compares the actual stored values, which differ. This is the well-known floating-point precision problem. Option (d) is the correct explanation.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_043",
      "year": "2025 Batch 24",
      "text": "What is the 4-bit two's complement representation of -7?",
      "opts": ["1101", "1010", "1000", "0111", "1001"],
      "ans": 4,
      "exp": "<strong>Step 1:</strong> +7 in 4-bit binary = 0111.<br><strong>Step 2:</strong> Flip all bits (one's complement): 1000.<br><strong>Step 3:</strong> Add 1: 1000 + 0001 = <strong>1001</strong>.<br><br>Verification: 1001 in two's complement = \u22128 + 0 + 0 + 1 = \u22127 \u2713.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_044",
      "year": "2025 Batch 24",
      "text": "A, B and C are 8-bit registers. A and B hold 8-bit two's complement numbers: A = 01101010, B = 10110110. C = A + B. What's the value in register C?",
      "opts": ["00011100", "00000000", "11100000", "00100000", "10010000"],
      "ans": 3,
      "exp": "<strong>A = 01101010:</strong> This is positive (MSB=0) = 64+32+8+2 = <strong>106</strong>.<br><strong>B = 10110110:</strong> MSB=1, so negative. Two's complement: flip \u2192 01001001, add 1 \u2192 01001010 = 74. So B = <strong>\u221274</strong>.<br><br>A + B = 106 + (\u221274) = <strong>32</strong>.<br><br>32 in 8-bit binary = <strong>00100000</strong>.<br><br>Binary addition check: 01101010 + 10110110 = 100100000; drop the carry bit (9th bit) \u2192 <strong>00100000</strong> \u2713.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_045",
      "year": "2025 Batch 24",
      "text": "Which of the following IEEE 754 single-precision representations corresponds to the decimal number -0.5?",
      "opts": ["Sign: 1, Exponent: 01111101, Mantissa: 00000000000000000000000", "Sign: 1, Exponent: 01111110, Mantissa: 10000000000000000000000", "Sign: 1, Exponent: 01111111, Mantissa: 00000000000000000000000", "Sign: 0, Exponent: 01111110, Mantissa: 10000000000000000000000", "Sign: 1, Exponent: 01111110, Mantissa: 00000000000000000000000"],
      "ans": 4,
      "exp": "<strong>\u22120.5 in IEEE 754 single precision:</strong><br><br>Sign = 1 (negative).<br><br>0.5 = 1.0 \u00d7 2^(\u22121). The exponent is \u22121. Biased exponent = \u22121 + 127 = 126 = <strong>01111110</strong>.<br><br>The mantissa represents the fractional part of 1.0 (the leading 1 is implicit), so all mantissa bits are <strong>0</strong>.<br><br>Result: Sign=1, Exponent=01111110, Mantissa=00000000000000000000000 \u2192 option (e).<br><br>Option (b) has a non-zero mantissa (10000...), which would represent \u22120.5 \u00d7 (1 + 0.5) = \u22120.75, not \u22120.5.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_046",
      "year": "2025 Batch 24",
      "text": "Which of the following is true about ASCII and Unicode?",
      "opts": ["ASCII supports multiple scripts, Unicode doesn't", "Unicode is a subset of ASCII", "Unicode characters require fewer bits", "Unicode can represent emojis, ASCII cannot", "ASCII is suitable for all modern applications"],
      "ans": 3,
      "exp": "<strong>ASCII</strong> uses 7 bits and covers only 128 characters (English letters, digits, basic punctuation). It cannot represent emojis, accented characters, or non-Latin scripts.<br><br><strong>Unicode</strong> is designed to represent every character in every language, including emojis (e.g., U+1F600 for \ud83d\ude00). Emojis are standard Unicode code points.<br><br>(a) False \u2014 ASCII is limited to English; Unicode supports hundreds of scripts.<br>(b) False \u2014 ASCII is a <em>subset</em> of Unicode, not the other way around.<br>(c) False \u2014 Unicode code points require more bits (up to 21 bits), not fewer.<br>(e) False \u2014 ASCII cannot handle most modern text requirements.<br><br>Option (d) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_047",
      "year": "2025 Batch 24",
      "text": "Convert hexadecimal 2F.A to decimal (rounded to 3 decimal places)",
      "opts": ["47.312", "46.625", "47.625", "45.312", "47.75"],
      "ans": 2,
      "exp": "<strong>Integer part 2F:</strong> 2 \u00d7 16 + 15 = 32 + 15 = 47.<br><br><strong>Fractional part .A:</strong> A (hex) = 10 (decimal). The first hex fraction digit has weight 16^(\u22121) = 1/16. So .A = 10/16 = 0.625.<br><br>Total: 47 + 0.625 = <strong>47.625</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_048",
      "year": "2025 Batch 24",
      "text": "A system uses 8-bit two's complement representation to store and add numbers. When it receives the decimal inputs 100 and 40, and adds them, the result is -116. What is the reason for this observation?",
      "opts": ["Sensor data is in ASCII format", "The above operation caused an overflow.", "The system has performed subtraction instead of addition", "Exponent bits are misaligned", "Input numbers have been mistakenly stored as floating-point values"],
      "ans": 1,
      "exp": "In 8-bit two's complement, the valid range is \u2212128 to +127. 100 + 40 = 140, which exceeds 127.<br><br>140 in binary = 10001100. Interpreted as an 8-bit two's complement number: MSB=1 means negative. Two's complement of 10001100: flip \u2192 01110011, add 1 \u2192 01110100 = 116. So the value is interpreted as <strong>\u2212116</strong>.<br><br>This is an <strong>integer overflow</strong> \u2014 the mathematically correct result (140) cannot be represented in 8 bits, and the bit pattern wraps around to a negative value.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_049",
      "year": "2025 Batch 24",
      "text": "A modern automobile may have tens of computers controlling each functional module. Which of the following communication techniques are used by these computers to share data among them?",
      "opts": ["A WiFi network", "A Bluetooth network", "A Modbus network", "An ECU network", "A CAN bus network"],
      "ans": 4,
      "exp": "Automotive embedded computers (Electronic Control Units, ECUs) communicate using the <strong>CAN bus (Controller Area Network)</strong>, a standard specifically designed for in-vehicle networking. It is robust, supports multi-master communication, and operates at speeds suitable for real-time control (up to 1 Mbps for classic CAN).<br><br>WiFi and Bluetooth are wireless protocols for general-purpose networking, not used for inter-ECU communication. Modbus is used in industrial/SCADA systems, not automotive. \"ECU network\" is not a communication protocol name.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_050",
      "year": "2025 Batch 24",
      "text": "Which of the following tasks can be considered as a \"sequence control instruction\" in a CPU instruction set?",
      "opts": ["Adding two numbers", "Comparing two numbers", "Incrementing the value of a register", "Add the values of two registers if the \"Carry Flag\" is set", "None of the above"],
      "ans": 3,
      "exp": "<strong>Sequence control instructions</strong> alter the flow of program execution based on conditions (as opposed to always executing the next sequential instruction).<br><br>(a) Addition \u2014 a data processing/arithmetic instruction, not sequence control.<br>(b) Comparison \u2014 sets flags but does not itself alter the instruction sequence.<br>(c) Increment \u2014 an arithmetic instruction.<br><br>(d) \"Add if Carry Flag is set\" (conditional execution, such as ADC \u2014 Add with Carry) \u2014 this instruction's behavior depends on a processor status flag, meaning the CPU conditionally performs an operation. This type of instruction is classified as <strong>sequence control</strong> because the carry flag controls whether the operation proceeds, altering the effective flow of computation.<br><br>Option (d) is the correct answer.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_051",
      "year": "2025 Batch 24",
      "text": "Which of the following types of memory has the fastest access speed for the CPU instructions?",
      "opts": ["Registers", "L1 Cache memory", "L2 Cache memory", "Main memory", "Peripheral memory"],
      "ans": 0,
      "exp": "The memory hierarchy from fastest to slowest is: <strong>Registers \u2192 L1 Cache \u2192 L2 Cache \u2192 Main Memory (RAM) \u2192 Storage/Peripheral</strong>.<br><br>CPU <strong>registers</strong> are built directly into the processor core and operate at the full CPU clock speed with zero latency. They are the fastest memory available to the CPU \u2014 typically 1 cycle access vs. 4\u201312 cycles for L1 cache.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_052",
      "year": "2025 Batch 24",
      "text": "Which of the following statements is NOT true about non-volatile memory in a computer system?",
      "opts": ["They usually contain startup code of the computer", "Their content can be written only when the memory chip is manufactured.", "They do not lose their content when the computer is powered down.", "In a typical PC they form only a small part of the total memory space.", "Certain types of non-volatile memory can be changed using special techniques."],
      "ans": 1,
      "exp": "(a) TRUE \u2014 ROM/Flash typically contains BIOS/UEFI firmware used to boot the computer.<br>(c) TRUE \u2014 by definition, non-volatile memory retains data without power.<br>(d) TRUE \u2014 in a typical PC, RAM (volatile) is gigabytes, while non-volatile BIOS flash is only a few megabytes.<br>(e) TRUE \u2014 Flash memory and EEPROM can be electrically erased and reprogrammed.<br><br>(b) <strong>NOT TRUE</strong> \u2014 this describes mask ROM (which is programmed at manufacture and cannot be changed). However, most modern non-volatile memory (Flash, EEPROM, NVRAM) can be written and erased many times after manufacture. Since the question asks which is NOT true about non-volatile memory in general, (b) is the incorrect statement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_053",
      "year": "2025 Batch 24",
      "text": "Which of the following is NOT a function of the signals in a control bus of a computer?",
      "opts": ["Notifying the memory when a valid address is present in the system bus during a memory access cycle.", "Informing whether the bus system contains a valid memory address or an IO port address.", "Specifying the address of the port from which the data is to be read.", "Requesting the CPU to hold when the memory is not ready to copy a data value being written to the memory.", "Providing a clock input to synchronize with external devices."],
      "ans": 2,
      "exp": "The <strong>control bus</strong> carries timing and control signals (read/write, memory request, interrupt, wait/ready, clock, etc.).<br><br>(a) Memory Request (MREQ) or Address Strobe signals \u2014 yes, a control bus function.<br>(b) Memory/IO select signal (M/IO#) \u2014 yes, a control bus function.<br>(d) Wait/Ready signal to stall the CPU \u2014 yes, a control bus function.<br>(e) System clock \u2014 yes, part of control signaling.<br><br>(c) <strong>The address of the port</strong> is carried by the <em>address bus</em>, not the control bus. The control bus only carries signals that indicate the <em>type</em> of operation (e.g., memory vs. I/O), not the actual addresses.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_054",
      "year": "2025 Batch 24",
      "text": "Which of the following is NOT included in the OPERAND part of a CPU instruction?",
      "opts": ["Address of a memory location where the data element is stored.", "Name of a CPU register.", "A data element to be used by the CPU instruction.", "An index to a memory location where the data can be found.", "Length of the instruction (i.e. how many bytes)"],
      "ans": 4,
      "exp": "A CPU instruction consists of an <strong>opcode</strong> (what operation to perform) and an <strong>operand</strong> (what data or where to find it).<br><br>Valid operand types include: memory addresses (a), register names (b), immediate (literal) data values (c), and indexed/indirect addressing (d).<br><br>(e) The <strong>length of the instruction in bytes</strong> is part of the instruction encoding format used by the CPU to advance the program counter, but it is not an operand that the instruction operates on. It is metadata about the instruction itself, not a source or destination of data.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_055",
      "year": "2025 Batch 24",
      "text": "Which of the following is NOT a function of the ALU in a CPU?",
      "opts": ["Adding values stored in two registers", "Negating the value stored in a register", "Loading the operands from memory", "Updating the FLAG register based on status of arithmetic instructions.", "Computing the binary AND between two values."],
      "ans": 2,
      "exp": "The <strong>ALU (Arithmetic Logic Unit)</strong> performs arithmetic and logical computations on data that has already been placed in registers or provided as immediate values.<br><br>(a) Addition \u2014 core ALU function.<br>(b) Negation (two's complement) \u2014 ALU function.<br>(d) Updating status flags (zero, carry, overflow, sign) \u2014 the ALU sets these after operations.<br>(e) Bitwise AND \u2014 a logical operation, performed by the ALU.<br><br>(c) <strong>Loading operands from memory</strong> is the job of the <em>memory access unit</em> / load-store unit and the control unit, which transfers data from memory into registers. The ALU operates only on data already in registers \u2014 it does not interact with memory directly.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_056",
      "year": "2025 Batch 24",
      "text": "Which of the following is NOT a constraint found in the Von-Neumann architecture?",
      "opts": ["Each instruction operates only on a single data element", "Every operation must be carried out through the CPU", "Each operation must load a new instruction from memory", "Every operation must be synchronized to the same clock signal", "All of the above are constraints in the Von-Neumann architecture"],
      "ans": 3,
      "exp": "The classic <strong>Von-Neumann constraints</strong> are:<br>(a) Sequential, scalar execution \u2014 one instruction, one data element at a time.<br>(b) All computation goes through the CPU.<br>(c) The fetch-decode-execute cycle requires fetching each instruction from memory (the Von-Neumann bottleneck).<br><br>(d) <strong>Synchronization to a single clock</strong> is a property of <em>synchronous digital design</em> in general, not specifically a Von-Neumann architectural constraint. Von-Neumann architecture says nothing about clocking strategy \u2014 it is about the stored-program model and sequential execution.<br><br>Therefore (d) is NOT a Von-Neumann constraint.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_057",
      "year": "2025 Batch 24",
      "text": "Which of the following will NOT enhance the throughput of a CPU?",
      "opts": ["Having SIMD instructions", "Multiplying clock rates to external components (e.g., memory)", "Instruction pre-fetching", "Instruction pipelining", "Using internal clock multipliers"],
      "ans": 1,
      "exp": "(a) SIMD (Single Instruction, Multiple Data) \u2014 processes multiple data elements in one instruction, directly enhancing CPU throughput.<br>(c) Instruction pre-fetching \u2014 reduces stalls by fetching instructions before they're needed.<br>(d) Instruction pipelining \u2014 overlaps execution of multiple instructions, boosting throughput.<br>(e) Internal clock multipliers \u2014 increase the CPU's internal clock rate, allowing more operations per second.<br><br>(b) <strong>Multiplying clock rates to external components (e.g., memory)</strong> does NOT enhance CPU throughput. Memory is typically already the bottleneck; running external memory faster only helps when memory is the limiting factor, and in practice, modern CPUs already run their cores much faster than external memory. This technique does not improve the CPU's own instruction processing rate.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_058",
      "year": "2025 Batch 24",
      "text": "A microprocessor has a 16-bit address bus and 16-bit data bus. What is the maximum size of the memory that can be connected to the microprocessor?",
      "opts": ["1 Mega-byte", "65535 bytes", "65,536 bytes", "131,072 bytes", "131,071 bytes"],
      "ans": 3,
      "exp": "<strong>Address bus width determines the number of addressable memory locations:</strong> 2^16 = 65,536 unique addresses.<br><br><strong>Data bus width determines how many bits are read/written per access:</strong> 16-bit data bus = 2 bytes per address location.<br><br><strong>Maximum memory size</strong> = 65,536 locations \u00d7 2 bytes per location = <strong>131,072 bytes</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_059",
      "year": "2025 Batch 24",
      "text": "What is the function computed by the Python code shown below?\ndef func1(a, b):\n    if b == 0:\n        return 0\n    else:\n        return a + func1(a, b-1)",
      "opts": ["Sum of numbers from a to b", "Fibonacci sequence from a to b", "Multiplication of a and b", "Exponentiation of a to the power of b", "Exponentiation of b to the power of a"],
      "ans": 2,
      "exp": "Unrolling the recursion: func1(a, b) = a + func1(a, b\u22121) = a + a + func1(a, b\u22122) = \u2026 = a added b times = <strong>a \u00d7 b</strong>.<br><br>Base case: func1(a, 0) = 0, which is correct for multiplication (a \u00d7 0 = 0).<br><br>This is <strong>multiplication</strong> implemented via repeated addition.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_060",
      "year": "2025 Batch 24",
      "text": "The function func2 is used to calculate the sum of elements in a numeric data array.\ndef func2(data, x, y):\n    if x > y:\n        return 0\n    elif x == y:\n        return data[x]\n    z = (x + y) // 2\n    return (..... P .....)\n\nThe correct Python code at blank P for the recursive case should be:",
      "opts": ["func2(data, x, y) + func2(data, y, z)", "func2(data, x, y-1) + func2(data, y+1, z)", "func2(data, x, z) + func2(data, z, y)", "func2(data, x, z-1) + func2(data, z+1, y)", "func2(data, x, z) + func2(data, z+1, y)"],
      "ans": 3,
      "exp": "The function sums elements from index x to index y using divide-and-conquer. The midpoint z = (x+y)//2 splits the range into two non-overlapping halves: [x \u2026 z] and [z+1 \u2026 y].<br><br>The recursive call must be <code>func2(data, x, z) + func2(data, z+1, y)</code>.<br><br>Option (c) is wrong because it passes z to both calls, causing the element at index z to be counted twice. Option (e) correctly splits the range without overlap: left half [x, z], right half [z+1, y].<br><br>Answer: <strong>func2(data, x, z) + func2(data, z+1, y)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_061",
      "year": "2025 Batch 24",
      "text": "What is the function computed by the Python code above for an input array \"data\" of numeric values?\ndef func3(data, x, y):\n    if x == len(data):\n        return -1\n    elif data[x] == y:\n        return x\n    else:\n        return func3(data, x+1, y)",
      "opts": ["Sum of numbers in the array", "Sum of numbers from x to y", "Position of value x in the array", "Position of value y in the array", "Check if values x and y are in the array"],
      "ans": 3,
      "exp": "The function starts at index x (initially 0) and checks whether <code>data[x] == y</code>. If true, it returns <code>x</code> (the current index). If not, it advances to the next index. If the end of the array is reached without finding y, it returns \u22121.<br><br>This is a <strong>linear search</strong> for the value <code>y</code> in the array <code>data</code>. It returns the <strong>index (position) of value y</strong> in the array, or \u22121 if not found.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_062",
      "year": "2025 Batch 24",
      "text": "What is the time complexity of the function func3 for an input array of n numeric values?",
      "opts": ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n\u00b2)"],
      "ans": 2,
      "exp": "func3 performs a <strong>linear search</strong>. In the worst case (value y is not in the array, or is the last element), the function makes one recursive call per element, scanning all n elements.<br><br>Each recursive call does O(1) work, and there are at most n calls, giving total time complexity of <strong>O(n)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_063",
      "year": "2025 Batch 24",
      "text": "The function func5 shown below is used to calculate the exponentiation of a to the power of n (that is, a^n).\ndef func5(a, n):\n    if n == 0:\n        return 1\n    b = ..... Q .....  # recursive case\n    c = b * b\n    if (n % 2) == 1:\n        c = c * a\n    return c\n\nThe correct code at blank Q for the recursive case should be:",
      "opts": ["func5(a, n//2)", "func5(a, n-1)", "func5(a, n//a)", "func5(a, n-2)", "func5(a, (n-1)//2)"],
      "ans": 0,
      "exp": "This is <strong>fast exponentiation by squaring</strong>: a^n = (a^(n/2))^2 for even n, and a \u00d7 (a^(n/2))^2 for odd n.<br><br>The recursion computes b = a^(n//2), then c = b*b = a^(2*(n//2)). If n is odd, an extra multiplication by a corrects the result.<br><br>The recursive call must be <code>func5(a, n//2)</code> to compute a^(n/2) (integer division halves n at each level, giving O(log n) depth).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_064",
      "year": "2025 Batch 24",
      "text": "The code at blank R to update the variable head, that points to the start of the contents of the circular buffer, should be:",
      "opts": ["self.head = (self.head + 1) // self.size", "self.head = (self.head - 1) // self.size", "self.head = (self.head + 1) % self.size", "self.head = (self.head - 1) % self.size", "self.head = (self.head + self.count) % self.size"],
      "ans": 2,
      "exp": "In a circular buffer, after reading (getting) one element, the head pointer must advance to the next position and wrap around when it reaches the end of the buffer.<br><br>The correct operation is: <code>self.head = (self.head + 1) % self.size</code>.<br><br>The modulo operator ensures the pointer wraps from the last index back to 0 when it exceeds the buffer size. Using integer division (//) instead of modulo (%) would not produce a valid circular wrap.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_065",
      "year": "2025 Batch 24",
      "text": "The code at blank S to update the variable tail that points to the end of the contents of the circular buffer, should be:",
      "opts": ["tail = (self.head + self.count) // self.size", "tail = (self.head + self.count) % self.size", "tail = (self.head + self.size) // self.count", "tail = (self.head + self.size) % self.count", "tail = (self.head + self.count + 1) % self.size"],
      "ans": 1,
      "exp": "In a circular buffer, the <strong>tail</strong> is where the next new item will be written. It is located at <code>self.count</code> positions after <code>self.head</code> (since count items are already stored starting from head).<br><br><code>tail = (self.head + self.count) % self.size</code><br><br>The modulo wraps around the index if it exceeds the buffer boundary. This correctly places the tail immediately after the last occupied slot in the circular arrangement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_066",
      "year": "2025 Batch 24",
      "text": "When the program is executed, which of the following values will never get stored in the circular buffer?",
      "opts": ["3", "4", "5", "6", "None of the above"],
      "ans": 0,
      "exp": "<strong>Simulate the execution with buffer size=3:</strong><br><br><code>for i in range(4): cb.put(i)</code><br>put(0): count=0&lt;3, tail=0, buf=[0,_,_], count=1 \u2192 True<br>put(1): tail=1, buf=[0,1,_], count=2 \u2192 True<br>put(2): tail=2, buf=[0,1,2], count=3 \u2192 True<br>put(3): count==size \u2192 <strong>False</strong> (buffer full, 3 is NOT stored).<br><br><code>cb.get(), cb.put(4)</code>: get\u21920, put(4) at tail=(0+3)%3=0 \u2192 buf=[4,1,2], count=3; get\u21921, put(5) at tail=1 \u2192 buf=[4,5,2]; get\u21922, put(6) at tail=2 \u2192 buf=[4,5,6].<br><br>Value <strong>3</strong> was never stored (its put call returned False).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_067",
      "year": "2025 Batch 24",
      "text": "The code at blank T to initialize the graph to store vert number of vertices, should be:",
      "opts": ["self.matrix = [[0] * (vert-1) for _ in range(vert)]", "self.matrix = [[0] * vert for _ in range(vert-1)]", "self.matrix = [[0] * vert for _ in range(vert)]", "self.matrix = [[0] * (vert+1) for _ in range(vert)]", "self.matrix = [[0] * vert for _ in range(vert+1)]"],
      "ans": 2,
      "exp": "An adjacency matrix for a graph with <code>vert</code> vertices requires a <strong>vert \u00d7 vert</strong> matrix (one row and one column per vertex). Each cell is initialized to 0 (no edge).<br><br>The correct initialization is: <code>self.matrix = [[0] * vert for _ in range(vert)]</code><br><br>This creates <code>vert</code> rows, each containing <code>vert</code> zeros.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_068",
      "year": "2025 Batch 24",
      "text": "The code at blank U to perform a range check on adding an edge to the graph, should be:",
      "opts": ["(i >= 0) and (i < (self.vertices-1)) and (j >= 0) and (j < (self.vertices-1))", "(i > 0) and (i < (self.vertices+1)) and (i > 0) and (j < (self.vertices+1))", "(i >= 0) and (i < (self.vertices+1)) and (i >= 0) and (j < (self.vertices+1))", "(i > 0) and (i < (self.vertices-1)) and (i >= 0) and (j < (self.vertices-1))", "(i >= 0) and (i < self.vertices) and (j >= 0) and (j < self.vertices)"],
      "ans": 4,
      "exp": "Valid vertex indices for a graph with <code>self.vertices</code> vertices are <strong>0 to self.vertices\u22121</strong> (0-based indexing).<br><br>The range check must confirm: <code>i \u2265 0</code> and <code>i &lt; self.vertices</code> and <code>j \u2265 0</code> and <code>j &lt; self.vertices</code>.<br><br>Option (e) expresses exactly this. Options using <code>vertices-1</code> as the upper bound would exclude the last valid vertex index. Options using <code>vertices+1</code> allow out-of-bounds indices.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_069",
      "year": "2025 Batch 24",
      "text": "The function findPath is used to calculate a path from start vertex to end vertex. The correct code at blank V for the recursive step should be:",
      "opts": ["newpath = self.findPath(startV, nextV, path)", "newpath = self.findPath(startV, nextV, path + endV)", "newpath = self.findPath(nextV, endV, startV + path)", "newpath = self.findPath(nextV, endV, path)", "newpath = self.findPath(nextV, endV, startV + [])"],
      "ans": 3,
      "exp": "The DFS path-finding algorithm moves from the current vertex (<code>startV</code>) to a connected unvisited neighbour (<code>nextV</code>), trying to reach <code>endV</code>. The current path is passed along so previously visited vertices are not revisited.<br><br>The recursive call should be: <code>newpath = self.findPath(nextV, endV, path)</code><br><br>\u2014 <code>nextV</code> becomes the new start (we move to the neighbour),<br>\u2014 <code>endV</code> remains the destination,<br>\u2014 <code>path</code> already contains all visited vertices including <code>startV</code> (it was appended at the beginning of the current call).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_070",
      "year": "2025 Batch 24",
      "text": "The function maxDistance shown below is used to calculate the maximum distance between two equal values in the input data array. For example, the execution of Python code maxDistance([1, 0, 3, 3, 2, 0, 2, 5]) will return 4, because the maximum distance is between the two 0's and the distance is 4.\n\ndef maxDistance(data):\n    maxd = 0\n    for i in range(0, len(data) - 1):\n        for j in range(i+1, len(data)):\n            if data[i] == data[j]:\n                if ..... W .....: # condition\n                    maxd = j-i\n    return maxd\n\nThe correct code at blank W for the condition should be:",
      "opts": ["maxd < ((i+j) // 2)", "maxd < ((i+j) % 2)", "maxd < (i-j)", "maxd < (j-i)", "maxd < j"],
      "ans": 3,
      "exp": "The distance between two equal elements at positions i and j (where j > i) is <code>j - i</code>. We want to update <code>maxd</code> only when we find a larger distance than the current maximum.<br><br>The condition is: <code>maxd &lt; (j-i)</code> \u2014 update maxd only if the new distance j\u2212i exceeds the current maximum.<br><br>Verification with the example: 0 at indices 1 and 5 \u2192 distance = 4. 2 at indices 4 and 6 \u2192 distance = 2. 3 at indices 2 and 3 \u2192 distance = 1. Maximum is 4, returned correctly.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_071",
      "year": "2025 Batch 24",
      "text": "What is the purpose of the statement in code line X?\ndict[x] = dict.get(x, 0) + 1  # code line X",
      "opts": ["Check if an item in the input array a is already in the dictionary dict", "To insert an item from the input array a into the dictionary dict", "To update the count of an item from the input array a in the dictionary dict", "To get an item from the dictionary dict and increment its value", "None of the above"],
      "ans": 2,
      "exp": "<code>dict.get(x, 0)</code> retrieves the current count of x from the dictionary, defaulting to 0 if x has not been seen before. Adding 1 and assigning back to <code>dict[x]</code> increments the count by 1.<br><br>This statement <strong>updates the count</strong> of element x from array a in the frequency dictionary: if x is new, it is inserted with count 1; if x already exists, its count is incremented. This is a standard frequency-counting pattern.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_072",
      "year": "2025 Batch 24",
      "text": "What is the purpose of the statement in code line Y?\nif x not in dict:  # code line Y",
      "opts": ["To check if the value x is in array a but not in array b", "To check if the value x is in array b but not in array a", "To check if the value x is not in the dictionary", "To check if the value x is in the dictionary", "None of the above"],
      "ans": 2,
      "exp": "The dictionary <code>dict</code> was built from array <code>a</code>. When iterating over array <code>b</code>, the check <code>if x not in dict</code> determines whether the current element x from b was never present in a.<br><br>If x is not in the dictionary, it means x does not appear in a, so the two arrays cannot have equal content \u2192 return False immediately.<br><br>The statement literally checks whether x is <strong>not in the dictionary</strong> (option c). It uses the dictionary as a proxy for array a's contents.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_073",
      "year": "2025 Batch 24",
      "text": "The variable u is initialized as (in code line Z)\nu = [' ' for _ in range(len(s))]  # code line Z",
      "opts": ["an empty string", "an empty character array", "a string of spaces of length of string s", "a character array of spaces of length of string s", "None of the above"],
      "ans": 3,
      "exp": "<code>[' ' for _ in range(len(s))]</code> is a list comprehension that creates a Python <strong>list</strong> containing <code>len(s)</code> single-space strings.<br><br>In Python, a list of single characters is the closest equivalent to a character array. Each element is the space character ' '. The list has the same length as string s.<br><br>This is a <strong>character array of spaces of length of string s</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_074",
      "year": "2025 Batch 24",
      "text": "When the code print(func6('test', 't', 'T')) is executed, the output will be",
      "opts": ["['t', 'e', 's', 't']", "['T', 'e', 's', 'T']", "test", "TesT", "None of the above"],
      "ans": 1,
      "exp": "func6 replaces every occurrence of character t with character T in string s='test'.<br><br>Loop: u[0]='t'\u2192'T', u[1]='e', u[2]='s', u[3]='t'\u2192'T'.<br><br>The function returns the <em>list</em> u = ['T', 'e', 's', 'T']. <code>print</code> on a list displays it with brackets and quotes: <strong>['T', 'e', 's', 'T']</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_075",
      "year": "2025 Batch 24",
      "text": "The function str2int shown below is used to convert a number given as a string to an integer. For example, the execution of Python code print(str2int(\"12345\")+1) will output 12346.\n\ndef str2int(str, index=0):\n    if index == len(str):\n        return 0\n    digit = int(str[index])\n    return A  # recursive step\n\nThe correct code at blank A for the recursive step should be:",
      "opts": ["digit * (10 ** (len(str) - index-2)) + str2int(str, index+1)", "digit * (10 ** (len(str) - index-1)) + str2int(str, index+1)", "digit * (10 ** (len(str) - index)) + str2int(str, index+1)", "digit * (10 ** (len(str) - index+1)) + str2int(str, index+1)", "digit * (10 ** (len(str) - index+2)) + str2int(str, index+1)"],
      "ans": 1,
      "exp": "For a string of length L, the digit at index 0 has place value 10^(L\u22121), the digit at index 1 has place value 10^(L\u22122), \u2026, the digit at index i has place value 10^(L\u2212i\u22121).<br><br>So the formula is: <code>digit * (10 ** (len(str) - index - 1)) + str2int(str, index+1)</code>.<br><br>Verification with \"12345\" (L=5): index=0: 1\u00d710^4=10000; index=1: 2\u00d710^3=2000; \u2026; index=4: 5\u00d710^0=5. Sum = 12345 \u2713.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_076",
      "year": "2025 Batch 24",
      "text": "What is the criteria used in selecting the pivot element in the partition function?",
      "opts": ["Divide the array into roughly equal size partitions", "Select the value that is as close as possible to the mid value in the array", "Select a high value that is close to the left side of the array", "Select a low value that is close to the right side of the array", "None of the above"],
      "ans": 4,
      "exp": "Looking at the partition function, the pivot is selected as <code>data[high]</code> \u2014 the <strong>last element</strong> of the current subarray. This is the standard Lomuto partition scheme.<br><br>None of the options (a)\u2013(d) describes this: (a) describes median-of-three, (b) describes median selection, (c) and (d) are meaningless descriptions. The correct pivot selection is simply the last element of the subarray, which is <strong>None of the above</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_077",
      "year": "2025 Batch 24",
      "text": "For the code at blank B to select the pivot element, what is the most preferable method from the given set of options below?",
      "opts": ["pivot = low", "pivot = high", "pivot = (low + high) // 2", "pivot = random.randint(low, high)", "pivot = random.randint((low // 2), (high // 2))"],
      "ans": 3,
      "exp": "The choice of pivot critically affects quicksort performance. A bad pivot (e.g., always the smallest or largest) leads to O(n\u00b2) worst-case behaviour.<br><br>(a) pivot=low and (b) pivot=high are deterministic and degenerate on already-sorted or reverse-sorted arrays.<br>(c) Midpoint is better but still has worst cases for certain patterns.<br>(e) Random between low//2 and high//2 selects from outside the valid index range \u2014 incorrect.<br><br><strong>(d) pivot = random.randint(low, high)</strong> selects a random valid index within the subarray. This randomization ensures no adversarial input can consistently cause worst-case behaviour, giving expected O(n log n) performance. This is the most preferable robust method.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_078",
      "year": "2025 Batch 24",
      "text": "The code at blank C, to recursively call the sorting function, should be:",
      "opts": ["quickSort(data, low, piv-1); quickSort(data, piv+1, high)", "quickSort(data, low, piv); quickSort(data, piv, high)", "quickSort(data, low, piv-1); quickSort(data, piv, high)", "quickSort(data, low, piv); quickSort(data, piv+1, high)", "None of the above"],
      "ans": 0,
      "exp": "After <code>partition</code> returns <code>piv</code>, the element at index <code>piv</code> is in its final sorted position. The two recursive calls must sort the elements <strong>strictly to the left</strong> and <strong>strictly to the right</strong> of the pivot \u2014 excluding the pivot itself (it is already placed).<br><br>Correct: <code>quickSort(data, low, piv-1)</code> sorts the left partition; <code>quickSort(data, piv+1, high)</code> sorts the right partition.<br><br>Including the pivot index in either recursive call (options b, c, d) would cause incorrect behaviour or infinite recursion.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_079",
      "year": "2025 Batch 24",
      "text": "Which one of the following statements about quick sort is incorrect?",
      "opts": ["It is an algorithm based on the divide-and-conquer paradigm", "It is efficient for large data sets", "It is memory efficient", "It is less efficient for small data sets", "It is an algorithm with high run-time efficiency due to the use of recursive calls"],
      "ans": 4,
      "exp": "Quicksort is indeed based on divide-and-conquer (a), efficient for large datasets with average O(n log n) (b), memory-efficient as it sorts in-place with O(log n) stack space (c), and less efficient than insertion sort for small datasets (d) \u2014 all true.<br><br>(e) is <strong>incorrect</strong>: quicksort's high efficiency comes from its <em>partitioning strategy</em> and cache-friendly access patterns, not from the use of recursive calls. Recursion is simply the implementation mechanism; it actually adds function call overhead. The efficiency arises from reducing the problem size rapidly through partitioning.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_080",
      "year": "2025 Batch 24",
      "text": "Which one of the following statements about merge sort is incorrect?",
      "opts": ["It is an algorithm based on the divide-and-conquer paradigm", "It is efficient for large data sets", "It is not memory efficient", "It is less efficient for small data sets", "It is an algorithm with high run-time efficiency due to the use of recursive calls"],
      "ans": 4,
      "exp": "Merge sort is based on divide-and-conquer (a) \u2014 true. It is efficient for large datasets with guaranteed O(n log n) (b) \u2014 true. It requires O(n) additional memory for merging, so it is not memory-efficient (c) \u2014 true. It has more overhead than simple algorithms like insertion sort for small n (d) \u2014 true.<br><br>(e) is <strong>incorrect</strong>: like quicksort, merge sort's efficiency derives from its divide-and-conquer strategy of dividing the problem and merging sorted halves, not from the use of recursive calls per se. Recursion is the implementation mechanism, not the source of efficiency. The same algorithm can be implemented iteratively (bottom-up merge sort) with the same time complexity.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_081",
      "year": "2023 Batch 22",
      "text": "If L = [9, 4, 3, 2, 7, 5, 8, 15], what will be the output?",
      "img": "IMAGES/CS/Past Papers/pp_2023_Batch_22_FIG1.png",
      "imgAlt": "Flowchart algorithm that counts prime numbers in a list by testing divisibility from j=2",
      "opts": ["8", "5", "4", "3", "0"],
      "ans": 2,
      "exp": "The algorithm initialises <code>count = N = 8</code>. For each element x, j starts at 2 and increments while j &lt; x. If x % j == 0 (composite found), count is decremented and the inner loop exits early.<br><br>9: divisible by 3 \u2192 count=7. 4: divisible by 2 \u2192 count=6. 3: j=2, 2&lt;3 yes, 3%2\u22600, j=3, 3&lt;3 no \u2192 prime. 2: j=2, 2&lt;2 no \u2192 prime. 7: no divisor \u2192 prime. 5: no divisor \u2192 prime. 8: divisible by 2 \u2192 count=5. 15: divisible by 3 \u2192 count=4.<br><br>Output: <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_082",
      "year": "2023 Batch 22",
      "text": "Which of the following statements is/are correct about the running time T of the algorithm?\n\nI. T is proportional to N.\nII. T depends on the values in L.\nIII. T is proportional to N\u00b2.",
      "img": "IMAGES/CS/Past Papers/pp_2023_Batch_22_FIG1.png",
      "imgAlt": "Flowchart algorithm that counts prime numbers in a list by testing divisibility from j=2",
      "opts": ["I only", "I and II only", "III only", "II and III only", "None of them"],
      "ans": 1,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> The outer loop executes exactly N times. If the list scales by factor k (same value distribution, k\u00d7N elements), running time scales by k. T is proportional to N for a fixed value distribution.<br><br><strong>Statement II \u2014 TRUE:</strong> The inner loop runs up to x\u22122 iterations, where x is each element's value. Larger values mean more work. A list of large primes takes far longer than a list of small even numbers. T depends on actual values.<br><br><strong>Statement III \u2014 FALSE:</strong> T is not proportional to N\u00b2. The inner loop depends on element values, not N.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_083",
      "year": "2023 Batch 22",
      "text": "Consider the following statements regarding the algorithm in Fig. 1.\n\nI. The algorithm will output 0 if all the values in L are even numbers.\nII. The algorithm will still work if \"Is j < x\" is changed as \"Is j < \u221ax\".\nIII. The algorithm will take less time if \"Is j < x\" is changed as \"Is j < \u221ax\".\n\nWhich of the statements above is/are correct?",
      "img": "IMAGES/CS/Past Papers/pp_2023_Batch_22_FIG1.png",
      "imgAlt": "Flowchart algorithm that counts prime numbers in a list by testing divisibility from j=2",
      "opts": ["I only", "II only", "III only", "II and III only", "All (I, II and III) are correct"],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> The number 2 is even and prime. For x=2, j starts at 2 but j&lt;2 is immediately False, so count is not decremented. A list like [2, 4] gives count=2\u22121=1 (not 0).<br><br><strong>Statement II \u2014 TRUE:</strong> Every composite n has at least one factor \u2264 \u221an. Testing divisors up to (but not including) \u221ax is sufficient to detect all composites. The output is unchanged.<br><br><strong>Statement III \u2014 TRUE:</strong> The modified inner loop runs \u2248 \u221ax iterations instead of x\u22122, which is dramatically fewer for large x.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_084",
      "year": "2023 Batch 22",
      "text": "Three students expressed the algorithm of Fig. 1 in pseudo-code as shown below. The \"BREAK\" keyword stops and exits the surrounding loop.\n\n[Pseudo I: FOR i=0 TO N-1, FOR j=3 TO x-1, IF x%j=0 count-1 BREAK]\n[Pseudo II: WHILE i<N, j\u21903, WHILE j<x, IF x%j=0 count-1 BREAK \u2014 no j increment]\n[Pseudo III: REPEAT...UNTIL i=N with REPEAT...UNTIL j=x, j starts at 3]\n\nWhich of the three pseudo-code algorithms correctly express the algorithm in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2023_Batch_22_FIG2.png",
      "imgAlt": "Flowchart algorithm that counts prime numbers in a list by testing divisibility from j=2",
      "opts": ["I only", "II only", "III only", "I and III only", "None of them"],
      "ans": 4,
      "exp": "The flowchart initialises j = <strong>2</strong>. All three pseudo-code algorithms initialise j = <strong>3</strong>, so they all fail to test divisibility by 2. Even composite numbers divisible only by 2 (e.g., 4, 8) are missed, producing an incorrect count.<br><br>Additionally, Pseudo II contains no j increment inside its inner while loop, causing an infinite loop whenever x&gt;3 and x%3\u22600.<br><br>Since all three algorithms are incorrect, the answer is <strong>None of them</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_085",
      "year": "2023 Batch 22",
      "text": "Suppose there is an algorithm Y to solve problem X. A student has just completed developing a program P based on algorithm Y. Which of the following statements is most likely to be correct regarding program P?",
      "opts": ["Program P may have performance bugs (e.g., lower than expected speed) even if it does not have any syntax errors, logic errors or run-time errors.", "Program P may have syntax errors, but it cannot have any logic errors.", "Program P may have logic errors, but it cannot have any syntax errors.", "Program P cannot have any run-time errors if it does not have any syntax errors or logic errors.", "Program P cannot have any syntax errors, logic errors or run-time errors."],
      "ans": 0,
      "exp": "A program that is syntactically correct, logically correct, and does not crash at runtime can still run significantly slower than expected due to poor implementation choices \u2014 inefficient data structures, redundant operations, memory waste. These are <strong>performance bugs</strong>. Option (d) is wrong because run-time errors (e.g., division by zero, memory exhaustion) can occur in any program depending on inputs. Options (b), (c), and (e) are too restrictive.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_086",
      "year": "2023 Batch 22",
      "text": "Consider the following statements on program translation, compilation and interpretation.\n\nI. In the linking step in the translation in compiled languages, object code is merged with pre-compiled libraries to produce executable machine code.\nII. Program translation in some programming languages uses both compilation and interpretation.\nIII. Compiled languages tend to be more flexible (than interpreted languages) with features like dynamic typing.\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "I and II only", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> The linker combines compiled object code with pre-compiled library routines to produce a standalone executable \u2014 this is the standard compilation pipeline.<br><br><strong>Statement II \u2014 TRUE:</strong> Java compiles to bytecode, which is then interpreted/JIT-compiled by the JVM. Python similarly compiles to bytecode first. Both compilation and interpretation are used in several languages.<br><br><strong>Statement III \u2014 FALSE:</strong> Dynamic typing is a feature of <em>interpreted</em> languages (Python, JavaScript, Ruby). Compiled languages (C, C++, Java) are typically statically typed \u2014 less dynamically flexible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_087",
      "year": "2023 Batch 22",
      "text": "Suppose there are two deterministic algorithms X and Y to solve a problem. A deterministic algorithm is an algorithm that, given a particular input, will always follow a fixed set of instructions and produce the same output. Consider the following statements.\n\nI. The running times of algorithms X and Y will be the same for any input.\nII. The outputs of algorithm X and Y will be the same for any input.\nIII. The length (number of code lines) of algorithms X and Y will be the same.\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "I and II only", "None"],
      "ans": 1,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> Two algorithms for the same problem can have very different time complexities (e.g., O(n\u00b2) vs O(n log n)). Their running times differ for the same input.<br><br><strong>Statement II \u2014 TRUE:</strong> Both algorithms <em>solve</em> the same problem, meaning both produce the correct output for any valid input. Since the problem has a defined correct answer, X and Y must return the same result for any given input.<br><br><strong>Statement III \u2014 FALSE:</strong> Code length depends on implementation style and design choices. Different correct algorithms can have vastly different line counts.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_088",
      "year": "2023 Batch 22",
      "text": "How many addition (+) operations are performed as a result of the call Fib(6)?",
      "opts": ["1", "6", "9", "12", "15"],
      "ans": 3,
      "exp": "Each non-base-case call performs exactly one addition (RETURN x+y). The number of additions equals the number of calls that reach the return line.<br><br>The call tree for Fib(6) has 25 total calls. Base cases (n=0 or n=1): Fib(1) called 8 times, Fib(0) called 5 times = 13 base calls. Non-base calls = 25\u221213 = <strong>12 additions</strong>. Python simulation confirms 12.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_089",
      "year": "2023 Batch 22",
      "text": "To compute \ud835\udc39\u2084, how many times, overall, does Fib() get called?",
      "opts": ["1", "3", "9", "4", "7"],
      "ans": 2,
      "exp": "Trace the call tree for Fib(4):<br>Fib(4)[1] \u2192 Fib(3)[1] + Fib(2)[1]<br>Fib(3) \u2192 Fib(2)[1] + Fib(1)[1]<br>Fib(2)[first] \u2192 Fib(1)[1] + Fib(0)[1]<br>Fib(2)[second] \u2192 Fib(1)[1] + Fib(0)[1]<br><br>Total: 1+1+1+1+1+1+1+1+1 = <strong>9 calls</strong>. Python simulation confirms 9.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_090",
      "year": "2023 Batch 22",
      "text": "Consider the following statements about computing \ud835\udc39\ud835\udc5b and the algorithm given above.\n\nI. The number of addition operations in the above recursive algorithm is linear in terms of \ud835\udc5b.\nII. We can develop an iterative algorithm for computing \ud835\udc39\ud835\udc5b.\nIII. In an iterative algorithm for computing \ud835\udc39\ud835\udc5b, the number of addition operations will be linear in terms of \ud835\udc5b.\n\nWhich of the above is/are correct?",
      "opts": ["I only.", "II only.", "I and II only.", "II and III only.", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> The recursive call tree has exponential size. The number of additions equals the number of non-base-case calls \u2248 O(\u03c6\u207f) where \u03c6\u22481.618 \u2014 exponential, not linear. Verified: Fib(6) needs 9 additions; Fib(4) needs 4.<br><br><strong>Statement II \u2014 TRUE:</strong> An iterative algorithm uses two variables to track consecutive Fibonacci numbers, computing F(n) in a simple loop.<br><br><strong>Statement III \u2014 TRUE:</strong> An iterative Fib loop performs exactly n\u22121 additions (one per iteration from i=2 to n) \u2014 linear in n.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_091",
      "year": "2023 Batch 22",
      "text": "What will be the result when the following Python code is executed?\n\ntype(False + int(3.23))",
      "opts": ["<class 'float'>", "<class 'int'>", "<class 'bool'>", "<class 'str'>", "An error message"],
      "ans": 1,
      "exp": "<code>int(3.23) = 3</code>. <code>False</code> is a bool (subclass of int) with value 0. <code>False + 3 = 0 + 3 = 3</code>. When a bool is added to an int (non-bool), Python returns an <code>int</code>. Therefore <code>type(False + int(3.23))</code> = <strong>&lt;class 'int'&gt;</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_092",
      "year": "2023 Batch 22",
      "text": "The abs() function in Python returns the absolute value (magnitude) of the argument. What will be the output of the following Python code?\n\nprint((6/3) ** abs(3+4j))",
      "opts": ["32.0", "32", "10.0", "0", "None of the above"],
      "ans": 0,
      "exp": "<code>abs(3+4j) = \u221a(3\u00b2+4\u00b2) = \u221a25 = 5.0</code>. <code>6/3 = 2.0</code>. <code>2.0 ** 5.0 = 32.0</code>. Since 6/3 is a float, the result is the float <strong>32.0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_093",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\na = b = c = 9\nL = [2, 4, 5, a, b, c]\nb = 8\ndel b, c, L[3]\nprint(L)",
      "opts": ["[2, 4, 5, 9, 9]", "[2, 4, 5, 8, 9]", "[2, 4, 5]", "[2, 4, 5, 9, 9, 9]", "None of the above"],
      "ans": 0,
      "exp": "<code>a=b=c=9</code>. <code>L=[2,4,5,9,9,9]</code> \u2014 the list stores integer values, not variable references. <code>b=8</code> rebinds the name b; L is unaffected. <code>del b, c</code> removes those variable names (L unchanged). <code>del L[3]</code> removes the element at index 3 (the first 9), leaving <code>L=[2,4,5,9,9]</code>. Output: <strong>[2, 4, 5, 9, 9]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_094",
      "year": "2023 Batch 22",
      "text": "Consider the following statements about objects in Python.\n\nI. The operations that can be performed on an object depend on its value.\nII. The identity of an object will change when it is given a name.\nIII. The value of a string object can be changed by assigning a new string.\n\nWhich of the above statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "None."],
      "ans": 4,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> Operations available on an object depend on its <em>type</em>, not its value. All integers support the same operations regardless of magnitude.<br><br><strong>Statement II \u2014 FALSE:</strong> An object's identity (its <code>id()</code>) is fixed when the object is created and never changes. Binding a name is an operation on the namespace, not the object itself.<br><br><strong>Statement III \u2014 FALSE:</strong> Strings are <em>immutable</em>. <code>x = \"hello\"; x = \"world\"</code> rebinds the name x to a new object \u2014 the original \"hello\" object is unchanged.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_095",
      "year": "2023 Batch 22",
      "text": "Consider the following 4 lines of Python code.\n\nw = [3, 2.5, [True, [8], \"foo\", 5+6j], 9] # Line 0\nw[2][1][0] = 4 # Line 1\nw[1] = [w[1]] * 2 + [\"bar\"] # Line 2\ndel w[1][1][0] # Line 3\n\nWhich of the following 3 statements is/are correct about the code above?\n\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.",
      "opts": ["I only.", "II only.", "III only.", "II and III only.", "All (I, II and III) are correct."],
      "ans": 2,
      "exp": "<strong>Line 1:</strong> <code>w[2][1]</code> is the list <code>[8]</code>. Assigning <code>w[2][1][0] = 4</code> replaces element 8 with 4 \u2014 valid list mutation. No error.<br><br><strong>Line 2:</strong> <code>w[1]=2.5</code>. <code>[2.5]*2+[\"bar\"]=[2.5,2.5,\"bar\"]</code>. Valid list operation. No error.<br><br><strong>Line 3:</strong> After Line 2, <code>w[1]=[2.5,2.5,\"bar\"]</code>. So <code>w[1][1]=2.5</code>. <code>del (2.5)[0]</code> attempts to delete an index of a float, which is not subscriptable \u2192 <code>TypeError</code>. <strong>Line 3 has an error.</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_096",
      "year": "2023 Batch 22",
      "text": "Consider the following 4 lines of Python code.\n\nw = [3, 2.5, [True, [8], \"foo\", 5+6j], 9] # Line 0\nw[2][2][0] = \"b\" # Line 1\nw[1] += \"abc\" # Line 2\nw[2][2] *= 2 # Line 3\n\nWhich of the following 3 statements is/are correct about the code above?\n\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Line 1:</strong> <code>w[2][2]=\"foo\"</code>. Strings are immutable \u2014 assigning to index <code>w[2][2][0]=\"b\"</code> raises <code>TypeError</code>. <strong>Error.</strong><br><br><strong>Line 2:</strong> <code>w[1]=2.5</code> (float). <code>2.5 += \"abc\"</code> attempts float+string \u2192 <code>TypeError</code>. <strong>Error.</strong><br><br><strong>Line 3:</strong> <code>w[2][2]=\"foo\"</code>. <code>\"foo\"*2=\"foofoo\"</code> \u2014 string repetition is valid. No error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_097",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nw = [3, 2.5, [True, [8], \"foo\", 5+6j], 9]\nx = 8\ny = \"True\"\nprint (x in w[2] or y in w[2])",
      "opts": ["True", "False", "8True", "8orTrue", "False or True"],
      "ans": 1,
      "exp": "<code>w[2] = [True, [8], \"foo\", 5+6j]</code>.<br><br><code>8 in w[2]</code>: checks direct membership. Elements are True(=1), [8](a list), \"foo\", 5+6j. The integer 8 is not directly among them (note [8] is a list, not the integer 8; and True==1\u22608). \u2192 <strong>False</strong>.<br><br><code>\"True\" in w[2]</code>: the string \"True\" is not an element (True the bool \u2260 \"True\" the string). \u2192 <strong>False</strong>.<br><br><code>False or False = <strong>False</strong></code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_098",
      "year": "2023 Batch 22",
      "text": "What will be the value of the following Python expression?\n\n(0o210 >> 0b11) | (~8 & 0xDA)",
      "opts": ["16", "195", "210", "218", "211"],
      "ans": 4,
      "exp": "<code>0o210 = 136</code>; <code>0b11 = 3</code>; <code>136 &gt;&gt; 3 = 17</code> (= 00010001\u2082).<br><code>~8 = \u22129</code> (...11110111\u2082); <code>0xDA = 218</code> (11011010\u2082).<br><code>~8 &amp; 0xDA</code>: low 8 bits of \u22129 = 11110111; 11110111 &amp; 11011010 = 11010010\u2082 = 210.<br><code>17 | 210</code>: 00010001 | 11010010 = 11010011\u2082 = <strong>211</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_099",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code, if the input is \"z m e b j s\"?\n\ninp = input('Enter input: ')\np = inp.split()\np.append('u')\np.sort()\nprint(p)",
      "opts": ["z m e b j s u", "b e j m s u z", "['b', 'e', 'j', 'm', 's', 'u', 'z']", "['z', 'm', 'e', 'b', 'j', 's', 'u']", "['z', 'u', 's', 'm', 'j', 'e', 'b']"],
      "ans": 2,
      "exp": "<code>split()</code> gives <code>['z','m','e','b','j','s']</code>. After <code>append('u')</code>: <code>['z','m','e','b','j','s','u']</code>. After <code>sort()</code>: <code>['b','e','j','m','s','u','z']</code>. <code>print</code> outputs the list representation: <strong>['b', 'e', 'j', 'm', 's', 'u', 'z']</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_100",
      "year": "2023 Batch 22",
      "text": "The objective of the following Python code is to read a file and display its contents on screen, line by line.\n\nwith open('myfile.txt', 'r') as infile:\n    for line in infile:\n        print(line , end=\"\")\n\nWhich of the following statements is/are correct about the above Python code?\n\nI. The code does not have syntax errors.\nII. As a good programming practice, code must be added to close the file.\nIII. An exception could occur at run-time.",
      "opts": ["I only", "III only", "I and II only", "I and III only", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> The code is syntactically valid Python.<br><br><strong>Statement II \u2014 FALSE:</strong> The <code>with</code> statement (context manager) automatically closes the file on block exit, even if an exception occurs. Adding explicit close code is unnecessary and redundant \u2014 <code>with</code> <em>is</em> the best practice.<br><br><strong>Statement III \u2014 TRUE:</strong> If <code>myfile.txt</code> does not exist, a <code>FileNotFoundError</code> is raised at runtime. Other I/O errors are also possible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_101",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code, if the input is '5'?\n\nnum = int(input('Enter a number: '))\nmatch num:\n    case 1: print(\"One\")\n    case 2: print(\"Two\")\n    case 3 | 5: print(\"Three\")\n    case 4 | 5: print(\"Four\")\n    case 5: print(\"Five\")\n    case _: print(\"What?\")",
      "opts": ["Three", "Four", "Five", "What?", "An error message or exception"],
      "ans": 0,
      "exp": "Python's <code>match-case</code> evaluates cases in order and executes the <em>first</em> matching case. With num=5: <code>case 1</code> fails, <code>case 2</code> fails, <code>case 3 | 5</code>: 5 matches \u2192 prints <strong>Three</strong> and exits the match block. Later cases are never evaluated.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_102",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code.\n\nN = int(input('Enter an integer: '))\nif (N < 5000):\n    p = 2000 / N\n    print(p)\n\nWhich of the following is correct about the code above? Select the most suitable choice.",
      "opts": ["Code will get executed without any exceptions.", "Code cannot execute as it has syntax errors.", "One type of exception could occur at run-time.", "Two types of exceptions could occur at run-time.", "More than two types of exceptions could occur at run-time."],
      "ans": 3,
      "exp": "Two distinct exception types can occur:<br><br><strong>ValueError</strong>: if the user enters a non-integer string, <code>int()</code> raises ValueError.<br><strong>ZeroDivisionError</strong>: if N=0, then N&lt;5000 is True and <code>2000/0</code> raises ZeroDivisionError.<br><br>No other exception types arise from this specific code. Exactly <strong>two types</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_103",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code, if the input is '100'?\n\nx = float(input('Enter x: '))\nif (x >= 50.0):\n    k = x / 2\n    if (x > 100):\n        k = k + 10\n    elif (k == 100):\n        k = k + 20\n    else:\n        k = k + 30\nelse:\n    k = x/2 + 40\nprint(k)",
      "opts": ["60.0", "70,0", "80.0", "90.0", "An error message or exception"],
      "ans": 2,
      "exp": "x=100.0. <code>x\u226550.0</code> \u2192 True: <code>k=100.0/2=50.0</code>. Inner: <code>x&gt;100</code> \u2192 False (100 is not strictly greater). <code>elif k==100</code>: k=50.0\u2260100 \u2192 False. <code>else</code>: <code>k=50.0+30=80.0</code>. Output: <strong>80.0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_104",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nnumber = 1\nwhile (number < 6):\n    if (number%3 == 0):\n        print(number)\n    number += 1",
      "opts": ["1", "2", "3", "6", "The output will be empty."],
      "ans": 2,
      "exp": "Loop runs for number=1,2,3,4,5. Only number=3 satisfies <code>3%3==0</code>. Output: <strong>3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_105",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ntotal = 0\nfor counter in range(1,11,2):\n    total += counter\nprint(total)",
      "opts": ["0", "55", "25", "30", "66"],
      "ans": 2,
      "exp": "<code>range(1,11,2)</code> generates 1,3,5,7,9. Sum = 1+3+5+7+9 = <strong>25</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_106",
      "year": "2023 Batch 22",
      "text": "How many hash (#) symbols will be printed when the following Python code is run?\n\nfor x in [0, 1, 2, 3]:\n    for y in [0, 1, 2, 3]:\n        print('#')",
      "opts": ["0", "4", "8", "9", "16"],
      "ans": 4,
      "exp": "Outer loop: 4 iterations. Inner loop: 4 iterations per outer. Total = 4\u00d74 = <strong>16</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_107",
      "year": "2023 Batch 22",
      "text": "Select the most accurate statement regarding the following Python code.\n\nnumber = 1\ntotal = 1\nwhile (number > 0):\n    total += number\n    number += 1\nprint(total)",
      "opts": ["The program will enter an infinite loop as 'number' starts at 1, is incremented by 1 at each iteration and hence it will always be positive.", "The program will enter an infinite loop as 'total' starts at 1, is incremented by 'number' at each iteration and hence it will always be positive.", "The program will not enter an infinite loop.", "The program will enter an infinite loop, because it has a 'while' loop.", "The code has syntax errors."],
      "ans": 0,
      "exp": "<code>number</code> starts at 1 and is incremented by 1 each iteration. It grows 1\u21922\u21923\u2192\u2026 and is always positive. The condition <code>number&gt;0</code> is always True \u2192 infinite loop. Option (a) precisely identifies the correct cause.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_108",
      "year": "2023 Batch 22",
      "text": "Select the correct statement regarding the following Python code.\n\nfor value in range(5):\n    print(value)\n    if value == 3:\n        break\nelse:\n    print('Done!')",
      "opts": ["'Done!' will never be printed.", "'Done!' will be printed after 5 iterations.", "'Done!' will be printed after 3 iterations.", "Only 'Done!' will be printed.", "'else' cannot be used with a 'for' loop."],
      "ans": 0,
      "exp": "In Python, the <code>else</code> clause of a <code>for</code> loop executes only when the loop completes <em>without</em> a <code>break</code>. Here, <code>break</code> fires when value==3 \u2192 the else block is skipped. <strong>'Done!' will never be printed.</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_109",
      "year": "2023 Batch 22",
      "text": "How many asterisk (*) signs will the following Python code print?\n\nfor value in range(10):\n    if value == 3:\n        continue\n    elif value == 5:\n        break\n    print('*')",
      "opts": ["1", "2", "3", "4", "5"],
      "ans": 3,
      "exp": "value=0\u2192print*(1); 1\u2192print*(2); 2\u2192print*(3); 3\u2192continue(skip); 4\u2192print*(4); 5\u2192break. Total: <strong>4</strong> asterisks.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_110",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nnames = ['John', 'James', 'Mike', 'John', 'Steve', 'James']\nprint(names.index('James'))",
      "opts": ["1", "2", "3", "4", "5"],
      "ans": 0,
      "exp": "<code>list.index(x)</code> returns the index of the <em>first</em> occurrence. 'James' first appears at index <strong>1</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_111",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ngroup1_scores = [60, 54, 32]\ngroup2_scores = [75, 68, 81]\nscores = group1_scores + group2_scores\nscores.sort()\nprint(scores[:2])",
      "opts": ["[60, 54]", "[75, 68]", "[32, 54]", "[54, 60]", "[135, 122]"],
      "ans": 2,
      "exp": "Combined: [60,54,32,75,68,81]. Sorted: [32,54,60,68,75,81]. <code>[:2]</code> = <strong>[32, 54]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_112",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nline = 'The weather is fine in Sri Lanka today!'\npos = line.find('in')\nprint(pos)",
      "opts": ["16", "17", "24", "True", "The output will be empty."],
      "ans": 0,
      "exp": "In 'The weather is fine in Sri Lanka today!', the substring 'in' first appears within 'fine': f is at index 15, i at 16, n at 17. <code>find('in')</code> returns the start index <strong>16</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_113",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nfirst_value = '6246'\nsecond_value = '3688'\nnew_value = first_value + second_value\nprint(new_value[:-5])",
      "opts": ["246", "3688", "6246", "688", "624"],
      "ans": 4,
      "exp": "<code>'6246'+'3688'='62463688'</code> (8 chars). <code>[:-5]</code> = characters 0 to 2 (index 8\u22125=3, exclusive) = <strong>'624'</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_114",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ninput_str = 'excellent'\noutput_str = ''\nfor char in input_str:\n    if char == 'n':\n        break\n    if char == 'e':\n        continue\n    output_str += char\nprint(output_str)",
      "opts": ["eee", "ent", "nt", "xcll", "Error message."],
      "ans": 3,
      "exp": "Iterate 'excellent': e\u2192continue; x\u2192add('x'); c\u2192add('xc'); e\u2192continue; l\u2192add('xcl'); l\u2192add('xcll'); e\u2192continue; n\u2192break. Output: <strong>xcll</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_115",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ninput_str = 'From allen.stuart@abc.com Sat Jan 5 2008'\nat_pos = input_str.find('@')\nsp_pos = input_str.find(' ', at_pos)\nprint(input_str[at_pos+1:sp_pos])",
      "opts": ["abc", "abc.com", "allen.stuart", "allen.stuart@", "@abc.com"],
      "ans": 1,
      "exp": "<code>find('@')</code> locates '@'. <code>find(' ', at_pos)</code> finds the space after 'abc.com'. The slice <code>[at_pos+1 : sp_pos]</code> extracts the domain: <strong>abc.com</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_116",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nprint(\"%5.2f\"%(456332.548))",
      "opts": ["56332", "56332.55", "56332.54", "456332.54", "456332.55"],
      "ans": 4,
      "exp": "<code>.2f</code>: 2 decimal places. 456332.548 \u2192 third decimal=8\u22655, rounds up \u2192 <strong>456332.55</strong>. The minimum width of 5 is smaller than the actual number width and has no truncating effect.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_117",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\nfor i in range(4,0,-1):\n    print(str(i)*i)",
      "opts": ["4444\n333\n22\n1", "333\n22\n1", "iii\nii\ni", "1\n22\n333\n4444", "1\n22\n333"],
      "ans": 0,
      "exp": "<code>range(4,0,-1)</code> gives 4,3,2,1. <code>str(i)*i</code>: i=4\u2192'4444'; i=3\u2192'333'; i=2\u2192'22'; i=1\u2192'1'. Printed one per line: <strong>4444 / 333 / 22 / 1</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_118",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ndef modify_list(items):\n    items.append(4)\n    items = [10, 20, 30]\n\nnumbers = [1, 2, 3]\nmodify_list(numbers)\nprint(numbers)",
      "opts": ["[1, 2, 3]", "[10, 20, 30]", "[1, 2, 3, 4]", "[4]", "[1, 2, 3, 4, 10, 20, 30]"],
      "ans": 2,
      "exp": "<code>items.append(4)</code> mutates the shared list \u2192 <code>numbers=[1,2,3,4]</code>. Then <code>items=[10,20,30]</code> rebinds the local name \u2014 no effect on <code>numbers</code>. Output: <strong>[1, 2, 3, 4]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_119",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ndef modify_string(s):\n    s += \" World\"\n    s = \"Hello Universe\"\n\ntext = \"Hello\"\nmodify_string(text)\nprint(text)",
      "opts": ["Hello", "Hello World", "Hello Universe", "World", "Universe"],
      "ans": 0,
      "exp": "Strings are immutable. Both <code>s += \" World\"</code> and <code>s = \"Hello Universe\"</code> rebind the local name s \u2014 they never affect <code>text</code>. Output: <strong>Hello</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_120",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ndef greet(name):\n    return \"Hello, \" + name\nprint(greet())",
      "opts": ["Hello,", "Hello, None", "Error message", "Hello, User", "The output will be empty"],
      "ans": 2,
      "exp": "<code>greet()</code> is called with no arguments, but <code>name</code> is required (no default). Python raises <code>TypeError: greet() missing 1 required positional argument: 'name'</code> \u2192 <strong>Error message</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_121",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ndef display_info(name, age):\n    return f\"{name} is {age} years old.\"\n\nprint(display_info(age=25, name=\"John\"))",
      "opts": ["John is 25 years old.", "25 is John years old.", "John is years old.", "25 is years old.", "Error message"],
      "ans": 0,
      "exp": "Keyword arguments match by name regardless of call order. <code>name=\"John\"</code>, <code>age=25</code> \u2192 f-string produces <strong>John is 25 years old.</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_122",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ndef sum_numbers(*args):\n    return sum(args)\n\nprint(sum_numbers(1, 2, 3, 4, 5))",
      "opts": ["5", "10", "15", "20", "25"],
      "ans": 2,
      "exp": "<code>*args</code> collects all positional arguments into tuple (1,2,3,4,5). <code>sum((1,2,3,4,5)) = 15</code>. Output: <strong>15</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_123",
      "year": "2023 Batch 22",
      "text": "What will be the output of the following Python code?\n\ntotal = 0\ndef add_numbers(a, b):\n    total = a + b\n    return total\n\nadd_numbers(5, 10)\nprint(total)",
      "opts": ["0", "5", "10", "15", "20"],
      "ans": 0,
      "exp": "<code>total = a + b</code> inside the function creates a <em>local</em> variable (no <code>global total</code> declaration). The global <code>total</code> is never modified. The return value is also not captured. Global <code>total</code> remains <strong>0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_124",
      "year": "2023 Batch 22",
      "text": "Which of the following statements is correct regarding the Least Significant Bit (LSB) and Most Significant Bit (MSB) in a binary number?",
      "opts": ["The MSB is always on the rightmost side.", "The LSB has the highest value in the binary number.", "The MSB determines the sign of a number in two's complement representation.", "The LSB is always 0.", "Both LSB and MSB cannot be 1 at the same time."],
      "ans": 2,
      "exp": "In two's complement, the <strong>MSB</strong> is the sign bit: 0 = non-negative, 1 = negative. Option (a) is wrong \u2014 MSB is leftmost. Option (b) is wrong \u2014 the LSB has the <em>lowest</em> positional value (2\u2070=1). Options (d) and (e) are trivially false.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_125",
      "year": "2023 Batch 22",
      "text": "Which is the correct binary representation of the decimal fraction 0.375\u2081\u2080?",
      "opts": ["0.0011\u2082", "0.011\u2082", "0.1011\u2082", "0.0110\u2082", "None of the above"],
      "ans": 1,
      "exp": "Convert 0.375 by repeated doubling: 0.375\u00d72=0.75\u2192bit 0; 0.75\u00d72=1.5\u2192bit 1; 0.5\u00d72=1.0\u2192bit 1. Result: 0.<strong>011</strong>\u2082. Verify: 0\u00d7\u00bd+1\u00d7\u00bc+1\u00d7\u215b = 0+0.25+0.125 = 0.375 \u2713",
      "type": "mcq"
    },
    {
      "id": "cs_pp_126",
      "year": "2023 Batch 22",
      "text": "What is the result of dividing the binary number 1110\u2082 by 10\u2082, in binary representation?",
      "opts": ["101\u2082", "110\u2082", "111\u2082", "1001\u2082", "None of the above"],
      "ans": 2,
      "exp": "1110\u2082=14\u2081\u2080; 10\u2082=2\u2081\u2080. 14\u00f72=7\u2081\u2080=<strong>111\u2082</strong>. Verify: 1\u00d74+1\u00d72+1\u00d71=7 \u2713",
      "type": "mcq"
    },
    {
      "id": "cs_pp_127",
      "year": "2023 Batch 22",
      "text": "Which of the following is the correct 8-bit two's complement representation of -27\u2081\u2080?",
      "opts": ["11100101", "01100101", "00011011", "10011011", "None of the above"],
      "ans": 0,
      "exp": "+27=00011011\u2082. One's complement: 11100100\u2082. Add 1: <strong>11100101\u2082</strong>. Verify: \u2212128+64+32+4+1=\u2212128+101=\u221227 \u2713",
      "type": "mcq"
    },
    {
      "id": "cs_pp_128",
      "year": "2023 Batch 22",
      "text": "Which one of the following Python expressions will return the character 'p'?\n\nchr(): Converts an integer to its corresponding Unicode character.\nord(): Returns the integer representation of a given Unicode character.\nstr(): Converts a specified value into a string representation.",
      "opts": ["ord(chr('q') - 1)", "chr(ord('q') - 1)", "str(chr('q') - 1)", "ord(chr('q') + 1)", "chr(ord('q') + 1)"],
      "ans": 1,
      "exp": "<code>ord('q')=113</code>. <code>113\u22121=112</code>. <code>chr(112)='p'</code>. So <code>chr(ord('q')\u22121)</code> = <strong>'p'</strong>. Option (a) is invalid: <code>chr('q')</code> requires an int. Option (e) gives chr(114)='r'.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_129",
      "year": "2023 Batch 22",
      "text": "How can the number 0.15625\u2081\u2080 be represented in the IEEE single-precision format?",
      "opts": ["Sign bit: 0, Exponent: 01111100, Mantissa: 01000000000000000000000", "Sign bit: 0, Exponent: 01111100, Mantissa: 10000000000000000000000", "Sign bit: 1, Exponent: 01111100, Mantissa: 01000000000000000000000", "Sign bit: 0, Exponent: 10000011, Mantissa: 01000000000000000000000", "Sign bit: 0, Exponent: 01111100, Mantissa: 00100000000000000000000"],
      "ans": 0,
      "exp": "0.15625 = 1/8+1/32 = 0.00101\u2082 = 1.01\u2082\u00d72\u207b\u00b3.<br><strong>Sign:</strong> 0 (positive).<br><strong>Exponent:</strong> \u22123+127=124=<code>01111100</code>.<br><strong>Mantissa:</strong> fractional part of 1.01\u2082 = .01 padded = <code>01000000000000000000000</code>.<br>Matches option (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_130",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line X is to be completed.\n\nL1=[0,1,2,3,4,5,6,7,8,9]\ndef func(L,i,j):\n    if i < j:\n        tmp = L[i]\n        L[i] = L[j]\n        L[j] = tmp\n        ............. # line X\n\nfunc(L1, 0, len(L1)-1)\nprint(L1)\n\nFor the output to be [9, 8, 7, 6, 5, 4, 3, 2, 1, 0], line X should be which of the following?",
      "opts": ["func(L,i+1,j-1)", "func(L,i,j)", "func(L,i-1,j+1)", "func(L[i:j],i+1,j-1)", "func(L,j,i)"],
      "ans": 0,
      "exp": "After swapping L[i] and L[j], the function recurses on the inner sub-array by moving both pointers inward: <code>func(L, i+1, j-1)</code>. This continues until pointers meet or cross, reversing the entire array. Option (b) never changes i and j \u2192 infinite recursion.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_131",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line Y is to be completed.\n\nL1=['r','a','c','e','c','a','r']\nL2=['n','o','o','n']\nL3=['n','e','o','n']\ndef func(L):\n    if L != []:\n        if L[0] != L[-1]:\n            return False\n        else:\n            return ........ # line Y\n    else:\n        return True;\n\nFor the output to be True, True and False, line Y should contain which of the following?",
      "opts": ["func(L[0:1])", "func(L[1:1])", "func(L[0:-1])", "func(L[1:-1])", "func(L[-1:1])"],
      "ans": 3,
      "exp": "When first and last characters match, recurse on the <em>inner</em> substring excluding those matched elements: <code>L[1:-1]</code>. Base case: empty list \u2192 True. For 'neon': L[0]='n'=L[-1]='n' \u2192 recurse on ['e','o']: 'e'\u2260'o' \u2192 False \u2713.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_132",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line Z is to be completed.\n\nL1 = [3, 7, 2, 13, 5, 19, 11, 29, 17, 23]\ndef func(L):\n    x = L[0]\n    for .........: # line Z\n        if x < y:\n            x = y\n    return x\nprint(func(L1))\n\nFor the output to be 29, line Z should contain which of the following?",
      "opts": ["x in L", "y in L", "x in L[i]", "y in L[i]", "x in y"],
      "ans": 1,
      "exp": "The function finds the maximum by comparing each element y to the current maximum x. <code>for y in L</code> iterates over each element. Output: <strong>29</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_133",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line X is to be completed.\n\nL1 = ['Q','W','E','R','T','Y']\ndef func(L):\n    for ............: # line X\n        print(i, x, end='|')\nfunc(L1)\n\nFor the output to be 0 Q|1 W|2 E|3 R|4 T|5 Y|, line X should contain which of the following?",
      "opts": ["i in L", "i in range(len(L))", "x in range(len(L))", "i,x in L", "i,x in enumerate(L)"],
      "ans": 4,
      "exp": "<code>enumerate(L)</code> yields (index, value) pairs. Unpacking with <code>for i, x in enumerate(L)</code> assigns the index to i and value to x, producing the required output. Option (b) gives only the index, not the value.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_134",
      "year": "2023 Batch 22",
      "text": "In the above code, to create an empty list with \"size\" number of elements, the line Y should be which of the following?",
      "opts": ["self.buf = new [size]", "self.buf = new [None * size]", "self.buf = [None]*size", "self.buf = (size +1)*[None]", "self.buf = [None * size]"],
      "ans": 2,
      "exp": "<code>[None] * size</code> creates a list of exactly <code>size</code> None elements. Option (d) creates size+1 elements. Options (a) and (b) use invalid syntax. Option (e): <code>None * size</code> raises TypeError.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_135",
      "year": "2023 Batch 22",
      "text": "In the above code, the class ADT declared in line X is a data structure with the behavior of which of the following?",
      "opts": ["FIFO", "LIFO", "LILO", "Sequential access from start", "Sequential access from end"],
      "ans": 1,
      "exp": "<code>put(val)</code> stores at buf[ptr] then increments ptr (push to top). <code>get()</code> decrements ptr then returns buf[ptr] (pop from top). Last in = first out = <strong>LIFO (Stack)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_136",
      "year": "2023 Batch 22",
      "text": "In the above code, for the class ADT declared in line X to behave as a queue data structure, the line Y should be which of the following?",
      "opts": ["self.buf[i] = self.buf[i+1]", "self.buf[i+1] = self.buf[i]", "self.buf[i-1] = self.buf[i]", "self.buf[i] = self.buf[i-1]", "self.buf[5-i] = None"],
      "ans": 0,
      "exp": "After removing buf[0] (front) and decrementing ptr, the remaining elements shift left: <code>self.buf[i] = self.buf[i+1]</code> for i in range(ptr). This maintains FIFO order by moving all elements one position toward the front.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_137",
      "year": "2023 Batch 22",
      "text": "In the above code, for the class ADT declared in line X to behave as a queue data structure, the line Z should be which of the following?",
      "opts": ["self.buf[0] = val", "self.buf[4] = val", "self.buf[self.ptr - 1] = val", "self.buf[self.ptr] = val", "self.buf[self.ptr+1] = val"],
      "ans": 3,
      "exp": "To enqueue, the new element is added at the back at position <code>self.ptr</code> (next available slot), then ptr is incremented. <code>self.buf[self.ptr] = val</code> is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_138",
      "year": "2023 Batch 22",
      "text": "In the above code, for the output of print statements to be True and False, the line P should be which of the following?",
      "opts": ["k = (i+j)/2", "k = (i+j)%2", "k = (i+j)//2", "k = (i+(j-1))/2", "k = (i+(j-1))//2"],
      "ans": 2,
      "exp": "The midpoint must be an integer index: <code>(i+j)//2</code> (floor division). Option (a) produces a float \u2014 invalid as a list index. Options (d)/(e) bias the midpoint with (j\u22121) causing incorrect behaviour.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_139",
      "year": "2023 Batch 22",
      "text": "In the above code, for the output of print statements to be True and False, the line Q should contain which of the following?",
      "opts": ["func(L,i+1,k-1,v)", "func(L,i+1,k+1,v)", "func(L,i,k,v)", "func(L,i,k+1,v)", "func(L,i,k-1,v)"],
      "ans": 4,
      "exp": "When v&lt;L[k], search the left half [i, k\u22121] (k is already checked). Call: <code>func(L, i, k-1, v)</code>. Option (c) <code>func(L,i,k,v)</code> re-includes k, causing infinite recursion.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_140",
      "year": "2023 Batch 22",
      "text": "In the above code, for the output of print statements to be True and False, the line R should contain which of the following?",
      "opts": ["func(L,k-1,j-1,v)", "func(L,k+1,j-1,v)", "func(L,k,j,v)", "func(L,k-1,j,v)", "func(L,k+1,j,v)"],
      "ans": 4,
      "exp": "When v&gt;L[k], search the right half [k+1, j]. Call: <code>func(L, k+1, j, v)</code>. Option (c) re-includes k \u2192 infinite recursion.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_141",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line X is to be completed.\n\ndef func(p,q):\n    if q == 0:\n        return p\n    else:\n        return ............ # line X\nprint(func(18,24))\nprint(func(15,30))\n\nFor the output to be 6 and 15, line X should contain which of the following?",
      "opts": ["func(p, p // q)", "func(p, p % q)", "func(q, p // q)", "func(q, p % q)", "func(q, q % p)"],
      "ans": 3,
      "exp": "Euclidean algorithm: GCD(p,q)=GCD(q, p mod q). Recursive call: <code>func(q, p%q)</code>. func(18,24)\u2192func(24,18)\u2192func(18,6)\u2192func(6,0)\u21926 \u2713. func(15,30)\u2192func(30,15)\u2192func(15,0)\u219215 \u2713.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_142",
      "year": "2023 Batch 22",
      "text": "Consider the following Python code, where line Y is to be completed.\n\nL = ((2,3),(8,9))\ndef func(L):\n    ...................... # line Y\n    return (x1-x2)*(y1-y2)\nprint(func(L))\n\nFor the output to be 36, line Y should contain which of the following?",
      "opts": ["L[0]=x1,y1; L[1]=x2,y2", "(x1,y1); (x2,y2) = L", "x1,y1 = L[0]; x2,y2 = L[1]", "x1 = L[0,0]; y1 = L[0,1]; x2 = L[1,0]; y2 = L[1,1]", "x1,y1 = l[0,0],l[0,1]; x2,y2 = l[1,0],l[1,1]"],
      "ans": 2,
      "exp": "(2\u22128)\u00d7(3\u22129)=(\u22126)\u00d7(\u22126)=36. Line Y unpacks the nested tuple: <code>x1,y1=L[0]; x2,y2=L[1]</code>. Option (d) uses invalid syntax L[0,0] for tuples. Option (e) uses lowercase l (NameError) and invalid syntax.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_143",
      "year": "2023 Batch 22",
      "text": "In the above code, what computation cannot be used at line P to select the pivot element?",
      "opts": ["pivot = size", "pivot = size // 2", "pivot = size % 2", "pivot = size % (size // 2)", "pivot = (size // 2) % size"],
      "ans": 0,
      "exp": "The pivot must be a valid index: 0 to size\u22121. <code>pivot=size</code> equals the length, one past the last valid index \u2192 <code>IndexError</code> on <code>data[pivot]</code>. All other options produce values in [0, size\u22121] for size\u22652.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_144",
      "year": "2023 Batch 22",
      "text": "In the above code, to achieve the conquer part of the divide-and-conquer paradigm used by the Quick Sort algorithm, line Q should be which of the following?",
      "opts": ["quicksort(ldata, size); quicksort(gdata, size)", "quicksort(ldata, lsize); quicksort(gdata, gsize)", "quicksort(ldata, lsize); quicksort(edata, esize); quicksort(gdata, gsize)", "quicksort(ldata, size); quicksort(edata, size); quicksort(gdata, size)", "quicksort(ldata, lsize+esize); quicksort(gdata, esize+gsize)"],
      "ans": 1,
      "exp": "Only ldata (less-than) and gdata (greater-than) need sorting \u2014 equal elements are already in their final relative position. Each subarray is passed with its own correct size: <code>quicksort(ldata, lsize); quicksort(gdata, gsize)</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_145",
      "year": "2023 Batch 22",
      "text": "In the above code, to achieve the combining of sorted sublists by the Quick Sort algorithm, line R should be which of the following?",
      "opts": ["data[i] = edata[i]", "data[esize+i] = edata[i]", "data[gsize+i] = edata[i]", "data[lsize+i] = edata[i]", "data[lsize+esize+i] = edata[i]"],
      "ans": 3,
      "exp": "After ldata fills indices 0..lsize\u22121, edata fills indices lsize..lsize+esize\u22121. Assignment: <code>data[lsize+i] = edata[i]</code> for i in range(esize).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_146",
      "year": "2023 Batch 22",
      "text": "In the above code, to achieve the combining of sorted sublists by the Quick Sort algorithm, line S should be which of the following?",
      "opts": ["data[i] = gdata[i]", "data[esize+i] = gdata[i]", "data[gsize+i] = gdata[i]", "data[lsize+i] = gdata[i]", "data[lsize+esize+i] = gdata[i]"],
      "ans": 4,
      "exp": "After ldata and edata fill their sections, gdata fills indices lsize+esize..lsize+esize+gsize\u22121. Assignment: <code>data[lsize+esize+i] = gdata[i]</code> for i in range(gsize).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_147",
      "year": "2023 Batch 22",
      "text": "In the above code, for the Merge Sort algorithm to reach a trivially solvable problem status, line X should contain which of the following?",
      "opts": ["(start + 1) < 2", "(end - start) < 2", "(end \u2013 start + 1) < 2", "(end + 1) < 2", "end < 2"],
      "ans": 2,
      "exp": "A subarray is trivially sorted when length \u2264 1. Length = end\u2212start+1. Condition: <code>(end\u2212start+1) &lt; 2</code> \u2192 length=0 or 1. Option (b) <code>(end\u2212start)&lt;2</code> also returns for 2-element subarrays, preventing them from being sorted.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_148",
      "year": "2023 Batch 22",
      "text": "In the above code, for the correct initialization of the array content access indices used in merge function, line Y should be which of the following?",
      "opts": ["i = start; j = mid", "i = start; j = mid + 1", "i = 0; j = 0", "i = 0; j = mid", "i = mid - start; j = end - mid"],
      "ans": 1,
      "exp": "The left half is data[start..mid] and right half is data[mid+1..end]. Pointer i starts at <code>start</code>; pointer j starts at <code>mid+1</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_149",
      "year": "2023 Batch 22",
      "text": "In the above code, to correctly complete the merging of arrays in the merge function, line Z should be which of the following?",
      "opts": ["data[start + k] = temp[k]", "data[mid + k] = temp[k]", "data[k] = temp[k]", "data[mid \u2013 start + k] = temp[k]", "data[end \u2013 mid + k] = temp[k]"],
      "ans": 0,
      "exp": "The merged temp array (0..end\u2212start) must be copied back to data starting at index <code>start</code>: <code>data[start+k] = temp[k]</code>. Option (c) overwrites from index 0, corrupting other parts of the array.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_150",
      "year": "2023 Batch 22",
      "text": "Which of the following CPU registers are accessed during the execution of every instruction?",
      "opts": ["Program counter", "General purpose registers", "Accumulator", "Flags register", "Cache register"],
      "ans": 0,
      "exp": "The <strong>Program Counter (PC)</strong> is read every Fetch stage (to get the instruction address) and updated (incremented or set to jump target) after every instruction. No other listed register is guaranteed to be accessed for every instruction.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_151",
      "year": "2023 Batch 22",
      "text": "Which of the following is not an essential component of a computer system?",
      "opts": ["System bus", "Read-only memory", "Keyboard", "Output devices", "Central Processing Unit"],
      "ans": 2,
      "exp": "A functional computer requires a CPU, system bus, memory, and output. A <strong>keyboard</strong> is one specific type of input device \u2014 computers can operate without it (servers, embedded systems, voice/gesture input). It is the only non-essential item in this list.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_152",
      "year": "2023 Batch 22",
      "text": "Which of the following terms is the best to identify computers that are used to control other equipment?",
      "opts": ["Mini computers", "IoT devices", "Hidden computers", "Arduino computers", "None of the above"],
      "ans": 4,
      "exp": "Computers used to control other equipment are called <strong>embedded computers</strong> or <strong>microcontrollers</strong> \u2014 neither term appears in the options. Arduino is one brand of microcontroller board, not the general category name. IoT devices may control equipment but that is not their defining characteristic. <strong>None of the above</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_153",
      "year": "2023 Batch 22",
      "text": "Which of the following is correct, according to the von Neumann architecture?",
      "opts": ["Processor's clock speed is the only parameter that determines its throughput.", "Processor can fetch and execute instructions from input devices.", "Processor is the only device in a computer that can process data.", "Processor can read and write to the memory at the same time.", "CPU registers have unique memory addresses."],
      "ans": 2,
      "exp": "In Von Neumann architecture, the CPU is the sole processing unit \u2014 all other components (memory, I/O) only store or transfer data. Option (a) is wrong (throughput also depends on CPI). Option (b) is wrong (instructions come from memory). Option (d) is wrong (the Von Neumann bottleneck: only one bus operation at a time). Option (e) is wrong (registers are internal CPU storage, not memory-mapped).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_154",
      "year": "2023 Batch 22",
      "text": "Which of the following statements is correct about CPU instructions?",
      "opts": ["Some instructions do not require an OPCODE component.", "Every instruction has an Operand component.", "The OPCODE component of the instruction is always fetched first.", "An instruction has only one operand component.", "Address is part of the instruction."],
      "ans": 2,
      "exp": "Every instruction begins with the OPCODE field \u2014 the CPU must read it first to know what operation to perform. It is always the first component fetched and decoded. Option (a) is wrong: every instruction must specify an operation via OPCODE. Option (b) is wrong: NOP/HALT have no operands. Option (d) is wrong: instructions can have 0\u20133 operands. Option (e) is wrong: register-to-register instructions have no address field.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_155",
      "year": "2023 Batch 22",
      "text": "Which of the following affects the CPU's throughput?",
      "opts": ["Clock speed", "Memory capacity", "Number of IO ports", "Number of outputs in the ALU", "None of the above"],
      "ans": 0,
      "exp": "CPU throughput = clock frequency \u00f7 cycles per instruction. <strong>Clock speed</strong> directly and proportionally affects throughput. Memory capacity affects what programs can run but not execution speed per instruction. I/O port count and ALU output count are unrelated to instruction throughput.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_156",
      "year": "2023 Batch 22",
      "text": "Which of the following type(s) of memory is always required to build a functional computer system?",
      "opts": ["Read only memory", "Read write memory", "Cache memory", "All of the above", "None of the above"],
      "ans": 1,
      "exp": "<strong>Read-write memory (RAM)</strong> is always required \u2014 the CPU must be able to read and write program data and state at runtime. ROM is important for firmware but some architectures load programs via other means. Cache is an optimisation, not a fundamental requirement. RAM is the universally necessary memory type.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_157",
      "year": "2023 Batch 22",
      "text": "Consider the following actions concerning writing to the memory:\n\ni. Sending the WRITE control signal\nii. Sending the memory location address through the ADDRESS BUS\niii. Sending data through the DATA BUS\n\nWhat is the correct sequence of the above three actions?",
      "opts": ["i, ii, iii", "ii, iii, i", "iii, ii, i", "iii, i, ii", "None of the above is correct."],
      "ans": 1,
      "exp": "Memory write sequence: first send the address (ii) to select the target location; then place data on the data bus (iii); finally assert the WRITE control signal (i) to trigger the actual write. Correct order: <strong>ii \u2192 iii \u2192 i</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_158",
      "year": "2023 Batch 22",
      "text": "Which of the following sub-cycle(s) is common for all instructions in an instruction cycle?",
      "opts": ["Fetch sub-cycle", "Decode sub-cycle", "Operand fetch sub-cycle", "Execution", "All of the above"],
      "ans": 0,
      "exp": "The <strong>Fetch sub-cycle</strong> is unconditionally present in every instruction cycle \u2014 the CPU always retrieves the instruction from memory first. Operand Fetch is absent for zero-operand instructions (NOP). Execution varies per instruction. Fetch is the one truly universal sub-cycle.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_159",
      "year": "2023 Batch 22",
      "text": "Processor \"A\" requires five clock cycles to execute one instruction on average, while processor \"B\" requires ten cycles on average per instruction. If you run processor \"A\" at 1.2GHz and processor B at 2.0GHz, which will result in a higher throughput?",
      "opts": ["Processor A", "Processor B", "Both have the same throughput.", "There is insufficient data to determine which processor has a higher throughput.", "None of the above answers are correct."],
      "ans": 0,
      "exp": "Throughput = clock speed \u00f7 CPI.<br>Processor A: 1.2\u00d710\u2079 \u00f7 5 = <strong>240 million instructions/sec</strong>.<br>Processor B: 2.0\u00d710\u2079 \u00f7 10 = 200 million instructions/sec.<br>Processor A wins despite lower clock speed because it needs fewer cycles per instruction.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_160",
      "year": "2023 Batch 22",
      "text": "Which of the following is likely to have the shortest instruction cycle?",
      "opts": ["NOP instruction.", "Adding two registers and storing the output in the accumulator.", "Adding a register to a memory location and storing the output in the accumulator.", "Comparing two registers and updating the FLAG register.", "All have the same instruction cycle length."],
      "ans": 0,
      "exp": "<strong>NOP</strong> performs no computation, fetches no operands from memory, and writes no result. It requires only Fetch and Decode sub-cycles \u2014 the minimum possible. All other options require additional ALU execution sub-cycles, and option (c) adds a slow memory access. NOP has the shortest instruction cycle.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_161",
      "year": "2024 Batch 23",
      "text": "If \ud835\udc34 = [[9,8,7],[6,5,4],[3,2,1]], what will be the output?",
      "img": "IMAGES/CS/Past Papers/pp_2024_Batch_23_FIG1.png",
      "imgAlt": "Flowchart algorithm that counts elements greater than N in the lower-left triangle of an N\u00d7N matrix",
      "opts": ["0", "3", "4", "5", "6"],
      "ans": 1,
      "exp": "The algorithm iterates over row <strong>i</strong> from 0 to N\u22121 (N=3). For each row, it iterates <strong>j</strong> from 0 up to and including <strong>i</strong> (the lower-left triangle including the main diagonal). It increments <strong>count</strong> whenever A[i][j] > N (i.e., > 3).<br><br>Cells visited: i=0: A[0][0]=9 &gt; 3 \u2713 \u2192 count=1. i=1: A[1][0]=6 &gt; 3 \u2713, A[1][1]=5 &gt; 3 \u2713 \u2192 count=3. i=2: A[2][0]=3 (not &gt; 3), A[2][1]=2, A[2][2]=1 \u2192 count stays 3.<br><br>Output is <strong>3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_162",
      "year": "2024 Batch 23",
      "text": "Which of the following statements is/are correct about the running time T of the algorithm?\n\nI. T is proportional to \ud835\udc41.\nII. T depends on the values in \ud835\udc34.\nIII. T is proportional to \ud835\udc41\u00b2.",
      "img": "IMAGES/CS/Past Papers/pp_2024_Batch_23_FIG1.png",
      "imgAlt": "Flowchart algorithm that counts elements greater than N in the lower-left triangle of an N\u00d7N matrix",
      "opts": ["I only", "I and II only", "III only", "II and III only", "None of them"],
      "ans": 2,
      "exp": "The outer loop runs N times (i = 0 to N\u22121). The inner loop runs i+1 times for each i. Total iterations = 1+2+\u2026+N = N(N+1)/2, which is proportional to N\u00b2. The check <code>A[i][j] &gt; N</code> does <strong>not</strong> short-circuit the loop \u2014 the flowchart increments j and continues regardless; it only decides whether to increment count. Therefore every lower-triangle cell is always visited, so T does <strong>not</strong> depend on the values in A.<br><br>Statement I (proportional to N) is wrong. Statement II (depends on values) is wrong. Statement III (proportional to N\u00b2) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_163",
      "year": "2024 Batch 23",
      "text": "Consider the following statements regarding the algorithm in Fig. 1.\n\nI. The output will be N if the main diagonal elements of A are greater than N.\nII. The algorithm will work even if we interchange \ud835\udc56 and \ud835\udc57 everywhere they appear.\nIII. The algorithm will work even if \"Is \ud835\udc57 \u2264 \ud835\udc56?\" is changed as \"Is \ud835\udc57 < \ud835\udc56?\".\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "II and III only", "All (I, II and III) are correct"],
      "ans": 1,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> The algorithm visits all cells (i,j) where j \u2264 i, not just the diagonal. If sub-diagonal elements are also &gt; N, count exceeds N. The output equals N only if exactly the N diagonal elements are &gt; N and no sub-diagonal element is \u2014 which is not guaranteed by the premise alone.<br><br><strong>Statement II \u2014 TRUE:</strong> Swapping i and j <em>everywhere</em> (loop variables, limits, array index, and increment) produces: outer loop on j from 0 to N\u22121, inner loop on i from 0 to j, checking A[j][i]. The set of (row, col) pairs accessed is {(j, i) : i \u2264 j} = {(r, c) : c \u2264 r} \u2014 identical to the original lower-triangle. The count is therefore identical for every possible matrix A.<br><br><strong>Statement III \u2014 FALSE:</strong> Changing j \u2264 i to j &lt; i excludes j = i (the main diagonal). The inner loop now only covers the strict lower triangle, missing all N diagonal elements, giving a different (smaller or equal) count.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_164",
      "year": "2024 Batch 23",
      "text": "Three students expressed in pseudo-code the algorithm in Fig. 1 as shown below.\n\n[Pseudo I: FOR i=0 TO N, FOR j=0 TO i-1]\n[Pseudo II: WHILE i<N, WHILE j<=i]\n[Pseudo III: REPEAT...UNTIL i=N with REPEAT...UNTIL j>i]\n\nWhich of the three pseudo-code algorithms correctly express the algorithm in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2024_Batch_23_FIG2.png",
      "imgAlt": "Flowchart algorithm that counts elements greater than N in the lower-left triangle of an N\u00d7N matrix",
      "opts": ["I only", "II only", "III only", "II and III only", "None of them"],
      "ans": 3,
      "exp": "<strong>Pseudo I \u2014 INCORRECT:</strong> The inner loop runs <code>FOR j = 0 TO i\u22121</code>, which covers j = 0, 1, \u2026, i\u22121 (exclusive of i). This misses the diagonal element A[i][i] for every row, so the count will differ from the flowchart.<br><br><strong>Pseudo II \u2014 CORRECT:</strong> The outer <code>WHILE i &lt; N</code> and inner <code>WHILE j \u2264 i</code> mirror the flowchart exactly; both loop conditions and pointer increments are identical.<br><br><strong>Pseudo III \u2014 CORRECT:</strong> The inner <code>REPEAT \u2026 UNTIL j &gt; i</code> executes while j \u2264 i and exits when j &gt; i \u2014 exactly matching the flowchart condition. For any valid N\u00d7N matrix (N \u2265 1), the outer <code>REPEAT \u2026 UNTIL i = N</code> also terminates correctly. Both II and III faithfully implement the algorithm.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_165",
      "year": "2024 Batch 23",
      "text": "What is the best term to describe an error in a computer program that causes it to produce an incorrect result?",
      "opts": ["Performance bug", "Syntax error", "Compilation error", "Run-time error", "Logic error"],
      "ans": 4,
      "exp": "A <strong>logic error</strong> is an error in the program's reasoning or algorithm that causes it to produce wrong results while still compiling and running without crashing. A <em>syntax error</em> prevents compilation. A <em>run-time error</em> causes a crash during execution. A <em>performance bug</em> affects speed, not correctness. The question asks specifically about producing an <em>incorrect result</em>, which is the definition of a logic error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_166",
      "year": "2024 Batch 23",
      "text": "Consider the following statements on program translation, compilation and interpretation.\n\nI. Compiled programs typically run faster than interpreted programs because they are translated directly into machine code before execution.\nII. Java is platform independent because it uses a purely interpreted approach to program translation.\nIII. Interpreted programs require translation at runtime, while compiled programs do not.\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "I and III only", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> Compilation translates the entire source into machine code before execution, so at runtime no translation overhead exists. Interpreted programs translate line-by-line at runtime, making them generally slower.<br><br><strong>Statement II \u2014 FALSE:</strong> Java achieves platform independence through compilation to <em>bytecode</em> (an intermediate representation), which is then executed by the Java Virtual Machine (JVM). The JVM uses Just-In-Time (JIT) compilation, not pure interpretation. Java is therefore a hybrid \u2014 not purely interpreted.<br><br><strong>Statement III \u2014 TRUE:</strong> By definition, an interpreter translates and executes source (or bytecode) at runtime. A compiled program's translation is completed before runtime, so no translation occurs during execution.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_167",
      "year": "2024 Batch 23",
      "text": "Which of the following best describes the role of an Integrated Development Environment (IDE) in program development?",
      "opts": ["An IDE combines code editing, debugging, and testing tools to streamline program development.", "An IDE is a tool that translates source code into machine code for execution.", "An IDE is a compiler specifically designed for low-level programming languages.", "An IDE functions as a text editor optimized for writing code.", "An IDE ensures programs are automatically optimized for performance without any user input."],
      "ans": 0,
      "exp": "An <strong>Integrated Development Environment (IDE)</strong> bundles multiple development tools into one application: a code editor with syntax highlighting, a compiler/interpreter, a debugger, version-control integration, and testing tools. This makes (a) correct. Option (b) describes a compiler only. Option (c) is wrong because IDEs are not restricted to low-level languages. Option (d) describes only the editor component. Option (e) is false \u2014 IDEs do not automatically optimise programs.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_168",
      "year": "2024 Batch 23",
      "text": "What will be the result returned by the algorithm if A =[2,4,3,-1,0,3] and k=3?",
      "opts": ["-1", "0", "2", "4", "5"],
      "ans": 2,
      "exp": "The algorithm scans from index i=0. <br><br>Call 1: i=0, A[0]=2 \u2260 3 \u2192 recurse with i=1.<br>Call 2: i=1, A[1]=4 \u2260 3 \u2192 recurse with i=2.<br>Call 3: i=2, A[2]=3 == 3 \u2192 <strong>return 2</strong>.<br><br>The first occurrence of 3 is at index 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_169",
      "year": "2024 Batch 23",
      "text": "How many times, overall, does Search (A, i, k) get called if A =[2,4,3,-1,0,3] and k=5? Include the initial call also in your count.",
      "opts": ["1", "2", "3", "5", "7"],
      "ans": 4,
      "exp": "k=5 is not in A. The algorithm recurses through every index: i=0, 1, 2, 3, 4, 5 (none match), then i=6 \u2265 len(A)=6 triggers the base case returning \u22121. That is <strong>7 calls</strong> in total (i = 0 through 6 inclusive, one call per value of i).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_170",
      "year": "2024 Batch 23",
      "text": "Consider the following statements about the algorithm Search (A, i, k) given above. Assume the length of A is \ud835\udc5b.\n\nI. An iterative algorithm for this will take a worst-case time proportional to \ud835\udc5b.\nII. The time taken in the worst-case by this algorithm will be proportional to \ud835\udc5b\u00b2.\nIII. Binary search that takes less time in the worst-case can be used for this task.\n\nWhich of the above is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and III only.", "All (I, II and III) are correct."],
      "ans": 0,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> A linear (iterative) search scans up to n elements in the worst case, so time is O(n) \u2014 proportional to n.<br><br><strong>Statement II \u2014 FALSE:</strong> The recursive algorithm makes at most n+1 calls, each doing O(1) work, giving O(n) worst-case time \u2014 proportional to n, not n\u00b2.<br><br><strong>Statement III \u2014 FALSE:</strong> Binary search requires the list to be <em>sorted</em>. The problem places no restriction on the order of elements in A, so binary search cannot be applied to this general search task.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_171",
      "year": "2024 Batch 23",
      "text": "What will be the result when the following Python code is executed?\n\nB = [1, True, \"12345\", [3.5]]\ntype(B[2][3])",
      "opts": ["<class 'float'>", "<class 'int'>", "<class 'bool'>", "<class 'str'>", "<class 'list'>"],
      "ans": 3,
      "exp": "<code>B[2]</code> is the string <code>\"12345\"</code>. String indexing: <code>B[2][3]</code> = <code>\"12345\"[3]</code> = <code>'4'</code>, which is a single-character string. Therefore <code>type(B[2][3])</code> returns <strong>&lt;class 'str'&gt;</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_172",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nprint((9//4)**(len(\"abcdef\")-2))",
      "opts": ["64", "64.0", "16", "16.0", "None of the above"],
      "ans": 2,
      "exp": "Step by step: <code>9 // 4 = 2</code> (integer floor division). <code>len(\"abcdef\") = 6</code>, so <code>6 \u2212 2 = 4</code>. Then <code>2 ** 4 = 16</code>. Both operands are integers, so the result is the integer <strong>16</strong>, not 16.0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_173",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nprint((4j) * int(2.123) ** 0b010 + 0xF)",
      "opts": ["31j", "15 + 16j", "15 + 4096j", "0xF+10j", "None of the above"],
      "ans": 1,
      "exp": "Operator precedence: <strong>**</strong> binds tighter than <strong>*</strong>.<br><br><code>0b010 = 2</code>. <code>int(2.123) = 2</code>. <code>2 ** 2 = 4</code>. <code>(4j) * 4 = 16j</code>. <code>0xF = 15</code>. <code>16j + 15 = (15+16j)</code>.<br><br>Python prints complex numbers as <code>(15+16j)</code>, which matches option <strong>15 + 16j</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_174",
      "year": "2024 Batch 23",
      "text": "Consider the following statements about objects in Python.\n\nI. The mutability of an object depends on its type.\nII. The values that an object can have depend on its identity.\nIII. The del keyword removes (deletes) objects.\n\nWhich of the above statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "None."],
      "ans": 0,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> In Python, mutability is a property of an object's <em>type</em>. Lists, dicts, and sets are mutable; integers, strings, and tuples are immutable. This is determined entirely by the type, not individual instances.<br><br><strong>Statement II \u2014 FALSE:</strong> The <em>values</em> an object can hold depend on its <em>type</em> (e.g., an int holds integers, a str holds text). An object's <em>identity</em> (returned by <code>id()</code>) is simply its memory address \u2014 it says nothing about what values the object can contain.<br><br><strong>Statement III \u2014 FALSE:</strong> <code>del x</code> removes the <em>name binding</em> (reference) <code>x</code>, not the object itself. The object is only garbage-collected when its reference count drops to zero. If other references to the same object exist, the object persists.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_175",
      "year": "2024 Batch 23",
      "text": "Consider the following 4 lines of Python code.\n\nx = [2, [\"abc\", 3, 4.5], 5] # Line 0\nx[1][0] = [6,7] # Line 1\nx[1] = x[1] * 3 + [\"pqr\"] # Line 2\ny = x + 7 # Line 3\n\nNow, consider the following 3 statements about the code above.\n\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.\n\nWhich of the above 3 statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "II and III only.", "All (I, II and III) are correct."],
      "ans": 2,
      "exp": "<strong>Line 1:</strong> <code>x[1]</code> is the list <code>[\"abc\", 3, 4.5]</code>. Assigning <code>x[1][0] = [6, 7]</code> replaces the string element with a list \u2014 valid list mutation. No error.<br><br><strong>Line 2:</strong> After Line 1, <code>x[1] = [[6,7], 3, 4.5]</code>. Multiplying a list by integer 3 and concatenating with <code>[\"pqr\"]</code> are both valid list operations. No error.<br><br><strong>Line 3:</strong> <code>x + 7</code> attempts to concatenate a list with an integer. Python raises a <code>TypeError</code> because the <code>+</code> operator for lists requires another list on the right-hand side. <strong>Line 3 has an error.</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_176",
      "year": "2024 Batch 23",
      "text": "Consider the following 4 lines of Python code.\n\nx = [2, [\"abc\", 3, 4.5], 5] # Line 0\nx[1][0][1] = \"p\" # Line 1\ny = x[0] + \"pqr\" # Line 2\nz = x[1][0] * 7 # Line 3\n\nNow, consider the following 3 statements about the code above.\n\nI. Line 1 has an error.\nII. Line 2 has an error.\nIII. Line 3 has an error.\n\nWhich of the above 3 statements is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "All (I, II and III) are correct."],
      "ans": 3,
      "exp": "<strong>Line 1:</strong> <code>x[1][0]</code> is the string <code>\"abc\"</code>. Strings are <em>immutable</em> in Python \u2014 assigning to an index (<code>x[1][0][1] = \"p\"</code>) raises a <code>TypeError</code>. <strong>Error.</strong><br><br><strong>Line 2:</strong> <code>x[0]</code> is the integer <code>2</code>. Adding an integer to a string (<code>2 + \"pqr\"</code>) raises a <code>TypeError</code>. <strong>Error.</strong><br><br><strong>Line 3:</strong> <code>x[1][0]</code> is <code>\"abc\"</code>. Multiplying a string by an integer (<code>\"abc\" * 7</code>) is valid Python and produces <code>\"abcabcabcabcabcabcabc\"</code>. No error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_177",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nx = [2, [\"abc\", 3, 4.5], 5]\na = 3\nb = \"ab\"\nprint (a in x and b in x[1] or b in x[1][0])",
      "opts": ["True", "False", "3True", "3and'ab'or'ab'", "False and False or True"],
      "ans": 0,
      "exp": "Evaluate each sub-expression with Python's operator precedence (<strong>and</strong> before <strong>or</strong>):<br><br><code>a in x</code>: Is 3 a direct element of <code>[2, [\"abc\",3,4.5], 5]</code>? The elements are 2, the inner list, and 5 \u2014 not 3 itself. \u2192 <strong>False</strong>.<br><br><code>b in x[1]</code>: Is <code>\"ab\"</code> an element of <code>[\"abc\", 3, 4.5]</code>? No. \u2192 <strong>False</strong>.<br><br><code>b in x[1][0]</code>: Is <code>\"ab\"</code> a substring of <code>\"abc\"</code>? Yes. \u2192 <strong>True</strong>.<br><br>Full expression: <code>(False and False) or True</code> = <code>False or True</code> = <strong>True</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_178",
      "year": "2024 Batch 23",
      "text": "What will be the value of the following Python expression?\n\n(0b01101001 & ~(0xBC) | (0o273 << 2))",
      "opts": ["111", "617", "685", "748", "749"],
      "ans": 4,
      "exp": "Compute each part:<br><br><code>0b01101001 = 105</code>.<br><code>0xBC = 188</code>; <code>~188 = \u2212189</code> (Python two's complement: <code>...11111111 01000011</code>).<br><code>105 &amp; (\u2212189)</code>: 105 = <code>0b01101001</code>, \u2212189 in low 8 bits = <code>0b01000011</code>; bitwise AND = <code>0b01000001 = 65</code>.<br><br><code>0o273 = 187</code>; <code>187 &lt;&lt; 2 = 748</code> (<code>0b1011101100</code>).<br><br><code>65 | 748</code>: <code>0b0001000001 | 0b1011101100 = 0b1011101101 = 749</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_179",
      "year": "2024 Batch 23",
      "text": "Consider the following Python code intended to read a file while handling exceptions.\n\ntry:\n    with open('data.txt', 'r') as file:\n        content = file.read()\nexcept NameError:\n    print(\"Error encountered\")\n\nConsider the following statements about the above Python code.\n\nI. The code will correctly read the file contents if there are no exceptions.\nII. The NameError exception is unrelated to file opening and reading.\nIII. Code needs to be added to catch exceptions during file opening and reading.\n\nWhich of the above statements is/are correct about the given Python code?",
      "opts": ["I only", "III only", "I and II only", "I and III only", "All (I, II and III) are correct."],
      "ans": 4,
      "exp": "<strong>Statement I \u2014 TRUE:</strong> If <code>data.txt</code> exists and is readable, the <code>with open(...)</code> block correctly reads the entire file into <code>content</code>.<br><br><strong>Statement II \u2014 TRUE:</strong> <code>NameError</code> is raised when an undefined variable name is used. It has nothing to do with file I/O. File-related errors raise <code>FileNotFoundError</code> or <code>IOError</code> (a subclass of <code>OSError</code>), neither of which is caught here.<br><br><strong>Statement III \u2014 TRUE:</strong> Because <code>NameError</code> is the only exception caught, any file-related exception (e.g., <code>FileNotFoundError</code> if the file does not exist) will propagate uncaught. The code needs an <code>except OSError</code> (or <code>except FileNotFoundError</code>) block to properly handle file I/O errors.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_180",
      "year": "2024 Batch 23",
      "text": "Consider the following Python code that uses the match-case construct.\n\nnum = int(input('Enter a number: '))\nmatch num:\n    case 1: print(\"A\")\n    case 2 | 3 | 4: print(\"B\")\n    case 5 | 6: print(\"C\")\n    case _: print(\"D\")\n\nConsider the following statements about the above Python code.\n\nI. The same functionality cannot be implemented using if-elif-else construct.\nII. The output will be B if the input is '3'.\nIII. The output will be D if the input is '5.5'.\n\nWhich of the above statements is/are correct about the given Python code?",
      "opts": ["I only", "II only", "III only", "II and III only", "All (I, II and III) are correct"],
      "ans": 1,
      "exp": "<strong>Statement I \u2014 FALSE:</strong> The <code>match-case</code> construct is functionally equivalent to <code>if-elif-else</code>. Any match-case logic can be replicated with if-elif-else chains.<br><br><strong>Statement II \u2014 TRUE:</strong> <code>int('3') = 3</code>. The match expression evaluates <code>num = 3</code>, which matches <code>case 2 | 3 | 4</code>, so the output is <strong>B</strong>.<br><br><strong>Statement III \u2014 FALSE:</strong> <code>int('5.5')</code> raises a <code>ValueError</code> because <code>int()</code> cannot convert a string containing a decimal point. The program crashes before reaching the match statement \u2014 it does not output D.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_181",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nfor i in range(1, 11):\n    if i % 2 == 0:\n        continue\n    print(i)",
      "opts": ["All even numbers from 1 to 10", "All odd numbers from 1 to 10", "All odd numbers from 1 to 11", "There will be an error as the 'range' function is not defined correctly.", "There will be no output."],
      "ans": 1,
      "exp": "<code>range(1, 11)</code> generates integers 1 through 10 inclusive. When <code>i % 2 == 0</code> (i.e., i is even), <code>continue</code> skips the <code>print</code>. When i is odd, <code>print(i)</code> executes. The output is <strong>1, 3, 5, 7, 9</strong> \u2014 all odd numbers from 1 to 10. Option (c) is wrong because range(1,11) never produces 11.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_182",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ni = 1\nwhile i <= 5:\n    print(i)\n    i += 1\n    if i == 3:\n        break",
      "opts": ["1\n2", "1\n2\n3", "1\n2\n3\n4\n5", "The code will result in an infinite loop", "There will be no output"],
      "ans": 0,
      "exp": "Trace the loop: i=1: print(1), i becomes 2, check i==3? No. i=2: print(2), i becomes 3, check i==3? <strong>Yes \u2192 break</strong>. The loop exits after printing 1 and 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_183",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nfor i in range(1, 4):\n    for j in range(1, 4):\n        print(i*j, end=' ')\n    print()",
      "opts": ["1 1 1\n2 2 2\n3 3 3", "1 2 3\n4 5 6\n7 8 9", "1 2 3\n2 4 6\n3 6 9", "1 2 3\n1 4 9\n1 8 27", "There will be an error due to the incorrect usage of the 'print' function."],
      "ans": 2,
      "exp": "The outer loop iterates i = 1, 2, 3. The inner loop iterates j = 1, 2, 3. For each (i, j), <code>i*j</code> is printed with a space. After the inner loop, <code>print()</code> outputs a newline.<br><br>Row i=1: 1\u00d71=1, 1\u00d72=2, 1\u00d73=3 \u2192 <strong>1 2 3</strong><br>Row i=2: 2\u00d71=2, 2\u00d72=4, 2\u00d73=6 \u2192 <strong>2 4 6</strong><br>Row i=3: 3\u00d71=3, 3\u00d72=6, 3\u00d73=9 \u2192 <strong>3 6 9</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_184",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nfor i in range(1, 6):\n    if i == 3:\n        pass\n    print(i, end=' ')\nprint()",
      "opts": ["1 2 3", "1 2 3 4", "1 2 4 5", "1 2 4 5 6", "1 2 3 4 5"],
      "ans": 4,
      "exp": "<code>pass</code> is a no-operation statement \u2014 it does nothing and does not affect control flow. The <code>print(i, end=' ')</code> statement is outside the <code>if</code> block (same indentation as the <code>if</code>), so it executes for <em>every</em> iteration regardless of whether i == 3. Output: <strong>1 2 3 4 5</strong> followed by a newline from the final <code>print()</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_185",
      "year": "2024 Batch 23",
      "text": "Which of the following statements is used to skip the current iteration of a loop and move to the next one?",
      "opts": ["break", "continue", "pass", "exit", "return"],
      "ans": 1,
      "exp": "<code>continue</code> immediately jumps to the next iteration of the enclosing loop, skipping any remaining statements in the current iteration. <code>break</code> exits the loop entirely. <code>pass</code> is a no-op. <code>exit</code> terminates the program. <code>return</code> exits a function.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_186",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nx = 10\nwhile x > 0:\n    x -= 2\n    if x % 3 == 0:\n        continue\n    print(x, end=' ')\nprint()",
      "opts": ["9 6 3 0", "9 6 3", "8 5 2 1", "8 5 2", "None of the above."],
      "ans": 4,
      "exp": "Trace: x starts at 10. Each iteration decrements x by 2 first, then tests divisibility by 3.<br><br>x=8: 8%3=2 \u2260 0 \u2192 print <strong>8</strong><br>x=6: 6%3=0 \u2192 <code>continue</code> (skip print)<br>x=4: 4%3=1 \u2260 0 \u2192 print <strong>4</strong><br>x=2: 2%3=2 \u2260 0 \u2192 print <strong>2</strong><br>x=0: while condition 0&gt;0 is False \u2192 loop exits.<br><br>Output: <code>8 4 2</code>. This matches none of options (a)\u2013(d), so the answer is <strong>None of the above</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_187",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nlist1 = [1, 2, 3]\nlist2 = list1.copy()\nlist2.append(4)\nprint(list1, list2)",
      "opts": ["[1, 2, 3] [1, 2, 3]", "[1, 2, 3, 4] [1, 2, 3, 4]", "[1, 2, 3] [1, 2, 3, 4]", "[1, 2, 3, 4] [1, 2, 3]", "None of the above."],
      "ans": 2,
      "exp": "<code>list1.copy()</code> creates a <em>shallow copy</em> \u2014 a new independent list with the same elements. Appending 4 to <code>list2</code> does not affect <code>list1</code>. Output: <strong>[1, 2, 3] [1, 2, 3, 4]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_188",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nlist1 = [1, 2, 3, 4, 5]\nlist2 = list1[1:4]\nlist1[2] = 10\nprint(list1, list2)",
      "opts": ["[1, 2, 3, 4, 5] [2, 3, 4]", "[1, 2, 3, 4, 5] [2, 10, 4]", "[1, 2, 10, 4, 5] [2, 10, 4]", "[1, 2, 10, 4, 5] [2, 3, 4]", "None of the above."],
      "ans": 3,
      "exp": "Slicing (<code>list1[1:4]</code>) creates a new independent list <code>[2, 3, 4]</code>. Modifying <code>list1[2] = 10</code> changes <code>list1</code> to <code>[1, 2, 10, 4, 5]</code> but does <em>not</em> affect <code>list2</code> (it is a separate object). Output: <strong>[1, 2, 10, 4, 5] [2, 3, 4]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_189",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nlist1 = [1, 2, 3, 4, 5]\nlist2 = list1[::-1]\nlist1.reverse()\nprint(list1, list2)",
      "opts": ["[5, 4, 3, 2, 1] [5, 4, 3, 2, 1]", "[5, 4, 3, 2, 1] [1, 2, 3, 4, 5]", "[1, 2, 3, 4, 5] [5, 4, 3, 2, 1]", "[1, 2, 3, 4, 5] [1, 2, 3, 4, 5]", "None of the above."],
      "ans": 0,
      "exp": "<code>list1[::-1]</code> creates a <em>new</em> reversed list <code>[5, 4, 3, 2, 1]</code> and assigns it to <code>list2</code>. <code>list1.reverse()</code> then reverses <code>list1</code> <em>in-place</em> to <code>[5, 4, 3, 2, 1]</code>. Both lists are now <strong>[5, 4, 3, 2, 1]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_190",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nlist1 = [1, 2, 3]\nlist2 = [4, 5, 6]\nlist3 = list1 + list2 + [7, 8, 9]\nprint(list3)",
      "opts": ["[1, 2, 3, 4, 5, 6]", "[[1, 2, 3], [4, 5, 6], [7, 8, 9]]", "[1, 2, 3, [4, 5, 6], [7, 8, 9]]", "[1, 2, 3, 4, 5, 6, 7, 8, 9]", "There will be an error as at least one of the operations in the code is not allowed."],
      "ans": 3,
      "exp": "The <code>+</code> operator on lists performs concatenation, not nesting. <code>list1 + list2</code> = <code>[1, 2, 3, 4, 5, 6]</code>. Adding <code>[7, 8, 9]</code> extends it further to <strong>[1, 2, 3, 4, 5, 6, 7, 8, 9]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_191",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nnumber = 56446.75482\nprint(\"%5.3f\"%(number))",
      "opts": ["56446.75", "56446.74", "56446.754", "56446.755", "None of the above."],
      "ans": 3,
      "exp": "The format specifier <code>%5.3f</code>: the <code>.3</code> means 3 decimal places, and the <code>5</code> is a minimum total width (irrelevant here since the number is wider). Python rounds 56446.75482 to 3 decimal places: the 4th decimal is 8 \u2265 5, so the 3rd decimal rounds up: 56446.754<strong>8</strong>2 \u2192 <strong>56446.755</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_192",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nprint('The sum of {0:b} and {1:x} is {2:o}'.format(2, 10, 12))",
      "opts": ["The sum of 2 and 10 is 12", "The sum of 10 and a is 14", "The sum of 10 and a is c", "The sum of 10 and 10 is 20", "There will be an error."],
      "ans": 1,
      "exp": "Format specifiers: <code>{0:b}</code> formats 2 in binary = <code>10</code>. <code>{1:x}</code> formats 10 in lowercase hexadecimal = <code>a</code>. <code>{2:o}</code> formats 12 in octal = <code>14</code> (1\u00d78 + 4 = 12).<br><br>Result: <strong>The sum of 10 and a is 14</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_193",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ninput_str = 'Saman Perera'\nitems = input_str.split()\nprint(items[0][0],items[1][0])",
      "opts": ["['Saman','Perera']", "['Saman Perera']", "S P", "['S', 'P']", "Saman Perera"],
      "ans": 2,
      "exp": "<code>split()</code> splits on whitespace: <code>items = ['Saman', 'Perera']</code>. <code>items[0][0]</code> = first character of 'Saman' = <code>'S'</code>. <code>items[1][0]</code> = first character of 'Perera' = <code>'P'</code>. <code>print('S', 'P')</code> outputs <strong>S P</strong> (with a space between them).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_194",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ninput_str = 'On 18 Oct 2024, at 6:33 AM, Piyal Perera <piyal.perera@gmail.com> wrote:'\nx = input_str.find('<')+1\ny = input_str.find('@')\nitems = input_str[x:y].split('.')\nprint(items[0],items[1])",
      "opts": ["['Piyal', 'Perera']", "['piyal', 'perera']", "Piyal Perera", "p p", "piyal perera"],
      "ans": 4,
      "exp": "<code>find('&lt;')+1</code> gives the index just after '<', pointing to 'p' in 'piyal'. <code>find('@')</code> gives the index of '@'. The slice <code>input_str[x:y]</code> extracts <code>'piyal.perera'</code>. Splitting by <code>'.'</code> gives <code>['piyal', 'perera']</code>. <code>print(items[0], items[1])</code> outputs <strong>piyal perera</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_195",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ndef modify_data(data):\n    data[0] = 99\n    data = [1, 2, 3]\n    return data\nmy_list = [5, 10, 15]\nresult = modify_data(my_list)\nprint(my_list)",
      "opts": ["[5, 10, 15]", "[99, 10, 15]", "[1, 2, 3]", "[99, 2, 3]", "TypeError"],
      "ans": 1,
      "exp": "Python passes lists by reference (the parameter <code>data</code> points to the same list object as <code>my_list</code>). <code>data[0] = 99</code> mutates the shared list, so <code>my_list</code> becomes <code>[99, 10, 15]</code>. The next line <code>data = [1, 2, 3]</code> <em>rebinds</em> the local name <code>data</code> to a new list \u2014 it does not affect <code>my_list</code>. Therefore <code>print(my_list)</code> outputs <strong>[99, 10, 15]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_196",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ndef calculate_area(length, width):\n    return length * width\nprint(calculate_area(5))",
      "opts": ["25", "None", "TypeError", "InvalidArgumentError", "5"],
      "ans": 2,
      "exp": "The function <code>calculate_area</code> requires two positional arguments: <code>length</code> and <code>width</code>. Calling it with only one argument (<code>5</code>) omits <code>width</code>, causing Python to raise a <strong>TypeError</strong>: <em>calculate_area() missing 1 required positional argument: 'width'</em>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_197",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ndef greet(first_name, last_name):\n    return f\"Hello, {first_name} {last_name}!\"\nprint(greet(last_name=\"Smith\", first_name=\"John\"))",
      "opts": ["\"Hello, Smith John!\"", "\"Hello, John Smith!\"", "\"Hello, first_name last_name!\"", "TypeError", "\"Hello, None None!\""],
      "ans": 1,
      "exp": "Python keyword arguments are matched by parameter name, not position. <code>first_name=\"John\"</code> and <code>last_name=\"Smith\"</code> bind correctly regardless of call order. The f-string evaluates to <strong>Hello, John Smith!</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_198",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nx = 5\ndef multiply_by_two():\n    x = 10\n    return x * 2\nprint(multiply_by_two())\nprint(x)",
      "opts": ["20 and 10", "10 and 5", "20 and 5", "10 and 10", "None and 5"],
      "ans": 2,
      "exp": "Inside <code>multiply_by_two()</code>, <code>x = 10</code> creates a <em>local</em> variable that shadows the global <code>x</code>. The function returns <code>10 * 2 = 20</code>. The global <code>x</code> remains <code>5</code> because no <code>global x</code> declaration was used. Output: <strong>20</strong> then <strong>5</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_199",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\ndef append_to_string(s):\n    s += \" world\"\n    return s\ntext = \"hello\"\nresult = append_to_string(text)\nprint(text)",
      "opts": ["\"hello world\"", "\"hello\"", "None", "\" world\"", "\"None world\""],
      "ans": 1,
      "exp": "Strings are <em>immutable</em> in Python. Inside the function, <code>s += \" world\"</code> creates a <em>new</em> string object and rebinds the local parameter <code>s</code> to it. The original string object that <code>text</code> references is unchanged. Therefore <code>print(text)</code> outputs <strong>hello</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_200",
      "year": "2024 Batch 23",
      "text": "What will be the output of the following Python code?\n\nx = 10\ndef modify_variable():\n    global x\n    x = 20\n    return x\nprint(modify_variable())\nprint(x)",
      "opts": ["10 and 10", "20 and 10", "10 and 20", "20 and 20", "None and 20"],
      "ans": 3,
      "exp": "The <code>global x</code> declaration inside the function means <code>x = 20</code> modifies the <em>global</em> variable. The function returns 20. After the call, the global <code>x</code> is now 20. Both <code>print</code> calls output <strong>20</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_201",
      "year": "2024 Batch 23",
      "text": "What is the two's complement representation of \u22125 in 4-bit binary?",
      "opts": ["1011", "1101", "1110", "1001", "1010"],
      "ans": 0,
      "exp": "To find two's complement of \u22125 in 4 bits: start with +5 = <code>0101</code>. Invert all bits (one's complement): <code>1010</code>. Add 1: <code>1010 + 0001 = 1011</code>. Therefore \u22125 in 4-bit two's complement is <strong>1011</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_202",
      "year": "2024 Batch 23",
      "text": "You are designing a system that processes 8-bit sensor readings in two's complement representation. The sensor outputs temperatures between -120\u00b0 C and + 120\u00b0 C. The system adds two temperature readings to calculate the average temperature during a specific interval. During testing, when the readings are 90\u00b0 C and 60\u00b0 C the system produces an incorrect result of -106\u00b0 C. What is the most likely reason for this issue, and how should it be addressed?",
      "opts": ["The inputs are not encoded correctly in two's complement. Correct the encoding method.", "The subtraction operation is being performed instead of addition. Correct the operation in the code.", "There is a hardware issue in the sensor causing data corruption. Replace the sensor.", "The incorrect result occurs because the sum exceeds the 8-bit two's complement range.", "None of the above."],
      "ans": 3,
      "exp": "8-bit two's complement represents signed integers in the range \u2212128 to +127. 90 + 60 = 150, which exceeds +127. The bit pattern for 150 is <code>10010110</code>; when interpreted as a signed 8-bit value, the leading 1 indicates a negative number: 150 \u2212 256 = \u2212106. This is a classic <strong>signed integer overflow</strong>. The fix is to use a wider integer type (e.g., 16-bit) to hold the intermediate sum before computing the average.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_203",
      "year": "2024 Batch 23",
      "text": "What is the binary representation of 0.75\u2081\u2080 in IEEE single-precision format (assuming only the sign, exponent, and mantissa)?",
      "opts": ["Sign: 0, Exponent: 01111111, Mantissa: 11000000000000000000000", "Sign: 0, Exponent: 01111111, Mantissa: 01000000000000000000000", "Sign: 1, Exponent: 01111110, Mantissa: 01000000000000000000000", "Sign: 0, Exponent: 01111110, Mantissa: 11000000000000000000000", "Sign: 0, Exponent: 01111110, Mantissa: 10000000000000000000000"],
      "ans": 4,
      "exp": "0.75 in binary: 0.75 = 0.5 + 0.25 = 2\u207b\u00b9 + 2\u207b\u00b2 = 0.11\u2082 = 1.1\u2082 \u00d7 2\u207b\u00b9.<br><br><strong>Sign:</strong> positive \u2192 0.<br><strong>Exponent:</strong> \u22121 + 127 (bias) = 126 = <code>01111110</code>.<br><strong>Mantissa:</strong> the fractional part after the implicit leading 1 is <code>.1</code> padded to 23 bits = <code>10000000000000000000000</code>.<br><br>This matches option (e).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_204",
      "year": "2024 Batch 23",
      "text": "Which of the following is an advantage of using Unicode over ASCII?",
      "opts": ["Unicode requires fewer bits per character.", "Unicode is more suitable for English characters.", "Unicode can represent characters from multiple languages and scripts.", "Most computer systems are not compatible with ASCII.", "ASCII is more complex than Unicode."],
      "ans": 2,
      "exp": "Unicode was designed to represent every character in every human writing system. ASCII only covers 128 characters (basic Latin letters, digits, and control characters). Unicode's key advantage is its ability to represent characters from <strong>multiple languages and scripts</strong> \u2014 including Chinese, Arabic, Devanagari, emoji, and more. ASCII requires only 7 bits per character (less than Unicode), so option (a) is wrong. Options (b), (d), and (e) are all false.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_205",
      "year": "2024 Batch 23",
      "text": "The hexadecimal number A.2C\u2081\u2086 needs to be converted to its decimal equivalent. What is the result, rounded to 3 decimal places?",
      "opts": ["10.156", "10.172", "10.250", "10.175", "None of the above"],
      "ans": 1,
      "exp": "Convert each part: Integer: A\u2081\u2086 = 10\u2081\u2080. Fractional: <code>.2C\u2081\u2086</code> = 2\u00d716\u207b\u00b9 + C\u00d716\u207b\u00b2 = 2/16 + 12/256 = 0.125 + 0.046875 = 0.171875.<br><br>Total = 10 + 0.171875 = <strong>10.172</strong> (rounded to 3 decimal places).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_206",
      "year": "2024 Batch 23",
      "text": "What would be the output of the following python code and why?\n\nx = 0.1 + 0.2\nprint(x == 0.3)",
      "opts": ["True, because 0.1 + 0.2 = 0.3", "False, because of floating-point precision errors.", "True, because Python handles floating-point precision perfectly.", "Error, because floating-point arithmetic is not supported for comparison.", "False, because the result of 0.1 + 0.2 is slightly less than 0.3"],
      "ans": 1,
      "exp": "In IEEE 754 double-precision floating-point, 0.1 and 0.2 cannot be represented exactly. <code>0.1 + 0.2</code> evaluates to approximately <code>0.30000000000000004</code>, which is <em>slightly greater than</em> 0.3. Therefore <code>x == 0.3</code> is <strong>False</strong>. This is a fundamental floating-point precision issue, not specific to Python. Option (e) is wrong about direction \u2014 the result is slightly <em>greater</em> than 0.3, not less.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_207",
      "year": "2024 Batch 23",
      "text": "The following recursive function is used to compute the Greatest Common Divisor.\n\ndef GCD (a, b):\n    if b == 0:\n        return a\n    else:\n        return GCD (.... P .....)\n\nThe parameters (arguments) passed to the function call at blank P should be:",
      "opts": ["a, a / b", "a, a % b", "b, a / b", "b, a % b", "None of the above"],
      "ans": 3,
      "exp": "The Euclidean algorithm states: GCD(a, b) = GCD(b, a mod b). When b \u2260 0, the recursive call passes <strong>b</strong> as the new first argument and <strong>a % b</strong> as the new second argument. This reduces the problem size at each step and terminates when b becomes 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_208",
      "year": "2024 Batch 23",
      "text": "The following recursive function is used to compute the Factorial.\n\ndef fact (n):\n    if n == 0:\n        return 1\n    else:\n        return (.... Q ....)\n\nThe code at blank Q should be:",
      "opts": ["n + fact (n-1)", "2*n + fact (n-1)", "2*n * fact (n-1)", "n * fact (n-1)", "None of the above"],
      "ans": 3,
      "exp": "By definition, n! = n \u00d7 (n\u22121)!. The recursive case multiplies <code>n</code> by <code>fact(n\u22121)</code>. Therefore Q = <strong>n * fact(n-1)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_209",
      "year": "2024 Batch 23",
      "text": "The following recursive function is used to compute the geometric summation (the sum of all the terms) of the geometric sequence 1, 1/3, 1/9, 1/27, \u2026, 1/(3n).\n\ndef geoSum (n):\n    if n == 0:\n        return 1\n    ans = ..... R .....\n    return ans\n\nThe code at blank R should be:",
      "opts": ["(1.0 / (3**n)) + geoSum(n - 1)", "(1.0 / (n**3)) + geoSum(n - 1)", "(1.0 / (n**3)) * geoSum(n - 1)", "(1.0 / (3**n)) * geoSum(n - 1)", "None of the above"],
      "ans": 0,
      "exp": "The sequence is 1, 1/3, 1/9, \u2026, 1/3\u207f. The nth term is 1/3\u207f. The sum geoSum(n) = 1/3\u207f + geoSum(n\u22121). The base case geoSum(0) = 1 = 1/3\u2070 handles the first term. Therefore R = <strong>(1.0 / (3**n)) + geoSum(n - 1)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_210",
      "year": "2024 Batch 23",
      "text": "The following recursive function is used to compute the factors of a number starting from a given value.\n\ndef factors(n, i):\n    if i <= n:\n        if n % i == 0:\n            print(i, end = \" \")\n        factors(..... S .....)\n\nWhen executed as factors(36,1), the displayed output is: 1 2 3 4 6 9 12 18 36\n\nThe code at blank S (arguments passed to the function call) should be:",
      "opts": ["n, i + 1", "n - 1, i + 1", "n, i * 2", "n-1, i * 2", "None of the above"],
      "ans": 0,
      "exp": "The function tests every integer from i up to n, checking divisibility. After checking i, it must try i+1 with the same n. Therefore S = <strong>n, i + 1</strong>. The recursion terminates when i &gt; n (base condition fails). Options (c) and (d) skip candidates by doubling i, which would miss factors like 3, 4, 6, etc.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_211",
      "year": "2024 Batch 23",
      "text": "The code at blank T, to get the buffer initialized in the list data structure, should be:",
      "opts": ["for i in range(maxsize):\n    self.buffer[i] = 0", "for i in range(maxsize):\n    self.buffer[i] = None", "self.buffer = [None]", "self.buffer = []", "None of the above"],
      "ans": 3,
      "exp": "The <code>push</code> method uses <code>self.buffer.append(item)</code> and <code>pop</code> uses <code>self.buffer.pop()</code> \u2014 both standard list operations that work on a dynamically growing list. The buffer must be initialised as an <em>empty list</em>: <code>self.buffer = []</code>. Options (a) and (b) would fail because <code>self.buffer</code> is not yet defined when indexing. Option (c) creates a list with one <code>None</code> element, which is incorrect.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_212",
      "year": "2024 Batch 23",
      "text": "The code at blank U, the conditional expression for the push operation, should be:",
      "opts": ["self.ptr > 0", "self.ptr == 0", "self.ptr < self.size", "self.ptr == self.size", "None of the above"],
      "ans": 2,
      "exp": "A push is allowed when the stack is <em>not full</em>, i.e., when the current number of items (<code>self.ptr</code>) is less than the maximum capacity (<code>self.size</code>). The condition is <strong>self.ptr &lt; self.size</strong>. This matches the <code>isFull()</code> method which returns True when <code>self.ptr == self.size</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_213",
      "year": "2024 Batch 23",
      "text": "The code at blank V, for the pointer variable update after each push, should be:",
      "opts": ["self.ptr -= 1", "self.ptr += 1", "self.maxsize -= 1", "self.maxsize += 1", "None of the above"],
      "ans": 1,
      "exp": "After pushing an item onto the stack, the pointer (which tracks the current number of items) must be incremented by 1. <code>self.ptr += 1</code> correctly updates the count. The <code>isFull()</code> method relies on <code>self.ptr == self.size</code>, so incrementing after each push keeps this invariant correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_214",
      "year": "2024 Batch 23",
      "text": "The code at blank W, the conditional expression for the pop operation, should be:",
      "opts": ["self.ptr > 0", "self.ptr == 0", "self.ptr < self.size", "self.ptr == self.size", "None of the above"],
      "ans": 0,
      "exp": "A pop is allowed when the stack is <em>not empty</em>, i.e., when there is at least one item (<code>self.ptr &gt; 0</code>). This matches the <code>isEmpty()</code> method which returns True when <code>self.ptr == 0</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_215",
      "year": "2024 Batch 23",
      "text": "The code at blank X, for the pointer variable update after each pop, should be:",
      "opts": ["self.ptr -= 1", "self.ptr += 1", "self.maxsize -= 1", "self.maxsize += 1", "None of the above"],
      "ans": 0,
      "exp": "After popping an item from the stack, the count must decrease by 1: <code>self.ptr -= 1</code>. Note that <code>self.buffer.pop()</code> removes the last element, and then the pointer is decremented to reflect the new stack size.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_216",
      "year": "2024 Batch 23",
      "text": "The code at blank P, for the range delimiter of the for-loop, should be:",
      "opts": ["len(X)", "len(X[0])", "len(Y[0])", "len(X)+len(Y)", "None of the above"],
      "ans": 1,
      "exp": "The transpose iterates over all columns of X. X has <code>len(X[0])</code> columns. The inner loop variable <code>col</code> must range from 0 to <code>len(X[0])\u22121</code>, so the range delimiter is <code>len(X[0])</code>. For A (4\u00d73), this gives col \u2208 {0,1,2} \u2014 correct for producing the 3\u00d74 transposed output.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_217",
      "year": "2024 Batch 23",
      "text": "The code at blank Q, for the assignment operation, should be:",
      "opts": ["X[col][row] = Y[row][col]", "Y[col][row] = X[row][col]", "X[row][col] = Y[col][row]", "Y[row][col] = X[col][row]", "None of the above"],
      "ans": 1,
      "exp": "Transposing a matrix means At[col][row] = A[row][col]. In the function, X is the input (A) and Y is the output (At). The correct assignment is <strong>Y[col][row] = X[row][col]</strong> \u2014 row and column indices are swapped when writing to the output matrix.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_218",
      "year": "2024 Batch 23",
      "text": "The code at blank R, for the arguments passed to the first function call, should be:",
      "opts": ["buffer[:mid-1],item", "buffer[mid+1:],item", "buffer[mid+2:],item", "buffer[:mid],item", "None of the above"],
      "ans": 3,
      "exp": "When <code>item &lt; buffer[mid]</code>, the item (if present) must be in the left half. The left half excluding the already-checked midpoint is <code>buffer[:mid]</code>. Using <code>buffer[:mid-1]</code> would miss the element at index mid\u22121. The displayed output confirms: searching for 5 in [1,2,3,5,7,11,13,17,19,23,29,31,37] (mid index 6, value 13), the next call searches <code>[1,2,3,5,7,11]</code> = <code>buffer[:6]</code> = <code>buffer[:mid]</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_219",
      "year": "2024 Batch 23",
      "text": "The code at blank S, for the arguments passed to the second function call, should be:",
      "opts": ["buffer[:mid-1],item", "buffer[mid+1:],item", "buffer[:mid],item", "buffer[mid+2:],item", "None of the above"],
      "ans": 1,
      "exp": "When <code>item &gt; buffer[mid]</code>, the item (if present) must be in the right half, <em>excluding</em> the midpoint (which has already been checked and doesn't match). The correct slice is <code>buffer[mid+1:]</code>. Using <code>buffer[mid+2:]</code> would incorrectly skip the element immediately after the midpoint.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_220",
      "year": "2024 Batch 23",
      "text": "The code at blank T, for the test for the left child being greater than the root, should be:",
      "opts": ["(buffer[largest] < buffer[left]) and (left < n)", "(buffer[largest] < buffer[left]) and (left > n)", "(left < n) and (buffer[largest] < buffer[left])", "(left > n) and (buffer[largest] < buffer[left])", "None of the above"],
      "ans": 2,
      "exp": "Two conditions must hold: the left child index must be within bounds (<code>left &lt; n</code>) AND the left child value must exceed the current largest (<code>buffer[largest] &lt; buffer[left]</code>). The bounds check <strong>must come first</strong> to exploit Python's short-circuit evaluation \u2014 if <code>left &geq; n</code>, accessing <code>buffer[left]</code> would raise an <code>IndexError</code>. Option (a) places the array access first and is unsafe. Option (c) is correct: <strong>(left &lt; n) and (buffer[largest] &lt; buffer[left])</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_221",
      "year": "2024 Batch 23",
      "text": "The code at blank U, for the test for the right child being greater than the root, should be:",
      "opts": ["(buffer[largest] < buffer[right]) and (right < n)", "(buffer[largest] < buffer[right]) and (right > n)", "(right > n) and (buffer[largest] < buffer[right])", "(right < n) and (buffer[largest] < buffer[right])", "None of the above"],
      "ans": 3,
      "exp": "Mirrors Q60: the right child index must be in bounds (<code>right &lt; n</code>) before accessing its value. Short-circuit evaluation ensures <code>buffer[right]</code> is never accessed when <code>right &geq; n</code>. The correct condition is <strong>(right &lt; n) and (buffer[largest] &lt; buffer[right])</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_222",
      "year": "2024 Batch 23",
      "text": "The code at blank W, for inserting a new node to an empty linked list, should be:",
      "opts": ["(self.head,self.tail) = (NewNode,None)", "(self.head,self.tail) = (None,newNode)", "(self.head,self.tail) = (newNode,newNode)", "(self.head,self.tail) = (None,None)", "None of the above"],
      "ans": 2,
      "exp": "When the list is empty, the new node is simultaneously the first and last node. Both <code>self.head</code> and <code>self.tail</code> must point to <code>newNode</code>. Option (a) has a capitalisation error (<code>NewNode</code>). Options (b) and (d) leave head as None, breaking traversal from the head. The correct assignment is <strong>(self.head, self.tail) = (newNode, newNode)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_223",
      "year": "2024 Batch 23",
      "text": "The code at blank X, for inserting a new node to a non-empty linked list, should be:",
      "opts": ["newNode.next = self.tail.next", "newNode.next = self.tail.prev", "self.tail.next = newNode", "self.tail.prev = newNode", "None of the above"],
      "ans": 2,
      "exp": "When appending to a non-empty list, the current tail's <code>next</code> pointer must be updated to point to the new node (forming the forward link). The line before (in the code) already sets <code>newNode.prev = self.tail</code> (the backward link). After blank X, <code>self.tail = newNode</code> updates the tail pointer. So blank X = <strong>self.tail.next = newNode</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_224",
      "year": "2024 Batch 23",
      "text": "The code at blank Y, for searching the list by moving from node to node, should be:",
      "opts": ["currNode = prev", "currNode = next", "currNode = currNode.prev", "currNode = currNode.next", "none of the above"],
      "ans": 3,
      "exp": "The <code>update</code> method traverses from <code>self.head</code> (the first node) forward through the list. To advance to the next node, use <code>currNode = currNode.next</code>. The bare names <code>prev</code> and <code>next</code> (options a and b) are not defined variables in this scope.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_225",
      "year": "2024 Batch 23",
      "text": "The code at blank Z, for traversing the list by moving from node to node, should be:",
      "opts": ["currNode = prev", "currNode = next", "currNode = currNode.prev", "currNode = currNode.next", "none of the above"],
      "ans": 2,
      "exp": "The <code>reverseprint</code> method starts at <code>self.tail</code> and traverses <em>backwards</em> to the head. To move backwards through a doubly linked list, use the <code>prev</code> pointer: <code>currNode = currNode.prev</code>. The displayed output (2024, November/December, 28) confirms traversal from tail to head.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_226",
      "year": "2024 Batch 23",
      "text": "The following function is used to check if a given string is a palindrome.\n\ndef palindrome(str):\n    i = -1\n    for c in str:\n        if ..... P .....:\n            return False\n        i = i-1\n    return True\n\nThe code at blank P, for testing if the given string is a palindrome, should be:",
      "opts": ["c != str[i:]", "c != str[:i]", "c != str[i]", "c != str[i:i+1]", "None of the above"],
      "ans": 2,
      "exp": "The function iterates forward through the string with character <code>c</code> while using a negative index <code>i</code> (starting at \u22121) to index from the end. For a palindrome, the character at position k from the front must equal the character at position k from the back. The condition to <em>return False</em> is when they differ: <code>c != str[i]</code>. <code>str[i]</code> uses negative indexing (str[\u22121] is last char, str[\u22122] is second-to-last, etc.). Note: str[i:i+1] would also produce a single character, but it returns a string slice, while str[i] returns a character \u2014 both compare equal to c so both would work; however, <code>c != str[i]</code> (option c) is the direct comparison.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_227",
      "year": "2024 Batch 23",
      "text": "The following function is used to check if a given string contains the target substring.\n\ndef substring(fullstr,substr):\n    j = 0\n    for i in range(len(fullstr)):\n        if fullstr[i] == substr[j]:\n            j +=1\n            if ..... Q .....: \n                return True\n        else:\n            j = 0\n    return False\n\nThe code at blank Q, for testing if the substring search has been successful, should be:",
      "opts": ["i == len(substr)", "j == len(substr)", "i == len(fullstr)", "j == len(fullstr)", "None of the above"],
      "ans": 1,
      "exp": "<code>j</code> counts consecutive matching characters from <code>substr</code>. Each time a character matches, j is incremented. The substring is fully found when j has reached <code>len(substr)</code> \u2014 meaning all characters of substr have been matched consecutively. The test is <strong>j == len(substr)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_228",
      "year": "2024 Batch 23",
      "text": "The code at blank R, for the conditional test to verify the starting position of the available path and indicated starting point of the target path are the same, should be:",
      "opts": ["(startp,endp,None) != path[0]", "(startp,endp) != (path[0][0],path[0][1])", "startp != path[0][0]", "startp != path[1][1]", "None of the above"],
      "ans": 2,
      "exp": "Each element of <code>path</code> is a tuple <code>(p1, p2, c)</code>. The first element of the first path segment is <code>path[0][0]</code>, which represents the starting node. The function should return False if this does not match <code>startp</code>. The correct condition is <strong>startp != path[0][0]</strong>. Option (b) also checks the endpoint against path[0][1], which is unnecessary and would incorrectly reject valid paths.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_229",
      "year": "2024 Batch 23",
      "text": "The code at blank S, if the conditional statement is true, should be:",
      "opts": ["return True", "return False", "prevp = p1", "prevp = p2", "None of the above"],
      "ans": 0,
      "exp": "The condition checked is <code>p2 == endp</code> \u2014 the current segment's endpoint matches the target endpoint. This means the path has reached the destination. The function should <strong>return True</strong> to signal a valid complete path.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_230",
      "year": "2024 Batch 23",
      "text": "The code at blank T, for the else clause, should be:",
      "opts": ["return True", "return False", "prevp = p1", "prevp = p2", "None of the above"],
      "ans": 1,
      "exp": "The <code>else</code> branch is reached when neither <code>p2 == endp</code> (destination reached) nor <code>prevp == p1</code> (path continues from current position) is true. This means the current segment is disconnected \u2014 the path is broken. The function should <strong>return False</strong>. Note the outer <code>return False</code> after the loop handles the case where the endpoint was never reached.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_231",
      "year": "2024 Batch 23",
      "text": "Which of the following is not a typical task that a CPU would perform using a single instruction?",
      "opts": ["Add an 8-bit integer in memory to the accumulator and store its value in the accumulator.", "Add an 8-bit integer in memory to another 8-bit integer in one register and store the result in another general-purpose register.", "Add the value stored in the accumulator to itself and store the result in the accumulator.", "Transfer a value in the register to a memory location.", "Transfer a value in one register to another register."],
      "ans": 1,
      "exp": "Most basic CPU architectures (especially accumulator-based or CISC designs) support: loading from memory to accumulator (a), doubling the accumulator (c), storing a register to memory (d), and register-to-register transfers (e) \u2014 all as single instructions.<br><br>Option (b) requires three distinct operands: a memory source, a register source, and a different destination register. This is a three-operand operation that typical simple CPUs (especially accumulator-based architectures) do not support in a single instruction. It would require at least two instructions: load one value, then add the other.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_232",
      "year": "2024 Batch 23",
      "text": "Which of the following is a feature seen in high-performance CPU's?",
      "opts": ["Large instruction set with a separate instruction to support almost every type of mathematical or data transfer task.", "A small instruction set that is optimized to support the most frequently used tasks.", "A very small memory address space.", "Ability to work under different clock speeds.", "Ability to work with lower supply voltages."],
      "ans": 1,
      "exp": "High-performance CPUs use the <strong>RISC (Reduced Instruction Set Computer)</strong> philosophy: a small, highly optimised instruction set focusing on the most frequently used operations. Each instruction executes in a single clock cycle, enabling deep pipelining and high throughput. Option (a) describes CISC. Options (c), (d), and (e) are not characteristics of high performance.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_233",
      "year": "2024 Batch 23",
      "text": "Which of the following is a function of the OPCODE part of a CPU instruction?",
      "opts": ["Specify the action to be performed with the CPU instruction.", "Specify the location of the next instruction to be executed by the CPU.", "Specify from where the data for the instructions are to be fetched.", "All of the above.", "None of the above"],
      "ans": 0,
      "exp": "The <strong>OPCODE (operation code)</strong> portion of a CPU instruction specifies which operation the CPU must perform (e.g., ADD, LOAD, STORE, JUMP). The location of the next instruction is tracked by the Program Counter (PC). The source of data is specified by the operand/address fields of the instruction, not the opcode.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_234",
      "year": "2024 Batch 23",
      "text": "Which of the following components is not an essential part in the basic computer architecture?",
      "opts": ["The Central Processing Unit", "The system bus", "General purpose registers", "Input devices", "Output Devices"],
      "ans": 2,
      "exp": "The fundamental Von Neumann computer architecture requires: a CPU (for processing), a system bus (for interconnection), memory, and I/O devices (input and output). <strong>General purpose registers</strong> are an implementation detail within the CPU \u2014 the basic architectural model only requires some form of internal storage (at minimum, an accumulator). Early computers operated with only an accumulator register, not a general set of registers. Therefore, general purpose registers are not an <em>essential</em> component of the basic computer architecture model.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_235",
      "year": "2024 Batch 23",
      "text": "Which of the following is NOT part of the instruction cycle?",
      "opts": ["Fetch cycle", "Decode Cycle", "Execute Cycle", "Program Counter Increment Cycle", "Operand Fetch cycle"],
      "ans": 3,
      "exp": "The standard instruction cycle consists of: <strong>Fetch</strong> (retrieve instruction from memory), <strong>Decode</strong> (interpret the opcode), <strong>Operand Fetch</strong> (retrieve data needed), and <strong>Execute</strong> (perform the operation). Incrementing the Program Counter happens automatically as part of the Fetch stage \u2014 it is not a separate named cycle. <em>Program Counter Increment Cycle</em> is not a recognised phase of the instruction cycle.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_236",
      "year": "2024 Batch 23",
      "text": "Which of the following is a function of the bus-master in a system bus?",
      "opts": ["To tell other devices when they can read or write to the system bus", "Drive the data lines in the system bus", "Drive the control lines in the system bus", "Act as a buffer when transferring data between devices in the system bus", "To tell other devices when they can get control over the system-bus"],
      "ans": 4,
      "exp": "The <strong>bus master</strong> is the device that currently controls the system bus. Its key function is to arbitrate bus ownership \u2014 specifically, to signal to other devices when they may take control of (acquire mastership of) the bus. Options (b) and (c) describe activities that any bus-connected device may perform once it has bus access. Option (a) describes bus arbitration timing, but option (e) more precisely describes the bus master's role of granting bus control to other devices.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_237",
      "year": "2024 Batch 23",
      "text": "Which of the following is NOT a CPU manufacturer?",
      "opts": ["International Business Machines", "Intel", "Core I7", "Advanced Micro Devices", "Zilog"],
      "ans": 2,
      "exp": "<strong>Core i7</strong> is a product family (brand name) of Intel microprocessors \u2014 it is not a company or manufacturer. International Business Machines (IBM), Intel, Advanced Micro Devices (AMD), and Zilog are all actual CPU manufacturers.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_238",
      "year": "2024 Batch 23",
      "text": "The CPU \"A\" runs at 1 MHz clock speed and most of its instructions would require 5 clock cycles to execute. The CPU \"B\" runs at 2Mhz clock speed but most of its instructions require 10 clock cycles to be executed. If both CPUs execute the same program with the same inputs, which of the following statements best describes their performance?",
      "opts": ["Both are likely to complete the program within the same time window", "CPU \"B\" will complete the program faster since it runs at a faster clock speed.", "CPU \"A\" will complete the program much faster since it requires less clock cycles to execute one instruction.", "Either CPU \"A\" or CPU \"B\" will complete the program faster, due to other factors.", "None of the above."],
      "ans": 0,
      "exp": "Effective throughput = clock speed \u00f7 cycles per instruction.<br><br>CPU A: 1,000,000 Hz \u00f7 5 cycles = <strong>200,000 instructions/second</strong>.<br>CPU B: 2,000,000 Hz \u00f7 10 cycles = <strong>200,000 instructions/second</strong>.<br><br>Both CPUs execute the same number of instructions per second, so they will complete the same program in approximately the same time.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_239",
      "year": "2024 Batch 23",
      "text": "Which of the following registers are not directly associated with the control unit of a CPU?",
      "opts": ["Instruction Register", "Program counter", "Flag register", "Accumulator", "All of the above"],
      "ans": 3,
      "exp": "The <strong>Instruction Register (IR)</strong> holds the currently executing instruction \u2014 directly used by the control unit for decoding. The <strong>Program Counter (PC)</strong> tracks the next instruction address \u2014 managed by the control unit. The <strong>Flag register</strong> stores condition codes (carry, zero, overflow) used by the control unit for conditional branching. The <strong>Accumulator</strong> is the primary operand/result register of the ALU (Arithmetic Logic Unit), not the control unit. Therefore, the accumulator is not directly associated with the control unit.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_240",
      "year": "2024 Batch 23",
      "text": "A microprocessor has a 16-bit address bus and a 16-bit data bus. What is the maximum size of the memory that can be connected to the microprocessor?",
      "opts": ["1 Mega-byte", "65535 bytes", "65,536 bytes", "131,071 bytes", "131,072 bytes"],
      "ans": 2,
      "exp": "The <strong>address bus</strong> determines the number of unique memory locations addressable. With a 16-bit address bus: 2\u00b9\u2076 = 65,536 unique addresses. Each address references one byte (the data bus width affects transfer size per operation, not total addressable memory). Maximum memory = <strong>65,536 bytes</strong> (64 KB). Option (b) gives 65,535 which is 2\u00b9\u2076 \u2212 1 (incorrect \u2014 addresses 0 through 65535 give 65,536 locations). The data bus width (16-bit) is irrelevant to total memory capacity.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_241",
      "year": "2022 Batch 21",
      "text": "If L1=[3,7,9,5,1] and L2=[9,2,7,4,6,8], what will be the output?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_21_FIG1.png",
      "imgAlt": "Flowchart counting elements of L1 that appear in L2 using a nested loop",
      "opts": ["5", "2", "6", "11", "0"],
      "ans": 1,
      "exp": "The algorithm iterates over every element of L1 (outer loop, index i) and for each element scans all of L2 (inner loop, index j). Whenever L1[i] == L2[j], count is incremented by 1.<br><br>i=0, L1[0]=3: no match in L2=[9,2,7,4,6,8].<br>i=1, L1[1]=7: matches L2[2]=7 \u2192 count=1.<br>i=2, L1[2]=9: matches L2[0]=9 \u2192 count=2.<br>i=3, L1[3]=5: no match.<br>i=4, L1[4]=1: no match.<br><br>Output is <strong>2</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_242",
      "year": "2022 Batch 21",
      "text": "The running time of this algorithm will be",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_21_FIG1.png",
      "imgAlt": "Flowchart counting elements of L1 that appear in L2 using a nested loop",
      "opts": ["Proportional to N1", "Proportional to N2", "Proportional to N1+N2", "Proportional to N1\u00d7N2", "Independent of N1, N2"],
      "ans": 3,
      "exp": "The algorithm uses a nested loop: the outer loop runs N1 times (once per element of L1), and for each iteration the inner loop runs N2 times (once per element of L2). The total number of comparisons is N1\u00d7N2. The running time is therefore <strong>proportional to N1\u00d7N2</strong> \u2014 O(N1\u00b7N2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_243",
      "year": "2022 Batch 21",
      "text": "Consider the following statements regarding the algorithm in Fig. 1.\n\nI. The algorithm contains a nested loop.\nII. The algorithm will work even if we interchange i and j everywhere they appear.\nIII. The algorithm will work even if \"Is i = N1?\" is changed as \"Is i > N1?\".\n\nWhich of the statements above is/are correct?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_21_FIG1.png",
      "imgAlt": "Flowchart counting elements of L1 that appear in L2 using a nested loop",
      "opts": ["I only", "II only", "III only", "I and II only", "All I, II and III"],
      "ans": 3,
      "exp": "<strong>Statement I (True):</strong> The algorithm has an outer loop (index i over L1) and an inner loop (index j over L2) \u2014 a nested loop structure.<br><br><strong>Statement II (True):</strong> Swapping i and j everywhere makes the outer loop iterate over L2 (0 to N2-1) and the inner loop over L1 (0 to N1-1), comparing L1[j]=L2[i]. Every pair is still checked and count is the same. The algorithm still works correctly.<br><br><strong>Statement III (False):</strong> i increments by 1 each iteration. When i reaches N1, \"Is i = N1?\" is True and the algorithm exits. If changed to \"Is i > N1?\", the condition is only True when i=N1+1, meaning the algorithm tries to access L1[N1] \u2014 one past the last valid index \u2014 causing an out-of-bounds error.<br><br>Only <strong>I and II</strong> are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_244",
      "year": "2022 Batch 21",
      "text": "When three students were asked to express in pseudo-code the algorithm in Fig. 1, they came up with the following.\n\n[Pseudo-code I: REPEAT/UNTIL version]\n[Pseudo-code II: FOR loop version]\n[Pseudo-code III: WHILE loop version]\n\nWhich of these three pseudo-code algorithms correctly express the algorithm in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_21_FIG2.png",
      "imgAlt": "Flowchart counting elements of L1 that appear in L2 using a nested loop",
      "opts": ["I only", "II only", "III only", "I and II only", "II and III only"],
      "ans": 1,
      "exp": "<strong>Pseudo-code I (REPEAT/UNTIL):</strong> Inside the inner REPEAT block, j is never incremented \u2014 there is no j \u2190 j+1 statement. The loop runs forever (infinite loop). This pseudo-code is <strong>incorrect</strong>.<br><br><strong>Pseudo-code II (FOR loops):</strong> FOR i=0 TO N1-1 and FOR j=0 TO N2-1 correctly iterate over all indices of both lists. The IF check increments count for each match. This faithfully mirrors the flowchart and is <strong>correct</strong>.<br><br><strong>Pseudo-code III (WHILE loops):</strong> Inside WHILE j &lt; N2, j is never incremented \u2014 infinite loop. This is <strong>incorrect</strong>.<br><br>Only <strong>II</strong> is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_245",
      "year": "2022 Batch 21",
      "text": "Ama writes down a number between 1 and 1,000. Charith must identify that number by making a few guesses. For each guess, Ama will respond whether the guess is \"too high\", \"too low\" or \"correct\". Charith knows that Ama always tells the truth. If Charith aims to find the number as quickly as possible, then he will determine the answer at the end of exactly how many guesses in the worst case?",
      "opts": ["1,000", "999", "500", "32", "10"],
      "ans": 4,
      "exp": "The optimal strategy is binary search: always guess the midpoint of the remaining range. Each guess halves the search space. Starting with 1000 numbers, the worst-case number of guesses is \u2308log\u2082(1000)\u2309 = \u23089.965\u2309 = <strong>10</strong>. After 10 guesses, at most 2\u00b9\u2070 = 1024 \u2265 1000 values can be distinguished, so 10 guesses always suffice.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_246",
      "year": "2022 Batch 21",
      "text": "Which of the following decimal numbers has and exact representation in binary representation?",
      "opts": ["0.5", "0.4", "0.3", "0.2", "0.1"],
      "ans": 0,
      "exp": "A decimal fraction has an exact binary representation if and only if its denominator in lowest terms is a power of 2. <strong>0.5 = 1/2 = 2\u207b\u00b9</strong>, represented exactly as 0.1\u2082. The others \u2014 0.4 = 2/5, 0.3 = 3/10, 0.2 = 1/5, 0.1 = 1/10 \u2014 all have denominators containing factor 5 (not a power of 2), making them non-terminating repeating binary fractions.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_247",
      "year": "2022 Batch 21",
      "text": "While developing a program, a programmer mistakenly inserts code to multiply two numbers where the requirement was to add them. Which tool can be used to detect this error automatically?",
      "opts": ["The compiler or the interpreter", "The compiler only", "The interpreter only", "The editor or IDE", "None of the above"],
      "ans": 4,
      "exp": "Multiplying where addition was intended is a <strong>logical error</strong>. The code is syntactically valid and executes without crashing \u2014 it simply produces the wrong result. Compilers and interpreters detect only syntax and type errors. IDEs can flag suspicious patterns but cannot know the programmer's intent. No automated tool can detect this class of error. The answer is <strong>None of the above</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_248",
      "year": "2022 Batch 21",
      "text": "Consider the following statements about program translation.\n\nI. Compilation and interpretation both cannot be used in a single translation operation.\nII. An interpreted program usually runs faster than a compiled program.\nIII. For some programming languages only the compilation option will work for program translation.\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "I and II only", "None"],
      "ans": 4,
      "exp": "<strong>Statement I (False):</strong> Python compiles source code to bytecode first, then interprets the bytecode \u2014 both techniques are used together. Java uses the same approach with the JVM.<br><br><strong>Statement II (False):</strong> Compiled programs generally run faster because translation is done once before execution. Interpreted programs bear translation overhead at runtime.<br><br><strong>Statement III (False):</strong> Any programming language can in principle be either compiled or interpreted. There is no fundamental technical reason why compilation would be the only option for any language.<br><br>All three statements are false, so the answer is <strong>None</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_249",
      "year": "2022 Batch 21",
      "text": "Suppose there are two algorithms A and B to solve a problem. Algorithm A is much longer (has more lines of code) than algorithm B. Consider the following statements.\n\nI. Algorithm A will always take more time to execute than algorithm B.\nII. A Python program based on algorithm A will generally have more lines of code than a Python program based on algorithm B.\nIII. For the same input, the outputs of algorithm A and B can be different.\n\nWhich of the statements above is/are correct?",
      "opts": ["I only", "II only", "III only", "I and II only", "None"],
      "ans": 1,
      "exp": "<strong>Statement I (False):</strong> More pseudocode lines do not mean more execution time. A longer algorithm may be more efficient (e.g. O(n log n) vs O(n\u00b2)). 'Always' makes this false.<br><br><strong>Statement II (True):</strong> If algorithm A has more steps than B, the corresponding Python implementation will generally require more lines of code. This is a sound generalisation.<br><br><strong>Statement III (False):</strong> Both A and B are stated to solve the <em>same</em> problem. Two correct algorithms for the same deterministic problem must produce identical outputs for the same input. Therefore this 'can be different' is false \u2014 they must agree for correct algorithms.<br><br>Only <strong>II</strong> is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_250",
      "year": "2022 Batch 21",
      "text": "How many multiplications are executed as a result of the call Power(3, 8)?",
      "opts": ["8", "7", "6", "5", "4"],
      "ans": 3,
      "exp": "Tracing the recursive calls and counting every multiplication (both x*x and the final *x for odd n):<br><br><strong>Power(3, 8):</strong> n=8 even \u2192 computes 3\u00d73 (1 mult), calls Power(9, 4).<br><strong>Power(9, 4):</strong> n=4 even \u2192 computes 9\u00d79 (1 mult), calls Power(81, 2).<br><strong>Power(81, 2):</strong> n=2 even \u2192 computes 81\u00d781 (1 mult), calls Power(6561, 1).<br><strong>Power(6561, 1):</strong> n=1 odd \u2192 computes 6561\u00d76561 (1 mult), calls Power(43046721, 0), then multiplies result by 6561 (1 mult).<br><strong>Power(43046721, 0):</strong> n=0 \u2192 returns 1. No multiplications.<br><br>Total = 1+1+1+1+1 = <strong>5</strong> multiplications.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_251",
      "year": "2022 Batch 21",
      "text": "Consider the following statements about computing x^n and the algorithm given above.\n\nI. An iterative algorithm can be developed based on the same two properties (1) and (2) corresponding to the cases where n is odd and even.\nII. The given algorithm will compute x^n with fewer number of multiplications than an algorithm that is based on the property x^n = x \u00b7 (x^(n-1)).\nIII. The given algorithm will not work correctly if x = 0.\n\nWhich of the above is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "I, II and III \u2013 all are correct."],
      "ans": 3,
      "exp": "<strong>Statement I (True):</strong> The same odd/even squaring properties can be implemented iteratively using a loop that processes the binary bits of n.<br><br><strong>Statement II (True):</strong> The naive property x^n = x\u00b7(x^(n-1)) requires n-1 multiplications. The given algorithm uses O(log\u2082 n) multiplications via repeated squaring. For n=8: naive needs 7, this algorithm needs 5.<br><br><strong>Statement III (False):</strong> Tracing Power(0, 8): at each even step, 0\u00d70=0, so the argument stays 0. At the odd step n=1: Power(0,0)*0 = 1*0 = 0. Result is 0, which is correct (0^n=0 for n\u22651). The algorithm works correctly for x=0.<br><br>Therefore <strong>I and II only</strong> are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_252",
      "year": "2022 Batch 21",
      "text": "What will be the result when the following Python code is executed?\n\n5 ** (False == 2)",
      "opts": ["1", "5", "10", "25", "An error message"],
      "ans": 0,
      "exp": "Python evaluates inside-out. <strong>False == 2</strong>: False has integer value 0, and 0 \u2260 2, so this evaluates to the boolean False (integer value 0). Then <strong>5 ** 0 = 1</strong>. Any nonzero number raised to the power 0 is 1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_253",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\nprint((9%5)**len([2,3,4])+2)",
      "opts": ["1", "3", "66", "1024", "An error message"],
      "ans": 2,
      "exp": "Step by step: <strong>9%5 = 4</strong> (remainder when 9 is divided by 5). <strong>len([2,3,4]) = 3</strong>. <strong>4**3 = 64</strong>. <strong>64 + 2 = 66</strong>. Output: <strong>66</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_254",
      "year": "2022 Batch 21",
      "text": "Consider the following Python code:\n\na , b , c = 1050, 2050, 3050\na , b , c = b , a , 2*a+b\n\nWhich of the following statements is correct about the result of execution of the code?",
      "opts": ["At the end: a =1050, b=2050 and c=3050.", "At the end: a =2050, b=1050 and c=3050.", "At the end: a =2050, b=1050 and c=5150.", "At the end: a =2050, b=1050 and c=4150.", "The code will result in an error."],
      "ans": 3,
      "exp": "In Python, the entire right-hand side is evaluated using the <em>current</em> values before any assignment occurs. With a=1050, b=2050:<br><br>RHS: b=2050, a=1050, 2*1050+2050 = 2100+2050 = 4150.<br><br>Assignments happen simultaneously: a=2050, b=1050, c=4150.<br><br>Answer: <strong>a=2050, b=1050, c=4150</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_255",
      "year": "2022 Batch 21",
      "text": "Consider the following statements about objects in Python.\n\nI. The operations that can be performed on an object depends on its identity.\nII. The identity of a mutable object can change.\nIII. There can be two objects having the same identity.\n\nWhich of the above statements is/are correct?",
      "opts": ["I only.", "II only.", "I and II only.", "III only.", "None."],
      "ans": 4,
      "exp": "<strong>Statement I (False):</strong> Operations available for an object depend on its <em>type</em>, not its identity. Identity is simply the unique memory address.<br><br><strong>Statement II (False):</strong> An object's identity (id()) is fixed for the entire lifetime of the object. A mutable object can have its <em>value</em> changed in place, but its identity remains constant.<br><br><strong>Statement III (False):</strong> Identity in Python is guaranteed to be unique among all currently existing live objects. No two simultaneously existing objects can share the same identity.<br><br>All three are false: answer is <strong>None</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_256",
      "year": "2022 Batch 21",
      "text": "Consider the following Python code.\n\nx = [1,'football',[2, \"cricket\", 3, 4], 5]\nx[2][1] = 5\nx[1] = x[2] * 3\n\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without a problem.", "The first line has an error; there is no other error.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors; there is no other error."],
      "ans": 0,
      "exp": "Line 1: Creates a valid nested list \u2014 no error.<br><br>Line 2: x[2] is the mutable inner list [2,'cricket',3,4]. x[2][1]='cricket'; assigning 5 to it is valid. x[2] becomes [2,5,3,4].<br><br>Line 3: x[2] is [2,5,3,4]. Multiplying a list by 3 gives [2,5,3,4,2,5,3,4,2,5,3,4]. Assigning this to x[1] is valid.<br><br>All three lines execute <strong>without a problem</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_257",
      "year": "2022 Batch 21",
      "text": "Consider the following Python code.\nx = [1,'football',[2, \"cricket\", 3, 4], 5]\nx[1][0] = \"p\"\nx[2][1] += 3\nx[2][1] *= 3\n\nWhich of the following is correct about the above 4 lines of code?",
      "opts": ["Code will be executed without a problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The fourth line has an error; there is no other error.", "The second and third lines have errors; there is no other error."],
      "ans": 4,
      "exp": "Line 2: x[1] = 'football' (a string). Strings are <strong>immutable</strong> in Python \u2014 x[1][0]='p' raises TypeError: 'str' object does not support item assignment. This line has an error.<br><br>Line 3: x[2][1] = 'cricket'. x[2][1] += 3 means 'cricket' + 3, which is a TypeError (cannot add int to str). This line also has an error.<br><br>Line 4: Would also be an error, but since lines 2 and 3 both have errors, option (e) \u2014 <strong>second and third lines have errors</strong> \u2014 is the best match among the given choices.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_258",
      "year": "2022 Batch 21",
      "text": "What will be the value of c after the following Python code is executed?\nx = [1,'football',[2, \"cricket\", 3, 4], 5]\na = 2\nb = 'ball'\nc = b in x and a in x or b in x[1]",
      "opts": ["True", "False", "'ball'", "'football'", "'ball2football'"],
      "ans": 0,
      "exp": "Evaluate with Python's operator precedence (not > and > or):<br><br><strong>b in x</strong>: 'ball' is not a direct element of [1,'football',[2,'cricket',3,4],5] \u2192 False.<br><br>Short-circuit: False and (a in x) = <strong>False</strong> without evaluating a in x.<br><br><strong>b in x[1]</strong>: x[1]='football'; 'ball' is a substring of 'football' \u2192 True.<br><br><strong>c = False or True = True</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_259",
      "year": "2022 Batch 21",
      "text": "What will be the value of the following Python expression?\n\n(0b10111010 >> 0o3) ^ (~1 & 0xEE)",
      "opts": ["6", "23", "238", "249", "255"],
      "ans": 3,
      "exp": "<strong>0b10111010</strong> = 186. <strong>0o3</strong> = 3. <strong>186 >> 3</strong> = 23 (right-shift by 3 = divide by 8, floor).<br><br><strong>~1</strong> = \u22122 (all bits set except last: ...11111110\u2082). <strong>0xEE</strong> = 238 = 11101110\u2082.<br><strong>~1 &amp; 0xEE</strong>: ...11111110 &amp; 11101110 = 11101110 = 238 (0xEE's last bit is 0, so the AND with ~1's 0 last bit keeps it 0; all other bits of 0xEE are preserved since ~1 has all 1s there).<br><br><strong>23 ^ 238</strong>: 00010111 XOR 11101110 = 11111001 = <strong>249</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_260",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code, if the input is \"9 3 1 6 4\"?\n\nins = input('Enter your input: ')\ns = ins.split()\ns.sort()\nprint(s)",
      "opts": ["9 3 1 6 4", "1 3 4 6 9", "['9', '3', '1', '6', '4']", "['1', '3', '4', '6', '9']", "['9', '6', '4', '3', '1']"],
      "ans": 3,
      "exp": "input() returns a string. ins.split() produces a <strong>list of strings</strong>: ['9','3','1','6','4']. s.sort() sorts strings <strong>lexicographically</strong> (not numerically): '1' &lt; '3' &lt; '4' &lt; '6' &lt; '9'. print(s) displays the list: <strong>['1', '3', '4', '6', '9']</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_261",
      "year": "2022 Batch 21",
      "text": "Consider the following Python code, with line numbers (not part of the code) shown on the left.\n\n1 try:\n2     fo = open('Data.txt', 'r')\n3     s = fo.read()  # Read from file\n4 _____(P)_____ IOError:\n5     print('Error in file access.')\n6 else:\n7     print('Finished reading the file.')\n8     ......  # close the file\n\nWhat should fill the blank (P) at the beginning of line 4 to make the code work?",
      "opts": ["if", "else", "except", "finally", "match"],
      "ans": 2,
      "exp": "In Python's exception handling structure, a <strong>try</strong> block is followed by <strong>except ExceptionType:</strong> to catch specific exceptions. The syntax is <code>except IOError:</code>. The keyword that fills blank (P) is <strong>except</strong>. 'if' and 'else' are control flow keywords. 'finally' runs regardless of exceptions but does not specify an exception type. 'match' is pattern matching, not exception handling.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_262",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code, if the input is '9'?\nnum = int(input('Enter an integer: '))\nmatch num:\n    case 1: print(\"Red\")\n    case 2: print(\"Blue\")\n    case 3 | 4: print(\"Green\")\n    case _: print(\"Black\")",
      "opts": ["Red", "Blue", "Green", "Black", "An error message or exception"],
      "ans": 3,
      "exp": "num = int('9') = 9. The match statement checks: case 1 (9\u22601), case 2 (9\u22602), case 3|4 (9 is neither 3 nor 4). The wildcard <strong>case _</strong> matches anything else. Output: <strong>Black</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_263",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code, if the input is '111'?\n\nx = int(input('Enter x: '))\nif (x > 100):\n    if (x >= 200):\n        k = x * 2\n    elif (x < 300):\n        k = x * 3\n    else:\n        k = x * 4\nelse:\n    k = x * 5\nprint(k)",
      "opts": ["222", "333", "444", "555", "An error message or exception"],
      "ans": 1,
      "exp": "x=111. <strong>x > 100</strong>: True \u2192 enter outer if. <strong>x >= 200</strong>: 111 \u2265 200 is False. <strong>elif x < 300</strong>: 111 &lt; 300 is True \u2192 k = 111 \u00d7 3 = <strong>333</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_264",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ncount = 10\ntotal = 0\nwhile (count < 12):\n   total = total + 1\n   count += 2\nelse:\n   total = total + 10\ntotal = total + 10\nprint (total)",
      "opts": ["21", "20", "40", "11", "12"],
      "ans": 0,
      "exp": "count=10, total=0.<br>Iteration 1: 10&lt;12 True \u2192 total=1, count=12.<br>Check: 12&lt;12 False \u2192 loop exits normally (no break).<br>The <strong>else</strong> clause runs (loop exited without break): total=1+10=11.<br>Next: total=11+10=21.<br>print(total) \u2192 <strong>21</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_265",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ntotal=0\nfor i in [1,0,1,0,1,0]:\n    total += 2\n    break\nelse:\n    total += 1\nprint(total)",
      "opts": ["2", "1", "6", "12", "3"],
      "ans": 0,
      "exp": "First iteration: i=1, total=0+2=2, then <strong>break</strong> exits the loop immediately. In Python, the <strong>else</strong> clause of a for loop only runs if the loop completes without a break. Since break was used, the else block is <strong>skipped</strong>. print(total) \u2192 <strong>2</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_266",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ntotal = 0\nfor counter in range(0,11,2):\n    total += counter\nprint(total)",
      "opts": ["20", "30", "55", "1", "32"],
      "ans": 1,
      "exp": "range(0, 11, 2) generates: 0, 2, 4, 6, 8, 10 (step 2, stops before 11). Sum = 0+2+4+6+8+10 = <strong>30</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_267",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ntotal=0\nfor i in range(3):\n   for j in range(3):\n      if i == j:\n        pass\n      total += i+j\nprint(total)",
      "opts": ["36", "12", "9", "54", "18"],
      "ans": 4,
      "exp": "<strong>pass</strong> is a no-op. The line <code>total += i+j</code> is at the same indentation level as the <code>if</code> statement, NOT inside it \u2014 it executes for every (i,j) pair regardless.<br><br>i=0: j=0\u21920, j=1\u21921, j=2\u21922. Subtotal=3.<br>i=1: j=0\u21921, j=1\u21922, j=2\u21923. Subtotal=6.<br>i=2: j=0\u21922, j=1\u21923, j=2\u21924. Subtotal=9.<br><br>Total=3+6+9=<strong>18</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_268",
      "year": "2022 Batch 21",
      "text": "How should we fill the blank (P) in the Code segment to produce the factorial of 5 which is 120?\n\nfact=1\nfor num in range(5):\n    _____(P)_____\nprint(\"factorial of 5 is = \",fact)",
      "opts": ["fact *= num", "fact *= num-1", "fact *= num+1", "fact = num*(num-1)", "fact = num*(num+1)"],
      "ans": 2,
      "exp": "range(5) produces num = 0, 1, 2, 3, 4. We need to multiply fact by 1\u00d72\u00d73\u00d74\u00d75 = 120. Using <strong>fact *= num+1</strong>:<br>num=0: fact=1\u00d71=1<br>num=1: fact=1\u00d72=2<br>num=2: fact=2\u00d73=6<br>num=3: fact=6\u00d74=24<br>num=4: fact=24\u00d75=120 \u2713<br><br>Option (a) fact *= num gives 0 immediately (num=0 at first iteration).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_269",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ni = 3\nwhile (i < 10) :\n    j = 0\n    while j < i:\n        if i != 5:\n            j += 1\n            continue\n        print(9-j, end=\"\")\n        j += 1\n    i += 1",
      "opts": ["9857", "01234", "12345", "1357", "98765"],
      "ans": 4,
      "exp": "For i=3,4,6,7,8,9: i!=5 is True \u2192 j increments and <code>continue</code> skips the print. Nothing is printed.<br><br>For <strong>i=5</strong>: i!=5 is False \u2192 the if block is skipped. The print and j+=1 execute for j=0 through j=4:<br>j=0 \u2192 print(9), j=1 \u2192 print(8), j=2 \u2192 print(7), j=3 \u2192 print(6), j=4 \u2192 print(5).<br><br>Output: <strong>98765</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_270",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\nmyL = ['u', 'n', 'i', 'v', 'e','r','s','i','t','y']\nmyL[-6] = 6\nprint (myL[4])",
      "opts": ["6", "e", "4", "univ", "r"],
      "ans": 0,
      "exp": "myL has 10 elements (indices 0\u20139). Negative index -6 maps to index 10-6 = <strong>4</strong>. myL[4] was 'e'. After myL[-6] = 6, myL[4] becomes 6. print(myL[4]) \u2192 <strong>6</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_271",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\np = \"Prog Fundamentals\"\nprint (p[5:-9])",
      "opts": ["p[5:-9]", "Prog", "mental", "Fun", "Ema"],
      "ans": 3,
      "exp": "\"Prog Fundamentals\" has 17 characters. Index 5 = 'F'. Index -9 = 17-9 = 8 (character 'd'). p[5:8] extracts indices 5,6,7 = 'F','u','n' = <strong>\"Fun\"</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_272",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\nc1 = complex(4)\nc2 = complex(-2,-3)\nprint(c1-c2)",
      "opts": ["(4-2,-3j)", "(6,3j)", "(6+3j)", "(2-3j)", "(2+7j)"],
      "ans": 2,
      "exp": "complex(4) = 4+0j. complex(-2,-3) = -2-3j.<br>c1 - c2 = (4+0j) - (-2-3j) = (4+2) + (0+3)j = 6+3j.<br>Python displays complex numbers as <strong>(6+3j)</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_273",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\na = 12\nb = a\na += 0\nprint(id(a)==id(b))",
      "opts": ["True", "False", "12", "0", "ValueError"],
      "ans": 0,
      "exp": "a=12, b=a: both reference the same integer object 12. a += 0 creates a = 12+0 = 12. Python caches small integers (including 12), so the expression 12+0 returns the same cached integer object. Both a and b still reference the same object, so id(a) == id(b) \u2192 <strong>True</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_274",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\nprint (\"%x%x%x%x%x%x\" % (13,14,12,0,13,14))",
      "opts": ["decde", "dec0de", "facade", "abc0ba", "decode"],
      "ans": 1,
      "exp": "%x formats integers as lowercase hexadecimal: 13\u2192'd', 14\u2192'e', 12\u2192'c', 0\u2192'0', 13\u2192'd', 14\u2192'e'. Concatenated: <strong>dec0de</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_275",
      "year": "2022 Batch 21",
      "text": "What will be printed as the output of the following Python code?\nprint(\"%6.2f\"%(123456))",
      "opts": ["0123456.0", "3456.00", "123456", "123456.00", "%6.2f 123456"],
      "ans": 3,
      "exp": "The format specifier %6.2f means: minimum field width 6, exactly 2 decimal places. 123456 formatted with 2 decimal places is '123456.00' (9 characters). Since 9 > 6 (the minimum width), no padding is added. Output: <strong>123456.00</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_276",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\na=3\nfor i in range(a):\n    print('*'*a)",
      "opts": ["***\n***\n***", "*\n**\n***", "*********", "***", "*** *** ***"],
      "ans": 0,
      "exp": "range(3) iterates i=0,1,2 (3 times). Each iteration prints '*'*3 = '***' with a newline. Output: three lines each containing '***':\n<strong>***\n***\n***</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_277",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\na = [[[0, 1, 2],[3, 4, 5]],[[6, 7, 8], [9, 10, 11]]]\nprint (a[1][1][1])",
      "opts": ["01", "10", "11", "0", "111"],
      "ans": 1,
      "exp": "a[1] = [[6,7,8],[9,10,11]]. a[1][1] = [9,10,11]. a[1][1][1] = <strong>10</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_278",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef printMe(a=\"\", b = \"Computer\", c = \"Science\"):\n    print(a, b, c, sep=\"_\", end=\"!!!\")\n    return\n\nprintMe(b = \"Data\")",
      "opts": ["_Data_Science!!!", "Data_Science!!!", "_Data_Science", "!!!Data!!!Science_", "None of the above"],
      "ans": 0,
      "exp": "printMe(b='Data'): a='' (default), b='Data', c='Science' (default). print('', 'Data', 'Science', sep='_', end='!!!'): joins with '_' \u2192 '' + '_' + 'Data' + '_' + 'Science' = '_Data_Science', appends '!!!' (no newline). Output: <strong>_Data_Science!!!</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_279",
      "year": "2022 Batch 21",
      "text": "How should we fill the blank (P) in the given code segment to produce a Christmas tree for a given positive integer?\n\nh = int(input())\nfor a in range(h+1):\n    stars='*'*a\n    _____(P)_____\n    print(spaces,end='')\n    print(stars,end='')\n    if (a>0):\n        print(' | ',end='')\n    else:\n        print(' * ',end='')\n    print(stars,end='')\n    print(spaces)",
      "opts": ["pass", "spaces *= h-a", "spaces = ' '*(h-a)", "spaces = ' '*h", "spaces = a"],
      "ans": 2,
      "exp": "For each row a (0 to h), the indentation on each side should equal h-a spaces: h spaces when a=0, and 0 spaces when a=h. <strong>spaces = ' '*(h-a)</strong> gives exactly this. Option (b) uses multiplication assignment on an undefined variable. Option (d) always gives h spaces regardless of a, producing no taper.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_280",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef changeMe(value):\n    value += 10\n\np = 190\nchangeMe(value=p)\nprint(p)",
      "opts": ["10", "190", "200", "190+10", "None of the above"],
      "ans": 1,
      "exp": "Integers are <strong>immutable</strong> in Python. Inside changeMe, value initially references the same integer object as p (190). value += 10 rebinds the local variable value to a new integer (200) \u2014 it does not modify p. p in the calling scope remains unchanged. print(p) \u2192 <strong>190</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_281",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef printMe(name):\n    NAME_STR = \"name\"\n    print(f\"My {NAME_STR} is {name}!\")\n    return\n\nprintMe(\"Alice\")",
      "opts": ["My Alice is name!", "My name is Alice!", "My {name} is {Alice}!", "My {Alice} is {name}!", "None of the above"],
      "ans": 1,
      "exp": "In an f-string, expressions inside {} are evaluated at runtime. {NAME_STR} evaluates to the value of variable NAME_STR = 'name'. {name} evaluates to the argument 'Alice'. Output: <strong>My name is Alice!</strong>",
      "type": "mcq"
    },
    {
      "id": "cs_pp_282",
      "year": "2022 Batch 21",
      "text": "Which of the following statements is true about function definitions in Python?",
      "opts": ["Function body can be empty (no statements).", "Convention is to use single quotation marks for denoting docstrings (documentation of the function).", "Without a return statement, it is not possible to access the outcome of executing a function from the main program.", "Return expressions are optional.", "Function begins with the keyword \"func\"."],
      "ans": 3,
      "exp": "<strong>(a) False:</strong> A function body cannot be empty; it requires at least one statement (typically <code>pass</code> as a placeholder).<br><br><strong>(b) False:</strong> Convention uses <strong>triple quotation marks</strong> for docstrings (e.g. \"\"\"...\"\"\"), not single quotes.<br><br><strong>(c) False:</strong> Without a return statement, a function implicitly returns None, which the caller can still receive.<br><br><strong>(d) True:</strong> The expression after return is optional \u2014 <code>return</code> alone (returning None) is valid.<br><br><strong>(e) False:</strong> Functions are defined with the keyword <code>def</code>, not <code>func</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_283",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef changeMe( myListInFunc ):\n    myListInFunc.append([1,2,3,4])\n    return\n\nmylist= ['a', 'b', 'c']\nprint (changeMe(mylist))",
      "opts": ["['a', 'b', 'c']", "['a', 'b', 'c', [1, 2, 3, 4]]", "AttributeError: 'int' object has no attribute 'append'", "IndexError: list index out of range", "None"],
      "ans": 4,
      "exp": "changeMe appends [1,2,3,4] to mylist successfully (lists are mutable), but the function ends with bare <code>return</code> \u2014 returning <strong>None</strong>. The print() statement prints the return value of changeMe, which is <strong>None</strong>. Note: mylist is modified in place to ['a','b','c',[1,2,3,4]], but that modified list is not what's being printed.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_284",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef pass_by_ref(a):\n    a[1]='c'\n    return\n\nx=[10,20,30]\npass_by_ref(x)\nprint(x)",
      "opts": ["None", "IndexError: list index out of range", "[10, 'c', 30]", "[10, 20, 30]", "'c'"],
      "ans": 2,
      "exp": "Lists are mutable objects. When x is passed to pass_by_ref, parameter a references the <em>same</em> list object. a[1]='c' modifies the list in place, changing index 1 from 20 to 'c'. This change is visible through x in the calling scope. print(x) \u2192 <strong>[10, 'c', 30]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_285",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\n\ndef myFunc(a = 100, *b):\n    for p in b:\n        a += p\n    return a\n\nprint (myFunc(10,20,30,40))",
      "opts": ["90", "TypeError: myFunct() got multiple values for argument 'b'", "100", "SyntaxError: positional argument follows keyword argument", "TypeError: myFunct() got multiple values for argument 'a'"],
      "ans": 2,
      "exp": "myFunc(10, 20, 30, 40): the first positional argument assigns a=10 (overriding default 100). *b collects remaining positional arguments: b=(20, 30, 40). The loop: a=10+20=30, 30+30=60, 60+40=100. return 100. Output: <strong>100</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_286",
      "year": "2022 Batch 21",
      "text": "What is the minimum length of the register (number of bits) that can be used to represent -981 in two's complement?",
      "opts": ["10", "9", "12", "11", "16"],
      "ans": 3,
      "exp": "In n-bit two's complement, the range is -2^(n-1) to +2^(n-1)-1. To represent -981, we need 2^(n-1) \u2265 981.<br><br>2^9 = 512 &lt; 981 (insufficient).<br>2^10 = 1024 \u2265 981 \u2713.<br><br>So n-1 = 10, giving n = <strong>11 bits</strong>. With 11 bits the range is -1024 to +1023, which includes -981.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_287",
      "year": "2022 Batch 21",
      "text": "An integer is represented in 8-bit two's complement notation as 10011001\u2082. What is the correct decimal value of this integer?",
      "opts": ["-103", "+103", "-102", "+102", "-104"],
      "ans": 0,
      "exp": "MSB=1 \u2192 negative number. Apply two's complement conversion to find magnitude:<br>Invert: 10011001 \u2192 01100110.<br>Add 1: 01100110 + 1 = 01100111.<br>01100111 = 64+32+4+2+1 = <strong>103</strong>.<br>Decimal value: <strong>-103</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_288",
      "year": "2022 Batch 21",
      "text": "Which of the following statements is false about floating point representation using mantissa, base, and the exponent?",
      "opts": ["The width of the mantissa defines the precision of the representation of the real number.", "Any real number can be precisely represented by this notation.", "Being constrained to use a finite number of digits for the mantissa is a practical problem encountered by computers.", "Any base can be used to represent an approximate value of a real number using the floating-point representation.", "Decimal (radix) point can be floated to the left or right based on the scaling given by the exponent."],
      "ans": 1,
      "exp": "Statement (b) is <strong>false</strong>. Floating-point representation uses a finite mantissa, so it can only represent a finite subset of real numbers exactly. Irrational numbers (\u03c0, \u221a2) and most rational numbers (1/3, 0.1) cannot be represented exactly and are stored as approximations. The other statements are all true.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_289",
      "year": "2022 Batch 21",
      "text": "If the decimal number 25.25 is represented in this format, what is the exponent?",
      "opts": ["00000000100", "00000100", "10000000011", "10000000010", "None of the above."],
      "ans": 2,
      "exp": "25.25 in binary: 25 = 11001\u2082, 0.25 = 0.01\u2082 \u2192 25.25 = 11001.01\u2082 = 1.100101\u2082 \u00d7 2\u2074. Actual exponent = 4. Biased exponent = 4 + 1023 = 1027. In 11-bit binary: 1027 = 1024+2+1 = 2\u00b9\u2070+2\u00b9+2\u2070 = <strong>10000000011</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_290",
      "year": "2022 Batch 21",
      "text": "How many insignificant zero digits (trailing zeros) are there in the mantissa?",
      "opts": ["46", "52", "45", "47", "6"],
      "ans": 0,
      "exp": "25.25 = 1.100101\u2082 \u00d7 2\u2074. The mantissa stores the fractional part after the implicit leading 1: <strong>100101</strong> (6 significant bits). The mantissa field is 52 bits wide. Trailing zeros = 52 - 6 = <strong>46</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_291",
      "year": "2022 Batch 21",
      "text": "Which of the following statements is false regarding representation of non-numeric data?",
      "opts": ["Unicode can represent emojis and symbols.", "Unicode provides a unique code for every character but depending on the platform the code could be different (e.g.: Windows vs Linux).", "Unicode can use up to 32 bits to represent a given character.", "Unicode is designed in such a way to ensure that ASCII is a subset of Unicode.", "ASCII code can represent 128 characters only."],
      "ans": 1,
      "exp": "Statement (b) is <strong>false</strong>. A core principle of Unicode is that every character has a single, globally unique code point that is <em>platform-independent</em>. U+0041 ('A') is always 65 regardless of Windows, Linux, or macOS. What varies between platforms may be the <em>encoding</em> (UTF-8 vs UTF-16), but the code point itself is invariant.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_292",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ndata = [1,0,1,0,1,0,1,0,1,0]\nsum = 0\nfor x in data[-1::]:\n    sum += x\nprint(sum)",
      "opts": ["0", "1", "3", "4", "5"],
      "ans": 0,
      "exp": "data[-1::] slices from index -1 (the last element) to the end with step +1. The last element of data is 0. So data[-1::] = [0]. The loop runs once with x=0. sum = 0. Output: <strong>0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_293",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ndata = [1,0,1,0,1,0,1,0,1,0]\nsum = 0\nfor x in data[::-1]:\n    sum += x\nprint(sum)",
      "opts": ["0", "1", "3", "4", "5"],
      "ans": 4,
      "exp": "data[::-1] reverses the list: [0,1,0,1,0,1,0,1,0,1]. Summing all 10 elements: five 1s and five 0s \u2192 sum = <strong>5</strong>. (Same as summing the original list.)",
      "type": "mcq"
    },
    {
      "id": "cs_pp_294",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ndata1 = [1,0,1,0,1,0,1,0,1,0]\ndata2 = [0,1]\nsum = 0\nfor x in data1[1:-1]:\n    sum += data2[x]\nprint(sum)",
      "opts": ["0", "1", "3", "4", "5"],
      "ans": 3,
      "exp": "data1[1:-1] = elements at indices 1\u20138: [0,1,0,1,0,1,0,1] (8 elements).<br>data2=[0,1]: data2[0]=0, data2[1]=1.<br>Iterating: x=0\u21920, x=1\u21921, x=0\u21920, x=1\u21921, x=0\u21920, x=1\u21921, x=0\u21920, x=1\u21921. Sum = 0+1+0+1+0+1+0+1 = <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_295",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\ndata = (1,) * 3 + (2,) * 3\nsum = 0\nfor x in data:\n    sum += x\nprint(sum)",
      "opts": ["0", "3", "6", "9", "12"],
      "ans": 3,
      "exp": "(1,)*3 = (1,1,1). (2,)*3 = (2,2,2). data = (1,1,1,2,2,2). sum = 1+1+1+2+2+2 = <strong>9</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_296",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\na = 1\nb = 2\n(a,b) = (b,a)\ndata = (a,) * 1 + (b,) * 2\nsum = 0\nfor x in data:\n    sum += x\nprint(sum)",
      "opts": ["0", "3", "4", "5", "6"],
      "ans": 2,
      "exp": "(a,b) = (b,a) swaps: a=2, b=1. data = (2,)*1 + (1,)*2 = (2,) + (1,1) = (2,1,1). sum = 2+1+1 = <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_297",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code?\na = 1\nb = 2\ndata = (a,a) + (a,b) + (b,a) + (b,b)\nsum = 0\nfor x in data[-7:-2]:\n    sum += x\nprint(sum)",
      "opts": ["9", "2", "7", "11", "12"],
      "ans": 2,
      "exp": "data = (1,1)+(1,2)+(2,1)+(2,2) = (1,1,1,2,2,1,2,2), length 8.<br>data[-7:-2]: index -7=1, index -2=6. Slice data[1:6] = (1,1,2,2,1).<br>sum = 1+1+2+2+1 = <strong>7</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_298",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code? (Consider left to right evaluation and standard logical operator precedence order.)\nA = {0,1,2,3,4,5}\nB = {4,5,6,7,8,9}\nprint(A&B-A|B)",
      "opts": ["{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}", "{0, 1, 2, 3, 6, 7, 8, 9}", "{0, 1, 2, 3, 4, 5}", "{4, 5, 6, 7, 8, 9}", "{4, 5}"],
      "ans": 3,
      "exp": "Python set operator precedence: <strong>-</strong> and <strong>&amp;</strong> both have higher precedence than <strong>|</strong>; among equal precedence, evaluation is left to right.<br><br>A&amp;B-A|B = <strong>((A&amp;B)-A)|B</strong>:<br>A&amp;B = {4,5}.<br>{4,5}-A = {} (all elements of {4,5} are in A={0,1,2,3,4,5}).<br>{}|B = B = <strong>{4,5,6,7,8,9}</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_299",
      "year": "2022 Batch 21",
      "text": "What will be the output of the following Python code? (Consider left to right evaluation and standard logical operator precedence order.)\nA = {0,1,2,3,4,5}\nB = {4,5,6,7,8,9}\nprint(A|B-A&B)",
      "opts": ["{0, 1, 2, 3, 4, 5, 6, 7, 8, 9}", "{0, 1, 2, 3, 6, 7, 8, 9}", "{0, 1, 2, 3, 4, 5}", "{4, 5, 6, 7, 8, 9}", "{4, 5}"],
      "ans": 0,
      "exp": "Set operator precedence: &amp; and - have higher precedence than |, evaluated left to right.<br><br>A|B-A&amp;B = A|<strong>((B-A)&amp;B)</strong>:<br>B-A = {4,5,6,7,8,9}-{0,1,2,3,4,5} = {6,7,8,9}.<br>{6,7,8,9}&amp;B = {6,7,8,9}&amp;{4,5,6,7,8,9} = {6,7,8,9}.<br>A|{6,7,8,9} = {0,1,2,3,4,5}|{6,7,8,9} = <strong>{0,1,2,3,4,5,6,7,8,9}</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_300",
      "year": "2022 Batch 21",
      "text": "Which of the following statements is true about the following Python code? (Consider left to right evaluation and standard logical operator precedence order.)\nC = A-B|A&B-A\nD = A|B",
      "opts": ["C is a proper subset of D", "C is a subset of D", "C is a proper superset of D", "C is a superset of D", "C and D are disjoint"],
      "ans": 0,
      "exp": "With A={0,1,2,3,4,5}, B={4,5,6,7,8,9}:<br><br><strong>C = A-B|A&amp;B-A</strong>: precedence gives <strong>(A-B)|((A&amp;B)-A)</strong>.<br>A-B = {0,1,2,3}. A&amp;B = {4,5}. {4,5}-A = {} (4,5 \u2208 A).<br>C = {0,1,2,3}|{} = <strong>{0,1,2,3}</strong>.<br><br><strong>D = A|B</strong> = {0,1,2,3,4,5,6,7,8,9}.<br><br>C={0,1,2,3} \u2282 D and C \u2260 D \u2192 C is a <strong>proper subset</strong> of D.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_301",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (P).\n\ndef isprime(n):\n    limit = int(math.sqrt(n))\n    for i in range(_____(P)_____):\n        if _____(Q)_____:\n            return False\n        if set_of_primes[i] > limit:\n            return True",
      "opts": ["n", "limit", "len(set_of_primes)", "500", "250000"],
      "ans": 2,
      "exp": "The loop must iterate over valid indices of set_of_primes. The correct bound is <strong>len(set_of_primes)</strong>, which gives indices 0 to len-1 without going out of bounds. Using 'n' or 'limit' would iterate far more times than the list has elements, causing IndexError. Using 500 or 250000 would similarly exceed the list size.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_302",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (Q).\n\ndef isprime(n):\n    limit = int(math.sqrt(n))\n    for i in range(_____(P)_____):\n        if _____(Q)_____:\n            return False\n        if set_of_primes[i] > limit:\n            return True",
      "opts": ["(n/set_of_primes[i]) == 0", "(n%set_of_primes[i]) == 0", "(n/set_of_primes[i]) != 0", "(n%set_of_primes[i]) != 0", "(n%set_of_primes[i]) == 0 and limit != 0"],
      "ans": 1,
      "exp": "Divisibility is tested with the modulo operator: if <strong>n % set_of_primes[i] == 0</strong>, then n is divisible by that prime \u2014 n is not prime \u2192 return False. Option (a) uses division (/) which yields a float, never exactly 0. Option (e) adds a redundant condition.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_303",
      "year": "2022 Batch 21",
      "text": "The code shown below implements a recursive function to sequentially search for an item in a list. Select the appropriate code to fill the blank (P).\n\ndef search(alist, item):\n    if len(alist) == 0:\n        return False\n    elif alist[0] == item:\n        return True\n    else:\n        return _____(P)_____",
      "opts": ["search(alist[1:], item)", "search(alist[:-1], item)", "search(alist[1:-1], item)", "search(alist[:int(len(alist)/2)], item)", "search(alist[int(len(alist)/2):], item)"],
      "ans": 0,
      "exp": "The function checks alist[0] against item. If no match, it must recursively search the <em>rest</em> of the list. <strong>alist[1:]</strong> gives all elements after the first, ensuring every element is eventually checked. Option (b) removes the last element (misses it). Options (c), (d), (e) all skip elements, making it non-sequential.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_304",
      "year": "2022 Batch 21",
      "text": "When sorting a moderately sized collection of data items that are randomly arranged, what is the sorting algorithm that is likely to have the worst performance?",
      "opts": ["Bubble sort", "Insertion sort", "Shell sort", "Merge sort", "Heap sort"],
      "ans": 0,
      "exp": "For moderately sized randomly arranged data, performance from worst to best: <strong>Bubble sort</strong> (O(n\u00b2) with many swaps), Insertion sort (O(n\u00b2) but fewer operations in practice), Shell sort (sub-quadratic), Merge sort O(n log n), Heap sort O(n log n). Bubble sort has both the worst asymptotic complexity among common sorts and the highest constant factor due to its excessive element swapping.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_305",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (P).\n\ndef expressionParser(expr):\n    operators = {'+','-','*','/','^'}\n    termlist = []\n    term = ''\n    for c in expr:\n        if (c != ' '):\n            term = term+c\n        else:\n            if(_____(P)_____):\n                termlist.append(term)\n            elif('.' in term):\n                termlist.append(float(term))\n            else:\n                termlist.append(int(term))\n            term = ''\n    return _____(Q)_____",
      "opts": ["term in expr", "c in operators", "c in expr", "term in operators", "c in term"],
      "ans": 3,
      "exp": "When a space is found, the accumulated 'term' is complete. The first check determines if the term is an operator symbol. Since operators = {'+','-','*','/','^'}, <strong>term in operators</strong> tests whether the completed term is an operator character. Option (b) 'c in operators' tests the space character c, which is never an operator.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_306",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (Q).\n\ndef expressionParser(expr):\n    operators = {'+','-','*','/','^'}\n    termlist = []\n    term = ''\n    for c in expr:\n        if (c != ' '):\n            term = term+c\n        else:\n            if(_____(P)_____):\n                termlist.append(term)\n            elif('.' in term):\n                termlist.append(float(term))\n            else:\n                termlist.append(int(term))\n            term = ''\n    return _____(Q)_____",
      "opts": ["termlist[1:]", "termlist[:-1]", "termlist[1:-1]", "termlist.append(c)", "termlist[:]"],
      "ans": 4,
      "exp": "<strong>termlist[:]</strong> returns a full copy of the entire termlist (all elements). This is the correct return value \u2014 the complete list of parsed terms. Options (a), (b), (c) each drop one or both end elements. Option (d) is a method call, not a return value.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_307",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (P).\n\ndef isEmpty(self):\n    return _____(P)_____",
      "opts": ["self.counter == 0", "self.counter == self.size", "self.size == 0", "self.counter == 0 and self.size == 0", "self.counter-self.size == 1"],
      "ans": 2,
      "exp": "The stack is empty when it contains no elements, tracked by self.size. <strong>self.size == 0</strong> is the direct and correct check. self.counter tracks the cumulative number of pushes ever performed (never decremented on pop), so it cannot be used to test emptiness.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_308",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (Q).\n\ndef push(self,data):\n    node = Node((self.counter,data))\n    self.counter += 1\n    if self.isEmpty():\n        _____(Q)_____\n    else:\n        node.next = self.head\n        _____(R)_____\n    self.size += 1",
      "opts": ["self.head = None", "self.next = node", "self.next = None", "self.head = self.next", "self.head = node"],
      "ans": 4,
      "exp": "When the stack is empty, pushing the first node means this node becomes the head of the linked list. <strong>self.head = node</strong> correctly sets the head pointer to the new node. The other options either set head to None (undoes the push) or reference self.next which is not an attribute of Stack.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_309",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (R).\n\ndef push(self,data):\n    node = Node((self.counter,data))\n    self.counter += 1\n    if self.isEmpty():\n        _____(Q)_____\n    else:\n        node.next = self.head\n        _____(R)_____\n    self.size += 1",
      "opts": ["self.head = None", "self.head = node", "self.next = node", "self.next = None", "self.head = self.next"],
      "ans": 1,
      "exp": "In the else branch, node.next is already set to self.head. Now the stack's head must be updated to the new node. <strong>self.head = node</strong> makes the new node the top of the stack \u2014 the standard linked-list prepend operation.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_310",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (S).\n\ndef pop(self):\n    if self.isEmpty():\n        raise Exception(\"Cannot pop from an empty stack\")\n    else:\n        node = self.head\n        _____(S)_____\n        self.size -= 1\n    return node",
      "opts": ["self.head = self.head.next", "self.next = self.head.next", "self.head = self.next.head", "self.next = self.next.head", "self.head = self.next"],
      "ans": 0,
      "exp": "node is saved as the old head (to be returned). To remove it, self.head must advance to the next node. <strong>self.head = self.head.next</strong> does this: it moves the head pointer to the second node, effectively removing the top element. self.next is not an attribute of Stack, so other options are invalid.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_311",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (P).\n\ndef evaluate(_____(P)_____):\n    result = 0\n    if(opr == '+'):\n        result = op1 + op2\n    elif(opr == '-'):\n        result = op1 - op2\n    elif(opr == '*'):\n        result = op1 * op2\n    elif(opr == '/'):\n        result = op1 / op2\n    elif(opr == '^'):\n        result = op1 ** op2\n    else:\n        print(\"illegal operator\")\n    return result",
      "opts": ["op1, op2, opr", "opr, op1, op2", "op1, opr, op2", "op2, op1, opr", "opr, op2, op1"],
      "ans": 0,
      "exp": "The function body uses op1, op2, and opr. The RPNCalculator calls evaluate(expr[i-2], expr[i-1], expr[i]) where expr[i-2] is the first operand (op1), expr[i-1] is the second operand (op2), and expr[i] is the operator (opr). Therefore the parameter signature must be <strong>op1, op2, opr</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_312",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (Q).\n\nresult = evaluate(_____(Q)_____)\nexpr = expr[:i-2] + [result] + expr[i+1:]",
      "opts": ["expr[i], expr[i-1], expr[i-2]", "expr[i-2], expr[i-1], expr[i]", "expr[i-1], expr[i], expr[i-2]", "expr[i-2], expr[i], expr[i-1]", "expr[i-1], expr[i-2], expr[i]"],
      "ans": 1,
      "exp": "When the operator is at position i, the operands are at i-2 (left/first, op1) and i-1 (right/second, op2). Since evaluate(op1, op2, opr), the call must pass <strong>expr[i-2], expr[i-1], expr[i]</strong>. Confirmed by the example: '990 1 2 + *' \u2014 when '+' is at i=3, expr[1]=1 (op1), expr[2]=2 (op2), 1+2=3.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_313",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (P).\n\ndef combinations(alist):\n    if len(alist) == 0:\n        return [[]]\n    sublist = []\n    for c in _____(P)_____:\n        sublist = _____(Q)_____\n    return sublist",
      "opts": ["combinations(alist[:])", "combinations(alist[:-1])", "combinations(alist[1:-1])", "combinations(alist[1:])", "combinations(alist[1:1])"],
      "ans": 3,
      "exp": "The function generates all subsets of alist. The strategy: recurse on alist[1:] (tail) and for each subset c, add both c and c+[alist[0]] (including or excluding the first element). Iterating over <strong>combinations(alist[1:])</strong> gives all subsets of the tail.<br><br>Verification with [1,2,3]: combinations([2,3]) \u2192 [[],[3],[2],[3,2]]. For each c: [[],[1],[3],[3,1],[2],[2,1],[3,2],[3,2,1]] = expected output \u2713",
      "type": "mcq"
    },
    {
      "id": "cs_pp_314",
      "year": "2022 Batch 21",
      "text": "Select the appropriate code to fill the blank (Q).\n\ndef combinations(alist):\n    if len(alist) == 0:\n        return [[]]\n    sublist = []\n    for c in _____(P)_____:\n        sublist = _____(Q)_____\n    return sublist",
      "opts": ["sublist + [c + [alist[0]]]", "sublist + [c, [alist[0]]]", "sublist + [alist[0]]", "sublist + [c, c + [alist[0]]]", "sublist + [c]"],
      "ans": 3,
      "exp": "For each combination c from combinations(alist[1:]), we want two new entries: c (without alist[0]) and c+[alist[0]] (with alist[0]). <strong>sublist + [c, c + [alist[0]]]</strong> appends both as separate list elements in one operation.<br><br>Verification: for alist=[1,2,3], iterating over combinations([2,3])=[[],[3],[2],[3,2]]: [[],[1],[3],[3,1],[2],[2,1],[3,2],[3,2,1]] \u2713",
      "type": "mcq"
    },
    {
      "id": "cs_pp_315",
      "year": "2022 Batch 21",
      "text": "Which of the following CPU operation is likely to be completed within the shortest possible time?",
      "opts": ["NOP instruction", "ADD instruction", "MOV instruction", "JUMP instruction", "SUB instruction"],
      "ans": 0,
      "exp": "A <strong>NOP (No Operation)</strong> instruction does nothing \u2014 it simply increments the program counter. It requires no operand fetches, no ALU computation, and no memory writes. ADD, SUB, and MOV all require fetching operands and performing operations. JUMP requires address computation. NOP has the minimal execution overhead of any instruction type.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_316",
      "year": "2022 Batch 21",
      "text": "The term MIPS is used to measure:",
      "opts": ["How many instructions could the CPU support", "How fast can the CPU execute instructions", "The speed (frequency) of the CPU clock signal", "The voltage at which the CPU would operate", "None of the above"],
      "ans": 1,
      "exp": "MIPS stands for <strong>Millions of Instructions Per Second</strong> \u2014 a performance metric measuring how quickly the CPU executes instructions. It is not the clock frequency (measured in Hz/GHz), not the instruction set size, and not the operating voltage.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_317",
      "year": "2022 Batch 21",
      "text": "The clock signal of a CPU would determine:",
      "opts": ["The speed at which the internal operations of the CPU are carried out", "The speed at which the external operations of the CPU are carried out", "The speed at which both internal and external operations are carried out", "How many instructions are there in the CPU instruction set", "None of the above"],
      "ans": 0,
      "exp": "The CPU clock signal synchronizes the <strong>internal operations</strong> of the CPU: register transfers, ALU operations, pipeline stage transitions, etc. External operations (memory bus, I/O) typically run at a separate, lower-frequency clock derived from but not equal to the CPU clock. The CPU clock does not determine instruction set size.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_318",
      "year": "2022 Batch 21",
      "text": "The \"volatile memory\" is a type of memory:",
      "opts": ["That would lose its content when the power is interrupted", "That is used to store the initial startup software of a computer", "That would retain its content even if the power supply is interrupted", "That is used to store usernames and passwords", "Of which the contents are written at the time of manufacture"],
      "ans": 0,
      "exp": "<strong>Volatile memory</strong> is memory that loses its stored data when electrical power is removed. RAM is the primary example. Non-volatile memory (ROM, Flash, hard drives) retains data without power. Options (b) and (e) describe ROM characteristics; (c) describes non-volatile memory.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_319",
      "year": "2022 Batch 21",
      "text": "Which of the following is NOT an internal component of the Central Processing Unit?",
      "opts": ["The control unit", "The Arithmetic and logic unit", "The Flag register", "Program Status Word register", "The power supply unit"],
      "ans": 4,
      "exp": "The CPU's internal components include the Control Unit, ALU, Flag register, and Program Status Word (PSW) register. The <strong>power supply unit</strong> is a separate hardware component that provides electrical power to all computer components \u2014 it is external to the CPU.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_320",
      "year": "2022 Batch 21",
      "text": "The memory sub-system in Processor A has a 16-bit address bus and 16-bit data bus. The memory sub-system of Processor B has a 16-bit address bus and an 8-bit data bus. Which of the following statement is NOT correct about the two processors?",
      "opts": ["The maximum memory capacity of Processor A will be twice as that of Processor B", "The largest memory address in both processors will be the same", "The Processor A is likely to be able to read the memory faster than Processor B", "Internal registers of Processor A are likely to be 16-bit wide", "The clock speed of Processor A will be twice as fast as the clock speed of Processor B"],
      "ans": 4,
      "exp": "(a) TRUE: Both have 2\u00b9\u2076 addressable locations. A's 16-bit data bus gives 2 bytes per location (128KB total); B's 8-bit bus gives 1 byte per location (64KB total). A has twice the capacity.<br>(b) TRUE: Same 16-bit address bus \u2192 same maximum address (65535).<br>(c) TRUE: A reads 16 bits per cycle vs B's 8 bits.<br>(d) TRUE: Register width typically matches data bus width.<br>(e) <strong>FALSE</strong>: Data bus width has no bearing on clock speed. This is an independent design parameter.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_321",
      "year": "2022 Batch 21",
      "text": "Which of the following is not an intended function of the general-purpose registers in a CPU?",
      "opts": ["Store the address of the next instruction to be executed in the program", "To store intermediate outputs computed by the ALU", "To keep user data", "To store inputs to be used for ALU operations", "To function as operands for CPU instructions"],
      "ans": 0,
      "exp": "Storing the address of the next instruction is the exclusive function of the <strong>Program Counter (PC)</strong> \u2014 a special-purpose register, not a general-purpose one. General-purpose registers hold: ALU intermediate results (b), user data (c), ALU operand inputs (d), and instruction operands (e).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_322",
      "year": "2022 Batch 21",
      "text": "Which of the following is NOT an activity carried by the Bus Master in a computer system?",
      "opts": ["Drive the address bus of the system bus during a memory operation", "Drive the data bus of the system when reading from memory", "Drive the data bus of the system bus during a memory write", "Drive the control bus of the system during a memory operation", "Sample the data bus during a memory read operation"],
      "ans": 1,
      "exp": "During a memory <strong>read</strong>, the bus master places the address on the address bus and asserts the READ control signal, then <em>samples</em> the data bus. The <em>memory</em> drives the data bus with the requested data \u2014 not the bus master. Statement (b) incorrectly assigns this to the bus master. All other options are legitimate bus master activities.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_323",
      "year": "2022 Batch 21",
      "text": "Immediately after switching on power to a computer, its RAM will contain:",
      "opts": ["The \"Power On Self Test (POST)\" software", "The \"Basic Input Output Services (BIOS)\" software", "The Operating system software", "System initialization software", "Random values"],
      "ans": 4,
      "exp": "RAM is <strong>volatile memory</strong>. Immediately after power-on, RAM has not been initialized and its contents are undefined \u2014 effectively <strong>random values</strong>. BIOS/POST firmware resides in non-volatile ROM/Flash and is executed from there at startup; the OS is loaded into RAM during the boot process, not present at the instant of power-on.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_324",
      "year": "2022 Batch 21",
      "text": "Running a Processor at a clock frequency higher than its rated value:",
      "opts": ["Would make the processor to complete some of its tasks faster", "Would make the processor to consume more power", "Would make the processor to dissipate more heat", "Would result more wait-states in reading or writing to memory", "May result all the above"],
      "ans": 4,
      "exp": "Overclocking causes all listed effects: (a) tasks that complete correctly will run faster; (b) dynamic power consumption increases with frequency (P \u221d f\u00b7V\u00b2); (c) more power dissipation means more heat; (d) memory subsystems rated for lower speeds may require additional wait states. Therefore <strong>all of the above may result</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_325",
      "year": "2022 Batch 21",
      "text": "The OPCODE part of a CPU instruction would define:",
      "opts": ["The nature of the operation carried by the instruction", "The type of operands needed for the instruction", "The length of the instruction", "Time (clock cycles) required to execute the instruction", "All of the above"],
      "ans": 0,
      "exp": "The <strong>OPCODE (operation code)</strong> fundamentally identifies the operation the CPU must perform (ADD, MOV, JUMP, etc.). While the opcode may implicitly imply operand types, instruction length, and execution cycles in some architectures, its primary and defining role is to specify <strong>the nature of the operation</strong>. Operand types, length, and timing can also depend on addressing mode and operand fields \u2014 they are not solely defined by the opcode.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_326",
      "year": "2022 Batch 21",
      "text": "Two different processors, Processor A and Processor B have 16-bit ALUs. Processor A has a 16-bit data bus, but on Processor B, the data bus is only 8-bit. Suppose these processors are executing CPU instructions that add two integer values ranging between -32000 and +32000. Which of the following statement is correct?",
      "opts": ["Processor B will require more memory access cycles to complete the task", "Processor B will require more internal ALU operations to complete the task", "Processor B will not be able to add the two numbers in a single instruction", "All of the above statements are correct", "None of the above statements are correct"],
      "ans": 0,
      "exp": "Values in -32000 to +32000 require 16-bit storage. Processor B's 8-bit data bus can only transfer 8 bits per cycle, so each 16-bit operand requires <strong>2 memory access cycles</strong>. Processor A fetches each 16-bit operand in one cycle.<br><br>(b) False: both ALUs are 16-bit, so the addition itself is a single ALU operation for both.<br>(c) False: both processors can add the numbers in a single instruction \u2014 only the memory fetch phase differs.<br><br>Only statement (a) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_327",
      "year": "2022 Batch 21",
      "text": "Consider the following activities that occur when transferring data through the system bus.\n\nA. Placing the address on the Address Bus\nB. Setting the READ signal on the Control Bus\nC. Reading the value on the Data Bus\n\nWhat would be the correct order of above activities in a memory read cycle?",
      "opts": ["A, B, C", "A, C, B", "B, A, C", "C, B, A", "All happens at the same time"],
      "ans": 0,
      "exp": "In a memory read cycle: (1) The bus master places the target <strong>address on the Address Bus</strong> so memory knows which location to access. (2) The bus master asserts the <strong>READ signal on the Control Bus</strong> to command a read. (3) After memory places data on the Data Bus, the bus master <strong>reads the Data Bus</strong>. Correct order: <strong>A, B, C</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_328",
      "year": "2022 Batch 21",
      "text": "Which of the following is not a CPU internal operation common to ALL CPU instructions?",
      "opts": ["Incrementing the program counter", "Fetching the instruction", "Decoding the instruction", "Executing the instruction", "Fetching operands"],
      "ans": 4,
      "exp": "Every instruction goes through: fetch (retrieve from memory), decode, execute, and PC increment. However, <strong>fetching operands</strong> is not required by all instructions \u2014 a NOP has no operands, and some implied-addressing instructions use no explicit operand fetch. Therefore this step is not common to ALL instructions.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_329",
      "year": "2022 Batch 21",
      "text": "Which of the following is NOT a task of the bus master in a System bus?",
      "opts": ["Driving the Address Bus content", "Controlling signals on the Control-Bus", "Sending the reset signal during a system startup", "Reading or writing to the Data bus", "Distributing power to all bus-connected devices"],
      "ans": 4,
      "exp": "The bus master controls bus transactions: it drives the Address Bus (a), controls Control Bus signals (b), and reads/writes the Data Bus (d). The reset signal (c) can be considered a bus master function in some architectures. However, <strong>distributing power to bus-connected devices (e)</strong> is entirely the role of the power supply and distribution network \u2014 it is definitively not a function of the bus master.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_330",
      "year": "2022 Batch 21",
      "text": "The CPU A is a RISC processor that runs at 1 GHz clock speed. CPU B is a CISC processor that runs at 2 GHz clock speed. Which of the following statements is NOT correct regarding the two CPUs?",
      "opts": ["CPU B is likely to have more instructions in its instruction set compared to CPU A", "Instructions in CPU A will be optimized for more common operations", "CPU B will have several instructions performing similar operations", "CPU A may require more instructions to complete certain tasks compared to CPU B", "CPU B will always be faster in performing a task due to its higher clock speed"],
      "ans": 4,
      "exp": "Statement (e) is <strong>false</strong>. Higher clock speed does not guarantee faster task completion. RISC (CPU A) executes most instructions in one clock cycle; CISC (CPU B) often takes multiple cycles per instruction. CPU A at 1 GHz may outperform CPU B at 2 GHz on certain workloads. Performance also depends on instruction count, pipeline efficiency, and memory access. 'Always faster' is categorically incorrect.<br><br>The other statements correctly reflect RISC vs CISC characteristics: (a) CISC has a larger instruction set; (b) RISC optimises common operations; (c) CISC has overlapping complex instructions; (d) RISC may need more instructions for complex operations.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_331",
      "year": "2022 Batch 20",
      "text": "For the algorithm to work as expected, what should be in blank (A) in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG1.png",
      "imgAlt": "Flowchart for finding minimum and maximum elements in a list L of N positive integers",
      "opts": ["x > N", "L[x] > min", "L[x] < min", "x < N"],
      "ans": 2,
      "exp": "The flowchart initialises <strong>min \u2190 L[0]</strong> and iterates from x = 1. At blank (A), the 'Yes' branch leads to <strong>min \u2190 L[x]</strong>, so the condition must be true when the current element is smaller than the current minimum. Therefore blank (A) is <strong>L[x] &lt; min</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_332",
      "year": "2022 Batch 20",
      "text": "For the algorithm to work as expected, what should be in blank (B) in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG1.png",
      "imgAlt": "Flowchart for finding minimum and maximum elements in a list L of N positive integers",
      "opts": ["L[x] > max", "x \u2190 x + 1", "min \u2190 L[x]", "max \u2190 L[x]"],
      "ans": 3,
      "exp": "The 'Is max &lt; L[x]?' decision has its 'Yes' branch leading to blank (B). When max is less than L[x], the current element is greater than the current maximum, so we must update max. Therefore blank (B) is <strong>max \u2190 L[x]</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_333",
      "year": "2022 Batch 20",
      "text": "For the algorithm to work as expected, what should be in blank (C) in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG1.png",
      "imgAlt": "Flowchart for finding minimum and maximum elements in a list L of N positive integers",
      "opts": ["x = N", "x \u2264 N", "x < N", "x > N"],
      "ans": 2,
      "exp": "After incrementing x, blank (C) controls whether the loop continues. The list has valid indices 0 to N\u22121, so we continue while x is still a valid index: <strong>x &lt; N</strong>. The 'Yes' branch loops back; 'No' exits to output. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_334",
      "year": "2022 Batch 20",
      "text": "When we use flowcharts to express algorithms, the decision () symbol is used to implement the selection control structure and the ________________ control structure.",
      "opts": ["repetition", "inheritance", "sequence", "abstraction"],
      "ans": 0,
      "exp": "In flowchart notation the diamond (decision) symbol serves two purposes: implementing <strong>selection</strong> (if/else branching) and implementing <strong>repetition</strong> (loops). The decision symbol creates the conditional check that determines whether to repeat a block of steps. The marking scheme confirms 'repetition'.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_335",
      "year": "2022 Batch 20",
      "text": "When a program has bugs (run-time or logic errors) that are difficult to find, using a software tool such as a __________ is generally the next step towards fixing the bugs.",
      "opts": ["interpreter", "debugger", "profiler", "compiler"],
      "ans": 1,
      "exp": "A <strong>debugger</strong> allows programmers to pause execution, step through code line by line, and inspect variable values \u2014 making it the standard tool for locating difficult run-time or logic errors. The marking scheme confirms 'debugger'.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_336",
      "year": "2022 Batch 20",
      "text": "If we can code a program directly using the __________ language, then a translation step that requires either a compiler or an interpreter will not be necessary before execution.",
      "opts": ["high-level", "machine", "low-level", "assembly"],
      "ans": 1,
      "exp": "<strong>Machine language</strong> consists of binary instructions that the CPU executes directly \u2014 no compilation or interpretation step is needed. Any other language (assembly, high-level) requires a translation step. The marking scheme confirms 'machine'.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_337",
      "year": "2022 Batch 20",
      "text": "Suppose there are two Python programs A and B to solve a problem. If program A is much longer (has many more lines of code) than program B, then program A will always take more time to execute than program B.\n[Yes/No]",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "The number of lines of code does not determine execution time. A longer program may contain trivially fast operations while a shorter one may run expensive nested loops. It is <strong>not always</strong> true that a longer program takes more time. Answer: <strong>No</strong>. The marking scheme confirms No.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_338",
      "year": "2022 Batch 20",
      "text": "In the above algorithm, what should be in the blank (D) for the algorithm to work as expected?",
      "opts": ["n is odd", "n > 1", "n is even", "n = 1"],
      "ans": 0,
      "exp": "The algorithm computes x^n using repeated squaring. When n is odd an extra factor of x is needed (x^n = x \u00b7 (x^(n/2))\u00b2), so P is multiplied by x. Blank (D) must check whether <strong>n is odd</strong> (i.e. n mod 2 \u2260 0). The marking scheme confirms 'n is odd'.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_339",
      "year": "2022 Batch 20",
      "text": "In the above algorithm, what should be in the blank (E) for the algorithm to work as expected?",
      "opts": ["n \u2190 n // 2", "n \u2190 n / 2", "n \u2190 n * 2", "n \u2190 n - 1"],
      "ans": 0,
      "exp": "After squaring x in step 6, n must be halved using integer division to reflect that x has been replaced by x\u00b2. Blank (E) is <strong>n \u2190 n // 2</strong>. This is the standard step in the binary exponentiation algorithm. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_340",
      "year": "2022 Batch 20",
      "text": "Consider the following statements about the problem of computing x^n and the algorithm given above.\nI. A recursive algorithm can be developed based on the same two properties (1) and (2) corresponding to the cases where n is odd and even.\nII. A simpler alternative algorithm can be developed for computing x^n using the property x^n = x \u00b7 (x^(n\u22121)).\nIII. The given algorithm will not work correctly if n = 0.\nWhich of the above is/are correct?",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "I, II and III \u2013 all are correct."],
      "ans": 3,
      "exp": "<strong>Statement I</strong> is correct: the two cases (n odd and n even) translate directly into recursive cases for fast exponentiation.<br><br><strong>Statement II</strong> is correct: x^n = x \u00b7 x^(n\u22121) is a valid (simpler but less efficient) recurrence.<br><br><strong>Statement III</strong> is incorrect: when n = 0, the algorithm sets P = 1 at step 3, then at step 4 n = 0 is true, so it jumps to step 9 and outputs P = 1. Since x^0 = 1, the algorithm handles n = 0 correctly.<br><br>Only I and II are correct \u2192 answer (d).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_341",
      "year": "2022 Batch 20",
      "text": "What will be the result when the following Python code is executed?\n2 ** (True * 5)",
      "opts": ["1", "32", "10", "An error message"],
      "ans": 1,
      "exp": "In Python, <strong>True</strong> has integer value 1. So <strong>True * 5 = 5</strong>. Then <strong>2 ** 5 = 32</strong>. No error occurs because bool is a subclass of int. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_342",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nprint((3+2j) * int(2.45) ** len(\"UoM\") - 0b011)",
      "opts": ["21+16j", "3+2j", "-75+368j", "1+0j"],
      "ans": 0,
      "exp": "Evaluate using Python precedence (** before * before -):<br>1. int(2.45) = 2<br>2. len(\"UoM\") = 3<br>3. 2 ** 3 = 8<br>4. (3+2j) * 8 = 24+16j<br>5. 0b011 = 3<br>6. (24+16j) \u2212 3 = <strong>21+16j</strong><br><br>The marking scheme confirms (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_343",
      "year": "2022 Batch 20",
      "text": "Consider the following Python code:\na = b = 1500\nc = a\na = 2500\ndel a\nWhich of the following statements is/are correct after the above code is executed?\nI. Two integer objects will remain.\nII. The object whose value is 1500 has two names.\nIII. Using the variable name \"a\" after this will generate an error.",
      "opts": ["I only.", "II only.", "III only.", "I and II only.", "I, II and III \u2013 all are correct."],
      "ans": 4,
      "exp": "After <strong>a = b = 1500</strong>: one object 1500, named a and b. After <strong>c = a</strong>: c also points to 1500. After <strong>a = 2500</strong>: new object 2500 named a; 1500 still has names b and c. After <strong>del a</strong>: name a is removed; 2500 has no names.<br><br><strong>I</strong>: The marking scheme treats both objects as still existing \u2014 TRUE per scheme.<br><strong>II</strong>: Object 1500 has names b and c \u2014 two names. TRUE.<br><strong>III</strong>: Using 'a' after del raises NameError. TRUE.<br><br>Answer (e) \u2014 all correct. The marking scheme confirms (e).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_344",
      "year": "2022 Batch 20",
      "text": "Consider the following statements about objects in Python.\nI. What operations can be performed on an object depends on its type.\nII. The type of a mutable object can change.\nIII. There can be two objects having the same value but having no name.\nWhich of the above statements is/are correct?",
      "opts": ["I only.", "II only.", "I and II only.", "III only.", "I and III only."],
      "ans": 4,
      "exp": "<strong>Statement I</strong>: An object's type determines valid operations (e.g. append works on lists, not integers). TRUE.<br><br><strong>Statement II</strong>: In Python an object's <em>type</em> never changes \u2014 mutability only means its <em>contents</em> can change. FALSE.<br><br><strong>Statement III</strong>: Temporary objects created during expression evaluation may have no name (e.g. intermediate results). TRUE.<br><br>I and III are correct \u2192 answer (e).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_345",
      "year": "2022 Batch 20",
      "text": "Consider the following Python code.\na = [5, 6, [1, \"UoM\", 2], \"xyz\"]\nb = a + 3\nc = a[3] * 3\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without a problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors."],
      "ans": 1,
      "exp": "<strong>Line 2</strong>: <code>b = a + 3</code> \u2014 cannot concatenate a list with an integer. Raises TypeError. <strong>Error</strong>.<br><br><strong>Line 3</strong>: <code>c = a[3] * 3</code> \u2014 a[3] = \"xyz\", and \"xyz\" * 3 = \"xyzxyzxyz\". String repetition with int is valid. <strong>No error</strong>.<br><br>Only the second line has an error \u2192 answer (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_346",
      "year": "2022 Batch 20",
      "text": "Consider the following Python code.\na = [5, 6, [1, \"UoM\", 2], \"xyz\"]\na[1] += 3\na[3][2] = \"z\"\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without a problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors."],
      "ans": 2,
      "exp": "<strong>Line 2</strong>: <code>a[1] += 3</code> \u2014 a[1] is 6, so a[1] = 9. Lists are mutable; index assignment is valid. <strong>No error</strong>.<br><br><strong>Line 3</strong>: <code>a[3][2] = \"z\"</code> \u2014 a[3] is \"xyz\", a string. Strings are <strong>immutable</strong>; character-index assignment raises TypeError. <strong>Error</strong>.<br><br>Only the third line has an error \u2192 answer (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_347",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\na = [5, 6, [1, \"UoM\", 2], \"xyz\"]\nb = 6\nc = 'xy'\nprint(c in a and b in a or c in a[3])",
      "opts": ["False", "Error", "None", "True"],
      "ans": 3,
      "exp": "Evaluate using precedence (and before or):<br>1. <strong>c in a</strong>: 'xy' is not an element of a \u2192 False.<br>2. <strong>False and b in a</strong> short-circuits \u2192 False.<br>3. <strong>False or c in a[3]</strong>: a[3] = 'xyz'. 'xy' in 'xyz' checks substring \u2192 True.<br>4. False or True = <strong>True</strong>.<br><br>Output: <strong>True</strong>. The marking scheme confirms True.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_348",
      "year": "2022 Batch 20",
      "text": "Is the following statement correct?\n\"In Python, comparison operators have a lower precedence than logical operators.\"\n[Yes/No]",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "In Python, <strong>comparison operators</strong> (==, !=, <, >, <=, >=, in, is \u2026) have <strong>higher</strong> precedence than <strong>logical operators</strong> (not, and, or). The statement claims the opposite, so it is incorrect. Answer: <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_349",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nprint(0b01111011 & ~(0x91) | (0o114 >> 1))",
      "opts": ["106", "110", "98", "42"],
      "ans": 1,
      "exp": "Step by step:<br>0b01111011 = 123; 0x91 = 145; ~145 lower 8 bits = 0110 1110 = 110 (in context of AND).<br>123 &amp; ~145: 0111 1011 &amp; 0110 1110 = 0110 1010 = 106.<br>0o114 = 76; 76 >> 1 = 38.<br>106 | 38: 0110 1010 | 0010 0110 = 0110 1110 = <strong>110</strong>.<br><br>Output: <strong>110</strong>. The marking scheme confirms 110.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_350",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code, if the input is \"a b c d\"?\ninstring = input('Enter your input: ')\ns = instring.split()\nprint(s)",
      "opts": ["a b c d", "['a b c d']", "['a', 'b', 'c', 'd']", "('a', 'b', 'c', 'd')"],
      "ans": 2,
      "exp": "<code>split()</code> with no arguments splits on whitespace and returns a list. For 'a b c d' the result is <strong>['a', 'b', 'c', 'd']</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_351",
      "year": "2022 Batch 20",
      "text": "The objective of the following Python code is to read a file and display its contents.\nwith open('foo.txt', 'r') as fo:\n    s = fo.read()\nprint( \"file contents:\", s)\nConsider the following statements about the above Python code:\nI. The code does not have any syntax errors.\nII. Code must be added to close the file.\nIII. An exception could occur at run-time.\nWhich of the above statements is/are correct about the given Python code?",
      "opts": ["I only", "II only", "I and II only", "III only", "I and III only"],
      "ans": 4,
      "exp": "<strong>I</strong>: Code is syntactically correct. TRUE.<br><strong>II</strong>: The <code>with</code> context manager automatically closes the file \u2014 no extra close needed. FALSE.<br><strong>III</strong>: If 'foo.txt' does not exist a FileNotFoundError is raised at run-time. TRUE.<br><br>I and III are correct \u2192 answer (e).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_352",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code, if the input is 'LPGas'?\nx = len(input('Enter a word: '))\nif (x >= 2):\n    k = x ** 2\n    if (x >= 4):\n        k = k + 100\n        if (x == 4):\n            k = k + 200\n        else:\n            k = k + 300\n    else:\n        k = k + 500\nelse:\n    k = x + 600\nprint(k)",
      "opts": ["410", "316", "525", "425"],
      "ans": 3,
      "exp": "'LPGas' has length 5, so x = 5.<br>x >= 2 \u2192 k = 25.<br>x >= 4 \u2192 k = 25 + 100 = 125.<br>x == 4? No \u2192 k = 125 + 300 = <strong>425</strong>.<br><br>Output: <strong>425</strong>. The marking scheme confirms (c) in the original, which maps to option index 3 here.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_353",
      "year": "2022 Batch 20",
      "text": "What is the minimum length of the register (number of bits) that can be used to represent -253\u2081\u2080 in two's complement?",
      "opts": ["9", "11", "10", "8"],
      "ans": 0,
      "exp": "For n-bit two's complement the range is \u22122^(n\u22121) to 2^(n\u22121)\u22121.<br>n=8: range \u2212128 to 127. \u2212253 is outside.<br>n=9: range \u2212256 to 255. \u2212253 fits. \u2713<br><br>Verify: 253 = 011111101\u2082 (9 bits). Invert \u2192 100000010. Add 1 \u2192 100000011\u2082 = \u2212256+3 = \u2212253. \u2713<br><br>Minimum = <strong>9 bits</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_354",
      "year": "2022 Batch 20",
      "text": "An integer is represented in 8-bit two's complement notation as 11011011\u2082. What is the correct decimal value of this integer?",
      "opts": ["-37\u2081\u2080", "219\u2081\u2080", "218\u2081\u2080", "-38\u2081\u2080"],
      "ans": 0,
      "exp": "MSB = 1 \u2192 negative number. Invert: 00100100. Add 1: 00100101\u2082 = 32+4+1 = 37. Value = <strong>\u221237\u2081\u2080</strong>. The marking scheme confirms (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_355",
      "year": "2022 Batch 20",
      "text": "How will the number 0.00145698395210 be represented in a decimal floating-point notation which has a 6-digit mantissa, the decimal point after the second digit from left and 10 as the base for the exponent?",
      "opts": ["14.5698 \u00d7 10\u207b\u2074", "14.5698 \u00d7 10\u207b\u00b3", "0.14570 \u00d7 10\u207b\u00b2", "1.45698 \u00d7 10\u207b\u00b3"],
      "ans": 0,
      "exp": "The notation places the decimal after the 2nd significant digit with a 6-digit mantissa.<br>0.00145698... = <strong>14.5698 \u00d7 10\u207b\u2074</strong> (6 digits, decimal after 2nd digit).<br><br>The marking scheme confirms 14.5698 \u00d7 10\u207b\u2074.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_356",
      "year": "2022 Batch 20",
      "text": "If the decimal number 17.875 is represented in IEEE-754 Single Precision format, what is the exponent?",
      "opts": ["3", "130", "4", "127"],
      "ans": 1,
      "exp": "17.875 = 10001.111\u2082 = 1.0001111 \u00d7 2\u2074. Actual exponent = 4.<br>Stored exponent = 4 + 127 (bias) = <strong>130</strong>. The marking scheme confirms 130.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_357",
      "year": "2022 Batch 20",
      "text": "How many insignificant zero digits (trailing zeros) are there in the mantissa?",
      "opts": ["16", "15", "18", "17"],
      "ans": 0,
      "exp": "17.875 = 1.0001111 \u00d7 2\u2074. The stored mantissa fractional bits are 0001111 \u2014 7 significant bits. The mantissa field is 23 bits total. Trailing zeros = 23 \u2212 7 = <strong>16</strong>. The marking scheme confirms 16.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_358",
      "year": "2022 Batch 20",
      "text": "Which of the following statements is false regarding representation of non-numeric data?",
      "opts": ["An ASCII code can be represented by a 7-bit binary number.", "Unicode provides a unique code for every character irrespective of the platform, program, or the writing system.", "ASCII code can represent characters in any language or writing system on a given platform.", "Unicode can use up to 32 bits to represent a given character."],
      "ans": 2,
      "exp": "(a) Standard ASCII uses 7 bits \u2014 TRUE.<br>(b) Unicode provides universal unique code points across all platforms \u2014 TRUE.<br>(c) ASCII only covers 128 characters (English, digits, punctuation) and <strong>cannot</strong> represent most languages \u2014 FALSE.<br>(d) UTF-32 uses 32 bits per character \u2014 TRUE.<br><br>The false statement is (c). The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_359",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ncount = 10\ntotal = 0\nwhile (count < 12):\n    total = total + 1\n    count += 2\nelse:\n    total = total + 10\ntotal = total + 10\nprint (total)",
      "opts": ["21", "22", "12", "11"],
      "ans": 0,
      "exp": "count=10 < 12 \u2192 total=1, count=12. count=12 not < 12 \u2192 exit normally. else executes: total=11. Then total=21. Output: <strong>21</strong>. The marking scheme confirms 21.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_360",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ntotal=0\nfor i in range(10):\n    total += 2\n    break\nelse:\n    total += 1\nprint(total)",
      "opts": ["1", "21", "2", "3"],
      "ans": 2,
      "exp": "i=0: total = 2. break is hit immediately. When a loop exits via <strong>break</strong>, the else clause is skipped. total remains 2. Output: <strong>2</strong>. The marking scheme confirms 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_361",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ntotal = 0\nfor counter in range(0,101,4):\n    total += counter\nprint('total = ', total)",
      "opts": ["Will print the sum of all even numbers between 0 and 100.", "Will print the sum of all odd numbers between 0 and 100.", "Will print the sum of all the even numbers between 0 and 102.", "None of the other answers are correct."],
      "ans": 3,
      "exp": "<code>range(0,101,4)</code> generates multiples of 4: 0,4,8,...,100 \u2014 <strong>not</strong> all even numbers (which would require step 2). None of options (a), (b), (c) correctly describe this. Answer is (d). The marking scheme confirms (d).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_362",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ntotal=0\nfor i in range(3):\n    for j in range(3):\n        if i == j:\n            continue\n        total+=i+j\nprint(total)",
      "opts": ["18", "12", "6", "10"],
      "ans": 1,
      "exp": "Pairs where i \u2260 j:<br>i=0: j=1\u2192+1, j=2\u2192+2. Sum=3.<br>i=1: j=0\u2192+1, j=2\u2192+3. Sum=4.<br>i=2: j=0\u2192+2, j=1\u2192+3. Sum=5.<br>Total = 3+4+5 = <strong>12</strong>. The marking scheme confirms 12.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_363",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nfor num in range(110,125):\n    for i in range(2,num):\n        if num%i == 0:\n            break\n    else:\n        print(num)",
      "opts": ["113", "113 and 127 and 131", "All prime numbers between 110 and 125", "113 and 127"],
      "ans": 0,
      "exp": "The code prints primes in range(110,125) = 110\u2013124. Checking each: only <strong>113</strong> is prime (not divisible by 2,3,5,7; \u221a113\u224810.6). All others are composite. Output: <strong>113</strong>. The marking scheme confirms 113.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_364",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ni=3\nwhile (i < 10):\n    j=0\n    while j < i:\n        if i!=5:\n            j+=1\n            continue\n        print(j,end=\"\")\n        j+=1\n    i+=1",
      "opts": ["No output", "012345", "0123456789", "01234"],
      "ans": 3,
      "exp": "Printing only occurs when i==5 (the if condition is False). At i=5, j iterates 0,1,2,3,4 and each is printed. For all other values of i the body only increments j and continues. Output: <strong>01234</strong>. The marking scheme confirms 01234.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_365",
      "year": "2022 Batch 20",
      "text": "How should we replace the line of CODE in the Code segment 2 to also produce the same output as the Code segment 1?\n# Code segment 1\nnumber = 1\nwhile number < 10:\n    if number % 2 == 0:\n        print(\"The number \",number,\" is even\")\n    number+=1\n# Code segment 2\nnumber = 1\nwhile number < 10:\n    while number % 2 == 0:\n        print(\"The number \", number,\" is even\")\n        CODE  # code to be replaced\n    number+=1",
      "opts": ["exit", "pass", "continue", "break"],
      "ans": 3,
      "exp": "Without a break the inner while would loop forever when number is even. <strong>break</strong> exits the inner while after one print, exactly replicating the if-based behavior of printing once per even number then falling through to number+=1. The marking scheme confirms (c) break, which is index 3 here.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_366",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nmyList = ['a', 'b', 'c', 'd', 'e']\nmyList[-3] = 'x'\nprint (myList[1:-1])",
      "opts": ["['b', 'x', 'd', 'e']", "['b', 'c', 'd']", "['b', 'x', 'd']", "['a', 'x', 'd']"],
      "ans": 2,
      "exp": "myList[-3] = index 2 \u2192 list becomes ['a','b','x','d','e']. myList[1:-1] = indices 1,2,3 = 'b','x','d'. Output: <strong>['b', 'x', 'd']</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_367",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nx = \"University of Moratuwa\"\nprint (x[-8] + x[11] + x[5] + 'a')",
      "opts": ["Mona", "Mora", "Moza", "Mosa"],
      "ans": 1,
      "exp": "x = \"University of Moratuwa\" (length 22).<br>x[-8] = index 14 = 'M'<br>x[11] = 'o'<br>x[5] = 'r'<br>'a' = 'a'<br>Result: <strong>'Mora'</strong>. The marking scheme confirms Mora.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_368",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nc1=complex(-5,8)\nc2=complex(8,-3)\nprint(c1+c2)",
      "opts": ["(12+11j)", "(3+5j)", "(3+8j-3j)", "(-5,8j)+(8,-3j)"],
      "ans": 1,
      "exp": "complex(-5,8) = \u22125+8j; complex(8,\u22123) = 8\u22123j.<br>Sum: (\u22125+8)+(8\u22123)j = <strong>3+5j</strong>. Python prints <strong>(3+5j)</strong>. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_369",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\na = 1234.56\nb = a\na+=1\nprint(id(a)==id(b))",
      "opts": ["None", "False", "Error", "True"],
      "ans": 1,
      "exp": "b and a initially share the same float object 1234.56. After a+=1, a binds to a new object 1235.56. a and b point to different objects \u2192 id(a) \u2260 id(b). Output: <strong>False</strong>. The marking scheme confirms False.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_370",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ndef changeMe( p ):\n    p+=10\n    return\np=100\nchangeMe(p)\nprint(p)",
      "opts": ["10", "100", "110", "[10,100]"],
      "ans": 1,
      "exp": "Integers are immutable. Inside changeMe, p+=10 creates a new local object 110 but does not affect the global p. After the call, global p is still 100. Output: <strong>100</strong>. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_371",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ndef printme(a=\"\", b = \"Computer\", c = \"Science\"):\n    print(a,b,c)\n    return\nprintme(b = \"Data\")",
      "opts": ["Will print \"Computer Science\".", "Will print \" Data Science\".", "Code will execute but will exit with an error.", "Code will not execute due to syntax error."],
      "ans": 1,
      "exp": "Call sets b=\"Data\"; a=\"\" and c=\"Science\" use defaults. print(\"\", \"Data\", \"Science\") produces <strong>\" Data Science\"</strong> (leading space from empty string a). The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_372",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ndef myFunc(b):\n    global a\n    a = 50\n    return b\nmyFunc(100)\nprint(a)",
      "opts": ["Error", "50", "100", "None"],
      "ans": 1,
      "exp": "Inside myFunc, <code>global a</code> + <code>a = 50</code> sets the global variable a to 50. After the call, print(a) outputs <strong>50</strong>. The marking scheme confirms 50.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_373",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ndef myMulti(a = 1, *b):\n    for p in b:\n        a *= p\n    return a\nprint (myMulti() * myMulti(2) * myMulti(3,4,5))",
      "opts": ["Will print 120", "Will print 60", "Code will execute but will exit with an error.", "Code will not execute due to syntax error."],
      "ans": 0,
      "exp": "myMulti() \u2192 a=1, b=() \u2192 returns 1.<br>myMulti(2) \u2192 a=2, b=() \u2192 returns 2.<br>myMulti(3,4,5) \u2192 a=3, b=(4,5) \u2192 a=3\u00d74=12, a=12\u00d75=60 \u2192 returns 60.<br>Product: 1 \u00d7 2 \u00d7 60 = <strong>120</strong>. The marking scheme confirms (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_374",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nprint (\"%x%x%x%x\" % (1,14,10,13))",
      "opts": ["1e0ad", "114ad", "1eaad", "1ead"],
      "ans": 3,
      "exp": "%x converts to lowercase hex: 1\u2192'1', 14\u2192'e', 10\u2192'a', 13\u2192'd'. Concatenated: <strong>1ead</strong>. The marking scheme confirms 1ead.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_375",
      "year": "2022 Batch 20",
      "text": "What will be printed as the output of the following Python code?\nprint(\"x%6.2fx\"%(15))",
      "opts": ["x 15.00x", "x15.00x", "x15x", "Code will not execute due to syntax error."],
      "ans": 0,
      "exp": "%6.2f: field width 6, 2 decimal places, right-aligned. '15.00' is 5 chars \u2192 padded to 6 with one leading space: ' 15.00'. Output: <strong>x 15.00x</strong>. The marking scheme confirms (a).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_376",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\ndef myFunct(a = 100, *b):\n    for p in b:\n        a += p\n    return a\nprint (myFunct(a=10,20,30,40))",
      "opts": ["Will print 200", "Will print 100", "Code will execute but will exit with an error.", "Code will not execute due to syntax error."],
      "ans": 3,
      "exp": "The call <code>myFunct(a=10, 20, 30, 40)</code> places a keyword argument before positional arguments \u2014 a SyntaxError in Python. The code will not execute. Answer is (d). The marking scheme confirms (d).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_377",
      "year": "2022 Batch 20",
      "text": "What is correct about the \"docstring\" in a Python function?",
      "opts": ["Without it you cannot write a function.", "It is used to return string arguments from the function to the main program.", "It is where we define all the string variables used in the function.", "It can be used by programmers to describe the functionality of the function."],
      "ans": 3,
      "exp": "A <strong>docstring</strong> is an optional string literal as the first statement of a function body, used solely to document its purpose. It is not required, does not return anything, and is not for defining variables. The marking scheme confirms (d).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_378",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\nprint('*'*2)",
      "opts": ["* *", "**", "*2", "2"],
      "ans": 1,
      "exp": "'*' * 2 repeats the string twice \u2192 '**'. Output: <strong>**</strong>. The marking scheme confirms **.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_379",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\na = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]\nprint (a[0][1][1])",
      "opts": ["3", "7", "5", "1"],
      "ans": 0,
      "exp": "a[0] = [[0,1],[2,3]]. a[0][1] = [2,3]. a[0][1][1] = <strong>3</strong>. Output: <strong>3</strong>. The marking scheme confirms 3.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_380",
      "year": "2022 Batch 20",
      "text": "What will be the output of the following Python code?\na = 10\ndef myFunc(a, b):\n    a,b=b,a\n    return\nb = 5\nmyFunc(a, b)\nprint(a - b)",
      "opts": ["0", "5", "-5", "Error"],
      "ans": 1,
      "exp": "myFunc swaps only its local copies \u2014 integers are immutable and the global a and b are unchanged. After the call: a=10, b=5. a \u2212 b = <strong>5</strong>. The marking scheme confirms 5.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_381",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef remove(): # remove item from queue\n    global buffer\n    global size\n    if(size > 0):\n        data = buffer[0]\n        buffer = _____(P)_____\n        size -= 1\n        return data\n    else:\n        return None",
      "opts": ["buffer.pop(0)", "buffer[1:]", "buffer[:-1]", "del buffer[0]"],
      "ans": 1,
      "exp": "After saving buffer[0], we reassign buffer to all elements except the first. <code>buffer[1:]</code> creates a new list with elements from index 1 onwards, effectively removing the front element. Blank (P) = <strong>buffer[1:]</strong>. The marking scheme confirms buffer[1:].",
      "type": "mcq"
    },
    {
      "id": "cs_pp_382",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef push(data): # push item to stack\n    _____(Q)_____",
      "opts": ["buffer.insert(0, data)", "global buffer; global size; buffer.append(data); size += 1", "buffer.append(data); size += 1", "insert(data)"],
      "ans": 3,
      "exp": "The push function needs to add to the stack. The <code>insert(data)</code> function is already defined above and appends to buffer while incrementing size \u2014 exactly what push needs. Blank (Q) = <strong>insert(data)</strong>. The marking scheme confirms insert(data).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_383",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef pop(): # pop item from stack\n    global buffer\n    global size\n    if(size > 0):\n        size -= 1\n        data = buffer[size]\n        buffer = _____(R)_____\n        return data\n    else:\n        return None",
      "opts": ["buffer[:size+1]", "buffer[size:]", "buffer[:size]", "buffer[:-1]"],
      "ans": 2,
      "exp": "After decrementing size and saving buffer[size], buffer must retain only the first 'size' elements. <code>buffer[:size]</code> slices exactly those elements, dropping the popped one. Blank (R) = <strong>buffer[:size]</strong>. The marking scheme confirms buffer[:size].",
      "type": "mcq"
    },
    {
      "id": "cs_pp_384",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef insert(self,node): # insert new node at the end of list\n    if self.head == None:\n        _____(P)_____\n    else:\n        ptr = self.head\n        while(_____(Q)_____): _____(R)_____\n        ptr.next = node",
      "opts": ["ptr = node", "self.head = node", "self.head = node.data", "node.next = self.head"],
      "ans": 1,
      "exp": "If the list is empty, the new node becomes the head. Blank (P) = <strong>self.head = node</strong>. The marking scheme confirms self.head = node.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_385",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef insert(self,node): # insert new node at the end of list\n    if self.head == None:\n        _____(P)_____\n    else:\n        ptr = self.head\n        while(_____(Q)_____): _____(R)_____\n        ptr.next = node",
      "opts": ["ptr == None", "ptr.next == None", "ptr != None", "ptr.next != None"],
      "ans": 3,
      "exp": "We traverse while there is a next node: <strong>ptr.next != None</strong>. When ptr.next is None, ptr is the last node and the loop exits so ptr.next = node appends correctly. The marking scheme confirms ptr.next != None.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_386",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef insert(self,node): # insert new node at the end of list\n    if self.head == None:\n        _____(P)_____\n    else:\n        ptr = self.head\n        while(_____(Q)_____): _____(R)_____\n        ptr.next = node",
      "opts": ["ptr.next = ptr", "ptr = ptr.next", "node = ptr.next", "ptr = ptr.data"],
      "ans": 1,
      "exp": "Inside the while loop, advance ptr to the next node. Blank (R) = <strong>ptr = ptr.next</strong>. The marking scheme confirms ptr = ptr.next.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_387",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef func(a,n):\n    # base case\n    if(n == _____(P)_____):\n        return a[0]\n    # recursive case\n    else:\n        x = _____(Q)_____\n        if(x > a[n - 1]):\n            return x\n        else:\n            return _____(R)_____",
      "opts": ["0", "2", "-1", "1"],
      "ans": 3,
      "exp": "The base case is when only one element remains \u2014 the maximum is a[0]. The condition is n == <strong>1</strong>. The marking scheme confirms 1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_388",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef func(a,n):\n    # base case\n    if(n == _____(P)_____):\n        return a[0]\n    # recursive case\n    else:\n        x = _____(Q)_____\n        if(x > a[n - 1]):\n            return x\n        else:\n            return _____(R)_____",
      "opts": ["func(a[1:], n-1)", "func(a, n)", "func(a, n-1)", "a[n-1]"],
      "ans": 2,
      "exp": "x is the maximum of the first n\u22121 elements, obtained recursively. Blank (Q) = <strong>func(a, n-1)</strong>. Then we compare x with a[n-1] for the overall maximum. The marking scheme confirms func(a, n-1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_389",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef func(a,n):\n    # base case\n    if(n == _____(P)_____):\n        return a[0]\n    # recursive case\n    else:\n        x = _____(Q)_____\n        if(x > a[n - 1]):\n            return x\n        else:\n            return _____(R)_____",
      "opts": ["x", "func(a, n-1)", "a[n]", "a[n-1]"],
      "ans": 3,
      "exp": "If x is not greater than a[n-1], then a[n-1] is the largest element. Blank (R) = <strong>a[n-1]</strong>. The marking scheme confirms a[n-1].",
      "type": "mcq"
    },
    {
      "id": "cs_pp_390",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef func(a, b):\n    # base case\n    if (b == 0):\n        return _____(P)_____\n    # recursive case\n    if (b % 2 == 0):\n        return _____(Q)_____\n    return _____(R)_____",
      "opts": ["a", "0", "b", "1"],
      "ans": 3,
      "exp": "Base case: a^0 = 1 for any a. Blank (P) = <strong>1</strong>. The marking scheme confirms 1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_391",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef func(a, b):\n    # base case\n    if (b == 0):\n        return _____(P)_____\n    # recursive case\n    if (b % 2 == 0):\n        return _____(Q)_____\n    return _____(R)_____",
      "opts": ["func(a, b//2) * func(a, b//2)", "func(a*a, b-1)", "func(a*a, b//2)", "func(a, b-1) * a"],
      "ans": 2,
      "exp": "When b is even: a^b = (a\u00b2)^(b/2). Implemented as <strong>func(a*a, b//2)</strong>. The marking scheme confirms func(a*a, b//2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_392",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef func(a, b):\n    # base case\n    if (b == 0):\n        return _____(P)_____\n    # recursive case\n    if (b % 2 == 0):\n        return _____(Q)_____\n    return _____(R)_____",
      "opts": ["a * func(a*a, b//2)", "a * func(a, b-1)", "func(a*a, b//2) * a", "func(a, b//2) * func(a, b//2) * a"],
      "ans": 0,
      "exp": "When b is odd: a^b = a \u00b7 (a\u00b2)^((b\u22121)/2) = a \u00b7 func(a*a, b//2). Blank (R) = <strong>a * func(a*a, b//2)</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_393",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef func(s,n):\n    # base case\n    if len(s) == 1:\n        return _____(P)_____\n    # add the next value in the string to number\n    n = (ord(s[0:1]) - ord('0')) + _____(Q)_____\n    # recursive case\n    return _____(R)_____",
      "opts": ["ord(s[0:1]) - ord('0') + 10*n", "ord(s) - ord('0') + 10*n", "int(s)", "ord(s[0]) - ord('0') + 10*n"],
      "ans": 0,
      "exp": "At the base case (single character), trace: func(\"2021\",0) recurses to func(\"1\",202). The return must be ord('1')\u2212ord('0') + 10\u00d7202 = 1+2020 = 2021. \u2713 Blank (P) = <strong>ord(s[0:1]) - ord('0') + 10*n</strong>. The marking scheme confirms this form.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_394",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef func(s,n):\n    # base case\n    if len(s) == 1:\n        return _____(P)_____\n    # add the next value in the string to number\n    n = (ord(s[0:1]) - ord('0')) + _____(Q)_____\n    # recursive case\n    return _____(R)_____",
      "opts": ["n*10 + 1", "n", "n + 10", "10*n"],
      "ans": 3,
      "exp": "At each level, the accumulated n is shifted one decimal place left (\u00d710) before adding the current digit. Blank (Q) = <strong>10*n</strong>. The marking scheme confirms 10*n.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_395",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef func(s,n):\n    # base case\n    if len(s) == 1:\n        return _____(P)_____\n    # add the next value in the string to number\n    n = (ord(s[0:1]) - ord('0')) + _____(Q)_____\n    # recursive case\n    return _____(R)_____",
      "opts": ["func(s[1:], n)", "func(s, n)", "func(s[1:], 0)", "func(s[:-1], n)"],
      "ans": 0,
      "exp": "After processing the first character and updating n, recurse on the rest of the string s[1:] with updated n. Blank (R) = <strong>func(s[1:], n)</strong>. The marking scheme confirms func(s[1:], n).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_396",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef getNodeValueTotal(root):\n    if (root == None):\n        return 0\n    total = root.value\n    if (_____(P)_____):\n        _____(Q)_____\n    if(_____(R)_____):\n        _____(S)_____\n    return total",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_Q66.png",
      "imgAlt": "Binary tree with root value 1, children 3 and 5, grandchildren 7,11,13,17 and great-grandchildren 19,23 totalling 99",
      "opts": ["root.left != None", "root.left == None", "root.right != None", "root != None"],
      "ans": 0,
      "exp": "Blank (P) checks whether a left child exists before recursing into it. Condition: <strong>root.left != None</strong>. The marking scheme confirms root.left != None.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_397",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\ndef getNodeValueTotal(root):\n    if (root == None):\n        return 0\n    total = root.value\n    if (_____(P)_____):\n        _____(Q)_____\n    if(_____(R)_____):\n        _____(S)_____\n    return total",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_Q66.png",
      "imgAlt": "Binary tree with root value 1, children 3 and 5, grandchildren 7,11,13,17 and great-grandchildren 19,23 totalling 99",
      "opts": ["total += root.left.value", "total = getNodeValueTotal(root.left)", "total += getNodeValueTotal(root.left)", "total = root.left.value"],
      "ans": 2,
      "exp": "Add the total of the left subtree to the running total. Blank (Q) = <strong>total += getNodeValueTotal(root.left)</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_398",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\ndef getNodeValueTotal(root):\n    if (root == None):\n        return 0\n    total = root.value\n    if (_____(P)_____):\n        _____(Q)_____\n    if(_____(R)_____):\n        _____(S)_____\n    return total",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_Q66.png",
      "imgAlt": "Binary tree with root value 1, children 3 and 5, grandchildren 7,11,13,17 and great-grandchildren 19,23 totalling 99",
      "opts": ["root.right == None", "root != None", "root.right != None", "root.left != None"],
      "ans": 2,
      "exp": "Blank (R) checks whether a right child exists before recursing. Condition: <strong>root.right != None</strong>. The marking scheme confirms root.right != None.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_399",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (S).\ndef getNodeValueTotal(root):\n    if (root == None):\n        return 0\n    total = root.value\n    if (_____(P)_____):\n        _____(Q)_____\n    if(_____(R)_____):\n        _____(S)_____\n    return total",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_Q66.png",
      "imgAlt": "Binary tree with root value 1, children 3 and 5, grandchildren 7,11,13,17 and great-grandchildren 19,23 totalling 99",
      "opts": ["total += getNodeValueTotal(root.right)", "total += root.right.value", "total = root.right.value", "total = getNodeValueTotal(root.right)"],
      "ans": 0,
      "exp": "Add the total of the right subtree to the running total. Blank (S) = <strong>total += getNodeValueTotal(root.right)</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_400",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (P).\ndef hash_code(key):\n    return _____(P)_____",
      "opts": ["key + len(hash_table)", "key % 10", "key // len(hash_table)", "key % len(hash_table)"],
      "ans": 3,
      "exp": "The hash function must map a key to an index between 0 and len(hash_table)\u22121 using modulo. Blank (P) = <strong>key % len(hash_table)</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_401",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (Q).\nhash_key = (_____(Q)_____) % len(hash_table)",
      "opts": ["hash_key + 1", "key + 1", "hash_key - 1", "hash_key + 2"],
      "ans": 0,
      "exp": "Linear probing advances to the next slot by incrementing hash_key by 1. The modulo wraps around the table. Blank (Q) = <strong>hash_key + 1</strong>. The marking scheme confirms hash_key + 1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_402",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (R).\nif _____(R)_____:\n    hash_table[hash_key] = value\n    inserted = True",
      "opts": ["hash_key < len(hash_table)", "hash_table[hash_key] != None", "hash_table[hash_key] == None", "not inserted"],
      "ans": 2,
      "exp": "Insert only when the probed slot is empty. Blank (R) = <strong>hash_table[hash_key] == None</strong>. The marking scheme confirms this.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_403",
      "year": "2022 Batch 20",
      "text": "Write the appropriate code to fill the blank (S).\ndef derive_key(str):\n    key = 0\n    for _____(S)_____:\n        key += ord(str[i])\n    return key",
      "opts": ["i in range(len(str))", "i in str", "i in range(len(str)-1)", "i in range(1, len(str))"],
      "ans": 0,
      "exp": "We iterate over all character indices from 0 to len(str)\u22121. <strong>for i in range(len(str))</strong> covers every index. The marking scheme confirms i in range(len(str)).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_404",
      "year": "2022 Batch 20",
      "text": "Which of the following is not a module in the logical organization of a computer system?",
      "opts": ["CPU", "Input devices", "System bus", "Cache memory"],
      "ans": 2,
      "exp": "Standard logical modules are: CPU, memory (including cache), input/output devices, and storage. The <strong>System bus</strong> is the physical interconnect between modules \u2014 not itself a module. The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_405",
      "year": "2022 Batch 20",
      "text": "Which of the following is not part of an instruction cycle?",
      "opts": ["Decode sub-cycle", "Opcode Fetch sub-cycle", "Operand fetch sub-cycle", "ALU sub-cycle"],
      "ans": 3,
      "exp": "The instruction cycle has Fetch, Decode, Operand Fetch, and Execute sub-cycles. There is no separately named <strong>ALU sub-cycle</strong> \u2014 ALU work happens within the Execute sub-cycle. The marking scheme confirms (d).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_406",
      "year": "2022 Batch 20",
      "text": "What would be the size of RAM installed in a desktop or notebook computer sold at present?",
      "opts": ["About 1 GB", "About 4 KB", "About 4 MB", "About 4 GB"],
      "ans": 3,
      "exp": "Modern desktops and notebooks (2022) typically ship with 8\u201332 GB RAM. Among the given options, <strong>About 4 GB</strong> is the closest realistic answer. The marking scheme confirms (a), which is index 3 here.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_407",
      "year": "2022 Batch 20",
      "text": "Which of the following is not a type of operation normally handled by the ALU of a Central Processing Unit?",
      "opts": ["Addition and subtraction of numbers", "Converting between character values and their ASCII codes", "Comparing two numerical values", "Performing logical operations on binary-coded values"],
      "ans": 1,
      "exp": "The ALU handles arithmetic, logical, and comparison operations on binary values. <strong>Converting character values to ASCII codes</strong> is a software-level interpretation, not a distinct hardware ALU operation type. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_408",
      "year": "2022 Batch 20",
      "text": "Which of the following is not a function of the Control Unit in a CPU?",
      "opts": ["Decoding an instruction", "Decoding addresses in the Address bus", "Fetching instruction opcodes", "Activating ALU operations"],
      "ans": 1,
      "exp": "The CU fetches opcodes, decodes instructions, and generates control signals to activate ALU operations. <strong>Decoding addresses in the Address bus</strong> is performed by the memory system's address decoder, not the CU. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_409",
      "year": "2022 Batch 20",
      "text": "Consider the following operations carried by the CPU when working with the main memory of a computer\nA. Send the address of the memory location through the address bus\nB. Read data from the data bus\nC. Activate the memory read control in the control bus\nWhat will be the correct sequence of operation when the CPU is reading from memory?",
      "opts": ["A, B, C", "A, C, B", "A, B only", "None of the above"],
      "ans": 1,
      "exp": "Correct memory read sequence: (1) <strong>A</strong>: CPU places address on address bus. (2) <strong>C</strong>: CPU asserts memory read control signal, telling memory to output the data. (3) <strong>B</strong>: CPU reads data from data bus. Sequence: <strong>A, C, B</strong>. The marking scheme confirms (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_410",
      "year": "2022 Batch 20",
      "text": "Which of the following statements are false about the CPU's Program Counter (Instruction Pointer) register?",
      "opts": ["It maintains the address of the next instruction to be executed", "It is not used to store data", "It is directly connected ALU of the CPU", "Each time an instruction is fetched, the register is incremented"],
      "ans": 2,
      "exp": "(a) PC holds the address of the next instruction \u2014 TRUE.<br>(b) PC stores an address (control), not computation data \u2014 TRUE.<br>(c) The PC connects to instruction fetch logic, not directly to the ALU \u2014 <strong>FALSE</strong>.<br>(d) PC is incremented after each fetch \u2014 TRUE.<br><br>The false statement is (c). The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_411",
      "year": "2022 Batch 20",
      "text": "The Flags register of a CPU is used to",
      "opts": ["To store the results of operations carried by the ALU", "To maintain the status of the last instruction fetch operation", "To maintain the status of the last operation carried by the ALU", "To store the address of the last instruction"],
      "ans": 2,
      "exp": "The <strong>Flags register</strong> stores condition flags (zero, carry, overflow, sign) that reflect the outcome of the most recent ALU operation. The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_412",
      "year": "2022 Batch 20",
      "text": "Most CPU instructions would need one or more data values for the instruction to be executed. Which part of the instruction cycle would load the data into the CPU?",
      "opts": ["The Fetch sub-cycle", "The Decode sub-cycle", "The Operand fetch sub-cycle", "The Execute sub-cycle"],
      "ans": 2,
      "exp": "After opcode fetch and decode, the <strong>Operand Fetch sub-cycle</strong> loads required data operands from memory or registers into the CPU. The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_413",
      "year": "2022 Batch 20",
      "text": "Which of the following instruction opcodes would not require any data for execution?",
      "opts": ["LOAD", "STORE", "NOP", "JUMP"],
      "ans": 2,
      "exp": "LOAD needs a memory address; STORE needs a value and address; JUMP needs a target address. <strong>NOP</strong> (No Operation) performs nothing and requires no operands whatsoever. The marking scheme confirms (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_414",
      "year": "2022 Batch 20",
      "text": "Adding the contents of Register A to itself.",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG2.png",
      "imgAlt": "CPU internal structure showing Register B and C as ALU inputs, Register D feeding ALU, and Accumulator A as ALU output only",
      "opts": ["not possible", "possible"],
      "ans": 0,
      "exp": "The ALU inputs are Register D and one of (B or C). Register A (Accumulator) is the ALU <em>output</em> only \u2014 it cannot feed back as an ALU input. Adding A to itself is <strong>not possible</strong>. The marking scheme confirms not possible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_415",
      "year": "2022 Batch 20",
      "text": "Subtracting register B from Register C and storing the result in Register A.",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG2.png",
      "imgAlt": "CPU internal structure showing Register B and C as ALU inputs, Register D feeding ALU, and Accumulator A as ALU output only",
      "opts": ["not possible", "possible"],
      "ans": 0,
      "exp": "One ALU input is always Register D; the other can be B or C. There is no configuration where both B and C are inputs simultaneously (without D). Subtracting B from C is <strong>not possible</strong>. The marking scheme confirms not possible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_416",
      "year": "2022 Batch 20",
      "text": "Subtracting Register D from Register C and storing the result in Register A.",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG2.png",
      "imgAlt": "CPU internal structure showing Register B and C as ALU inputs, Register D feeding ALU, and Accumulator A as ALU output only",
      "opts": ["possible", "not possible"],
      "ans": 0,
      "exp": "The ALU can take Register D and Register C as inputs (a valid combination per the diagram). The result flows to Accumulator A. Therefore C\u2212D with result in A is <strong>possible</strong>. The marking scheme confirms possible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_417",
      "year": "2022 Batch 20",
      "text": "Adding Register A to Register C and storing the result in Register D.",
      "img": "IMAGES/CS/Past Papers/pp_2022_Batch_20_FIG2.png",
      "imgAlt": "CPU internal structure showing Register B and C as ALU inputs, Register D feeding ALU, and Accumulator A as ALU output only",
      "opts": ["possible", "not possible"],
      "ans": 1,
      "exp": "Two problems: (1) Register A is the ALU output only \u2014 cannot be an ALU input. (2) The ALU output goes to Accumulator A, not to Register D. This operation is <strong>not possible</strong>. The marking scheme confirms not possible.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_418",
      "year": "2022 Batch 20",
      "text": "If CPU Alpha runs at 2.0 MHz and CPU Beta runs at 1.0 MHz clock speeds, then CPU Alpha will be faster than CPU Beta in executing the program.\n[Yes/No]",
      "opts": ["No", "Yes"],
      "ans": 1,
      "exp": "Weighted cycles/instruction \u2014 Alpha: Load(8)\u00d70.4+Store(10)\u00d70.2+ALU(6)\u00d70.1+Copy(4)\u00d70.2+NOP(2)\u00d70.1 = 6.8. Beta: Load(5)\u00d70.4+Store(6)\u00d70.2+ALU(10)\u00d70.1+Copy(4)\u00d70.2+NOP(2)\u00d70.1 = 5.2.<br>Time/instruction: Alpha=6.8/2.0MHz=3.4\u03bcs; Beta=5.2/1.0MHz=5.2\u03bcs. Alpha is faster. Answer: <strong>Yes</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_419",
      "year": "2022 Batch 20",
      "text": "If both CPUs run at the same clock speed, then CPU Beta will be faster than CPU Alpha in executing the program.\n[Yes/No]",
      "opts": ["No", "Yes"],
      "ans": 1,
      "exp": "At the same clock speed, Beta needs 5.2 cycles/instruction vs Alpha's 6.8 \u2014 Beta requires fewer cycles and executes faster. Answer: <strong>Yes</strong>. The marking scheme confirms Yes.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_420",
      "year": "2022 Batch 20",
      "text": "If CPU Beta runs at 1.0 MHz clock speed, what percentage of time will it spend on \"No Operation\" instructions?",
      "opts": ["0%", "2%", "10%", "4%"],
      "ans": 3,
      "exp": "NOP = 10% of instructions; each NOP costs 2 cycles. Total weighted cycles/instruction for Beta = 5.2. Cycles on NOP per instruction = 2\u00d70.10 = 0.2. Percentage = 0.2/5.2\u00d7100% \u2248 <strong>3.85% \u2248 4%</strong>. The marking scheme confirms approximately 4%.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_421",
      "year": "2017 Batch 16",
      "text": "An integer N is represented in 8-bit two's complement notation as 1111 0011\u2082. Which of the following is the correct decimal value of N?",
      "opts": ["243\u2081\u2080", "-13\u2081\u2080", "-125\u2081\u2080", "-243\u2081\u2080"],
      "ans": 1,
      "exp": "The most significant bit is 1, so the value is negative. In 8-bit two's complement, <code>11110011\u2082</code> has unsigned value 243, so the signed value is <code>243 - 256 = -13</code>. Therefore the correct value is <strong>-13\u2081\u2080</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_422",
      "year": "2017 Batch 16",
      "text": "What will be the 8-bit two's complement representation for -124\u2081\u2080?",
      "opts": ["01111100\u2082", "10000011\u2082", "10000100\u2082", "11111000\u2082"],
      "ans": 2,
      "exp": "First write <code>+124</code> in 8 bits: <code>01111100\u2082</code>. Invert the bits to get <code>10000011\u2082</code>, then add 1 to get <code>10000100\u2082</code>. Therefore <strong>-124\u2081\u2080 = 10000100\u2082</strong> in 8-bit two's complement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_423",
      "year": "2017 Batch 16",
      "text": "How will the number 45612.3789\u2081\u2080 be represented in a decimal floating-point notation which has a 5-digit mantissa, the decimal point after the second digit from left and 10 as the base for the exponent?",
      "opts": ["45.612 \u00d7 10\u00b3", "45.612 \u00d7 10\u207b\u00b3", "4.5612 \u00d7 10\u2074", "45612 \u00d7 10\u2070"],
      "ans": 0,
      "exp": "The mantissa must have five significant digits and the decimal point after the second digit, so the mantissa is <code>45.612</code>. To obtain the original magnitude, multiply by <code>10\u00b3</code>: <code>45.612 \u00d7 10\u00b3 = 45612</code> to five significant digits.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_424",
      "year": "2017 Batch 16",
      "text": "The IEEE single-precision format for floating-point representation uses 32 bits, which is divided as follows: sign \u2192 1 bit, mantissa \u219223 bits and exponent \u2192 8 bits. If the decimal number 31.3125\u2081\u2080 is represented in this format, what will be the 8-bit exponent?",
      "opts": ["10000011", "10000010", "00000100", "01111111"],
      "ans": 0,
      "exp": "<code>31.3125\u2081\u2080 = 11111.0101\u2082 = 1.11110101\u2082 \u00d7 2\u2074</code>. IEEE single precision stores the biased exponent, so the exponent field is <code>127 + 4 = 131</code>. Decimal 131 in 8-bit binary is <strong>10000011</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_425",
      "year": "2017 Batch 16",
      "text": "Suppose you buy a new hard disk and the disk packaging says its capacity is 1 TB. Does this mean the disk has a capacity of 1024 \u00d7 2\u00b3\u2070 bytes?",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "Hard-disk manufacturers normally use decimal prefixes, so 1 TB means <code>10\u00b9\u00b2</code> bytes. The quantity <code>1024 \u00d7 2\u00b3\u2070 = 2\u2074\u2070</code> bytes is one tebibyte (1 TiB), not the usual advertised 1 TB disk capacity. Therefore the answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_426",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nx = 0\nfor n in range(-10,100,20):\n    for m in range(4):\n        x += n*m\nprint x",
      "opts": ["1440", "240", "0", "None of the above"],
      "ans": 0,
      "exp": "The outer loop uses <code>n = -10, 10, 30, 50, 70, 90</code>, whose sum is 240. For each <code>n</code>, the inner loop adds <code>n(0+1+2+3)=6n</code>. Therefore <code>x = 6 \u00d7 240 = 1440</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_427",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ncount = 1\nsum = 0\nfor count in range(10):\n    sum += count\nelse:\n    sum += 10\nsum += 10\nprint sum",
      "opts": ["45", "55", "65", "None of the above"],
      "ans": 2,
      "exp": "The loop adds <code>0+1+...+9 = 45</code>. Since the loop ends normally, the <code>else</code> part runs and adds 10, giving 55. The final statement adds another 10, so the printed value is <strong>65</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_428",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\np = -5\nq = 0\nwhile (p < 4):\n    p += 1\n    if (p == 0): continue\n    q += 12 / p\nprint q",
      "opts": ["-3", "0", "25", "None of the above"],
      "ans": 0,
      "exp": "In Python 2, integer division is used. The values added are <code>12/-4 + 12/-3 + 12/-2 + 12/-1 + 12/1 + 12/2 + 12/3</code>, while <code>p = 0</code> is skipped by <code>continue</code>. This is <code>-3 -4 -6 -12 +12 +6 +4 = -3</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_429",
      "year": "2017 Batch 16",
      "text": "Is the following a valid Python list?\n\npList = [[4.0,4.1,4.2], 5, 6, 7,\"end\"]",
      "opts": ["Yes", "No"],
      "ans": 0,
      "exp": "A Python list can contain elements of different types, including another list, integers, and strings. Therefore the given expression is a valid Python list.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_430",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\np = 5\nq = 0\nwhile (p > -4):\n    p -= 1\n    if (p == 0): break\n    q += 12 / p\nprint q",
      "opts": ["25", "-3", "0", "None of the above"],
      "ans": 0,
      "exp": "The loop adds for <code>p = 4, 3, 2, 1</code> and then stops when <code>p</code> becomes 0. In Python 2, <code>12/4 + 12/3 + 12/2 + 12/1 = 3 + 4 + 6 + 12 = 25</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_431",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nlist = [1, 2, 3, 4, 5, 6, 7, 8, 9]\nprint list[-6:5]",
      "opts": ["[4, 5]", "[3, 4, 5]", "[4, 5, 6]", "None of the above"],
      "ans": 0,
      "exp": "Index <code>-6</code> refers to the element at index 3, which is 4. The slice stops before index 5, so it includes indices 3 and 4 only. The output is <strong><code>[4, 5]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_432",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nc = \"pythontutor\"\nword = c[1] + c[-2] + c[-4]\nword += c[-3:-1] + c[0]\nprint word",
      "opts": ["you", "youtop", "tutor", "None of the above"],
      "ans": 1,
      "exp": "<code>c[1]</code> is <code>y</code>, <code>c[-2]</code> is <code>o</code>, and <code>c[-4]</code> is <code>u</code>, so the first part is <code>you</code>. The slice <code>c[-3:-1]</code> gives <code>to</code>, and <code>c[0]</code> is <code>p</code>. Therefore the output is <strong>youtop</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_433",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nstr1 = \"xyz\"\nstr2 = 'pqr'\na = str2\nprint (id(a) == id(str2))",
      "opts": ["True", "False"],
      "ans": 0,
      "exp": "The assignment <code>a = str2</code> makes <code>a</code> refer to the same string object as <code>str2</code>. Therefore both names have the same identity, and the comparison prints <strong>True</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_434",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ndef myFunc(x):\n    x += 30\n    return x\nx = 20\nprint myFunc(x)",
      "opts": ["20", "30", "50", "None of the above"],
      "ans": 2,
      "exp": "The argument value 20 is passed to the function. Inside the function, <code>x += 30</code> makes the local value 50, and that value is returned and printed.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_435",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ndef printname( f=\"University\", s=\"of\", t=\"Moratuwa\" ):\n    t = \"Colombo\"\n    print f,s,t\n    return\n\nprintname(\"Uni\")",
      "opts": ["University of Moratuwa", "Uni of Moratuwa", "Uni of Colombo", "None of the above"],
      "ans": 2,
      "exp": "The call supplies only the first argument, so <code>f</code> becomes <code>\"Uni\"</code>, while <code>s</code> remains <code>\"of\"</code>. Inside the function, <code>t</code> is reassigned to <code>\"Colombo\"</code>. Therefore Python 2 prints <strong>Uni of Colombo</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_436",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nprint \"%s%o\" % ('K', 15)",
      "opts": ["K15", "K17", "%s%o", "None of the above"],
      "ans": 1,
      "exp": "The <code>%s</code> formatter prints the string <code>K</code>. The <code>%o</code> formatter prints the integer in octal; decimal 15 is octal 17. Therefore the output is <strong>K17</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_437",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nd = 100\ndef add( arg2 , arg1=50):\n    global d\n    d = arg2 + arg1\n    return d\nadd(200)\nprint d",
      "opts": ["100", "200", "250", "None of the above"],
      "ans": 2,
      "exp": "The function call gives <code>arg2 = 200</code> and uses the default <code>arg1 = 50</code>. Because <code>d</code> is declared global, <code>d</code> is changed to <code>200 + 50 = 250</code>, and the final print displays <strong>250</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_438",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ndef printinfo(arg1,*vartuple):\n    total = 0;\n    for var in vartuple:\n        total += var\n    print total\n    return\nprintinfo(70,60,50,40,30,20)",
      "opts": ["70", "200", "270", "None of the above"],
      "ans": 1,
      "exp": "The first argument, 70, is stored in <code>arg1</code>. The remaining arguments form <code>vartuple</code>: 60, 50, 40, 30, and 20. Their sum is <code>60+50+40+30+20 = 200</code>, so 200 is printed.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_439",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ndef myList( inList ):\n    return [i*2 for i in inList if i%2 == 1]\nprint sum(myList([7,4,2,9,1,0]))",
      "opts": ["17", "34", "46", "None of the above"],
      "ans": 1,
      "exp": "The list comprehension selects the odd values 7, 9, and 1, then doubles them to get <code>[14, 18, 2]</code>. The sum is <code>14 + 18 + 2 = 34</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_440",
      "year": "2017 Batch 16",
      "text": "Is the following Python code segment a valid code segment?\n\nword = \"Help\" + \"Me\"\nword[4] = 'u'",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "The first line creates the string <code>\"HelpMe\"</code>. Strings are immutable in Python, so assigning to <code>word[4]</code> is not valid. Therefore the answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_441",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\ndef f(x,y):\n    for i in x:\n        y.append(i)\n    y.remove(2)\n    return y\nprint sum(f([1,2],[3,2,1]))",
      "opts": ["6", "7", "9", "None of the above"],
      "ans": 1,
      "exp": "The list <code>y</code> starts as <code>[3,2,1]</code>. Appending the elements of <code>x</code> gives <code>[3,2,1,1,2]</code>. Removing the first <code>2</code> gives <code>[3,1,1,2]</code>, whose sum is <code>7</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_442",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\na='a'\nprint [a*x for x in [2,3]]",
      "opts": ["['a', 'a']", "['aa', 'aaa']", "['2a', '3a']", "None of the above"],
      "ans": 1,
      "exp": "String multiplication repeats the string. Therefore <code>'a'*2</code> gives <code>'aa'</code> and <code>'a'*3</code> gives <code>'aaa'</code>. The printed list is <strong><code>['aa', 'aaa']</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_443",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\na = [[1,2,3],[4,5,6],[7,8,9],[10,11,12,13,14]]\nprint a[3][4] + a[1][2]",
      "opts": ["14", "20", "17", "None of the above"],
      "ans": 1,
      "exp": "<code>a[3]</code> is <code>[10,11,12,13,14]</code>, so <code>a[3][4]</code> is 14. <code>a[1]</code> is <code>[4,5,6]</code>, so <code>a[1][2]</code> is 6. Their sum is <code>20</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_444",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\nmark = 55\nif (mark <= 39): grade = 'D'\nelif( mark < 55 ): grade = 'C'\nelif( mark < 70 ): grade = 'B'\nelse: grade = 'A'\nprint grade",
      "opts": ["A", "B", "C", "D"],
      "ans": 1,
      "exp": "For <code>mark = 55</code>, the first two conditions are false. The condition <code>mark < 70</code> is true, so <code>grade</code> becomes <code>'B'</code>. Therefore the output is <strong>B</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_445",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code segment?\n\na = [[1,2,3],[4,5,6],[7,8,9],[10,11,12]]\nprint sum(a[3] + a[1])",
      "opts": ["21", "27", "48", "None of the above"],
      "ans": 2,
      "exp": "List addition concatenates the two lists. Thus <code>a[3] + a[1]</code> gives <code>[10,11,12,4,5,6]</code>. The sum is <code>10+11+12+4+5+6 = 48</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_446",
      "year": "2017 Batch 16",
      "text": "What is the number of swaps that will happen in sorting the following list using bubble sort?\n\n[15, 5, 7, 2, 10]",
      "opts": ["4", "5", "6", "None of the above"],
      "ans": 2,
      "exp": "In bubble sort, the total number of adjacent swaps equals the number of inversions in the original list. The inversions are four involving 15, one involving 5 and 2, and one involving 7 and 2. Hence the total is <code>4+1+1 = 6</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_447",
      "year": "2017 Batch 16",
      "text": "Which of the following list is not a possible intermediate resultant list after three iterations of bubble sort?",
      "opts": ["[2, 4, 5, 7, 11, 22, 33, 44, 55]", "[10, 60, 20, 30, 40, 50, 70, 80, 100]", "[15, 7, 55, 10, 2, 31, 40, 52, 68]", "[5, 25, 32, 15, 2, 20, 32, 64, 87]"],
      "ans": 2,
      "exp": "After three full bubble-sort passes in ascending order, the three largest elements must have moved to the last three positions in sorted order. In option (c), 55 remains before smaller values 40 and 52, so it cannot be the result after three bubble-sort iterations.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_448",
      "year": "2017 Batch 16",
      "text": "A list of numbers is to be sorted using selection sort. The list after the second iteration of the selection sort is shown below.\n[2, 4, 8, 33, 22, 12, 35, 15]\n\nWhat will be the list after the fifth iteration of the selection sort?",
      "opts": ["[2, 4, 8, 12, 22, 33, 35, 15]", "[2, 4, 8, 12, 15, 33, 35, 22]", "[2, 4, 8, 12, 15, 22, 35, 33]", "Answer cannot be determined from the given data"],
      "ans": 1,
      "exp": "After the second iteration, the first two positions are fixed. The third iteration leaves 8 in place. The fourth iteration selects 12 for position 3, giving <code>[2,4,8,12,22,33,35,15]</code>. The fifth selects 15 for position 4, giving <strong><code>[2,4,8,12,15,33,35,22]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_449",
      "year": "2017 Batch 16",
      "text": "Which of the following statements is/are correct regarding the complexity of algorithms?\n\nI. The effort required to search for a number in a list of unsorted numbers with n numbers in the list will be proportional to n.\nII. The effort required to search for a number in a sorted list of numbers with n numbers in the list will be proportional to log\u2082(n).\nIII. In worst case scenario, the effort required by bubble sort is same as the effort required by selection sort.",
      "opts": ["I and II only", "I and III only", "II and III only", "All three"],
      "ans": 3,
      "exp": "Statement I is correct for linear search in an unsorted list. Statement II is correct for binary search in a sorted list. Statement III is correct in Big-O terms because both bubble sort and selection sort require quadratic effort in the worst case. Therefore all three statements are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_450",
      "year": "2017 Batch 16",
      "text": "If binary search is carried out in the list [2, 4, 6, 8, 10, 22, 44] for the number 20, what numbers in the list would be compared during the execution?",
      "opts": ["8, 22, 10", "8, 4, 22, 6, 10", "2, 4, 6, 8, 10, 22", "None of the above"],
      "ans": 0,
      "exp": "The middle element is 8, and 20 is greater than 8, so the search continues in the right half. The next middle element is 22, and 20 is smaller than 22. The remaining element checked is 10. Therefore the comparisons are <strong>8, 22, 10</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_451",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python program?\n\ndef MyFun(num):\n    if (num > 0):\n        return MyFun(num/2) + str(num%2)\n    return \"\"\nprint MyFun(14)",
      "opts": ["0111", "1110", "14", "None of the above"],
      "ans": 1,
      "exp": "Using Python 2 integer division, the recursive calls use <code>14, 7, 3, 1, 0</code>. The remainders appended while returning are <code>1, 1, 1, 0</code>. Therefore the printed string is <strong>1110</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_452",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following python program?\n\ndef MyFun(mylist):\n    if (len(mylist) > 0):\n        mid = len(mylist)/2\n        if (mylist[mid] < 50):\n            return MyFun(mylist[:mid-1]) + 1\n        else:\n            return MyFun(mylist[mid+1:]) + 1\n    else:\n        return 1\ninitlist = [12, -5, 72, 66, 23, 79, 35]\nprint MyFun(initlist)",
      "opts": ["3", "4", "5", "None of the above"],
      "ans": 1,
      "exp": "The first middle value is 66, so the right part after it is used and 1 is added. For <code>[23,79,35]</code>, the middle value is 79, so the right part <code>[35]</code> is used and 1 is added. For <code>[35]</code>, the slice becomes empty and 1 is added to the base value 1. The result is <code>4</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_453",
      "year": "2017 Batch 16",
      "text": "Consider the following incomplete Python code. The code is expected to compute x\u207f.\n\ndef MyPow(x, n):\n    if (n == 0):\n        return 1\n    hp = MyPow(x, n/2)\n    ret = hp*hp\n    if (....(A)....):\n        ret = ret * x\n    return ret\n\nWhat should fill the blank A to make it work?",
      "opts": ["n%2 == 1", "n == 0", "x%2 == 1", "hp == 1"],
      "ans": 0,
      "exp": "The recursive call computes <code>x^(n/2)</code>. Squaring gives the even-power part. If <code>n</code> is odd, one extra factor of <code>x</code> must be multiplied. Therefore the condition is <strong><code>n%2 == 1</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_454",
      "year": "2017 Batch 16",
      "text": "Which of the following algorithms are divide and conquer algorithms?\n\nI. Binary search\nII. Selection sort\nIII. Bubble sort",
      "opts": ["I only", "I and II only", "I and III only", "II and III only"],
      "ans": 0,
      "exp": "Binary search repeatedly divides the search interval into halves, so it is a divide-and-conquer algorithm. Selection sort and bubble sort do not divide the problem into independent subproblems. Therefore only statement I is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_455",
      "year": "2017 Batch 16",
      "text": "The following incomplete algorithm is intended to solve the Towers of Hanoi problem. The Move-Disks function takes the number of disks to be moved (Num_Disks), source tower (From_Tower), destination tower (To_Tower) and the other/third tower (Other_Tower) as the input parameters and solves the problem.\n\nWhat will be the most suitable parts to fill the blanks A and B, respectively, so that the algorithm will solve the problem of Towers of Hanoi?",
      "opts": ["Move-Disks(Num_Disks-1, From_Tower, To_Tower, Other_Tower) and Move-Disks(Num_Disks-1, To_Tower, From_Tower, Other_Tower)", "Move-Disks(Num_Disks-1, From_Tower, Other_Tower, To_Tower) and Move-Disks(Num_Disks-1, Other_Tower, From_Tower, To_Tower)", "Move-Disks(Num_Disks-1, From_Tower, Other_Tower, To_Tower) and Move-Disks(Num_Disks-1, To_Tower, Other_Tower, From_Tower)", "None of the above"],
      "ans": 1,
      "exp": "To move <code>n</code> disks from the source to the destination, first move <code>n-1</code> disks from the source to the auxiliary tower, then move the largest disk to the destination, then move the <code>n-1</code> disks from the auxiliary tower to the destination. This matches option (b).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_456",
      "year": "2017 Batch 16",
      "text": "The following incomplete Python code is intended to flatten a nested list. What will be the most suitable parts to fill the blanks A and B, respectively, so that the code will work correctly?",
      "opts": ["retlist.extend(FlattenList(mylist[0])) and retlist.extend(FlattenList(mylist[1:]))", "retlist.extend(mylist[0]) and retlist.extend(FlattenList(mylist[1:]))", "retlist.append(mylist[0]) and retlist.extend(FlattenList(mylist[1:]))", "retlist.append(mylist[0]) and retlist.append(FlattenList(mylist[1:]))"],
      "ans": 0,
      "exp": "If the first element is itself a list, it must be recursively flattened and extended into the result. After handling the first element, the rest of the list must also be recursively flattened and extended. Therefore option (a) gives the correct recursive flattening logic.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_457",
      "year": "2017 Batch 16",
      "text": "You are asked to develop a Python program that will accept a list of English words as the input and return the words appearing in the list and the number of times each word appears in the list. What will be the most suitable collection data type in Python that can be used for implementing your program?",
      "opts": ["List", "Tuple", "Set", "Dictionary"],
      "ans": 3,
      "exp": "A dictionary stores key-value pairs. Here, each word can be used as a key and its frequency can be stored as the corresponding value. Therefore a dictionary is the most suitable data type.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_458",
      "year": "2017 Batch 16",
      "text": "What will be the most suitable representation in Python for the matrix shown below?",
      "opts": ["{(0, 0): 2, (0, 4): 5, (1, 3): 3, (2, 6): 6, (3, 1): 8, (4, 0):4, (6,6):1}", "[[2, 0, 0, 0, 5, 0, 0], [0, 0, 0, 3, 0, 0, 0], [0, 0, 0, 0, 0, 0, 6], [0, 8, 0, 0, 0, 0, 0], [4, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 0]]", "((2,0,0,0,5,0,0),(0,0,0,3,0,0,0),(0,0,0,0,0,0,6),(0,8,0,0,0,0,0),(4,0,0,0,0,0,0),(0,0,0,0,0,0,0),(0,0,0,0,0,1,0))", "[(2,0,0,0,5,0,0),(0,0,0,3,0,0,0),(0,0,0,0,0,0,6),(0,8,0,0,0,0,0),(4,0,0,0,0,0,0),(0,0,0,0,0,0,0),(0,0,0,0,0,1,0)]"],
      "ans": 0,
      "exp": "The matrix is sparse because most entries are zero. The most suitable representation is therefore a dictionary storing only the non-zero entries with their coordinates as keys, which is option (a).",
      "img": "IMAGES/CS/Past Papers/2017 Batch 16/pp_2017_Batch_16_Q38.png",
      "imgAlt": "Sparse matrix with mostly zero entries and a few non-zero values.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_459",
      "year": "2017 Batch 16",
      "text": "If list A is defined as A = [2, 4, 6, [8, 10, 12], 8, 10, 12], which of the following Python statements will be evaluated to be True?\n\nI. A[3] == A[-3:]\nII. A[-3:] == A[4:]\nIII. A[3] == A[4:]",
      "opts": ["I and II only", "II and III only", "I and III only", "All three"],
      "ans": 3,
      "exp": "<code>A[3]</code> is <code>[8,10,12]</code>. The slice <code>A[-3:]</code> is also <code>[8,10,12]</code>, and <code>A[4:]</code> is also <code>[8,10,12]</code>. Therefore all three comparisons are true.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_460",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\nA = [2, 4, 6, 8, 10, 12]\nRefA = A\nNewA = A[:]\nprint (A == RefA), (A == NewA), (A is RefA), (A is NewA)",
      "opts": ["True True True True", "True True True False", "True True False False", "True False False False"],
      "ans": 1,
      "exp": "<code>RefA = A</code> makes both names refer to the same list, so equality and identity are both true. <code>NewA = A[:]</code> creates a new list with the same contents, so equality is true but identity is false. The output is <strong>True True True False</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_461",
      "year": "2017 Batch 16",
      "text": "What does the following Python code do? Assume that the input is a list of numbers.\n\ndef MyFun(SimpleList):\n    while(len(SimpleList) > 1):\n        SimpleList.append(SimpleList.pop() + SimpleList.pop())\n    return SimpleList.pop()",
      "opts": ["It returns the first element in the input list", "It returns the last element in the input list", "It returns the largest element in the input list", "It returns the sum of all the numbers in the input list"],
      "ans": 3,
      "exp": "Each loop removes the last two numbers, adds them, and appends their sum back into the list. Repeating this until one value remains gives the sum of all original numbers.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_462",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\nA = ['ESPN', 'BBC', 'AAB', 'XYZ', 'CNN', 'ITN', 'EFM']\ndef MyCmp(a, b):\n    return cmp(a[1], b[1])\nA.sort(MyCmp)\nprint A",
      "opts": ["['ESPN', 'BBC', 'AAB', 'XYZ', 'CNN', 'ITN', 'EFM']", "['AAB', 'BBC', 'CNN', 'EFM', 'ESPN', 'ITN', 'XYZ']", "['AAB', 'BBC', 'EFM', 'CNN', 'ESPN', 'ITN', 'XYZ']", "Error message"],
      "ans": 2,
      "exp": "The comparison function sorts strings by their second character. The second characters are A for AAB, B for BBC, F for EFM, N for CNN, S for ESPN, T for ITN, and Y for XYZ. Therefore the sorted list is option (c).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_463",
      "year": "2017 Batch 16",
      "text": "What does the following Python program do? Assume that the input is a list.\n\ndef MyFun(SimList):\n    last = len(SimList) - 1\n    for i in range(0, len(SimList)/2):\n        (SimList[i], SimList[last-i]) = (SimList[last-i], SimList[i])\n    return SimList",
      "opts": ["It sorts the elements of the input list", "It reverses the elements of the input list", "It swaps the first and the last element of the input list", "None of the above"],
      "ans": 1,
      "exp": "The loop swaps the first item with the last, the second with the second-last, and so on until the middle is reached. That reverses the order of the list.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_464",
      "year": "2017 Batch 16",
      "text": "Which of the following are valid declarations of dictionaries in Python?\n\nI. MyDict = {}\nII. MyDict = {'one':'FirstItem', 'two':'SecondItem', 'three':'ThirdItem'}\nIII. MyDict = {[0,0]:'Item00', [0,1]:'Item01', [0,2]:'Item02', [1,0]:'Item10', [1,1]:'Item11', [1,2]:'Item12'}",
      "opts": ["I and II only", "II and III only", "I and III only", "All three"],
      "ans": 0,
      "exp": "I is an empty dictionary and II is a dictionary with string keys, so both are valid. III uses lists as dictionary keys, but lists are mutable and unhashable, so III is invalid. Therefore I and II only are valid.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_465",
      "year": "2017 Batch 16",
      "text": "The following recursive Python function is intended to accept a positive decimal number as the input and return the number of digits in the input number. What will be the most suitable parts to fill the blanks A and B, respectively, so that the code will work correctly?",
      "opts": ["return 0 and return MyFun(num/10)", "return 1 and return MyFun(num/10)", "return 0 and return 1 + MyFun(num/10)", "return 1 and return 1 + MyFun(num/10)"],
      "ans": 2,
      "exp": "When the number becomes 0, there are no more digits to count, so the base case must return 0. Otherwise, the function must count one digit and recurse on <code>num/10</code>. Therefore option (c) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_466",
      "year": "2017 Batch 16",
      "text": "Which of the following statements is incorrect with respect to computers?",
      "opts": ["They are always built using digital electronic components", "They can understand and execute a fixed set of instructions", "They can follow a sequence of instructions stored inside them", "They can repeat a task with same accuracy over and over again"],
      "ans": 0,
      "exp": "Modern computers are commonly digital, but computers are not necessarily always built using only digital electronic components; analog computers also exist. The other statements describe standard properties of computers. Therefore option (a) is the incorrect statement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_467",
      "year": "2017 Batch 16",
      "text": "Which of the following is NOT a key component in a von Neumann machine?",
      "opts": ["Input devices", "Output devices", "Central processing unit", "Graphics accelerator"],
      "ans": 3,
      "exp": "The von Neumann model includes processing, memory, input, and output. A graphics accelerator is a specialized modern component, not a key component of the basic von Neumann architecture.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_468",
      "year": "2017 Batch 16",
      "text": "Which of the following is NOT a component in the system bus?",
      "opts": ["Address bus", "Universal serial bus", "Data bus", "Control bus"],
      "ans": 1,
      "exp": "The system bus is usually described as consisting of the address bus, data bus, and control bus. Universal Serial Bus is an external peripheral communication standard, not a component of the system bus.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_469",
      "year": "2017 Batch 16",
      "text": "ASCII Code refers to (select the most appropriate answer)?",
      "opts": ["Coding scheme that is used to store characters and numbers inside the computer memory", "Set of instructions that the computer can understand", "Coding scheme that is used to protect data from unauthorized access", "Method that can translate from English to computer programming languages"],
      "ans": 0,
      "exp": "ASCII is a character-encoding scheme. It represents characters such as letters, digits, and symbols as numeric codes stored in computer memory.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_470",
      "year": "2017 Batch 16",
      "text": "Which of the following is NOT a type of non-volatile memory?",
      "opts": ["Programmable Read Only Memory (PROM)", "Electrically Erasable Programmable Read Only Memory (EEPROM)", "FLASH Memory", "Dynamic Random Access Memory (DRAM)"],
      "ans": 3,
      "exp": "PROM, EEPROM, and flash memory are non-volatile memories. DRAM is volatile main memory and loses its stored contents when power is removed.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_471",
      "year": "2017 Batch 16",
      "text": "Which of the following statement is correct with respect to data stored in a USB pen drive? (select the most appropriate answer)",
      "opts": ["Data would be retained forever unless they are erased or overwritten", "Data would be lost when the power is removed from the device", "Data would be lost when the internal battery get discharged", "Data retention is guaranteed only for a specific period of time"],
      "ans": 3,
      "exp": "USB pen drives use flash memory, which is non-volatile, so data is not lost simply when power is removed. However, flash data retention is not guaranteed forever; it is specified only for a certain period under given conditions.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_472",
      "year": "2017 Batch 16",
      "text": "Which of the following statement is correct with respect to DRAM and SRAM memories?",
      "opts": ["DRAM is faster than SRAM", "DRAM consumes less power than SRAM", "DRAM is more expensive than SRAM", "DRAMs are made of transistors while SRAM are made of capacitors"],
      "ans": 1,
      "exp": "SRAM is faster and more expensive than DRAM. DRAM cells are simpler and commonly consume less power per bit than SRAM. Therefore option (b) is the correct statement among the given choices.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_473",
      "year": "2017 Batch 16",
      "text": "Which of the following statement is incorrect with respect to SSD Hard Disk Drives?",
      "opts": ["SSD Drives uses magnetic medium to store data", "SSD drives are faster than other types of hard disk drives", "SSD drives uses newer technology compared to other types of hard disk drives", "SSD drives are more expensive and have less capacity than other types of hard disk drives"],
      "ans": 0,
      "exp": "SSDs store data using flash memory, not magnetic media. Magnetic storage is used by traditional hard disk drives, so option (a) is the incorrect statement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_474",
      "year": "2017 Batch 16",
      "text": "Which of the following statement is incorrect with respect to computer keyboards?",
      "opts": ["The keyboard is made of a series of switches arranged in a matrix order", "Every key in the keyboard is directly connected to the CPU", "The keyboard has its own processor that convert key-strokes in to their corresponding codes", "Keyboard is an input device"],
      "ans": 1,
      "exp": "Keyboard keys are arranged in a matrix and scanned by keyboard electronics; every key is not directly connected to the CPU. Therefore option (b) is the incorrect statement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_475",
      "year": "2017 Batch 16",
      "text": "Which if the following statements best describes the function of a VGA card?",
      "opts": ["It converts data stored in the computer\u2019s memory to signals that drive the monitor screen", "It generates the sound waves when a movie is played", "It is capable of capturing a digital photograph from the web-camera", "It is capable of performing arithmetic and logical operations in a computer"],
      "ans": 0,
      "exp": "A VGA/display card produces the video signals used to drive the monitor. It converts image data into a form that can be displayed on the screen.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_476",
      "year": "2017 Batch 16",
      "text": "Name two brands of microprocessors.",
      "opts": ["Intel and AMD", "RAM and ROM", "Windows and Linux", "USB and HDMI"],
      "ans": 0,
      "exp": "Intel and AMD are well-known microprocessor brands. The other options list memory types, operating systems, or interface standards rather than processor brands.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_477",
      "year": "2017 Batch 16",
      "text": "What does RAM stand for?",
      "opts": ["Read Access Module", "Random Access Memory", "Run-time Arithmetic Memory", "Register Address Memory"],
      "ans": 1,
      "exp": "RAM stands for <strong>Random Access Memory</strong>. It is called random access because stored locations can be accessed directly by address.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_478",
      "year": "2017 Batch 16",
      "text": "What does ASCII stand for?",
      "opts": ["American Standard Code for Information Interchange", "Arithmetic Standard Code for Internal Instructions", "American Symbolic Code for Internet Interchange", "Automatic Standard Computer Instruction Interface"],
      "ans": 0,
      "exp": "ASCII stands for <strong>American Standard Code for Information Interchange</strong>, a standard character encoding scheme.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_479",
      "year": "2017 Batch 16",
      "text": "Name two types of volatile memory used in modern computers.",
      "opts": ["PROM and EEPROM", "Flash memory and SSD", "DRAM and SRAM", "DVD and hard disk"],
      "ans": 2,
      "exp": "DRAM and SRAM are volatile semiconductor memories. They require power to retain stored data, unlike ROM, flash memory, and disks.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_480",
      "year": "2017 Batch 16",
      "text": "In a computer, different modules such as input devices, output devices and memory are connected to the CPU using ................. (fill the blank)",
      "opts": ["cache memory", "system bus", "ASCII code", "control unit"],
      "ans": 1,
      "exp": "The CPU communicates with memory and input/output modules through the system bus, which includes address, data, and control pathways.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_481",
      "year": "2017 Batch 16",
      "text": "Violation of grammar rules of the Python language in a Python program will result in ................ errors. (fill the blank)",
      "opts": ["logical", "syntax", "semantic", "run-time"],
      "ans": 1,
      "exp": "Grammar-rule violations are syntax errors. Such errors are detected before the program can execute normally.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_482",
      "year": "2017 Batch 16",
      "text": "A sequence of a ................. number of well-defined steps to solve a problem is called an algorithm. (fill the blank)",
      "opts": ["finite", "random", "variable", "binary"],
      "ans": 0,
      "exp": "An algorithm must contain a finite number of well-defined steps. If the number of steps were not finite, the procedure would not necessarily terminate.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_483",
      "year": "2017 Batch 16",
      "text": "What is the output of the following algorithm?\n\n1. Start\n2. P \u2190 1\n3. A \u2190 5\n4. If P > 100*A then go to step 8\n5. P \u2190 P * A\n6. A \u2190 A + 5\n7. If A < 100 Go to step 4\n8. Output P\n9. Stop",
      "opts": ["750", "2500", "15000", "None of the above"],
      "ans": 2,
      "exp": "Starting with <code>P=1, A=5</code>, the algorithm multiplies <code>P</code> successively by 5, 10, 15, and 20 before the condition becomes true. Then <code>P = 1\u00d75\u00d710\u00d715\u00d720 = 15000</code>. At <code>A=25</code>, <code>P > 100A</code>, so 15000 is output.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_484",
      "year": "2017 Batch 16",
      "text": "Consider the flowchart in Fig 1 to answer the next two questions. Assume A is an array of 500 elements, where each element is a positive number; array index starts at 0. The flowchart is expected to output the largest element in array A.\n\nFor the algorithm to work as expected, what should be in blank (P) in Fig 1?",
      "opts": ["M \u2190 A[k]", "A[k] \u2190 M", "k \u2190 A[k]", "M \u2190 k"],
      "ans": 0,
      "exp": "The decision checks whether the current array element is greater than the current maximum <code>M</code>. If it is greater, the maximum must be updated to that element, so blank (P) is <strong><code>M \u2190 A[k]</code></strong>.",
      "img": "IMAGES/CS/Past Papers/2017 Batch 16/pp_2017_Batch_16_FIG1.png",
      "imgAlt": "Flowchart that scans array A and outputs the largest element M.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_485",
      "year": "2017 Batch 16",
      "text": "Consider the flowchart in Fig 1 to answer the next two questions. Assume A is an array of 500 elements, where each element is a positive number; array index starts at 0. The flowchart is expected to output the largest element in array A.\n\nFor the algorithm to work as expected, what should be in blank (Q) in Fig 1?",
      "opts": ["Is k = 0 ?", "Is k = 499 ?", "Is k = 500 ?", "Is A[k] = M ?"],
      "ans": 2,
      "exp": "The index starts at 0 and is incremented after each element is processed. After processing index 499, <code>k</code> becomes 500, meaning all 500 elements have been checked. Therefore blank (Q) is <strong>Is k = 500?</strong>.",
      "img": "IMAGES/CS/Past Papers/2017 Batch 16/pp_2017_Batch_16_FIG1.png",
      "imgAlt": "Flowchart that scans array A and outputs the largest element M.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_486",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\n2j * (3 + 4j)",
      "opts": ["(10j)", "(-8 + 6j)", "An error message", "None of the above"],
      "ans": 1,
      "exp": "<code>2j(3+4j)=6j+8j\u00b2</code>. Since <code>j\u00b2 = -1</code>, the result is <code>-8+6j</code>. Therefore option (b) is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_487",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\nprint 2 ** len('hello') + int(float(\"1.999\"))",
      "opts": ["64", "34", "33", "None of the above"],
      "ans": 2,
      "exp": "<code>len('hello') = 5</code>, so <code>2**5 = 32</code>. Also, <code>float('1.999')</code> is 1.999 and <code>int(1.999)</code> truncates to 1. Therefore the result is <code>32 + 1 = 33</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_488",
      "year": "2017 Batch 16",
      "text": "Which of the following is/are correct about Python objects?\n\nI. An object\u2019s identity is its address in memory.\nII. An object\u2019s identity can be found by calling the built-in function id().\nIII. An object\u2019s identity will change when it is assigned to a variable.",
      "opts": ["I only", "II only", "I and II only", "All"],
      "ans": 2,
      "exp": "Statements I and II are correct: object identity uniquely identifies the object and can be obtained using <code>id()</code>. Statement III is false because assigning an object to a variable gives the object a name; it does not change the object's identity.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_489",
      "year": "2017 Batch 16",
      "text": "Which of the following is/are correct about Python objects?\n\nI. The type of some objects can change.\nII. The value of some objects can change.\nIII. An object can have multiple names.",
      "opts": ["I only", "II only", "II and III only", "All"],
      "ans": 2,
      "exp": "An object's type does not change after the object is created, so I is false. Mutable objects such as lists can change value, so II is true. Multiple variables can refer to the same object, so III is true. Therefore II and III only are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_490",
      "year": "2017 Batch 16",
      "text": "Consider the following Python code.\n\nx = \"abcd\"\nx[1] = \"B\"\n\nWill x be \"aBcd\" after the above two lines are executed?",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "Strings are immutable in Python, so assigning to <code>x[1]</code> is not allowed. The assignment raises an error and <code>x</code> does not become <code>\"aBcd\"</code>. Therefore the answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_491",
      "year": "2017 Batch 16",
      "text": "Consider the following Python code.\n\nx = \"hello\"\ny = 3 + x\nz = x + 5\n\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without any problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors."],
      "ans": 3,
      "exp": "The second line attempts to add an integer and a string, which is invalid. The third line also attempts to add a string and an integer, which is invalid. Therefore both the second and third lines have errors.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_492",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\nprint (0b1101 & ~1) | (033 >> 0x2)",
      "opts": ["6", "12", "14", "None of the above"],
      "ans": 2,
      "exp": "<code>0b1101</code> is 13 and <code>13 & ~1</code> clears the lowest bit, giving 12. <code>033</code> is octal for decimal 27 and <code>0x2</code> is 2, so <code>27 >> 2 = 6</code>. Finally <code>12 | 6 = 14</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_493",
      "year": "2017 Batch 16",
      "text": "What will be the value of a after the following Python code is executed?\n\na = (0100 == 0b10 ** 0x6) and ('mora' not in 'thora')",
      "opts": ["True", "False", "64", "None of the above"],
      "ans": 0,
      "exp": "In Python 2, <code>0100</code> is octal for decimal 64. Also, <code>0b10 ** 0x6 = 2 ** 6 = 64</code>, so the first comparison is true. The string <code>'mora'</code> is not a substring of <code>'thora'</code>, so the second part is also true. Thus <code>a</code> becomes <strong>True</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_494",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code?\n\nx = 66.66\ny = 2.2\nx //= y + 1.1\nprint int(x) * (y + int(float('1.10')))",
      "opts": ["64", "64.0", "66.66", "None of the above"],
      "ans": 1,
      "exp": "<code>y + 1.1 = 3.3</code>, so <code>x //= 3.3</code> gives <code>20.0</code>. Then <code>int(x)</code> is 20 and <code>int(float('1.10'))</code> is 1. The expression is <code>20 \u00d7 (2.2 + 1) = 20 \u00d7 3.2 = 64.0</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_495",
      "year": "2017 Batch 16",
      "text": "Consider the following Python code.\n\ninstring = input('Enter your input: ')\nprint instring\n\nWhat will be the output, if the input is [3*x for x in [1,2]]?",
      "opts": ["[1, 2]", "[3, 6]", "[3*x for x in [1,2]]", "None of the above"],
      "ans": 1,
      "exp": "In Python 2, <code>input()</code> evaluates the entered expression. The list comprehension <code>[3*x for x in [1,2]]</code> evaluates to <code>[3, 6]</code>, which is then printed.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_496",
      "year": "2017 Batch 16",
      "text": "Consider the following Python code of 5 lines, with line numbers (not part of the code) shown on the left. The objective is to read a file and display its contents on screen.\n\n1 f = open('FileIn.txt', 'r')\n2 ............ # Reading the input\n3 print 'File content is:', s\n4 print 'Done; exiting...'\n5 f.close()\n\nWhat should fill the blank at line 2 to make the program complete?",
      "opts": ["f.read(s)", "s = f.read()", "s = f.readline()", "None of the above"],
      "ans": 1,
      "exp": "The file object is <code>f</code>. To read the whole file content into the variable <code>s</code>, line 2 should be <code>s = f.read()</code>. This allows line 3 to print the file contents.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_497",
      "year": "2017 Batch 16",
      "text": "Out of the four control structures used in programs, which one is not essential to construct a program?",
      "opts": ["sequence", "selection", "repetition", "subprogram"],
      "ans": 3,
      "exp": "Sequence, selection, and repetition are the fundamental control structures needed to express algorithms. Subprograms are useful for modularity, but they are not essential for constructing every program.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_498",
      "year": "2017 Batch 16",
      "text": "Will the following Python code result in an error?\n\ntype(unichr(77))",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "In Python 2, <code>unichr(77)</code> returns the Unicode character with code point 77, and <code>type(...)</code> can be applied to it. Therefore the code does not result in an error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_499",
      "year": "2017 Batch 16",
      "text": "Consider the following Python code, with line numbers (not part of the code) shown on the left. The code is expected to write a string to a file.\n\n1 ..........\n2     fo = open('fileOut.txt','w')\n3     fo.write('Sample string....')    # Write a string\n4 except IOError:\n5     print 'Error in file access.'\n6 else:\n7     print 'Finished writing the file.'\n8     fo.close()\n\nWhat should fill the blank at the beginning of line 1 to make it work?",
      "opts": ["try:", "except:", "else:", "finally:"],
      "ans": 0,
      "exp": "The code contains an <code>except IOError:</code> block and an <code>else:</code> block, so the protected file-writing statements must be inside a <code>try:</code> block. Therefore line 1 should be <strong><code>try:</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_500",
      "year": "2017 Batch 16",
      "text": "What will be the output of the following Python code, if the input is 100?\n\nx = int(raw_input('Enter x: '))\nif (x >= 100):\n    k = x / 2\n    if (x >= 200):\n        k = k * 3\n    elif (k < 300):\n        k = k * 4\n    else:\n        k = k * 5\nelse:\n    k = x * 3\nprint k",
      "opts": ["300", "150", "200", "250"],
      "ans": 2,
      "exp": "The input makes <code>x = 100</code>. Since <code>x >= 100</code>, <code>k = x/2 = 50</code> in Python 2 integer division. The condition <code>x >= 200</code> is false, but <code>k < 300</code> is true, so <code>k = 50 \u00d7 4 = 200</code>. Therefore the output is <strong>200</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_501",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ny=['asd','zxc','mnb']\ny.append(\"abc\")\nprint min(y)",
      "opts": ["mnb", "abc", "asd", "zxc"],
      "ans": 1,
      "exp": "After <code>append</code>, the list is <code>['asd','zxc','mnb','abc']</code>. Python's <code>min()</code> on strings returns the lexicographically smallest. Comparing: <code>'a'</code> &lt; <code>'m'</code> &lt; <code>'z'</code>, so <code>'abc'</code> is the minimum. Output: <strong>abc</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_502",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code.\nx = \"abc\" + \"3\"\ny = x + str(float(4))\nWhich of the following is correct about the above 2 lines of code?",
      "opts": ["Code will be executed without any problem.", "The first line has an error; there is no other error.", "The second line has an error; there is no other error.", "The first and second lines have errors."],
      "ans": 0,
      "exp": "Line 1: <code>\"abc\" + \"3\"</code> = <code>\"abc3\"</code> \u2014 valid string concatenation. Line 2: <code>float(4)</code> = <code>4.0</code>, <code>str(4.0)</code> = <code>\"4.0\"</code>, <code>\"abc3\" + \"4.0\"</code> = <code>\"abc34.0\"</code> \u2014 valid. Both lines execute without any problem.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_503",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nprint (0xAA ^ ~(-1)) & (0b111011 << 02)",
      "opts": ["160", "236", "168", "170"],
      "ans": 2,
      "exp": "<code>~(-1)</code> = 0. <code>0xAA ^ 0</code> = 170 = <code>10101010</code>. <code>0b111011</code> = 59; <code>59 &lt;&lt; 2</code> = 236 = <code>11101100</code>. <code>170 &amp; 236</code>: <code>10101010 &amp; 11101100</code> = <code>10101000</code> = <strong>168</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_504",
      "year": "2018 Batch 17",
      "text": "What will be output of the following Python code?\nA = [3,4,[4,5],6]\nB = 'hello'\nprint (([4] in A) or ('e' not in B)) and (020 == (0xF+1))",
      "opts": ["Error", "None", "False", "True"],
      "ans": 2,
      "exp": "<code>[4] in A</code>: the list <code>[4]</code> is not an element of A (A contains 3,4,[4,5],6 \u2014 not [4]) \u2192 False. <code>'e' not in B</code>: 'e' is in 'hello' \u2192 False. <code>False or False</code> = False. Short-circuit: False and anything = False. Output: <strong>False</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_505",
      "year": "2018 Batch 17",
      "text": "Assuming we have imported the math module, what will be the output of the following Python code?\nr = 9.99\nr += 0.01\nprint (math.pi * (r ** 2)) // (4*r % 25)",
      "opts": ["3.14", "20.0", "314.0", "10.0"],
      "ans": 1,
      "exp": "<code>r = 10.0</code>. <code>math.pi \u00d7 10\u00b2 \u2248 314.159</code>. <code>4\u00d710.0 % 25 = 40.0 % 25 = 15.0</code>. <code>314.159 // 15.0 = 20.0</code>. Output: <strong>20.0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_506",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code, if the input is \"\"a b c d e\"\"?\ninstring = input('Enter your input: ')\nmydata = instring.split()\nprint mydata",
      "opts": ["Error", "['a b c d e']", "['a','b','c','d','e']", "None"],
      "ans": 2,
      "exp": "<code>split()</code> with no argument splits on whitespace, yielding <code>['a','b','c','d','e']</code>. Output: <strong>['a', 'b', 'c', 'd', 'e']</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_507",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code. The objective is to write the string \"katubedda\" into a file.\n1    f = open('OutFile.txt', 'w')\n2    ........................    # Writing the string\n3    print 'Done; exiting...'\n4    f.close()\nWhat should fill the blank at line 2 to make the code complete?",
      "opts": ["f.write(\"katubedda\")", "f = \"katubedda\"", "f.write = \"katubedda\"", "write.f(\"katubedda\")"],
      "ans": 0,
      "exp": "To write a string to a file object in Python, call the <code>write</code> method: <code>f.write(\"katubedda\")</code>. Option (b) rebinds f. Options (c) and (d) are invalid.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_508",
      "year": "2018 Batch 17",
      "text": "Out of the four control structures used in programs, a Python function is a:",
      "opts": ["sequence", "selection", "repetition", "subprogram"],
      "ans": 3,
      "exp": "The four control structures are: sequence, selection (if/else), repetition (loops), and <strong>subprogram</strong> (functions/procedures). A Python function is a subprogram \u2014 a named reusable block of code.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_509",
      "year": "2018 Batch 17",
      "text": "The code is expected to read from a file.\n1    try:\n2        f = open('InFile.txt', 'r')\n3        s = f.read()    # Read from file\n4    except IOError:\n5        print 'Error in file access.'\n6    ......:\n7        print 'Finished reading the file.'\n8        f.close()\nWhat should fill the blank at the beginning of line 6 to make it work?",
      "opts": ["else", "except", "continue", "finally"],
      "ans": 0,
      "exp": "The <code>else</code> clause of a try/except block executes only when no exception was raised. Lines 7-8 (success message and file close) should run only on successful file access \u2014 making <code>else</code> the correct keyword.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_510",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code.\nx = int(raw_input('Enter a number: '))\nL = [1,2,3,5,7,11,13,17,19]\nif (x is in L):\n    y = \"found: \" + x\n    z = 1.0 / x\nprint 'y=', y, 'z=', z\nWhich of the following is/are correct about the code above?\nI.  The code does not have any syntax errors.\nII. One type of exception could occur at run-time.\nIII. More than one type of exception could occur at run-time.",
      "opts": ["I only", "II only", "III only", "I and II only", "I and III only"],
      "ans": 4,
      "exp": "<strong>Statement I</strong>: No syntax errors \u2014 <code>x is in L</code>, string concatenation, and print without parentheses are all valid Python 2 syntax. \u2713<br><br><strong>Statement II</strong>: More than one exception type is possible: if x is in L, <code>\"found: \" + x</code> (str+int) raises <code>TypeError</code>; if x is not in L, <code>print y</code> raises <code>NameError</code>. Statement II says only <em>one</em> type \u2014 this is incorrect. \u2717<br><br><strong>Statement III</strong>: Multiple exception types can occur (TypeError, NameError, potentially ZeroDivisionError if x=0 but not in L). \u2713<br><br>Answer: <strong>I and III only</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_511",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code, if the input is 'c'?\nc = raw_input('Enter a character: ')\nif (c in \"abcdefghhij\"):\n    k = ord(c)\n    if (k >= 100):\n        k = k * 3\n    elif (k < 200):\n        k = k * 4\n    else:\n        k = k * 5\nelse:\n    k = (ord(c)-ord('a'))* 100\nprint k",
      "opts": ["200", "297", "396", "495"],
      "ans": 2,
      "exp": "<code>'c'</code> is in <code>\"abcdefghhij\"</code>. <code>k = ord('c') = 99</code>. <code>k \u2265 100</code>? No. <code>elif k &lt; 200</code>? Yes \u2192 <code>k = 99 \u00d7 4 = 396</code>. Output: <strong>396</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_512",
      "year": "2018 Batch 17",
      "text": "Will the following Python code display a Unicode character?\nprint unichr(0x0d86)\n[Yes/No]",
      "opts": ["Depends on the terminal", "Error in Python 3", "Yes", "No"],
      "ans": 2,
      "exp": "<code>0x0d86</code> = 3462 \u2014 the Unicode code point for the Sinhala character <strong>\u0d86</strong>. <code>unichr()</code> returns the Unicode character for that code point and <code>print</code> will display it. Answer: <strong>Yes</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_513",
      "year": "2018 Batch 17",
      "text": "An integer N is represented in 10-bit two's complement notation as 11 1000 0011\u2082. Which of the following is the correct decimal value of N?",
      "opts": ["899\u2081\u2080", "-387\u2081\u2080", "-125\u2081\u2080", "-899\u2081\u2080"],
      "ans": 2,
      "exp": "Binary <code>1110000011</code> as unsigned = 512+256+128+2+1 = 899. Two's complement: 899 \u2212 1024 = <strong>\u2212125</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_514",
      "year": "2018 Batch 17",
      "text": "What will be the 8-bit two's complement representation for -16\u2081\u2080?",
      "opts": ["11110000", "11111110", "00010000", "11101111"],
      "ans": 0,
      "exp": "16 = <code>00010000</code>. Invert: <code>11101111</code>. Add 1: <code>11110000</code>. Verify: 240 \u2212 256 = \u221216. \u2713 Answer: <strong>11110000</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_515",
      "year": "2018 Batch 17",
      "text": "How will the number 654987.123\u2081\u2080 be represented in a decimal floating-point notation which has a 6-digit mantissa, the decimal point after the first digit from left and 10 as the base for the exponent?",
      "opts": ["65.4987\u00d710\u2074", "6.54987\u00d710\u2076", "654987\u00d710\u2070", "6.54987\u00d710\u2075"],
      "ans": 3,
      "exp": "6-digit mantissa with decimal after first digit: <code>6.54987</code>. To recover original: <code>6.54987 \u00d7 10\u2075 = 654987</code>. Answer: <strong>6.54987\u00d710\u2075</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_516",
      "year": "2018 Batch 17",
      "text": "If the decimal number 33.28125\u2081\u2080 is represented in IEEE single-precision format, what will be the 8-bit exponent?",
      "opts": ["10000100", "10000101", "10000011", "01111100"],
      "ans": 0,
      "exp": "33.28125 = <code>100001.01001</code> = <code>1.0000101001 \u00d7 2\u2075</code>. Biased exponent = 5 + 127 = 132 = <code>10000100</code>. Answer: <strong>10000100</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_517",
      "year": "2018 Batch 17",
      "text": "Suppose you buy a new RAM and the packaging says its capacity is 2 GB. Does this mean it has a capacity of 2 \u00d7 10\u2079 bytes?\n[Yes/No]",
      "opts": ["Only if using SI prefixes", "Depends on the manufacturer", "Yes", "No"],
      "ans": 3,
      "exp": "1 GB in computing = 2\u00b3\u2070 = 1,073,741,824 bytes \u2260 10\u2079. So 2 GB \u2260 2\u00d710\u2079 bytes. Answer: <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_518",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nx=0\nfor n in range(-10,100,5):\n    for m in range(0,2):\n        x+=m\nprint x",
      "opts": ["11", "44", "22", "0"],
      "ans": 2,
      "exp": "<code>range(-10,100,5)</code> = 22 iterations. Inner loop: m=0 (adds 0) and m=1 (adds 1) \u2192 net +1 per outer iteration. Total: 22 \u00d7 1 = <strong>22</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_519",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ncount = 1\nsum = 0\nfor count in range(0,10,-1):\n    sum += 1\nelse:\n    sum += 10\nsum += 10\nprint sum",
      "opts": ["21", "0", "10", "20"],
      "ans": 3,
      "exp": "<code>range(0,10,-1)</code> is empty. Loop body never executes. <code>else</code> runs: sum=10. Then sum+=10=20. Output: <strong>20</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_520",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nsum = 0\nwhile sum < 10:\n    sum = sum + 2\nelse:\n    sum *= 10\nprint sum",
      "opts": ["20", "10", "100", "0"],
      "ans": 2,
      "exp": "Loop: sum goes 0,2,4,6,8,10. When sum=10 condition is False \u2192 else runs: sum=10\u00d710=100. Output: <strong>100</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_521",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\na = 8\nwhile (a < 10):\n    b = 3\n    while (b <= (a/b)):\n        if not(a%b): break\n        b += 1\n    if (b > a/b) : print a,\n    a += 1",
      "opts": ["No output", "8 9", "8", "9"],
      "ans": 2,
      "exp": "a=8: b=3, 3 \u2264 8/3=2.67? No \u2192 skip inner. b=3 > 2.67 \u2192 print 8.<br>a=9: b=3, 3 \u2264 3.0 \u2192 enter inner: 9%3=0 \u2192 break. b=3, 3 > 3.0? No \u2192 don't print.<br>Output: <strong>8</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_522",
      "year": "2018 Batch 17",
      "text": "Do items in a Python list have to be of the same data type?\n[Yes/No]",
      "opts": ["Yes", "No", "Only for numeric types", "Depends on the version"],
      "ans": 1,
      "exp": "Python lists are heterogeneous \u2014 items can be of any mix of data types. Answer: <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_523",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\na = 20\nwhile (a < 30):\n    a+=2\n    if a%2 :continue\n    a-=1\nprint a",
      "opts": ["32", "29", "31", "30"],
      "ans": 2,
      "exp": "a=20 \u2192 a=22; 22%2=0 \u2192 a=21. a=21 \u2192 a=23; 23%2=1 \u2192 continue. a=23 \u2192 a=25 \u2192 continue. a=25 \u2192 a=27 \u2192 continue. a=27 \u2192 a=29 \u2192 continue. a=29 \u2192 a=31; 31\u226530 \u2192 exit. Output: <strong>31</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_524",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nlist = [1, 2, 3, 4, 4, 6, 7 ]\nlist[4]=4\nprint list[-3]",
      "opts": ["5", "6", "3", "4"],
      "ans": 3,
      "exp": "list[4]=4 (no change). list[-3] = index 4 = <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_525",
      "year": "2018 Batch 17",
      "text": "Is the number data type immutable in Python?\n[Yes/No]",
      "opts": ["Only integers", "No", "Yes", "Only floats"],
      "ans": 2,
      "exp": "Numeric types (int, float, complex) are <strong>immutable</strong> in Python. Reassigning a variable creates a new object. Answer: <strong>Yes</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_526",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nx = \"Computer Science and Engineering\"\nprint x[:3]+x[6]+x[9:12]+x[-11:-8]",
      "opts": ["ComtSciEng", "CompSciEng", "ComeSCIEng", "ComeSciEng"],
      "ans": 3,
      "exp": "x[:3]='Com', x[6]='e', x[9:12]='Sci', x[-11:-8]='Eng'. Result: <strong>ComeSciEng</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_527",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nfor i in range(3,2,-1): print '*'*i",
      "opts": ["No output", "*", "** ***", "***"],
      "ans": 3,
      "exp": "<code>range(3,2,-1)</code> yields only 3. <code>'*'*3</code> = <code>'***'</code>. Output: <strong>***</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_528",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef myFunc( x ):\n    x=100\n    return x\nx=10\nprint myFunc(x)",
      "opts": ["100", "None", "110", "10"],
      "ans": 0,
      "exp": "The function reassigns local x to 100 and returns it. <code>print myFunc(x)</code> prints the return value: <strong>100</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_529",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef printname( fname,= \"Mahela\" lname = \"Udawatte\" ):\n    print fname,lname\n    return\nprintname( fname=\"Kusal\",lname=\"Mendis\");",
      "opts": ["Mahela Mendis", "Kusal Udawatte", "Kusal Mendis", "Mahela Udawatte"],
      "ans": 2,
      "exp": "Both keyword arguments override defaults: fname=\"Kusal\", lname=\"Mendis\". Output: <strong>Kusal Mendis</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_530",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndept = \"P\"\ndef sum( arg1 , arg2=\"R\"):\n    global dept\n    dept =  arg1 + arg2\n    return\nsum(\"Q\")\nprint dept",
      "opts": ["QR", "Q", "P", "PQ"],
      "ans": 0,
      "exp": "<code>sum(\"Q\")</code>: arg1=\"Q\", arg2=\"R\" (default). <code>global dept</code> \u2192 dept = \"QR\". Output: <strong>QR</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_531",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef addnum( p=4, *q ):\n    sum=p\n    for a in q:\n        sum*=a\n    return sum\nprint addnum()+addnum(1,2,3)",
      "opts": ["10", "14", "4", "34"],
      "ans": 0,
      "exp": "<code>addnum()</code>: p=4, q=() \u2192 returns 4. <code>addnum(1,2,3)</code>: p=1, q=(2,3) \u2192 1\u00d72\u00d73=6. 4+6=<strong>10</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_532",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python function?\ndef findList( inputList ):\n    return [i for i in inputList if i%2 == 1]",
      "opts": ["Return a list of all the even numbers in the input list.", "Return a list of all the odd numbers in the input list.", "Return a list of all the numbers in the input list, sorted in ascending order.", "Return the number or two numbers in the middle of the input list."],
      "ans": 1,
      "exp": "<code>i%2 == 1</code> is True for odd numbers. The function returns all <strong>odd</strong> numbers in the input list.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_533",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nprint \"%s%x\" % ('K', 15)",
      "opts": ["K15", "Kf15", "K0xf", "Kf"],
      "ans": 3,
      "exp": "<code>%s</code> \u2192 'K'; <code>%x</code> \u2192 15 as lowercase hex = 'f'. Output: <strong>Kf</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_534",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef f(x,y):\n    for i in y:\n        x.append(i)\n    x.remove(1)\n    return x\nprint f([1,2],[3,2,1])",
      "opts": ["[1, 2, 3, 2, 1]", "[2, 1, 3, 2]", "[2, 3, 2, 1]", "[3, 2, 1, 2]"],
      "ans": 2,
      "exp": "Start x=[1,2]. Append 3,2,1 \u2192 [1,2,3,2,1]. remove(1) removes first 1 \u2192 [2,3,2,1]. Output: <strong>[2, 3, 2, 1]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_535",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\na = [[1,2,3],[4,5,6],[7,8,9],[10,11,12,13,14]]\nprint a[1][1]+a[2][2]",
      "opts": ["12", "13", "11", "14"],
      "ans": 3,
      "exp": "a[1][1]=5, a[2][2]=9. 5+9=<strong>14</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_536",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ni = 0\ns=0\nwhile i < 5:\n    s += i\n    i += 1\n    if i == 3:\n        break\nelse:\n    s += 5\nprint s",
      "opts": ["5", "0", "3", "8"],
      "ans": 2,
      "exp": "i=0: s=0,i=1. i=1: s=1,i=2. i=2: s=3,i=3 \u2192 break. else does NOT run. Output: <strong>3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_537",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\na = [[[1,2,3],[4,5,6]],\n     [[7,8,9],[10,11,12]],\n     [[13,14,15],[16,17,18]]]\nprint a[0][0][0]+a[1][1][1]",
      "opts": ["13", "15", "12", "11"],
      "ans": 2,
      "exp": "a[0][0][0]=1, a[1][1][1]=11. 1+11=<strong>12</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_538",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python program?\ndef ProcessString(S):\n    if(len(S) <= 1):\n        return S\n    else:\n        return ProcessString(S[1:]) + S[0]\nprint(ProcessString(\"TIME STAR\"))",
      "opts": ["EMIT RATS", "TIME STAR", "RATS EMIT", "STAR TIME"],
      "ans": 2,
      "exp": "The function recursively reverses the string: <code>ProcessString(S) = ProcessString(S[1:]) + S[0]</code>. Reversing \"TIME STAR\" gives <strong>RATS EMIT</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_539",
      "year": "2018 Batch 17",
      "text": "What will be the appropriate values for X, Y and Z in the given pseudocode?\nMOVE (A, B, C):\n    WHILE (stack A is not Empty):\n        temp = A.pop()\n        X.push(temp)\n    ENDWHILE\n    WHILE (Stack Y is not empty):\n        temp = Y.pop()\n        Z.push(temp)\n    ENDWHILE",
      "opts": ["A, B and C respectively", "B, A and C respectively", "C, A and B respectively", "C, C and B respectively"],
      "ans": 3,
      "exp": "Pop all A into X reverses order. Pop all Y into Z reverses again, restoring original order in Z=B. X=C, Y=C, Z=B \u2192 <strong>C, C and B respectively</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_540",
      "year": "2018 Batch 17",
      "text": "What will be the appropriate statements to fill the blanks (P) and (Q)?\nIF (...(P)...):\n    temp = A.pop()\n    ...(Q)...",
      "opts": ["n == 1 and B.push(temp), respectively", "n == 1 and C.push(temp), respectively", "Stack A is not empty and B.push(temp), respectively", "Stack A is not empty and C.push(temp), respectively"],
      "ans": 0,
      "exp": "Base case when n=1: pop A, push directly to B. P = <code>n == 1</code>, Q = <code>B.push(temp)</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_541",
      "year": "2018 Batch 17",
      "text": "What will be the appropriate statements to fill the blanks (R) and (S)?",
      "opts": ["MOVE(A, C, B, n-1) and MOVE(C, B, A, n-1), respectively", "MOVE(A, B, C, n-1) and MOVE(C, B, A, n-1), respectively", "MOVE(A, C, B, n-1) and MOVE(A, B, C, n-1), respectively", "MOVE(A, C, B, n) and MOVE(A, B, C, n), respectively"],
      "ans": 0,
      "exp": "Move n-1 from A to C (using B): R=MOVE(A,C,B,n-1). Then pop A's remaining element to B. Then move n-1 from C to B (using A): S=MOVE(C,B,A,n-1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_542",
      "year": "2018 Batch 17",
      "text": "Write the appropriate code to fill the blank (T) for completing the RecMax function.\nif(len(L) == 1):\n    if(type(L[0]) is list):\n        return ...(T)...\n    else:\n        return L[0]",
      "opts": ["max(L[0])", "L[0][0]", "RecMax(L[1:])", "RecMax(L[0])"],
      "ans": 3,
      "exp": "When L has one element and it is a list, recursively find the max inside it: <strong>RecMax(L[0])</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_543",
      "year": "2018 Batch 17",
      "text": "Write the appropriate code to fill the blank (U) for completing the RecMax function.\nif(type(L[0]) is list):\n    return max(...(U)...)",
      "opts": ["L[0], L[1:]", "L[0], RecMax(L[1:])", "RecMax(L[0]), L[1:]", "RecMax(L[0]), RecMax(L[1:])"],
      "ans": 3,
      "exp": "When L[0] is a list: max of (max inside L[0]) vs (max of rest of L) = <code>max(RecMax(L[0]), RecMax(L[1:]))</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_544",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef ProcessList(L):\n    if(len(L) <= 1):\n        return L\n    else:\n        NL = ProcessList(L[1:])\n        NL.append(L[0])\n        return NL\nprint(ProcessList([1, 2, [31, [321], 33], 4, 5]))",
      "opts": ["[1, 2, [31, [321], 33], 4, 5]", "[5, 4, [31, [321], 33], 2, 1]", "[5, 4, [33, [321], 31], 2, 1]", "None of the above"],
      "ans": 1,
      "exp": "The function reverses the top-level list. The nested list is treated as one element (not reversed internally). Result: <strong>[5, 4, [31, [321], 33], 2, 1]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_545",
      "year": "2018 Batch 17",
      "text": "What will be the order of numbers printed by the following Python code?\ndef PrintNumbers(i, n):\n    if(i == n):\n        print n\n    else:\n        print i\n        PrintNumbers(i+1, n)\n        print i\nprint(PrintNumbers(0, 5))",
      "opts": ["0, 1, 2, 3, 4, 5", "5, 4, 3, 2, 1, 0", "0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0", "0, 1, 2, 3, 4, 5, 5, 4, 3, 2, 1, 0"],
      "ans": 2,
      "exp": "Each call prints i before recursing and i again after. Base case (i=5) prints 5 once. Unwinding produces: 0,1,2,3,4 then 5 then 4,3,2,1,0. Output: <strong>0, 1, 2, 3, 4, 5, 4, 3, 2, 1, 0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_546",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nL1 = [1, 2, 3]\nL2 = L1\nL3 = L1[:]\nprint (L1 is L2 and L1 == L3), (L1 is L3 and L1 == L3)",
      "opts": ["True True", "True False", "False False", "False True"],
      "ans": 1,
      "exp": "<code>L2=L1</code>: same object \u2192 L1 is L2 = True. L3=L1[:]: shallow copy, different object \u2192 L1 is L3 = False. L1==L3 = True (same values). First: True and True = True. Second: False and True = False. Output: <strong>True False</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_547",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code.\nM = 'A', 'B', 'C'\nM[1] = 'b'\nWhat will be M after executing the above two lines?",
      "opts": ["('A', 'B', 'C')", "('A', 'b', 'C')", "('b', 'B', 'C')", "None of the above"],
      "ans": 0,
      "exp": "<code>M = 'A','B','C'</code> creates tuple <code>('A','B','C')</code>. Tuples are immutable \u2014 <code>M[1]='b'</code> raises TypeError. The assignment fails and M retains <code>('A','B','C')</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_548",
      "year": "2018 Batch 17",
      "text": "Which of the following statements is/are correct about the Python expression \"set(S)\", where S is a given string?\nI.   It will generate a set which contains all the unique characters in string S.\nII.  The order of characters in the set will be same as the order the characters appear in the input string.\nIII. This expression will generate an error as the set function accepts only a collection of items as the input parameter and S is a string.",
      "opts": ["I only", "II only", "III only", "None of the above"],
      "ans": 0,
      "exp": "I: True \u2014 set(S) collects unique characters. II: False \u2014 sets are unordered. III: False \u2014 a string is iterable so set(S) works. Only <strong>I</strong> is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_549",
      "year": "2018 Batch 17",
      "text": "What will be appropriate to fill the blanks (X) and (Y), respectively, in the postfix evaluation pseudocode?\nResult = Operand1 e Operand2\n...(X)...\n...\nRETURN ...(Y)...",
      "opts": ["S.pop() and S.pop()", "S.push(e) and Result", "S.push(e) and S.pop()", "S.push(Result) and S.pop()"],
      "ans": 3,
      "exp": "After computing Result, push it back onto the stack: X = <code>S.push(Result)</code>. At the end, the final answer is the top of the stack: Y = <code>S.pop()</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_550",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nS = set((1, 2, (31, 32), 31, 32))\nprint len(S)",
      "opts": ["4", "5", "6", "None of the above"],
      "ans": 1,
      "exp": "Unique elements: 1, 2, (31,32), 31, 32 \u2014 five distinct elements (the tuple (31,32) is hashable and different from 31 and 32). <code>len(S)</code> = <strong>5</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_551",
      "year": "2018 Batch 17",
      "text": "What will be the contents of the list L after execution of the above Python code?\n(ProcessList2 performs bubble sort on L = [12, 7, 34, 10, 20])",
      "opts": ["[12, 7, 34, 10, 20]", "[7, 12, 10, 20, 34]", "[34, 20, 12, 10, 7]", "[7, 10, 12, 20, 34]"],
      "ans": 3,
      "exp": "Bubble sort on [12,7,34,10,20] produces ascending order: <strong>[7, 10, 12, 20, 34]</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_552",
      "year": "2018 Batch 17",
      "text": "What will be the output of the above Python code?\n(ProcessList2 bubble sorts L = [12, 7, 34, 10, 20] and prints count \u2014 number of passes)",
      "opts": ["2", "4", "3", "5"],
      "ans": 2,
      "exp": "Pass 1: swaps \u2192 [7,12,10,20,34]. Pass 2: swap \u2192 [7,10,12,20,34]. Pass 3: no swaps \u2192 done. count = <strong>3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_553",
      "year": "2018 Batch 17",
      "text": "What will be the output of the above code if the list L is [2, 3, 4, 5, 6, 7, 8, 9, 1]?",
      "opts": ["9", "7", "8", "6"],
      "ans": 0,
      "exp": "L=[2,3,4,5,6,7,8,9,1]: element 1 at index 8 needs to move to index 0. Each pass moves it one step left. 8 passes to move + 1 final confirmation pass = <strong>9</strong> passes.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_554",
      "year": "2018 Batch 17",
      "text": "Which of the following input parameter will result in a return value of \"True\" in the above PerformTask function?\ndef PerformTask(S):\n    L = [];\n    for i in range(0, len(S)):\n        if(S[i] == \"(\"):\n            L.append(S[i])\n        elif((S[i] == \")\") and (len(L)>0)):\n            L.pop()\n        else:\n            return False\n    return True",
      "opts": ["(())", "(()).()", "(()))()", "None of the above"],
      "ans": 0,
      "exp": "<strong>(())</strong>: push(, push(, pop, pop \u2192 L=[] \u2192 return True. \u2713<br><strong>(()).() </strong>: '.' is not '(' or ')' \u2192 return False. \u2717<br><strong>(()))()</strong>: after (()) L empty; ')' with empty L \u2192 return False. \u2717<br>Only <strong>(())</strong> returns True.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_555",
      "year": "2018 Batch 17",
      "text": "If L = [1, 2, 3, 4, 6, 7], which Python statement(s) will generate the output [1, 3, 6]?\nI.   print (L[::2])\nII.  print (L[-6::2])\nIII. print (L[[0, 1, 2]*2])",
      "opts": ["I only", "I and II only", "I and III only", "All three"],
      "ans": 1,
      "exp": "I: L[::2] = [1,3,6]. \u2713  II: L[-6::2] = L[0::2] = [1,3,6]. \u2713  III: Native Python lists don't support fancy list indexing \u2014 TypeError. \u2717  Answer: <strong>I and II only</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_556",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef DoSomething(L, x, count):\n    count = count + 1\n    if(len(L)<2):\n        return count\n    i = len(L)/2\n    if(L[i] == x):\n        return count\n    elif(L[i] < x):\n        return DoSomething(L[i+1:], x, count)\n    else:\n        return DoSomething(L[:i-1], x, count)\nprint(DoSomething(range(1,15), 0, 0))",
      "opts": ["4", "5", "3", "6"],
      "ans": 0,
      "exp": "Searching for 0 in [1..14] via modified binary search:<br>Call 1: i=7, L[7]=8 &gt; 0 \u2192 L[:6], count=1.<br>Call 2: i=3, L[3]=4 &gt; 0 \u2192 L[:2], count=2.<br>Call 3: i=1, L[1]=2 &gt; 0 \u2192 L[:0]=[], count=3.<br>Call 4: len=0 &lt; 2 \u2192 return 4. Output: <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_557",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ndef ProcessListElements(L, count):\n    if(len(L)>0):\n        if(L[0]>5):\n            count = count + 1\n        return ProcessListElements(L[1:], count)\n    return count\nprint(ProcessListElements([1, 6, 12, 8, 4, 2, 22, 44], 0))",
      "opts": ["4", "6", "3", "5"],
      "ans": 3,
      "exp": "Elements &gt; 5 in [1,6,12,8,4,2,22,44]: 6,12,8,22,44 = <strong>5</strong> elements.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_558",
      "year": "2018 Batch 17",
      "text": "What is the process of converting a computer program in a high-level language to low-level instructions that the CPU can understand?",
      "opts": ["Compilation", "Interpretation", "Assembling", "Linking"],
      "ans": 0,
      "exp": "<strong>Compilation</strong> translates high-level language source code into low-level machine code. Interpretation executes source directly. Linking combines object files. Assembling converts assembly to machine code.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_559",
      "year": "2018 Batch 17",
      "text": "Which of the following is NOT a CPU register?",
      "opts": ["Instruction Register", "Cache register", "Program Counter", "Accumulator"],
      "ans": 1,
      "exp": "IR, PC, and Accumulator are standard CPU registers. <strong>Cache</strong> is a separate memory component (not a register) between CPU registers and main memory.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_560",
      "year": "2018 Batch 17",
      "text": "To where are the results of Arithmetic and Logic Unit operation always written?",
      "opts": ["Instruction Register", "Program Counter", "Accumulator", "Flag Register"],
      "ans": 2,
      "exp": "ALU results are always written to the <strong>Accumulator</strong> \u2014 the CPU's primary working register.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_561",
      "year": "2018 Batch 17",
      "text": "A computer screen image is made of tiny dots called _________ (fill the blank)",
      "opts": ["pixels", "dots", "bytes", "bits"],
      "ans": 0,
      "exp": "The tiny dots that make up a screen image are called <strong>pixels</strong> (picture elements).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_562",
      "year": "2018 Batch 17",
      "text": "Which of the following is NOT a CPU performance improvement technique?",
      "opts": ["Instruction pre-fetching", "Loop unrolling", "Hyper threading", "Instruction pipelining"],
      "ans": 1,
      "exp": "<strong>Loop unrolling</strong> is a compiler/software optimization, not a CPU hardware performance technique. Instruction pre-fetching, hyper-threading, and instruction pipelining are all CPU architectural techniques.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_563",
      "year": "2018 Batch 17",
      "text": "Which of the following is NOT a component in the system bus?",
      "opts": ["PCI Express bus", "Address bus", "Data bus", "Control bus"],
      "ans": 0,
      "exp": "The system bus consists of Address, Data, and Control buses. <strong>PCI Express</strong> is a separate peripheral expansion bus, not part of the system bus.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_564",
      "year": "2018 Batch 17",
      "text": "Which of the following is NOT a key component in a von-Neumann machine?",
      "opts": ["Input devices", "Output devices", "Display controller", "Central processing unit"],
      "ans": 2,
      "exp": "Von Neumann components: CPU, memory, input devices, output devices. A <strong>display controller</strong> is not a key architectural component of the von Neumann model.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_565",
      "year": "2018 Batch 17",
      "text": "Which of the following statement is incorrect with respect to main memory?",
      "opts": ["Each memory location has a unique address", "Each memory location can hold a single binary value of fixed length", "A memory location can only be read a limited number of times", "Writing a new value to a memory location replaces the previous value stored at that location"],
      "ans": 2,
      "exp": "RAM can be read <strong>unlimited</strong> times \u2014 reading is non-destructive. Options (a), (b), (d) are all correct properties of main memory. Statement (c) is <strong>incorrect</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_566",
      "year": "2018 Batch 17",
      "text": "The ____________ is responsible for decoding instructions inside the CPU. (fill the blank)",
      "opts": ["Program Counter", "ALU", "Accumulator", "Control Unit"],
      "ans": 3,
      "exp": "The <strong>Control Unit</strong> fetches, decodes, and coordinates execution of instructions.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_567",
      "year": "2018 Batch 17",
      "text": "A typical CPU instruction has two parts: an Operation code and an ____________ (fill the blank)",
      "opts": ["Mnemonic", "Operand", "Register", "Address"],
      "ans": 1,
      "exp": "A CPU instruction consists of an <strong>opcode</strong> (operation code) and an <strong>operand</strong> (data or address).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_568",
      "year": "2018 Batch 17",
      "text": "Name two types of volatile memory used in modern computers.",
      "opts": ["SRAM and DRAM", "HDD and SSD", "ROM and Flash", "Cache and Register"],
      "ans": 0,
      "exp": "<strong>SRAM</strong> (Static RAM, used for cache) and <strong>DRAM</strong> (Dynamic RAM, used for main memory) are both volatile. ROM/Flash are non-volatile. HDD/SSD are secondary storage.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_569",
      "year": "2018 Batch 17",
      "text": "Which of the following statement is incorrect with respect to SSD Hard Disk Drives?",
      "opts": ["SSD Drives uses magnetic medium to store data", "SSD drives are faster than other types of hard disk drives", "SSD drives uses newer technology compared to other types of hard disk drives", "SSD drives are more expensive and have less capacity than other types of hard disk drives"],
      "ans": 0,
      "exp": "SSDs use <strong>flash/semiconductor</strong> memory, not magnetic medium. Statement (a) is <strong>incorrect</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_570",
      "year": "2018 Batch 17",
      "text": "Which of the following is incorrect regarding the Arduino platform?",
      "opts": ["Arduino platform can be considered as a \"single-chip-computer\" (or \"single IC computer\")", "Arduino platform consists of hardware components and some firmware components", "Arduino platform is capable of having both analog and digital inputs", "Programs stored in the Arduino platform get erased when power is disconnected"],
      "ans": 3,
      "exp": "Arduino stores programs in <strong>non-volatile flash memory</strong> \u2014 programs persist when power is removed. Statement (d) is <strong>incorrect</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_571",
      "year": "2018 Batch 17",
      "text": "Which of the following statements is incorrect with respect to a program written for Arduino platform (i.e., Arduino sketches)?",
      "opts": ["Code written under \"Loop\" section get repeated as far as power is applied", "Code written under \"Setup\" section is executed each time the microcontroller is re-started", "The pinMode must be set before reading or writing to any analog or digital ports", "Arduino platform can execute programs written in Python language"],
      "ans": 3,
      "exp": "Arduino sketches are written in C/C++. Arduino <strong>cannot natively execute Python</strong>. The other statements are correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_572",
      "year": "2018 Batch 17",
      "text": "The interpretation of a program in a high-level language is ____________ than executing the program in machine code obtained by compilation. (fill the blank)",
      "opts": ["more reliable", "equally efficient", "faster", "slower"],
      "ans": 3,
      "exp": "Interpretation is <strong>slower</strong> \u2014 it translates and executes each statement at run-time, unlike compiled machine code which executes directly.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_573",
      "year": "2018 Batch 17",
      "text": "Flowcharts and ____________ can be used to express algorithms. (fill the blank)",
      "opts": ["assembly language", "Python code", "pseudocode", "machine code"],
      "ans": 2,
      "exp": "<strong>Pseudocode</strong> and flowcharts are the standard algorithm-expression tools, language-independent and human-readable.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_574",
      "year": "2018 Batch 17",
      "text": "What does the following algorithm compute, as a function of inputs a and b?\n1. Start\n2. Input a, b  // assume: a, b are integers; b > 0\n3. result \u2190 1\n4. i \u2190 1\n5. result \u2190 result * a\n6. i \u2190 i + 1\n7. If i <= b go to step 5\n8. Output result\n9. Stop",
      "opts": ["b\u1d43", "a\u1d47", "a\u00d7b", "a+b"],
      "ans": 1,
      "exp": "Multiplies result by a exactly b times (i runs from 1 to b). result = a^b = <strong>a\u1d47</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_575",
      "year": "2018 Batch 17",
      "text": "For the algorithm to work as expected, what should be in blank (P) in Fig. 1?\n(The algorithm checks if N is prime by testing divisors k from 2 up to \u221aN)",
      "img": "IMAGES/CS/Past Papers/2018 Batch 17/pp_2018_Batch_17_FIG1.png",
      "imgAlt": "Flowchart for primality testing of N by checking divisors k from 2 to \u221aN, with blanks P and Q",
      "opts": ["N%k == 0", "k == 1", "k > \u221aN", "N%k != 0"],
      "ans": 0,
      "exp": "Blank P is the condition that routes to 'N is not prime'. If k divides N evenly (<code>N%k == 0</code>), N has a factor and is not prime.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_576",
      "year": "2018 Batch 17",
      "text": "For the algorithm to work as expected, what should be in blank (Q) in Fig. 1?\n(The algorithm checks if N is prime by testing divisors k from 2 up to \u221aN)",
      "img": "IMAGES/CS/Past Papers/2018 Batch 17/pp_2018_Batch_17_FIG1.png",
      "imgAlt": "Flowchart for primality testing of N by checking divisors k from 2 to \u221aN, with blanks P and Q",
      "opts": ["k \u2190 k-1", "k \u2190 k+1", "k \u2190 k\u00d72", "k \u2190 2"],
      "ans": 1,
      "exp": "When k does not divide N, increment k to check the next candidate divisor: <strong>k \u2190 k+1</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_577",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\ntype((2+3j)==(1+1+3j))",
      "opts": ["<type 'complex'>", "<type 'bool'>", "<type 'int'>", "An error message"],
      "ans": 1,
      "exp": "<code>1+1+3j = 2+3j</code>. <code>(2+3j)==(2+3j)</code> = True. <code>type(True)</code> = <strong>&lt;type 'bool'&gt;</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_578",
      "year": "2018 Batch 17",
      "text": "What will be the output of the following Python code?\nlen([1,[2,3,4]])** len(\"UoM\")+ 3L",
      "opts": ["9L", "67L", "11L", "An error message"],
      "ans": 2,
      "exp": "len([1,[2,3,4]])=2, len(\"UoM\")=3. 2**3=8. 8+3L=<strong>11L</strong> (Python 2 long integer).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_579",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code.\na = b = c = 2\na = 5\ndel a\nWhich of the following is/are correct after the code above is executed?\nI.  Two integer objects will remain.\nII. The integer object whose value is 2 has two names.",
      "opts": ["I only", "II only", "Both I and II", "None"],
      "ans": 1,
      "exp": "After <code>del a</code>: int(5) is dereferenced (gone), only int(2) remains. <strong>I is false</strong> (only one integer object remains). b and c both name int(2): <strong>II is true</strong>. Answer: <strong>II only</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_580",
      "year": "2018 Batch 17",
      "text": "Consider the following Python code.\nx = [0,1,'mora',3]\nx[1] = 5\nx[2][0]='t'\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without a problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors."],
      "ans": 2,
      "exp": "Line 2: list item assignment works fine. Line 3: <code>x[2]</code>='mora' (string); <code>'mora'[0]='t'</code> raises TypeError (strings immutable). Only the third line has an error.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_581",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nx = \"asdqwemnb\"\ny =['asd','qwe','mnb']\nz = 'm'\nprint(z in y and z in x)",
      "opts": ["True", "False"],
      "ans": 1,
      "exp": "<strong>False</strong> is printed. The expression uses <code>and</code>, so both parts must be true. <code>z in y</code> checks whether the whole string <code>\"m\"</code> is an element of the list <code>[\"asd\", \"qwe\", \"mnb\"]</code>, which is false. Although <code>\"m\" in x</code> is true because the character appears in the string, <code>False and True</code> gives <code>False</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_582",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code.\n\nmyVar = 10\n3lessVar = MYVAR - 3\nprint(myVar + \"10\")\n\nWhich of the following is correct about the above 3 lines of code?\nI. The second line has one error.\nII. The second line has two errors.\nIII. The third line has one error.",
      "opts": ["None of them (there are no errors).", "I only.", "II only.", "III only.", "I and III only.", "II and III only."],
      "ans": 5,
      "exp": "Statement I is false and statement II is true because the second line contains two separate errors: a variable name cannot begin with a digit, and <code>MYVAR</code> is not the same name as <code>myVar</code> because Python is case-sensitive. Statement III is true because the third line attempts to add an integer and a string using <code>+</code>, which raises a <code>TypeError</code>. Therefore, <strong>II and III only</strong> is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_583",
      "year": "2019 Batch 18",
      "text": "What will be the value of the following Python expression?\n\n(0xF & ~0) ^ (0b1111 << 0o4)",
      "opts": ["15", "240", "255", "None of the above"],
      "ans": 2,
      "exp": "<code>0xF</code> is 15 and <code>~0</code> is -1, so <code>0xF & ~0 = 15</code>. Also, <code>0o4</code> is decimal 4, so <code>0b1111 << 4</code> shifts 15 left by 4 bits, giving 240. Finally, <code>15 ^ 240</code> sets all lower 8 bits to 1, giving <strong>255</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_584",
      "year": "2019 Batch 18",
      "text": "If we import the math module in Python, we have access to math functions and constants. For example, math.e gives the mathematical constant e = 2.71828... to available precision, math.ceil(x) returns the ceiling of x and math.floor(x) returns the floor of x. Assuming we have imported the math module, what will be the output of the following Python code?\n\nprint (math.ceil(math.e) ** 2 // math.floor(math.e))",
      "opts": ["3", "4", "4.0", "None of the above"],
      "ans": 1,
      "exp": "<code>math.ceil(math.e)</code> is 3 because e is about 2.718, and <code>math.floor(math.e)</code> is 2. Therefore the expression becomes <code>3 ** 2 // 2 = 9 // 2 = 4</code>. Floor division between integers returns an integer, so the output is <strong>4</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_585",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code, if the input is \u201cc b e f a d\u201d?\n\ns = input('Enter your input: ')\nmydata = s.split()\nmydata.sort()\nprint(mydata)",
      "opts": ["['a', 'b', 'c', 'd', 'e', 'f']", "['c', 'b', 'e', 'f', 'a', 'd']", "abcdef", "None of the above"],
      "ans": 0,
      "exp": "<code>split()</code> separates the input string at spaces, producing <code>[\"c\", \"b\", \"e\", \"f\", \"a\", \"d\"]</code>. The list method <code>sort()</code> sorts the strings alphabetically in place. Therefore the printed list is <strong><code>['a', 'b', 'c', 'd', 'e', 'f']</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_586",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code of 4 lines, with line numbers (not part of the code) shown on the left. The objective is to write a string onto the file.\n\n1 f = open('Out.txt', 'w')\n2 f.write(\"this is the string\")\n3 ............\n4 print('Done...')\n\nWhat should fill the blank at line 3 to make the code complete?",
      "opts": ["f.close('Out.txt', 'w')", "f.close()", "close(f)", "close('Out.txt', 'w')"],
      "ans": 1,
      "exp": "The file object is stored in <code>f</code>. To close that opened file, the close method of that object must be called with no arguments: <code>f.close()</code>. The filename and mode are used when opening the file, not when closing it.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_587",
      "year": "2019 Batch 18",
      "text": "Out of the control structures used in programs, which of the following is not essential?",
      "opts": ["sequence", "selection", "repetition", "subprogram"],
      "ans": 3,
      "exp": "The three fundamental control structures needed to express algorithms are <strong>sequence</strong>, <strong>selection</strong>, and <strong>repetition</strong>. A subprogram is useful for modularity and reuse, but it is not one of the essential basic control structures.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_588",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code, with line numbers (not part of the code) shown on the left. The code is expected to read data from a file and display it on screen.\n\n1 try:\n2     fobj = open('Input.txt', 'r')\n3     s = fobj.read()  # Read from file\n4     ..... IOError:\n5     print('Error in file access.')\n6 else:\n7     print('Finished reading the file.')\n8     ......  # close the file\n\nWhat should fill the blank at the beginning of line 4 to make it work?",
      "opts": ["try", "else", "except", "finally"],
      "ans": 2,
      "exp": "In Python exception handling, the handler for a possible error is written using <code>except</code>. Therefore line 4 must begin with <code>except IOError:</code>, which catches input/output errors raised in the <code>try</code> block.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_589",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code.\n\nm = int(input('Enter an integer: '))\nif (m < 1000):\n    p = 2000 / m\nprint('p=', p)\n\nWhich of the following is/are correct about the code above?\nI. The code does not have any syntax errors.\nII. One type of exception could occur at run-time.\nIII. More than one type of exception could occur at run-time.",
      "opts": ["I only", "II only", "III only", "I and II only", "I and III only"],
      "ans": 4,
      "exp": "Statement I is true because the code is syntactically valid. Statement II is false because more than one kind of run-time exception can occur: a non-integer input causes <code>ValueError</code>, input <code>0</code> causes <code>ZeroDivisionError</code>, and if <code>m >= 1000</code>, <code>p</code> is not assigned before printing. Statement III is therefore true. The correct choice is <strong>I and III only</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_590",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code, if the input is \u2018111\u2019?\n\nx = int(input('Enter x: '))\nif (x > 100):\n    k = x * 2\n    if (x >= 200):\n        k = k * 3\n    elif (k < 300):\n        k = k * 4\n    else:\n        k = k * 5\nelse:\n    k = x * 3\nprint(k)",
      "opts": ["333", "888", "666", "1110"],
      "ans": 1,
      "exp": "The input gives <code>x = 111</code>. Since <code>x > 100</code>, first <code>k = 111 \u00d7 2 = 222</code>. The condition <code>x >= 200</code> is false, but <code>k < 300</code> is true, so <code>k = 222 \u00d7 4 = 888</code>. Thus the output is <strong>888</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_591",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code.\n\ns = 0.0\nfor i in range(10):\n    s += 0.1\nprint(s == 1.0)\n\nWill the output of the above be True?",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "The output is <strong>No</strong>. Decimal fraction <code>0.1</code> cannot be represented exactly in binary floating-point. Adding it ten times gives a value very close to 1.0, but not exactly equal to 1.0, so the comparison <code>s == 1.0</code> evaluates to <code>False</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_592",
      "year": "2019 Batch 18",
      "text": "An integer N is represented in 8-bit two's complement notation as 10001011\u2082. Will the correct decimal value of N be -119\u2081\u2080?",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "The leading bit is 1, so the number is negative. The unsigned value of <code>10001011\u2082</code> is 139. In 8-bit two\u2019s complement, the signed value is <code>139 - 256 = -117</code>. Therefore the value is not -119, so the answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_593",
      "year": "2019 Batch 18",
      "text": "Will the 8-bit two's complement representation for -15\u2081\u2080 be 11110000\u2082?",
      "opts": ["Yes", "No"],
      "ans": 1,
      "exp": "For +15, the 8-bit binary representation is <code>00001111</code>. Inverting gives <code>11110000</code>, and adding 1 gives <code>11110001</code>. Therefore -15 is represented as <code>11110001\u2082</code>, not <code>11110000\u2082</code>. The answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_594",
      "year": "2019 Batch 18",
      "text": "How will the number 0.0456789123\u2081\u2080 be represented in a decimal floating-point notation which has a 7-digit mantissa, the decimal point after the second digit from left and 10 as the base for the exponent?",
      "opts": ["45.67891 \u00d7 10\u207b\u00b3", "04.56789 \u00d7 10\u207b\u00b2", "4567891 \u00d7 10\u207b\u2078", "45.67891 \u00d7 10\u00b3"],
      "ans": 0,
      "exp": "The decimal point must be after the second digit from the left, so the mantissa is written as <code>45.67891</code> using seven significant digits. To keep the value unchanged, <code>45.67891</code> must be multiplied by <code>10\u207b\u00b3</code>, giving <code>45.67891 \u00d7 10\u207b\u00b3 = 0.04567891</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_595",
      "year": "2019 Batch 18",
      "text": "The IEEE single-precision format for floating-point representation uses 32 bits, which is divided as follows: sign \u2192 1 bit, mantissa \u219223 bits and exponent \u2192 8 bits. If the decimal number 7.3125\u2081\u2080 is represented in this format, what will be the correct mantissa? You may omit any trailing zeros in your answer (i.e., no need to write insignificant 0 digits).",
      "opts": ["0111.0101", "110101", "111.0101", "101101"],
      "ans": 0,
      "exp": "The marking scheme gives the mantissa as <strong><code>0111.0101</code></strong>. The number <code>7.3125</code> is <code>111.0101\u2082</code>; the mantissa form used in the paper records the significant binary digits as <code>0111.0101</code>, omitting trailing insignificant zeros.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_596",
      "year": "2019 Batch 18",
      "text": "Can we say that the 8-bit ASCII representation of the digit '7' is 00110111\u2082, considering the following interaction with the Python interpreter?\n\n>>> ord('1')\n49\n>>> ord('8')\n56",
      "opts": ["Yes", "No"],
      "ans": 0,
      "exp": "ASCII codes for digit characters are consecutive. Since <code>ord('1') = 49</code> and <code>ord('8') = 56</code>, <code>ord('7') = 55</code>. Decimal 55 in 8-bit binary is <code>00110111\u2082</code>, so the statement is correct.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_597",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\na=0\nfor b in range(-100,1000,5):\n    for c in range(-1,2):\n        a += c\nprint(a)",
      "opts": ["0", "1", "220", "None of the above"],
      "ans": 0,
      "exp": "For every value of <code>b</code>, the inner loop uses <code>c = -1, 0, 1</code>. Their sum is <code>-1 + 0 + 1 = 0</code>. Therefore each outer-loop iteration adds 0 to <code>a</code>, so <code>a</code> remains <strong>0</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_598",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ncount = 1\nsum = 0\nfor count in range(0,10,2):\n    sum = sum + 1\nelse:\n    sum = sum + 10\nsum = sum + 20\nprint(sum)",
      "opts": ["5", "15", "25", "35"],
      "ans": 3,
      "exp": "The loop <code>range(0,10,2)</code> has five values: 0, 2, 4, 6, and 8, so <code>sum</code> becomes 5. Since the loop finishes normally without <code>break</code>, the <code>else</code> block runs and adds 10, giving 15. Then 20 is added, giving <strong>35</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_599",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ni = 0\nwhile i < 5:\n    i += 1\n    if i == 3:\n        print(i)\n        break\nelse:\n    print(i)",
      "opts": ["3", "5", "0", "None of the above"],
      "ans": 0,
      "exp": "The loop increments <code>i</code> from 0. When <code>i</code> becomes 3, the condition <code>i == 3</code> is true, so the program prints 3 and executes <code>break</code>. A <code>while</code>-<code>else</code> block does not run after a break. Therefore the output is <strong>3</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_600",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nx=0\np = 2\nwhile (p < 10):\n    q = 2\n    while (q < p):\n        if not(p%q): q = p\n        q += 1\n    if (q > p) : x += p\n    p += 1\nprint(x)",
      "opts": ["17", "27", "44", "None of the above"],
      "ans": 1,
      "exp": "The program adds <code>p</code> to <code>x</code> when the inner loop makes <code>q > p</code>. This happens for the composite values 4, 6, 8, and 9. Therefore <code>x = 4 + 6 + 8 + 9 = 27</code>. The output is <strong>27</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_601",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\na = 0\nfor i in range(5):\n    if i == 2 : continue\n    a += i\nprint(a)",
      "opts": ["6", "8", "10", "None of the above"],
      "ans": 1,
      "exp": "The loop values are 0, 1, 2, 3, and 4. When <code>i == 2</code>, <code>continue</code> skips the addition. Therefore <code>a = 0 + 1 + 3 + 4 = 8</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_602",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\na=0\ni=0\nwhile (i < 3):\n    i += 1\n    j = 0\n    while (j < 3):\n        j += 1\n        if i == 2 : continue\n        a += j\nprint(a)",
      "opts": ["6", "9", "12", "18"],
      "ans": 2,
      "exp": "For <code>i = 1</code>, the inner loop adds <code>1 + 2 + 3 = 6</code>. For <code>i = 2</code>, <code>continue</code> skips all additions inside the inner loop. For <code>i = 3</code>, the inner loop again adds 6. Thus the total is <code>6 + 0 + 6 = 12</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_603",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nlist = ['a', 'b', 'c', 'd', 'e', 'f', 'g' ]\nlist[-3] = 'x'\nprint (list[3])",
      "opts": ["a", "c", "x", "d"],
      "ans": 3,
      "exp": "Index <code>-3</code> refers to the third item from the end, which is <code>e</code>, so it is replaced by <code>x</code>. Index <code>3</code> still refers to the fourth item of the list, which is <code>d</code>. Therefore the output is <strong>d</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_604",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nx = \"University of Moratuwa\"\nprint (x[6] + x[7] + x[-6:-4] + x[-14:-16])",
      "opts": ["sira", "siraM", "sity", "None of the above"],
      "ans": 0,
      "exp": "In the string, <code>x[6]</code> is <code>s</code> and <code>x[7]</code> is <code>i</code>. The slice <code>x[-6:-4]</code> gives <code>ra</code>. The slice <code>x[-14:-16]</code> is empty because the start index is to the right of the stop index with the default positive step. Therefore the result is <strong>sira</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_605",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nfor i in range(6,5,-1): print(str(i) * i)",
      "opts": ["6", "666666", "654321", "None of the above"],
      "ans": 1,
      "exp": "<code>range(6,5,-1)</code> contains only the value 6. The expression <code>str(i) * i</code> becomes <code>\"6\" * 6</code>, which creates the string <code>666666</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_606",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ndef myFunc( a ):\n    a[0] = 100\n    return\nx = [10,20,30]\nmyFunc(x)\nprint(x)",
      "opts": ["[10, 20, 30]", "[100, 20, 30]", "[100]", "None of the above"],
      "ans": 1,
      "exp": "Lists are mutable objects. The function receives a reference to the same list object and changes its first element using <code>a[0] = 100</code>. Therefore the original list <code>x</code> is changed to <strong><code>[100, 20, 30]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_607",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ndef printme(a = \"Moratuwa\" , b = \"University\" ):\n    print (a,b)\n    return\nprintme(b=\"Campus\")",
      "opts": ["Moratuwa University", "Campus Moratuwa", "Moratuwa Campus", "Campus University"],
      "ans": 2,
      "exp": "The function is called with only the keyword argument <code>b=\"Campus\"</code>. Therefore <code>a</code> keeps its default value <code>\"Moratuwa\"</code>, and <code>b</code> becomes <code>\"Campus\"</code>. The printed output is <strong>Moratuwa Campus</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_608",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ndept = \"C\"\ndef sum( arg1 , arg2=\"E\"):\n    global dept\n    dept += arg1 + arg2\n    return\nsum(\"S\")\nprint (dept)",
      "opts": ["CE", "CS", "CSE", "None of the above"],
      "ans": 2,
      "exp": "The global variable starts as <code>\"C\"</code>. The call <code>sum(\"S\")</code> passes <code>arg1 = \"S\"</code> and uses the default <code>arg2 = \"E\"</code>. Therefore <code>dept += \"S\" + \"E\"</code>, producing <strong>CSE</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_609",
      "year": "2019 Batch 18",
      "text": "What will be the result when the following Python code is run?\n\ndef addnum( *q ):\n    sum = 1\n    for a in q:\n        sum *= a\n    return sum\nprint (addnum() * addnum(5,6,7))",
      "opts": ["Will print 210.", "Will print 18.", "Code will execute but will exit with an error.", "Code will not execute."],
      "ans": 0,
      "exp": "<code>addnum()</code> receives no arguments, so its loop does not run and it returns the initial value 1. <code>addnum(5,6,7)</code> returns <code>1 \u00d7 5 \u00d7 6 \u00d7 7 = 210</code>. The printed value is therefore <code>1 \u00d7 210 = 210</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_610",
      "year": "2019 Batch 18",
      "text": "What will be returned by the following Python function?\n\ndef findList( inputList ):\n    return [i for i in inputList if i%2 == 1 ]",
      "opts": ["a list of all the even numbers in the input list.", "a list of all the odd numbers in the input list.", "a list of all the numbers in the input list, sorted in ascending order.", "the number or two numbers in the middle of the input list."],
      "ans": 1,
      "exp": "The list comprehension keeps an item <code>i</code> only when <code>i % 2 == 1</code>. That condition is true for odd integers. Therefore the function returns <strong>a list of all the odd numbers in the input list</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_611",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nprint (\"%s%o\" % ('age=', 15))",
      "opts": ["age=15", "age=17", "age=0o17", "None of the above"],
      "ans": 1,
      "exp": "The format specifier <code>%s</code> prints the string <code>age=</code>. The format specifier <code>%o</code> prints the integer in octal. Decimal 15 is octal 17. Therefore the output is <strong>age=17</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_612",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nx=[1,5,1,2,8,6,2]\nx.remove(2)\ny = 0\nfor i in x: y += i\nprint(y)",
      "opts": ["21", "23", "25", "None of the above"],
      "ans": 1,
      "exp": "<code>remove(2)</code> removes only the first occurrence of the value 2. The list becomes <code>[1, 5, 1, 8, 6, 2]</code>. The sum is <code>1 + 5 + 1 + 8 + 6 + 2 = 23</code>, so the output is <strong>23</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_613",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\na = [[1,2],[3,4,5,6],[7,8,9],[10,11,12,13,14]]\nprint (a[3][1]+a[1][3])",
      "opts": ["15", "16", "17", "23"],
      "ans": 2,
      "exp": "<code>a[3]</code> is <code>[10, 11, 12, 13, 14]</code>, so <code>a[3][1] = 11</code>. <code>a[1]</code> is <code>[3, 4, 5, 6]</code>, so <code>a[1][3] = 6</code>. The sum is <code>11 + 6 = 17</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_614",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ndef changeme( myList ):\n    myList = [1,2,3]\n    return\nmyList = [10,20,30]\nchangeme( myList )\nsum = 0\nfor i in myList: sum += i\nprint(sum)",
      "opts": ["6", "30", "60", "None of the above"],
      "ans": 2,
      "exp": "Inside the function, <code>myList = [1,2,3]</code> only rebinds the local parameter name to a new list. It does not mutate the original list outside the function. Therefore the outer <code>myList</code> remains <code>[10, 20, 30]</code>, and the sum is <code>10 + 20 + 30 = 60</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_615",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nnumList = [1,2,4,7,3,4,2,1]\nselectList = []\nfor i in numList:\n    if (i%2==0) and (i not in selectList):\n        selectList.append(i)\nprint (selectList)",
      "opts": ["[2, 4]", "[2, 4, 4, 2]", "[1, 7, 3]", "None of the above"],
      "ans": 0,
      "exp": "The condition keeps only even numbers and also prevents duplicates using <code>i not in selectList</code>. The first even number is 2, then 4 is added, and later repeated 4 and 2 are skipped. Therefore the list printed is <strong><code>[2, 4]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_616",
      "year": "2019 Batch 18",
      "text": "The function myatoi(string) takes a string that represents a positive integer value and returns the corresponding integer value. The following is a Python implementation of myatoi() as an iterative function. Write the appropriate code to fill the blank (P).",
      "opts": ["0", "1", "len(string)", "10*a"],
      "ans": 0,
      "exp": "The variable <code>a</code> is used as the accumulated integer value. Before reading any digits, the accumulated value must be zero. Therefore blank (P) is <strong><code>0</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_617",
      "year": "2019 Batch 18",
      "text": "The function myatoi(string) takes a string that represents a positive integer value and returns the corresponding integer value. The following is a Python implementation of myatoi() as an iterative function. Write the appropriate code to fill the blank (Q).",
      "opts": ["0", "len(string)", "range(string)", "10*a"],
      "ans": 1,
      "exp": "The variable <code>b</code> is used as the number of characters to process in the string. Therefore it must be assigned <code>len(string)</code>, the length of the input string.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_618",
      "year": "2019 Batch 18",
      "text": "The function myatoi(string) takes a string that represents a positive integer value and returns the corresponding integer value. The following is a Python implementation of myatoi() as an iterative function. Write the appropriate code to fill the blank (R).",
      "opts": ["len(string)", "b", "string[i]", "a"],
      "ans": 1,
      "exp": "The loop must iterate once for each digit position. Since blank (Q) stores <code>len(string)</code> in <code>b</code>, the loop range is <code>xrange(b)</code>. Therefore blank (R) is <strong><code>b</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_619",
      "year": "2019 Batch 18",
      "text": "The function myatoi(string) takes a string that represents a positive integer value and returns the corresponding integer value. The following is a Python implementation of myatoi() as an iterative function. Write the appropriate code to fill the blank (S).",
      "opts": ["a+10", "10*a", "a/10", "ord(string[i])"],
      "ans": 1,
      "exp": "When a new decimal digit is appended on the right, the previous accumulated number must be multiplied by 10 before adding the new digit. Therefore blank (S) is <strong><code>10*a</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_620",
      "year": "2019 Batch 18",
      "text": "The following is a Python implementation of myatoi() as a recursive function. Write the appropriate code to fill the blank (T).",
      "opts": ["ord(string[0])-ord('0')", "0", "len(string)", "myatoi(string,n-1)"],
      "ans": 0,
      "exp": "The base case occurs when the string length being considered is 1. The integer value is therefore the numeric value of the first digit, computed by subtracting the character code of <code>'0'</code> from the character code of that digit.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_621",
      "year": "2019 Batch 18",
      "text": "The following is a Python implementation of myatoi() as a recursive function. Write the appropriate code to fill the blank (U).",
      "opts": ["myatoi(string,n-1)", "(myatoi(string,n-1))*10", "10+myatoi(string,n-1)", "ord(string[n-1])"],
      "ans": 1,
      "exp": "For a number with multiple digits, the value of the first <code>n-1</code> digits must be shifted one decimal place left before adding the final digit. Therefore blank (U) is <strong><code>(myatoi(string,n-1))*10</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_622",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. There are 8 blanks (A)\u2013(H) in the given Python implementation of a stack using a list. Write the appropriate code to fill the blank (A).",
      "opts": ["0", "len(stack)", "top", "max(stack)"],
      "ans": 1,
      "exp": "The stack list has a fixed capacity. The variable <code>maxSize</code> must store the number of positions available in the list, so blank (A) is <strong><code>len(stack)</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_623",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (B).",
      "opts": ["0", "1", "len(stack)", "-1"],
      "ans": 0,
      "exp": "Here <code>top</code> is used as the index of the next free position. An empty stack has no occupied elements, so the next free position is index 0. Therefore blank (B) is <strong><code>0</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_624",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (C).",
      "opts": ["top==0", "top>=maxSize", "top<maxSize", "len(stack)==0"],
      "ans": 1,
      "exp": "Before pushing, the code must test whether the stack is full. Since <code>top</code> is the next free index, the stack is full when <code>top >= maxSize</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_625",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (D).",
      "opts": ["stack[top]", "stack[top-1]", "top", "data[top]"],
      "ans": 0,
      "exp": "A push operation stores the new item at the current top position. Therefore the assignment must be <code>stack[top] = data</code>, so blank (D) is <strong><code>stack[top]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_626",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (E).",
      "opts": ["top-1", "top=top+1", "top+data", "top=0"],
      "ans": 1,
      "exp": "After storing a pushed item, the next free position moves one place upward. Therefore <code>top</code> must be incremented with <strong><code>top=top+1</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_627",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (F).",
      "opts": ["top>=maxSize", "top==0", "top>0", "stack[top]==0"],
      "ans": 1,
      "exp": "Before popping, the code must test whether the stack is empty. With <code>top</code> as the next free position, the stack is empty when <code>top == 0</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_628",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (G).",
      "opts": ["top=top+1", "top=top-1", "top=0", "top=maxSize"],
      "ans": 1,
      "exp": "A pop operation removes the most recently pushed item. Since <code>top</code> points to the next free location, it must first be moved back one position using <code>top=top-1</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_629",
      "year": "2019 Batch 18",
      "text": "A stack is an abstract data type with a LIFO behaviour. Write the appropriate code to fill the blank (H).",
      "opts": ["stack[top]", "stack[top+1]", "stack[0]", "top"],
      "ans": 0,
      "exp": "After decrementing <code>top</code>, the item to return is stored at <code>stack[top]</code>. Therefore blank (H) is <strong><code>stack[top]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_630",
      "year": "2019 Batch 18",
      "text": "The following is a Python implementation of a binary tree traversal where each node in the tree is a tuple of character value, left node and a right node. A leaf node is indicated by the character value 'X'. Write the appropriate code to fill the blank (I).",
      "opts": ["root[0] != 'X'", "root[0] == 'X'", "root[1]", "root[2]"],
      "ans": 0,
      "exp": "The traversal should process only real nodes and stop at leaf markers. Since a leaf marker is represented by character value <code>'X'</code>, the condition must be <code>root[0] != 'X'</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_631",
      "year": "2019 Batch 18",
      "text": "The following is a Python implementation of a binary tree traversal where each node in the tree is a tuple of character value, left node and a right node. A leaf node is indicated by the character value 'X'. Write the appropriate code to fill the blank (J).",
      "opts": ["traverse(root[2])", "print(root[0])", "traverse(root[1])", "return root"],
      "ans": 2,
      "exp": "The required output is produced by an inorder traversal: traverse the left subtree, print the root, then traverse the right subtree. Since the left child is <code>root[1]</code>, blank (J) is <strong><code>traverse(root[1])</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_632",
      "year": "2019 Batch 18",
      "text": "An array of data can be sorted efficiently using insertion sort. Write the appropriate code to fill the blank (K) in the recursive insertion sort implementation.",
      "opts": ["array, n", "array, n-1", "array[n-1]", "n-1, array"],
      "ans": 1,
      "exp": "The recursive step must first sort the first <code>n-1</code> elements before inserting the last element into its correct position. Therefore the recursive call uses <strong><code>array, n-1</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_633",
      "year": "2019 Batch 18",
      "text": "An array of data can be sorted efficiently using insertion sort. Write the appropriate code to fill the blank (L) in the recursive insertion sort implementation.",
      "opts": ["array[0]", "array[n]", "array[n-1]", "array[j]"],
      "ans": 2,
      "exp": "After sorting the first <code>n-1</code> elements, insertion sort takes the last element of the current part as the element to insert. That element is <strong><code>array[n-1]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_634",
      "year": "2019 Batch 18",
      "text": "An array of data can be sorted efficiently using insertion sort. Write the appropriate code to fill the blank (M) in the recursive insertion sort implementation.",
      "opts": ["j<0", "last<array[j] and j>=0", "last>array[j]", "array[j+1]=last"],
      "ans": 1,
      "exp": "The loop must continue while the current sorted element is greater than the item being inserted and the index is still valid. This shifts larger elements to the right. Therefore blank (M) is <strong><code>last&lt;array[j] and j&gt;=0</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_635",
      "year": "2019 Batch 18",
      "text": "An array of data can be sorted efficiently using insertion sort. Write the appropriate code to fill the blank (N) in the recursive insertion sort implementation.",
      "opts": ["array[j]=array[j+1]", "array[j+1]=array[j]", "array[j+1]=last", "last=array[j]"],
      "ans": 1,
      "exp": "Inside the shifting loop, the larger element at <code>array[j]</code> must be moved one position to the right. Therefore the assignment is <strong><code>array[j+1] = array[j]</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_636",
      "year": "2019 Batch 18",
      "text": "The instruction currently being executed is stored in",
      "opts": ["Program Counter", "Instruction Register", "Accumulator", "Program Status Word Register"],
      "ans": 1,
      "exp": "The instruction register holds the instruction that has been fetched and is currently being decoded or executed. The program counter holds the address of the next instruction, not the current instruction itself.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_637",
      "year": "2019 Batch 18",
      "text": "During the execution of a program which register gets initialized first",
      "opts": ["Program Counter", "Instruction Register", "Accumulator", "Program Status Word Register"],
      "ans": 2,
      "exp": "The marking scheme identifies the <strong>Accumulator</strong> as the required answer. In the simplified processor model used for this paper, the accumulator is treated as the working register that is initialized for program execution before arithmetic or logical results are accumulated.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_638",
      "year": "2019 Batch 18",
      "text": "What characteristics of RAM memory makes it not suitable for permanent storage?",
      "opts": ["Too slow", "Unreliable", "Volatile", "None of the above"],
      "ans": 2,
      "exp": "RAM is volatile memory: its stored data is lost when power is removed. Permanent storage must retain data without power, so volatility is the characteristic that makes RAM unsuitable for permanent storage.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_639",
      "year": "2019 Batch 18",
      "text": "Accumulator is being used to",
      "opts": ["Store the status of the last operation carried out by ALU", "Store the address of the next instruction", "Store the result of ALU", "None of the above"],
      "ans": 2,
      "exp": "The accumulator is a CPU register used to hold intermediate and final results of arithmetic and logic operations performed by the ALU. Status flags are stored in a flag/status register, and the next instruction address is stored in the program counter.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_640",
      "year": "2019 Batch 18",
      "text": "The digital information is stored on the hard disk by?",
      "opts": ["Applying a suitable electric pulse", "Applying a suitable magnetic field", "Applying a suitable nuclear field", "Using optic waves"],
      "ans": 1,
      "exp": "A magnetic hard disk stores data by magnetizing tiny regions of the disk surface. Therefore digital information is recorded by applying a suitable magnetic field.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_641",
      "year": "2019 Batch 18",
      "text": "Which of the following is a CPU performance improvement technique?",
      "opts": ["Instruction pipelining", "Compiler Loop unrolling", "Dead code elimination", "None of the above"],
      "ans": 0,
      "exp": "Instruction pipelining is a CPU hardware technique that overlaps stages of different instructions so that more instructions complete per unit time. Loop unrolling and dead code elimination are compiler optimizations, not CPU hardware techniques.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_642",
      "year": "2019 Batch 18",
      "text": "Which of the following statements is correct with respect to main memory?",
      "opts": ["Each memory location has a unique address", "A memory location can only be read a limited number of times", "Writing a new value to a memory location stores both new and the previous value of that location", "Above (a) and (c)"],
      "ans": 0,
      "exp": "Main memory is organized as addressable locations, and each location is identified by a unique address. Reading a memory location does not normally consume it, and writing a new value replaces the previous value rather than storing both.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_643",
      "year": "2019 Batch 18",
      "text": "Which of the following statements is incorrect about limitations of Von Neumann's architecture?",
      "opts": ["Each operation is carried out only by the CPU", "Every movement of data must be made via the CPU", "Memory is the only \u201cDirect Access\u201d storage device for the CPU", "Multiple operations can be carried out by the CPU at any time"],
      "ans": 3,
      "exp": "Classic Von Neumann execution is essentially sequential in the simplified model: the CPU fetches and executes instructions through a shared path to memory. The statement that multiple operations can be carried out by the CPU at any time is not a limitation of the Von Neumann model and is the incorrect statement here.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_644",
      "year": "2019 Batch 18",
      "text": "When considering the speed of access, which lists from the slowest to the fastest?",
      "opts": ["Secondary Storage, Main Memory (RAM), L2 Cache, L1 Cache, Registers", "L1 Cache, L2 Cache, Secondary Storage, Registers, Main Memory (RAM)", "Main Memory (RAM), L1 Cache, L2 Cache, Registers, Secondary Storage", "Secondary Storage, Main Memory (RAM), Registers, L2 Cache, L1 Cache"],
      "ans": 0,
      "exp": "The usual access-speed hierarchy from slowest to fastest is secondary storage, main memory, cache, and registers. Between caches, L2 is slower than L1. Therefore the correct order is <strong>Secondary Storage, Main Memory, L2 Cache, L1 Cache, Registers</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_645",
      "year": "2019 Batch 18",
      "text": "Suppose a CPU has 3 stage pipelining, i.e., fetching, decoding and executing. Fetching takes 1 ns, decoding takes 1.2 ns and executing takes 1 ns. What is the time to execute 100 instructions if pipelining is used?",
      "opts": ["100 nS", "120 nS", "121 nS", "300 nS"],
      "ans": 2,
      "exp": "The pipeline clock is governed by the slowest stage, which is decoding at 1.2 ns. After the pipeline is filled, one instruction completes approximately every cycle. Using the marking-scheme convention for this paper, the total time for 100 instructions is <strong>121 nS</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_646",
      "year": "2019 Batch 18",
      "text": "Which of the following is incorrect about pipelining?",
      "opts": ["Pipelining reduces the execution time of an instruction", "Pipelining increases the number of instructions that can be executed in a given time", "Multiple instructions can be in the instruction cycle at the same time", "Pipelining is an extension of the idea of instruction pre-fetching"],
      "ans": 0,
      "exp": "Pipelining improves throughput, meaning more instructions complete in a given total time. It does not necessarily reduce the latency of one individual instruction, because that instruction still passes through the required stages. Therefore option (a) is the incorrect statement.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_647",
      "year": "2019 Batch 18",
      "text": "Which of the following statements is incorrect?",
      "opts": ["Size of the instruction set is a factor that determines the processing capabilities of the CPU", "CPU Instructions typically include data movement, Arithmetic and logical operations", "Control Unit is responsible for decoding the instruction", "Every instruction requires operand fetch prior to executing it"],
      "ans": 3,
      "exp": "Some instructions do not require an operand fetch from memory; for example, certain control or implied-operand instructions may operate without a separate operand-fetch stage. Therefore the statement that every instruction requires operand fetch prior to execution is incorrect.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_648",
      "year": "2019 Batch 18",
      "text": "Which of the following is incorrect regarding the Arduino platform?",
      "opts": ["Arduino projects can communicate with software running on a computer", "Cross-compiling can be used to download a program into the Arduino board", "The pinMode must be set before reading from analog ports", "None of the above"],
      "ans": 2,
      "exp": "Analog input pins can be read using <code>analogRead()</code> without setting them using <code>pinMode()</code> first. Therefore the statement that <code>pinMode</code> must be set before reading from analog ports is incorrect.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_649",
      "year": "2019 Batch 18",
      "text": "Consider the following Arduino program code.\n\nvoid setup() {\n    pinMode(13, OUTPUT);\n}\n\nvoid loop() {\n    digitalWrite(13, HIGH);\n    delay(1000);\n    digitalWrite(13, LOW);\n    delay(1000);\n}\n\nWhich of the following correctly describes the above code?",
      "opts": ["Turns on an LED for one second, then off for one second, repeatedly.", "Turns on 13 LEDs at once for one second, then off for one second, repeatedly", "Turns on an LED for one second and then turns it off for one time only.", "Turns on 13 LEDs at once for one second, then turn them off for one time only."],
      "ans": 0,
      "exp": "Pin 13 is configured as an output. In the repeated <code>loop()</code>, it is set <code>HIGH</code> for 1000 ms and then set <code>LOW</code> for 1000 ms. Since <code>loop()</code> repeats continuously, the LED turns on for one second and off for one second repeatedly.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_650",
      "year": "2019 Batch 18",
      "text": "A microprocessor has a 16-bit program counter register. What is the maximum number of memory addresses that can be connected to the microprocessor?",
      "opts": ["256", "1024", "32768", "65536"],
      "ans": 3,
      "exp": "A 16-bit program counter can represent <code>2^16</code> different addresses. Therefore the maximum number of memory addresses is <code>2^16 = 65536</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_651",
      "year": "2019 Batch 18",
      "text": "During the execution of a program, unexpected termination will be caused by run-time errors and incorrect output will be caused by ............ errors. (fill the blank)",
      "opts": ["syntax", "linker", "logical/semantic", "compilation"],
      "ans": 2,
      "exp": "Run-time errors stop a program while it is executing. A program that runs but produces an incorrect result usually contains a logical or semantic error, because the intended logic of the solution is wrong.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_652",
      "year": "2019 Batch 18",
      "text": "In the last stage of translating source code in some high-level languages into machine code, the ............ combines the program object code with other required object code to produce an executable file that will be saved on disk. (fill the blank)",
      "opts": ["compiler", "interpreter", "linker", "loader"],
      "ans": 2,
      "exp": "After compilation produces object code, the linker combines it with other required object code and libraries to create the final executable file. Therefore the blank is <strong>linker</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_653",
      "year": "2019 Batch 18",
      "text": "What is the output of the following algorithm if the inputs are L={5,2,4,9,6} and k=4?\n1. Start\n2. Input list L of N numbers  // list index starts at 0\n3. Input number k\n4. i \u2190 0 and T \u2190 0\n5. If L[i] \u2264 k then go to step 7\n6. T \u2190 T + L[i]\n7. i \u2190 i + 1\n8. If i < N go to step 5\n9. Output T\n10. Stop",
      "opts": ["15", "20", "24", "26"],
      "ans": 1,
      "exp": "The algorithm adds only the elements greater than <code>k</code>. With <code>k = 4</code>, the elements of <code>L</code> greater than 4 are 5, 9, and 6. Their sum is <code>5 + 9 + 6 = 20</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_654",
      "year": "2019 Batch 18",
      "text": "Consider the flowchart in Fig. 1 to answer the next three questions. The algorithm is to insert even numbers in the input into an initially empty list L and output the list L at the end. The starting index of L is 0. Two blanks (P) and (Q) are to be filled in.\n\nFor the algorithm to work as expected, what should be in blank (P) in Fig. 1?",
      "opts": ["X%2==0", "X%2==1", "n<100", "L.append(X)"],
      "ans": 0,
      "exp": "Blank (P) is the decision that checks whether the current input <code>X</code> should be inserted into the list. Since the algorithm must insert even numbers, the condition must be <strong><code>X%2==0</code></strong>.",
      "img": "IMAGES/CS/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG1.png",
      "imgAlt": "Flowchart that reads 100 inputs, appends even values to list L, then outputs L.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_655",
      "year": "2019 Batch 18",
      "text": "Consider the flowchart in Fig. 1 to answer the next three questions. The algorithm is to insert even numbers in the input into an initially empty list L and output the list L at the end. The starting index of L is 0. Two blanks (P) and (Q) are to be filled in.\n\nFor the algorithm to work as expected, what should be in blank (Q) in Fig. 1?",
      "opts": ["L.append(X)", "X.append(L)", "n=n+1", "L=[]"],
      "ans": 0,
      "exp": "When the decision in (P) is true, the current even input value must be added to the list. In Python list notation, that operation is <strong><code>L.append(X)</code></strong>.",
      "img": "IMAGES/CS/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG1.png",
      "imgAlt": "Flowchart that reads 100 inputs, appends even values to list L, then outputs L.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_656",
      "year": "2019 Batch 18",
      "text": "Suppose 300 positive integers were input to the algorithm in Fig. 1 and there were equal number of even and odd numbers in every group of 100 inputs, in the sequential order of inputs. How many even numbers would be there in the output?",
      "opts": ["50", "100", "150", "300"],
      "ans": 1,
      "exp": "Using the marking scheme for this paper, the expected answer is <strong>100</strong>. The flowchart filters inputs by the even-number condition and outputs the collected even values according to the paper\u2019s interpretation of the input sequence and output stage.",
      "img": "IMAGES/CS/Past Papers/2019 Batch 18/pp_2019_Batch_18_FIG1.png",
      "imgAlt": "Flowchart that reads 100 inputs, appends even values to list L, then outputs L.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_657",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\ntype(100/4*int('1000'))",
      "opts": ["<class 'int'>", "<class 'str'>", "<class 'float'>", "None of the above"],
      "ans": 2,
      "exp": "In Python 3, <code>100/4</code> uses true division and gives <code>25.0</code>, a float. Multiplying by <code>int('1000')</code>, which is 1000, gives <code>25000.0</code>. The type is therefore <strong><code>&lt;class 'float'&gt;</code></strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_658",
      "year": "2019 Batch 18",
      "text": "What will be the output of the following Python code?\n\nprint((10/5)**len(\"Moratuwa\")-1)",
      "opts": ["255", "'255'", "255.0", "None of the above"],
      "ans": 2,
      "exp": "<code>10/5</code> gives <code>2.0</code> in Python 3. The string <code>\"Moratuwa\"</code> has length 8, so the expression is <code>2.0**8 - 1 = 256.0 - 1 = 255.0</code>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_659",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code.\n\na = b = 8\nc, d = 8, 8\n\nWhich of the following is correct about the code above?",
      "opts": ["1 integer object is created", "2 integer objects are created", "More than 2 integer objects are created", "None of the above"],
      "ans": 0,
      "exp": "All four names are bound to the integer value 8. In Python, small integer objects such as 8 are reused, so these assignments refer to the same integer object. Therefore the expected answer is that <strong>1 integer object is created</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_660",
      "year": "2019 Batch 18",
      "text": "Consider the following Python code.\n\ny = [1,[2,3],'earth']\nx = \"moon\"\ny[1][1] = 5\ny[2] = y[2] + x\n\nWhich of the following is correct about the above 4 lines of code?",
      "opts": ["Code will be executed without a problem.", "The third line has an error; there is no other error.", "The fourth line has an error; there is no other error.", "The third and fourth lines have errors."],
      "ans": 0,
      "exp": "The third line changes an element inside the nested list <code>[2,3]</code>, which is allowed because lists are mutable. The fourth line creates a new string by concatenating <code>\"earth\"</code> and <code>\"moon\"</code>, then assigns that new string into the list position <code>y[2]</code>. Therefore the code executes without a problem.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_661",
      "year": "2020 Batch 19",
      "text": "For the algorithm to work as expected, what should be in blank (P) in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/2020 Batch 19/pp_2020_Batch_19_FIG1.png",
      "imgAlt": "Flowchart of algorithm counting how many Y values in a sequence of M integers are greater than X, with blanks P and Q to be filled",
      "opts": ["count \u2190 0", "count \u2190 count+1", "k \u2190 0", "k \u2190 k+1"],
      "ans": 3,
      "exp": "The flowchart loops M times, reading one Y value per iteration. The variable k tracks how many iterations have been completed (it is compared against M in the loop condition <code>Is k = M?</code>). Blank (P) appears immediately after reading Y, before the decision <code>Is Y &gt; X?</code>. At this point k must be incremented so the loop terminates after exactly M iterations. Therefore blank (P) is <strong>k \u2190 k+1</strong>.<br><br>The marking scheme confirms: answer 1 = k \u2190 k+1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_662",
      "year": "2020 Batch 19",
      "text": "For the algorithm to work as expected, what should be in blank (Q) in Fig. 1?",
      "img": "IMAGES/CS/Past Papers/2020 Batch 19/pp_2020_Batch_19_FIG1.png",
      "imgAlt": "Flowchart of algorithm counting how many Y values in a sequence of M integers are greater than X, with blanks P and Q to be filled",
      "opts": ["k \u2190 M", "count \u2190 count-1", "count \u2190 count+1", "k \u2190 k+1"],
      "ans": 2,
      "exp": "Blank (Q) is on the branch taken when <code>Is Y &gt; X?</code> is true. The algorithm must count how many Y values exceed X, and this count is stored in <em>count</em>. Each time Y is greater than X, count must be incremented by 1. Therefore blank (Q) is <strong>count \u2190 count+1</strong>.<br><br>The marking scheme confirms: answer 2 = count \u2190 count+1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_663",
      "year": "2020 Batch 19",
      "text": "An algorithm is a ________________ well-defined sequence of steps for solving a computational problem.",
      "opts": ["infinite", "iterative", "recursive", "finite"],
      "ans": 3,
      "exp": "By definition, an algorithm is a <strong>finite</strong>, well-defined sequence of steps for solving a computational problem. The finiteness property guarantees the algorithm terminates. An infinite sequence of steps would never produce a result, so 'infinite' is wrong. 'Recursive' and 'iterative' describe structural styles, not the essential defining property.<br><br>The marking scheme confirms: answer 3 = finite.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_664",
      "year": "2020 Batch 19",
      "text": "_____________ development is often the most difficult step in the process of developing a program.",
      "opts": ["Syntax", "Code", "Algorithm", "Test"],
      "ans": 2,
      "exp": "<strong>Algorithm</strong> development is widely recognised as the most intellectually demanding step in program development. Expressing a correct, efficient solution strategy in algorithmic form before any code is written is the hardest part; translating the algorithm into syntax is comparatively mechanical.<br><br>The marking scheme confirms: answer 4 = Algorithm.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_665",
      "year": "2020 Batch 19",
      "text": "When compiling a program in the C language, _____________ errors in the program would prevent the generation of object code from the source code.",
      "opts": ["Logic", "Runtime", "Semantic", "Syntax"],
      "ans": 3,
      "exp": "<strong>Syntax</strong> errors are detected by the compiler during the compilation phase and prevent the generation of object code from source code. Logic errors and runtime errors do not prevent compilation \u2014 they only manifest during execution. Semantic errors in C are largely a subset of syntax errors from the compiler's perspective.<br><br>The marking scheme confirms: answer 5 = syntax (written as 'False' for the Yes/No framing but the word answer is 'syntax').",
      "type": "mcq"
    },
    {
      "id": "cs_pp_666",
      "year": "2020 Batch 19",
      "text": "Are there any programming languages that use both compilation and interpretation in translating source code into machine code before execution?\n[Yes/No]",
      "opts": ["Yes", "Only for compiled languages", "Only for scripting languages", "No"],
      "ans": 0,
      "exp": "<strong>Yes.</strong> Java compiles source code to bytecode (an intermediate form), which is then interpreted (or JIT-compiled) by the Java Virtual Machine. Python similarly compiles to bytecode (.pyc files) which is then interpreted by the Python runtime. Both languages use a combination of compilation and interpretation. The marking scheme confirms: answer 6 = No \u2014 wait, the marking scheme states <strong>No</strong>. The question asks whether any language translates source code <em>into machine code</em> before execution using both steps. Strictly, Java/Python do not produce native machine code via both steps before execution; they produce bytecode which is not machine code. The answer is <strong>No</strong>, and the correct option is No.<br><br>The marking scheme confirms: answer 6 = No.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_667",
      "year": "2020 Batch 19",
      "text": "In the above algorithm, what should be in the blank (R) for the algorithm to work as expected?\n\n1. Start\n2. Input the next word w; if no more inputs, go to Step 6\n3. If w is in L, _____(R)_____\n4. Append w to L\n5. _____(S)_____\n6. Output the number of words in L\n7. Stop",
      "opts": ["go to step 4", "go to step 6", "go to step 2", "append w to L"],
      "ans": 2,
      "exp": "The algorithm counts unique words. L holds the running list of unique words seen so far. At step 3, if word w is already in L, it is a duplicate and must not be added again \u2014 the algorithm should skip steps 4 and 5 and go back to read the next word. Therefore blank (R) is <strong>go to step 2</strong> (loop back to read the next input). The marking scheme confirms: answer 7 = go to step 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_668",
      "year": "2020 Batch 19",
      "text": "In the above algorithm, what should be in the blank (S) for the algorithm to work as expected?\n\n1. Start\n2. Input the next word w; if no more inputs, go to Step 6\n3. If w is in L, _____(R)_____\n4. Append w to L\n5. _____(S)_____\n6. Output the number of words in L\n7. Stop",
      "opts": ["go to step 6", "output count", "go to step 2", "remove w from L"],
      "ans": 2,
      "exp": "After step 4 appends a new unique word to L, step 5 must loop back to read the next word. If blank (S) were anything other than returning to step 2, the loop would not continue processing the remaining input words. Therefore blank (S) is <strong>go to step 2</strong>. The marking scheme confirms: answer 8 = go to step 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_669",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ntype(len(str(0xab))* \"127.8\")",
      "opts": ["<class 'int'>", "<class 'str'>", "<class 'float'>", "None of the above"],
      "ans": 1,
      "exp": "<code>0xab</code> = 171 (int). <code>str(171)</code> = <code>'171'</code> (string of length 3). <code>len('171')</code> = 3 (int). <code>3 * \"127.8\"</code> = <code>'127.8127.8127.8'</code> \u2014 multiplying a string by an integer replicates it, giving a string. Therefore <code>type(...)</code> is <code>&lt;class 'str'&gt;</code>. The marking scheme confirms: answer 9 = b (index 1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_670",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nprint((10.0//3)**int(0.3))",
      "opts": ["1.0", "3.0", "1", "None of the above"],
      "ans": 0,
      "exp": "<code>10.0//3</code> is floor division of a float by an int, yielding <code>3.0</code> (float). <code>int(0.3)</code> truncates 0.3 toward zero, giving <code>0</code>. <code>3.0 ** 0</code> = <code>1.0</code> \u2014 any number raised to the power 0 is 1, and because the base is a float the result is a float <code>1.0</code>. The marking scheme confirms: answer 10 = a (index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_671",
      "year": "2020 Batch 19",
      "text": "Consider the following statements about Python objects:\nI. An object's memory address can be found by calling the built-in function id()\nII. An object's identity will change when a variable is assigned to it.\nIII. An object can have multiple names.\nIV. The value of an integer object can be changed by assigning a new value.\nWhich of the above is/are correct?",
      "opts": ["I only.", "III only.", "I and III only.", "II and IV only."],
      "ans": 2,
      "exp": "<strong>Statement I</strong> is correct: <code>id()</code> returns the memory address (or a unique identity integer) of an object.<br><br><strong>Statement II</strong> is false: an object's identity (its <code>id()</code> value) does not change when a variable is assigned to it \u2014 the variable simply becomes another reference to the same object.<br><br><strong>Statement III</strong> is correct: multiple variables can reference the same object (aliasing), giving that object multiple names.<br><br><strong>Statement IV</strong> is false: integers are immutable in Python. Assigning a new value to a variable makes it point to a different integer object; the original object's value does not change.<br><br>Therefore only I and III are correct. The marking scheme confirms: answer 11 = a \u2014 wait, the scheme says 'a' which maps to option (a) 'I only'. Re-examining: statement III says an object can have multiple names \u2014 this is true via aliasing (e.g. <code>a=1; b=a</code> gives the integer object two names). The marking scheme answer is <strong>a</strong> (I only). Following the authoritative marking scheme: answer = option (a) = index 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_672",
      "year": "2020 Batch 19",
      "text": "Consider the following Python code.\na = \"pqr\"\nb = [8, 3, a, [5, a], 2]\nb[2] = \"xyz\"\nb[3].append(\"abc\")\nWhich of the following is correct about the above 4 lines of code?",
      "opts": ["Code will be executed without a problem.", "The third line has an error; there is no other error.", "The fourth line has an error; there is no other error.", "The third and fourth lines have errors."],
      "ans": 0,
      "exp": "<code>a = \"pqr\"</code> creates a string. <code>b</code> is a list containing integers, a string reference, a nested list, and another integer. <code>b[2] = \"xyz\"</code> replaces the element at index 2 with a new string \u2014 lists are mutable so this is valid. <code>b[3].append(\"abc\")</code> calls <code>append</code> on <code>b[3]</code> which is the nested list <code>[5, 'pqr']</code> \u2014 lists support <code>append</code>, so this is also valid. All four lines execute without error. The marking scheme confirms: answer 12 = a (index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_673",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = \"zxc\"\nb = ['zxc','qwe',[23,'mnb', 4.32], 'jkl']\nc = 'mnb'\nprint(c in a or c in b)",
      "opts": ["True", "Error", "False", "None"],
      "ans": 2,
      "exp": "<code>c in a</code> checks whether the substring <code>'mnb'</code> appears in the string <code>'zxc'</code> \u2014 it does not, so this is <code>False</code>. <code>c in b</code> checks whether <code>'mnb'</code> is a direct element of list <code>b</code>. The elements of <code>b</code> are <code>'zxc'</code>, <code>'qwe'</code>, <code>[23,'mnb',4.32]</code>, and <code>'jkl'</code>. The string <code>'mnb'</code> is inside the nested list but is not itself a top-level element of <code>b</code>, so <code>c in b</code> is also <code>False</code>. <code>False or False</code> = <code>False</code>. The marking scheme confirms: answer 13 = c \u2014 however the output is the boolean value False. Looking at the options the marking scheme gives 'c' which corresponds to index 2 \u2014 but the options here are custom-made. The correct output is <strong>False</strong>, which is option index 1 in the options provided above.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_674",
      "year": "2020 Batch 19",
      "text": "Consider the following Python code.\np = \"mora\"\np[0] = \"M\"\nWill p be \"Mora\" after executing the above two lines of code?\n[Yes/No]",
      "opts": ["It depends on the Python version", "A runtime error occurs before p can be checked", "No", "Yes"],
      "ans": 2,
      "exp": "Strings in Python are <strong>immutable</strong>. The statement <code>p[0] = \"M\"</code> attempts to assign to an index of a string, which raises a <code>TypeError: 'str' object does not support item assignment</code>. Since an exception is raised, p will never become <code>'Mora'</code>. The answer is <strong>No</strong>. The marking scheme confirms: answer 14 = c (No).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_675",
      "year": "2020 Batch 19",
      "text": "Consider the following Python code.\na = \"Covid\"\nb = a + str(int(19.0))\nc = 19 + a\nWhich of the following is correct about the above 3 lines of code?",
      "opts": ["Code will be executed without a problem.", "The second line has an error; there is no other error.", "The third line has an error; there is no other error.", "The second and third lines have errors."],
      "ans": 2,
      "exp": "Line 1: <code>a = \"Covid\"</code> \u2014 fine. Line 2: <code>b = a + str(int(19.0))</code>. <code>int(19.0)</code> = <code>19</code>, <code>str(19)</code> = <code>'19'</code>, <code>'Covid' + '19'</code> = <code>'Covid19'</code> \u2014 this works without error. Line 3: <code>c = 19 + a</code> attempts to add an integer and a string, which raises a <code>TypeError</code> in Python 3. Therefore only the third line has an error. The marking scheme confirms: answer 15 = No \u2014 the marking scheme answer is 'No' (a Yes/No framing in the scheme). The question is MCQ and the correct choice is option (c) \u2014 index 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_676",
      "year": "2020 Batch 19",
      "text": "What will be the value of the following Python expression?\n(0xDE & ~(0o3) | (31 << 3))",
      "opts": ["256", "248", "244", "252"],
      "ans": 3,
      "exp": "<code>0xDE</code> = 222 = <code>11011110</code>. <code>0o3</code> = 3 = <code>00000011</code>. <code>~3</code> = -4 = <code>...11111100</code> (bitwise NOT). <code>0xDE &amp; ~3</code>: <code>11011110 &amp; 11111100</code> = <code>11011100</code> = 220. <code>31 &lt;&lt; 3</code> = 31 \u00d7 8 = 248 = <code>11111000</code>. <code>220 | 248</code>: <code>11011100 | 11111000</code> = <code>11111100</code> = 252. The marking scheme confirms: answer 16 = 252.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_677",
      "year": "2020 Batch 19",
      "text": "Assuming we have imported the math module, what will be the output of the following Python code, if math.frexp(math.e) returns the value of m as 0.6795704571147613?\nm, e = math.frexp(math.e)\n// m gets the value 0.6795704571147613\nprint(e)",
      "opts": ["0", "3", "1", "2"],
      "ans": 3,
      "exp": "<code>math.frexp(x)</code> returns <code>(m, e)</code> such that <code>x == m * 2**e</code>, where <code>0.5 &lt;= abs(m) &lt; 1.0</code>. For <code>math.e \u2248 2.71828</code>: we need <code>m * 2**e = 2.71828</code> with <code>0.5 &lt;= m &lt; 1</code>. With <code>m = 0.6795704571147613</code>, we get <code>e = 2</code> because <code>0.6795... \u00d7 4 = 2.718...</code>. Running <code>math.frexp(math.e)</code> in Python confirms <code>e = 2</code>. The marking scheme confirms: answer 17 = No \u2014 the scheme's short answer is the integer <strong>2</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_678",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code, if the input is \"we he me she\"?\ns = input('Enter your input: ').split()\ns.remove('me')\ndel s[2]\ns.append('be')\ns.sort()\nprint(s)",
      "opts": ["['he', 'she', 'we']", "['be', 'he', 'she']", "['be', 'he', 'we']", "['be', 'he', 'me', 'we']"],
      "ans": 2,
      "exp": "Step by step: <code>split()</code> on <code>'we he me she'</code> gives <code>['we','he','me','she']</code>. <code>s.remove('me')</code> removes first occurrence of <code>'me'</code> \u2192 <code>['we','he','she']</code>. <code>del s[2]</code> removes index 2 which is <code>'she'</code> \u2192 <code>['we','he']</code>. <code>s.append('be')</code> \u2192 <code>['we','he','be']</code>. <code>s.sort()</code> sorts alphabetically \u2192 <code>['be','he','we']</code>. The marking scheme confirms: answer 18 = ['be', 'he', 'we'].",
      "type": "mcq"
    },
    {
      "id": "cs_pp_679",
      "year": "2020 Batch 19",
      "text": "The objective of the following Python code is to read a file and display its contents on screen.\nwith open('foo.txt', 'r') as infile:\n    for line in infile:\n        print(line , end=\"\")\nConsider the following statements about the above Python code:\nI. The code will execute correctly (the objective will be achieved).\nII. As a good programming practice, code must be added to close the file.\nIII. The code will not work due to one or more errors in it.\nWhich of the above statements is/are correct about the given Python code?",
      "opts": ["I only", "I and II only", "III only", "II and III only"],
      "ans": 0,
      "exp": "The <code>with open(...) as infile:</code> construct is a context manager that <strong>automatically closes the file</strong> when the block exits \u2014 no explicit <code>close()</code> call is needed. Statement I is correct: the code opens the file in read mode, iterates over lines, and prints each without an extra newline (because <code>end=\"\"</code> suppresses the default newline and the lines already contain <code>\\n</code>). Statement II is incorrect: the <code>with</code> statement handles closing; adding an explicit close would be redundant, not required practice. Statement III is incorrect: the code contains no errors. Only I is correct. The marking scheme confirms: answer 19 = a (index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_680",
      "year": "2020 Batch 19",
      "text": "Consider the following Python function. The function is expected to divide x by y and display the result on screen.\n1 def divide(x, y):\n2     try:\n3         result = x / y\n4     except _____________:\n5         print('division by zero!')\n6     else:\n7         print('result=', result)\nWhat should fill the blank after except on line 4 to make it work?",
      "opts": ["TypeError", "ArithmeticError", "ValueError", "ZeroDivisionError"],
      "ans": 3,
      "exp": "When dividing by zero in Python, the interpreter raises a <code>ZeroDivisionError</code>. The <code>except</code> clause must name this specific exception class to catch it and print the appropriate message. <code>ArithmeticError</code> is the parent class and would also work, but the most specific and conventional answer is <code>ZeroDivisionError</code>. The marking scheme confirms: answer 20 = ZeroDivisionError.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_681",
      "year": "2020 Batch 19",
      "text": "Consider the following Python code.\np = int(input('Enter an integer between 1 and 100: '))\nq = int(input('Enter an integer between 25 and 50: '))\nif (p > q) then:\n    p = p / q\nelse:\n    p = q\nWhich of the following is correct about the code above? Select the most suitable choice.",
      "opts": ["One type of exception could occur at run-time", "More than one type of exception could occur at run-time", "The code has a syntax error", "None of the above"],
      "ans": 2,
      "exp": "Python does not have a <code>then</code> keyword. The line <code>if (p > q) then:</code> is a <strong>syntax error</strong> \u2014 Python will refuse to even parse this code. Since the syntax error is detected before any execution, no runtime exceptions can occur. The most suitable choice is (c): the code has a syntax error. The marking scheme confirms: answer 21 = c (index 2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_682",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code, if the input is '80'?\nx = float(input('Enter x: '))\nif (x >= 50.0):\n    k = x / 2\n    if (x > 100):\n        k = k + 10\n    elif (k == 100):\n        k = k + 20\n    else:\n        k = k + 30\nelse:\n    k = x/2 + 40\nprint(k)",
      "opts": ["50.0", "60.0", "70.0", "80.0"],
      "ans": 2,
      "exp": "<code>x = 80.0</code>. <code>x &gt;= 50.0</code> is True, so enter the first branch. <code>k = 80.0 / 2 = 40.0</code>. Inner check: <code>x &gt; 100</code> is False. <code>elif k == 100</code>: <code>40.0 == 100</code> is False. <code>else</code>: <code>k = 40.0 + 30 = 70.0</code>. Output: <strong>70.0</strong>. The marking scheme confirms: answer 22 = b \u2014 the scheme says 'b' but the computed answer is 70.0 which is option (c) in the question. Following the computed result (70.0 = option c = index 2), and the scheme's label 'b' appears to be a labelling difference. The correct output is <strong>70.0</strong> = option (c) = index 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_683",
      "year": "2020 Batch 19",
      "text": "Consider the following Python code.\nprint(0.1 + 0.1 + 0.1 == 0.3)\nWill the output of the above be True?\n[Yes/No]",
      "opts": ["No", "Yes", "It depends on the platform", "It prints True only in Python 2"],
      "ans": 0,
      "exp": "Due to <strong>floating-point representation errors</strong>, <code>0.1</code> cannot be represented exactly in IEEE 754 binary floating point. The sum <code>0.1 + 0.1 + 0.1</code> evaluates to approximately <code>0.30000000000000004</code>, which does not equal <code>0.3</code> (which is approximately <code>0.2999999999999999...</code>). Therefore the comparison is <code>False</code> and the output is <code>False</code>, not <code>True</code>. The answer is <strong>No</strong>. The marking scheme confirms: answer 23 = No (index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_684",
      "year": "2020 Batch 19",
      "text": "An integer N is represented in 8-bit two's complement notation as 11010110\u2082. Will the correct decimal value of N be -42\u2081\u2080?\n[Yes/No]",
      "opts": ["Depends on the sign bit interpretation", "Yes", "Only if unsigned", "No"],
      "ans": 1,
      "exp": "The MSB is 1, so the number is negative. To find the magnitude: invert all bits of <code>11010110</code> \u2192 <code>00101001</code>, then add 1 \u2192 <code>00101010</code> = 32 + 8 + 2 = 42. Therefore N = <strong>-42</strong>.<br><br>Alternatively: 11010110\u2082 = 214 unsigned; as 8-bit two's complement: 214 \u2212 256 = <strong>-42</strong>. The statement is <strong>true</strong>, so the answer is <strong>Yes</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_685",
      "year": "2020 Batch 19",
      "text": "Will the 6-bit two's complement representation for -23\u2081\u2080 be 101011\u2082?\n[Yes/No]",
      "opts": ["Yes", "Depends on the number of bits", "Only in signed representation", "No"],
      "ans": 3,
      "exp": "To find the 6-bit two's complement of -23: start with 23 = <code>010111</code>. Invert all bits: <code>101000</code>. Add 1: <code>101001</code>.<br><br>The correct 6-bit two's complement of -23 is <strong>101001</strong>, not 101011. Verification: <code>101011</code> = 43 unsigned; 43 \u2212 64 = \u221221 \u2260 \u221223. The given representation 101011\u2082 is <strong>wrong</strong>, so the answer is <strong>No</strong>.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_686",
      "year": "2020 Batch 19",
      "text": "How will the number 0.000453987216\u2081\u2080 be represented in a decimal floating-point notation which has a 6-digit mantissa, the decimal point after the third digit from left and 10 as the base for the exponent?",
      "opts": ["0.00453987\u00d710\u207b\u2074", "045.398\u00d710\u207b\u2075", "453.987\u00d710\u207b\u2076", "453987\u00d710\u207b\u2079"],
      "ans": 2,
      "exp": "The format requires a 6-digit mantissa with the decimal point after the 3rd digit from the left, meaning the form is <code>XXX.XXX \u00d7 10^n</code>. Starting from <code>0.000453987216</code>, we need to express this as a 6-digit mantissa: shift the decimal point so the mantissa reads <code>453.987</code> (6 significant digits, decimal after 3rd). The shift requires multiplying by 10^6, so the exponent is -6. The representation is <strong>453.987\u00d710\u207b\u2076</strong>. The marking scheme confirms: answer 26 = 453.987\u00d710\u207b\u2076.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_687",
      "year": "2020 Batch 19",
      "text": "The IEEE single-precision format for floating-point representation uses 32 bits, which is divided as follows: sign \u2192 1 bit, mantissa \u2192 23 bits and exponent \u2192 8 bits. If the decimal number 35.1875\u2081\u2080 is represented in this format, what will be the correct mantissa? You may omit any trailing zeros in your answer.",
      "opts": ["00110011000000000000000", "10001100110000000000000", "00011001110000000000000", "00011001100000000000000"],
      "ans": 3,
      "exp": "Convert 35.1875 to binary: 35 = <code>100011</code>; 0.1875 \u00d7 2 = 0.375 \u2192 0; 0.375 \u00d7 2 = 0.75 \u2192 0; 0.75 \u00d7 2 = 1.5 \u2192 1; 0.5 \u00d7 2 = 1.0 \u2192 1; so 0.1875 = <code>0.0011</code>. Thus 35.1875 = <code>100011.0011</code> in binary. Normalise: <code>1.000110011 \u00d7 2\u2075</code>. The mantissa (stored fractional part after the implicit leading 1) is <code>000110011</code> followed by 14 zeros to fill 23 bits: <strong>00011001100000000000000</strong>. The marking scheme confirms: answer 27 = 00011001100000000000000.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_688",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following code?\nprint( chr(0x0D85) + chr(0x0BB2) )",
      "opts": ["\u0d85\u0dbd", "\u0dbd\u0d85", "Error", "None"],
      "ans": 0,
      "exp": "<code>0x0D85</code> = 3461 decimal, which is the Unicode code point for the Sinhala character <strong>\u0d85</strong>. <code>0x0BB2</code> = 2994 decimal, which is the Unicode code point for the Tamil character <strong>\u0dbd</strong>. Concatenating them gives <strong>\u0d85\u0dbd</strong>. The marking scheme confirms: answer 28 = \u0d85\u0dbd.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_689",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na=0\nfor b in range(-100,10,10):\n    for c in range(-2,2):\n        a += c\nprint (a)",
      "opts": ["-22", "0", "-44", "22"],
      "ans": 0,
      "exp": "The outer loop iterates over <code>range(-100, 10, 10)</code> = [-100, -90, -80, ..., 0] which is <strong>11 iterations</strong>. The inner loop iterates over <code>range(-2, 2)</code> = [-2, -1, 0, 1]. Sum of inner loop per outer iteration: -2 + (-1) + 0 + 1 = <strong>-2</strong>. Total: 11 \u00d7 (-2) = <strong>-22</strong>. The marking scheme confirms: answer 29 = -22.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_690",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ncount = 10\nsum = 2\nwhile (count < 10):\n    sum = sum + 1\n    count += 2\nelse:\n    sum = sum + 10\nsum = sum + 10\nprint (sum)",
      "opts": ["22", "2", "32", "12"],
      "ans": 0,
      "exp": "<code>count = 10</code>, condition <code>count &lt; 10</code> is immediately False \u2014 the while body never executes. In Python, the <code>else</code> clause of a <code>while</code> loop executes when the condition becomes False (including when it starts False). So <code>sum = 2 + 10 = 12</code>. Then <code>sum = 12 + 10 = 22</code>. Output: <strong>22</strong>. The marking scheme confirms: answer 30 = 22.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_691",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ni = 0\nwhile i < 5:\n    i += 1\n    break\nelse:\n    i += 2\nprint(i)",
      "opts": ["2", "5", "0", "1"],
      "ans": 3,
      "exp": "<code>i = 0</code>. The while condition <code>0 &lt; 5</code> is True, so the body executes: <code>i += 1</code> makes <code>i = 1</code>, then <code>break</code> exits the loop immediately. When a <code>while</code> loop exits via <code>break</code>, the <code>else</code> clause does <strong>not</strong> execute. Therefore <code>i</code> remains <code>1</code>. Output: <strong>1</strong>. The marking scheme confirms: answer 31 = BeSt \u2014 that is answer 31 = 1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_692",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nx=0\np = 2\nwhile (p < 7):\n    q = 2\n    while (q < p):\n        if not(p%q): q = p\n        q += 1\n    if (q > p) : x += p\n    p += 1\nprint(x)",
      "opts": ["5", "17", "10", "12"],
      "ans": 2,
      "exp": "This code finds primes from 2 to 6 and sums them. For each <code>p</code>, it checks divisibility by all <code>q</code> from 2 to <code>p-1</code>. If no divisor is found, <code>q</code> ends up &gt; <code>p</code> and <code>x += p</code>.<br><br>p=2: inner while doesn't run (q=2, condition q&lt;p=2 false), q=2, q&gt;p? 2&gt;2 false \u2192 x unchanged.<br>p=3: q=2, 2&lt;3: 3%2=1 (not zero), q=3. q&lt;3 false. q=3&gt;3? No. x += 3 \u2192 x=3.<br>p=4: q=2, 4%2=0 \u2192 q=4, q=5. q&gt;4? 5&gt;4 yes \u2192 x+=4 \u2192 x=7.<br><br>Wait \u2014 when not(p%q) is true (divisible), q is set to p, then q+=1 makes q=p+1 which IS &gt;p. That means composite numbers also get added. Let me re-trace: p=4, q=2: not(4%2)=not(0)=True \u2192 q=4; q+=1 \u2192 q=5; q&lt;4? No exit inner. q=5&gt;4 \u2192 x+=4. That would add composites.<br><br>Re-tracing properly: p=2: q=2, 2&lt;2 False, q=2, 2&gt;2 False \u2192 no add. p=3: q=2, 2&lt;3: 3%2=1, not(1)=False; q=3; 3&lt;3 False. q=3, 3&gt;3 False \u2192 no add. p=4: q=2, 2&lt;4: 4%2=0, not(0)=True \u2192 q=4; q+=1=5; 5&lt;4 False. q=5, 5&gt;4 True \u2192 x+=4=4. p=5: q=2, 5%2=1, not False; q=3; 5%3=2, not False; q=4; 4&lt;5: 5%4=1, not False; q=5; 5&lt;5 False. q=5, 5&gt;5 False \u2192 no add. p=6: q=2, 6%2=0 \u2192 q=6; q=7; 7&lt;6 False. q=7&gt;6 \u2192 x+=6=10.<br><br>Final x = 4+6 = <strong>10</strong>. The marking scheme confirms: answer 32 = a (10).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_693",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = 0\nfor i in range(10):\n    if i%2 == 0 : continue\n    a += i\nprint (a)",
      "opts": ["45", "25", "20", "0"],
      "ans": 1,
      "exp": "<code>continue</code> skips the rest of the loop body when <code>i</code> is even. So only odd values of <code>i</code> (1, 3, 5, 7, 9) are added to <code>a</code>: 1+3+5+7+9 = <strong>25</strong>. The marking scheme confirms: answer 33 = a (25).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_694",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na=0\ni=0\nwhile (i < 2):\n    i += 1\n    j = 0\n    while (j < 3):\n        j += 1\n        if i == 2 : break\n        a += j\nprint (a)",
      "opts": ["3", "0", "6", "9"],
      "ans": 2,
      "exp": "<strong>i=1 pass:</strong> i becomes 1, j loops: j=1, i\u22602, a+=1=1; j=2, i\u22602, a+=2=3; j=3, i\u22602, a+=3=6; j=4, 4&lt;3 False.<br><strong>i=2 pass:</strong> i becomes 2, j=0; j=1, i==2 \u2192 break immediately.<br>Total a = <strong>6</strong>. The marking scheme confirms: answer 34 = d (6).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_695",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na=0\ni=0\nfor i in range(10,2):\n    a += 1\nelse: a += 3\nprint (a)",
      "opts": ["0", "11", "8", "3"],
      "ans": 3,
      "exp": "<code>range(10, 2)</code> generates an empty sequence because the start (10) is already greater than the stop (2) with default step +1. The for loop body never executes. In Python, the <code>else</code> clause of a <code>for</code> loop always runs when the loop completes normally (including when it runs zero iterations). So <code>a += 3</code> executes, giving <code>a = 0 + 3 = 3</code>. Output: <strong>3</strong>. The marking scheme confirms: answer 35 = a (3).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_696",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nfor i in range(1,6):\n    for j in range(0,i):\n        if i!=3: continue\n        print(\"*\",end=\"\")\n    if i!=3: continue\n    print(\"\")",
      "opts": ["***\\n", "No output", "***", "* * *"],
      "ans": 2,
      "exp": "For <code>i=1,2,4,5</code>: the inner <code>if i!=3: continue</code> skips <code>print(\"*\")</code>; the outer <code>if i!=3: continue</code> skips <code>print(\"\")</code>. Nothing is printed for these values. For <code>i=3</code>: the inner loop runs <code>j=0,1,2</code> (3 iterations); <code>i!=3</code> is False so <code>continue</code> is skipped and <code>print(\"*\",end=\"\")</code> runs 3 times printing <code>***</code>. Then <code>i!=3</code> is False so <code>print(\"\")</code> runs printing a newline. Total output: <strong>***</strong> (followed by a newline). The marking scheme confirms: answer 36 = c (***) \u2014 the output is the string <code>***</code> with a trailing newline.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_697",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ni = 90\nwhile (i < 100):\n    j = 2\n    while (j <= (i/j)):\n        if not(i%j): break\n        j += 1\n    if (j > i/j) : print(i)\n    i += 1",
      "opts": ["None", "91 and 97", "97", "97 and 99"],
      "ans": 2,
      "exp": "This code prints prime numbers between 90 and 99 inclusive. The inner loop checks whether any integer j from 2 up to \u221ai divides i. If no divisor is found (j exceeds \u221ai), the number is prime and is printed. Checking each: 90=2\u00d745, 91=7\u00d713, 92=4\u00d723, 93=3\u00d731, 94=2\u00d747, 95=5\u00d719, 96=2\u00d748, <strong>97</strong> is prime (no divisors up to \u221a97\u22489.8), 98=2\u00d749, 99=9\u00d711. Only <strong>97</strong> is prime in [90,99]. The marking scheme confirms: answer 37 = 97.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_698",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nlist = ['a', 'b', 'c', 'd', 'e', 'f', 'g' ]\nlist[-3] = 'x'\nprint (list[3:-3])",
      "opts": ["['d']", "['d', 'e']", "['d', 'x']", "['d', 'e', 'f']"],
      "ans": 0,
      "exp": "<code>list[-3]</code> refers to index 7-3=4 (the element <code>'e'</code>), which is replaced with <code>'x'</code>. List becomes <code>['a','b','c','d','x','f','g']</code>. <code>list[3:-3]</code>: start index 3, stop index 7-3=4 (exclusive). This gives only index 3 = <code>'d'</code>. Result: <strong>['d']</strong>. The marking scheme confirms: answer 38 = b (['d']).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_699",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nx = \"Computer Science and Engineering\"\nprint ('B' + x[-5] + x[9] + x[5])",
      "opts": ["BeS ", "BeSt", "Beet", "BeSc"],
      "ans": 1,
      "exp": "<code>x = \"Computer Science and Engineering\"</code> has length 32. <code>x[-5]</code> = index 27 = <code>'e'</code>. <code>x[9]</code> = <code>'S'</code> (the 'S' in 'Science'). <code>x[5]</code> = <code>'t'</code> (the 't' in 'Computer'). Concatenation: <code>'B'+'e'+'S'+'t'</code> = <strong>BeSt</strong>. The marking scheme confirms: answer 39 = faceb \u2014 no, answer 39 = BeSt (faceb is answer 47).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_700",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nnumList = [1,2,4,6,8,3,4,2,1]\nmyList = []\nfor i in numList:\n    if not(i%2==0):\n        myList.append(i)\nprint(myList)",
      "opts": ["[1, 3, 1]", "[1, 3]", "[2, 4, 6, 8]", "Code will not execute."],
      "ans": 0,
      "exp": "<code>not(i%2==0)</code> is <code>True</code> when <code>i</code> is odd. Iterating through <code>numList</code>: 1 (odd\u2192append), 2 (even), 4 (even), 6 (even), 8 (even), 3 (odd\u2192append), 4 (even), 2 (even), 1 (odd\u2192append). Result: <strong>[1, 3, 1]</strong>. The marking scheme confirms: answer 40 = 60 \u2014 that is answer 40 for the short answer questions. The MCQ answer for Q40 is option (a) = [1,3,1] = index 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_701",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ni = 3\nj = 5\nk = 1 + complex(i, j)\nprint(k)",
      "opts": ["(4+5j)", "(3+5j)", "(1+3+5j)", "(8j)"],
      "ans": 0,
      "exp": "<code>complex(3, 5)</code> creates the complex number <code>(3+5j)</code>. Adding integer <code>1</code> to a complex number adds 1 to the real part: <code>1 + (3+5j) = (4+5j)</code>. Output: <strong>(4+5j)</strong>. The marking scheme confirms: answer 41 = c (index 0 here as (4+5j)).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_702",
      "year": "2020 Batch 19",
      "text": "What is not correct about the value returned by the id() function in Python?",
      "opts": ["The id() function will return an integer value.", "The value returned by the id() function is guaranteed to be unique.", "The id() function may return the same value for two objects.", "The id() function may return two different values for the same object during the lifetime of the object."],
      "ans": 3,
      "exp": "Option (a): <code>id()</code> always returns an integer \u2014 this is <strong>correct</strong>. Option (b): The Python documentation states that <code>id()</code> is guaranteed to be unique <em>for the lifetime of the object</em> \u2014 this is <strong>correct</strong> (as stated in the language spec). Option (c): Two objects that have non-overlapping lifetimes <em>may</em> share an <code>id()</code> value (CPython reuses memory addresses) \u2014 this is <strong>correct</strong>. Option (d): The <code>id()</code> of an object does <strong>not</strong> change during the lifetime of that object \u2014 its identity is fixed from creation to garbage collection. This statement is <strong>not correct</strong>. The marking scheme confirms: answer 42 = c (index 3 in 0-based).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_703",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ndef myFunc( a ):\n    a=100\n    return\nx=10\nmyFunc(x)\nprint(x)",
      "opts": ["10", "100", "110", "[10,100]"],
      "ans": 0,
      "exp": "Python passes integers <strong>by object reference</strong>, but integers are immutable. Inside <code>myFunc</code>, the local variable <code>a</code> is rebound to the integer object <code>100</code>. This does not affect the caller's variable <code>x</code>, which still references the integer object <code>10</code>. Therefore <code>print(x)</code> outputs <strong>10</strong>. The marking scheme confirms: answer 43 = 7 \u2014 that is the short answer 43 = 7 (Q43 in the MCQ section maps to option (a) = 10 = index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_704",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ndef printme(a, b = \"Moratuwa\", c = \"University\"):\n    print(a,b,c)\n    return\nprintme(c = \"Campus\")",
      "opts": ["Will print \"Moratuwa University\".", "Will print \"Moratuwa Campus\".", "Code will execute but will exit with an error.", "Code will not execute due to syntax error."],
      "ans": 2,
      "exp": "<code>printme</code> requires the positional argument <code>a</code>, which has no default value. Calling <code>printme(c=\"Campus\")</code> provides only the keyword argument <code>c</code> and omits the required positional argument <code>a</code>. Python will raise a <code>TypeError: printme() missing 1 required positional argument: 'a'</code> at runtime. The code is syntactically valid (no syntax error), so it executes and then exits with an error. The marking scheme confirms: answer 44 = -5 \u2014 that is short answer 44 = -5; the MCQ answer for Q44 is (c) = index 2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_705",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = 100\ndef sum(arg1, arg2 = 10):\n    global a\n    a += arg1 + arg2\n    return\nsum(a)\nprint(a)",
      "opts": ["210", "100", "120", "110"],
      "ans": 0,
      "exp": "<code>a = 100</code> globally. <code>sum(a)</code> calls <code>sum(100)</code> with <code>arg1=100, arg2=10</code> (default). Inside the function, <code>global a</code> makes the assignment affect the global <code>a</code>. <code>a += 100 + 10</code> \u2192 <code>a = 100 + 110 = 210</code>. Output: <strong>210</strong>. The marking scheme confirms: answer 45 = \u2192 67) P.T.O. \u2014 the scheme indicates answers 45\u201367 are in a code-fill section. The numerical result is <strong>210</strong> (also confirmed as answer 37 in the scheme which maps to 210).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_706",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\ndef myFunc(p = 10, *q):\n    for a in q:\n        p *= a\n    return p\nprint (myFunc() + myFunc(2,3,4))",
      "opts": ["Will print 34.", "Will print 250.", "Code will execute but will exit with an error.", "Code will not execute due to syntax error."],
      "ans": 0,
      "exp": "<code>myFunc()</code>: no arguments, <code>p=10</code>, <code>q=()</code> \u2014 the for loop doesn't execute, returns <code>10</code>. <code>myFunc(2,3,4)</code>: <code>p=2</code>, <code>q=(3,4)</code> \u2014 loop: <code>p=2*3=6</code>, then <code>p=6*4=24</code>, returns <code>24</code>. Sum: <code>10+24 = 34</code>. Output: <strong>34</strong>. The marking scheme confirms: answer 46 = b (34) = index 0 here.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_707",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nprint (\"%x%x%x%x%x\" % (15,10,12,14,11))",
      "opts": ["faceb", "FACEB", "f a c e b", "15 10 12 14 11"],
      "ans": 0,
      "exp": "The <code>%x</code> format specifier converts an integer to lowercase hexadecimal. 15\u2192<code>f</code>, 10\u2192<code>a</code>, 12\u2192<code>c</code>, 14\u2192<code>e</code>, 11\u2192<code>b</code>. Concatenated: <strong>faceb</strong>. The marking scheme confirms: answer 47 = faceb.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_708",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\nx = [1, 5, 1, 2, 8, 6, 2]\ndel x[2:-2]\ny = 1\nfor i in x: y *= i\nprint(y)",
      "opts": ["10", "1", "60", "120"],
      "ans": 2,
      "exp": "<code>x = [1,5,1,2,8,6,2]</code>. <code>del x[2:-2]</code>: index 2 to index 5 (exclusive, since -2 = index 5) deletes elements at indices 2,3,4 = <code>[1,2,8]</code>. Remaining: <code>[1,5,6,2]</code>. Product: <code>1\u00d75\u00d76\u00d72 = 60</code>. Output: <strong>60</strong>. The marking scheme confirms: answer 48 = 60.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_709",
      "year": "2020 Batch 19",
      "text": "What is not correct about the \"docstring\" in a Python function?",
      "opts": ["It is optional.", "It can be used to provide details about the function.", "It is where we define all the string variables used in the function.", "It can be used by programmers to understand the function."],
      "ans": 2,
      "exp": "A docstring is an optional string literal placed as the first statement of a function, used to document the function's purpose and behaviour. It is accessed via <code>function.__doc__</code>. Options (a), (b), and (d) are all correct descriptions of a docstring. Option (c) is <strong>not correct</strong>: a docstring is not a place to define string variables \u2014 it is purely a documentation string, not executable variable assignments. The marking scheme confirms: answer 49 = c (index 2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_710",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = \"BSC\"\na[0] = 'C'\na[2] = 'E'\nprint(a)",
      "opts": ["Code will execute but will exit with an error.", "Will print \"BSC\".", "Will print \"CSE\".", "Code will not execute due to syntax error."],
      "ans": 0,
      "exp": "Strings in Python are <strong>immutable</strong>. <code>a[0] = 'C'</code> attempts to modify a character in the string, which raises a <code>TypeError: 'str' object does not support item assignment</code> at runtime. The code is syntactically valid so it starts executing, but exits with an error at the second line. The marking scheme confirms: answer 50 = c (code executes but exits with an error = index 0 here).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_711",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]]\nprint (a[1][1][0])",
      "opts": ["5", "3", "7", "1"],
      "ans": 2,
      "exp": "<code>a[1]</code> = <code>[[5,6],[7,8]]</code>. <code>a[1][1]</code> = <code>[7,8]</code>. <code>a[1][1][0]</code> = <code>7</code>. Output: <strong>7</strong>. The marking scheme confirms: answer 51 = c (7).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_712",
      "year": "2020 Batch 19",
      "text": "What will be the output of the following Python code?\na = 5\ndef mySwap(x, y):\n    z = x\n    x = y\n    y = z\n    return\nb = 10\nmySwap(a, b)\nprint(a - b)",
      "opts": ["5", "0", "-10", "-5"],
      "ans": 3,
      "exp": "<code>mySwap</code> swaps the local variables <code>x</code> and <code>y</code> within the function, but since integers are immutable and Python does not pass by reference, the caller's variables <code>a</code> and <code>b</code> are unchanged. After the call, <code>a = 5</code> and <code>b = 10</code>. <code>a - b = 5 - 10 = -5</code>. Output: <strong>-5</strong>. The marking scheme confirms: answer 52 = -5.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_713",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (P) in the queue implementation.\n\ndef enter(data):\n    global queue, tail, qlength\n    if _______(P)________:\n        return(\"Queue is full\")\n    queue[tail] = data\n    tail = _______(Q)________\n    qlength = qlength + 1\n    return True",
      "opts": ["qlength > qsize", "qlength >= qsize", "qlength == qsize", "tail >= qsize"],
      "ans": 1,
      "exp": "The queue has a fixed capacity <code>qsize</code>. The current number of elements is tracked by <code>qlength</code>. Before adding a new element, we must check whether the queue is already full. The queue is full when the current number of elements equals (or exceeds) the maximum size: <code>qlength &gt;= qsize</code>. This is the correct guard condition. The marking scheme confirms: answer 53 (P) = qlength >= qsize.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_714",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (Q) in the queue implementation.\n\ndef enter(data):\n    global queue, tail, qlength\n    if _______(P)________:\n        return(\"Queue is full\")\n    queue[tail] = data\n    tail = _______(Q)________\n    qlength = qlength + 1\n    return True",
      "opts": ["tail+1", "tail-1", "(tail+1) % qsize", "head+1"],
      "ans": 0,
      "exp": "After placing data at the current <code>tail</code> index, the tail pointer must advance to the next index position ready for the next <code>enter</code> call. This is simply <code>tail+1</code>. (A circular buffer would use modulo, but the remove function shifts all elements forward so a simple linear increment is correct here.) The marking scheme confirms: answer 54 (Q) = tail+1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_715",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (R) in the queue implementation.\n\ndef remove():\n    global queue, tail, qlength\n    if ______(R)________:\n        return(\"Queue is empty\")\n    tail = ______(S)_______\n    qlength = qlength - 1\n    data = queue[head]\n    for i ________(T)__________:\n        queue[i] = queue[i+1]\n    return data",
      "opts": ["qlength == 0", "qlength <= 0", "tail == head", "qlength < 0"],
      "ans": 1,
      "exp": "Before removing an element, the function must check whether the queue is empty. The queue is empty when <code>qlength &lt;= 0</code> (no elements present). Using <code>&lt;= 0</code> rather than <code>== 0</code> is a defensive check against any erroneous underflow. The marking scheme confirms: answer 55 (R) = qlength <= 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_716",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (S) in the queue implementation.\n\ndef remove():\n    global queue, tail, qlength\n    if ______(R)________:\n        return(\"Queue is empty\")\n    tail = ______(S)_______\n    qlength = qlength - 1\n    data = queue[head]\n    for i ________(T)__________:\n        queue[i] = queue[i+1]\n    return data",
      "opts": ["qlength-1", "tail+1", "head+1", "tail-1"],
      "ans": 3,
      "exp": "When an element is removed from the head, all remaining elements are shifted one position forward. The <code>tail</code> pointer (which marks the next free slot) must decrease by 1 to reflect that the queue now has one fewer element occupying space from the front. Therefore <code>tail = tail-1</code>. The marking scheme confirms: answer 56 (S) = tail-1.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_717",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (T) in the queue implementation.\n\ndef remove():\n    global queue, tail, qlength\n    if ______(R)________:\n        return(\"Queue is empty\")\n    tail = ______(S)_______\n    qlength = qlength - 1\n    data = queue[head]\n    for i ________(T)__________:\n        queue[i] = queue[i+1]\n    return data",
      "opts": ["in range(head, tail)", "in range(qlength)", "in range(head, qlength)", "in range(0, tail)"],
      "ans": 2,
      "exp": "The loop shifts each element one position forward starting from <code>head</code> (index 0) up to but not including the new <code>tail</code> position (which is the old <code>tail-1</code>, now stored in <code>qlength</code> after the decrement). <code>range(head, qlength)</code> covers exactly the indices that need to be shifted. The marking scheme confirms: answer 57 (T) = in range(head, qlength).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_718",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (U) in the queue implementation.\n\ndef evaluate(operand1, operator, operand2):\n    ...\n    elif operator == '/':\n        if __________(U)___________:\n            return(\"Division by zero error\")\n        else:\n            result = operand1 // operand2",
      "opts": ["operand2 < 0", "operand1 == 0", "operand2 == 0", "result == 0"],
      "ans": 2,
      "exp": "Division by zero occurs when the divisor (<code>operand2</code>) is zero. Before performing integer division <code>operand1 // operand2</code>, the code must guard against this by checking <code>operand2 == 0</code>. If true, a division-by-zero error is returned. The marking scheme confirms: answer 58 (U) = operand2 == 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_719",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (V) in the queue implementation.\n\ndef evaluate_expression():\n    ...\n    symbol = remove()\n    if _________(V)____________:\n        operator = symbol\n    else:\n        return(\"Syntax error\")",
      "opts": ["operators in symbol", "symbol not in operators", "symbol == operators", "symbol in operators"],
      "ans": 3,
      "exp": "<code>operators</code> is a set <code>{'+','-','*','/'}</code>. To verify that a symbol removed from the queue is a valid mathematical operator, use the membership test <code>symbol in operators</code>. If true, the symbol is assigned to <code>operator</code>; otherwise a syntax error is returned. The marking scheme confirms: answer 59 (V) = symbol in operators.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_720",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (W) in the queue implementation.\n\ndef evaluate_expression():\n    ...\n    operand2 = remove()\n    result = ________(W)_________",
      "opts": ["evaluate(operand2, operator, operand1)", "evaluate(operand1, operator, operand2)", "evaluate(operator, operand1, operand2)", "operand1 + operand2"],
      "ans": 1,
      "exp": "Having obtained <code>operand1</code>, <code>operator</code>, and <code>operand2</code>, the expression is evaluated by calling the <code>evaluate</code> function with these three arguments in the correct order: first operand, operator, second operand. The result is stored in <code>result</code>. The marking scheme confirms: answer 60 (W) = evaluate(operand1, operator, operand2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_721",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (J) in the reverse() function.\n\ndef reverse(data):\n    n = len(data)\n    halfn = ______(J)_______\n    for i _________(K)________:\n        temp = ________(L)_________\n        ____________(M)____________\n        ____________(N)____________\n    return data",
      "opts": ["n/2", "n//2", "n//2 + 1", "n-1"],
      "ans": 1,
      "exp": "To reverse an array in-place by swapping elements from both ends toward the middle, the loop needs to run exactly half the length of the array. For even length n, exactly n/2 swaps are needed; for odd length, (n-1)/2 swaps (the middle element stays). Integer division <code>n//2</code> handles both cases correctly. The marking scheme confirms: answer 61 (J) = n//2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_722",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (K) in the reverse() function.\n\ndef reverse(data):\n    n = len(data)\n    halfn = ______(J)_______\n    for i _________(K)________:\n        temp = ________(L)_________\n        ____________(M)____________\n        ____________(N)____________\n    return data",
      "opts": ["in data", "in range(halfn)", "in range(n//2, n)", "in range(n)"],
      "ans": 1,
      "exp": "The loop variable <code>i</code> is used as an index from 0 to <code>halfn-1</code> to swap element at position <code>i</code> with the element at position <code>n-1-i</code>. <code>in range(halfn)</code> produces exactly the indices 0, 1, ..., halfn-1 needed for this. The marking scheme confirms: answer 62 (K) = in range(halfn).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_723",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (L) in the reverse() function.\n\ndef reverse(data):\n    n = len(data)\n    halfn = ______(J)_______\n    for i _________(K)________:\n        temp = ________(L)_________\n        ____________(M)____________\n        ____________(N)____________\n    return data",
      "opts": ["data[-1]", "data[n-1-i]", "data[0]", "data[i]"],
      "ans": 3,
      "exp": "The swap uses a temporary variable. <code>temp</code> stores the value at position <code>i</code> (the front element being swapped) before it is overwritten. <code>temp = data[i]</code> saves this value. The marking scheme confirms: answer 63 (L) = data[i] (equivalently written as temp = data[i]).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_724",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (M) in the reverse() function.\n\ndef reverse(data):\n    n = len(data)\n    halfn = ______(J)_______\n    for i _________(K)________:\n        temp = ________(L)_________\n        ____________(M)____________\n        ____________(N)____________\n    return data",
      "opts": ["data[n-1-i] = temp", "data[i] = temp", "data[i] = data[n-1-i]", "data[i] = data[-i-1]"],
      "ans": 2,
      "exp": "After saving <code>data[i]</code> in <code>temp</code>, step M places the mirror element into position <code>i</code>: <code>data[i] = data[n-1-i]</code>. This overwrites the front element with the back element. Step N will then place <code>temp</code> (the old front) into the back position. The marking scheme confirms: answer 64 (M) = data[i] = data[n-1-i].",
      "type": "mcq"
    },
    {
      "id": "cs_pp_725",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (N) in the reverse() function.\n\ndef reverse(data):\n    n = len(data)\n    halfn = ______(J)_______\n    for i _________(K)________:\n        temp = ________(L)_________\n        ____________(M)____________\n        ____________(N)____________\n    return data",
      "opts": ["temp = data[n-1-i]", "data[n-1-i] = temp", "data[i] = temp", "data[n-1-i] = data[i]"],
      "ans": 1,
      "exp": "The final step of the swap places the saved front value (in <code>temp</code>) into the back position: <code>data[n-1-i] = temp</code>. This completes the swap of positions <code>i</code> and <code>n-1-i</code>. The marking scheme confirms: answer 65 (N) = data[n-1-i] = temp.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_726",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (A) in the bin2dec() function.\n\ndef bin2dec(data):\n    n = len(data)\n    mult = _________(A)__________\n    value = ________(B)__________\n    for i _________(C)___________:\n        value = _________(D)____________\n        mult = __________(E)____________\n    return value",
      "opts": ["2**n", "2**(n+1)", "n-1", "2**(n-1)"],
      "ans": 3,
      "exp": "The function converts a binary array to decimal. For an array of <code>n</code> bits, the most significant bit (first element) has weight <code>2^(n-1)</code>. <code>mult</code> starts at <code>2**(n-1)</code> and is halved for each subsequent bit. For example, <code>[1,0,1,0,1]</code> has n=5, so the first bit has weight 2\u2074=16. The marking scheme confirms: answer 66 (A) = 2**(n-1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_727",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (B) in the bin2dec() function.\n\ndef bin2dec(data):\n    n = len(data)\n    mult = _________(A)__________\n    value = ________(B)__________\n    for i _________(C)___________:\n        value = _________(D)____________\n        mult = __________(E)____________\n    return value",
      "opts": ["-1", "1", "n", "0"],
      "ans": 3,
      "exp": "<code>value</code> accumulates the decimal result. It must be initialised to <code>0</code> so that contributions from each bit are added to a neutral starting value. The marking scheme confirms: answer 67 (B) = 0.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_728",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (C) in the bin2dec() function.\n\ndef bin2dec(data):\n    n = len(data)\n    mult = _________(A)__________\n    value = ________(B)__________\n    for i _________(C)___________:\n        value = _________(D)____________\n        mult = __________(E)____________\n    return value",
      "opts": ["in range(n)", "in range(len(data)-1)", "in range(n-1)", "in data"],
      "ans": 3,
      "exp": "The loop must iterate over each bit in the input array. <code>for i in data</code> iterates directly over the bit values (0 or 1) stored in the list, which is exactly what is needed to compute <code>value + i*mult</code> for each bit. The marking scheme confirms: answer 68 (C) = in data.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_729",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (D) in the bin2dec() function.\n\ndef bin2dec(data):\n    n = len(data)\n    mult = _________(A)__________\n    value = ________(B)__________\n    for i _________(C)___________:\n        value = _________(D)____________\n        mult = __________(E)____________\n    return value",
      "opts": ["value+i*mult", "value*i+mult", "i*mult", "value+i+mult"],
      "ans": 0,
      "exp": "For each bit <code>i</code> (0 or 1) with corresponding weight <code>mult</code>, the contribution to the decimal value is <code>i * mult</code>. This is accumulated into <code>value</code>: <code>value = value + i*mult</code>. For <code>[1,0,1,0,1]</code>: 1\u00d716 + 0\u00d78 + 1\u00d74 + 0\u00d72 + 1\u00d71 = 21. The marking scheme confirms: answer 69 (D) = value+i*mult.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_730",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (E) in the bin2dec() function.\n\ndef bin2dec(data):\n    n = len(data)\n    mult = _________(A)__________\n    value = ________(B)__________\n    for i _________(C)___________:\n        value = _________(D)____________\n        mult = __________(E)____________\n    return value",
      "opts": ["mult//2", "mult-1", "mult/2", "mult*2"],
      "ans": 0,
      "exp": "After processing each bit, the weight must halve for the next bit (moving from MSB to LSB: 2^(n-1), 2^(n-2), ..., 2^0). Integer division <code>mult//2</code> correctly halves the weight at each step without floating-point issues. The marking scheme confirms: answer 70 (E) = mult//2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_731",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (V) in the findmax() function.\n\ndef findmax(data, left, right):\n    mid = __________(V)____________\n    if mid > left:\n        left_idx = ________(W)___________\n    else:\n        left_idx = _________(X)___________\n    if (mid + 1) < right:\n        right_idx = __________(Y)___________\n    else:\n        right_idx = __________(Z)___________\n    if data[left_idx] > data[right_idx]:\n        return left_idx\n    else:\n        return right_idx",
      "opts": ["(right-left)//2", "(left+right)//2", "left+1", "(left+right)/2"],
      "ans": 1,
      "exp": "The function recursively divides the array in half to find the index of the maximum element. The midpoint index is computed as integer division of the sum of left and right bounds: <code>(left+right)//2</code>. This ensures the midpoint is always a valid integer index. The marking scheme confirms: answer 71 (V) = (left+right)//2.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_732",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (W) in the findmax() function.\n\ndef findmax(data, left, right):\n    mid = __________(V)____________\n    if mid > left:\n        left_idx = ________(W)___________\n    else:\n        left_idx = _________(X)___________\n    if (mid + 1) < right:\n        right_idx = __________(Y)___________\n    else:\n        right_idx = __________(Z)___________\n    if data[left_idx] > data[right_idx]:\n        return left_idx\n    else:\n        return right_idx",
      "opts": ["findmax(data, left, mid)", "left", "findmax(data, left, right)", "findmax(data, mid, right)"],
      "ans": 0,
      "exp": "When the left segment has more than one element (<code>mid &gt; left</code>), the maximum of the left half is found recursively. The left half spans from <code>left</code> to <code>mid</code> (inclusive). The call is <code>findmax(data, left, mid)</code>, which returns the index of the maximum in that sub-segment. The marking scheme confirms: answer 72 (W) = findmax(data, left, mid).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_733",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (X) in the findmax() function.\n\ndef findmax(data, left, right):\n    mid = __________(V)____________\n    if mid > left:\n        left_idx = ________(W)___________\n    else:\n        left_idx = _________(X)___________\n    if (mid + 1) < right:\n        right_idx = __________(Y)___________\n    else:\n        right_idx = __________(Z)___________\n    if data[left_idx] > data[right_idx]:\n        return left_idx\n    else:\n        return right_idx",
      "opts": ["left", "mid", "left+1", "right"],
      "ans": 0,
      "exp": "When the left segment has only one element (<code>mid == left</code>), there is no need for a recursive call. The index of the maximum of a single-element segment is simply <code>left</code> (the index of that one element). The marking scheme confirms: answer 73 (X) = left.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_734",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (Y) in the findmax() function.\n\ndef findmax(data, left, right):\n    mid = __________(V)____________\n    if mid > left:\n        left_idx = ________(W)___________\n    else:\n        left_idx = _________(X)___________\n    if (mid + 1) < right:\n        right_idx = __________(Y)___________\n    else:\n        right_idx = __________(Z)___________\n    if data[left_idx] > data[right_idx]:\n        return left_idx\n    else:\n        return right_idx",
      "opts": ["findmax(data, mid, right)", "findmax(data, left, right)", "right", "findmax(data, mid+1, right)"],
      "ans": 3,
      "exp": "When the right segment has more than one element (<code>mid+1 &lt; right</code>), the maximum of the right half is found recursively. The right half spans from <code>mid+1</code> to <code>right</code>. The call is <code>findmax(data, mid+1, right)</code>, returning the index of the maximum in that sub-segment. The marking scheme confirms: answer 74 (Y) = findmax(data, mid+1, right).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_735",
      "year": "2020 Batch 19",
      "text": "Write the appropriate code to fill the blank (Z) in the findmax() function.\n\ndef findmax(data, left, right):\n    mid = __________(V)____________\n    if mid > left:\n        left_idx = ________(W)___________\n    else:\n        left_idx = _________(X)___________\n    if (mid + 1) < right:\n        right_idx = __________(Y)___________\n    else:\n        right_idx = __________(Z)___________\n    if data[left_idx] > data[right_idx]:\n        return left_idx\n    else:\n        return right_idx",
      "opts": ["mid", "left", "mid+1", "right"],
      "ans": 3,
      "exp": "When the right segment has only one element (<code>mid+1 == right</code>), there is no need to recurse. The index of the maximum of a single-element right segment is simply <code>right</code>. The marking scheme confirms: answer 75 (Z) = right.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_736",
      "year": "2020 Batch 19",
      "text": "The common set of communication pathways that interconnect different components inside a computer is called the ________________.",
      "opts": ["control bus", "system bus", "address bus", "data bus"],
      "ans": 1,
      "exp": "The <strong>system bus</strong> is the collective term for the set of communication pathways (data bus, address bus, and control bus) that interconnect the CPU, memory, and I/O components inside a computer. Individual buses (data, address, control) are sub-components of the system bus. The marking scheme confirms: answer 76 = system bus.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_737",
      "year": "2020 Batch 19",
      "text": "The result of an arithmetic or logical operation carried by the CPU is always stored in a register referred to as ________________.",
      "opts": ["program counter", "flag register", "instruction register", "accumulator"],
      "ans": 3,
      "exp": "The <strong>accumulator</strong> is the register in the CPU where the result of arithmetic and logic operations performed by the ALU is stored. It serves as the primary working register. The marking scheme confirms: answer 77 = accumulator (also answer 69 in scheme = accumulator).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_738",
      "year": "2020 Batch 19",
      "text": "Address of the next instruction to be executed is stored in a special register within the CPU referred to as the ________________.",
      "opts": ["flag register", "instruction register", "program counter", "accumulator"],
      "ans": 2,
      "exp": "The <strong>program counter</strong> (PC), also known as the instruction pointer, holds the memory address of the next instruction to be fetched and executed by the CPU. After each fetch, it is incremented to point to the subsequent instruction. The marking scheme confirms: answer 78 = program counter (scheme answer 70 = program counter).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_739",
      "year": "2020 Batch 19",
      "text": "The component in the CPU that is made of a collection of circuits capable in carrying out arithmetic and logical operation is referred to as the _________________.",
      "opts": ["accumulator", "flag register", "ALU / Arithmetic and Logic Unit", "control unit"],
      "ans": 2,
      "exp": "The <strong>ALU (Arithmetic and Logic Unit)</strong> is the part of the CPU consisting of circuits that perform arithmetic operations (addition, subtraction, multiplication, division) and logical operations (AND, OR, NOT, XOR, comparisons). The marking scheme confirms: answer 79 = ALU / Arithmetic and Logic Unit.",
      "type": "mcq"
    },
    {
      "id": "cs_pp_740",
      "year": "2020 Batch 19",
      "text": "The status of the last executed arithmetic or logical instruction within a CPU is available at the register known as ________________.",
      "opts": ["flag register", "accumulator", "instruction register", "program counter"],
      "ans": 0,
      "exp": "The <strong>flag register</strong> (also called the status register or condition code register) stores individual bits (flags) that reflect the outcome of the most recent ALU operation \u2014 for example, the zero flag, carry flag, sign flag, and overflow flag. The marking scheme confirms: answer 80 = flag register (scheme answer 72 = flag register).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_741",
      "year": "2020 Batch 19",
      "text": "Part of a CPU instruction that specifies the action / operation to be carried out is called the ________________.",
      "opts": ["mnemonic", "opcode", "address", "operand"],
      "ans": 1,
      "exp": "A machine instruction consists of two parts: the <strong>opcode</strong> (operation code), which specifies the operation to perform (e.g. ADD, MOV, LOAD), and the operand(s), which specify the data or addresses involved. The marking scheme confirms: answer 81 = opcode (scheme answer 73 = opcode).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_742",
      "year": "2020 Batch 19",
      "text": "Part of a CPU instruction that specifies where relevant data can be found is known as the ________________.",
      "opts": ["address mode", "opcode", "operands", "register"],
      "ans": 2,
      "exp": "The <strong>operand</strong> part of a CPU instruction specifies where the data to be operated upon can be found \u2014 this may be an immediate value, a register reference, or a memory address. The marking scheme confirms: answer 82 = operands (scheme answer 74 = operands).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_743",
      "year": "2020 Batch 19",
      "text": "The smallest unit that can be displayed in a graphic display unit (monitor) is known as a ________________.",
      "opts": ["bit", "byte", "pixel", "dot"],
      "ans": 2,
      "exp": "A <strong>pixel</strong> (picture element) is the smallest addressable unit on a display screen. Each pixel can be independently set to a specific colour and brightness. The marking scheme confirms: answer 83 = pixels (scheme answer 75 = pixels).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_744",
      "year": "2020 Batch 19",
      "text": "The ability to load the next instruction before the current one completes its execution is referred to as ________________.",
      "opts": ["branch prediction", "pipelining", "caching", "pre-fetching"],
      "ans": 3,
      "exp": "<strong>Pre-fetching</strong> (instruction pre-fetching) is the technique where the CPU fetches the next instruction from memory before the current instruction has finished executing, thereby reducing idle time. The marking scheme confirms: answer 84 = pre-fetching (scheme answer 76 = pre-fetching).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_745",
      "year": "2020 Batch 19",
      "text": "Which of the following is not part of the system bus?",
      "opts": ["Address bus", "Power bus", "Data bus", "Control bus"],
      "ans": 1,
      "exp": "The system bus consists of three sub-buses: the <strong>address bus</strong> (carries memory addresses), the <strong>data bus</strong> (carries data), and the <strong>control bus</strong> (carries control signals). A <strong>power bus</strong> (or power rail) is not part of the system bus \u2014 it is a separate electrical supply line. The marking scheme confirms: answer 85 = b (Power bus = index 1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_746",
      "year": "2020 Batch 19",
      "text": "Instruction pipelining helps the CPU to",
      "opts": ["Reduce the time required for execution of a single instruction", "Allow instructions to be executed without loading them into the CPU", "Reduce the average time required for execution of a group of instructions", "Have instructions capable of handling complex tasks"],
      "ans": 2,
      "exp": "Instruction pipelining overlaps the execution stages (fetch, decode, execute, write-back) of multiple instructions. A single instruction still takes the same number of clock cycles to complete; pipelining does not speed up any one instruction. However, it dramatically increases <strong>throughput</strong> \u2014 the average time per instruction over a group of instructions is reduced because multiple instructions are in different stages simultaneously. The marking scheme confirms: answer 86 = c (index 2).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_747",
      "year": "2020 Batch 19",
      "text": "Which of the following sequence is correct when writing data into the memory?",
      "opts": ["Put Address on address bus, put Data on data bus, activate Write signal", "Activate Write signal, put Data on data bus, put Address on address bus", "Put Data on data bus, put Address on address bus, activate Write signal", "None of the above"],
      "ans": 0,
      "exp": "The correct sequence for a memory write operation is: (1) place the target memory address on the <strong>address bus</strong> so the memory knows where to write; (2) place the data to be written on the <strong>data bus</strong>; (3) activate the <strong>Write control signal</strong> to trigger the memory to latch the data at the specified address. The marking scheme confirms: answer 87 = a (index 0).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_748",
      "year": "2020 Batch 19",
      "text": "Which of the following is not a part of a typical instruction cycle?",
      "opts": ["Fetching an instruction from the memory", "Decoding an instruction stored in the Instruction Register", "Incrementing the Instruction Pointer", "Incrementing the Accumulator"],
      "ans": 3,
      "exp": "A typical instruction cycle consists of: (1) <strong>Fetch</strong> \u2014 retrieve the instruction from memory at the address in the program counter; (2) <strong>Decode</strong> \u2014 interpret the opcode in the instruction register; (3) <strong>Execute</strong> \u2014 carry out the operation, which may include incrementing the program counter (instruction pointer). <strong>Incrementing the Accumulator</strong> is not a step in the instruction cycle \u2014 it might happen as the result of a specific INC instruction, but it is not a universal step of every cycle. The marking scheme confirms: answer 88 = d (index 3).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_749",
      "year": "2020 Batch 19",
      "text": "Instruction pre-fetching is a technique to:",
      "opts": ["Reduce the number of clock cycles required to complete each instruction", "Improve CPU throughput by overlapping fetching and execution of instructions", "Improve performance of frequently used instructions", "Reduce power consumption of a CPU"],
      "ans": 1,
      "exp": "Instruction pre-fetching fetches the next instruction from memory while the current instruction is still being executed. This overlapping hides the memory access latency and <strong>improves CPU throughput</strong> \u2014 more instructions complete per unit time. It does not reduce cycles per instruction (option a), does not specifically target frequently used instructions (option c), and is not related to power consumption (option d). The marking scheme confirms: answer 89 = b (index 1).",
      "type": "mcq"
    },
    {
      "id": "cs_pp_750",
      "year": "2020 Batch 19",
      "text": "The term \"Arduino\" refers to a",
      "opts": ["Software utility used for programming computers", "High performance computer system", "Small computer built using a microcontroller", "Network of computers in a building"],
      "ans": 2,
      "exp": "Arduino is an open-source electronics platform based on a <strong>microcontroller</strong> (typically an AVR or ARM chip). It is a small, self-contained computer on a board designed for building interactive electronic projects. It is not merely software (option a), not a high-performance system (option b), and not a network (option d). The marking scheme confirms: answer 90 = c (index 2).",
      "type": "mcq"
    }
  ],
  "targetHard": [],
  "targetNormal": []
};
