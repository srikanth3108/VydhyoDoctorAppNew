import { ParsedProduct, CSVParseResult, CSVParseError } from '../types/Orders';

const REQUIRED_COLUMNS = ['name', 'description', 'category', 'price', 'quantity'];

/**
 * Detects CSV delimiter by checking for common delimiters in the first line
 */
function detectDelimiter(csvString: string): string {
  const firstLine = csvString.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  
  for (const delimiter of delimiters) {
    if (firstLine.includes(delimiter)) {
      return delimiter;
    }
  }
  
  return ','; // Default to comma
}

/**
 * Parses a CSV string into an array of products
 * @param csvString - Raw CSV content
 * @param delimiter - Optional CSV delimiter (auto-detected if not provided)
 * @returns CSVParseResult with products array and errors array
 */
export function parseCSV(csvString: string, delimiter?: string): CSVParseResult {
  const errors: CSVParseError[] = [];
  const products: ParsedProduct[] = [];
  
  if (!csvString || csvString.trim().length === 0) {
    return {
      products: [],
      errors: [{ row: 0, message: 'CSV content is empty' }],
      successCount: 0,
    };
  }
  
  const detectedDelimiter = delimiter || detectDelimiter(csvString);
  const lines = csvString.trim().split('\n');
  
  if (lines.length < 2) {
    return {
      products: [],
      errors: [{ row: 0, message: 'CSV must contain header and at least one data row' }],
      successCount: 0,
    };
  }
  
  // Parse header
  const headerLine = lines[0].trim();
  const headers = headerLine.split(detectedDelimiter).map(h => h.trim().toLowerCase());
  
  // Validate header
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    return {
      products: [],
      errors: [{
        row: 1,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      }],
      successCount: 0,
    };
  }
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    try {
      const values = line.split(detectedDelimiter).map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      // Validate required fields
      const rowErrors: string[] = [];
      
      if (!row.name || row.name.length === 0) {
        rowErrors.push('name is required');
      }
      
      if (!row.description || row.description.length === 0) {
        rowErrors.push('description is required');
      }
      
      if (!row.category || row.category.length === 0) {
        rowErrors.push('category is required');
      }
      
      if (!row.price || isNaN(parseFloat(row.price))) {
        rowErrors.push('price must be a valid number');
      }
      
      if (!row.quantity || isNaN(parseInt(row.quantity, 10))) {
        rowErrors.push('quantity must be a valid integer');
      }
      
      if (rowErrors.length > 0) {
        errors.push({
          row: i + 1,
          message: rowErrors.join('; '),
          data: row,
        });
        continue;
      }
      
      // Parse and validate numeric values
      const price = parseFloat(row.price);
      const quantity = parseInt(row.quantity, 10);
      
      if (price < 0) {
        errors.push({
          row: i + 1,
          message: 'price cannot be negative',
          data: row,
        });
        continue;
      }
      
      if (quantity < 0) {
        errors.push({
          row: i + 1,
          message: 'quantity cannot be negative',
          data: row,
        });
        continue;
      }
      
      products.push({
        name: row.name,
        description: row.description,
        category: row.category,
        price,
        quantity,
      });
    } catch (error) {
      errors.push({
        row: i + 1,
        message: `Failed to parse row: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
  
  return {
    products,
    errors,
    successCount: products.length,
  };
}

/**
 * Converts an array of products to CSV string
 * @param products - Array of products to convert
 * @param delimiter - CSV delimiter to use (default: comma)
 * @returns CSV string
 */
export function productsToCSV(products: ParsedProduct[], delimiter: string = ','): string {
  const headers = REQUIRED_COLUMNS.join(delimiter);
  const rows = products.map(product =>
    [
      `"${product.name}"`,
      `"${product.description}"`,
      `"${product.category}"`,
      product.price,
      product.quantity,
    ].join(delimiter)
  );
  
  return [headers, ...rows].join('\n');
}

/**
 * Validates a CSV string without parsing it
 * @param csvString - CSV content to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateCSV(csvString: string): CSVParseError[] {
  const errors: CSVParseError[] = [];
  
  if (!csvString || csvString.trim().length === 0) {
    errors.push({ row: 0, message: 'CSV content is empty' });
    return errors;
  }
  
  const lines = csvString.trim().split('\n');
  
  if (lines.length < 2) {
    errors.push({ row: 0, message: 'CSV must contain header and at least one data row' });
    return errors;
  }
  
  const delimiter = detectDelimiter(csvString);
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase());
  
  const missingColumns = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  if (missingColumns.length > 0) {
    errors.push({
      row: 1,
      message: `Missing required columns: ${missingColumns.join(', ')}`
    });
  }
  
  return errors;
}
