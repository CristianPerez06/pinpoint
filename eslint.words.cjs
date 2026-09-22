/**
 * Words a person reads are not written into a component.
 *
 * Every sentence the product says lives once in `@pinpoint/wording`, under a
 * name, in every language the product is offered in. A name with no sentence
 * fails `check:wording`, and a sentence with no name fails it too — but words
 * never given a name at all are invisible to both. They are simply a component
 * that works, in one language, found by whoever reads the product in the other.
 * This is the check that sees them.
 *
 * Shared by both applications' configurations and by the packages', so the
 * three cannot disagree about what counts as words. CommonJS so that the
 * phone's `require`-based configuration and the two ESM ones can all load it.
 *
 * WHAT IT CHECKS
 *
 * Position, not meaning. Whether a run of characters is English prose cannot be
 * decided by reading it — a check that guessed would flag a style name, a
 * fixture, a web address and the word `button`, and would need a list of
 * exceptions to stay usable. Whether there is a literal where a sentence is
 * drawn has a definite answer:
 *
 * - between elements, by `react/jsx-no-literals`, including a string written
 *   as an expression (`{'Cancel'}`) and a template (`{`${n} places`}`), and by
 *   selector where one is chosen by a condition (`{open ? 'Hide' : 'Show'}`);
 * - in the attributes a screen reader announces or a field shows before it is
 *   filled — the accessibility names, the placeholder, the tooltip, an image's
 *   alternative, and `label`, which our own controls pass on to one of those.
 *   An attribute's value is refused only when it holds a letter, so `00:00` as
 *   a time field's placeholder is not words and passes.
 *
 * WHAT IT DOES NOT CATCH, SO NOBODY READS IT AS MORE
 *
 * A sentence assembled somewhere else and handed to a component as a value: a
 * `label: 'Light'` in an array of options, a string returned from a helper. The
 * check sees the drawing, not the assembling. It is worth having anyway,
 * because writing words straight into the markup is how nearly all of them
 * arrive — and text a person typed reaches a component as a value too, which is
 * what keeps `ALLOWED` below about punctuation instead of becoming the place
 * somebody's name goes.
 */

/**
 * What may be written between elements because it is not words.
 *
 * Punctuation and separators only: a mark standing between two values, which
 * reads the same in every language. Keep this short enough to read at a glance.
 * If something with a letter in it seems to belong here, it belongs in the
 * catalogue instead.
 */
const ALLOWED = [' ', '·', '•', '—', '–', '-', ',', ':', '/', '(', ')', '…', '×', '+', '%', '*', '✓', '✕', '☰']

/** Attributes whose value a person reads or hears. */
const SPOKEN_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
  'placeholder',
  'title',
  'alt',
  'label',
  'accessibilityLabel',
  'accessibilityHint',
]

const attribute = `JSXAttribute[name.name=/^(${SPOKEN_ATTRIBUTES.join('|')})$/]`

/** A letter in any script this product is written in. */
const LETTER = '/[A-Za-zÀ-ÿ]/'

const MESSAGE =
  'Words a person reads or hears are resolved from @pinpoint/wording, not written into a ' +
  'component — add a named sentence in every language and draw it with say(). See eslint.words.cjs.'

/**
 * A string chosen between two by a condition, as a child: `{open ? 'Hide' :
 * 'Show'}`, `{busy && 'Saving…'}`. `react/jsx-no-literals` reads only a literal
 * standing directly in the braces, and this is how most of the ones it missed
 * were written.
 */
const chosenChild = ['JSXElement', 'JSXFragment'].flatMap((parent) =>
  ['ConditionalExpression', 'LogicalExpression'].flatMap((choice) => [
    `${parent} > JSXExpressionContainer > ${choice} > Literal[value=${LETTER}]`,
    `${parent} > JSXExpressionContainer > ${choice} > TemplateLiteral > TemplateElement[value.raw=${LETTER}]`,
  ]),
)

const restrictedSyntax = [
  ...chosenChild.map((selector) => ({ selector, message: MESSAGE })),
  { selector: `${attribute} > Literal[value=${LETTER}]`, message: MESSAGE },
  { selector: `${attribute} > JSXExpressionContainer > Literal[value=${LETTER}]`, message: MESSAGE },
  {
    selector: `${attribute} > JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=${LETTER}]`,
    message: MESSAGE,
  },
  {
    selector: `${attribute} > JSXExpressionContainer > ConditionalExpression > Literal[value=${LETTER}]`,
    message: MESSAGE,
  },
]

/** The rules, for a configuration that has the React plugin registered. */
const wordsRules = {
  'react/jsx-no-literals': [
    'error',
    { noStrings: true, ignoreProps: true, allowedStrings: ALLOWED },
  ],
  'no-restricted-syntax': ['error', ...restrictedSyntax],
}

/**
 * The same check for a configuration without the React plugin — the packages',
 * which draw nothing and hold no JSX. Words between elements are caught by
 * selector there instead, so a component added to a package later is checked
 * from its first line.
 */
const wordsRulesWithoutReact = {
  'no-restricted-syntax': [
    'error',
    ...restrictedSyntax,
    { selector: `JSXText[value=${LETTER}]`, message: MESSAGE },
  ],
}

module.exports = { wordsRules, wordsRulesWithoutReact, ALLOWED, SPOKEN_ATTRIBUTES }
