// Business day calculation utilities
export class BusinessDayCalculator {
  /**
   * Check if a date is a weekend (Saturday or Sunday)
   */
  static isWeekend(date: Date): boolean {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  }

  /**
   * Add business days to a date (excluding weekends)
   */
  static addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let daysAdded = 0;
    
    while (daysAdded < businessDays) {
      result.setDate(result.getDate() + 1);
      if (!this.isWeekend(result)) {
        daysAdded++;
      }
    }
    
    return result;
  }

  /**
   * Calculate business days between two dates
   */
  static getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    if (startDate >= endDate) return 0;
    
    let businessDays = 0;
    const current = new Date(startDate);
    
    while (current < endDate) {
      current.setDate(current.getDate() + 1);
      if (!this.isWeekend(current)) {
        businessDays++;
      }
    }
    
    return businessDays;
  }

  /**
   * Check if a date is exactly N business days away from today
   */
  static isExactlyNBusinessDaysAway(targetDate: Date, businessDays: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    const actualBusinessDays = this.getBusinessDaysBetween(today, target);
    return actualBusinessDays === businessDays;
  }

  /**
   * Check if a date is within N business days from today
   */
  static isWithinNBusinessDays(targetDate: Date, businessDays: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    
    if (target <= today) return false; // Past dates don't trigger alerts
    
    const actualBusinessDays = this.getBusinessDaysBetween(today, target);
    return actualBusinessDays <= businessDays;
  }
}