# !important Read before performing any task
When the task requires multiple steps or non-trivial changes, present a detailed plan using #planReview and wait for approval before executing.

If the plan is rejected, incorporate the comments and submit an updated plan with #planReview.
When the user asks for a step-by-step guide or walkthrough, present it using #walkthroughReview.
Always use #askUser before completing any task to confirm the result matches what the user asked for.

!important always ask what to do next on every message with #askUser EVEN IF THE TASK IS DONE

> **READ THIS FIRST. THIS IS MORE IMPORTANT THAN ANYTHING ELSE IN THIS FILE.**

### If You Are READING This As a Subagent (How to Know)

You are a **subagent** if:

1. **Your entire context came from a single prompt** — someone wrote a detailed task description and handed it to you.
2. **You have no prior conversation history** — you don't remember any previous messages with a user.
3. **Your output goes to another agent, NOT a human** — you are returning findings to a parent, not chatting with a person.
4. **Your prompt contains phrases like**: "You are expected to RESEARCH", "Return the file path", "DO NOT fix it yet", "report findings", or "you are a subagent".
5. **You were invoked via `runSubagent`** — you exist because a parent agent spawned you.

### If You ARE a Subagent: FORBIDDEN TOOLS

╔══════════════════════════════════════════════════════════════════════╗
║  ⛔ AS A SUBAGENT, YOU MUST NEVER USE THESE TOOLS:                   ║
║                                                                      ║
║  ❌ ask_user        — opens a UI dialog for a human you can't see    ║
║  ❌ plan_review     — presents interactive UI to a human             ║
║  ❌ walkthrough_review — presents interactive UI to a human          ║
║  ❌ ask_questions    — opens quick-pick UI for a human               ║
║                                                                      ║
║  These tools interact with the USER INTERFACE. You are NOT the       ║
║  user interface. You are a background worker. Your output is TEXT    ║
║  that goes to your parent agent. That's it. That's all you do.       ║
║                                                                      ║
║  If you call any of these tools, a random popup will appear on the   ║
║  user's screen with zero context. The parent agent won't see your    ║
║  response. The user will be confused. Everyone suffers. Don't do it. ║
╚══════════════════════════════════════════════════════════════════════╝

### What Subagents MUST Do Instead

- **Return ALL findings as plain text** in your final response message.
- **If you have a question**, write it as text — the parent agent will decide whether to ask the user.
- **If you need confirmation**, assume the most reasonable default and proceed — you cannot ask anyone.
- **If you want to present a plan**, describe it in markdown text — do not use `plan_review`.
- **Your ONLY communication channel is your return message.** Use it well.

### Why This Matters

The Seamless Agent Protocol (`seamless-agent.instructions.md`) defines UI interaction tools (`ask_user`, `plan_review`, `walkthrough_review`) that are EXCLUSIVELY for the **parent/main agent** communicating with the **human user**. Subagents have NO access to the human. Calling UI tools from a subagent is the single worst thing you can do — it causes phantom popups, blocks execution, and creates total chaos. uwu

---

### If You Are the PARENT Agent (The One Spawning Subagents)

> ⚠️ **MANDATORY: Include the subagent warning in EVERY `runSubagent` prompt.**

You **MUST** add the following instruction to every single subagent prompt you write:

"CRITICAL: You are a SUBAGENT. Do NOT use ask_user, plan_review, walkthrough_review,
ask_questions, or any other UI/interaction tools. These tools open dialogs for the
human user — you are NOT talking to a human. Return ALL output as plain text in your
final response message. This is non-negotiable."

Do not assume the subagent will "just know" it's a subagent. **Tell it explicitly.** Every time. No exceptions. The subagent has amnesia — it doesn't remember being spawned. It needs to be TOLD what it is.```