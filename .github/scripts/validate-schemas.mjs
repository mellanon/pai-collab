import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

const ACCEPTED_LICENSES = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'];
const ACCEPTED_STATUSES = [
  'proposed', 'building', 'hardening', 'contrib-prep',
  'review', 'shipped', 'evolving', 'archived'
];
const ACCEPTED_PHASES = [
  'Specify', 'Build', 'Harden', 'Contrib Prep',
  'Review', 'Release', 'Evolve'
];

let errors = [];
let warnings = [];

function error(file, msg) {
  errors.push(`❌ ${file}: ${msg}`);
  console.log(`::error file=${file}::${msg}`);
}

function warn(file, msg) {
  warnings.push(`⚠️ ${file}: ${msg}`);
  console.log(`::warning file=${file}::${msg}`);
}

// --- Validate PROJECT.yaml files ---

const projectsDir = 'projects';
if (existsSync(projectsDir)) {
  const projects = readdirSync(projectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const project of projects) {
    const yamlPath = join(projectsDir, project, 'PROJECT.yaml');

    if (!existsSync(yamlPath)) {
      error(yamlPath, 'PROJECT.yaml is missing. Every project directory must include one. See CONTRIBUTING.md → PROJECT.yaml Schema.');
      continue;
    }

    let doc;
    try {
      doc = yaml.load(readFileSync(yamlPath, 'utf8'));
    } catch (e) {
      error(yamlPath, `Invalid YAML: ${e.message}`);
      continue;
    }

    // Required fields
    if (!doc.name) error(yamlPath, 'Missing required field: name');
    if (!doc.maintainer) error(yamlPath, 'Missing required field: maintainer');

    if (!doc.status) {
      error(yamlPath, 'Missing required field: status');
    } else if (!ACCEPTED_STATUSES.includes(doc.status)) {
      error(yamlPath, `Invalid status: "${doc.status}". Must be one of: ${ACCEPTED_STATUSES.join(', ')}`);
    }

    if (!doc.created) {
      error(yamlPath, 'Missing required field: created (YYYY-MM-DD). Used for staleness tracking.');
    } else if (doc.created instanceof Date) {
      // js-yaml auto-converts YYYY-MM-DD to Date objects — this is valid
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(doc.created))) {
      error(yamlPath, `Invalid created date format: "${doc.created}". Must be YYYY-MM-DD.`);
    }

    if (!doc.license) {
      error(yamlPath, 'Missing required field: license. All projects must declare a license. See CONTRIBUTING.md → Licensing Policy.');
    } else if (!ACCEPTED_LICENSES.includes(doc.license)) {
      error(yamlPath, `Invalid license: "${doc.license}". Accepted: ${ACCEPTED_LICENSES.join(', ')}. Copyleft licenses are not compatible with PAI's MIT license.`);
    }

    if (!doc.contributors) {
      error(yamlPath, 'Missing required field: contributors');
    } else if (typeof doc.contributors === 'object') {
      for (const [handle, fields] of Object.entries(doc.contributors)) {
        if (!fields.zone) error(yamlPath, `Contributor "${handle}" missing required field: zone`);
        if (!fields.since) error(yamlPath, `Contributor "${handle}" missing required field: since`);

        const allowedFields = new Set(['zone', 'since']);
        const extraFields = Object.keys(fields).filter(k => !allowedFields.has(k));
        if (extraFields.length > 0) {
          error(yamlPath, `Contributor "${handle}" has extra fields: ${extraFields.join(', ')}. Only "zone" and "since" are allowed. Track contributions in JOURNAL.md, not here.`);
        }
      }
    }

    // Check for JOURNAL.md
    const journalPath = join(projectsDir, project, 'JOURNAL.md');
    if (!existsSync(journalPath)) {
      warn(yamlPath, `No JOURNAL.md found in projects/${project}/. Every project directory should include one.`);
    }

    // Check for README.md
    const readmePath = join(projectsDir, project, 'README.md');
    if (!existsSync(readmePath)) {
      error(yamlPath, `No README.md found in projects/${project}/. Every project directory must include one.`);
    }
  }
}

// --- Validate JOURNAL.md entries (root) ---

const rootJournal = 'JOURNAL.md';
if (existsSync(rootJournal)) {
  const content = readFileSync(rootJournal, 'utf8');
  const entries = content.split(/^## \d{4}-\d{2}-\d{2}/m).slice(1);

  for (let i = 0; i < Math.min(entries.length, 5); i++) {
    const entry = entries[i];
    if (!entry.includes('**Author:**')) warn(rootJournal, `Recent entry ${i + 1} missing **Author:** field`);
    if (!entry.includes('**Phase:**')) warn(rootJournal, `Recent entry ${i + 1} missing **Phase:** field`);
    if (!entry.includes('**Status:**')) warn(rootJournal, `Recent entry ${i + 1} missing **Status:** field`);
    if (!entry.includes('**Issues:**')) warn(rootJournal, `Recent entry ${i + 1} missing **Issues:** field`);
  }
}

// --- Summary ---

console.log('\n━━━ Schema Validation Results ━━━\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All schemas valid.\n');
} else {
  if (errors.length > 0) {
    console.log('Errors:');
    errors.forEach(e => console.log(`  ${e}`));
    console.log();
  }
  if (warnings.length > 0) {
    console.log('Warnings:');
    warnings.forEach(w => console.log(`  ${w}`));
    console.log();
  }
}

if (errors.length > 0) {
  console.log(`\n${errors.length} error(s) found. See CONTRIBUTING.md for schema reference.\n`);
  process.exit(1);
}
