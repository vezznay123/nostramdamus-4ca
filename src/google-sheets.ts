/**
 * Google Sheets Integration Module
 * Load data from Google Sheets using OAuth tokens
 */

export interface SheetData {
  values: any[][];
}

/**
 * Extract spreadsheet ID from URL
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Load data from Google Sheets
 */
export async function loadFromGoogleSheets(
  accessToken: string,
  spreadsheetUrl: string,
  sheetName: string = 'Sheet1'
): Promise<any[]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheets URL');
  }

  // Fetch sheet data
  const range = encodeURIComponent(`${sheetName}!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to load Google Sheets data: ${error}`);
  }

  const data = await response.json() as SheetData;

  if (!data.values || data.values.length === 0) {
    throw new Error('No data found in sheet');
  }

  // Convert to array of objects
  const headers = data.values[0];
  const rows = data.values.slice(1);

  return rows.map(row => {
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || null;
    });
    return obj;
  });
}

/**
 * Parse sheet data into historical data format
 */
export function parseSheetDataToHistorical(sheetData: any[]): Array<{
  date: string;
  category: string;
  clicks: number;
  revenue: number;
}> {
  const historicalData = [];

  for (const row of sheetData) {
    // Skip rows without required fields
    if (!row.date || !row.category) {
      continue;
    }

    // Parse date (handle various formats)
    let dateStr = row.date;
    if (typeof dateStr === 'number') {
      // Excel serial date
      const date = new Date((dateStr - 25569) * 86400 * 1000);
      dateStr = date.toISOString().split('T')[0];
    } else {
      // Try to parse as date string
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        dateStr = date.toISOString().split('T')[0];
      }
    }

    historicalData.push({
      date: dateStr,
      category: String(row.category || 'Unknown'),
      clicks: parseFloat(row.clicks || row.Clicks || '0') || 0,
      revenue: parseFloat(row.revenue || row.Revenue || '0') || 0
    });
  }

  return historicalData;
}

/**
 * Write forecast results to Google Sheets
 */
export async function writeToGoogleSheets(
  accessToken: string,
  spreadsheetUrl: string,
  sheetName: string,
  data: any[][]
): Promise<void> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

  if (!spreadsheetId) {
    throw new Error('Invalid Google Sheets URL');
  }

  // Clear existing data first
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`;

  await fetch(clearUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  // Write new data
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?valueInputOption=RAW`;

  const response = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: data
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to write to Google Sheets: ${error}`);
  }
}

/**
 * Format forecast results for writing to sheets
 */
export function formatForecastsForSheets(forecasts: any[]): any[][] {
  const rows = [
    ['Category', 'Date', 'Clicks Forecast', 'Revenue Forecast']
  ];

  for (const categoryForecast of forecasts) {
    for (const forecast of categoryForecast.forecasts) {
      rows.push([
        categoryForecast.category,
        forecast.date,
        forecast.clicks_forecast,
        forecast.revenue_forecast
      ]);
    }
  }

  return rows;
}

/**
 * Get information about a Google Sheet (sheet names, etc.)
 */
export async function getSheetInfo(accessToken: string, spreadsheetUrl: string): Promise<any> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

  if (!spreadsheetId) {
    throw new Error('Invalid spreadsheet URL');
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get sheet info: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    spreadsheet_id: data.spreadsheetId,
    title: data.properties.title,
    sheets: data.sheets.map((sheet: any) => ({
      name: sheet.properties.title,
      index: sheet.properties.index,
      row_count: sheet.properties.gridProperties.rowCount,
      column_count: sheet.properties.gridProperties.columnCount
    }))
  };
}
