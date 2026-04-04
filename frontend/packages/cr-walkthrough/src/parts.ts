// ── Stable data-part attribute names for theming ─────────────────────
// All themeable visual regions use these constant strings.
// Consumers targeting specific regions must use these values.

export const PARTS = {
  // Root
  ROOT: 'root',

  // Header / title
  HEADER: 'header',
  HEADER_TITLE: 'header-title',
  HEADER_META: 'header-meta',
  HEADER_AUTHORS: 'header-authors',

  // Step type strip
  STEP_TYPE_STRIP: 'step-type-strip',
  STEP_TYPE_BADGE: 'step-type-badge',
  STEP_TYPE_ICON: 'step-type-icon',
  STEP_INDEX: 'step-index',

  // Step card wrapper
  STEPS_LIST: 'steps-list',
  STEP_CARD: 'step-card',

  // Shared primitives
  FILE_BADGE: 'file-badge',
  FILE_BADGE_PATH: 'file-badge-path',
  FILE_BADGE_META: 'file-badge-meta',
  CODE_BLOCK: 'code-block',
  CODE_LINE: 'code-line',
  CODE_LINE_NUMBER: 'code-line-number',
  CODE_LINE_HIGHLIGHT: 'code-line-highlight',
  NOTE: 'note',
  NOTE_TEXT: 'note-text',

  // Step-specific parts
  TEXT_BODY: 'text-body',
  SOURCE_STEP: 'source-step',
  DIFF_STEP: 'diff-step',
  DIFF_HUNK: 'diff-hunk',
  DIFF_LINE: 'diff-line',
  DIFF_LINE_CONTEXT: 'diff-line-context',
  DIFF_LINE_ADDITION: 'diff-line-addition',
  DIFF_LINE_DELETION: 'diff-line-deletion',
  CODE_STEP: 'code-step',
  COMPARE_STEP: 'compare-step',
  SIDE_BY_SIDE: 'side-by-side',
  SIDE_PANE: 'side-pane',
  SIDE_PANE_LABEL: 'side-pane-label',
  LINK_STEP: 'link-step',
  LINK_ANCHOR: 'link-anchor',
  ANNOTATION_STEP: 'annotation-step',
  ANNOTATION_HEADER: 'annotation-header',
  ANNOTATION_BODY: 'annotation-body',
  CHECKPOINT_STEP: 'checkpoint-step',
  CHECKPOINT_PROMPT: 'checkpoint-prompt',
  CHECKPOINT_CHOICES: 'checkpoint-choices',
  CHECKPOINT_CHOICE: 'checkpoint-choice',
  CHECKPOINT_FEEDBACK: 'checkpoint-feedback',
  CHECKPOINT_CORRECT: 'checkpoint-correct',
  CHECKPOINT_INCORRECT: 'checkpoint-incorrect',
  REVEAL_STEP: 'reveal-step',
  REVEAL_TOGGLE: 'reveal-toggle',
  REVEAL_ARROW: 'reveal-arrow',
  REVEAL_CONTENT: 'reveal-content',
  SHELL_STEP: 'shell-step',
  SHELL_PROMPT: 'shell-prompt',
  SHELL_OUTPUT: 'shell-output',
  SECTION_STEP: 'section-step',
  SECTION_TITLE: 'section-title',
  SECTION_STEPS: 'section-steps',
  BRANCH_STEP: 'branch-step',
  BRANCH_PROMPT: 'branch-prompt',
  BRANCH_OPTIONS: 'branch-options',
  BRANCH_OPTION: 'branch-option',
  BRANCH_OPTION_GOTO: 'branch-option-goto',

  // Severity
  SEVERITY_INFO: 'severity-info',
  SEVERITY_WARN: 'severity-warn',
  SEVERITY_ISSUE: 'severity-issue',
  SEVERITY_PRAISE: 'severity-praise',
} as const;

export type PartName = (typeof PARTS)[keyof typeof PARTS];
