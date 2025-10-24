/**
 * Build script to create complete dashboard HTML from original Flask app
 * This combines HTML, CSS, and JS into a single file for Workers
 */

const fs = require('fs');
const path = require('path');

const FLASK_ROOT = 'C:\\Users\\jonat\\OneDrive\\Документы\\Projects\\forecast';
const OUTPUT_FILE = './src/complete-dashboard.ts';

console.log('Building complete dashboard...');

// Read all source files
const htmlContent = fs.readFileSync(path.join(FLASK_ROOT, 'templates/index.html'), 'utf8');
const cssContent = fs.readFileSync(path.join(FLASK_ROOT, 'static/css/style.css'), 'utf8');
const appJs = fs.readFileSync(path.join(FLASK_ROOT, 'static/js/app.js'), 'utf8');
const appCorrelatedJs = fs.readFileSync(path.join(FLASK_ROOT, 'static/js/app_correlated.js'), 'utf8');
const appVolatilityJs = fs.readFileSync(path.join(FLASK_ROOT, 'static/js/app_volatility.js'), 'utf8');
const logoSvg = fs.readFileSync(path.join(FLASK_ROOT, 'static/images/logo.svg'), 'utf8');

// Process HTML: replace Flask template variables
let processed = htmlContent
  // Replace Jinja2 if statements
  .replace(/{% if user %}/g, '')
  .replace(/{% endif %}/g, '')
  .replace(/{% if user\.picture %}/g, '')

  // Replace variables
  .replace(/{{ user\.name }}/g, '${userName}')
  .replace(/{{ user\.email }}/g, '${userEmail}')
  .replace(/{{ user\.picture }}/g, '${userPicture}')

  // Replace url_for for CSS
  .replace(/<link rel="stylesheet" href="{{ url_for\('static', filename='css\/style\.css'\) }}">/, '<style>${cssContent}</style>')

  // Replace url_for for logo with inline SVG
  .replace(/<img src="{{ url_for\('static', filename='images\/logo\.svg'\) }}" alt="Nostradamus Logo" style="width: 180px; height: auto;">/, logoSvg.replace(/"/g, '\\"'))

  // Replace url_for for logout
  .replace(/{{ url_for\('auth\.logout'\) }}/g, '/auth/logout')

  // Replace script tags at end
  .replace(/<script src="{{ url_for\('static', filename='js\/app\.js'\) }}"><\/script>/, '<script>${appJs}</script>')
  .replace(/<script src="{{ url_for\('static', filename='js\/app_correlated\.js'\) }}"><\/script>/, '<script>${appCorrelatedJs}</script>')
  .replace(/<script src="{{ url_for\('static', filename='js\/app_volatility\.js'\) }}"><\/script>/, '<script>${appVolatilityJs}</script>');

// Create the TypeScript export
const output = `/**
 * Complete Nostradamus Dashboard
 * Auto-generated from Flask templates
 * Generated: ${new Date().toISOString()}
 */

export const completeDashboardHTML = (userEmail: string, userName: string, userPicture: string) => {
  const cssContent = \`${cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  const appJs = \`${appJs.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  const appCorrelatedJs = \`${appCorrelatedJs.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
  const appVolatilityJs = \`${appVolatilityJs.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;

  return \`${processed.replace(/`/g, '\\`')}\`;
};
`;

// Write output file
fs.writeFileSync(OUTPUT_FILE, output, 'utf8');

console.log(`✓ Complete dashboard built: ${OUTPUT_FILE}`);
console.log(`  - HTML: ${htmlContent.length} chars`);
console.log(`  - CSS: ${cssContent.length} chars`);
console.log(`  - JS: ${appJs.length + appCorrelatedJs.length + appVolatilityJs.length} chars`);
console.log(`  - Total output: ${output.length} chars`);
