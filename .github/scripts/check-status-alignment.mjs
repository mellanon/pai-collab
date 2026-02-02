import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

let errors = [];

function error(msg) {
  errors.push(`❌ ${msg}`);
  console.log(`::error::${msg}`);
}

function warn(msg) {
  console.log(`::warning::${msg}`);
}

// Load all PROJECT.yaml files
const projectsDir = 'projects';
const projects = new Map();

if (existsSync(projectsDir)) {
  const dirs = readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const dir of dirs) {
    const yamlPath = join(projectsDir, dir, 'PROJECT.yaml');
    if (existsSync(yamlPath)) {
      try {
        const doc = yaml.load(readFileSync(yamlPath, 'utf8'));
        projects.set(dir, doc);
      } catch (e) {
        // Skip invalid YAML — caught by validate-schemas
      }
    }
  }
}

// Load STATUS.md and parse the Projects table
const statusPath = 'STATUS.md';
if (existsSync(statusPath)) {
  const content = readFileSync(statusPath, 'utf8');
  const lines = content.split('\n');

  let inTable = false;
  let headerPassed = false;

  for (const line of lines) {
    if (line.includes('| Project') && line.includes('| Phase')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|---')) {
      headerPassed = true;
      continue;
    }
    if (inTable && headerPassed) {
      if (!line.startsWith('|')) {
        inTable = false;
        headerPassed = false;
        continue;
      }

      const cells = line.split('|').map(c => c.trim()).filter(c => c);
      if (cells.length < 3) continue;

      // Extract project name from markdown link [name](path)
      const nameMatch = cells[0].match(/\[([^\]]+)\]/);
      const projectName = nameMatch ? nameMatch[1] : cells[0].trim();
      const statusPhase = cells[2].trim();
      const statusMaintainer = cells[1].trim();

      // Find matching PROJECT.yaml
      for (const [dir, doc] of projects) {
        if (dir === projectName || doc.name === projectName) {
          // Check status alignment
          if (doc.status !== statusPhase) {
            error(`STATUS.md shows "${projectName}" as "${statusPhase}" but PROJECT.yaml says "${doc.status}". PROJECT.yaml is the source of truth.`);
          }

          // Check maintainer alignment
          const yamlMaintainer = `@${doc.maintainer}`;
          if (!statusMaintainer.includes(yamlMaintainer)) {
            warn(`STATUS.md maintainer for "${projectName}" is "${statusMaintainer}" but PROJECT.yaml says "@${doc.maintainer}". Align to PROJECT.yaml as source of truth.`);
          }
          break;
        }
      }
    }
  }

  // Check reverse — PROJECT.yaml exists but not in STATUS
  for (const [dir, doc] of projects) {
    if (!content.includes(dir) && !content.includes(doc.name)) {
      error(`Project "${doc.name}" (projects/${dir}/) has a PROJECT.yaml but is not listed in STATUS.md.`);
    }
  }
}

// --- Summary ---

console.log('\n━━━ STATUS.md Alignment Results ━━━\n');

if (errors.length === 0) {
  console.log('✅ STATUS.md is aligned with all PROJECT.yaml files.\n');
} else {
  errors.forEach(e => console.log(`  ${e}`));
  console.log(`\n${errors.length} alignment error(s). STATUS.md must match PROJECT.yaml — see CLAUDE.md → Artifact Schemas.\n`);
  process.exit(1);
}
