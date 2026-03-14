# /preview — Run Apps Script locally and export CSVs

Runs any Apps Script file locally using `scripts/runner.js`, which injects Google API shims, discovers functions from `onOpen()`, executes them, and exports each sheet tab as a CSV to `scripts/output/`.

## Usage

```
/preview [script-file]
```

- `script-file` defaults to `test-script.js` if omitted
- Output CSVs appear in `preview/<tab-slug>.csv`

## Steps

1. If no argument provided, default to `test-script.js`
2. Run: `node preview-scripts/runner.js <script-file>`
3. Show the output summary — tab names, record counts, and CSV file paths
4. If the user asks to spot-check data, read one of the output CSVs and show a sample

## Examples

```
/preview
/preview test-script.js
```
