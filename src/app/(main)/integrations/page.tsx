'use client';

import * as React from 'react';
import Link from 'next/link';
import { BookCopy, AlertCircle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


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


export default function BillsPage() {
  useRequirePermission();
  const [sheetUrl, setSheetUrl] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
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
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Bills</h1>
      </div>
      
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
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[calc(100vh-25rem)]">
              <BookCopy className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No Bills Spreadsheet Connected</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Please go to the <Button variant="link" asChild className="p-0 h-auto"><Link href="/settings">Settings</Link></Button> page to connect a Google Sheet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
