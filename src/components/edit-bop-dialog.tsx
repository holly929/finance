
'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import type { Bop } from '@/lib/types';
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
import { getPropertyValue } from '@/lib/property-utils';

interface EditBopDialogProps {
  bop: Bop | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBopUpdate: (bop: Bop) => void;
}

const bopFormSchema = z.object({
  'Business Name': z.string().min(3, 'Business name is required.'),
  'Owner Name': z.string().min(3, 'Owner name is required.'),
  'Phone Number': z.string().optional(),
  'Town': z.string().optional(),
  'Permit Fee': z.coerce.number().min(0, 'Permit fee must be a positive number.'),
  'Payment': z.coerce.number().min(0, 'Payment must be a positive number.'),
});

export function EditBopDialog({
  bop,
  isOpen,
  onOpenChange,
  onBopUpdate,
}: EditBopDialogProps) {
  
  const form = useForm<z.infer<typeof bopFormSchema>>({
    resolver: zodResolver(bopFormSchema),
    defaultValues: {
        'Business Name': '',
        'Owner Name': '',
        'Phone Number': '',
        'Town': '',
        'Permit Fee': 0,
        'Payment': 0,
    }
  });

  useEffect(() => {
    if (bop && isOpen) {
       const normalizedData = {
        'Business Name': getPropertyValue(bop, 'Business Name'),
        'Owner Name': getPropertyValue(bop, 'Owner Name'),
        'Phone Number': getPropertyValue(bop, 'Phone Number'),
        'Town': getPropertyValue(bop, 'Town'),
        'Permit Fee': getPropertyValue(bop, 'Permit Fee'),
        'Payment': getPropertyValue(bop, 'Payment'),
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
  }, [bop, isOpen, form]);

  function onSubmit(data: z.infer<typeof bopFormSchema>) {
    if (bop) {
      onBopUpdate({ ...bop, ...data });
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit BOP Record</DialogTitle>
          <DialogDescription>
            Make changes to the business operating permit details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Business Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Ama's Ventures" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Owner Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner's Full Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Ama Serwaa" {...field} value={field.value ?? ''} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name="Town" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} value={field.value ?? ''}/></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-medium">Billing Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <FormField control={form.control} name="Permit Fee" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Permit Fee (GHS)</FormLabel>
                                <FormControl><Input type="number" step="10" {...field} value={field.value ?? ''}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="Payment" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment (GHS)</FormLabel>
                                <FormControl><Input type="number" step="10" {...field} value={field.value ?? ''}/></FormControl>
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
