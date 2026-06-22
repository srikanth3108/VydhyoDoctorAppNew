// ═══════════════════════════════════════════════════════════════════════════
// REUSABLE QUANTITY CALCULATION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parses a dose value that may include fractions (e.g., "1/2", "1", "0.5")
 * @param val - The value to parse
 * @returns The numeric value of the dose
 */
const parseDose = (val: string | number): number => {
  if (!val) return 0;

  const strVal = String(val);

  if (strVal.includes('/')) {
    const [num, den] = strVal.split('/').map(Number);
    return den ? num / den : 0;
  }

  return Number(strVal) || 0;
};

/**
 * Calculates the total medication quantity needed based on medicine type, duration, and frequency.
 * 
 * For manual quantity types (Syrup, Cream, Drops), returns 0 (user must enter manually).
 * For regular types, calculates: duration (days) × times per day, always rounding UP.
 * 
 * @param medicineType - Type of medicine (Tablet, Capsule, Syrup, Injection, Cream, Drops)
 * @param duration - Duration in days
 * @param frequency - Frequency in format "X-Y-Z" (e.g., "1-0-1" for morning and night)
 *                   or "SOS" for as-needed
 * @returns The calculated quantity, rounded up to nearest integer
 * 
 * @example
 * calculateMedicationQuantity('Tablet', 10, '1-0-1') // Returns 20 (10 days × 2 times/day)
 * calculateMedicationQuantity('Tablet', 7, '1/2-1-1') // Returns 18 (7 days × 2.5 times/day, rounded up)
 * calculateMedicationQuantity('Syrup', 5, '1-1-1') // Returns 0 (manual entry required)
 * calculateMedicationQuantity('Tablet', 10, 'SOS') // Returns 0 (as-needed, manual entry)
 */
export const calculateMedicationQuantity = (
  medicineType: string | null,
  duration: number | null,
  frequency: string | null
): number => {
  // Manual quantity types - return 0, user will enter manually
  const manualQuantityTypes = ['Syrup', 'Cream', 'Drops'];
  if (manualQuantityTypes.includes(medicineType || '')) {
    return 0;
  }

  // Invalid inputs
  if (!duration || duration <= 0 || !frequency || frequency === 'SOS') {
    return 0;
  }

  // Parse frequency string to calculate times per day
  const timesPerDay = String(frequency)
    .split('-')
    .map(parseDose)
    .reduce((sum, val) => sum + val, 0);

  if (timesPerDay <= 0) return 0;

  // Calculate raw quantity
  const rawQuantity = duration * timesPerDay;

  // ✅ ALWAYS ROUND UP (as per requirement)
  return Math.ceil(rawQuantity);
};
