
import type { Property, Bop } from '@/lib/types';
import { getPropertyValue } from './property-utils';

export type BillStatus = 'Paid' | 'Pending' | 'Overdue' | 'Unbilled';

export function getBillStatus(property: Property): BillStatus {
  const rateableValue = Number(getPropertyValue(property, 'Rateable Value')) || 0;
  const rateImpost = Number(getPropertyValue(property, 'Rate Impost')) || 0;
  const sanitationCharged = Number(getPropertyValue(property, 'Sanitation Charged')) || 0;
  const previousBalance = Number(getPropertyValue(property, 'Previous Balance')) || 0;
  const totalPayment = Number(getPropertyValue(property, 'Total Payment')) || 0;

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

export function getBopBillStatus(bop: Bop): BillStatus {
  const permitFee = Number(getPropertyValue(bop, 'Permit Fee')) || 0;
  const payment = Number(getPropertyValue(bop, 'Payment')) || 0;

  if (permitFee <= 0) {
    return 'Unbilled';
  }

  if (payment >= permitFee) {
    return 'Paid';
  }

  if (payment > 0) {
    return 'Pending';
  }

  return 'Overdue';
}
