
import type { Property, Bill } from './types';
import { inMemorySettings } from './settings';
import { getPropertyValue } from './property-utils';
import { toast } from '@/hooks/use-toast';

// This is a mock SMS service. In a real application, this would
// make an HTTP request to an SMS provider's API.

function getSmsConfig() {
    return inMemorySettings.smsSettings || {};
}

function compileTemplate(template: string, data: Property | Bill): string {
    return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match, key) => {
        // For bills, we might need data from the propertySnapshot
        if ('propertySnapshot' in data) {
            const bill = data as Bill;
            // First check top-level bill properties (like totalAmountDue, year)
            if (key in bill) {
                return String((bill as any)[key]);
            }
            // Then check the property snapshot
            return getPropertyValue(bill.propertySnapshot, key) || match;
        }
        // For properties, just use getPropertyValue
        return getPropertyValue(data as Property, key) || match;
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
        console.error("SMS settings are not configured.");
        return false;
    }

    console.log("--- MOCK SMS SENT ---");
    console.log(`To: ${phoneNumber}`);
    console.log(`From: ${smsSenderId}`);
    console.log(`Message: ${message}`);
    console.log(`Using API URL: ${smsApiUrl}`);
    console.log("-----------------------");
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
    
    // In a real app, you would use fetch:
    // const response = await fetch(smsApiUrl, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${smsApiKey}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: phoneNumber, from: smsSenderId, message: message })
    // });
    // return response.ok;
    
    return true; // Assume success for mock service
}

/**
 * Sends SMS to multiple properties with a custom message.
 * Used for bulk messaging from the Billing page.
 * @param properties An array of properties to send SMS to.
 * @param messageTemplate The custom message template.
 * @returns An array of results for each attempt.
 */
export async function sendSms(properties: Property[], messageTemplate: string): Promise<{ propertyId: string; success: boolean; }[]> {
    const config = getSmsConfig();
    if (!config.smsApiUrl) {
         toast({
            variant: 'destructive',
            title: 'SMS Not Configured',
            description: 'Please configure SMS settings on the Settings page first.',
        });
        return [];
    }
    
    const results = [];

    for (const prop of properties) {
        const phoneNumber = getPropertyValue(prop, 'Phone Number');
        if (phoneNumber) {
            const message = compileTemplate(messageTemplate, prop);
            const success = await sendSingleSms(phoneNumber, message);
            results.push({ propertyId: prop.id, success });
        } else {
             results.push({ propertyId: prop.id, success: false });
        }
    }
    return results;
}

/**
 * Sends a notification when a new property is created.
 * Triggered from the PropertyDataContext.
 * @param property The newly created property.
 */
export async function sendNewPropertySms(property: Property) {
    const config = getSmsConfig();
    const { enableSmsOnNewProperty, newPropertyMessageTemplate } = config;

    if (!enableSmsOnNewProperty || !newPropertyMessageTemplate) {
        return;
    }

    const phoneNumber = getPropertyValue(property, 'Phone Number');
    if (!phoneNumber) {
        console.log("Skipping new property SMS: No phone number found.");
        return;
    }

    const message = compileTemplate(newPropertyMessageTemplate, property);
    const success = await sendSingleSms(phoneNumber, message);
    
    if(success) {
        toast({
            title: 'SMS Notification Sent',
            description: `A welcome message was sent to ${phoneNumber}.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'SMS Notification Failed',
            description: 'Could not send the welcome SMS. Check SMS settings.',
        });
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
        if (phoneNumber) {
            const message = compileTemplate(billGeneratedMessageTemplate, bill);
            const success = await sendSingleSms(phoneNumber, message);
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
