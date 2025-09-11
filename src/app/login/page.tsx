
'use client';

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { inMemorySettings } from '@/lib/settings';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { login, loading: authLoading } = useAuth();
  
  const [systemName, setSystemName] = React.useState('RateEase');
  const [assemblyLogo, setAssemblyLogo] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState('admin@rateease.gov');
  const [password, setPassword] = React.useState('password');
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);


  React.useEffect(() => {
    setIsMounted(true);
    const generalSettings = inMemorySettings.generalSettings;
    const appearanceSettings = inMemorySettings.appearanceSettings;

    if (generalSettings && generalSettings.systemName) {
      setSystemName(generalSettings.systemName);
    }
    if (appearanceSettings && appearanceSettings.assemblyLogo) {
      setAssemblyLogo(appearanceSettings.assemblyLogo);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    const loggedInUser = await login(email, password);

    if (loggedInUser) {
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${loggedInUser.name}!`,
      });
      router.push('/dashboard');
    } else {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
      });
       setIsLoggingIn(false);
    }
  };

  const isLoading = isLoggingIn || authLoading;

  if (!isMounted) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
       <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary/20 via-background to-background dark:from-primary/10 animate-gradient-xy"></div>
       <div className="relative z-10 w-full max-w-md">
        <Card className="shadow-2xl animate-fade-in-up bg-card/80 backdrop-blur-lg">
          <CardHeader className="text-center p-6">
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center text-primary overflow-hidden">
               {assemblyLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={assemblyLogo} alt="Assembly Logo" style={{height: '100%', width: '100%', objectFit: 'contain'}} />
              ) : (
                <Landmark className="h-12 w-12" />
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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="px-6 pb-6 pt-4">
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground animate-fade-in-up animation-delay-300">
          BUILT AND DEVELOPED BY ANEH TECH CONSORTIUM.
        </p>
      </div>
    </main>
  );
}
