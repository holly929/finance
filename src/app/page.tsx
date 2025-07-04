'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [systemName, setSystemName] = React.useState('RateEase');
  const [assemblyLogo, setAssemblyLogo] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('admin@rateease.gov');
  const [password, setPassword] = React.useState('password');

  React.useEffect(() => {
    try {
      const savedGeneral = localStorage.getItem('generalSettings');
      if (savedGeneral) {
        const settings = JSON.parse(savedGeneral);
        if (settings.systemName) {
          setSystemName(settings.systemName);
        }
      }
      const savedAppearance = localStorage.getItem('appearanceSettings');
      if (savedAppearance) {
        const settings = JSON.parse(savedAppearance);
        if (settings.assemblyLogo) {
          setAssemblyLogo(settings.assemblyLogo);
        }
      }
    } catch (error) {
      console.error("Could not load settings from localStorage", error);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const storedUsers = localStorage.getItem('userData');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];

      // Add default admin if no users are found in storage, to ensure login is always possible
      if (users.length === 0) {
          users.push({
            id: 'admin-001',
            name: 'Admin User',
            email: 'admin@rateease.gov',
            role: 'Admin',
            password: 'password',
          });
      }

      const foundUser = users.find(user => user.email === email);

      if (foundUser && foundUser.password === password) {
        localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
        toast({
          title: 'Login Successful',
          description: `Welcome back, ${foundUser.name}!`,
        });
        router.push('/dashboard');
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'Invalid email or password. Please try again.',
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: 'Could not process login. Please try again later.',
      });
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardHeader className="text-center p-6">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
               {assemblyLogo ? (
                <Image src={assemblyLogo} alt="Assembly Logo" width={64} height={64} className="object-contain" />
              ) : (
                <Landmark className="h-10 w-10" />
              )}
            </div>
            <CardTitle className="font-headline text-3xl">{systemName}</CardTitle>
            <CardDescription>District Assembly Revenue Mobilization</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-4">
              <Button type="submit" className="w-full" size="lg">
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Built for efficiency and transparency.
        </p>
      </div>
    </main>
  );
}
