'use client';

import * as React from 'react';
import { Wand, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePropertyData } from '@/context/PropertyDataContext';
import { useRequirePermission } from '@/hooks/useRequirePermission';
import type { Property } from '@/lib/types';

type Action = 'total_revenue' | 'highest_arrears' | 'no_sanitation' | 'rate_increase';

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AiSuggesterPage() {
  useRequirePermission();
  const { properties, headers } = usePropertyData();

  const [selectedAction, setSelectedAction] = React.useState<Action | null>(null);
  const [result, setResult] = React.useState<any | null>(null);
  
  const propertyTypes = React.useMemo(() => {
    const types = new Set(properties.map(p => p['Property Type']).filter(Boolean));
    return Array.from(types) as string[];
  }, [properties]);
  
  const [propertyType, setPropertyType] = React.useState(propertyTypes.length > 0 ? propertyTypes[0] : '');
  const [increasePercentage, setIncreasePercentage] = React.useState(10);

  React.useEffect(() => {
    if (propertyTypes.length > 0 && !propertyType) {
      setPropertyType(propertyTypes[0]);
    }
  }, [propertyTypes, propertyType]);
  
  const handleActionChange = (value: string) => {
    setSelectedAction(value as Action);
    setResult(null);
  };

  const handleCalculate = () => {
    if (!selectedAction) return;

    switch (selectedAction) {
      case 'total_revenue':
        const totalPotential = properties.reduce((acc, p) => {
          const rateableValue = Number(p['Rateable Value']) || 0;
          const rateImpost = Number(p['Rate Impost']) || 0;
          const sanitation = Number(p['Sanitation Charged']) || 0;
          return acc + (rateableValue * rateImpost) + sanitation;
        }, 0);
        setResult({ total: totalPotential });
        break;

      case 'highest_arrears':
        const propertiesWithArrears = properties
          .map(p => ({ ...p, arrears: Number(p['Previous Balance']) || 0}))
          .filter(p => p.arrears > 0)
          .sort((a, b) => b.arrears - a.arrears)
          .slice(0, 10);
        setResult({ properties: propertiesWithArrears });
        break;

      case 'no_sanitation':
        const propertiesWithoutSanitation = properties.filter(p => (Number(p['Sanitation Charged']) || 0) === 0);
        setResult({ properties: propertiesWithoutSanitation });
        break;

      case 'rate_increase':
        const relevantProperties = properties.filter(p => p['Property Type'] === propertyType);
        const currentRevenue = relevantProperties.reduce((acc, p) => acc + (Number(p['Rateable Value']) || 0) * (Number(p['Rate Impost']) || 0), 0);
        const newRevenue = relevantProperties.reduce((acc, p) => acc + (Number(p['Rateable Value']) || 0) * (Number(p['Rate Impost']) || 0) * (1 + increasePercentage / 100), 0);
        setResult({
          propertyType,
          increasePercentage,
          currentRevenue,
          newRevenue,
          increaseAmount: newRevenue - currentRevenue,
          propertyCount: relevantProperties.length
        });
        break;
    }
  };
  
  const renderResult = () => {
    if (!result || !selectedAction) return null;

    switch (selectedAction) {
      case 'total_revenue':
        return (
          <>
            <CardTitle>Total Revenue Potential</CardTitle>
            <CardDescription>Based on all {properties.length} properties in the system.</CardDescription>
            <div className="text-4xl font-bold mt-4">{formatCurrency(result.total)}</div>
            <p className="text-sm text-muted-foreground">This is the total amount expected from Rate Impost + Sanitation charges annually.</p>
          </>
        );

      case 'highest_arrears':
        return (
          <>
            <CardTitle>Top 10 Properties with Highest Arrears</CardTitle>
            <CardDescription>These properties have the largest outstanding previous balances.</CardDescription>
            <div className="mt-4 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Property No</TableHead>
                    <TableHead className="text-right">Arrears Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.properties.map((p: Property & { arrears: number }) => (
                    <TableRow key={p.id}>
                      <TableCell>{p['Owner Name']}</TableCell>
                      <TableCell>{p['Property No']}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.arrears)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        );

      case 'no_sanitation':
        return (
          <>
            <CardTitle>Properties without Sanitation Charges</CardTitle>
            <CardDescription>Found {result.properties.length} properties where sanitation charge is zero.</CardDescription>
             <div className="mt-4 rounded-md border max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner Name</TableHead>
                    <TableHead>Property No</TableHead>
                    <TableHead>Property Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.properties.slice(0, 50).map((p: Property) => (
                    <TableRow key={p.id}>
                      <TableCell>{p['Owner Name']}</TableCell>
                      <TableCell>{p['Property No']}</TableCell>
                      <TableCell>{p['Property Type']}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {result.properties.length > 50 && <p className="p-4 text-sm text-muted-foreground">Showing first 50 results.</p>}
            </div>
          </>
        );

      case 'rate_increase':
        return (
          <>
            <CardTitle>Rate Increase Projection</CardTitle>
            <CardDescription>
              Modeling a {result.increasePercentage}% rate impost increase for {result.propertyCount} '{result.propertyType}' properties.
            </CardDescription>
            <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                <div>
                    <p className="text-sm text-muted-foreground">Current Annual Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.currentRevenue)}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Projected Annual Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(result.newRevenue)}</p>
                </div>
                <div className="col-span-2 mt-2">
                    <p className="text-sm text-muted-foreground">Potential Increase</p>
                    <p className="text-3xl font-bold text-primary">+{formatCurrency(result.increaseAmount)}</p>
                </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight font-headline">AI Suggester &amp; Calculator</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Select an Action</CardTitle>
              <CardDescription>Choose a calculation to perform on your property data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="action-select">Calculation Type</Label>
                <Select onValueChange={handleActionChange}>
                  <SelectTrigger id="action-select">
                    <SelectValue placeholder="Select a calculation..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_revenue">Calculate Total Revenue Potential</SelectItem>
                    <SelectItem value="highest_arrears">Identify Properties with Highest Arrears</SelectItem>
                    <SelectItem value="no_sanitation">Find Properties without Sanitation Charges</SelectItem>
                    <SelectItem value="rate_increase">Suggest Rate Increase Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedAction === 'rate_increase' && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-semibold text-sm">Rate Increase Options</h3>
                  <div>
                    <Label htmlFor="property-type-select">Property Type</Label>
                    <Select value={propertyType} onValueChange={setPropertyType} disabled={propertyTypes.length === 0}>
                      <SelectTrigger id="property-type-select">
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="increase-percentage">Increase Percentage (%)</Label>
                    <Input
                      id="increase-percentage"
                      type="number"
                      value={increasePercentage}
                      onChange={(e) => setIncreasePercentage(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}

              <Button onClick={handleCalculate} disabled={!selectedAction || (selectedAction === 'rate_increase' && !propertyType)} className="w-full">
                <Wand className="mr-2 h-4 w-4" />
                Analyze
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="min-h-[300px]">
            <CardHeader>
               <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                renderResult()
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <Wand className="mx-auto h-12 w-12" />
                  <p className="mt-4">Your calculation results will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
