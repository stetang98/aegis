/** Shared service-layer types (platform-agnostic). */
import type { ParsedLab } from "./labparse";

export interface DelegateConfig {
  providerPublicKey: string;
  timeout?: number;
}

export interface ExplainOptions {
  delegate?: DelegateConfig;
  /** Override the model source; defaults are set per-platform in the qvac service. */
  modelSrc?: string;
}

export interface ExplainStats {
  ttftMs?: number;
  tokensPerSec?: number;
  backend?: string;
  tokens?: number;
  loadMs?: number;
}

export interface ExplainOutcome {
  /** Plain-language holistic summary ("what this means"). */
  summary: string;
  thinking?: string | null;
  /** Where the inference ran. "preview" = web stub (no on-device model). */
  servedBy: "delegated" | "local" | "preview";
  /** Human label for the engine, e.g. "MedPsy-1.7B" / "MedPsy-4B (delegated)" / "Preview". */
  engine: string;
  /** True when a delegated run was requested but failed and silently ran on-device instead. */
  fellBackToLocal?: boolean;
  stats?: ExplainStats;
}

export interface HealthRecord {
  id: string;
  /** ISO-8601 timestamp. */
  ts: string;
  title: string;
  reportText: string;
  parsed: ParsedLab;
  summary: string;
  servedBy: ExplainOutcome["servedBy"];
  engine: string;
  fellBackToLocal?: boolean;
  stats?: ExplainStats;
}

/** The shape both qvac.web.ts and qvac.native.ts implement (Metro picks one per platform). */
export interface QvacService {
  readonly isOnDevice: boolean;
  explain(reportText: string, parsed: ParsedLab, opts?: ExplainOptions): Promise<ExplainOutcome>;
  followUp(
    question: string,
    records: ReadonlyArray<Pick<HealthRecord, "ts" | "reportText" | "summary">>,
    opts?: ExplainOptions,
  ): Promise<ExplainOutcome>;
}
