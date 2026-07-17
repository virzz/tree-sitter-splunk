# Tree-sitter Splunk SPL

Tree-sitter grammar for Splunk Search Processing Language (SPL).

## Supported Syntax

- Search and generating-command pipelines
- Commands, clauses, assignments, and expressions
- Subsearches, macro calls, dashboard tokens, and template tokens
- Strings, quoted fields, wildcards, relative times, and SPL comments

## Development

Install the pinned Tree-sitter CLI:

```sh
bun install
```

Regenerate the parser and run the complete validation suite:

```sh
bun run generate
bun run check
```

Run individual checks when iterating:

```sh
bun run test
bun run parse:example
```

Grammar changes belong in `grammar.js`. Commit the corresponding generated changes under `src/` and add focused cases to `test/corpus/`. `examples/security.spl` provides a realistic parse target.

## References

- https://tree-sitter.github.io/tree-sitter/creating-parsers/
- https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference
