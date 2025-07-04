
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Property } from '@/lib/types';
import { Printer } from 'lucide-react';

interface BillDialogProps {
  property: Property | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type GeneralSettings = {
  assemblyName?: string;
  postalAddress?: string;
  contactPhone?: string;
};

type AppearanceSettings = {
  assemblyLogo?: string;
  ghanaLogo?: string;
  signature?: string;
  billWarningText?: string;
};

const BillRow = ({ label, value, isBold = false }: { label: string; value: string | number; isBold?: boolean; }) => (
  <div className={`flex justify-between p-1 border-b border-black h-[24px] items-center ${isBold ? 'font-bold' : ''}`}>
    <span>{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

// This helper hook normalizes property data to handle inconsistencies in keys from imported files.
const useNormalizedProperty = (property: Property | null) => {
    return useMemo(() => {
        if (!property) return null;

        const standardToPotentialKeys: Record<string, string[]> = {
            'Owner Name': ['Owner Name', 'Name of Owner', 'Rate Payer', 'ownername'],
            'Town': ['Town'],
            'Property No': ['Property No', 'Property Number', 'propertyno'],
            'Valuation List No.': ['Valuation List No.', 'Valuation List Number', 'valuationlistno'],
            'Suburb': ['Suburb'],
            'Account Number': ['Account Number', 'Acct No', 'accountnumber'],
            'Property Type': ['Property Type', 'propertytype'],
            'Rateable Value': ['Rateable Value', 'rateablevalue'],
            'Rate Impost': ['Rate Impost', 'rateimpost'],
            'Sanitation Charged': ['Sanitation Charged', 'Sanitation', 'sanitationcharged'],
            'Previous Balance': ['Previous Balance', 'Prev Balance', 'Arrears', 'previousbalance', 'Arrears BF'],
            'Total Payment': ['Total Payment', 'Amount Paid', 'Payment', 'totalpayment'],
        };
        
        const normalizedProperty: Record<string, any> = {};
        const propertyKeys = Object.keys(property);
        const normalizeKey = (str: string) => (str || '').toLowerCase().replace(/[\s._-]/g, '');

        for (const stdKey in standardToPotentialKeys) {
            let foundValue: any = null;
            
            // 1. Try matching aliases
            for (const alias of standardToPotentialKeys[stdKey]) {
                const normalizedAlias = normalizeKey(alias);
                const foundKey = propertyKeys.find(pKey => normalizeKey(pKey) === normalizedAlias);
                if (foundKey) {
                    foundValue = property[foundKey];
                    break;
                }
            }

            // 2. If no alias match, try token-based matching as a fallback
            if (foundValue === null || foundValue === undefined) {
                const stdKeyTokens = stdKey.toLowerCase().match(/\w+/g) || [];
                if (stdKeyTokens.length > 0) {
                     const foundKey = propertyKeys.find(pKey => {
                         const pKeyLower = pKey.toLowerCase();
                         return stdKeyTokens.every(token => pKeyLower.includes(token));
                     });
                     if (foundKey) {
                         foundValue = property[foundKey];
                     }
                }
            }
            normalizedProperty[stdKey] = foundValue;
        }
        return normalizedProperty;
    }, [property]);
};


export const PrintableContent = React.forwardRef<HTMLDivElement, { property: Property, settings: any }>(
  ({ property, settings }, ref) => {
    
    const normalizedProperty = useNormalizedProperty(property);
    const [displaySettings, setDisplaySettings] = useState<Record<string, boolean>>({});

    useEffect(() => {
        try {
            const savedFields = localStorage.getItem('billDisplaySettings');
            if (savedFields) {
                setDisplaySettings(JSON.parse(savedFields));
            } else if (property) {
                const allFields = Object.keys(property).reduce((acc, key) => {
                    acc[key] = true;
                    return acc;
                }, {} as Record<string, boolean>);
                setDisplaySettings(allFields);
            }
        } catch (error) {
            console.error("Could not load bill display settings", error);
        }
    }, [property]);
    
    const getNumber = (key: string): number | null => {
        if (!normalizedProperty) return null;
        const value = normalizedProperty[key];
        if (value === null || value === undefined || String(value).trim() === '') return null;
        const cleanedValue = String(value).replace(/[^0-9.-]/g, '');
        if (cleanedValue === '') return null;
        const num = Number(cleanedValue);
        return isNaN(num) ? null : num;
    };

    const rateableValue = getNumber('Rateable Value');
    const rateImpost = getNumber('Rate Impost');
    const sanitationCharged = getNumber('Sanitation Charged');
    const previousBalance = getNumber('Previous Balance');
    const totalPayment = getNumber('Total Payment');

    const amountCharged = (rateableValue != null && rateImpost != null) ? rateableValue * rateImpost : null;
    const totalThisYear = (amountCharged != null ? amountCharged : 0) + (sanitationCharged != null ? sanitationCharged : 0);
    const totalAmountDue = (totalThisYear != null ? totalThisYear : 0) + (previousBalance != null ? previousBalance : 0) - (totalPayment != null ? totalPayment : 0);


    const formatDate = (date: Date) => {
        const day = date.getDate();
        const month = date.toLocaleString('default', { month: 'long' }).toUpperCase();
        const year = date.getFullYear();
        const getOrdinal = (n: number) => {
            if (n > 3 && n < 21) return n + 'TH';
            switch (n % 10) {
                case 1:  return n + "ST";
                case 2:  return n + "ND";
                case 3:  return n + "RD";
                default: return n + "TH";
            }
        };
        return `${getOrdinal(day)} ${month}, ${year}`;
    };

    const formatAmount = (amount: number | null) => (amount != null ? amount.toFixed(2) : '0.00');
    
    const formatValue = (valueKey: string) => {
        if (!normalizedProperty) return '...';
        const val = normalizedProperty[valueKey];
        return val != null && val !== '' ? String(val) : '...';
    }
    
    const normalizeDisplayKey = (key: string): string => {
        return (key || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    }

    const shouldDisplay = (field: string) => {
        const normalizedSearchKey = normalizeDisplayKey(field);
        for (const settingKey in displaySettings) {
             if (normalizeDisplayKey(settingKey) === normalizedSearchKey) {
                return displaySettings[settingKey];
             }
        }
        return true;
    };
    
    const DetailRow = ({ label, valueKey }: { label: string; valueKey: string; }) => {
        if (!shouldDisplay(valueKey)) return null;
        return <div className="flex"><div className="w-1/3 font-bold border-b border-black p-1">{label}</div><div className="w-2/3 border-b border-l border-black p-1">{formatValue(valueKey)}</div></div>;
    };

    const DetailRowRight = ({ label, valueKey }: { label: string; valueKey: string; }) => {
        if (!shouldDisplay(valueKey)) return <div className="h-[28px] border-b border-black"></div>;
        return <div className="flex"><div className="w-1/2 font-bold border-b border-black p-1">{label}</div><div className="w-1/2 border-b border-l border-black p-1">{formatValue(valueKey)}</div></div>;
    };

    return (
      <div ref={ref} className="p-4 font-sans text-black bg-white print-container text-[12px]">
        <div className="border-[3px] border-black p-1 relative">
          <div className="absolute inset-0 z-0 flex items-center justify-center opacity-10 pointer-events-none">
              {settings.appearance?.ghanaLogo && (
                  <Image src={settings.appearance.ghanaLogo} alt="Watermark" width={300} height={300} style={{objectFit: 'contain'}} />
              )}
          </div>
          <div className="relative z-10">
            <header className="flex justify-between items-start mb-2">
                <div className="w-1/4 flex justify-start items-center h-[70px]">
                    {settings.appearance?.ghanaLogo && <Image src={settings.appearance.ghanaLogo} alt="Ghana Coat of Arms" width={70} height={70} style={{objectFit:"contain"}} />}
                </div>
                <div className="w-1/2 text-center">
                    <h1 className="font-bold text-lg tracking-wide">{settings.general?.assemblyName?.toUpperCase() || 'DISTRICT ASSEMBLY'}</h1>
                    <h2 className="font-bold text-base tracking-wide">PROPERTY BILLING</h2>
                    <p className="text-[12px]">{settings.general?.postalAddress}</p>
                    <p className="text-[12px]">TEL: {settings.general?.contactPhone}</p>
                </div>
                <div className="w-1/4 flex justify-end items-center h-[70px]">
                    {settings.appearance?.assemblyLogo && <Image src={settings.appearance.assemblyLogo} alt="Assembly Logo" width={70} height={70} style={{objectFit:"contain"}} />}
                </div>
            </header>
            
            <main className="border-t-2 border-b-2 border-black">
                <div className="flex border-b-2 border-black">
                    <div className="w-[67%] border-r-2 border-black">
                        <DetailRow label="OWNER NAME" valueKey="Owner Name" />
                        <DetailRow label="TOWN" valueKey="Town" />
                        <DetailRow label="PROPERTY NO:" valueKey="Property No" />
                        <DetailRow label="VALUATION LIST NO.:" valueKey="Valuation List No." />
                    </div>
                    <div className="w-[33%]">
                        <DetailRowRight label="SUBURB" valueKey="Suburb" />
                        <DetailRowRight label="ACCOUNT NUMBER" valueKey="Account Number" />
                        <div className="flex h-[28px]"><div className="w-1/2 font-bold border-b border-black p-1">BILL DATE</div><div className="w-1/2 border-b border-l border-black p-1">{formatDate(new Date())}</div></div>
                        <DetailRowRight label="PROPERTY TYPE" valueKey="Property Type" />
                        <div className="font-bold text-center p-1">AMOUNT (GH&#8373;)</div>
                    </div>
                </div>

                <div className="flex">
                    <div className="w-[67%] border-r-2 border-black">
                        <div className="flex border-b-2 border-black h-[50px]">
                            <div className="w-1/3 font-bold flex items-center justify-center p-1">BILLING DETAILS</div>
                            <div className="w-1/3 border-x border-black p-1">
                                <div className="font-bold">RATEABLE VALUE</div>
                                <div className="flex justify-between items-end"><span>GH&#8373;</span><span>{formatAmount(rateableValue)}</span></div>
                            </div>
                            <div className="w-1/3 p-1">
                                <div className="font-bold">RATE IMPOST</div>
                                <div className="flex justify-end items-end h-full"><span>{formatValue('Rate Impost')}</span></div>
                            </div>
                        </div>
                        <BillRow label="AMOUNT CHARGED (Rateable Value * Rate Impost)" value={formatAmount(amountCharged)} />
                        <BillRow label="SANITATION CHARGED" value={formatAmount(sanitationCharged)} />
                        <BillRow label="UNASSESSED RATE" value="..." />
                        <BillRow label="TOTAL THIS YEAR" value={formatAmount(totalThisYear)} isBold />
                        <BillRow label="PREVIOUS BALANCE" value={formatAmount(previousBalance)} />
                        <BillRow label="TOTAL PAYMENT" value={formatAmount(totalPayment)} />
                        <div className="flex justify-between p-1 border-b border-black h-[30px] items-center font-bold bg-muted/60">
                            <span>TOTAL AMOUNT DUE</span>
                            <span className="text-right text-base">{formatAmount(totalAmountDue)}</span>
                        </div>
                    </div>
                    <div className="w-[33%] text-right font-bold">
                        <div className="border-b-2 border-black h-[50px] p-1 flex items-end justify-end">FINANCIAL DETAILS</div>
                        <div className="p-1 border-b border-black h-[24px]">{formatAmount(amountCharged)}</div>
                        <div className="p-1 border-b border-black h-[24px]">{formatAmount(sanitationCharged)}</div>
                        <div className="p-1 border-b border-black h-[24px]">...</div>
                        <div className="p-1 border-b border-black h-[24px]">{formatAmount(totalThisYear)}</div>
                        <div className="p-1 border-b border-black h-[24px]">{formatAmount(previousBalance)}</div>
                        <div className="p-1 border-b border-black h-[24px]">{formatAmount(totalPayment)}</div>
                        <div className="p-1 border-b border-black h-[30px] flex items-center justify-end bg-muted/60 text-base">{formatAmount(totalAmountDue)}</div>
                    </div>
                </div>
            </main>
            
            <footer className="mt-4">
              <div className="flex">
                  <div className="w-1/2">
                      {/* Intentionally blank, for spacing */}
                  </div>
                  <div className="w-1/2 text-center">
                      {settings.appearance?.signature && (
                          <div className="w-40 h-16 mx-auto flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={settings.appearance.signature} alt="Signature" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} data-ai-hint="signature" />
                          </div>
                      )}
                      <p className="border-t-2 border-black w-48 mx-auto mt-1 pt-1 font-bold">
                          CO-ORDINATING DIRECTOR
                      </p>
                  </div>
              </div>
              <div className="font-bold text-center mt-4">
                  {settings.appearance?.billWarningText || 'PAY AT ONCE OR FACE LEGAL ACTION'}
              </div>
            </footer>
          </div>
        </div>
      </div>
    );
  }
);
PrintableContent.displayName = 'PrintableContent';


export function BillDialog({ property, isOpen, onOpenChange }: BillDialogProps) {
  const [settings, setSettings] = useState<{general: GeneralSettings, appearance: AppearanceSettings}>({ general: {}, appearance: {} });
  const componentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        try {
            const savedGeneral = localStorage.getItem('generalSettings');
            const savedAppearance = localStorage.getItem('appearanceSettings');
            setSettings({
                general: savedGeneral ? JSON.parse(savedGeneral) : {},
                appearance: savedAppearance ? JSON.parse(savedAppearance) : {}
            });
        } catch (error) {
            console.error("Could not load settings from localStorage", error);
        }
    }
  }, [isOpen]);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  if (!property) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] p-0">
        <div className="max-h-[80vh] overflow-y-auto bg-muted">
          <div className="py-8">
            <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-lg">
              <PrintableContent ref={componentRef} property={property} settings={settings} />
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 bg-muted sm:justify-end border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print Bill
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
