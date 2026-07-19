# State of the Art Report: Agentic Multimodal Interfaces and Generative UI in HCI/UX

**Module:** Human–Computer Interaction  
**Assignment:** Thorough review of a latest trend in HCI/UX  
**Focus topic:** From Conversational UI to Delegative, Multimodal Human–AI Interaction  
**Date:** July 2026  

---

## Abstract

Human–Computer Interaction (HCI) is undergoing a structural shift. For decades, interaction design centred on screens, menus, and step-by-step control. In 2025–2026, large language models (LLMs), computer-use agents, and natively multimodal models are pushing practice toward *delegative* interaction: users express goals, and systems plan and act across tools, modalities, and contexts. Parallel to this, *generative user interfaces* (GenUI) dynamically construct interactive surfaces rather than rendering fixed chat text. This report reviews the state of the art across research literature, commercial products, and industry white papers. It situates the trend against classical HCI foundations taught in this module—human perception and cognition, multimodal I/O, Nielsen’s heuristics, Shneiderman’s golden rules, and universal design—and evaluates opportunities, risks, and open research questions. The central argument is that the primary design object is no longer the screen flow but the *behaviour of collaboration*: trust calibration, observability, reversible control, and coherent multimodal fusion.

---

## 1. Introduction

### 1.1 Why this trend matters now

Classical HCI framed interaction as a dialogue between a human information processor and a computer with input/output devices (Dix et al., 2004). Course material emphasises that humans receive information visually, auditorily, and haptically; store it in sensory, short-term, and long-term memory; and apply it through reasoning, skill, and error-prone problem solving. Emotion and individual differences further shape capability. Those foundations remain valid—but the *computer side* of the dialogue has changed.

IEEE Computer Society’s 2026 trend analysis summarises the shift clearly: systems are moving from reactive tools to goal-driven agents, and HCI is moving beyond interface optimisation toward reducing interaction overhead itself (Belani, 2026). Jakob Nielsen similarly predicts that 2026 is the year of AI agents and of a move from *Conversational UI* (ask a question) to *Delegative UI* (assign a goal) (Nielsen, 2026).

This report treats **agentic multimodal interfaces**—including generative UI, computer-use agents, and zero-/low-UI ambient interaction—as the latest major HCI/UX trend, because it:

1. Reconfigures the role of the interface from primary control surface to oversight and recovery layer.  
2. Makes multimodality (speech, vision, gesture, text, sensors) the default rather than an accessibility add-on.  
3. Forces designers to revisit trust, agency, memory load, error recovery, and universal usability—topics already central to this module’s heuristics lectures.

### 1.2 Scope and method

Sources were selected from:

- Peer-reviewed HCI venues (CHI, UIST, ACL Findings, IEEE Access, Foundations and Trends in HCI).  
- Recent arXiv preprints with clear empirical or system contributions (2024–2026).  
- Deployed products and vendor research blogs (Google Gemini GenUI, Claude/OpenAI computer use, Nuance ShapeWriter lineage).  
- Industry analyses (IEEE Computer Society, Nielsen’s UX predictions).

The review is organised thematically rather than chronologically, then linked back to course theory.

---

## 2. Background: Classical HCI meets a new interaction model

### 2.1 The human as information processor

Lecture content on *the human* remains a useful lens:

| Course concept | Relevance to agentic multimodal UX |
|----------------|-------------------------------------|
| Vision (acuity, colour, reading via saccades/fixations) | GenUI and dashboard feedback must respect visual acuity, avoid blue for fine detail, support negative-contrast screen reading where appropriate. |
| Hearing (cocktail party effect; pitch/loudness/timbre) | Speech agents and auditory icons must filter noise and support selective attention. |
| Touch / kinethesis | Haptic confirmation becomes critical when UI visibility drops (BMW iDrive–style detents; force feedback). |
| STM 7±2 chunks; recognition over recall | Agents that force users to remember multi-step plans violate Shneiderman’s “reduce short-term memory load” and Nielsen’s “recognition rather than recall”. |
| Slips vs mistakes | Agent errors often look like *mistakes* (wrong intention/plan) even when the user stated the goal correctly—mental-model mismatch. |
| Emotion / affect (Norman) | Positive affect supports difficult tasks; stress from opaque automation narrows thinking. |
| Universal design (equitable use, perceptible information, tolerance for error) | Multimodal redundancy can include more users—or exclude them if one modality is assumed. |

### 2.2 From WIMP to agents

Lecture 2’s historical arc—from Sketchpad and Engelbart’s mouse, through Xerox PARC WIMP and the Macintosh GUI, to ubiquitous computing and touch—shows that “new” interaction styles usually mature over decades. Agentic interfaces similarly have precursors: mixed-initiative systems, intelligent agents of the 1990s, and earlier multimodal research (Bolt’s “Put That There,” speech synthesis for accessibility). What is new in 2024–2026 is *reliability and generality*: foundation models can plan across heterogeneous tools and generate interactive UIs on demand (Leviathan et al., 2025; Chen et al., 2026).

### 2.3 Useful / usable / used

Dix’s three “use” words remain a useful checklist:

- **Useful** — Does the agent complete real tasks (booking, coding, navigation)?  
- **Usable** — Is control recoverable; is status visible; are errors diagnosable?  
- **Used** — Is the system acceptable to organisations (governance, liability, privacy)?

Many current agents score high on usefulness demos and lower on usable oversight and organisational use.

---

## 3. Defining the trend

### 3.1 Agentic interaction (Delegative UI)

An *AI agent* in the HCI sense is software that can plan, call tools, maintain memory/context, and execute multi-step workflows with limited turn-by-turn instruction (Belani, 2026). Interaction becomes:

1. User states **intent**.  
2. Agent produces a **plan**.  
3. Agent **executes** (optionally with human checkpoints).  
4. User **verifies, corrects, or undoes**.

This differs from classical GUIs (direct manipulation of objects) and from early chatbots (single-turn Q&A).

### 3.2 Multimodal interaction as default

Course lectures distinguish multi-*modal* (multiple senses/modes) from multi-*media* (multiple media within one mode). 2026 systems increasingly fuse voice, text, vision, gesture, and sensor context into one intent model (Belani, 2026; Nielsen, 2026). Practical UX writing increasingly argues that *multimodal UX*—switching channels by context while retaining screens when needed—is more realistic than pure “Zero UI” (LogRocket / industry UX commentary, 2025).

### 3.3 Generative UI (GenUI)

Generative UI means the model generates not only content but an *interactive interface*—layouts, controls, simulations—tailored to the query (Leviathan et al., 2025; generativeui.github.io, 2025). ACL Findings work reports up to ~72% improvement in human preference for generative interfaces over traditional chat for many tasks (Chen et al., 2026). Google has begun shipping related capabilities in Gemini “dynamic view” and Search AI Mode (Google Research, 2025).

### 3.4 Computer-use agents

Computer-use agents (CUAs) operate GUIs by seeing screens and issuing clicks/keystrokes. Research explores both *agents that use UIs* and *agents that judge generated UIs* to improve GenUI quality iteratively (Coder–CUA frameworks; arXiv 2511.15567, 2025). InfantAgent-Next exemplifies modular multimodal agents routing subtasks to specialist models while keeping a unified dialogue context (arXiv 2505.10887, 2025).

---

## 4. State of the art: Research

### 4.1 Trust, agency, and plan-then-execute

A CHI 2025 study (N = 248) examined LLM agents as daily assistants across six tasks of varying risk (e.g., flight booking, credit-card payment) using a **plan-then-execute** pattern with human involvement at planning and/or execution stages (Liu et al. / CHI ’25; arXiv:2502.01390). Key findings relevant to UX:

- Agents are a **double-edged sword**: high-quality plans plus appropriate execution involvement can work well.  
- Users can **mistrust** agents even when plans *look* plausible.  
- Trust calibration and collaborative performance depend on *where* humans intervene, not only on whether explanations exist.

This aligns with Nielsen’s *visibility of system status*, *user control and freedom*, and *error prevention*, and with Shneiderman’s *informative feedback*, *easy reversal of actions*, and *internal locus of control*.

Related CHI ’25 work on recommender systems shows that **transparency alone is insufficient** for agency; combining transparency with controls that influence outcomes improves sensed agency (shared-agency recommender study, CHI ’25).

### 4.2 Survey literature on GenAI interaction design

Several surveys organise the design space:

- Luera et al. survey UI design and interaction techniques for generative AI applications, taxonomising explicit user-initiated and system-driven patterns and focusing on agency and control (Foundations and Trends in HCI / arXiv:2410.22370).  
- Shi et al. survey 291 papers and propose a taxonomy covering purposes of use, model-to-user feedback, user-to-model control, engagement levels, domains, and evaluation strategies.  
- IEEE Access work proposes a modality-based taxonomy (text, image, audio, multimodal) and discusses usability and explainability challenges (UI/UX for Generative AI, 2024).  
- Workshop material for CHI ’26 outlines a research agenda specifically for generative user interfaces (Pott et al., 2026).

Across these surveys, recurring UX problems include prompt brittleness, unclear model capability boundaries, difficulty reviewing long outputs, and weak support for progressive disclosure.

### 4.3 Accessibility and inclusive multimodal agents

Course lectures stress aids for visual, hearing, physical, and speech impairments, plus age and cultural differences. Recent systems show how multimodal AI can operationalise universal design:

- **StreetReaderAI** (UIST 2025) makes Street View accessible to blind users via context-aware multimodal AI, conversational speech, and accessible navigation; co-designed with a mixed visual-ability team and evaluated with eleven blind users (Froehlich et al., 2025).  
- **VIA-Agent** (2025) targets real-time visual assistance for people with visual impairments, co-optimising concise goal-persistent guidance (“brain”) with real-time communication embodiment (“body”) to reduce cognitive load and task drift; reported substantial task-time reductions versus baselines in the wild (Zhao et al., arXiv:2511.00945).

These systems reconnect to lecture themes: speech synthesis for visually impaired users, dual-mode redundant displays, and the need to keep STM load low during mobile tasks.

### 4.4 Evaluation methods under change

Lecture content contrasts usability inspection (heuristic evaluation; 3–5 experts) with user studies and notes psychology’s controlled-experiment paradigm plus ethnographic/qualitative methods. Agentic systems strain classic metrics:

- Task success may hide **silent partial failure** (wrong booking details).  
- Preference for GenUI can ignore **latency** (generation may take tens of seconds to a minute) (Google Research, 2025).  
- Ecological validity matters: agents that succeed in simulation may fail under real risk and organisational policy.

Researchers increasingly combine preference studies, SUS, cognitive-load measures, and in-the-wild trials (as in VIA-Agent).

---

## 5. State of the art: Products and industry practice

### 5.1 Generative UI in consumer products

Google’s Generative UI implementation uses a strong base model (Gemini), tool access (search, image generation), carefully engineered system instructions, and post-processing (Leviathan et al., 2025). Human preference studies favour GenUI over markdown chat when speed is ignored; expert-crafted sites still lead. Productisation appears as Gemini dynamic view / visual layout experiments and Search AI Mode interactive tools.

**UX implication:** Preference ≠ production readiness. Latency, hallucination of UI behaviour, accessibility of generated controls, and brand consistency remain open.

### 5.2 Desktop and coding agents

Coding copilots and computer-use modes (e.g., Anthropic Claude Computer Use; OpenAI operator-style agents; enterprise workflow agents) illustrate Delegative UI in professional contexts. InfantAgent-Next reports gains on OSWorld / GAIA / SWE-Bench style benchmarks relative to strong baselines (2025).

**UX implication:** Expert users need observability of tool calls, diff-style verification, and easy reversal—echoing Shneiderman’s closure, feedback, and undo rules.

### 5.3 Mobile text entry as historical multimodal lesson

Kristensson and Zhai’s gesture keyboard work (SHARK2 / ShapeWriter / later Swype lineage) showed continuous skill acquisition from closed-loop tracing to open-loop gesturing (UIST 2004; commercialised later). It remains a useful HCI lesson for agents: design for **novice-to-expert transition**, not only first-use wow. Agentic systems that only support “magic one-shot” prompts without progressive disclosure recreate the novice trap.

### 5.4 Ambient / Zero UI products

Smart speakers, automotive assistants, wearables, and sensor-driven environments embody Zero UI ideas. Industry analyses caution that removing UI also removes visibility; recovery paths must remain (Belani, 2026). Multimodal UX—screen when needed, voice/haptics when appropriate—is the pragmatic product stance.

---

## 6. Mapping the trend to course heuristics

Students in this module must apply Nielsen (1994) and Shneiderman & Plaisant (2010). The following mapping shows how agentic multimodal design stresses both lists.

### 6.1 Nielsen’s ten heuristics (selected pressures)

| Heuristic | Agentic multimodal pressure |
|-----------|-----------------------------|
| Visibility of system status | Agents act off-screen; need live plans, progress, and tool-call traces. |
| Match system ↔ real world | Natural language helps; invented “agent jargon” and opaque tool names hurt. |
| User control and freedom | Need cancel, pause, rollback, and “take over GUI” escapes. |
| Consistency and standards | GenUI may reinvent layouts per prompt—good for fit, bad for learnability. |
| Error prevention | Confirm high-risk actions (payments); constrain tools by policy. |
| Recognition rather than recall | Show plans and options; do not force users to remember prior agent state. |
| Flexibility and efficiency | Shortcuts and saved workflows for experts; natural language for novices. |
| Aesthetic and minimalist design | Avoid dumping full chain-of-thought; show progressive detail. |
| Help recognise, diagnose, recover | Translate failures into actionable repair (“which step failed?”). |
| Help and documentation | Still needed for capability boundaries (“what can this agent *not* do?”). |

### 6.2 Shneiderman’s eight golden rules (selected pressures)

| Golden rule | Agentic multimodal pressure |
|-------------|-----------------------------|
| Strive for consistency | Tension with personally generated UIs. |
| Cater to universal usability | Multimodal redundancy is opportunity; defaulting to voice-only excludes many. |
| Offer informative feedback | Confidence scores and stage markers beat silent completion. |
| Design dialogues to yield closure | Multi-step agent tasks need clear start–middle–end. |
| Prevent errors | Guardrails > post-hoc apology messages. |
| Permit easy reversal | Transactional undo across tools is hard but essential. |
| Support internal locus of control | Users must feel they *delegate*, not that they are *overridden*. |
| Reduce short-term memory load | Persist context visually; chunk long plans. |

Bold items unique to each list (as noted in lecture slides)—e.g., Nielsen’s help/documentation and aesthetic minimalism; Shneiderman’s universal usability and dialogue closure—remain especially relevant when UI thins out.

---

## 7. Human factors analysis

### 7.1 Attention, memory, and Fitts’ Law

Agents that interrupt frequently compete for attention; agents that never surface status cause undetected error. Dual-mode displays (visual + non-speech sound), discussed in lectures on auditory icons and earcons, remain useful for background status (copy complete, agent waiting for approval).

For residual GUI pointing, Fitts’ Law still applies: approval buttons and “stop agent” controls should be large and near the locus of attention. When eye-gaze or gesture replaces the mouse, the same speed–accuracy trade-offs appear under new constants.

### 7.2 Mental models and errors

Lecture distinction:

- **Slip** — right intention, wrong execution.  
- **Mistake** — wrong intention from a faulty mental model.

Users often form incorrect mental models of agent capability (“it checked the whole policy”). When the model is wrong, errors are mistakes at the human–AI team level. Design should expose *capability boundaries* and *uncertainty*, not only fluent language.

### 7.3 Emotion and aesthetics

Norman’s observation that positive affect makes hard tasks easier, and negative affect makes easy tasks harder, predicts that opaque automation under time pressure will degrade performance. Aesthetically clear, rewarding oversight UIs are not decoration; they are cognitive support. Conversely, manipulative “emotion as leverage” (urgency dark patterns) becomes more dangerous when systems act autonomously (industry UX commentary, 2026).

### 7.4 Individual differences

Long-term (ability, culture), short-term (fatigue, stress), and changing (age) differences imply that adaptive agents must avoid excluding populations. Cultural interpretation of speech prosody, gesture, and colour—flagged in lectures—remains unresolved for global agent products.

---

## 8. Design implications and recommended patterns

Synthesising research and products, the following patterns are emerging as good practice:

1. **Plan-then-execute with risk-sensitive checkpoints** — Auto-run low-risk steps; require confirmation for irreversible or high-stakes actions (CHI ’25 daily-assistant findings).  
2. **Observability by default** — Visible plan, current step, tools used, artefacts produced.  
3. **Reversible delegation** — Pause, edit plan, undo last tool effect, export audit trail.  
4. **Multimodal coherence** — One interaction model with multiple entry points; resolve conflicting signals explicitly (Belani, 2026).  
5. **GenUI with constraints** — Allow generated layouts but constrain components to an accessible design system (consistency + universal usability).  
6. **Calibrated conciseness for assistive agents** — Prefer short actionable guidance over verbose narration (VIA-Agent).  
7. **Evaluate beyond preference** — Measure task outcome quality, recovery time, trust calibration, and cognitive load—not only “liked GenUI more than markdown.”

---

## 9. Challenges and open problems

| Challenge | Why it matters |
|-----------|----------------|
| Silent / partial failure | Task “succeeds” with wrong details; classical error messages do not appear. |
| Trust miscalibration | Overtrust (automation bias) and undertrust both harm team performance. |
| GenUI inconsistency | Per-prompt layouts break learned patterns and accessibility testing. |
| Latency vs quality | Preferred interfaces may be too slow for interactive use. |
| Multimodal conflict | Voice says “yes” while gesture cancels; fusion policy is UX, not only ML. |
| Privacy and sensing | Ambient Zero UI depends on continuous context—ethical and legal tension. |
| Evaluation validity | Lab preference ≠ organisational adoption; ecological validity remains hard. |
| Equity | Premium agent tiers vs free tiers may widen digital divides (Nielsen, 2026). |

---

## 10. Conclusion

The latest HCI/UX trend is not merely “chatbots got better.” It is a move toward **agentic, multimodal, often generative interfaces** in which users delegate goals and systems act across tools and senses. This trend reconnects directly to the module’s foundations: human perception and cognition constrain what can be monitored; heuristics demand visibility, control, and low memory load; universal design demands multimodal redundancy without modality lock-in.

State-of-the-art research (CHI 2025 trust studies, GenAI interaction surveys, UIST accessibility systems) and products (Gemini Generative UI, computer-use agents, assistive multimodal agents) converge on the same design centre of gravity: **trustworthy collaboration**. The designers and engineers who succeed will treat policies, permissions, confirmations, and recovery paths as first-class interface elements—sometimes more important than the screens that remain.

Future coursework and practice should therefore practise asking the “right questions” emphasised in Lecture 1: Who is the user when the “user” is supervising an agent? What counts as feedback when action is invisible? How do we evaluate systems that act, not only interfaces that respond?

---

## References

Belani, G. (2026). *Top HCI trends in 2026: The rise of AI agents and invisible interfaces*. IEEE Computer Society. https://www.computer.org/publications/tech-news/trends/hci-trends-2026  

Chen, J., Zhang, Y., Zhang, Y., Shao, Y., & Yang, D. (2026). Generative interfaces for language models. In *Findings of the Association for Computational Linguistics (ACL 2026)* (pp. 1499–1519). https://aclanthology.org/2026.findings-acl.74/  

Dix, A., Finlay, J., Abowd, G. D., & Beale, R. (2004). *Human–computer interaction* (3rd ed.). Pearson / Prentice Hall.  

Froehlich, J., et al. (2025). *StreetReaderAI: Making Street View accessible using context-aware multimodal AI*. In *Proceedings of UIST 2025*. ACM.  

Google Research / Leviathan, Y., Valevski, D., Natchu, V., & Matias, Y. (2025, November 18). *Generative UI: A rich, custom, visual interactive user experience for any prompt*. https://research.google/blog/generative-ui-a-rich-custom-visual-interactive-user-experience-for-any-prompt/  

Generative UI project page. (2025). *Generative UI: LLMs are effective UI generators*. https://generativeui.github.io/  

Kristensson, P. O., & Zhai, S. (2004). SHARK²: A large vocabulary shorthand writing system for pen-based computers. In *Proceedings of UIST 2004* (pp. 43–52). ACM.  

Liu, et al. (2025). Plan-then-execute: An empirical study of user trust and team performance when using LLM agents as a daily assistant. In *Proceedings of CHI 2025*. ACM. https://doi.org/10.1145/3706598.3713218 (also arXiv:2502.01390)  

Luera, R., Rossi, R. A., Siu, A., et al. (2024). Survey of user interface design and interaction techniques in generative AI applications. arXiv:2410.22370. (See also Foundations and Trends in HCI survey on UI design for generative AI.)  

Nielsen, J. (1994). *Usability engineering*. Morgan Kaufmann. Heuristic list: https://www.nngroup.com/articles/ten-usability-heuristics/  

Nielsen, J. (2026). *18 predictions for 2026*. https://jakobnielsenphd.substack.com/p/2026-predictions  

Nielsen, J., & Molich, R. (1990). Heuristic evaluation of user interfaces. In *Proceedings of CHI 1990* (pp. 249–256). ACM.  

Norman, D. A. (2004). *Emotional design: Why we love (or hate) everyday things*. Basic Books. (Affect and task difficulty; cited in course notes.)  

Pott, K., Rietsche, R., Söllner, M., & Wambsganss, T. (2026). A taxonomy and research agenda for generative user interfaces. *CHI ’26 Generative UI Workshop*.  

Shi, J., et al. *An HCI-centric survey and taxonomy of human–generative-AI interactions*. Survey of 291 papers. http://jingyushi.me/assets/pdf/hgai.pdf  

Shneiderman, B., & Plaisant, C. (2010). *Designing the user interface* (5th/relevant ed.). Addison-Wesley. Eight golden rules, pp. 88–89.  

Zhao, Y., Wang, S., Geng, Q., Yu, E., & Li, J. (2025). “Less is more”: Reducing cognitive load and task drift in real-time multimodal assistive agents for the visually impaired. arXiv:2511.00945.  

Additional technical systems cited:  

- InfantAgent-Next: A multimodal generalist agent for automated computer interaction. arXiv:2505.10887 (2025).  
- Computer-use agents as judges for generative user interface. arXiv:2511.15567 (2025).  
- Towards a working definition of designing generative user interfaces. arXiv:2505.15049 (2025).  
- UI/UX for generative AI: Taxonomy, trend, and challenge. *IEEE Access* (2024). https://doi.org/10.1109/ACCESS.2024.3502628  

---

## Appendix A: Suggested further reading tied to lectures

| Lecture theme | Further reading |
|---------------|-----------------|
| Multimodal systems / speech / earcons | StreetReaderAI (UIST 2025); VIA-Agent (2025); classic SonicFinder examples in Dix et al. |
| Heuristic evaluation | Nielsen & Molich (1990); apply both Nielsen and Shneiderman lists to an agent product |
| History of HCI | Sketchpad → WIMP → ubicomp → agents (Lecture 2 timeline) |
| Emotion in design | Norman; trust/agency CHI 2025 papers |
| Fitts / pointing | Still relevant for confirmation widgets and hybrid AR agents |

## Appendix B: How this report was scoped

The topic was chosen because it is (a) widely recognised as a 2026 HCI/UX frontier, (b) directly supported by peer-reviewed 2025–2026 work, and (c) tightly coupled to module learning outcomes: human capabilities, computer I/O, heuristics, multimodality, accessibility, and evaluation. Alternative trendy topics (pure AR/VR spatial computing, brain–computer interfaces) were considered; agentic multimodal interfaces currently have denser empirical HCI evidence and clearer product deployment.
