import React from 'react';
import { TextRenderer } from './TextRenderer';
import { SourceRenderer } from './SourceRenderer';
import { DiffRenderer } from './DiffRenderer';
import { CodeRenderer } from './CodeRenderer';
import { CompareRenderer } from './CompareRenderer';
import { LinkRenderer } from './LinkRenderer';
import { AnnotationRenderer } from './AnnotationRenderer';
import { CheckpointRenderer } from './CheckpointRenderer';
import { RevealRenderer } from './RevealRenderer';
import { ShellRenderer } from './ShellRenderer';
import { SectionRenderer } from './SectionRenderer';
import { BranchRenderer } from './BranchRenderer';
import type { Step, SourceStep, DiffStep, CompareStep, AnnotationStep, CheckpointStep, RevealStep, ShellStep, SectionStep, BranchStep, TextStep, CodeStep, LinkStep } from '../types';

// ── Type metadata for badges ────────────────────────────────────────

export const STEP_TYPE_META: Record<
  Step['type'],
  { icon: string; colorVar: string }
> = {
  text:       { icon: '¶',  colorVar: '--cr-color-text-step' },
  source:     { icon: '◇',  colorVar: '--cr-color-source-step' },
  diff:       { icon: '±',  colorVar: '--cr-color-diff-step' },
  code:       { icon: '<>', colorVar: '--cr-color-code-step' },
  compare:    { icon: '⇄',  colorVar: '--cr-color-compare-step' },
  link:       { icon: '↗',  colorVar: '--cr-color-link-step' },
  annotation: { icon: '●',  colorVar: '--cr-color-annotation-step' },
  checkpoint: { icon: '?',  colorVar: '--cr-color-checkpoint-step' },
  reveal:     { icon: '▸',  colorVar: '--cr-color-reveal-step' },
  shell:      { icon: '$',   colorVar: '--cr-color-shell-step' },
  section:    { icon: '§',  colorVar: '--cr-color-section-step' },
  branch:     { icon: '⑂', colorVar: '--cr-color-branch-step' },
};

// ── Registry ─────────────────────────────────────────────────────────

interface Props {
  step: Step;
  depth?: number;
  onGoto?: (goto: string) => void;
}

export const StepRendererRegistry: React.FC<Props> = ({ step, depth, onGoto }) => {
  const props = { step, depth, onGoto };

  switch (step.type) {
    case 'text':
      return <TextRenderer step={step as TextStep} />;
    case 'source':
      return <SourceRenderer step={step as SourceStep} />;
    case 'diff':
      return <DiffRenderer step={step as DiffStep} />;
    case 'code':
      return <CodeRenderer step={step as CodeStep} />;
    case 'compare':
      return <CompareRenderer step={step as CompareStep} />;
    case 'link':
      return <LinkRenderer step={step as LinkStep} />;
    case 'annotation':
      return <AnnotationRenderer step={step as AnnotationStep} />;
    case 'checkpoint':
      return <CheckpointRenderer step={step as CheckpointStep} />;
    case 'reveal':
      return <RevealRenderer step={step as RevealStep} />;
    case 'shell':
      return <ShellRenderer step={step as ShellStep} />;
    case 'section':
      return <SectionRenderer step={step as SectionStep} depth={depth} onGoto={onGoto} />;
    case 'branch':
      return <BranchRenderer step={step as BranchStep} onSelect={onGoto} />;
    default:
      return (
        <pre style={{ margin: 0, fontSize: 11, opacity: 0.5 }}>
          {JSON.stringify(step, null, 2)}
        </pre>
      );
  }
};
