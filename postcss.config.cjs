// Use CommonJS export so tooling that expects CJS configs can read this reliably.
// Some PostCSS consumers (or plugins) expect `module.exports` rather than ESM
// `export default` and that mismatch can lead to warnings about missing
// `from` when `postcss.parse` is called without source information.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
