
import type { Property, Bill, Bop } from './types';
import { store } from './store';
import { getPropertyValue } from './property-utils';
import { toast } from '@/hooks/use-toast';

// This is a mock SMS service. In a real application, this would
// make an HTTP request to an SMS provider's API.

export function getSmsConfig() {
    return store.settings.smsSettings || {};
}

function compileTemplate(template: string, data: Property | Bop | Bill): string {
    if (!template) return '';
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
        let value: any;
        if ('propertySnapshot' in data) { // It's a Bill object
            const bill = data as Bill;
            if (Object.prototype.hasOwnProperty.call(bill, key)) {
                value = (bill as any)[key];
            } else {
                value = getPropertyValue(bill.propertySnapshot, key);
            }
        } else { // It's a Property or Bop object
            value = getPropertyValue(data as Property, key);
        }
        
        // Format numbers to 2 decimal places if applicable
        if (typeof value === 'number' && ['totalAmountDue', 'Rateable Value', 'Total Payment', 'Permit Fee', 'Payment'].includes(key)) {
            return value.toFixed(2);
        }
        
        return value !== null && value !== undefined ? String(value) : '';
    });
}


/**
 * Sends a single SMS. This is the core function.
 * @param phoneNumber The recipient's phone number.
 * @param message The message to send.
 * @returns A promise that resolves to a success status.
 */
async function sendSingleSms(phoneNumber: string, message: string): Promise<boolean> {
    const config = getSmsConfig();
    const { smsApiUrl, smsApiKey, smsSenderId } = config;

    if (!smsApiUrl || !smsApiKey || !smsSenderId) {
        console.error("SMS settings are not configured. Cannot send SMS.");
        return false;
    }
    if (!message) {
        console.error("SMS message is empty. Cannot send.");
        return false;
    }

    const url = `${smsApiUrl}?action=send-sms&api_key=${smsApiKey}&to=${phoneNumber}&from=${smsSenderId}&sms=${encodeURIComponent(message)}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
        });

        if (response.ok) {
            console.log(`SMS sent to ${phoneNumber}`);
            return true;
        } else {
            const errorText = await response.text();
            console.error(`SMS API error for ${phoneNumber}:`, errorText);
            return false;
        }
    } catch (error) {
        console.error(`Failed to send SMS to ${phoneNumber}:`, error);
        return false;
    }
}

/**
 * Sends SMS to multiple properties with a custom message.
 * Used for bulk messaging from the Billing page.
 * @param items An array of properties or BOPs to send SMS to.
 * @param messageTemplate The custom message template.
 * @returns An array of results for each attempt.
 */
export async function sendSms(items: (Property | Bop)[], messageTemplate: string): Promise<{ propertyId: string; success: boolean; }[]> {
    const config = getSmsConfig();
    if (!config.smsApiUrl) {
        // The dialog itself will show a warning, so a toast here is redundant.
        console.error("SMS not configured.");
        return [];
    }
    
    const results = [];

    for (const item of items) {
        const phoneNumber = getPropertyValue(item, 'Phone Number');
        if (phoneNumber && String(phoneNumber).trim()) {
            const message = compileTemplate(messageTemplate, item);
            const success = await sendSingleSms(String(phoneNumber), message);
            results.push({ propertyId: item.id, success });
        } else {
             results.push({ propertyId: item.id, success: false });
        }
    }
    return results;
}

/**
 * Sends a notification when a new property is created.
 * Triggered from the PropertyDataContext.
 * @param property The newly created property.
 */
export async function sendNewPropertySms(property: Property | Bop) {
    const config = getSmsConfig();
    const { enableSmsOnNewProperty, newPropertyMessageTemplate } = config;

    if (!enableSmsOnNewProperty || !newPropertyMessageTemplate) {
        return;
    }

    const phoneNumber = getPropertyValue(property, 'Phone Number');
    if (!phoneNumber || !String(phoneNumber).trim()) {
        console.log("Skipping new property SMS: No phone number found for property ID", property.id);
        return;
    }

    const message = compileTemplate(newPropertyMessageTemplate, property);
    const success = await sendSingleSms(String(phoneNumber), message);
    
    // We only show a toast if it succeeds, to avoid spamming the user with failure notices for an automated background task.
    if(success) {
        toast({
            title: 'SMS Notification Sent',
            description: `A welcome message was sent to ${phoneNumber}.`,
        });
    } else {
        console.error(`Failed to send automated new property SMS to ${phoneNumber}.`);
    }
}

/**
 * Sends notifications when new bills are generated.
 * Triggered from the BillDataContext.
 * @param bills An array of newly created bills.
 */
export async function sendBillGeneratedSms(bills: Bill[]) {
    const config = getSmsConfig();
    const { enableSmsOnBillGenerated, billGeneratedMessageTemplate } = config;

    if (!enableSmsOnBillGenerated || !billGeneratedMessageTemplate) {
        return;
    }

    let sentCount = 0;
    for (const bill of bills) {
        const phoneNumber = getPropertyValue(bill.propertySnapshot, 'Phone Number');
        if (phoneNumber && String(phoneNumber).trim()) {
            const message = compileTemplate(billGeneratedMessageTemplate, bill);
            const success = await sendSingleSms(String(phoneNumber), message);
            if (success) {
                sentCount++;
            }
        }
    }

    if (sentCount > 0) {
        toast({
            title: 'Bill Notifications Sent',
            description: `Sent ${sentCount} SMS messages to property owners.`,
        });
    }
}
