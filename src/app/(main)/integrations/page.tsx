'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookCopy, AlertCircle, MessageSquare } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const getEditableSheetUrl = (originalUrl: string): string => {
  if (!originalUrl) return '';
  const regex = /spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
  const match = originalUrl.match(regex);
  if (match && match[1]) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/edit?rm=minimal`;
  }
  return '';
};

const smsFormSchema = z.object({
  accountSid: z.string().min(1, 'Account SID is required.'),
  authToken: z.string().min(1, 'Auth Token is required.'),
  fromNumber: z.string().min(1, '"From" number is required.'),
  smsTemplate: z.string().min(10, 'SMS template must be at least 10 characters.'),
});

function GoogleSheetIntegration() {
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('integrationsSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.googleSheetUrl) {
          const editableUrl = getEditableSheetUrl(settings.googleSheetUrl);
          setSheetUrl(editableUrl);
        }
      }
    } catch (error) {
      console.error("Could not load integration settings", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bills Spreadsheet</CardTitle>
        <CardDescription>
          View and edit your connected bills spreadsheet directly within the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading settings...</p>
        ) : sheetUrl ? (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Having trouble editing?</AlertTitle>
              <AlertDescription>
                To view and edit the sheet, you must be logged into the correct Google account in this browser. If the sheet doesn't load, try opening it in a new tab first, then refresh this page.
              </AlertDescription>
            </Alert>
            <div className="aspect-video w-full rounded-lg border">
              <iframe
                src={sheetUrl}
                className="w-full h-full"
                frameBorder="0"
                title="Embedded Google Sheet"
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              >
                Loading...
              </iframe>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[calc(100vh-30rem)]">
            <BookCopy className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Bills Spreadsheet Connected</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Please go to the <Button variant="link" asChild className="p-0 h-auto"><Link href="/settings">Settings</Link></Button> page to connect a Google Sheet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SmsIntegration() {
  const [generalSettings, setGeneralSettings] = useState<{ assemblyName?: string }>({});

  const form = useForm<z.infer<typeof smsFormSchema>>({
    resolver: zodResolver(smsFormSchema),
    defaultValues: {
      accountSid: '',
      authToken: '',
      fromNumber: '',
      smsTemplate: '',
    },
  });

  useEffect(() => {
    try {
      const savedSms = localStorage.getItem('smsSettings');
      if (savedSms) form.reset(JSON.parse(savedSms));
      
      const savedGeneral = localStorage.getItem('generalSettings');
      if (savedGeneral) setGeneralSettings(JSON.parse(savedGeneral));
    } catch (error) {
      console.error("Could not load SMS settings", error);
    }
  }, [form]);
  
  const defaultTemplate = `Hello {{Owner Name}}, your property bill of GHS {{Amount Due}} for {{Property No}} is ready. Please pay promptly. - ${generalSettings.assemblyName || 'Your Assembly'}`;
  
  useEffect(() => {
    if(!form.getValues('smsTemplate')) {
      form.setValue('smsTemplate', defaultTemplate);
    }
  },[form, defaultTemplate])


  function onSmsSave(data: z.infer<typeof smsFormSchema>) {
    localStorage.setItem('smsSettings', JSON.stringify(data));
    toast({
      title: 'Settings Saved',
      description: `Your SMS settings have been updated successfully.`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSmsSave)}>
        <Card>
          <CardHeader>
            <CardTitle>SMS Notification Settings</CardTitle>
            <CardDescription>Configure your SMS provider to send bill notifications to customers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="destructive">
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>Disclaimer</AlertTitle>
                <AlertDescription>
                    This is a demo integration. No actual SMS messages will be sent. Standard messaging rates would apply in a real-world scenario.
                </AlertDescription>
            </Alert>
            <FormField control={form.control} name="accountSid" render={({ field }) => (
                <FormItem>
                  <FormLabel>Account SID</FormLabel>
                  <FormControl><Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" {...field} /></FormControl>
                  <FormDescription>Your Account SID from your SMS provider (e.g., Twilio).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="authToken" render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Token</FormLabel>
                  <FormControl><Input type="password" placeholder="••••••••••••••••••••" {...field} /></FormControl>
                  <FormDescription>Your Auth Token from your SMS provider.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="fromNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>From Number</FormLabel>
                  <FormControl><Input placeholder="+15017122661" {...field} /></FormControl>
                  <FormDescription>A valid phone number from your provider.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField control={form.control} name="smsTemplate" render={({ field }) => (
                <FormItem>
                  <FormLabel>SMS Message Template</FormLabel>
                  <FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl>
                   <FormDescription>
                    Customize the message sent to customers. Use placeholders like {"{{Owner Name}}"}, {"{{Property No}}"}, {"{{Amount Due}}"}, and {"{{AssemblyName}}"} to insert dynamic data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit">Save SMS Settings</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}

export default function IntegrationsPage() {
  useRequirePermission();

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Integrations</h1>
      </div>
      
      <Tabs defaultValue="sms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sms">SMS Notifications</TabsTrigger>
          <TabsTrigger value="sheets">Google Sheets</TabsTrigger>
        </TabsList>
        <TabsContent value="sms">
          <SmsIntegration />
        </TabsContent>
        <TabsContent value="sheets">
          <GoogleSheetIntegration />
        </TabsContent>
      </Tabs>
    </>
  );
}
