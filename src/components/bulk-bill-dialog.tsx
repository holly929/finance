'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Property } from '@/lib/types';
import { PrintableContent } from './bill-dialog';
import { Printer } from 'lucide-react';

interface BulkBillDialogProps {
  properties: Property[];
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

const BulkPrintableContent = React.forwardRef<HTMLDivElement, { properties: Property[], settings: any }>(
  ({ properties, settings }, ref) => (
    <div ref={ref}>
      {properties.map((property, index) => (
        <div key={property.id} className="print-page-break">
          <PrintableContent property={property} settings={settings} />
          {index < properties.length - 1 && <Separator className="my-4 border-dashed" />}
        </div>
      ))}
    </div>
  )
);
BulkPrintableContent.displayName = 'BulkPrintableContent';

export function BulkBillDialog({ properties, isOpen, onOpenChange }: BulkBillDialogProps) {
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
    pageStyle: `@media print { .print-page-break { page-break-after: always; } }`
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Bill Preview ({properties.length} selected)</DialogTitle>
          <DialogDescription>
            Review the selected bills below. Click "Print All Bills" to print them.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-6">
            <BulkPrintableContent ref={componentRef} properties={properties} settings={settings} />
          </ScrollArea>
        </div>
        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handlePrint} disabled={properties.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print All Bills
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
