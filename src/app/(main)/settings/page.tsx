'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { usePropertyData } from '@/context/PropertyDataContext';
import { Checkbox } from '@/components/ui/checkbox';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { PERMISSION_PAGES, usePermissions, UserRole, PermissionPage } from '@/context/PermissionsContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Property } from '@/lib/types';
import { PrintableContent } from '@/components/bill-dialog';

const generalFormSchema = z.object({
  systemName: z.string().min(3, 'System name must be at least 3 characters.'),
  assemblyName: z.string().min(3, 'Assembly name must be at least 3 characters.'),
  postalAddress: z.string().min(5, 'Postal address seems too short.'),
  contactPhone: z.string().min(10, 'Phone number seems too short.'),
  contactEmail: z.string().email(),
});

const billingFormSchema = z.object({
  residentialRate: z.coerce.number().positive(),
  commercialRate: z.coerce.number().positive(),
  industrialRate: z.coerce.number().positive(),
  billingCycle: z.enum(['monthly', 'quarterly', 'annually']),
  penaltyRate: z.coerce.number().min(0).max(100),
});

const appearanceFormSchema = z.object({
  assemblyLogo: z.any().optional(),
  ghanaLogo: z.any().optional(),
  signature: z.any().optional(),
  billWarningText: z.string().max(200).optional(),
  fontFamily: z.enum(['sans', 'serif', 'mono']).default('sans'),
  fontSize: z.coerce.number().min(8).max(14).default(12),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a valid hex color code, e.g., #F1F5F9").default('#F1F5F9'),
});

type AppearanceSettings = {
    assemblyLogo: string;
    ghanaLogo: string;
    signature: string;
    billWarningText: string;
    fontFamily: 'sans' | 'serif' | 'mono';
    fontSize: number;
    accentColor: string;
};

const ImageUploadPreview = ({ src, alt, dataAiHint }: { src: string | null, alt: string, dataAiHint?: string }) => {
    if (!src) return null;
    return (
        <div className="mt-2 relative aspect-video w-full max-w-[200px] overflow-hidden rounded-md border bg-muted/50 flex items-center justify-center">
             <Image src={src} alt={alt} fill className="object-contain p-2" data-ai-hint={dataAiHint} />
        </div>
    )
}

const permissionPageLabels: Record<PermissionPage, string> = {
  'dashboard': 'Dashboard',
  'properties': 'Properties',
  'billing': 'Billing',
  'bills': 'Bills',
  'reports': 'Reports',
  'users': 'User Management',
  'settings': 'Settings',
  'integrations': 'Integrations'
};

const mockPropertyForPreview: Property = {
  id: 'preview-123',
  'Owner Name': 'John Preview Doe',
  'Phone Number': '024 123 4567',
  'Town': 'Settingsville',
  'Suburb': 'Preview Estates',
  'Property No': 'PV-001',
  'Valuation List No.': 'VLN-999',
  'Account Number': '1234567890',
  'Property Type': 'Residential',
  'Rateable Value': 5000,
  'Rate Impost': 0.05,
  'Sanitation Charged': 50,
  'Previous Balance': 200,
  'Total Payment': 100,
};


export default function SettingsPage() {
  useRequirePermission();
  const { headers } = usePropertyData();
  const { permissions, updatePermissions, loading: permissionsLoading } = usePermissions();

  const [generalSettings, setGeneralSettings] = useState<any | null>(null);
  const [appearanceSettings, setAppearanceSettings] = useState<Partial<AppearanceSettings>>({});
  const [billFields, setBillFields] = useState<Record<string, boolean>>({});
  const [localPermissions, setLocalPermissions] = useState(permissions);

  useEffect(() => {
    setLocalPermissions(permissions);
  }, [permissions]);

  useEffect(() => {
    try {
      const savedGeneral = localStorage.getItem('generalSettings');
      if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));

      const savedAppearance = localStorage.getItem('appearanceSettings');
      if (savedAppearance) setAppearanceSettings(JSON.parse(savedAppearance));
      
      const savedBillFields = localStorage.getItem('billDisplaySettings');
       if (savedBillFields) {
        setBillFields(JSON.parse(savedBillFields));
      } else if (headers.length > 0) {
        const initialFields = headers.reduce((acc, header) => {
          if (header.toLowerCase() !== 'id') acc[header] = true;
          return acc;
        }, {} as Record<string, boolean>);
        setBillFields(initialFields);
      }

    } catch (error) {
        console.error("Could not load settings from localStorage", error)
    }
  }, [headers]);

  const generalForm = useForm<z.infer<typeof generalFormSchema>>({
    resolver: zodResolver(generalFormSchema),
    defaultValues: {
      systemName: 'RateEase',
      assemblyName: 'Ayawaso West Municipal Assembly',
      postalAddress: 'P.O. Box 11, Abetifi',
      contactPhone: '0303-966-180',
      contactEmail: 'info@awma.gov.gh',
    },
  });

  const billingForm = useForm<z.infer<typeof billingFormSchema>>({
    resolver: zodResolver(billingFormSchema),
    defaultValues: {
      residentialRate: 0.5,
      commercialRate: 1.2,
      industrialRate: 2.0,
      billingCycle: 'quarterly',
      penaltyRate: 5,
    },
  });

  const appearanceForm = useForm<z.infer<typeof appearanceFormSchema>>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      billWarningText: 'PAY AT ONCE OR FACE LEGAL ACTION',
      fontFamily: 'sans',
      fontSize: 12,
      accentColor: '#F1F5F9',
    },
  });

  const watchedAppearanceForm = appearanceForm.watch();
  
  const settingsForPreview = {
    general: generalSettings,
    appearance: {
      ...appearanceSettings,
      billWarningText: watchedAppearanceForm.billWarningText,
      fontFamily: watchedAppearanceForm.fontFamily,
      fontSize: watchedAppearanceForm.fontSize,
      accentColor: watchedAppearanceForm.accentColor,
    },
  };
  
  useEffect(() => {
    if (generalSettings) generalForm.reset(generalSettings);
    if (appearanceSettings) {
        appearanceForm.reset({
            billWarningText: appearanceSettings.billWarningText,
            fontFamily: appearanceSettings.fontFamily || 'sans',
            fontSize: appearanceSettings.fontSize || 12,
            accentColor: appearanceSettings.accentColor || '#F1F5F9',
        });
    }
  }, [generalSettings, appearanceSettings, generalForm, appearanceForm]);

  function onGeneralSave(data: z.infer<typeof generalFormSchema>) {
    localStorage.setItem('generalSettings', JSON.stringify(data));
    setGeneralSettings(data);
    toast({
      title: 'Settings Saved',
      description: `Your general settings have been updated successfully.`,
    });
    window.location.reload();
  }
  
  function onBillingSave(data: z.infer<typeof billingFormSchema>) {
    localStorage.setItem('billingSettings', JSON.stringify(data));
    toast({
      title: 'Settings Saved',
      description: `Your billing settings have been updated successfully.`,
    });
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof AppearanceSettings) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppearanceSettings(prev => ({ ...prev, [fieldName]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleFieldToggle = (field: string) => {
    setBillFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const onAppearanceSave = (data: z.infer<typeof appearanceFormSchema>) => {
    const settingsToSave = {
        ...appearanceSettings,
        billWarningText: data.billWarningText,
        fontFamily: data.fontFamily,
        fontSize: data.fontSize,
        accentColor: data.accentColor,
    };
    localStorage.setItem('appearanceSettings', JSON.stringify(settingsToSave));
    localStorage.setItem('billDisplaySettings', JSON.stringify(billFields));
    toast({ title: 'Settings Saved', description: `Your appearance settings have been updated successfully.`});
  };

  const handlePermissionChange = (role: UserRole, page: string, checked: boolean) => {
    setLocalPermissions(prev => {
      const newPerms = JSON.parse(JSON.stringify(prev));
      if (newPerms[role]) {
        newPerms[role][page] = checked;
      }
      return newPerms;
    });
  };

  const onPermissionsSave = () => {
    updatePermissions(localPermissions);
  };

  const capitalize = (s: string) => {
      return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Settings</h1>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Form {...generalForm}>
            <form onSubmit={generalForm.handleSubmit(onGeneralSave)}>
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic information about your system and assembly.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <FormField control={generalForm.control} name="systemName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormDescription>The name of the application displayed in the header and on the login page.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={generalForm.control} name="assemblyName" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assembly Name</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={generalForm.control} name="postalAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postal Address</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField control={generalForm.control} name="contactPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={generalForm.control} name="contactEmail" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl><Input type="email" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="billing">
          <Form {...billingForm}>
            <form onSubmit={billingForm.handleSubmit(onBillingSave)}>
              <Card>
                <CardHeader>
                  <CardTitle>Billing & Rates</CardTitle>
                  <CardDescription>Configure tax rates, billing cycles, and penalties.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={billingForm.control} name="residentialRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Residential Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={billingForm.control} name="commercialRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Commercial Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                     <FormField control={billingForm.control} name="industrialRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industrial Rate (%)</FormLabel>
                        <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={billingForm.control} name="billingCycle" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Cycle</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a billing cycle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                     )} />
                    <FormField control={billingForm.control} name="penaltyRate" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Payment Penalty (%)</FormLabel>
                        <FormControl><Input type="number" step="1" {...field} /></FormControl>
                        <FormDescription>Penalty applied to overdue amounts.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save Changes</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="appearance">
          <Form {...appearanceForm}>
            <form onSubmit={appearanceForm.handleSubmit(onAppearanceSave)}>
              <Card>
                <CardHeader>
                  <CardTitle>Appearance & Branding</CardTitle>
                  <CardDescription>Customize the look and feel of printed bills and the login screen.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-8">
                      <FormField control={appearanceForm.control} name="assemblyLogo" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Assembly Logo</FormLabel>
                              <FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'assemblyLogo')} /></FormControl>
                              <FormDescription>Used on login screen and bills.</FormDescription>
                              <ImageUploadPreview src={appearanceSettings?.assemblyLogo || 'https://placehold.co/192x96.png'} alt="Assembly Logo Preview" dataAiHint="government logo" />
                          </FormItem>
                          )}
                      />
                      <FormField control={appearanceForm.control} name="ghanaLogo" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Ghana Coat of Arms</FormLabel>
                              <FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'ghanaLogo')} /></FormControl>
                              <FormDescription>Used on printed bills.</FormDescription>
                              <ImageUploadPreview src={appearanceSettings?.ghanaLogo || 'https://placehold.co/96x96.png'} alt="Ghana Logo Preview" dataAiHint="ghana coat arms" />
                          </FormItem>
                          )}
                      />
                      <FormField control={appearanceForm.control} name="signature" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Coordinating Director's Signature</FormLabel>
                              <FormControl><Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'signature')} /></FormControl>
                              <FormDescription>Used on printed bills.</FormDescription>
                              <ImageUploadPreview src={appearanceSettings?.signature || 'https://placehold.co/192x96.png'} alt="Signature Preview" dataAiHint="signature" />
                          </FormItem>
                          )}
                      />
                    </div>
                    <FormField control={appearanceForm.control} name="billWarningText" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bill Warning Text</FormLabel>
                          <FormControl><Textarea {...field} /></FormControl>
                          <FormDescription>This text will appear at the bottom of every bill.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium">Printing Styles</h3>
                      <p className="text-sm text-muted-foreground mt-1">Customize fonts and colors on the printed bill.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <FormField control={appearanceForm.control} name="fontFamily" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Font Family</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                      <SelectContent>
                                          <SelectItem value="sans">Sans-serif (Inter)</SelectItem>
                                          <SelectItem value="serif">Serif (Tinos)</SelectItem>
                                          <SelectItem value="mono">Monospace (Courier Prime)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </FormItem>
                          )} />
                          <FormField control={appearanceForm.control} name="fontSize" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Base Font Size (px)</FormLabel>
                                  <FormControl><Input type="number" min="8" max="14" {...field} /></FormControl>
                              </FormItem>
                          )} />
                      </div>
                      <div className="mt-4">
                          <FormField control={appearanceForm.control} name="accentColor" render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Accent Color</FormLabel>
                                  <div className="flex items-center gap-2">
                                      <FormControl><Input type="color" className="p-1 h-10 w-14" {...field} /></FormControl>
                                      <Input type="text" placeholder="#F1F5F9" {...field} />
                                  </div>
                                  <FormDescription>Used for highlighting rows like 'Total Amount Due'.</FormDescription>
                                  <FormMessage />
                              </FormItem>
                          )} />
                      </div>
                    </div>

                    <div className="border-t pt-6 mt-8">
                      <h3 className="text-lg font-medium">Bill Display Fields</h3>
                      <p className="text-sm text-muted-foreground mt-1">Select which fields to show on the printed bill.</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {Object.keys(billFields).map((field) => (
                          <FormItem key={field} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={billFields[field]}
                                onCheckedChange={() => handleFieldToggle(field)}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">{field}</FormLabel>
                          </FormItem>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden lg:block">
                    <FormLabel>Live Preview</FormLabel>
                    <div className="mt-2 w-full aspect-[210/297] bg-white shadow-lg rounded-lg border p-2 overflow-hidden sticky top-24">
                       <div className="scale-[0.55] origin-top-left -translate-x-4 -translate-y-4" style={{ width: '181%', height: '181%' }}>
                          <PrintableContent
                            property={mockPropertyForPreview}
                            settings={settingsForPreview}
                            displaySettings={billFields}
                            isCompact={false}
                          />
                       </div>
                    </div>
                    <FormDescription className="mt-2">
                        This is a live preview of how your printed bills will appear.
                    </FormDescription>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button type="submit">Save Appearance</Button>
                </CardFooter>
              </Card>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="permissions">
            <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                    <CardDescription>
                        Define which user roles can access each page. Admins always have full access.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!permissionsLoading && (
                        <div className="overflow-x-auto">
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page / Feature</TableHead>
                                        {Object.keys(localPermissions).map(role => (
                                            <TableHead key={role} className="text-center">{capitalize(role)}</TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {PERMISSION_PAGES.map(page => (
                                        <TableRow key={page}>
                                            <TableCell className="font-medium">{permissionPageLabels[page as PermissionPage]}</TableCell>
                                            {Object.keys(localPermissions).map(role => (
                                                <TableCell key={`${role}-${page}`} className="text-center">
                                                    <Checkbox
                                                        checked={localPermissions[role as UserRole]?.[page as keyof typeof localPermissions[UserRole]]}
                                                        onCheckedChange={(checked) => handlePermissionChange(role as UserRole, page, !!checked)}
                                                        disabled={role === 'Admin'}
                                                    />
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button onClick={onPermissionsSave}>Save Permissions</Button>
                </CardFooter>
            </Card>
        </TabsContent>

      </Tabs>
    </>
  );
}
