# Semantic Graph Compiler

The **Semantic Graph Compiler** is a system that describes and compiles entire software architectures using the mathematical language of **graphs**. 
To the best of my knowledge, this is the first public compiler that uses a graph-based semantic description to generate complete backend prompts designed for AI to easily understand from component-level relationships and component descriptions. 

*Note: The current implementation focuses on generating backend prompts in Node.js and MySQL. Frontend and multi-language support (e.g., Python) is planned for future versions.*

In this system:

- Each **component** (e.g., function, API endpoint, global variable) is modeled as a **node**, with each node assigned to a **finite set of predefined types** such as `Function`, `GlobalVariable`, `EndpointHandler`, etc.
  The user also provides a **`description** within each node to define the operational logic or behavior of the component.
- Each **interaction or dependency** between components is modeled as a **directed edge**, also categorized into a **limited number of semantic types** such as `calls`, `read_table`, `write_table`, `imported`, etc.

> These well-defined node and edge types enable precise reasoning, AI-driven prompt generation, and automated system tracing.


This abstract representation allows for high-level orchestration, code generation, and traceability of complex systems—making it ideal for AI-assisted software development, reverse engineering, and system documentation.

>  **Note:** Only two components in the entire semantic graph required actual code to be written manually.  
> All other nodes were either:
> - External modules  
> - Declarative/configuration-only (not requiring executable logic)  
> - Front-end code

---

##  Current Implementation & Future Expansion

The current version of the Semantic Graph Compiler focuses on **backend systems using Node.js and MySQL**. The compiler has been successfully tested to generate and trace complex backend logic based purely on the semantic graph model.  
See [`example-models/example1/`](./example-models/example1/) for a complete working example.

In its present form, the system:
- Supports API endpoint generation
- Manages SQL operations and table interaction
- Can validate tokens, user actions, and dynamic request flows

However, the architecture is **language-agnostic by design**. In the future, it can be extended to generate or interpret:
- **Full-stack applications**, including frontend components  
- **Python** developments  
- Other programming languages



This flexibility makes it a promising foundation for scalable, AI-assisted software automation.

---

##  How to Run

You can try the compiler on your own machine by cloning the repository and using the provided tools:

1. **Clone this repository:**

  git clone https://github.com/Ann0831/semantic-graph-compiler.git
  cd semantic-graph-compiler
2. **Compile from a graph file:**
  cd semantic-graph-workspace-test
  node build.js exampleGraph.json

3. **To create your own graph file:**
  Open `editor.html` in your browser (located in `semantic-graph-workspace-test/`).
4. **To view the compiled prompts for each component:**
  Open `prompt-viewer.html` in your browser (also located in `semantic-graph-workspace-test/`).  
  Upload a `.json` graph file to the page — the tool will display the generated prompt for each node in the graph.
6. **To view a documentation-style summary of your graph:**
  Open `graphToDocument.html` in your browser (also located in `semantic-graph-workspace-test/`).  
  Upload your `.json` graph file to generate a structured, human-readable documentation of all nodes and their relationships.

## License

This project is licensed under the terms described in [`LICENSE.md`](./LICENSE.md).


