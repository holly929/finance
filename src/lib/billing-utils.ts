import type { Property } from '@/lib/types';

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

export function getBillStatus(property: Property): BillStatus {
  const rateableValue = Number(property['Rateable Value']) || 0;
  const rateImpost = Number(property['Rate Impost']) || 0;
  const sanitationCharged = Number(property['Sanitation Charged']) || 0;
  const previousBalance = Number(property['Previous Balance']) || 0;
  const totalPayment = Number(property['Total Payment']) || 0;

  const grandTotalDue = (rateableValue * rateImpost) + sanitationCharged + previousBalance;

  if (grandTotalDue <= 0) {
    return 'Unbilled';
  } 
  
  if (totalPayment >= grandTotalDue) {
    return 'Paid';
  }

  if (totalPayment > 0) { // Implies totalPayment < grandTotalDue from previous check
    return 'Pending';
  }

  return 'Overdue'; // totalPayment <= 0 and grandTotalDue > 0
}
