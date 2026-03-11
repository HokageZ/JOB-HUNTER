import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { chatWithRetry } from "@/lib/openrouter";
import type { ChatMessage } from "@/lib/openrouter";
import {
  buildToolInstructions,
  parseToolCall,
  executeTool,
  getToolDef,
} from "@/lib/agent-tools";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = body.message?.trim();
    // For permission confirmations
    const confirmAction = body.confirmAction as
      | { name: string; args: string[] }
      | undefined;
    const denyAction = body.denyAction as boolean | undefined;

    const db = getDb();

    // Handle permission confirmation
    if (confirmAction) {
      const result = await executeTool(confirmAction.name, confirmAction.args);

      // Feed result back to AI for a natural response
      const history = db
        .prepare("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 20")
        .all() as { role: string; content: string }[];
      history.reverse();

      const messages: ChatMessage[] = [
        { role: "system", content: "You are a helpful job search assistant. The user approved an action. Summarize the result naturally." },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
        {
          role: "user" as const,
          content: `[Tool result for ${confirmAction.name}]: ${result.data}`,
        },
      ];

      const response = await chatWithRetry(messages, { maxTokens: 512 });
      const cleanResponse = response.replace(/<tool>[^<]*<\/tool>/g, "").trim();

      const insert = db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)");
      insert.run("assistant", cleanResponse);

      return NextResponse.json({ success: true, data: { response: cleanResponse } });
    }

    // Handle permission denial
    if (denyAction) {
      const history = db
        .prepare("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 20")
        .all() as { role: string; content: string }[];
      history.reverse();

      const messages: ChatMessage[] = [
        { role: "system", content: "You are a helpful job search assistant. The user denied the action you proposed. Acknowledge this gracefully and ask how else you can help." },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ];

      const response = await chatWithRetry(messages, { maxTokens: 256 });
      const cleanResponse = response.replace(/<tool>[^<]*<\/tool>/g, "").trim();

      const insert = db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)");
      insert.run("assistant", cleanResponse);

      return NextResponse.json({ success: true, data: { response: cleanResponse } });
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Load recent chat history (last 20 messages)
    const history = db
      .prepare("SELECT role, content FROM chat_history ORDER BY id DESC LIMIT 20")
      .all() as { role: string; content: string }[];
    history.reverse();

    // Build system prompt with tool instructions
    const toolInstructions = buildToolInstructions();

    const systemPrompt = `You are a helpful, agentic job search assistant. You help the user find jobs, review their resume, prepare for interviews, and track applications.

${toolInstructions}

You can help with:
1. Job search advice and strategy — use search_jobs to find relevant positions
2. Resume feedback — use view_resume to read the user's resume
3. Profile review — use view_profile to see the user's profile details
4. Application tracking — use view_applications to see status
5. Web research — use search_web for salary data, company info, trends
6. Profile updates — use update_profile (requires permission)
7. Interview preparation and salary negotiation advice

Be concise, specific, and actionable. Use tools when they would provide better answers.
Keep responses focused and practical — avoid generic filler.`;

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Save user message
    const insert = db.prepare("INSERT INTO chat_history (role, content) VALUES (?, ?)");
    insert.run("user", message);

    // Agent loop — call AI, check for tool calls, execute, repeat
    const MAX_TOOL_ROUNDS = 3;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const aiResponse = await chatWithRetry(messages, { maxTokens: 1024 });

      const toolCall = parseToolCall(aiResponse);

      if (!toolCall) {
        // No tool call — this is the final response
        const cleanResponse = aiResponse.replace(/<tool>[^<]*<\/tool>/g, "").trim();
        insert.run("assistant", cleanResponse);
        return NextResponse.json({ success: true, data: { response: cleanResponse } });
      }

      // Tool call detected
      const toolDef = getToolDef(toolCall.name);
      if (!toolDef) {
        // Unknown tool — return what we have
        const cleanResponse = aiResponse.replace(/<tool>[^<]*<\/tool>/g, "").trim() || "I tried to use an unknown tool. Let me try a different approach.";
        insert.run("assistant", cleanResponse);
        return NextResponse.json({ success: true, data: { response: cleanResponse } });
      }

      // If tool requires permission, send back a pending action
      if (toolDef.requiresPermission) {
        const label = toolDef.permissionLabel(toolCall.args);
        const preText = aiResponse.replace(/<tool>[^<]*<\/tool>/g, "").trim();

        return NextResponse.json({
          success: true,
          data: {
            response: preText || undefined,
            pendingAction: {
              name: toolCall.name,
              args: toolCall.args,
              label,
            },
          },
        });
      }

      // Execute read-only tool
      const result = await executeTool(toolCall.name, toolCall.args);

      // Add tool call and result to conversation
      messages.push({ role: "assistant", content: aiResponse });
      messages.push({
        role: "user",
        content: `[Tool result for ${toolCall.name}]: ${result.data}`,
      });
    }

    // Exhausted tool rounds — ask AI for final response without tools
    const finalResponse = await chatWithRetry(messages, { maxTokens: 1024 });
    const cleanFinal = finalResponse.replace(/<tool>[^<]*<\/tool>/g, "").trim();
    insert.run("assistant", cleanFinal);
    return NextResponse.json({ success: true, data: { response: cleanFinal } });
  } catch (error) {
    console.error("[ai/chat] Error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to get AI response";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = getDb();
    const messages = db
      .prepare("SELECT id, role, content, created_at FROM chat_history ORDER BY id ASC")
      .all();

    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    console.error("[ai/chat] GET Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load chat history" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    db.prepare("DELETE FROM chat_history").run();
    return NextResponse.json({ success: true, data: { message: "Chat history cleared" } });
  } catch (error) {
    console.error("[ai/chat] DELETE Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear chat history" },
      { status: 500 }
    );
  }
}
