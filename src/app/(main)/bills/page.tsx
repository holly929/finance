'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Calendar, Filter, BookCopy, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBillData } from '@/context/BillDataContext';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import type { Bill, Property } from '@/lib/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { BillDialog } from '@/components/bill-dialog';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROWS_PER_PAGE = 15;

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// A helper function to get property values using potential aliases, ensuring data displays correctly even with varied Excel headers.
const getNormalizedValue = (property: Property | null, stdKey: string): string => {
    if (!property) return '';

    const standardToPotentialKeys: Record<string, string[]> = {
        'Owner Name': ['Owner Name', 'Name of Owner', 'Rate Payer', 'ownername'],
        'Property No': ['Property No', 'Property Number', 'propertyno'],
    };

    const aliases = standardToPotentialKeys[stdKey];
    if (!aliases) {
        const value = property[stdKey];
        return value !== null && value !== undefined ? String(value) : '';
    }

    const propertyKeys = Object.keys(property);
    const normalizeKey = (str: string) => (str || '').toLowerCase().replace(/[\s._-]/g, '');

    // 1. Try matching aliases
    for (const alias of aliases) {
        const normalizedAlias = normalizeKey(alias);
        const foundKey = propertyKeys.find(pKey => normalizeKey(pKey) === normalizedAlias);
        if (foundKey && property[foundKey] !== undefined && property[foundKey] !== null) {
            return String(property[foundKey]);
        }
    }

    // 2. If no alias match, try token-based matching as a fallback
    const stdKeyTokens = stdKey.toLowerCase().match(/\w+/g) || [];
    if (stdKeyTokens.length > 0) {
         const foundKey = propertyKeys.find(pKey => {
             const pKeyLower = pKey.toLowerCase();
             return stdKeyTokens.every(token => pKeyLower.includes(token));
         });
         if (foundKey && property[foundKey] !== undefined && property[foundKey] !== null) {
             return String(property[foundKey]);
         }
    }

    return '';
};


export default function BillsPage() {
  useRequirePermission();
  const router = useRouter();
  const { bills, loading } = useBillData();
  const isMobile = useIsMobile();

  const [filterYear, setFilterYear] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewingBill, setViewingBill] = React.useState<Bill | null>(null);

  const availableYears = React.useMemo(() => {
    if (!bills) return [];
    const years = new Set(bills.map(b => b.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [bills]);

  const filteredData = React.useMemo(() => {
    if (!bills) return [];
    if (filterYear === 'all') return bills;
    return bills.filter(b => b.year === Number(filterYear));
  }, [bills, filterYear]);

  const sortedData = React.useMemo(() => {
    return [...filteredData].sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }, [filteredData]);

  const totalPages = Math.ceil(sortedData.length / ROWS_PER_PAGE);

  const paginatedData = React.useMemo(() => {
    return sortedData.slice(
      (currentPage - 1) * ROWS_PER_PAGE,
      currentPage * ROWS_PER_PAGE
    );
  }, [sortedData, currentPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterYear]);
  
  const handleViewBill = (bill: Bill) => {
    setViewingBill(bill);
  };
  
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (bills.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[calc(100vh-20rem)]">
        <BookCopy className="h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Bills Generated Yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Go to the <Button variant="link" onClick={() => router.push('/billing')} className="p-0 h-auto">Billing</Button> page, select properties, and print to generate bills.
        </p>
      </div>
    );
  }

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Property No.</TableHead>
          <TableHead>Owner Name</TableHead>
          <TableHead>Date Generated</TableHead>
          <TableHead>Year</TableHead>
          <TableHead className="text-right">Amount Due</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {paginatedData.length > 0 ? paginatedData.map(bill => (
          <TableRow key={bill.id}>
            <TableCell className="font-medium">{getNormalizedValue(bill.propertySnapshot, 'Property No')}</TableCell>
            <TableCell>{getNormalizedValue(bill.propertySnapshot, 'Owner Name')}</TableCell>
            <TableCell>{formatDate(bill.generatedAt)}</TableCell>
            <TableCell><Badge variant="outline">{bill.year}</Badge></TableCell>
            <TableCell className="text-right font-mono">{formatCurrency(bill.totalAmountDue)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => handleViewBill(bill)}>
                <Eye className="h-4 w-4" />
                <span className="sr-only">View Bill</span>
              </Button>
            </TableCell>
          </TableRow>
        )) : (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center">
              No results found for the selected year.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {paginatedData.length > 0 ? paginatedData.map(bill => (
        <Card key={bill.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base font-semibold">{getNormalizedValue(bill.propertySnapshot, 'Owner Name')}</CardTitle>
                <CardDescription>Property No: {getNormalizedValue(bill.propertySnapshot, 'Property No')}</CardDescription>
              </div>
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 -mt-2">
                      <MoreHorizontal className="h-4 w-4"/>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => handleViewBill(bill)}>
                      <Eye className="mr-2 h-4 w-4" /> View Bill
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
             <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold">Date Generated</span>
                <span>{formatDate(bill.generatedAt)}</span>
            </div>
             <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span className="font-semibold">Bill Year</span>
                 <Badge variant="outline">{bill.year}</Badge>
            </div>
            <div className="flex justify-between items-center pt-2 border-t mt-2">
                <span className="font-semibold">Amount Due</span>
                <span className="font-bold text-base text-foreground">{formatCurrency(bill.totalAmountDue)}</span>
            </div>
          </CardContent>
        </Card>
      )) : (
        <div className="text-center text-muted-foreground py-12">
          <p>No results found for the selected year.</p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Generated Bills</h1>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by year..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bill History</CardTitle>
          <CardDescription>
            A log of all bills that have been printed from the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isMobile ? renderMobileView() : renderDesktopView()}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages} ({sortedData.length} total bills)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      <BillDialog
        isOpen={!!viewingBill}
        onOpenChange={(isOpen) => !isOpen && setViewingBill(null)}
        property={viewingBill?.propertySnapshot || null}
      />
    </>
  );
}
