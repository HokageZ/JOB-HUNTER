import { describe, it, expect } from "vitest";
import { parseToolCall, buildToolInstructions, getToolDef, TOOLS } from "@/lib/agent-tools";

describe("agent-tools — parseToolCall", () => {
  it("parses simple tool call", () => {
    const result = parseToolCall("<tool>search_jobs|react developer</tool>");
    expect(result).toEqual({ name: "search_jobs", args: ["react developer"] });
  });

  it("parses tool with no args", () => {
    const result = parseToolCall("<tool>view_profile</tool>");
    expect(result).toEqual({ name: "view_profile", args: [] });
  });

  it("parses tool with multiple args", () => {
    const result = parseToolCall(
      "<tool>update_profile|skills|JavaScript, React, Node</tool>"
    );
    expect(result).toEqual({
      name: "update_profile",
      args: ["skills", "JavaScript, React, Node"],
    });
  });

  it("returns null for no tool tag", () => {
    expect(parseToolCall("Hello, how can I help?")).toBeNull();
  });

  it("returns null for unknown tool", () => {
    expect(parseToolCall("<tool>unknown_tool|arg</tool>")).toBeNull();
  });

  it("trims whitespace from args", () => {
    const result = parseToolCall("<tool>search_jobs|  react  </tool>");
    expect(result).toEqual({ name: "search_jobs", args: ["react"] });
  });

  it("handles tool tag inside longer text", () => {
    const text =
      "Let me search for that.\n<tool>search_jobs|frontend</tool>\nI'll check.";
    const result = parseToolCall(text);
    expect(result).toEqual({ name: "search_jobs", args: ["frontend"] });
  });

  it("parses dismiss_job tool", () => {
    const result = parseToolCall("<tool>dismiss_job|42</tool>");
    expect(result).toEqual({ name: "dismiss_job", args: ["42"] });
  });

  it("parses add_application_note tool", () => {
    const result = parseToolCall(
      "<tool>add_application_note|7|Great interview today</tool>"
    );
    expect(result).toEqual({
      name: "add_application_note",
      args: ["7", "Great interview today"],
    });
  });

  it("parses search_web tool", () => {
    const result = parseToolCall(
      "<tool>search_web|average salary frontend developer UAE</tool>"
    );
    expect(result).toEqual({
      name: "search_web",
      args: ["average salary frontend developer UAE"],
    });
  });

  it("parses view_applications", () => {
    const result = parseToolCall("<tool>view_applications</tool>");
    expect(result).toEqual({ name: "view_applications", args: [] });
  });

  it("parses view_resume", () => {
    const result = parseToolCall("<tool>view_resume</tool>");
    expect(result).toEqual({ name: "view_resume", args: [] });
  });
});

describe("agent-tools — getToolDef", () => {
  it("returns tool definition by name", () => {
    const tool = getToolDef("search_jobs");
    expect(tool).toBeDefined();
    expect(tool?.name).toBe("search_jobs");
    expect(tool?.requiresPermission).toBe(false);
  });

  it("returns undefined for unknown tool", () => {
    expect(getToolDef("nonexistent")).toBeUndefined();
  });

  it("identifies permission-required tools", () => {
    const updateProfile = getToolDef("update_profile");
    expect(updateProfile?.requiresPermission).toBe(true);

    const dismissJob = getToolDef("dismiss_job");
    expect(dismissJob?.requiresPermission).toBe(true);

    const addNote = getToolDef("add_application_note");
    expect(addNote?.requiresPermission).toBe(true);
  });

  it("identifies safe (no-permission) tools", () => {
    const safe = ["search_jobs", "view_profile", "view_applications", "view_resume", "search_web"];
    for (const name of safe) {
      expect(getToolDef(name)?.requiresPermission).toBe(false);
    }
  });
});

describe("agent-tools — TOOLS registry", () => {
  it("has exactly 8 tools", () => {
    expect(TOOLS).toHaveLength(8);
  });

  it("all tools have required fields", () => {
    for (const tool of TOOLS) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(Array.isArray(tool.args)).toBe(true);
      expect(typeof tool.requiresPermission).toBe("boolean");
      expect(typeof tool.permissionLabel).toBe("function");
    }
  });
});

describe("agent-tools — buildToolInstructions", () => {
  it("generates system prompt with all tool names", () => {
    const instructions = buildToolInstructions();
    for (const tool of TOOLS) {
      expect(instructions).toContain(tool.name);
    }
  });

  it("includes tool calling format", () => {
    const instructions = buildToolInstructions();
    expect(instructions).toContain("<tool>");
    expect(instructions).toContain("</tool>");
  });

  it("marks permission-required tools", () => {
    const instructions = buildToolInstructions();
    expect(instructions).toContain("[REQUIRES PERMISSION]");
  });
});
