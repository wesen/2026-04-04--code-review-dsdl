# Changelog

## 2026-04-06

- Initial workspace created


## 2026-04-06

CR-DSL-002 implementation complete. All 7 milestones shipped: step anchors (M1), FileViewer modal+inline (M2+M6), openFile wiring through SourceRenderer/AnnotationRenderer/DiffRenderer/CompareRenderer (M3+M4+M5), updated docs (M7).

### Related Files

- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/components/CodeLine.tsx — interactive prop + onClick for line number links
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/components/FileBadge.tsx — interactive prop + ref_ prop + onClick
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/components/FileViewer.tsx — FileViewer component — modal/inline
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/renderers/AnnotationRenderer.tsx — interactive file:line badge → FileViewer at annotated line
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/renderers/CompareRenderer.tsx — pane headers → single-pane FileViewer
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/renderers/DiffRenderer.tsx — interactive from/to ref badges → compare FileViewer
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/renderers/SourceRenderer.tsx — interactive file badge + line numbers → FileViewer
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/frontend/packages/cr-walkthrough/src/renderers/StepCard.tsx — data-step-id + fragment anchor
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/pkg/doc/topics/cr-dsl-step-types.md — cross-linking per step type (source/diff/compare/annotation)
- /home/manuel/code/wesen/2026-04-04--code-review-dsdl/pkg/doc/topics/cr-dsl-walkthrough-reference.md — cross-linking section

