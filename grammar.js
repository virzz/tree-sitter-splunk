/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  or: 1,
  and: 2,
  comparison: 3,
  concatenation: 4,
  additive: 5,
  multiplicative: 6,
  unary: 7,
  call: 8,
};

const commaSep1 = (rule) => seq(rule, repeat(seq(",", rule)));

const caseInsensitive = (value) => new RegExp(value, "i");

const operator = ($, value) =>
  alias(token(prec(2, caseInsensitive(value))), $.operator);

module.exports = grammar({
  name: "splunk",

  word: ($) => $.identifier,

  extras: ($) => [/\s+/, $.comment],

  supertypes: ($) => [$._expression],

  rules: {
    source_file: ($) => optional($.pipeline),

    pipeline: ($) =>
      choice(
        seq($.search_stage, repeat($.pipe_stage)),
        repeat1($.pipe_stage),
      ),

    search_stage: ($) =>
      seq(optional($.search_keyword), repeat1($._stage_item)),

    search_keyword: (_) => token(prec(2, /search/i)),

    pipe_stage: ($) => seq("|", $.command),

    command: ($) =>
      seq(field("name", $.command_name), repeat($._stage_item)),

    command_name: (_) => /[A-Za-z_][A-Za-z0-9_-]*/,

    _stage_item: ($) =>
      choice(
        $.keyword_assignment,
        $._expression,
        $.subsearch,
        $.clause_keyword,
        ",",
      ),

    keyword_assignment: ($) =>
      seq($.clause_keyword, "=", $._expression),

    clause_keyword: (_) =>
      token(
        prec(
          2,
          choice(
            /as/i,
            /by/i,
            /from/i,
            /where/i,
            /over/i,
            /span/i,
            /limit/i,
            /useother/i,
            /usenull/i,
            /output/i,
            /outputnew/i,
            /into/i,
            /on/i,
            /starts/i,
            /ends/i,
            /maxspan/i,
            /maxpause/i,
            /keepevents/i,
            /current/i,
            /window/i,
            /global/i,
            /local/i,
          ),
        ),
      ),

    subsearch: ($) => seq("[", optional($.pipeline), "]"),

    _expression: ($) =>
      choice(
        $.binary_expression,
        $.is_expression,
        $.field_value_expression,
        $.unary_expression,
        $.parenthesized_expression,
        $.tuple,
        $.function_call,
        $.macro_call,
        $.string,
        $.quoted_identifier,
        $.dashboard_token,
        $.template_token,
        $.relative_time,
        $.number,
        $.boolean,
        $.null_literal,
        $.qualified_value,
        $.wildcard_pattern,
        $.wildcard,
        $.identifier,
        $.bareword,
      ),

    binary_expression: ($) => {
      const table = [
        [PREC.or, operator($, "or")],
        [PREC.and, operator($, "and")],
        [
          PREC.comparison,
          choice(
            "=",
            "==",
            "!=",
            "=~",
            "<",
            "<=",
            ">",
            ">=",
            operator($, "in"),
            operator($, "like"),
          ),
        ],
        [PREC.concatenation, "."],
        [PREC.additive, choice("+", "-")],
        [PREC.multiplicative, choice("*", "/", "%")],
      ];

      return choice(
        ...table.map(([precedence, op]) =>
          prec.left(precedence, seq($._expression, op, $._expression)),
        ),
      );
    },

    is_expression: ($) =>
      prec.left(
        PREC.comparison,
        seq(
          $._expression,
          operator($, "is"),
          optional(operator($, "not")),
          choice($.null_literal, $.boolean, $.string),
        ),
      ),

    field_value_expression: ($) =>
      prec.left(
        PREC.comparison,
        seq(
          choice($.identifier, $.quoted_identifier),
          "::",
          choice(
            $.string,
            $.quoted_identifier,
            $.qualified_value,
            $.wildcard_pattern,
            $.wildcard,
            $.identifier,
            $.bareword,
            $.number,
          ),
        ),
      ),

    unary_expression: ($) =>
      prec(
        PREC.unary,
        seq(choice("!", "+", "-", operator($, "not")), $._expression),
      ),

    parenthesized_expression: ($) => seq("(", $._expression, ")"),

    tuple: ($) =>
      seq(
        "(",
        $._expression,
        ",",
        repeat(seq($._expression, ",")),
        optional($._expression),
        ")",
      ),

    function_call: ($) =>
      prec(
        PREC.call,
        seq(
          field("function", $.identifier),
          "(",
          optional(commaSep1($._expression)),
          ")",
        ),
      ),

    macro_call: ($) =>
      prec(
        PREC.call,
        seq(
          "`",
          field("name", $.macro_name),
          optional(seq("(", optional(commaSep1($._expression)), ")")),
          "`",
        ),
      ),

    macro_name: (_) => /[A-Za-z_][A-Za-z0-9_.-]*/,

    string: ($) =>
      seq(
        '"',
        repeat(choice($.escape_sequence, $.dashboard_token, $.string_content)),
        '"',
      ),

    string_content: (_) => token.immediate(prec(1, /[^"\\$\n]+/)),

    escape_sequence: (_) => token.immediate(seq("\\", /./)),

    quoted_identifier: ($) =>
      seq("'", repeat(choice($.escape_sequence, $.quoted_identifier_content)), "'"),

    quoted_identifier_content: (_) => token.immediate(prec(1, /[^'\\\n]+/)),

    dashboard_token: (_) =>
      token(prec(2, /\$[A-Za-z_][A-Za-z0-9_.:-]*(\|[A-Za-z]+)?\$/)),

    template_token: (_) => token(prec(2, /<<[A-Za-z_][A-Za-z0-9_]*>>/)),

    relative_time: (_) =>
      token(prec(2, /[+-]?[0-9]+(\.[0-9]+)?(s|m|h|d|w|mon|q|y)(@[A-Za-z]+)?/i)),

    number: (_) =>
      token(choice(/[0-9]+(\.[0-9]+)?/, /\.[0-9]+/)),

    boolean: (_) => token(prec(2, choice(/true/i, /false/i))),

    null_literal: (_) => token(prec(2, /null/i)),

    qualified_value: ($) =>
      seq(
        choice($.identifier, $.bareword),
        ":",
        choice($.identifier, $.bareword, $.wildcard_pattern),
      ),

    wildcard_pattern: (_) =>
      token(
        prec(
          1,
          /[A-Za-z0-9_@%:.\\\/-]*[*?][A-Za-z0-9_@%:.\\\/*?+-]*/,
        ),
      ),

    wildcard: (_) => "*",

    identifier: (_) => /[A-Za-z_][A-Za-z0-9_.]*/,

    bareword: (_) =>
      token(prec(-1, /[A-Za-z0-9_@%\\/-][A-Za-z0-9_@%.\\\/-]*/)),

    comment: (_) =>
      token(
        prec(
          3,
          seq(
            "```",
            repeat(choice(/[^`]+/, /`[^`]/, /``[^`]/)),
            "```",
          ),
        ),
      ),
  },
});
