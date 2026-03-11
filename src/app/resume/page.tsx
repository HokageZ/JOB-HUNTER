"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Star,
  Trash2,
  PenLine,
  Loader2,
} from "lucide-react";

interface ResumeItem {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  raw_text: string | null;
  parsed_data: string | null;
  ai_review: string | null;
  ats_score: number | null;
  is_default: number;
  created_at: string;
}

interface Strength {
  category: string;
  finding: string;
  impact: string;
}

interface Weakness {
  category: string;
  finding: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
}

interface MissingKeyword {
  keyword: string;
  reason: string;
  whereToAdd: string;
}

interface SectionFeedback {
  exists?: boolean;
  score?: number;
  feedback: string;
  rewriteSuggestion?: string;
  suggestion?: string;
  weakBullets?: { original: string; improved: string }[];
}

interface AIReview {
  atsScore: number;
  overallAssessment: string;
  strengths: Strength[];
  weaknesses: Weakness[];
  missingKeywords: MissingKeyword[];
  sectionFeedback: Record<string, SectionFeedback>;
  formattingIssues: string[];
  tailoringTips: { targetRole: string; adjustments: string[] }[];
}

type InputMode = "upload" | "paste";

export default function ResumePage() {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selected, setSelected] = useState<ResumeItem | null>(null);
  const [review, setReview] = useState<AIReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("upload");
  const [pasteText, setPasteText] = useState("");
  const [pasteTitle, setPasteTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResumeItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = useCallback(async () => {
    try {
      const res = await fetch("/api/resume");
      const data = await res.json();
      if (data.success) {
        setResumes(data.data);
        if (data.data.length > 0 && !selected) {
          const defaultResume =
            data.data.find((r: ResumeItem) => r.is_default) || data.data[0];
          setSelected(defaultResume);
          if (defaultResume.ai_review) {
            setReview(JSON.parse(defaultResume.ai_review));
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Uploaded: ${file.name}`);
        const newResume = data.data;
        setResumes((prev) => [newResume, ...prev]);
        setSelected(newResume);
        setReview(null);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handlePasteSubmit() {
    if (pasteText.trim().length < 20) {
      toast.error("Please paste at least a few sentences of your resume");
      return;
    }
    setUploading(true);
    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: pasteText,
          title: pasteTitle || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Resume saved!");
        const newResume = data.data;
        setResumes((prev) => [newResume, ...prev]);
        setSelected(newResume);
        setReview(null);
        setPasteText("");
        setPasteTitle("");
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save resume text");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/resume/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selected.id }),
      });
      const data = await res.json();
      if (data.success) {
        setReview(data.data.aiReview);
        toast.success("Analysis complete!");
        setSelected((prev) =>
          prev
            ? {
                ...prev,
                ats_score: data.data.atsScore,
                ai_review: JSON.stringify(data.data.aiReview),
              }
            : null
        );
        setResumes((prev) =>
          prev.map((r) =>
            r.id === selected.id
              ? { ...r, ats_score: data.data.atsScore, ai_review: JSON.stringify(data.data.aiReview) }
              : r
          )
        );
      } else {
        toast.error(data.error || "Analysis failed — check your OpenRouter API key in .env.local");
      }
    } catch {
      toast.error("Analysis request failed — make sure your API key is configured");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSetDefault(resumeId: number) {
    try {
      const res = await fetch(`/api/resume/${resumeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      const data = await res.json();
      if (data.success) {
        setResumes((prev) =>
          prev.map((r) => ({
            ...r,
            is_default: r.id === resumeId ? 1 : 0,
          }))
        );
        toast.success("Set as primary resume");
      }
    } catch {
      toast.error("Failed to set primary");
    }
  }

  async function handleDelete(resume: ResumeItem) {
    try {
      const res = await fetch(`/api/resume/${resume.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        const remaining = resumes.filter((r) => r.id !== resume.id);
        setResumes(remaining);
        if (selected?.id === resume.id) {
          if (remaining.length > 0) {
            setSelected(remaining[0]);
            setReview(
              remaining[0].ai_review
                ? JSON.parse(remaining[0].ai_review)
                : null
            );
          } else {
            setSelected(null);
            setReview(null);
          }
        }
        toast.success("Resume deleted");
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch {
      toast.error("Failed to delete");
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function getPriorityColor(priority: string) {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-400";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-400";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  return (
    <div>
      <h1
        className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-6"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Resume Lab
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel — Upload + Resume List + Preview */}
        <div className="lg:col-span-1 space-y-4">
          {/* Input Mode Toggle */}
          <div
            className="flex border-2 border-[#2d2d2d] overflow-hidden"
            style={{ borderRadius: "var(--radius-wobbly-sm)" }}
          >
            <button
              type="button"
              onClick={() => setInputMode("upload")}
              className={`flex-1 py-2 px-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                inputMode === "upload"
                  ? "bg-[#fff9c4] text-[#2d2d2d]"
                  : "bg-white text-[#6b6560] hover:bg-gray-50"
              }`}
            >
              <Upload size={14} />
              Upload File
            </button>
            <button
              type="button"
              onClick={() => setInputMode("paste")}
              className={`flex-1 py-2 px-3 text-sm font-bold flex items-center justify-center gap-2 border-l-2 border-[#2d2d2d] transition-colors ${
                inputMode === "paste"
                  ? "bg-[#fff9c4] text-[#2d2d2d]"
                  : "bg-white text-[#6b6560] hover:bg-gray-50"
              }`}
            >
              <PenLine size={14} />
              Paste Text
            </button>
          </div>

          {/* Upload Zone */}
          {inputMode === "upload" ? (
            <div
              className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-[#2d5da1] bg-blue-50"
                  : "border-[#d1cdc7] bg-white hover:border-[#2d5da1]"
              }`}
              style={{ borderRadius: "var(--radius-wobbly)" }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="w-8 h-8 text-[#b5b0a8] mx-auto mb-2" />
              <p className="font-bold text-sm text-[#2d2d2d]">
                {uploading
                  ? "Uploading..."
                  : "Drop resume here or click to upload"}
              </p>
              <p className="text-xs text-[#b5b0a8] mt-1">
                PDF, DOCX, TXT, or image · Max 10MB
              </p>
            </div>
          ) : (
            /* Paste Text Input */
            <div
              className="border-2 border-[#2d2d2d] bg-white p-4 space-y-3"
              style={{ borderRadius: "var(--radius-wobbly)" }}
            >
              <input
                type="text"
                value={pasteTitle}
                onChange={(e) => setPasteTitle(e.target.value)}
                placeholder="Resume title (optional)"
                className="w-full border-2 border-[#e5e0d8] px-3 py-2 text-sm focus:border-[#2d5da1] focus:outline-none"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              />
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={"Paste your entire resume here...\n\nInclude your experience, skills, education, and anything else you want analyzed."}
                className="w-full border-2 border-[#e5e0d8] px-3 py-2 text-sm min-h-[200px] resize-y focus:border-[#2d5da1] focus:outline-none font-sans leading-relaxed"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#b5b0a8]">
                  {pasteText.trim() ? `${pasteText.trim().split(/\s+/).length} words` : ""}
                </span>
                <Button
                  onClick={handlePasteSubmit}
                  disabled={uploading || pasteText.trim().length < 20}
                  className="bg-[#2d5da1] text-white sketch-btn hover:bg-[#2d5da1]"
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                  size="sm"
                >
                  {uploading ? (
                    <Loader2 size={14} className="mr-1 animate-spin" />
                  ) : (
                    <FileText size={14} className="mr-1" />
                  )}
                  Save Resume
                </Button>
              </div>
            </div>
          )}

          {/* Resume List */}
          {loading ? (
            <Skeleton className="h-20" />
          ) : resumes.length > 0 ? (
            <div className="space-y-2">
              <h3
                className="text-sm font-bold text-[#6b6560] px-1"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                Your Resumes ({resumes.length})
              </h3>
              {resumes.map((r) => (
                <div
                  key={r.id}
                  className={`border-2 p-3 flex items-center gap-3 transition-colors ${
                    selected?.id === r.id
                      ? "border-[#2d5da1] bg-blue-50"
                      : "border-[#e5e0d8] bg-white hover:border-[#2d2d2d]"
                  }`}
                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                >
                  <button
                    onClick={() => {
                      setSelected(r);
                      setReview(r.ai_review ? JSON.parse(r.ai_review) : null);
                    }}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <FileText className="w-5 h-5 text-[#6b6560] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#2d2d2d] truncate">
                        {r.file_name}
                      </p>
                      <p className="text-xs text-[#b5b0a8]">
                        {(r.file_size / 1024).toFixed(0)} KB ·{" "}
                        {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {r.ats_score !== null && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {r.ats_score}%
                      </Badge>
                    )}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleSetDefault(r.id)}
                      className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                        r.is_default === 1
                          ? "text-[#fbbf24]"
                          : "text-[#d1cdc7] hover:text-[#fbbf24]"
                      }`}
                      title={
                        r.is_default === 1
                          ? "Primary resume"
                          : "Set as primary"
                      }
                    >
                      <Star
                        size={16}
                        fill={r.is_default === 1 ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      onClick={() => {
                        setDeleteTarget(r);
                        setDeleteDialogOpen(true);
                      }}
                      className="p-1 rounded text-[#d1cdc7] hover:text-[#ff4d4d] hover:bg-red-50 transition-colors"
                      title="Delete resume"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="border-2 border-dashed border-[#d1cdc7] p-6 text-center"
              style={{ borderRadius: "var(--radius-wobbly)" }}
            >
              <FileText className="w-10 h-10 text-[#d1cdc7] mx-auto mb-2" />
              <p className="text-sm text-[#6b6560] font-bold">
                No resumes yet
              </p>
              <p className="text-xs text-[#b5b0a8] mt-1">
                Upload a file or paste your resume text to get started
              </p>
            </div>
          )}

          {/* Text Preview */}
          {selected?.raw_text && (
            <div
              className="border-2 border-[#e5e0d8] bg-white p-4"
              style={{ borderRadius: "var(--radius-wobbly)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-sm text-[#2d2d2d]">
                  Resume Text
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-6 px-2"
                  onClick={() => copyText(selected.raw_text!)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>
              <ScrollArea className="max-h-[300px]">
                <pre className="text-xs text-[#6b6560] whitespace-pre-wrap font-sans leading-relaxed">
                  {selected.raw_text}
                </pre>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right Panel — Analysis Results */}
        <div className="lg:col-span-2 space-y-4">
          {!selected ? (
            <div
              className="border-2 border-[#e5e0d8] bg-white p-8 text-center"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch-subtle)",
              }}
            >
              <FileText className="w-12 h-12 text-[#d1cdc7] mx-auto mb-3" />
              <p
                className="text-xl font-bold text-[#2d2d2d]"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Upload or paste your resume
              </p>
              <p className="text-sm text-[#6b6560] mt-1">
                Get AI-powered analysis with ATS scoring, keyword suggestions,
                and actionable feedback
              </p>
            </div>
          ) : analyzing ? (
            <div
              className="border-2 border-[#2d5da1] bg-white p-8 text-center"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch)",
              }}
            >
              <Loader2 className="w-10 h-10 text-[#2d5da1] mx-auto mb-3 animate-spin" />
              <p
                className="text-xl font-bold text-[#2d2d2d]"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Analyzing your resume...
              </p>
              <p className="text-sm text-[#6b6560] mt-2">
                AI is reviewing your resume against your profile. This usually
                takes 30–60 seconds.
              </p>
              <div className="mt-4 flex justify-center">
                <Progress value={null} className="h-2 w-48" />
              </div>
            </div>
          ) : !review ? (
            <div
              className="border-2 border-[#2d2d2d] bg-white p-8 text-center"
              style={{
                borderRadius: "var(--radius-wobbly)",
                boxShadow: "var(--shadow-sketch-subtle)",
              }}
            >
              <RefreshCw className="w-10 h-10 text-[#2d5da1] mx-auto mb-3" />
              <p
                className="text-xl font-bold text-[#2d2d2d] mb-2"
                style={{ fontFamily: "'Kalam', cursive" }}
              >
                Ready to analyze &ldquo;{selected.file_name}&rdquo;
              </p>
              <p className="text-sm text-[#6b6560] mb-4">
                AI will review your resume for ATS compatibility, missing
                keywords, and improvement suggestions.
              </p>
              <Button
                onClick={handleAnalyze}
                className="bg-[#2d5da1] text-white sketch-btn hover:bg-[#2d5da1]"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Analyze Resume
              </Button>
            </div>
          ) : (
            <>
              {/* ATS Score */}
              <div
                className="border-2 border-[#2d2d2d] bg-white p-5"
                style={{
                  borderRadius: "var(--radius-wobbly)",
                  boxShadow: "var(--shadow-sketch)",
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className="text-lg font-bold"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    ATS Score
                  </h3>
                  <span
                    className={`text-3xl font-bold ${
                      review.atsScore >= 80
                        ? "text-green-600"
                        : review.atsScore >= 60
                          ? "text-[#2d5da1]"
                          : review.atsScore >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                    }`}
                  >
                    {review.atsScore}/100
                  </span>
                </div>
                <Progress value={review.atsScore} className="h-3" />
                <p className="text-sm text-[#6b6560] mt-3">
                  {review.overallAssessment}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 text-xs"
                  onClick={handleAnalyze}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Re-analyze
                </Button>
              </div>

              {/* Strengths */}
              {review.strengths?.length > 0 && (
                <div
                  className="border-2 border-[#2d2d2d] bg-white p-5"
                  style={{
                    borderRadius: "var(--radius-wobbly)",
                    boxShadow: "var(--shadow-sketch-subtle)",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Strengths ({review.strengths.length})
                  </h3>
                  <div className="space-y-2">
                    {review.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-[#2d2d2d]">
                            {s.finding}
                          </p>
                          <p className="text-xs text-[#6b6560]">{s.impact}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {review.weaknesses?.length > 0 && (
                <div
                  className="border-2 border-[#2d2d2d] bg-white p-5"
                  style={{
                    borderRadius: "var(--radius-wobbly)",
                    boxShadow: "var(--shadow-sketch-subtle)",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Improvements ({review.weaknesses.length})
                  </h3>
                  <div className="space-y-3">
                    {review.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-[#2d2d2d]">
                              {w.finding}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${getPriorityColor(w.priority)}`}
                            >
                              {w.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-[#6b6560] mt-0.5">
                            {w.suggestion}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Keywords */}
              {review.missingKeywords?.length > 0 && (
                <div
                  className="border-2 border-[#2d2d2d] bg-white p-5"
                  style={{
                    borderRadius: "var(--radius-wobbly)",
                    boxShadow: "var(--shadow-sketch-subtle)",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {review.missingKeywords.map((k, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs bg-red-50 text-red-700 border-red-300 cursor-help"
                        title={`${k.reason} — ${k.whereToAdd}`}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        {k.keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Feedback */}
              {review.sectionFeedback && (
                <div
                  className="border-2 border-[#2d2d2d] bg-white p-5"
                  style={{
                    borderRadius: "var(--radius-wobbly)",
                    boxShadow: "var(--shadow-sketch-subtle)",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ fontFamily: "'Kalam', cursive" }}
                  >
                    Section-by-Section Feedback
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(review.sectionFeedback).map(
                      ([section, fb]) => (
                        <div key={section}>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold capitalize text-[#2d2d2d]">
                              {section}
                            </h4>
                            {fb.score !== undefined && (
                              <Badge variant="outline" className="text-[10px]">
                                {fb.score}/100
                              </Badge>
                            )}
                            {fb.exists === false && (
                              <Badge variant="outline" className="text-[10px] text-red-600">
                                Missing
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-[#6b6560]">
                            {fb.feedback}
                          </p>
                          {fb.rewriteSuggestion && (
                            <div className="mt-2 bg-[#f5f1eb] p-3 border border-[#e5e0d8]" style={{ borderRadius: "var(--radius-wobbly-sm)" }}>
                              <p className="text-xs font-bold text-[#2d2d2d] mb-1">
                                Suggested rewrite:
                              </p>
                              <p className="text-xs text-[#6b6560] italic">
                                {fb.rewriteSuggestion}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs mt-1 h-6 px-2"
                                onClick={() => copyText(fb.rewriteSuggestion!)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                            </div>
                          )}
                          {fb.weakBullets && fb.weakBullets.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {fb.weakBullets.map((b, i) => (
                                <div
                                  key={i}
                                  className="bg-[#f5f1eb] p-3 border border-[#e5e0d8]"
                                  style={{ borderRadius: "var(--radius-wobbly-sm)" }}
                                >
                                  <p className="text-xs text-red-600 line-through">
                                    {b.original}
                                  </p>
                                  <p className="text-xs text-green-700 mt-1">
                                    {b.improved}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs mt-1 h-6 px-2"
                                    onClick={() => copyText(b.improved)}
                                  >
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                          <Separator className="mt-3" />
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Formatting Issues */}
              {review.formattingIssues?.length > 0 && (
                <div
                  className="border-2 border-[#e5e0d8] bg-white p-5"
                  style={{
                    borderRadius: "var(--radius-wobbly)",
                    boxShadow: "var(--shadow-sketch-subtle)",
                  }}
                >
                  <h3 className="font-bold text-sm mb-2">Formatting Issues</h3>
                  <ul className="text-xs text-[#6b6560] space-y-1">
                    {review.formattingIssues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 mt-0.5 text-yellow-500 shrink-0" />
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.file_name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-[#ff4d4d] hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
