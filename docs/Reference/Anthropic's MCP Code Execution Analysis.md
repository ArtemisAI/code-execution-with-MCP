

# **From Tool List to Executable Surface: A Strategic Analysis of Anthropic's "Code Execution with MCP" and its Impact on Agentic Architecture**

## **I. The Context Window Bottleneck: MCP's Inherent Scaling Crisis**

The Model Context Protocol (MCP), introduced by Anthropic in November 2024, rapidly achieved prominence, establishing itself as an open, "de-facto standard" for connecting AI agents to external tools and data systems.1 Developers now "routinely build agents with access to hundreds or thousands of tools" across a burgeoning ecosystem.1 This widespread adoption, however, has exposed a fundamental architectural bottleneck inherent in the protocol's original, declarative design. The "code execution with MCP" pattern is not merely a new feature; it is a necessary evolutionary response to a scaling crisis created by the protocol's own success.

This crisis manifests in two primary forms:

1. **Tool Definition Bloat:** The original MCP design, which relies on direct tool-calling syntax, necessitates that most clients load *all* available tool definitions directly into the model's context window upfront.1 When an agent is connected to "dozens of MCP servers" 1 offering thousands of tools, this can force the model to process "hundreds of thousands of tokens before even reading a request".1 This "tool definition overload" dramatically increases latency and operational costs, degrading the agent's performance before it has even begun its task.1  
2. **Intermediate Data Bloat:** In the traditional "agent loop," every intermediate result from a tool call must be passed *through* the model's context to be "forwarded" to the next tool.1 A workflow to download a sales transcript and update a CRM record exemplifies this flaw. An agent would call gdrive.getDocument, receive a 50,000-token transcript into its context, and then pass that *entire* 50,000-token text back out in its subsequent call to salesforce.updateRecord.1 This redundant data handling consumes massive token counts, can "exceed context window limits altogether," breaking the workflow, and increases the "likelihood of the model making mistakes when copying large amounts of data".1

The original, declarative system—where the LLM *declares* its intent ("call tool X") and a harness executes it—becomes unworkable at this scale. Anthropic's solution is a pivot to an *imperative* model. The LLM is now tasked with writing the *exact execution logic* (e.g., let data \= await tool\_A(); let summary \= process(data); await tool\_B(summary);). This promotes the agent's role from a simple "request router" to a "just-in-time micro-service developer," fundamentally altering the compute model to resolve this architectural strain.

## **II. Anthropic's Paradigm Shift: Reframing MCP as an Executable API**

The core concept behind Anthropic's new pattern is to "present MCP servers as code APIs rather than direct tool calls".1 The agent is then instructed to write and execute code against these APIs to accomplish its task.1 This move is a strategic pivot that leverages a core competency of modern LLMs: they are "adept at writing code".1 It reframes the interaction to play to the model's primary strength, rather than straining its capacity for context-window-based data juggling.

This shift fundamentally transforms the identity of the protocol. As described by industry analysis, this launch turns MCP from a static "tool list" into a dynamic, "executable API surface".3 The agent is no longer just *calling* pre-defined functions; it is *composing* them with arbitrary logic—loops, conditionals, and error handling—in a separate, more appropriate environment.1

A critical, and perhaps undersold, benefit of this architecture is the offloading of *logic* and *latency*. The new model saves on "time to first token" (TTFT) latency.1 This is because "the agent can let the code execution environment" evaluate an if statement "faster than waiting for a model to do so".1 This creates a more scalable and cost-effective architectural pattern. The expensive, high-latency LLM is used *once* to generate the plan (the code). A cheap, low-latency code runtime then *executes* that plan, handling all the complex control flow. This bifurcates the "reasoning" from the "execution."

This pattern is also a clear strategic move to bridge the gap between the MCP ecosystem and rival agent architectures, most notably OpenAI's Code Interpreter. As noted by one developer, the pattern is "more-so just tool calling \+ code interpreter design patterns".5 Analyst Simon Willison reinforces this, stating the new piece from Anthropic "proposes a way to bring the two worlds more closely together".4 This is a classic "embrace and extend" strategy, fusing the *power* of a local code interpreter with the *standardization and broad ecosystem* of MCP.

## **III. Technical Architecture and Agent Interaction Model**

### **A. The Architecture**

Anthropic's proposed implementation relies on three main components:

1. **The Filesystem Metaphor:** The primary method for presenting tools as code involves generating a virtual file tree of all available tools from connected MCP servers.1 This structure is represented to the agent as a standard directory, for example:  
   servers  
   ├── google-drive  
   │   ├── getDocument.ts  
   │   └── index.ts  
   ├── salesforce  
   │   ├── updateRecord.ts  
   │   └── index.ts  
   └──... (other servers)

   1  
2. **Tool-as-a-Module:** Each file, such as getDocument.ts, acts as a self-contained module. It contains the necessary TypeScript interface definitions for inputs and outputs (e.g., GetDocumentInput, GetDocumentResponse) and exports an async function. This function serves as a simple wrapper that, when called, executes the *actual* MCP tool call via a client helper, callMCPTool.1  
   TypeScript  
   //./servers/google-drive/getDocument.ts  
   import { callMCPTool } from "../../../client.js";  
   interface GetDocumentInput {  
     documentId: string;  
   }  
   interface GetDocumentResponse {  
     content: string;  
   }  
   /\* Read a document from Google Drive \*/  
   export async function getDocument(input: GetDocumentInput): Promise\<GetDocumentResponse\> {  
     return callMCPTool\<GetDocumentResponse\>('google\_drive\_\_get\_document', input);  
   }

   1  
3. **The Secure Sandbox:** This entire architecture is predicated on the agent's code being run in a "secure execution environment." This environment must be equipped with appropriate "sandboxing, resource limits, and monitoring" to mitigate the inherent risks of executing LLM-generated code.1

### **B. The Agent Interaction Process**

The agent's workflow using this architecture unfolds in a three-step process:

1. **Step 1: Progressive Disclosure (Tool Discovery):** This step directly solves the "Tool Definition Bloat" problem. Instead of being fed all tools, the agent discovers them on demand by exploring the filesystem. It can issue a command to list the ./servers/ directory to find available servers, and then read the specific tool file it needs (e.g., getDocument.ts) to understand its interface and types.1 Alternatively, the post suggests a search\_tools tool could be provided, which might accept a "detail level parameter" (e.g., name only, name and description, or full definition) to allow the agent to find relevant tools while still conserving context.1  
2. **Step 2: Code Generation and Execution:** The agent writes TypeScript code to solve the user's task, importing and composing the tool-modules it just discovered.1 For the previously mentioned workflow, the agent would generate and execute the following:  
   TypeScript  
   // Read transcript from Google Docs and add to Salesforce prospect  
   import \* as gdrive from './servers/google-drive';   
   import \* as salesforce from './servers/salesforce';   
   const transcript \= (await gdrive.getDocument({ documentId: 'abc123' })).content;   
   await salesforce.updateRecord({  
     objectType: 'SalesMeeting',  
     recordId: '00Q5f000001abcXYZ',  
     data: { Notes: transcript }  
   });

   1  
3. **Step 3: State Persistence and "Skills":** The agent is given filesystem *write* access within its sandbox. This enables two powerful, long-term capabilities:  
   * **State:** The agent can save intermediate results to files (e.g., using a hypothetical fs.writeFile tool), allowing it to track progress, maintain state across operations, or resume complex, multi-day tasks.1  
   * **Skills:** The agent can save its *own* working code as reusable functions in a skills/ directory.1 This creates a compounding feedback loop where the agent builds its own library of higher-level capabilities over time, a concept Anthropic has previously linked to "Claude Skills".3

The choice of a virtual filesystem is a particularly astute piece of design. LLMs have been trained on billions of lines of code, shell scripts, and documentation; they "understand" filesystem navigation (ls, cat) and module imports (import) intuitively. Representing the tool API as a filesystem *plays to the model's strengths* and uses its existing world model. It is far more natural for an LLM to "find the tool by ls-ing a directory" than to learn a new, abstract API query language. The filesystem effectively acts as a *user interface for the agent*.

## **IV. Analysis of Claimed Benefits and Quantitative Impact**

The shift to this new architecture yields both a dramatic quantitative improvement in token efficiency and a suite of qualitative benefits that enable more complex, secure, and robust agentic systems.

### **A. The Headline: 98.7% Token Reduction**

Anthropic provides a concrete, headline-grabbing metric to illustrate the pattern's effectiveness. The previously mentioned workflow (Google Drive to Salesforce) that consumed approximately **150,000 tokens** under the traditional model was re-implemented using the code-execution pattern. The new pattern, by loading only the necessary tool definitions and keeping the large transcript out of the context, used only about **2,000 tokens**.1

This represents a **98.7% reduction in token usage** for that scenario 1, which directly translates to lower costs and lower latency. While this figure likely represents a best-case scenario for this pattern (and a worst-case for the old one), it clearly demonstrates that the return on investment for this architecture is highest for *complex, multi-step, data-heavy* workflows.

### **B. Qualitative and Architectural Benefits**

Beyond token reduction, the pattern enables several new capabilities:

* **Context-Efficient Tool Results:** This is the direct solution to "Intermediate Data Bloat." The agent can now filter and transform large datasets *in the code environment*.1 The post provides an example of fetching a 10,000-row spreadsheet. Instead of passing all 10,000 rows to the model, the agent's code can filter for "pending" orders and log only "the first five" rows or a summary statistic back to the model's context.1 The "heavy lifting" is executed off-model.  
* **Privacy-Preserving Operations (PII Tokenization):** This is a critical feature for enterprise adoption. The post describes a pattern where the MCP client can *intercept* data, tokenize Personally Identifiable Information (PII) (e.g., replacing john.doe@example.com with \[EMAIL\_1\]), and only show the token to the model.1 The MCP client then maintains a secure mapping and untokenizes this data (via a lookup) only when passing it to another MCP tool.1 This enables a "privacy-preserving" workflow where sensitive data can flow *between* systems (e.g., Google Sheets to Salesforce) *without ever entering the model's context or logs*. For legal, risk, and compliance teams, this "deal-closer" feature mitigates a primary CISO-level fear of LLMs "seeing" or leaking sensitive customer data.

## **V. Critical Security Analysis: The Inherent Risks of Code Execution**

Anthropic is candid that this new-found power comes at a significant cost. The pattern *requires* a secure sandbox, and this "adds operational overhead and security considerations that direct tool calls avoid".1 This new model does not exist in a vacuum; it inherits the pre-existing risks of the MCP ecosystem and introduces a new, more severe class of vulnerability.

### **A. Pre-Existing MCP Risks**

The MCP ecosystem, prior to this development, already faced security challenges:

* **Excessive Permissions:** MCP servers often request "broad permission scopes" (e.g., full Gmail access rather than just read permissions), creating a large and unnecessary attack surface.7  
* **Data Aggregation:** The centralization of many service tokens in a single protocol layer creates an "unprecedented data aggregation potential".7 This concentration of access allows attackers who gain partial access to perform "correlation attacks" by combining data from disparate services (e.g., calendar, email, and files) for sophisticated phishing or extortion campaigns.7

### **B. Case Study in Ecosystem Risk: The MCP Inspector RCE (CVE-2025-49596)**

The dangers of this new executable world are not theoretical. A critical vulnerability discovered in Anthropic's *MCP Inspector*—a developer tool—in July 2025 serves as a perfect, concrete illustration of the risks.

* **The Vulnerability:** Tracked as **CVE-2025-49596**, this vulnerability carried a **9.4 CVSS (Critical)** score.8  
* **The Attack:** It allowed for **Remote Code Execution (RCE)** on a *developer's machine*.8  
* **The Mechanism:** The attack chained two flaws. First, the MCP Inspector developer tool's proxy server listened on 0.0.0.0:6277 by default *without authentication*.8 Second, a Cross-Site Request Forgery (CSRF) flaw, combined with the "0.0.0.0 Day" browser vulnerability, allowed a *malicious website* visited by the developer to send unauthenticated requests to this local proxy, executing arbitrary commands on the host machine.8

This CVE is a canary in the coal mine. The vulnerability was in the *developer tooling*, but it exploited the *exact same components* this new pattern relies on: a local server executing commands. This proves that the "operational overhead" 1 is not an abstract, in-production problem. It is a real, 9.4-CVSS problem that begins on the *developer's laptop* and mandates a zero-trust architecture even for local development.

### **C. The New Attack Surface: Sandbox Security**

This new architecture fundamentally shifts the primary security burden from the *protocol* (API authentication, OAuth scopes) to the *runtime* (sandboxing). The old security model was about API security.7 The new model is about *application security*: what can this untrusted, LLM-generated code *do*? This requires a completely different, and arguably much harder, set of controls: filesystem isolation, network egress policies, compute/memory limits, and process monitoring.

Furthermore, separate research has noted that LLM agents "struggle to differentiate between external data and executable instructions". This is the root of prompt injection. In the old model, this risk led to "sycophancy" 10 or data exfiltration. In the *new* code-execution model, this risk is *amplified to RCE*. If an agent insecurely handles a malicious tool *output* (e.g., by eval-ing it or writing it to a file that is later executed), an attacker can achieve sandbox escape. The stakes of prompt injection have just been raised from "data theft" to "full system compromise."

## **VI. Industry and Developer Reception: A Fragmented Consensus**

The "code execution with MCP" pattern has been received by industry analysts as a logical and necessary evolution, but the developer community has engaged in a more fragmented and critical debate.

### **A. Expert Endorsement**

Industry analysts have praised the move. Simon Willison noted that it "bring\[s\] the two worlds (MCP and coding agents) more closely together".4 MarkTechPost called it "a sensible next step for MCP-powered agents" that "directly attacks the token costs" of the old model.3

### **B. The Hacker News Critique 1: "Just Use CLI Tools"**

A significant counter-argument emerged from the developer community, best summarized by the user redhale: "just use CLI tools".5 The rationale is that CLIs are "well-tested," have built-in discovery mechanisms (--help, man), and can be composed using shell scripts, which is a form of code execution.5 One user pointedly noted that the Atlassian CLI works *more reliably* than the Atlassian MCP server, which has "weird auth issues".5

This argument was rebutted by another user, beoberha, who defended MCP as a "one-stop-shop for discovering 'tools'".5 Finding, installing, and managing "tons of existing CLI tools" is "way less automated and 'deterministic'" than querying the standardized MCP.5 This "CLI vs. MCP" debate is a proxy for a deeper philosophical question: Should agents adapt to *human-centric tools* (CLIs), or should we build *agent-centric protocols* (MCP)? Anthropic's new pattern is a clear attempt to absorb the "CLI tool" argument by providing the power and flexibility of code (like a shell script) within the standardized MCP ecosystem.

### **C. The Hacker News Critique 2: "Is this even MCP?"**

A more fundamental critique came from user cjonas, who stated, "I don't actually see what any of this has to do with MCP," calling the pattern "more-so just tool calling \+ code interpreter design patterns".5 This user also argued that the "MCP hype has resulted in a lot of BAD tools being written".5

This comment is technically correct—the *pattern* is a code interpreter. However, Anthropic's *branding*—"Code execution *with MCP*"—is a crucial strategic move to ensure MCP *remains* the central protocol. Instead of letting developers abandon MCP for bespoke code interpreters (as users like cjonas 5 and Simon Willison 4 had already started to do), Anthropic is *wrapping* the code interpreter pattern *in MCP branding*. This "embrace and extend" strategy ensures the protocol's continued relevance and adoption.

The significance of this change was not lost on the developer community. A Reddit thread 11 framed the central question: Is this new pattern as big a leap for the protocol as the move from "standard I/O to HTTP"? This demonstrates that the community views this as a *fundamental, evolutionary change* to the standard itself.

## **VII. The Emerging Alternatives: Filesystem vs. Dynamic Execution**

While Anthropic proposed the *concept* of code execution, the community immediately began to iterate on its *implementation*, highlighting a significant flaw in the filesystem-based approach.

### **A. Critique of Anthropic's Filesystem Method**

A "Show HN" post for a project called codex-mcp pointed out the significant maintenance overhead of Anthropic's proposed method.12

* **The Problem:** The filesystem-based method requires generating and maintaining a static TypeScript file *for every single tool*.  
* **The Overhead:** At scale, "1000 MCP tools means maintaining 1000 generated files".12 This creates a maintenance nightmare of managing complex type schemas, rebuilding files every time a tool is updated, and handling version conflicts.12

### **B. The Community Alternative: codex-mcp (Dynamic Execution)**

The community-proposed alternative, by user pranftw, uses "pure dynamic execution" and eliminates the filesystem entirely.12

* **The Mechanism:** It exposes just *two* lightweight tools: list\_mcp\_tools() and get\_mcp\_tool\_details(name).  
* **Runtime Injection:** The agent "navigates" by calling these APIs. When it is time to execute code, a callMCPTool function is *injected* directly into the runtime environment using the AsyncFunction constructor. There are "no imports, no filesystem dependencies".12  
* **The Advantage:** This system is "perpetually in sync" with the live MCP servers. When a tool's schema changes, the agent gets the new definition on its next call. This eliminates *all* the maintenance, build steps, and versioning overhead of the filesystem approach.12

### **C. Comparative Analysis of Interaction Patterns**

This dynamic approach is a demonstrably superior implementation for the *developer* than Anthropic's proposed filesystem method. The maintenance overhead of file-generation is a significant, real-world engineering burden. The dynamic approach cleverly *keeps* the filesystem *metaphor* for the LLM (it *thinks* it's navigating) while *removing* the physical implementation burden for the developer. This rapid community iteration highlights the strength of the open protocol and suggests that implementation best practices will evolve quickly.

| Interaction Pattern | Tool Discovery | Token Efficiency (Definitions) | Token Efficiency (Results) | Control Flow | Maintenance Overhead | Primary Security Risk |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **Traditional MCP** (Direct Tool-Call) | All tools loaded in context 1 | **Extremely Low** (High Token Cost) | **Low** (All data passes via context) 1 | LLM-based (Chained calls) 1 | Low (Server-side) | Excessive Permissions / Data Aggregation 7 |
| **Anthropic (Filesystem Code-Exec)** | ls on virtual filesystem 1 | **High** (Progressive Disclosure) | **High** (Code-based filtering) 1 | Code-based (In runtime) 1 | **High** (File generation, version conflicts) 12 | Sandbox Escape / RCE 1 |
| **Dynamic (codex-mcp Code-Exec)** | list\_mcp\_tools() API 12 | **High** (On-demand definition) | **High** (Code-based filtering) 12 | Code-based (In runtime) 12 | **Low** (No files, always in sync) 12 | Sandbox Escape / Injection 12 |
| **"Just Use CLI Tools"** (Non-MCP) | \--help and man 5 | **High** (Loaded on use) | **High** (Stdio) | Shell Script (In runtime) 5 | Medium (Installation, PATH) | Command Injection / Insecure permissions 5 |

## **VIII. Strategic Conclusion: The Future of MCP and Agentic Architecture**

Anthropic's "code execution" pattern is a masterful and necessary evolutionary step. It solves the protocol's crippling scaling crisis 1 by applying "known solutions from software engineering".1 As intuited by the developer community 11, this is a leap comparable to the move from "stdio to HTTP," as it unlocks a new, more powerful, and more complex class of applications. It solidifies MCP's role as the "lingua franca" for agent-tool interaction by absorbing the "code interpreter" paradigm.

This power, however, comes at a high price. It transforms MCP from a "tool list" to an "executable API surface" 3, and in doing so, it shifts the primary security burden from *API authentication* to *runtime sandboxing*. It inextricably links the protocol's future to the community's ability to build and maintain secure execution environments. As MarkTechPost aptly noted, this forces teams to "take code execution security seriously".3

For technical leadership (CTOs, VPs of Engineering, and Architects), the following recommendations are clear:

1. **Acknowledge this as a Foundational Commitment:** This is not a plug-and-play feature. Adopting this pattern requires committing significant, ongoing resources to a dedicated security and AI platform team to build, manage, and monitor the sandboxing, resource limits, and egress policies this architecture demands.1  
2. **Target the Right Workloads:** The 98.7% token reduction 1 and PII tokenization features 1 are transformative, but only *for complex, data-heavy, multi-step workflows*. These benefits will not materialize for simple, single-shot tool calls, where the original, safer, direct-call model remains sufficient and preferable.  
3. **Adopt the Dynamic, Not the Static, Pattern:** The community-driven dynamic execution model (codex-mcp) 12 is a demonstrably superior implementation that avoids the maintenance "death spiral" of Anthropic's file-generation approach.  
4. **Treat the Risk as Real and Present:** The 9.4-CVSS RCE in the *developer tooling* 8 is a stark warning. The risk of this architecture is not theoretical; it is a clear and present danger that begins on the developer's workstation and must be mitigated from day zero.

**Final Decision:** Proceed with adoption *only* for high-value, high-complexity agentic systems where the profound efficiency and capability gains justify the *significant* and *non-trivial* security and platform engineering investment required to manage its risks.

#### **Works cited**

1. Code execution with MCP: building more efficient AI agents \\ Anthropic, accessed November 8, 2025, [https://www.anthropic.com/engineering/code-execution-with-mcp](https://www.anthropic.com/engineering/code-execution-with-mcp)  
2. The Etienne Duclos Twitter MCP Server: A Deep Dive for AI Engineers \- Skywork.ai, accessed November 8, 2025, [https://skywork.ai/skypage/en/etienne-duclos-twitter-mcp-server-ai-engineers/1979070786209882112](https://skywork.ai/skypage/en/etienne-duclos-twitter-mcp-server-ai-engineers/1979070786209882112)  
3. Anthropic Turns MCP Agents Into Code First Systems With 'Code ..., accessed November 8, 2025, [https://www.marktechpost.com/2025/11/08/anthropic-turns-mcp-agents-into-code-first-systems-with-code-execution-with-mcp-approach/](https://www.marktechpost.com/2025/11/08/anthropic-turns-mcp-agents-into-code-first-systems-with-code-execution-with-mcp-approach/)  
4. Code execution with MCP: Building more efficient agents, accessed November 8, 2025, [https://simonwillison.net/2025/Nov/4/code-execution-with-mcp/](https://simonwillison.net/2025/Nov/4/code-execution-with-mcp/)  
5. Code execution with MCP: Building more efficient agents | Hacker ..., accessed November 8, 2025, [https://news.ycombinator.com/item?id=45818300](https://news.ycombinator.com/item?id=45818300)  
6. Code Execution with MCP by Anthropic \- unwind ai, accessed November 8, 2025, [https://www.theunwindai.com/p/code-execution-with-mcp-by-anthropic](https://www.theunwindai.com/p/code-execution-with-mcp-by-anthropic)  
7. The Security Risks of Model Context Protocol (MCP) \- Pillar Security, accessed November 8, 2025, [https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)  
8. Critical Vulnerability in Anthropic's MCP Exposes Developer ..., accessed November 8, 2025, [https://thehackernews.com/2025/07/critical-vulnerability-in-anthropics.html](https://thehackernews.com/2025/07/critical-vulnerability-in-anthropics.html)  
9. Everything wrong with MCP \- Hacker News, accessed November 8, 2025, [https://news.ycombinator.com/item?id=43676771](https://news.ycombinator.com/item?id=43676771)  
10. Systematic Analysis of MCP Security \- arXiv, accessed November 8, 2025, [https://arxiv.org/html/2508.12538v1](https://arxiv.org/html/2508.12538v1)  
11. Is Anthropic Code Execution with MCP as big or bigger than going ..., accessed November 8, 2025, [https://www.reddit.com/r/mcp/comments/1opdykn/is\_anthropic\_code\_execution\_with\_mcp\_as\_big\_or/](https://www.reddit.com/r/mcp/comments/1opdykn/is_anthropic_code_execution_with_mcp_as_big_or/)  
12. Show HN: Dynamic Code Execution with MCP: A More Efficient ..., accessed November 8, 2025, [https://news.ycombinator.com/item?id=45830318](https://news.ycombinator.com/item?id=45830318)