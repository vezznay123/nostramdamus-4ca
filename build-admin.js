/**
 * Build script to create admin panel HTML from original Flask app
 * This combines HTML, CSS, and JS into a single file for Workers
 */

const fs = require('fs');
const path = require('path');

const FLASK_ROOT = 'C:\\Users\\jonat\\OneDrive\\Документы\\Projects\\forecast';
const OUTPUT_FILE = './src/admin-html.ts';

console.log('Building admin panel...');

// Read all source files
const htmlContent = fs.readFileSync(path.join(FLASK_ROOT, 'templates/admin.html'), 'utf8');
const adminJs = fs.readFileSync(path.join(FLASK_ROOT, 'static/js/admin.js'), 'utf8');

// Process HTML: replace Flask template variables
let processed = htmlContent
  // Replace Jinja2 statements
  .replace(/{% if user %}/g, '')
  .replace(/{% endif %}/g, '')

  // Replace url_for for CSS (inline styles are already in the HTML)
  .replace(/<link rel="stylesheet" href="{{ url_for\('static', filename='css\/style\.css'\) }}">/, '')

  // Replace url_for for logout
  .replace(/{{ url_for\('auth\.logout'\) }}/g, '/auth/logout')

  // Replace script tags at end
  .replace(/<script src="{{ url_for\('static', filename='js\/admin\.js'\) }}"><\/script>/, '<script>${adminJs}</script>');

// Create the TypeScript export
const output = `/**
 * Admin Panel HTML
 * Auto-generated from Flask templates
 * Generated: ${new Date().toISOString()}
 */

export const adminHTML = () => {
  const adminJs = \`${adminJs.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

  return \`${processed.replace(/`/g, '\\`')}\`;
};
`;

// Write output file
fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

console.log(`✓ Admin panel built: ${OUTPUT_FILE}`);
console.log(`  - HTML: ${htmlContent.length} chars`);
console.log(`  - JS: ${adminJs.length} chars`);
console.log(`  - Total output: ${output.length} chars`);
