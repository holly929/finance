
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Loader2, Calendar, Filter, BookCopy, MoreHorizontal, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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
import { useToast } from '@/hooks/use-toast';
import { getPropertyValue } from '@/lib/property-utils';

const ROWS_PER_PAGE = 15;

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (isoString: string) => new Date(isoString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function BillsPage() {
  useRequirePermission();
  const router = useRouter();
  const { bills, loading } = useBillData();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [filterYear, setFilterYear] = React.useState('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewingBill, setViewingBill] = React.useState<Bill | null>(null);
  const [selectedRows, setSelectedRows] = React.useState<string[]>([]);

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
    setSelectedRows([]);
  }, [filterYear]);
  
  const handleViewBill = (bill: Bill) => {
    setViewingBill(bill);
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(filteredData.map(row => row.id));
    } else {
      setSelectedRows([]);
    }
  };
  
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handlePrintSelected = () => {
    if (selectedRows.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Bills Selected',
        description: 'Please select at least one bill to print.',
      });
      return;
    }
    const selectedBills = bills.filter(bill => selectedRows.includes(bill.id));
    const propertiesToPrint = selectedBills.map(bill => bill.propertySnapshot);
    localStorage.setItem('selectedPropertiesForPrinting', JSON.stringify(propertiesToPrint));
    router.push('/properties/print-preview');
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
  
  const isAllFilteredSelected = filteredData.length > 0 && selectedRows.length === filteredData.length;
  const isSomeRowsSelected = selectedRows.length > 0 && selectedRows.length < filteredData.length;

  const renderDesktopView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">
              <Checkbox
                checked={isAllFilteredSelected ? true : isSomeRowsSelected ? 'indeterminate' : false}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                aria-label="Select all rows"
              />
          </TableHead>
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
          <TableRow key={bill.id} data-state={selectedRows.includes(bill.id) ? "selected" : undefined}>
            <TableCell>
                  <Checkbox
                    checked={selectedRows.includes(bill.id)}
                    onCheckedChange={(checked) => handleSelectRow(bill.id, !!checked)}
                    aria-label={`Select row ${bill.id}`}
                  />
            </TableCell>
            <TableCell className="font-medium">{getPropertyValue(bill.propertySnapshot, 'Property No') || ''}</TableCell>
            <TableCell>{getPropertyValue(bill.propertySnapshot, 'Owner Name') || ''}</TableCell>
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
            <TableCell colSpan={7} className="h-24 text-center">
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
        <Card key={bill.id} data-state={selectedRows.includes(bill.id) ? "selected" : undefined} className="data-[state=selected]:bg-muted/50">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <Checkbox
                    checked={selectedRows.includes(bill.id)}
                    onCheckedChange={(checked) => handleSelectRow(bill.id, !!checked)}
                    aria-label={`Select row ${bill.id}`}
                  />
                <div>
                  <CardTitle className="text-base font-semibold">{getPropertyValue(bill.propertySnapshot, 'Owner Name') || ''}</CardTitle>
                  <CardDescription>Property No: {getPropertyValue(bill.propertySnapshot, 'Property No') || ''}</CardDescription>
                </div>
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
          <CardContent className="space-y-2 text-sm pl-16">
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedRows.length > 0 && (
            <Button onClick={handlePrintSelected} variant="outline" size="sm">
              <Printer className="mr-2 h-4 w-4" />
              Print Selected ({selectedRows.length})
            </Button>
          )}
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
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
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bill History</CardTitle>
          <CardDescription>
            A log of all bills that have been printed from the system. {selectedRows.length > 0 && `(${selectedRows.length} selected of ${sortedData.length})`}
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
