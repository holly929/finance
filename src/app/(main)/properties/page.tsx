
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  FileUp,
  MoreHorizontal,
  PlusCircle,
  Trash2,
  View,
  Loader2,
  UploadCloud,
  FilePenLine,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Property } from '@/lib/types';
import { EditPropertyDialog } from '@/components/edit-property-dialog';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePropertyData } from '@/context/PropertyDataContext';
import { useAuth } from '@/context/AuthContext';
import { getPropertyValue } from '@/lib/property-utils';

const ROWS_PER_PAGE = 15;

export default function PropertiesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { user: authUser } = useAuth();
  const isViewer = authUser?.role === 'Viewer';

  const { properties, headers, setProperties, deleteProperty, updateProperty, loading, deleteAllProperties } = usePropertyData();
  
  const [filter, setFilter] = React.useState('');
  const [editingProperty, setEditingProperty] = React.useState<Property | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const isMobile = useIsMobile();

  const [isImporting, setIsImporting] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const filteredData = React.useMemo(() => {
    if (!filter) return properties;
    return properties.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [properties, filter]);
  
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);

  const paginatedData = React.useMemo(() => {
    return filteredData.slice(
      (currentPage - 1) * ROWS_PER_PAGE,
      currentPage * ROWS_PER_PAGE
    );
  }, [filteredData, currentPage]);
  
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);


  const handleViewBill = (property: Property) => {
    localStorage.setItem('selectedPropertiesForPrinting', JSON.stringify([property]));
    router.push('/properties/print-preview');
  };

  const handleFile = (file: File | undefined) => {
    if (isImporting) return;
    if (!file) {
      toast({ variant: 'destructive', title: 'File Error', description: 'No file selected.' });
      return;
    }
     if (!file.type.match(/spreadsheetml\.sheet|excel|sheet$/) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload an Excel file (.xlsx, .xls).' });
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        
        if (!jsonData || jsonData.length < 2) {
          throw new Error("Spreadsheet is empty or has only headers.");
        }

        const headerRow = jsonData[0] as any[];
        const newHeaders = headerRow.map(h => String(h || ''));

        const dataRows = (jsonData.slice(1) as any[][]).filter(row => row.some(cell => cell !== ''));

        if (dataRows.length === 0) {
            throw new Error("No data rows found in the spreadsheet.");
        }

        const newData: Property[] = dataRows.map((row, rowIndex) => {
            const rowData: Property = { id: `imported-${Date.now()}-${rowIndex}` };
            newHeaders.forEach((header, index) => {
                rowData[header] = row[index];
            });
            return rowData;
        });

        setProperties(newData, newHeaders);
        setCurrentPage(1);
        toast({ title: 'Import Successful', description: `${newData.length} records have been loaded.` });

      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Import Error', description: error.message || 'Failed to parse the Excel file.' });
      } finally {
        setIsImporting(false);
      }
    };
    reader.onerror = () => {
        toast({ variant: 'destructive', title: 'File Read Error', description: 'Could not read the selected file.' });
        setIsImporting(false);
    }
    reader.readAsBinaryString(file);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files?.[0]);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleAddProperty = () => {
    router.push('/properties/new');
  };
  
  const handleDeleteRow = (id: string) => {
    deleteProperty(id);
    toast({ title: 'Property Deleted', description: `Property has been removed.` });
  }

  const handlePropertyUpdate = (updatedProperty: Property) => {
    updateProperty(updatedProperty);
    setEditingProperty(null);
    toast({ title: 'Property Updated', description: 'The property has been successfully updated.' });
  };

  const handleClearAll = () => {
    deleteAllProperties();
    toast({
        title: 'All Properties Deleted',
        description: 'Your property data has been cleared.',
    });
  };

  const renderDesktopView = () => (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header}>{header}</TableHead>
            ))}
            {!isViewer && <TableHead><span className="sr-only">Actions</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length > 0 ? (
            paginatedData.map((row) => (
              <TableRow key={row.id}>
                {headers.map((header, cellIndex) => (
                  <TableCell key={cellIndex} className={cellIndex === 0 ? 'font-medium' : ''}>
                    {getPropertyValue(row, header)}
                  </TableCell>
                ))}
                {!isViewer && 
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {getPropertyValue(row, 'Owner Name') && getPropertyValue(row, 'Rateable Value') ? (
                          <DropdownMenuItem onSelect={() => handleViewBill(row)}>
                            <View className="mr-2 h-4 w-4" />
                            View Bill
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onSelect={() => setEditingProperty(row)}>
                          <FilePenLine className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onSelect={() => handleDeleteRow(row.id)} className="text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                }
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length + (isViewer ? 0 : 1)} className="h-24 text-center">
                No results found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderMobileView = () => (
    <div className="space-y-4">
      {paginatedData.length > 0 ? paginatedData.map(row => (
        <Card key={row.id} className="transition-shadow hover:shadow-lg">
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <CardTitle className="text-base font-semibold">{getPropertyValue(row, headers[0]) || 'N/A'}</CardTitle>
            {!isViewer && 
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" className="h-8 w-8 -mt-2">
                    <MoreHorizontal className="h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  {getPropertyValue(row, 'Owner Name') && getPropertyValue(row, 'Rateable Value') ? (
                    <DropdownMenuItem onSelect={() => handleViewBill(row)}>
                      <View className="mr-2 h-4 w-4" /> View Bill
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuItem onSelect={() => setEditingProperty(row)}>
                      <FilePenLine className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator/>
                  <DropdownMenuItem onSelect={() => handleDeleteRow(row.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          </CardHeader>
          <CardContent className="space-y-2 text-sm pl-6 pr-6 pb-4">
            {headers.slice(1).map(header => {
              const value = getPropertyValue(row, header);
              if (header.toLowerCase() === 'id' || !value) return null;
              return (
                <div key={header} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground">{header}</span>
                  <span className="text-right">{String(value)}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )) : (
        <div className="text-center text-muted-foreground py-12">
          <p>No results found.</p>
        </div>
      )}
    </div>
  );

  const renderDataView = () => (
    <div 
        className="relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {(isDragging || isImporting) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
            {isImporting ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
                <p className="text-lg font-medium text-foreground">Importing data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we process your file.</p>
              </>
            ) : (
              <>
                <UploadCloud className="h-12 w-12 text-primary mb-4"/>
                <p className="text-lg font-medium text-foreground">Drop your Excel file here</p>
              </>
            )}
          </div>
        )}
        <Card>
            <CardHeader>
            <CardTitle className="font-headline">Manage Properties</CardTitle>
            <CardDescription>
                View, edit, or delete your {properties.length} imported properties.
            </CardDescription>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
                <Input
                  placeholder="Filter data..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="max-w-full sm:max-w-sm"
                />
            </div>
            </CardHeader>
            <CardContent>
            {loading ? (
                <div className="h-96 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (isMobile ? renderMobileView() : renderDesktopView())}
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages} ({filteredData.length} total properties)
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
    </div>
  )

  const renderEmptyState = () => (
     <div 
        className="relative"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEvents}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {(isDragging || isImporting) && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg border-2 border-dashed border-primary">
            {isImporting ? (
                <>
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4"/>
                <p className="text-lg font-medium text-foreground">Importing data...</p>
                <p className="text-sm text-muted-foreground">Please wait while we process your file.</p>
                </>
            ) : (
                <>
                <UploadCloud className="h-12 w-12 text-primary mb-4"/>
                <p className="text-lg font-medium text-foreground">Drop your Excel file here</p>
                </>
            )}
            </div>
        )}
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[calc(100vh-20rem)]">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Import Your Property Data</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop an Excel file here or use the import button to get started.
            </p>
        </div>
     </div>
  )

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".xlsx, .xls"
        disabled={isImporting}
      />
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Properties</h1>
        {!isViewer && 
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              {properties.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete All
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete all {properties.length} properties from the system.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAll}>
                            Yes, delete all
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin"/> : <FileUp className="h-4 w-4 mr-2" />}
                Import
              </Button>
              <Button size="sm" onClick={handleAddProperty}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Property
              </Button>
          </div>
        }
      </div>
      
      {loading ? (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : properties.length > 0 ? renderDataView() : renderEmptyState()}

      <EditPropertyDialog 
        property={editingProperty}
        isOpen={!!editingProperty}
        onOpenChange={(isOpen) => !isOpen && setEditingProperty(null)}
        onPropertyUpdate={handlePropertyUpdate}
      />
    </>
  );
}
