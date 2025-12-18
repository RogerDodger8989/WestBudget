/**
 * Filter transactions by date range
 * @param {Array} transactions - Array of transaction objects
 * @param {string} dateRange - One of: 'month', 'lastMonth', 'year', 'custom'
 * @param {string} customStart - Optional custom start date string (YYYY-MM-DD)
 * @param {string} customEnd - Optional custom end date string (YYYY-MM-DD)
 * @returns {Array} Filtered transactions
 */
export const filterByDateRange = (transactions, dateRange, customStart = null, customEnd = null) => {
  if (!transactions || transactions.length === 0) return [];
  
  const now = new Date();
  let startDateStr, endDateStr;
  
  switch (dateRange) {
    case 'month':
      // Denna månad
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      startDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`;
      // Last day of current month
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      endDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      break;
      
    case 'lastMonth':
      // Föregående månad
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthYear = lastMonthDate.getFullYear();
      const lastMonthMonth = lastMonthDate.getMonth();
      startDateStr = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-01`;
      // Last day of last month
      const lastMonthLastDay = new Date(lastMonthYear, lastMonthMonth + 1, 0).getDate();
      endDateStr = `${lastMonthYear}-${String(lastMonthMonth + 1).padStart(2, '0')}-${String(lastMonthLastDay).padStart(2, '0')}`;
      break;
      
    case 'year':
      // Hela året - från 1 januari till 31 december
      const year = now.getFullYear();
      startDateStr = `${year}-01-01`;
      endDateStr = `${year}-12-31`;
      break;
      
    case 'custom':
      // Anpassad period
      if (customStart && customEnd) {
        startDateStr = customStart;
        endDateStr = customEnd;
      } else {
        // Om ingen anpassad period är vald, visa alla
        return transactions;
      }
      break;
      
    default:
      // Om inget valt, visa alla
      return transactions;
  }
  
  // Convert date strings to comparable format (YYYYMMDD)
  const startDateNum = parseInt(startDateStr.replace(/-/g, ''));
  const endDateNum = parseInt(endDateStr.replace(/-/g, ''));
  
  const filtered = transactions.filter(transaction => {
    if (!transaction.date) return false;
    
    // Parse transaction date (format: YYYY-MM-DD)
    // Handle both string dates and already formatted dates
    let dateStr = transaction.date;
    if (typeof dateStr !== 'string') {
      // If it's not a string, try to convert it
      dateStr = String(dateStr);
    }
    
    // Remove any time portion if present (e.g., "2025-11-15T10:30:00" -> "2025-11-15")
    dateStr = dateStr.split('T')[0].split(' ')[0];
    
    const dateParts = dateStr.split('-');
    if (dateParts.length !== 3) {
      console.warn('Invalid date format:', transaction.date);
      return false;
    }
    
    // Validate date parts are numbers
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]);
    const day = parseInt(dateParts[2]);
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      console.warn('Invalid date parts:', dateParts);
      return false;
    }
    
    // Convert to comparable format (YYYYMMDD)
    const transactionDateNum = parseInt(dateStr.replace(/-/g, ''));
    
    // Check if transaction date is within range (simple numeric comparison)
    const inRange = transactionDateNum >= startDateNum && transactionDateNum <= endDateNum;
    
    return inRange;
  });
  
  // Sort by date (newest first) - convert date string to comparable number for sorting
  filtered.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    const dateA = parseInt(a.date.replace(/-/g, ''));
    const dateB = parseInt(b.date.replace(/-/g, ''));
    return dateB - dateA; // Descending order (newest first)
  });
  
  return filtered;
};

