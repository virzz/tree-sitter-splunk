# Repository Guidelines

## Project Structure

`grammar.js` defines the Splunk SPL grammar. Generated parser artifacts live under `src/` and must not be edited manually. Corpus fixtures are stored in `test/corpus/`, while `examples/security.spl` provides a realistic parse target. Package and grammar metadata are defined in `package.json` and `tree-sitter.json`.

## Development Commands

- `bun install` installs the locked Tree-sitter CLI dependency.
- `bun run generate` regenerates parser artifacts after grammar changes.
- `bun run test` executes the corpus suite.
- `bun run parse:example` parses the representative SPL example.
- `bun run check` runs generation, corpus tests, and example parsing.

Always regenerate before testing and commit generated `src/` changes with the corresponding grammar update.

## Style and Naming

Use two-space indentation in JavaScript. Keep grammar rules in `snake_case`, helpers in `camelCase`, and precedence constants in `UPPER_SNAKE_CASE`. Prefer small named rules over deeply nested expressions. SPL keywords must remain case-insensitive, and ambiguous operators should use explicit precedence and associativity.

## Testing

Add focused cases to `test/corpus/*.txt` for every grammar change. Use descriptive lowercase section titles followed by SPL input, `---`, and the expected syntax tree. Cover the new construct, invalid boundaries, and nearby ambiguous syntax. All corpus cases and the example parse must pass.

## Commits and Pull Requests

Use short scoped subjects such as `feat(grammar): 支持 lookup 输出子句`. Pull requests should describe the SPL behavior, list validation commands, and identify generated files. Link relevant Splunk documentation when adding or changing syntax.

## Integration

Zed-specific metadata and queries belong in the sibling `zed-ext-splunk` repository. Keep this project limited to reusable Tree-sitter grammar sources, tests, examples, and generated parser artifacts.
