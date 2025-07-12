
'use client';

import * as React from 'react';
import { DollarSign, Home, TrendingUp, AlertCircle, Loader2, BarChart2, Package, Coins } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell, Legend } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { Property, PaymentStatusData, RevenueByPropertyType } from '@/lib/types';
import { usePropertyData } from '@/context/PropertyDataContext';
import { getPropertyValue } from '@/lib/property-utils';
import { getBillStatus } from '@/lib/billing-utils';

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--primary))" },
  billed: { label: "Billed", color: "hsl(var(--muted-foreground))" },
  collected: { label: "Collected", color: "hsl(var(--primary))" },
  paid: { label: "Paid", color: "hsl(var(--primary))" },
  pending: { label: "Pending", color: "hsl(var(--accent))" },
  overdue: { label: "Overdue", color: "hsl(var(--destructive))" },
  properties: { label: "Properties" },
  residential: { label: "Residential", color: "hsl(var(--chart-1))" },
  commercial: { label: "Commercial", color: "hsl(var(--chart-2))" },
  industrial: { label: "Industrial", color: "hsl(var(--chart-3))" },
  other: { label: "Other", color: "hsl(var(--chart-4))" },
};

const EmptyState = ({ message }: { message: string }) => (
    <div className="h-[300px] flex flex-col items-center justify-center text-center">
        <BarChart2 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-medium">No Data to Display</p>
        <p className="text-muted-foreground text-sm">{message}</p>
    </div>
);


export default function DashboardPage() {
  const { properties, loading } = usePropertyData();

  const [totalRevenue, setTotalRevenue] = React.useState(0);
  const [totalBilled, setTotalBilled] = React.useState(0);
  const [collectionRate, setCollectionRate] = React.useState(0);
  const [totalOutstanding, setTotalOutstanding] = React.useState(0);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatusData[]>([]);
  const [revenueByPropertyType, setRevenueByPropertyType] = React.useState<RevenueByPropertyType[]>([]);
  const [propertyTypeCounts, setPropertyTypeCounts] = React.useState<any[]>([]);
  const [billedVsCollected, setBilledVsCollected] = React.useState<any[]>([]);

  React.useEffect(() => {
    if (properties.length > 0) {
        let calculatedTotalRevenue = 0;
        let calculatedTotalBilled = 0;
        let calculatedTotalOutstanding = 0;
        
        let amountPaid = 0;
        let amountPending = 0;
        let amountOverdue = 0;

        const revenueData: { [key: string]: number } = {};
        const propertyCounts: { [key: string]: number } = {};

        properties.forEach(p => {
            const rateableValue = Number(getPropertyValue(p, 'Rateable Value')) || 0;
            const rateImpost = Number(getPropertyValue(p, 'Rate Impost')) || 0;
            const sanitation = Number(getPropertyValue(p, 'Sanitation Charged')) || 0;
            const previousBalance = Number(getPropertyValue(p, 'Previous Balance')) || 0;
            const payment = Number(getPropertyValue(p, 'Total Payment')) || 0;
            
            const grandTotalDue = (rateableValue * rateImpost) + sanitation + previousBalance;
            calculatedTotalRevenue += payment;
            
            const type = getPropertyValue(p, 'Property Type') || 'Other';
            if (!revenueData[type]) revenueData[type] = 0;
            revenueData[type] += payment;

            if(!propertyCounts[type]) propertyCounts[type] = 0;
            propertyCounts[type]++;

            const billStatus = getBillStatus(p);
            const outstanding = grandTotalDue > payment ? grandTotalDue - payment : 0;
            
            if (grandTotalDue > 0) {
              calculatedTotalBilled += grandTotalDue;
              calculatedTotalOutstanding += outstanding;
              
              switch(billStatus) {
                case 'Paid':
                  amountPaid += grandTotalDue;
                  break;
                case 'Pending':
                  amountPending += outstanding;
                  amountPaid += payment;
                  break;
                case 'Overdue':
                  amountOverdue += outstanding;
                  break;
                default:
                  break;
              }
            }
        });
        
        setTotalRevenue(calculatedTotalRevenue);
        setTotalOutstanding(calculatedTotalOutstanding);
        setTotalBilled(calculatedTotalBilled);

        setBilledVsCollected([
          { name: 'Financials', billed: calculatedTotalBilled, collected: calculatedTotalRevenue }
        ]);
        
        setCollectionRate(calculatedTotalBilled > 0 ? (calculatedTotalRevenue / calculatedTotalBilled) * 100 : 0);

        setPaymentStatus([
          { name: 'Paid', value: amountPaid, fill: 'hsl(var(--primary))' },
          { name: 'Pending', value: amountPending, fill: 'hsl(var(--accent))' },
          { name: 'Overdue', value: amountOverdue, fill: 'hsl(var(--destructive))' },
        ].filter(d => d.value > 0.01));
        
        setRevenueByPropertyType(Object.entries(revenueData).map(([name, revenue]) => ({ name, revenue })).filter(d => d.revenue > 0));

        setPropertyTypeCounts(Object.entries(propertyCounts).map(([name, count]) => ({
            name,
            value: count,
            fill: `var(--color-${(name || 'other').toLowerCase().split(' ').join('')})`,
        })).filter(d => d.value > 0));

    } else {
        setTotalRevenue(0);
        setTotalBilled(0);
        setCollectionRate(0);
        setTotalOutstanding(0);
        setPaymentStatus([]);
        setRevenueByPropertyType([]);
        setPropertyTypeCounts([]);
        setBilledVsCollected([]);
    }
  }, [properties]);
  
  const totalFinancialStatus = React.useMemo(() => paymentStatus.reduce((acc, curr) => acc + curr.value, 0), [paymentStatus]);
  const totalPropertiesByType = React.useMemo(() => propertyTypeCounts.reduce((acc, curr) => acc + curr.value, 0), [propertyTypeCounts]);

  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  const hasData = properties.length > 0;

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Total payments received to date</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount Billed</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBilled)}</div>
            <p className="text-xs text-muted-foreground">Total value of all generated bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalOutstanding)}</div>
            <p className="text-xs text-muted-foreground">Total value of unpaid bills</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties in System</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{properties.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total properties imported</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Total Billed vs. Collected</CardTitle>
                <CardDescription>A comparison of the total amount billed versus what has been collected.</CardDescription>
            </CardHeader>
            <CardContent>
              {hasData && billedVsCollected.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart accessibilityLayer data={billedVsCollected} layout="vertical" barSize={32} barGap={8}>
                    <CartesianGrid horizontal={false} />
                    <XAxis type="number" dataKey="value" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip cursor={{ fill: "hsl(var(--muted))" }} content={<ChartTooltipContent hideLabel />} />
                    <Legend content={<ChartLegendContent />} />
                    <Bar dataKey="billed" name="Billed" fill="var(--color-billed)" radius={4} />
                    <Bar dataKey="collected" name="Collected" fill="var(--color-collected)" radius={4} />
                  </BarChart>
                </ChartContainer>
              ) : (
                <EmptyState message="Import data to see a billed vs. collected comparison."/>
              )}
            </CardContent>
            {hasData && collectionRate !== null && (
              <CardFooter className="border-t p-4">
                <div className="flex w-full items-center gap-2 text-sm">
                    <div className="flex items-center gap-2 font-medium leading-none">
                        <TrendingUp className="h-4 w-4 text-primary" /> Overall Collection Rate: {collectionRate.toFixed(1)}%
                    </div>
                </div>
              </CardFooter>
            )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Status</CardTitle>
            <CardDescription>Breakdown of total billed amount by payment status.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData && paymentStatus.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <Tooltip 
                        content={<ChartTooltipContent 
                            hideLabel 
                            formatter={(value, name) => (
                            <div className="flex min-w-[120px] items-center justify-between">
                                <span className="capitalize">{name}</span>
                                <span className="font-bold">{formatCurrency(value as number)}</span>
                            </div>
                            )}
                        />} 
                        />
                        <Pie data={paymentStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} strokeWidth={5}>
                        {paymentStatus.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                        </Pie>
                         <ChartLegend
                          content={<ChartLegendContent nameKey="name" />}
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{paddingTop: '20px'}}
                        />
                    </PieChart>
                </ChartContainer>
             ) : (
                <EmptyState message="Import property data to see financial status." />
            )}
          </CardContent>
           {hasData && paymentStatus.length > 0 && (
            <CardFooter className="border-t pt-4">
                 <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                        <Coins className="h-4 w-4 text-muted-foreground" /> Total amount represented: {formatCurrency(totalFinancialStatus)}
                        </div>
                    </div>
                </div>
            </CardFooter>
          )}
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Property Type</CardTitle>
            <CardDescription>Total revenue collected from different property types.</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {hasData && revenueByPropertyType.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <BarChart accessibilityLayer data={revenueByPropertyType}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis tickFormatter={(value) => `GHS ${Number(value) / 1000}k`} />
                        <Tooltip
                        cursor={false}
                        content={<ChartTooltipContent formatter={(value) => formatCurrency(value as number)} />}
                        />
                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={8} />
                    </BarChart>
                </ChartContainer>
            ) : (
                <EmptyState message="Import property data to see revenue breakdown." />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Property Type Distribution</CardTitle>
            <CardDescription>A breakdown of all properties in the system by their designated type.</CardDescription>
          </CardHeader>
          <CardContent>
            {hasData && propertyTypeCounts.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <PieChart>
                        <Tooltip 
                        content={<ChartTooltipContent 
                            hideLabel
                            formatter={(value, name) => `${value} ${name} Properties`}
                        />} 
                        />
                        <Pie data={propertyTypeCounts} dataKey="value" nameKey="name" innerRadius={0} outerRadius={100} paddingAngle={2} >
                        {propertyTypeCounts.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                        </Pie>
                        <ChartLegend
                          content={<ChartLegendContent nameKey="name" />}
                          verticalAlign="bottom"
                          align="center"
                          wrapperStyle={{paddingTop: '20px'}}
                        />
                    </PieChart>
                </ChartContainer>
             ) : (
                <EmptyState message="Import property data to see property distribution." />
            )}
          </CardContent>
            {hasData && totalPropertiesByType > 0 && (
            <CardFooter className="border-t pt-4">
                 <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            <Package className="h-4 w-4 text-muted-foreground" /> Total properties in chart: {totalPropertiesByType}
                        </div>
                    </div>
                </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}

    