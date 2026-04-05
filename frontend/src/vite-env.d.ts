/// <reference types="vite/client" />

// Vite resolves workspace package subpath exports like
// @crs-cradle/cr-walkthrough/tokens → packages/cr-walkthrough/src/tokens.css
declare module '@crs-cradle/cr-walkthrough/tokens' {
  const content: string;
  export default content;
}
declare module '@crs-cradle/cr-walkthrough/theme-dark' {
  const content: string;
  export default content;
}
declare module '@crs-cradle/cr-walkthrough/theme-light' {
  const content: string;
  export default content;
}
