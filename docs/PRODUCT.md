# Twin: a personal decision workspace

## The promise

Remember useful context, deliberately apply it to a task, and preserve your reasoning and outcomes. Twin is evolving from a style-based digital companion into a workspace for continuity: you should not need to explain the same goals, preferences, evidence, and constraints every time you ask for help.

The core loop is **remember → apply → review → decide → reflect**. A memory is not automatically a verified fact, an AI result is not automatically a decision, and a recorded decision is not an action performed on your behalf.

## What is implemented

| Capability | Behavior |
| --- | --- |
| Projects | Named spaces with a purpose and standing instructions. Archive/restore without deleting history. |
| Typed memories | Facts, preferences, research, instructions, and decisions. Title, text, tags, source/provenance, optional review date, version, pin, and archive. |
| Explicit context | Choose the active project memories for a task. All active pinned memories and standing project instructions are included. No hidden semantic selection. |
| Context preview | Inspect the exact project brief, objective, and memory text that will be sent to Gemini. Export it as a portable context pack. |
| Context confirmation | Signed deterministic manifests detect changed instructions, memory versions, sources, or selected/pinned notes. A changed context requires a new preview. |
| Task studio | Analyze, compare, plan, or draft. Reusable starting prompts, persistent history, safe Markdown, copy, and download. |
| Durable results | Store the generated result together with an immutable input snapshot. Editing a memory later does not rewrite past task inputs. |
| Review | Mark a result as needs-review, accepted, or dismissed; add review notes without changing the original result. |
| Decision journal | Record your choice, reasoning, assumptions, optional supporting task, review date, and eventual outcome. Statuses: considering, decided, closed. |
| User-approved learning | Save an edited task excerpt or journal lesson as a project memory, with provenance. Nothing is silently learned as fact. |
| Existing-memory bridge | Select memories from an owned twin and copy them into a project with a chosen type. Originals stay unchanged; re-import does not overwrite project copies. |
| Export | Download project context packs, Markdown task results, or a version-2 full account JSON export. |

## Example: research that carries forward

1. Create an “Investment research” project with your question, goals, and the evaluation process you want to follow.
2. Add your own criteria as preferences/instructions, pin essential constraints, and add dated research notes with provenance.
3. Start a compare/analyze task. Include the company or option information you actually want analyzed and select the notes that apply.
4. Preview the entire context. A review-date warning means you should verify the note; it is not evidence that the underlying information has been refreshed.
5. Run the task. Inspect the result, memory references, assumptions, and missing information.
6. Write your decision in the journal. Return later to record what happened and which assumptions held up.
7. Explicitly save a useful lesson as a new memory for future tasks.

This version **does not retrieve live quotes/news, browse source URLs, access a brokerage, or execute trades**. The same workflow can be used for product planning, learning, writing, and other recurring decisions. The initial capability is analysis of supplied material, not an autonomous investment agent.

## What makes this useful

- **Inspectable context:** you can see why a memory is included and change the selection before running.
- **Constraints are not lost in similarity search:** pinned notes are always present or the task refuses an oversized context.
- **Historical reasoning stays explainable:** old results retain the exact note versions they used.
- **Outcomes close the loop:** a journal records how a decision turned out, rather than merely accumulating chat transcripts.
- **Memory remains yours:** sources, review dates, explicit promotion, archives, and portable exports help you inspect and correct it.

## Boundaries

Up to 30 memories per task, including pinned notes; each memory contains up to 4,000 characters. Task objectives allow up to 12,000 characters. Task and journal indexes show the latest 200 records; full export includes all records. Context packs are export-only in this release.

No automatic contradiction detector, automatic fact extraction, web research, file ingestion, scheduled reminders, execution tools, or cross-project semantic retrieval is claimed. The model is instructed to identify conflicts and missing evidence, but that is not a deterministic verification system. “Review on” is a visible flag, not a background notification.

The existing twin/chat experience remains under **Twin studio**. Its per-twin semantic chat retrieval is separate from the new project's explicit context contract. Nothing is automatically moved or deleted during schema migration.
