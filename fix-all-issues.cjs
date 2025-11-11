const fs = require('fs');
const path = require('path');

console.log('Fixing Nostradamus Cloudflare Workers App...\n');

// Fix 1: Remove Sample Data button from complete-dashboard.ts
console.log('1. Removing Sample Data button...');
const dashboardPath = path.join(__dirname, 'src/complete-dashboard.ts');
let dashboard = fs.readFileSync(dashboardPath, 'utf8');

// Remove the Sample Data button block (lines around 2814-2817)
const sampleButtonPattern = /<button id="loadSampleBtn" class="btn btn-primary"[\s\S]*?<\/button>\s*(?=<button id="loadCSVBtn")/;
dashboard = dashboard.replace(sampleButtonPattern, '');

fs.writeFileSync(dashboardPath, dashboard);
console.log('   ✓ Sample Data button removed\n');

// Fix 2: Remove Admin Panel/Configuration link from header
console.log('2. Removing Configuration link...');
dashboard = fs.readFileSync(dashboardPath, 'utf8');

const configLinkPattern = /<a href="\\\\admin" class="btn btn-secondary" style="text-decoration: none; white-space: nowrap;">[\s\S]*?Configuration[\s\S]*?<\/a>\s*/;
dashboard = dashboard.replace(configLinkPattern, '');

fs.writeFileSync(dashboardPath, dashboard);
console.log('   ✓ Configuration link removed\n');

// Fix 3: Update the GCP forecast call to handle errors better
console.log('3. Improving error handling for SARIMA calls...');
const mlPath = path.join(__dirname, 'src/forecasting-ml.ts');
let ml = fs.readFileSync(mlPath, 'utf8');

// Add better error messaging
const originalCatch = `} catch (error: any) {
      console.error('GCP forecast error:', error);
      // Fall through to Holt-Winters
    }`;

const improvedCatch = `} catch (error: any) {
      console.error('GCP forecast error:', error);
      console.log('Falling back to Holt-Winters due to GCP error');
      // Fall through to Holt-Winters
    }`;

ml = ml.replace(originalCatch, improvedCatch);
fs.writeFileSync(mlPath, ml);
console.log('   ✓ Error handling improved\n');

console.log('✓ All UI fixes applied!\n');
console.log('\nIMPORTANT: The auto-tune SARIMA feature needs the GCP function deployed separately.');
console.log('\nTo deploy GCP functions:');
console.log('  cd ../forecast-gcp-function');
console.log('  gcloud functions deploy nostradamus-forecast --entry-point=forecast ...');
console.log('  gcloud functions deploy nostradamus-auto-tune --entry-point=auto_tune_sarima ...');
console.log('\nTo deploy this app:');
console.log('  wrangler deploy');
