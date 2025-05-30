# Example 1: Basic Social Feature Stack

This folder contains a complete semantic graph input and output test case for the Semantic Graph Compiler.

## Included Features
- User registration and login
- Posting text and image content
- Like / Unlike functionality
- Post count updates

## Files
- `exampleGraph.json`: The main semantic graph input
- `*.txt`: Prompt outputs for each node (auto-generated)
- `compiledResult/`: Resulting generated promts
- `executableCode/`:
  The code in `executableCode/` is **almost entirely generated by the Semantic Graph Compiler and ChatGPT 4o model**, with only **minimal human intervention** to ensure execution correctness.

  - Every manual change is strictly **minor** (e.g. fixing a variable name, adding a missing `await`, etc.)
  - No restructuring, no design changes, and no logic rewrites were made
  - All such edits are clearly marked with one of:
    - `/* human modified */` — for very small inline changes to AI output
    - `/* human append */` — for short additions where the AI left a small gap
  - The original AI-generated code (before the fix) is **commented out above** each edited section for transparency
  
  This demonstrates the **high accuracy and production-readiness** of the semantic graph system. Most files were executed **as-is**, or needed no more than 1–2 lines of patching.

  Note: Only two components in the entire semantic graph required actual code to be written manually.  
  All other nodes were either:
    - external modules, or  
    - declarative/configuration-only (not requiring executable logic)
    - front-end code (which is currently outside the scope of this system)
## Usage
You can run this example through the compiler by running:

```bash
node build.js exampleGraph.json
