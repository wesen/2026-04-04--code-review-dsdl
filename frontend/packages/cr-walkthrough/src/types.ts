// ── Domain types matching the Go backend API ─────────────────────────

export type StepType =
  | 'text'
  | 'source'
  | 'diff'
  | 'code'
  | 'compare'
  | 'link'
  | 'annotation'
  | 'checkpoint'
  | 'reveal'
  | 'shell'
  | 'section'
  | 'branch';

export interface TextStep {
  type: 'text';
  id?: string;
  note?: string;
  body: string;
}

export interface SourceStep {
  type: 'source';
  id?: string;
  note?: string;
  file: string;
  lines: [number, number];
  highlight?: [number, number];
  ref?: string;
}

export interface DiffStep {
  type: 'diff';
  id?: string;
  note?: string;
  file: string;
  hunks?: number[];
  collapse?: boolean;
  ref?: string;
}

export interface CodeStep {
  type: 'code';
  id?: string;
  note?: string;
  lang?: string;
  body: string;
}

export interface RefSide {
  file: string;
  ref?: string;
  lines: [number, number];
}

export interface CompareStep {
  type: 'compare';
  id?: string;
  note?: string;
  left: RefSide;
  right: RefSide;
}

export interface LinkStep {
  type: 'link';
  id?: string;
  note?: string;
  url: string;
  label?: string;
}

export type AnnotationSeverity = 'info' | 'warn' | 'issue' | 'praise';

export interface AnnotationStep {
  type: 'annotation';
  id?: string;
  note?: string;
  file: string;
  line: number;
  severity: AnnotationSeverity;
  body: string;
  ref?: string;
}

export interface CheckpointChoice {
  text: string;
  correct: boolean;
  explain: string;
}

export interface CheckpointStep {
  type: 'checkpoint';
  id?: string;
  note?: string;
  prompt: string;
  choices: CheckpointChoice[];
}

export interface RevealStep {
  type: 'reveal';
  id?: string;
  note?: string;
  label: string;
  body: string;
}

export interface ShellStep {
  type: 'shell';
  id?: string;
  note?: string;
  cmd: string;
  output?: string;
  expectExit?: number;
}

export interface SectionStep {
  type: 'section';
  id?: string;
  note?: string;
  title: string;
  steps: Step[];
}

export interface BranchOption {
  label: string;
  goto: string;
}

export interface BranchStep {
  type: 'branch';
  id?: string;
  note?: string;
  prompt: string;
  options: BranchOption[];
}

// Discriminated union
export type Step =
  | TextStep
  | SourceStep
  | DiffStep
  | CodeStep
  | CompareStep
  | LinkStep
  | AnnotationStep
  | CheckpointStep
  | RevealStep
  | ShellStep
  | SectionStep
  | BranchStep;

export interface WalkthroughSummary {
  id: string;
  path: string;
  title: string;
  repo: string;
  base: string;
  head: string;
  authors: string[];
  stepCount: number;
}

export interface Walkthrough {
  id: string;
  title: string;
  repo: string;
  base: string;
  head: string;
  authors: string[];
  steps: Step[];
}

export interface FileContent {
  ref: string;
  path: string;
  start: number;
  end: number;
  lines: string[];
}

export interface DiffContent {
  from: string;
  to: string;
  path: string;
  diff: string;
}
