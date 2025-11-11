const fs = require('fs');
const path = require('path');

console.log('Applying fixes to Nostradamus React app...\n');

// Fix 1: DataSourceWizard - Remove Sample Data
const wizardPath = path.join(__dirname, 'src/components/DataSourceWizard.tsx');
if (fs.existsSync(wizardPath)) {
  let content = fs.readFileSync(wizardPath, 'utf8');
  content = content.replace("type DataSource = 'sample' | 'csv' | 'sheets' | 'bigquery';", "type DataSource = 'csv' | 'sheets' | 'bigquery';");
  content = content.replace(/const handleLoadSample[\s\S]*?\};\s*\n/, '');
  content = content.replace(/<button[^>]*onClick=\{\(\) => handleSourceSelection\('sample'\)\}[^>]*>[\s\S]*?Sample Data[\s\S]*?<\/button>\s*/, '');
  content = content.replace(/\{step === 2 && selectedSource === 'sample' && \([\s\S]*?<\/>[\s\S]*?\)\}\s*/, '');
  fs.writeFileSync(wizardPath, content);
  console.log('✓ DataSourceWizard.tsx updated');
}

// Fix 2: Header - Remove Admin Panel link
const headerPath = path.join(__dirname, 'src/components/Header.tsx');
if (fs.existsSync(headerPath)) {
  let content = fs.readFileSync(headerPath, 'utf8');
  content = content.replace(/<a[^>]*href="\/admin"[^>]*>[\s\S]*?Admin Panel[\s\S]*?<\/a>\s*/, '');
  fs.writeFileSync(headerPath, content);
  console.log('✓ Header.tsx updated');
}

// Fix 3: App - Remove Admin Panel route
const appPath = path.join(__dirname, 'src/App.tsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  content = content.replace(/import AdminPanel from ['"]\.\/pages\/AdminPanel['"];\s*/, '');
  content = content.replace(/<Route[^>]*path="\/admin"[\s\S]*?\/>\s*/, '');
  fs.writeFileSync(appPath, content);
  console.log('✓ App.tsx updated');
}

// Fix 4: Dashboard - Remove ScenariosManager
const dashboardPath = path.join(__dirname, 'src/pages/Dashboard.tsx');
if (fs.existsSync(dashboardPath)) {
  let content = fs.readFileSync(dashboardPath, 'utf8');
  content = content.replace(/import ScenariosManager from ['"][\.\w\/]+ScenariosManager['"];\s*/, '');
  content = content.replace(/<ScenariosManager[\s\S]*?\/>/g, '');
  fs.writeFileSync(dashboardPath, content);
  console.log('✓ Dashboard.tsx updated');
}

console.log('\n✓ All fixes applied successfully!\n');
