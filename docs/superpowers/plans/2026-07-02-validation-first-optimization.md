# Validation-First Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real fixture validation entry point so future parser, exporter, dependency, and cleanup work has a repeatable regression check.

**Architecture:** Add one dependency-free Node script that shells out to the existing build and fixture CLI flow, then asserts representative generated outputs. Wire `npm test` to that script and update docs so contributors use the new validation entry point.

**Tech Stack:** Node.js CommonJS script, npm scripts, existing TypeScript build, existing fixture CLI command, Markdown docs.

---

## File Structure

- Create `scripts/verify-fixtures.js`: dependency-free validation runner for build, fixture CLI, generated-file existence checks, JSON parsing, and proto syntax marker checks.
- Modify `package.json`: replace the placeholder `test` script and add an explicit `verify:fixtures` script.
- Modify `docs/knowledge-base/validation.md`: document `npm test` as the primary verification entry point and retain lower-level commands.
- Modify `docs/knowledge-base/common-tasks.md`: change minimum validation guidance to prefer `npm test` for behavior changes.
- Modify `README.md`: add a short validation note for contributors.
- Modify `README_CN.md`: add the matching Chinese validation note.

## Task 1: Add Fixture Verification Script

**Files:**
- Create: `scripts/verify-fixtures.js`

- [ ] **Step 1: Create the verification script**

Create `scripts/verify-fixtures.js` with this complete content:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const requiredOutputs = [
	'testcase/exports/global.json',
	'testcase/exports/global.js',
	'testcase/exports/global.lua',
	'testcase/exports/global.cs',
	'testcase/exports/global_proto2.proto',
	'testcase/exports/global_proto3.proto',
	'testcase/exports/json/TypeHighChecker.json',
	'testcase/exports/js/Example1.js',
	'testcase/exports/lua/Example1.lua',
	'testcase/exports/proto2-data/Example1Category.bytes',
	'testcase/exports/proto3-data/Example1.bytes',
	'testcase/exports/protobuf-net/Example1.cs',
];

function phase(name) {
	console.log(`\n== ${name} ==`);
}

function fail(message) {
	console.error(`\n[verify-fixtures] ${message}`);
	process.exit(1);
}

function run(command, args) {
	console.log(`$ ${[command].concat(args).join(' ')}`);
	const result = spawnSync(command, args, {
		cwd: rootDir,
		stdio: 'inherit',
		shell: false,
	});

	if (result.error) {
		fail(`Failed to start command "${command}": ${result.error.message}`);
	}
	if (result.status !== 0) {
		fail(`Command failed with exit code ${result.status}: ${[command].concat(args).join(' ')}`);
	}
}

function absolute(relativePath) {
	return path.join(rootDir, relativePath);
}

function verifyRequiredOutputs() {
	const failures = [];
	for (const relativePath of requiredOutputs) {
		const filePath = absolute(relativePath);
		if (!fs.existsSync(filePath)) {
			failures.push(`${relativePath} is missing`);
			continue;
		}

		const stat = fs.statSync(filePath);
		if (!stat.isFile()) {
			failures.push(`${relativePath} is not a file`);
		} else if (stat.size === 0) {
			failures.push(`${relativePath} is empty`);
		}
	}

	if (failures.length > 0) {
		fail(`Generated output check failed:\n${failures.map(item => `- ${item}`).join('\n')}`);
	}
}

function parseJson(relativePath) {
	try {
		JSON.parse(fs.readFileSync(absolute(relativePath), 'utf8'));
	} catch (error) {
		fail(`Invalid JSON in ${relativePath}: ${error.message}`);
	}
}

function expectFileIncludes(relativePath, expectedText) {
	const content = fs.readFileSync(absolute(relativePath), 'utf8');
	if (!content.includes(expectedText)) {
		fail(`${relativePath} does not contain ${JSON.stringify(expectedText)}`);
	}
}

phase('Build project');
run(npmCommand, ['run', 'build']);

phase('Run fixture CLI');
run(process.execPath, ['dist/index.js', '-c', 'src/config_tpl.json', '-t', 'testcase/typeDef.js']);

phase('Check generated outputs');
verifyRequiredOutputs();
parseJson('testcase/exports/global.json');
parseJson('testcase/exports/json/TypeHighChecker.json');
expectFileIncludes('testcase/exports/global_proto2.proto', 'syntax = "proto2"');
expectFileIncludes('testcase/exports/global_proto3.proto', 'syntax = "proto3"');

console.log('\n[verify-fixtures] All checks passed.');
```

- [ ] **Step 2: Run the script directly**

Run:

```bash
node scripts/verify-fixtures.js
```

Expected:

- The command exits `0`.
- Output includes `== Build project ==`.
- Output includes `== Run fixture CLI ==`.
- Output includes `== Check generated outputs ==`.
- Output ends with `[verify-fixtures] All checks passed.`

- [ ] **Step 3: Commit the script**

Run:

```bash
git add scripts/verify-fixtures.js
git commit -m "test: add fixture verification script"
```

Expected: commit succeeds and contains only `scripts/verify-fixtures.js`.

## Task 2: Wire npm Test Command

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update npm scripts**

In `package.json`, replace the current `scripts` object with this exact object:

```json
"scripts": {
  "test": "npm run verify:fixtures",
  "verify:fixtures": "node scripts/verify-fixtures.js",
  "build": "cd TypeDef && tsc && cd .. && tsc",
  "pkg": "pkg -t node12-linux,node12-macos,node12-win --compress GZip . --out-path=bin/",
  "prepublishOnly": "npm run build"
}
```

- [ ] **Step 2: Run npm test**

Run:

```bash
npm test
```

Expected:

- The command exits `0`.
- npm invokes `npm run verify:fixtures`.
- The verification script prints `[verify-fixtures] All checks passed.`

- [ ] **Step 3: Check generated outputs are still ignored**

Run:

```bash
git status --short
```

Expected:

- `package.json` is listed as modified.
- `testcase/exports/` generated files are not listed.

- [ ] **Step 4: Commit npm script wiring**

Run:

```bash
git add package.json
git commit -m "test: wire npm test to fixture verification"
```

Expected: commit succeeds and contains only `package.json`.

## Task 3: Update Validation Documentation

**Files:**
- Modify: `docs/knowledge-base/validation.md`
- Modify: `docs/knowledge-base/common-tasks.md`

- [ ] **Step 1: Replace the npm test facts in validation.md**

In `docs/knowledge-base/validation.md`, replace the current `## Facts` section with:

````markdown
## Facts

`npm test` is the primary fixture validation command:

```bash
npm test
```

Expected behavior: build `TypeDef/`, build the main TypeScript project, run the fixture CLI against `testcase/`, and check representative generated outputs under `testcase/exports/`.
````

- [ ] **Step 2: Add a primary validation section**

In `docs/knowledge-base/validation.md`, add this section before `### 构建验证`:

````markdown
### Primary fixture validation

Run:

```bash
npm test
```

Expected behavior: executes `scripts/verify-fixtures.js`, which runs `npm run build`, runs the fixture CLI, checks representative generated outputs, parses JSON outputs, and verifies proto syntax markers.
````

- [ ] **Step 3: Update the validation command block**

In `docs/knowledge-base/common-tasks.md`, replace the final validation command block:

```bash
npm run build
node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js
```

with:

```bash
npm test
```

- [ ] **Step 4: Add lower-level command note**

Directly under that `npm test` block in `docs/knowledge-base/common-tasks.md`, add:

```markdown
`npm test` wraps `npm run build` and `node dist/index.js -c src/config_tpl.json -t testcase/typeDef.js`, then checks representative generated outputs.
```

- [ ] **Step 5: Run documentation checks**

Run:

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" docs/knowledge-base AGENTS.md CLAUDE.md
find docs/knowledge-base -maxdepth 1 -type f | sort
```

Expected:

- The `rg` command prints no matches and exits `1`.
- The `find` command lists the five knowledge-base Markdown files.

- [ ] **Step 6: Commit knowledge-base docs**

Run:

```bash
git add docs/knowledge-base/validation.md docs/knowledge-base/common-tasks.md
git commit -m "docs: document fixture verification command"
```

Expected: commit succeeds and contains only the two knowledge-base files.

## Task 4: Update README Validation Notes

**Files:**
- Modify: `README.md`
- Modify: `README_CN.md`

- [ ] **Step 1: Add English validation note**

In `README.md`, after the sentence `This generates binaries in the \`bin/\` directory.` and before `## Basic Usage Process`, add:

````markdown
### Validation

Run the fixture validation command before changing loaders, parsers, TypeDef behavior, exporters, or generated-output rules:

```bash
npm test
```

This builds the TypeDef package, builds the main project, runs the bundled fixtures, and checks representative generated outputs.
````

- [ ] **Step 2: Add Chinese validation note**

In `README_CN.md`, after the sentence `这会在 \`bin/\` 目录下生成各个平台的可执行文件。` and before `## 基本使用流程`, add:

````markdown
### 验证

修改 loader、parser、TypeDef 行为、exporter 或生成输出规则前后，运行 fixture 验证命令：

```bash
npm test
```

该命令会构建 TypeDef 包和主项目，运行内置 fixtures，并检查代表性生成输出。
````

- [ ] **Step 3: Run README marker check**

Run:

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" README.md README_CN.md
```

Expected: no output and exit code `1`.

- [ ] **Step 4: Commit README docs**

Run:

```bash
git add README.md README_CN.md
git commit -m "docs: add validation command to readmes"
```

Expected: commit succeeds and contains only `README.md` and `README_CN.md`.

## Task 5: Final Verification

**Files:**
- Verify: `scripts/verify-fixtures.js`
- Verify: `package.json`
- Verify: `docs/knowledge-base/validation.md`
- Verify: `docs/knowledge-base/common-tasks.md`
- Verify: `README.md`
- Verify: `README_CN.md`

- [ ] **Step 1: Run full validation**

Run:

```bash
npm test
```

Expected: exits `0` and ends with `[verify-fixtures] All checks passed.`

- [ ] **Step 2: Run doc marker checks**

Run:

```bash
rg -n "TB[D]|TO[D]O|FIX[M]E|[待]定|[占]位|\\?\\?" docs/knowledge-base AGENTS.md CLAUDE.md README.md README_CN.md docs/superpowers/specs docs/superpowers/plans
```

Expected: no output and exit code `1`.

- [ ] **Step 3: Inspect recent commits**

Run:

```bash
git log --oneline -4
```

Expected: recent commits include:

```text
docs: add validation command to readmes
docs: document fixture verification command
test: wire npm test to fixture verification
test: add fixture verification script
```

- [ ] **Step 4: Inspect worktree**

Run:

```bash
git status --short
```

Expected: clean worktree. If generated fixture outputs appear, inspect whether `.gitignore` coverage changed before staging anything.
