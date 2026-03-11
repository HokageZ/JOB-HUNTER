"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

export interface FilterState {
  search: string;
  source: string;
  isRemote: string;
  jobType: string;
  sortBy: string;
  showDismissed: boolean;
}

interface JobFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const SOURCES = [
  { value: "all", label: "All Sources" },
  { value: "indeed", label: "Indeed" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "glassdoor", label: "Glassdoor" },
  { value: "google", label: "Google Jobs" },
  { value: "zip_recruiter", label: "ZipRecruiter" },
];

const REMOTE_OPTIONS = [
  { value: "all", label: "Any Location" },
  { value: "true", label: "Remote Only" },
  { value: "false", label: "On-site Only" },
];

const JOB_TYPES = [
  { value: "all", label: "All Types" },
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
  { value: "freelance", label: "Freelance" },
];

const SORT_OPTIONS = [
  { value: "date", label: "Newest First" },
  { value: "score", label: "Best Match" },
  { value: "salary", label: "Highest Salary" },
];

export function JobFilters({ filters, onChange }: JobFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  const selectStyle = { borderRadius: "var(--radius-wobbly-sm)" };

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          strokeWidth={2.5}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6560]"
        />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search jobs by title or company..."
          className="border-2 border-[#2d2d2d] text-lg h-12 pl-10"
          style={selectStyle}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-wrap gap-3">
        <div>
          <span className="text-xs text-[#6b6560] block mb-1">Source</span>
          <Select
            value={filters.source}
            onValueChange={(v) => set("source", v ?? "all")}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] h-10 w-[150px]"
              style={selectStyle}
            >
              <SelectValue placeholder="Source" />
            </SelectTrigger>
          <SelectContent>
            {SOURCES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
          </Select>
        </div>

        <div>
          <span className="text-xs text-[#6b6560] block mb-1">Location Type</span>
          <Select
            value={filters.isRemote}
            onValueChange={(v) => set("isRemote", v ?? "all")}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] h-10 w-[150px]"
              style={selectStyle}
            >
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {REMOTE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className="text-xs text-[#6b6560] block mb-1">Job Type</span>
          <Select
            value={filters.jobType}
            onValueChange={(v) => set("jobType", v ?? "all")}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] h-10 w-[150px]"
              style={selectStyle}
            >
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              {JOB_TYPES.map((j) => (
                <SelectItem key={j.value} value={j.value}>
                  {j.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <span className="text-xs text-[#6b6560] block mb-1">Sort By</span>
          <Select
            value={filters.sortBy}
            onValueChange={(v) => set("sortBy", v ?? "date")}
          >
            <SelectTrigger
              className="border-2 border-[#2d2d2d] h-10 w-[160px]"
              style={selectStyle}
            >
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
