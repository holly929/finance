
'use client';

import * as React from 'react';
import { DollarSign, Home, TrendingUp, AlertCircle, Loader2, BarChart2 } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Pie, PieChart, Cell } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ChartContainer, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import type { Property, PaymentStatusData, RevenueByPropertyType } from '@/lib/types';
import { usePropertyData } from '@/context/PropertyDataContext';

const formatCurrency = (value: number) => `GHS ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const chartConfig: ChartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--primary))",
  },
  paid: {
    label: "Paid",
    color: "hsl(var(--primary))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--accent))",
  },
  overdue: {
    label: "Overdue",
    color: "hsl(var(--destructive))",
  },
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
  const [propertiesBilled, setPropertiesBilled] = React.useState(0);
  const [collectionRate, setCollectionRate] = React.useState(0);
  const [totalOutstanding, setTotalOutstanding] = React.useState(0);
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatusData[]>([]);
  const [revenueByPropertyType, setRevenueByPropertyType] = React.useState<RevenueByPropertyType[]>([]);


  React.useEffect(() => {
    if (properties.length > 0) {
        setPropertiesBilled(properties.length);

        let calculatedTotalRevenue = 0;
        let calculatedTotalBilled = 0;
        let calculatedTotalOutstanding = 0;
        
        let amountPending = 0;
        let amountOverdue = 0;

        const revenueData: { [key: string]: number } = { Residential: 0, Commercial: 0, Industrial: 0, Other: 0 };

        properties.forEach(p => {
            const rateableValue = Number(p['Rateable Value']) || 0;
            const rateImpost = Number(p['Rate Impost']) || 0;
            const sanitation = Number(p['Sanitation Charged']) || 0;
            const previousBalance = Number(p['Previous Balance']) || 0;
            const payment = Number(p['Total Payment']) || 0;
            
            const grandTotalDue = (rateableValue * rateImpost) + sanitation + previousBalance;

            calculatedTotalRevenue += payment;
            
            const type = p['Property Type'];
            if (type === 'Residential' || type === 'Commercial' || type === 'Industrial') {
                revenueData[type] += payment;
            } else if (type) {
                revenueData['Other'] += payment;
            }

            if (grandTotalDue > 0) {
              calculatedTotalBilled += grandTotalDue;
              const outstanding = grandTotalDue - payment;
              
              if (outstanding > 0) {
                  calculatedTotalOutstanding += outstanding;
                  
                  if (payment > 0) { // Pending
                      amountPending += outstanding;
                  } else { // Overdue
                      amountOverdue += outstanding;
                  }
              }
            }
        });
        
        setTotalRevenue(calculatedTotalRevenue);
        setTotalOutstanding(calculatedTotalOutstanding);
        
        if (calculatedTotalBilled > 0) {
            setCollectionRate((calculatedTotalRevenue / calculatedTotalBilled) * 100);
        } else {
            setCollectionRate(0);
        }

        const newPaymentStatus: PaymentStatusData[] = [
          { name: 'Paid', value: calculatedTotalRevenue, fill: 'hsl(var(--primary))' },
          { name: 'Pending', value: amountPending, fill: 'hsl(var(--accent))' },
          { name: 'Overdue', value: amountOverdue, fill: 'hsl(var(--destructive))' },
        ];

        setPaymentStatus(newPaymentStatus.filter(d => d.value > 0.01));
        
        setRevenueByPropertyType([
            { name: 'Residential', revenue: revenueData.Residential },
            { name: 'Commercial', revenue: revenueData.Commercial },
            { name: 'Industrial', revenue: revenueData.Industrial },
            { name: 'Other', revenue: revenueData.Other },
        ].filter(d => d.revenue > 0));
    } else {
        setTotalRevenue(0);
        setPropertiesBilled(0);
        setCollectionRate(0);
        setTotalOutstanding(0);
        setPaymentStatus([]);
        setRevenueByPropertyType([]);
    }
  }, [properties]);
  
  if (loading) {
    return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    );
  }

  const hasData = properties.length > 0;
  
  const totalRevenueByType = React.useMemo(() => {
    if (!revenueByPropertyType) return 0;
    return revenueByPropertyType.reduce((acc, curr) => acc + curr.revenue, 0);
  }, [revenueByPropertyType]);

  const totalFinancialStatus = React.useMemo(() => {
    if (!paymentStatus) return 0;
    return paymentStatus.reduce((acc, curr) => acc + curr.value, 0);
  }, [paymentStatus]);


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
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Of total amount billed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties in System</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propertiesBilled.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total properties imported</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
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
                        <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
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
          {hasData && revenueByPropertyType.length > 0 && (
            <CardFooter className="border-t pt-4">
                <div className="flex w-full items-start gap-2 text-sm">
                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 font-medium leading-none">
                            Total revenue shown in chart: {formatCurrency(totalRevenueByType)}
                        </div>
                    </div>
                </div>
            </CardFooter>
          )}
        </Card>
        <Card className="col-span-4 lg:col-span-3">
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
                        Total amount represented: {formatCurrency(totalFinancialStatus)}
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
