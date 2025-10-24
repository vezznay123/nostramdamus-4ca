/**
 * BigQuery Integration Module
 * Load data from BigQuery using OAuth tokens
 */

export interface BigQueryConfig {
  projectId: string;
  datasetId?: string;
  tableId?: string;
  query?: string;
}

/**
 * Load data from BigQuery using a query
 */
export async function loadFromBigQuery(
  accessToken: string,
  config: BigQueryConfig
): Promise<any[]> {
  const { projectId, query, datasetId, tableId } = config;

  let finalQuery = query;

  // If no query provided, build one from table reference
  if (!finalQuery && datasetId && tableId) {
    finalQuery = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\``;
  }

  if (!finalQuery) {
    throw new Error('Either query or dataset/table must be provided');
  }

  // Create a job to run the query
  const jobUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/jobs`;

  const jobResponse = await fetch(jobUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      configuration: {
        query: {
          query: finalQuery,
          useLegacySql: false,
        },
      },
    }),
  });

  if (!jobResponse.ok) {
    const error = await jobResponse.text();
    throw new Error(`Failed to create BigQuery job: ${error}`);
  }

  const jobData = await jobResponse.json() as any;
  const jobId = jobData.jobReference.jobId;

  // Wait for job to complete
  let completed = false;
  let results: any = null;

  for (let i = 0; i < 30; i++) { // Try for 30 seconds max
    const statusUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/jobs/${jobId}`;

    const statusResponse = await fetch(statusUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error('Failed to check job status');
    }

    const statusData = await statusResponse.json() as any;

    if (statusData.status.state === 'DONE') {
      if (statusData.status.errors) {
        throw new Error(`BigQuery job failed: ${JSON.stringify(statusData.status.errors)}`);
      }
      completed = true;

      // Get query results
      const resultsUrl = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries/${jobId}`;

      const resultsResponse = await fetch(resultsUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!resultsResponse.ok) {
        throw new Error('Failed to get query results');
      }

      results = await resultsResponse.json();
      break;
    }

    // Wait 1 second before checking again
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (!completed) {
    throw new Error('BigQuery job timed out');
  }

  // Parse results into array of objects
  return parseBigQueryResults(results);
}

/**
 * Parse BigQuery results into array of objects
 */
function parseBigQueryResults(results: any): any[] {
  if (!results.rows || results.rows.length === 0) {
    return [];
  }

  const schema = results.schema.fields;
  const rows = results.rows;

  return rows.map((row: any) => {
    const obj: any = {};
    row.f.forEach((field: any, index: number) => {
      const fieldName = schema[index].name;
      obj[fieldName] = field.v;
    });
    return obj;
  });
}

/**
 * Parse BigQuery data into historical data format
 */
export function parseBigQueryDataToHistorical(data: any[]): Array<{
  date: string;
  category: string;
  clicks: number;
  revenue: number;
}> {
  const historicalData = [];

  for (const row of data) {
    // Skip rows without required fields
    if (!row.date && !row.Date) {
      continue;
    }

    // Parse date
    let dateStr = row.date || row.Date;
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      dateStr = date.toISOString().split('T')[0];
    }

    historicalData.push({
      date: dateStr,
      category: String(row.category || row.Category || 'Unknown'),
      clicks: parseFloat(row.clicks || row.Clicks || '0') || 0,
      revenue: parseFloat(row.revenue || row.Revenue || '0') || 0
    });
  }

  return historicalData;
}

/**
 * Test BigQuery connection
 */
export async function testBigQueryConnection(
  accessToken: string,
  projectId: string
): Promise<boolean> {
  try {
    const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
