"use client";

import { useEffect, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  GripVertical,
  Clock,
  CalendarDays,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Loader2,
  Copy,
  Mail,
} from "lucide-react";
import { VALID_TRANSITIONS } from "@/types";

// === Types ===

interface AppCard {
  id: number;
  job_id: number;
  status: string;
  applied_date: string | null;
  notes: string | null;
  follow_up_date: string | null;
  interview_dates: string | null;
  rejection_reason: string | null;
  salary_offered: string | null;
  created_at: string;
  updated_at: string;
  job_title: string;
  job_company: string | null;
  job_url: string;
  city: string | null;
  state: string | null;
  is_remote: number;
  overall_score: number | null;
}

const COLUMNS = [
  { id: "saved", label: "Saved", color: "#e5e0d8" },
  { id: "applied", label: "Applied", color: "#bfdbfe" },
  { id: "screening", label: "Screening", color: "#fef08a" },
  { id: "interview", label: "Interview", color: "#bbf7d0" },
  { id: "offer", label: "Offer", color: "#c4b5fd" },
] as const;

const ARCHIVED_STATUSES = ["rejected", "withdrawn"];

// === Sub-Components ===

function KanbanColumn({
  id,
  label,
  color,
  cards,
  onCardClick,
}: {
  id: string;
  label: string;
  color: string;
  cards: AppCard[];
  onCardClick: (card: AppCard) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col min-w-[220px] w-[220px] shrink-0"
    >
      <div
        className="flex items-center gap-2 px-3 py-2 mb-2 border-2 border-[#2d2d2d]"
        style={{
          backgroundColor: color,
          borderRadius: "var(--radius-wobbly-sm)",
          boxShadow: "var(--shadow-sketch-subtle)",
        }}
      >
        <span className="font-bold text-sm text-[#2d2d2d]">{label}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {cards.length}
        </Badge>
      </div>
      <div
        className="flex flex-col gap-2 min-h-[200px] p-2 border-2 border-dashed transition-colors"
        style={{
          borderColor: isOver ? "#2d5da1" : "#d1cdc7",
          backgroundColor: isOver ? "rgba(45,93,161,0.05)" : "transparent",
          borderRadius: "var(--radius-wobbly)",
        }}
      >
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onCardClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

function DraggableCard({
  card,
  onCardClick,
}: {
  card: AppCard;
  onCardClick: (card: AppCard) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <KanbanCardContent
        card={card}
        onClick={() => onCardClick(card)}
      />
    </div>
  );
}

function KanbanCardContent({
  card,
  onClick,
  isDragging,
}: {
  card: AppCard;
  onClick?: () => void;
  isDragging?: boolean;
}) {
  const isFollowUpDue =
    card.follow_up_date && new Date(card.follow_up_date) <= new Date();

  const scoreBadge = getScoreColor(card.overall_score);

  return (
    <div
      onClick={onClick}
      className="border-2 border-[#2d2d2d] bg-white p-3 cursor-grab active:cursor-grabbing select-none"
      style={{
        borderRadius: "var(--radius-wobbly-sm)",
        boxShadow: isDragging
          ? "var(--shadow-sketch-lg)"
          : "var(--shadow-sketch-subtle)",
        opacity: isDragging ? 0.9 : 1,
        transform: isDragging ? "rotate(-2deg) scale(1.05)" : undefined,
      }}
      data-card-id={card.id}
    >
      <div className="flex items-start gap-1">
        <GripVertical className="w-3 h-3 mt-1 text-[#b5b0a8] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-xs text-[#2d2d2d] truncate leading-tight">
            {card.job_company ?? "Unknown Company"}
          </p>
          <p className="text-[11px] text-[#6b6560] truncate">
            {card.job_title}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 mt-2 flex-wrap">
        {card.overall_score !== null && (
          <Badge
            variant="outline"
            className={`text-[10px] px-1 py-0 ${scoreBadge}`}
          >
            {card.overall_score}%
          </Badge>
        )}
        {isFollowUpDue && (
          <span className="text-[10px] text-[#ff4d4d]" title="Follow-up due">
            ⏰
          </span>
        )}
        {card.interview_dates && (
          <span className="text-[10px] text-[#2d5da1]" title="Interview scheduled">
            📅
          </span>
        )}
        {card.salary_offered && (
          <span className="text-[10px] text-[#16a34a]" title="Offer received">
            💰
          </span>
        )}
      </div>
    </div>
  );
}

function getScoreColor(score: number | null): string {
  if (score === null) return "bg-[#e5e0d8] text-[#6b6560]";
  if (score >= 80) return "bg-green-100 text-green-800 border-green-400";
  if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-400";
  if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-400";
  return "bg-red-100 text-red-800 border-red-400";
}

// === Interview Prep Types & Component ===

interface InterviewPrep {
  id: number;
  applicationId: number;
  companyBrief: {
    company_overview?: string;
    industry?: string;
    culture_signals?: string[];
    tech_stack?: string[];
    interview_process?: string | null;
  } | null;
  technicalQuestions: {
    category: string;
    question: string;
    why_asked: string;
    key_points: string[];
    difficulty: string;
  }[] | null;
  behavioralQuestions: {
    question: string;
    why_asked: string;
    star_template: {
      situation: string;
      task: string;
      action: string;
      result: string;
    };
    tips: string;
  }[] | null;
  questionsToAsk: string[] | null;
  userNotes: string;
  interviewDate: string | null;
  interviewType: string | null;
  interviewerName: string | null;
  outcome: string | null;
  thankYouSent: boolean;
}

function InterviewPrepSection({
  prep,
  onSaveNotes,
  interviewerName,
  onInterviewerNameChange,
  thankYouEmail,
  thankYouLoading,
  onGenerateThankYou,
}: {
  prep: InterviewPrep;
  onSaveNotes: (notes: string) => void;
  interviewerName: string;
  onInterviewerNameChange: (name: string) => void;
  thankYouEmail: string;
  thankYouLoading: boolean;
  onGenerateThankYou: () => void;
}) {
  const [userNotes, setUserNotes] = useState(prep.userNotes || "");
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "company"
  );

  function toggle(section: string) {
    setExpandedSection(expandedSection === section ? null : section);
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Company Brief */}
      {prep.companyBrief && (
        <PrepAccordion
          title="Company Brief"
          open={expandedSection === "company"}
          onToggle={() => toggle("company")}
        >
          <div className="text-xs space-y-1 text-[#2d2d2d]">
            {prep.companyBrief.company_overview && (
              <p>{prep.companyBrief.company_overview}</p>
            )}
            {prep.companyBrief.industry && (
              <p>
                <strong>Industry:</strong> {prep.companyBrief.industry}
              </p>
            )}
            {prep.companyBrief.tech_stack &&
              prep.companyBrief.tech_stack.length > 0 && (
                <p>
                  <strong>Tech Stack:</strong>{" "}
                  {prep.companyBrief.tech_stack.join(", ")}
                </p>
              )}
            {prep.companyBrief.culture_signals &&
              prep.companyBrief.culture_signals.length > 0 && (
                <div>
                  <strong>Culture Signals:</strong>
                  <ul className="list-disc list-inside pl-2">
                    {prep.companyBrief.culture_signals.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            {prep.companyBrief.interview_process && (
              <p>
                <strong>Interview Process:</strong>{" "}
                {prep.companyBrief.interview_process}
              </p>
            )}
          </div>
        </PrepAccordion>
      )}

      {/* Technical Questions */}
      {prep.technicalQuestions && prep.technicalQuestions.length > 0 && (
        <PrepAccordion
          title={`Technical Questions (${prep.technicalQuestions.length})`}
          open={expandedSection === "technical"}
          onToggle={() => toggle("technical")}
        >
          <div className="space-y-2">
            {prep.technicalQuestions.map((q, i) => (
              <div key={i} className="bg-[#fdfbf7] p-2 rounded text-xs border border-[#e5e0d8]">
                <div className="flex items-start justify-between gap-1">
                  <p className="font-semibold text-[#2d2d2d]">
                    {i + 1}. {q.question}
                  </p>
                  <Badge variant="outline" className="text-[9px] shrink-0">
                    {q.difficulty}
                  </Badge>
                </div>
                <p className="text-[#6b6560] mt-1 italic">{q.why_asked}</p>
                {q.key_points.length > 0 && (
                  <ul className="mt-1 list-disc list-inside text-[#6b6560]">
                    {q.key_points.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </PrepAccordion>
      )}

      {/* Behavioral Questions */}
      {prep.behavioralQuestions && prep.behavioralQuestions.length > 0 && (
        <PrepAccordion
          title={`Behavioral Questions (${prep.behavioralQuestions.length})`}
          open={expandedSection === "behavioral"}
          onToggle={() => toggle("behavioral")}
        >
          <div className="space-y-2">
            {prep.behavioralQuestions.map((q, i) => (
              <div key={i} className="bg-[#fff9c4] p-2 rounded text-xs border border-[#e5e0d8]">
                <p className="font-semibold text-[#2d2d2d]">
                  {i + 1}. {q.question}
                </p>
                <p className="text-[#6b6560] mt-1 italic">{q.why_asked}</p>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <div className="bg-white p-1 rounded">
                    <strong className="text-[9px] text-[#2d5da1]">S:</strong>{" "}
                    {q.star_template.situation}
                  </div>
                  <div className="bg-white p-1 rounded">
                    <strong className="text-[9px] text-[#2d5da1]">T:</strong>{" "}
                    {q.star_template.task}
                  </div>
                  <div className="bg-white p-1 rounded">
                    <strong className="text-[9px] text-[#2d5da1]">A:</strong>{" "}
                    {q.star_template.action}
                  </div>
                  <div className="bg-white p-1 rounded">
                    <strong className="text-[9px] text-[#2d5da1]">R:</strong>{" "}
                    {q.star_template.result}
                  </div>
                </div>
                <p className="text-[#6b6560] mt-1 text-[10px]">💡 {q.tips}</p>
              </div>
            ))}
          </div>
        </PrepAccordion>
      )}

      {/* Questions to Ask */}
      {prep.questionsToAsk && prep.questionsToAsk.length > 0 && (
        <PrepAccordion
          title={`Questions to Ask (${prep.questionsToAsk.length})`}
          open={expandedSection === "ask"}
          onToggle={() => toggle("ask")}
        >
          <ul className="space-y-1 text-xs">
            {prep.questionsToAsk.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-[#2d2d2d]">
                <span className="text-[#2d5da1]">•</span>
                {q}
              </li>
            ))}
          </ul>
        </PrepAccordion>
      )}

      {/* User Notes */}
      <div>
        <h5 className="font-bold text-xs mb-1">Your Notes</h5>
        <Textarea
          value={userNotes}
          onChange={(e) => setUserNotes(e.target.value)}
          onBlur={() => onSaveNotes(userNotes)}
          placeholder="Add your own prep notes here..."
          rows={3}
          className="text-xs"
        />
      </div>

      {/* Thank-You Email */}
      <div className="border-t border-[#e5e0d8] pt-3">
        <h5 className="font-bold text-xs mb-2 flex items-center gap-1">
          <Mail className="w-3 h-3" />
          Thank-You Email
        </h5>
        <Input
          value={interviewerName}
          onChange={(e) => onInterviewerNameChange(e.target.value)}
          placeholder="Interviewer name (optional)"
          className="text-xs mb-2"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={onGenerateThankYou}
          disabled={thankYouLoading}
          className="text-xs w-full"
        >
          {thankYouLoading ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : (
            <Mail className="w-3 h-3 mr-1" />
          )}
          Generate Thank-You Email
        </Button>
        {thankYouEmail && (
          <div className="mt-2">
            <div className="bg-[#fdfbf7] border border-[#e5e0d8] p-2 rounded text-xs whitespace-pre-wrap">
              {thankYouEmail}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs mt-1"
              onClick={() => copyText(thankYouEmail)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PrepAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#e5e0d8] rounded overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full p-2 bg-[#f5f0eb] hover:bg-[#ebe5dd] text-left"
      >
        <span className="font-bold text-xs text-[#2d2d2d]">{title}</span>
        {open ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      {open && <div className="p-2">{children}</div>}
    </div>
  );
}

// === Detail Panel ===

function ApplicationDetail({
  card,
  open,
  onClose,
  onUpdate,
  onDelete,
}: {
  card: AppCard | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [prep, setPrep] = useState<InterviewPrep | null>(null);
  const [prepLoading, setPrepLoading] = useState(false);
  const [showPrep, setShowPrep] = useState(false);
  const [thankYouEmail, setThankYouEmail] = useState("");
  const [thankYouLoading, setThankYouLoading] = useState(false);
  const [interviewerName, setInterviewerName] = useState("");

  useEffect(() => {
    if (card) {
      setNotes(card.notes ?? "");
      setPrep(null);
      setShowPrep(false);
      setThankYouEmail("");
    }
  }, [card]);

  if (!card) return null;

  const location = [card.city, card.state].filter(Boolean).join(", ");

  async function handleSaveNotes() {
    if (!card) return;
    setSaving(true);
    await onUpdate(card.id, { notes });
    setSaving(false);
  }

  async function loadInterviewPrep() {
    if (!card) return;
    setPrepLoading(true);
    try {
      const res = await fetch("/api/ai/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: card.id }),
      });
      const data = await res.json();
      if (data.success) {
        setPrep(data.data);
        setShowPrep(true);
      } else {
        toast.error(data.error || "Failed to generate interview prep");
      }
    } catch {
      toast.error("Network error loading interview prep");
    } finally {
      setPrepLoading(false);
    }
  }

  async function savePrepNotes(userNotes: string) {
    if (!card) return;
    try {
      await fetch("/api/ai/interview-prep", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: card.id, userNotes }),
      });
    } catch {
      // silent
    }
  }

  async function generateThankYou() {
    if (!card) return;
    setThankYouLoading(true);
    try {
      const res = await fetch("/api/ai/thank-you", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: card.id,
          interviewerName: interviewerName || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setThankYouEmail(data.data.email);
        toast.success("Thank-you email generated!");
      } else {
        toast.error(data.error || "Failed to generate thank-you email");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setThankYouLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">
            <span className="text-lg font-bold">{card.job_title}</span>
            <br />
            <span className="text-sm text-[#6b6560] font-normal">
              {card.job_company}
              {location && ` · ${location}`}
              {card.is_remote ? " · Remote" : ""}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Score & Status */}
          <div className="flex items-center gap-2">
            {card.overall_score !== null && (
              <Badge className={getScoreColor(card.overall_score)}>
                Match: {card.overall_score}%
              </Badge>
            )}
            <Badge variant="outline">{card.status}</Badge>
            {card.applied_date && (
              <span className="text-xs text-[#6b6560]">
                Applied: {new Date(card.applied_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h4 className="font-bold text-sm mb-2">Timeline</h4>
            <div className="space-y-1 text-xs text-[#6b6560]">
              <div className="flex gap-2">
                <CalendarDays className="w-3 h-3 mt-0.5" />
                <span>
                  Saved: {new Date(card.created_at).toLocaleDateString()}
                </span>
              </div>
              {card.applied_date && (
                <div className="flex gap-2">
                  <Clock className="w-3 h-3 mt-0.5" />
                  <span>
                    Applied: {new Date(card.applied_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              {card.follow_up_date && (
                <div className="flex gap-2 text-[#ff4d4d]">
                  <Clock className="w-3 h-3 mt-0.5" />
                  <span>
                    Follow-up:{" "}
                    {new Date(card.follow_up_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div>
            <h4 className="font-bold text-sm mb-2">Notes</h4>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this application..."
              rows={4}
              className="text-sm"
            />
            <Button
              size="sm"
              className="mt-2 sketch-btn"
              onClick={handleSaveNotes}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Notes"}
            </Button>
          </div>

          <Separator />

          {/* Status change */}
          <div>
            <h4 className="font-bold text-sm mb-2">Change Status</h4>
            <div className="flex flex-wrap gap-1">
              {(VALID_TRANSITIONS[card.status] ?? []).map((newStatus) => (
                <Button
                  key={newStatus}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdate(card.id, { status: newStatus })}
                >
                  → {newStatus}
                </Button>
              ))}
              {(VALID_TRANSITIONS[card.status] ?? []).length === 0 && (
                <p className="text-xs text-[#6b6560] italic">
                  No transitions available (terminal state)
                </p>
              )}
            </div>
          </div>

          {/* Rejection reason */}
          {card.status === "rejected" && card.rejection_reason && (
            <>
              <Separator />
              <div>
                <h4 className="font-bold text-sm mb-1">Rejection Reason</h4>
                <p className="text-xs text-[#6b6560]">
                  {card.rejection_reason}
                </p>
              </div>
            </>
          )}

          {/* Salary offered */}
          {card.salary_offered && (
            <>
              <Separator />
              <div>
                <h4 className="font-bold text-sm mb-1">Salary Offered</h4>
                <p className="text-sm font-bold text-[#16a34a]">
                  {card.salary_offered}
                </p>
              </div>
            </>
          )}

          {/* Interview Prep */}
          <Separator />
          <div>
            <button
              onClick={() => {
                if (!showPrep && !prep) loadInterviewPrep();
                else setShowPrep(!showPrep);
              }}
              className="flex items-center justify-between w-full text-left"
            >
              <h4 className="font-bold text-sm flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Interview Prep
              </h4>
              {prepLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : showPrep ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showPrep && prep && (
              <InterviewPrepSection
                prep={prep}
                onSaveNotes={savePrepNotes}
                interviewerName={interviewerName}
                onInterviewerNameChange={setInterviewerName}
                thankYouEmail={thankYouEmail}
                thankYouLoading={thankYouLoading}
                onGenerateThankYou={generateThankYou}
              />
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => window.open(card.job_url, "_blank", "noopener")}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              View Posting
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="text-xs ml-auto"
              onClick={() => {
                if (confirm("Delete this application? This cannot be undone.")) {
                  onDelete(card.id);
                }
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// === Main Page ===

export default function TrackerPage() {
  const [applications, setApplications] = useState<AppCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<AppCard | null>(null);
  const [detailCard, setDetailCard] = useState<AppCard | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  function getCardsForColumn(status: string): AppCard[] {
    return applications.filter((a) => a.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    const card = applications.find(
      (a) => a.id === Number(event.active.id)
    );
    setActiveCard(card ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardId = Number(active.id);
    const newStatus = String(over.id);
    const card = applications.find((a) => a.id === cardId);
    if (!card || card.status === newStatus) return;

    // Validate transition
    const allowed = VALID_TRANSITIONS[card.status];
    if (!allowed || !allowed.includes(newStatus)) {
      toast.error(`Cannot move from "${card.status}" to "${newStatus}"`);
      return;
    }

    // Optimistic update
    setApplications((prev) =>
      prev.map((a) =>
        a.id === cardId ? { ...a, status: newStatus } : a
      )
    );

    try {
      const res = await fetch(`/api/applications/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error ?? "Failed to update status");
        // Revert
        setApplications((prev) =>
          prev.map((a) =>
            a.id === cardId ? { ...a, status: card.status } : a
          )
        );
      } else {
        toast.success(`Moved to ${newStatus}`);
        fetchApplications(); // Refresh to get updated data
      }
    } catch {
      toast.error("Failed to update status");
      setApplications((prev) =>
        prev.map((a) =>
          a.id === cardId ? { ...a, status: card.status } : a
        )
      );
    }
  }

  async function handleUpdateApplication(
    id: number,
    data: Record<string, unknown>
  ) {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Application updated");
        fetchApplications();
        if (data.status) {
          setDetailOpen(false);
        }
      } else {
        toast.error(result.error ?? "Failed to update");
      }
    } catch {
      toast.error("Failed to update application");
    }
  }

  async function handleDeleteApplication(id: number) {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Application deleted");
        setDetailOpen(false);
        fetchApplications();
      } else {
        toast.error(result.error ?? "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete application");
    }
  }

  function handleCardClick(card: AppCard) {
    setDetailCard(card);
    setDetailOpen(true);
  }

  const archivedCards = applications.filter((a) =>
    ARCHIVED_STATUSES.includes(a.status)
  );

  if (loading) {
    return (
      <div>
        <h1
          className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-6"
          style={{ fontFamily: "'Kalam', cursive" }}
        >
          Application Tracker
        </h1>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="min-w-[220px] space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1
        className="text-4xl md:text-5xl font-bold text-[#2d2d2d] -rotate-1 mb-6"
        style={{ fontFamily: "'Kalam', cursive" }}
      >
        Application Tracker
      </h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              label={col.label}
              color={col.color}
              cards={getCardsForColumn(col.id)}
              onCardClick={handleCardClick}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && <KanbanCardContent card={activeCard} isDragging />}
        </DragOverlay>
      </DndContext>

      {/* Archived section */}
      <div className="mt-6">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="flex items-center gap-2 text-sm text-[#6b6560] hover:text-[#2d2d2d] transition-colors"
        >
          {showArchived ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Archived ({archivedCards.length})
        </button>
        {showArchived && archivedCards.length > 0 && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {archivedCards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card)}
                className="border border-[#d1cdc7] bg-[#f5f1eb] p-3 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                style={{ borderRadius: "var(--radius-wobbly-sm)" }}
              >
                <p className="text-xs font-bold text-[#6b6560] truncate">
                  {card.job_company ?? "Unknown"}
                </p>
                <p className="text-[11px] text-[#b5b0a8] truncate">
                  {card.job_title}
                </p>
                <Badge variant="outline" className="text-[10px] mt-1">
                  {card.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {showArchived && archivedCards.length === 0 && (
          <p className="mt-2 text-xs text-[#b5b0a8] italic">
            No archived applications yet.
          </p>
        )}
      </div>

      {/* Detail panel */}
      <ApplicationDetail
        card={detailCard}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onUpdate={handleUpdateApplication}
        onDelete={handleDeleteApplication}
      />
    </div>
  );
}
