
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Property } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getPropertyValue } from '@/lib/property-utils';

interface EditPropertyDialogProps {
  property: Property | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onPropertyUpdate: (property: Property) => void;
}

const propertyFormSchema = z.object({
  'Owner Name': z.string().min(3, 'Owner name must be at least 3 characters.'),
  'Phone Number': z.string().optional(),
  'Town': z.string().min(2, 'Town name is required.'),
  'Suburb': z.string().optional(),
  'Property No': z.string().min(1, 'Property No. is required.'),
  'Valuation List No.': z.string().optional(),
  'Account Number': z.string().optional(),
  'Property Type': z.enum(['Residential', 'Commercial', 'Industrial']),
  'Rateable Value': z.coerce.number().positive('Rateable Value must be a positive number.'),
  'Rate Impost': z.coerce.number().positive('Rate Impost must be a positive number.'),
  'Sanitation Charged': z.coerce.number().min(0).default(0),
  'Previous Balance': z.coerce.number().min(0).default(0),
  'Total Payment': z.coerce.number().min(0).default(0),
});

export function EditPropertyDialog({
  property,
  isOpen,
  onOpenChange,
  onPropertyUpdate,
}: EditPropertyDialogProps) {
  
  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
        'Owner Name': '',
        'Phone Number': '',
        'Town': '',
        'Suburb': '',
        'Property No': '',
        'Valuation List No.': '',
        'Account Number': '',
        'Property Type': 'Residential',
        'Rateable Value': 0,
        'Rate Impost': 0,
        'Sanitation Charged': 0,
        'Previous Balance': 0,
        'Total Payment': 0,
    }
  });

  useEffect(() => {
    if (property && isOpen) {
       const normalizedData = {
        'Owner Name': getPropertyValue(property, 'Owner Name'),
        'Phone Number': getPropertyValue(property, 'Phone Number'),
        'Town': getPropertyValue(property, 'Town'),
        'Suburb': getPropertyValue(property, 'Suburb'),
        'Property No': getPropertyValue(property, 'Property No'),
        'Valuation List No.': getPropertyValue(property, 'Valuation List No.'),
        'Account Number': getPropertyValue(property, 'Account Number'),
        'Property Type': getPropertyValue(property, 'Property Type'),
        'Rateable Value': getPropertyValue(property, 'Rateable Value'),
        'Rate Impost': getPropertyValue(property, 'Rate Impost'),
        'Sanitation Charged': getPropertyValue(property, 'Sanitation Charged'),
        'Previous Balance': getPropertyValue(property, 'Previous Balance'),
        'Total Payment': getPropertyValue(property, 'Total Payment'),
      };
      
      const finalData: Record<string, any> = {};
      for (const key in normalizedData) {
        const value = (normalizedData as any)[key];
        if (value !== undefined) {
            finalData[key] = value;
        }
      }

      form.reset(finalData);
    }
  }, [property, isOpen, form]);

  function onSubmit(data: z.infer<typeof propertyFormSchema>) {
    if (property) {
      onPropertyUpdate({ ...property, ...data });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Property</DialogTitle>
          <DialogDescription>
            Make changes to the property details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="Owner Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner's Full Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Ama Serwaa" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Property No" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Number</FormLabel>
                          <FormControl><Input placeholder="e.g. AB604" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField control={form.control} name="Town" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="Suburb" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suburb</FormLabel>
                          <FormControl><Input placeholder="e.g. Christian Qtrs" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="Property Type" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Property Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select property type" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Residential">Residential</SelectItem>
                                <SelectItem value="Commercial">Commercial</SelectItem>
                                <SelectItem value="Industrial">Industrial</SelectItem>
                            </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                        )} 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Valuation List No." render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valuation List No.</FormLabel>
                            <FormControl><Input placeholder="e.g. 604" {...field} value={field.value ?? ''}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField control={form.control} name="Account Number" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl><Input placeholder="e.g. 123456789" {...field} value={field.value ?? ''}/></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium">Billing Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        <FormField control={form.control} name="Rateable Value" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rateable Value (GHS)</FormLabel>
                                <FormControl><Input type="number" step="10" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="Rate Impost" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Rate Impost</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="Sanitation Charged" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sanitation Charged (GHS)</FormLabel>
                                <FormControl><Input type="number" step="1" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="Previous Balance" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Previous Balance (GHS)</FormLabel>
                                <FormControl><Input type="number" step="1" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="Total Payment" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Total Payment (GHS)</FormLabel>
                                <FormControl><Input type="number" step="1" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                  </div>
                </div>
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
      </DialogContent>
    </Dialog>
  );
}
