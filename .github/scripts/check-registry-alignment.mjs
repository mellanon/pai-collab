import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

let errors = [];

function error(msg) {
  errors.push(`❌ ${msg}`);
  console.log(`::error::${msg}`);
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

// Load REGISTRY.md and parse the Active Projects table
const registryPath = 'REGISTRY.md';
if (existsSync(registryPath)) {
  const content = readFileSync(registryPath, 'utf8');
  const lines = content.split('\n');

  // Find the Active Projects table
  let inTable = false;
  let headerPassed = false;

  for (const line of lines) {
    if (line.includes('| Project') && line.includes('| Status')) {
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

      const projectName = cells[0].replace(/\[([^\]]+)\].*/, '$1').trim();
      const registryStatus = cells[2].trim();

      // Find matching PROJECT.yaml by name
      let matched = false;
      for (const [dir, doc] of projects) {
        if (doc.name === projectName || dir === projectName.toLowerCase().replace(/\s+/g, '-')) {
          matched = true;
          if (doc.status !== registryStatus) {
            error(`REGISTRY.md shows "${projectName}" as "${registryStatus}" but PROJECT.yaml says "${doc.status}". These must match — PROJECT.yaml is the source of truth.`);
          }
          break;
        }
      }

      if (!matched && projectName) {
        // Check if any PROJECT.yaml matches by directory name
        const normalized = projectName.toLowerCase().replace(/\s+/g, '-');
        if (!projects.has(normalized)) {
          error(`REGISTRY.md lists "${projectName}" but no matching PROJECT.yaml found in projects/.`);
        }
      }
    }
  }

  // Check reverse — PROJECT.yaml exists but not in REGISTRY
  for (const [dir, doc] of projects) {
    if (!content.includes(dir) && !content.includes(doc.name)) {
      error(`Project "${doc.name}" (projects/${dir}/) has a PROJECT.yaml but is not listed in REGISTRY.md.`);
    }
  }
}

// --- Summary ---

console.log('\n━━━ Registry Alignment Results ━━━\n');

if (errors.length === 0) {
  console.log('✅ REGISTRY.md is aligned with all PROJECT.yaml files.\n');
} else {
  errors.forEach(e => console.log(`  ${e}`));
  console.log(`\n${errors.length} alignment error(s). REGISTRY.md must match PROJECT.yaml — see CONTRIBUTING.md → REGISTRY.md Entry Format.\n`);
  process.exit(1);
}
