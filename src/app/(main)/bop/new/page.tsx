
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useBopData } from '@/context/BopDataContext';
import { useRequirePermission } from '@/hooks/useRequirePermission';

const bopFormSchema = z.object({
  'Business Name': z.string().min(3, 'Business name is required.'),
  'Owner Name': z.string().min(3, 'Owner name is required.'),
  'Phone Number': z.string().optional(),
  'Town': z.string().optional(),
  'Permit Fee': z.coerce.number().min(0, 'Permit fee must be a positive number.'),
  'Payment': z.coerce.number().min(0, 'Payment must be a positive number.'),
});


export default function NewBopPage() {
    useRequirePermission();
    const router = useRouter();
    const { addBop } = useBopData();

    const form = useForm<z.infer<typeof bopFormSchema>>({
        resolver: zodResolver(bopFormSchema),
        defaultValues: {
            'Business Name': '',
            'Owner Name': '',
            'Phone Number': '',
            'Town': '',
            'Permit Fee': 100,
            'Payment': 0,
        },
    });

    function onSubmit(data: z.infer<typeof bopFormSchema>) {
        try {
            addBop(data);
            toast({
                title: 'BOP Record Added',
                description: `The BOP record for ${data['Business Name']} has been successfully created.`,
            });
            router.push('/bop');
        } catch (error) {
            console.error('Failed to save new BOP record', error);
            toast({
                variant: 'destructive',
                title: 'Save Error',
                description: 'There was a problem saving the BOP record.',
            });
        }
    }

  return (
    <>
        <div className="flex items-center gap-4">
             <Button asChild variant="outline" size="sm">
                <Link href="/bop">
                    Back to BOP Data
                </Link>
             </Button>
            <h1 className="text-3xl font-bold tracking-tight font-headline">Add New BOP Record</h1>
        </div>
        <div className="max-w-4xl mx-auto">
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card>
                <CardHeader>
                  <CardTitle>New BOP Record Details</CardTitle>
                  <CardDescription>Fill in the form to register a new Business Operating Permit.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Business Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Adom Trading" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Owner Name" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Owner's Full Name</FormLabel>
                          <FormControl><Input placeholder="e.g. Yaw Mensah" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="Phone Number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl><Input placeholder="e.g. 0244123456" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="Town" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Town</FormLabel>
                          <FormControl><Input placeholder="e.g. Abetifi" {...field} /></FormControl>
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
                                <FormControl><Input type="number" step="10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="Payment" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Payment Made (GHS)</FormLabel>
                                <FormControl><Input type="number" step="10" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>
                  </div>
                  
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save BOP Record</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </div>
    </>
  );
}
