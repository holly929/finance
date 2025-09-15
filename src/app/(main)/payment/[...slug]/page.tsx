
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Loader2, CheckCircle, ShieldCheck } from 'lucide-react';
import type { PaymentBill, Property, Bop, Bill, Payment } from '@/lib/types';
import { getPropertyValue } from '@/lib/property-utils';
import { getBillStatus, getBopBillStatus } from '@/lib/billing-utils';
import { paymentMethodIcons } from '@/components/payment-method-icons';
import { useToast } from '@/hooks/use-toast';
import { usePropertyData } from '@/context/PropertyDataContext';
import { useBopData } from '@/context/BopDataContext';
import { useBillData } from '@/context/BillDataContext';

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const paymentMethods = {
    momo: [
        { id: 'mtn', name: 'MTN Mobile Money' },
        { id: 'vodafone', name: 'Vodafone Cash' },
        { id: 'airteltigo', name: 'AirtelTigo Money' },
    ],
    card: [
        { id: 'visa', name: 'Visa' },
        { id: 'mastercard', name: 'Mastercard' },
    ],
    bank: [
        { id: 'gcb', name: 'GCB Bank' },
        { id: 'ecobank', name: 'Ecobank' },
    ]
};

export default function PaymentPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [bill, setBill] = useState<PaymentBill | null>(null);
    const [amountDue, setAmountDue] = useState(0);
    const [selectedMethod, setSelectedMethod] = useState('mtn');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [isClient, setIsClient] = useState(false);

    const { updateProperty } = usePropertyData();
    const { updateBop } = useBopData();
    const { addBills } = useBillData();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient) {
            const storedBill = localStorage.getItem('paymentBill');
            if (storedBill) {
                try {
                    const parsedBill: PaymentBill = JSON.parse(storedBill);
                    setBill(parsedBill);
                } catch (error) {
                    console.error("Failed to parse payment bill from localStorage", error);
                    toast({
                        variant: 'destructive',
                        title: 'Error',
                        description: 'Could not load bill details for payment.',
                    });
                }
            }
        }
    }, [isClient, toast]);

    useEffect(() => {
        if (bill) {
            calculateAmountDue(bill);
        }
    }, [bill]);

    const calculateAmountDue = (billToCalc: PaymentBill) => {
        let due = 0;
        if (billToCalc.type === 'property') {
            const rateableValue = Number(getPropertyValue(billToCalc.data, 'Rateable Value')) || 0;
            const rateImpost = Number(getPropertyValue(billToCalc.data, 'Rate Impost')) || 0;
            const sanitation = Number(getPropertyValue(billToCalc.data, 'Sanitation Charged')) || 0;
            const previousBalance = Number(getPropertyValue(billToCalc.data, 'Previous Balance')) || 0;
            const payment = Number(getPropertyValue(billToCalc.data, 'Total Payment')) || 0;
            due = (rateableValue * rateImpost) + sanitation + previousBalance - payment;
        } else { // BOP
            const permitFee = Number(getPropertyValue(billToCalc.data, 'Permit Fee')) || 0;
            const payment = Number(getPropertyValue(billToCalc.data, 'Payment')) || 0;
            due = permitFee - payment;
        }
        setAmountDue(due > 0 ? due : 0);
        
        const status = billToCalc.type === 'property' ? getBillStatus(billToCalc.data as Property) : getBopBillStatus(billToCalc.data as Bop);
        if (status === 'Paid') {
            setIsPaid(true);
        }
    };


    const handlePayment = async () => {
        if (!bill) return;
        setIsProcessing(true);

        // Simulate API call and redirect
        // In a real app, this would be an API call to Paystack, and Paystack would redirect
        setTimeout(() => {
            const mockAuthUrl = `/payment/callback?status=success&reference=${Date.now()}&billId=${bill.data.id}&amount=${amountDue}`;
            router.push(mockAuthUrl);
        }, 1500);
    };

    if (!isClient) {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        );
    }
    
    if (!bill && isClient) {
        return (
          <div className="flex h-screen items-center justify-center text-center">
            <div>
              <h2 className="text-xl font-semibold">Bill Not Found</h2>
              <p className="text-muted-foreground">The bill you are trying to pay could not be found.</p>
              <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
          </div>
        );
    }

    if (!bill) {
        return null;
    }

    const getBillTitle = () => bill.type === 'property' ? 'Property Rate Bill' : 'B.O.P. Bill';
    const getIdentifier = () => bill.type === 'property' 
        ? `Property No: ${getPropertyValue(bill.data, 'Property No')}`
        : `Business: ${getPropertyValue(bill.data, 'Business Name')}`;
    const getBilledTo = () => `Billed to: ${getPropertyValue(bill.data, 'Owner Name')}`;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-6">
                <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Billing
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>{getBillTitle()}</CardTitle>
                            <CardDescription>{getIdentifier()}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground">{getBilledTo()}</div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-medium">Total Amount Due</span>
                                <span className="text-2xl font-bold text-primary">{formatCurrency(amountDue)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Payment Method</CardTitle>
                            <CardDescription>Select a secure payment option.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isPaid || amountDue <= 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-10 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                                    <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">Payment Complete</h3>
                                    <p className="text-muted-foreground mt-2">This bill has been fully paid. Thank you!</p>
                                </div>
                            ) : (
                                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
                                    <div>
                                        <h3 className="mb-2 font-semibold text-sm">Mobile Money</h3>
                                        {paymentMethods.momo.map(method => {
                                            const Icon = paymentMethodIcons[method.id];
                                            return (
                                                <Label key={method.id} htmlFor={method.id} className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <RadioGroupItem value={method.id} id={method.id} />
                                                        {method.name}
                                                    </div>
                                                    <div className="h-8 w-12 flex items-center justify-center">
                                                        {Icon && <Icon />}
                                                    </div>
                                                </Label>
                                            );
                                        })}
                                    </div>
                                    <Separator />
                                    <div>
                                        <h3 className="mb-2 font-semibold text-sm">Card</h3>
                                        {paymentMethods.card.map(method => {
                                            const Icon = paymentMethodIcons[method.id];
                                            return (
                                                <Label key={method.id} htmlFor={method.id} className="flex items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <RadioGroupItem value={method.id} id={method.id} />
                                                        {method.name}
                                                    </div>
                                                    <div className="h-8 w-12 flex items-center justify-center">
                                                        {Icon && <Icon />}
                                                    </div>
                                                </Label>
                                            );
                                        })}
                                    </div>
                                </RadioGroup>
                            )}
                        </CardContent>
                        {!(isPaid || amountDue <= 0) && (
                            <CardFooter className="flex-col items-stretch space-y-4 border-t pt-6">
                                <Button size="lg" onClick={handlePayment} disabled={isProcessing}>
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : `Pay ${formatCurrency(amountDue)} Now`}
                                </Button>
                                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-green-600" />
                                    <span>Secure payment powered by RateEase Payments (Simulated)</span>
                                </div>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

    