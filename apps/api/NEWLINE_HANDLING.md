# JSON Newline Handling in Document Replacements

## Summary

This document explains how newlines are handled in JSON document replacements, providing guidance on properly working with multi-line content in JSON fields.

## Key Concepts

1. **JSON String Representation vs. JavaScript Object**:
   - In JSON strings, newlines are represented as `\n` escape sequences
   - After parsing with `JSON.parse()`, these become actual newlines in JavaScript strings
   - When stringifying with `JSON.stringify()`, actual newlines are automatically escaped as `\n`

2. **Proper Newline Handling**:
   - When storing a JSON string, newlines should be escaped as `\n` (single backslash)
   - Double-escaped newlines (`\\n`) are incorrect and will render as literal backslash-n in UI
   - When displaying JSON content in UI, no additional conversion is needed after parsing

3. **Literal `\n` Sequences in Text**:
   - When encountering literal `\n` sequences in text (before parsing), they should be converted to actual newlines
   - This ensures that when the text is later stringified with `JSON.stringify()`, they'll be properly escaped as `\n`

## Common Patterns

### Pattern 1: Adding Multi-line Content to JSON

```javascript
// Original JSON with single-line content
const jsonString = '{"Title":"Document","Description":"Single line"}'

// Parse to object
const jsonObj = JSON.parse(jsonString)

// Add multi-line content with actual newlines
jsonObj.Description = "First line\nSecond line\nThird line"

// Stringify - newlines are automatically escaped correctly
const updatedJson = JSON.stringify(jsonObj)
// Result: {"Title":"Document","Description":"First line\nSecond line\nThird line"}
```

### Pattern 2: Replacing Content with Literal `\n` Sequences

```javascript
// Original JSON string
const jsonString = '{"Title":"Document","Description":"Old content"}'

// Replace with text containing literal \n sequences
const replacedString = jsonString.replace(
  '"Description":"Old content"',
  '"Description":"New content with \\n literal newlines"'
)

// When parsed, the literal \n sequences need special handling
const jsonObj = JSON.parse(replacedString)

// To handle literal \n sequences, convert them to actual newlines
jsonObj.Description = jsonObj.Description.replace(/\\n/g, '\n')

// Stringify again to get properly escaped newlines
const finalJson = JSON.stringify(jsonObj)
```

### Pattern 3: Working with Bulleted Lists

```javascript
// Original JSON with bulleted list
const jsonString = '{"Alternatives":"- Item 1\\n- Item 2\\n- Item 3"}'

// Parse to object
const jsonObj = JSON.parse(jsonString)

// Split the bulleted list on newlines
const items = jsonObj.Alternatives.split('\n')

// Modify the items
const updatedItems = items.map(item => item + ' (updated)')

// Join with actual newlines and update
jsonObj.Alternatives = updatedItems.join('\n')

// Stringify - newlines are automatically escaped
const updatedJson = JSON.stringify(jsonObj)
```

## Testing Strategies

1. **Newline Encoding Tests**:
   - Verify that newlines are correctly encoded as `\n` in JSON strings
   - Check that double-escaped newlines (`\\n`) are not present

2. **Multi-line Content Display Tests**:
   - Verify that multi-line content is properly split into the correct number of lines
   - Check that formatting (like bulleted lists) is preserved

3. **Literal `\n` Sequence Tests**:
   - Verify that literal `\n` sequences in replacement text are correctly converted to actual newlines
   - Check that these are then properly escaped when stringified back to JSON

## Implementation Guidelines

1. When processing text replacements in JSON:
   - First check if the content is valid JSON
   - Parse it to work with the object representation
   - Apply replacements to the appropriate field values
   - Convert any literal `\n` sequences to actual newlines
   - Stringify the result to get properly escaped JSON

2. Avoid manually escaping newlines before using `JSON.stringify()`:
   - Let `JSON.stringify()` handle the escaping
   - Don't use `.replace(/\n/g, '\\n')` before stringifying

3. When displaying JSON content in UI:
   - Parse the JSON first to get a JavaScript object
   - Access the field values directly
   - Use the values without further conversion (newlines are already actual newlines)

## Related Functions

- `processSearchReplace()` - Handles direct text replacements in JSON content
- `applyDiffBlocks()` - Applies search/replace operations from diff blocks to documents
- `testNewlineHandlingInJsonReplacements()` - Comprehensive test for newline handling

## Known Issues

1. Unbalanced nested quotes can cause parsing failures.
2. Special characters like tabs (`\t`) require similar handling to newlines.
3. Some editors may normalize newlines differently (CR, LF, CRLF), affecting comparison operations. 