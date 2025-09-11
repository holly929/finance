
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Settings,
  Landmark,
  PanelLeft,
  User,
  Search,
  ReceiptText,
  Users,
  LineChart,
  Loader2,
  BookCopy,
  Plug,
  Moon,
  Sun,
  Store,
  AlertCircle,
  CreditCard,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyProvider } from '@/context/PropertyDataContext';
import { UserProvider } from '@/context/UserDataContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PermissionsProvider, usePermissions } from '@/context/PermissionsContext';
import { ProfileDialog } from '@/components/profile-dialog';
import { BillProvider } from '@/context/BillDataContext';
import { BopProvider } from '@/context/BopDataContext';
import type { User as UserType } from '@/lib/types';
import { inMemorySettings } from '@/lib/settings';
import { ThemeProvider } from '@/components/theme-provider';


const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/properties', icon: FileText, label: 'Properties' },
  { href: '/billing', icon: ReceiptText, label: 'Billing' },
  { href: '/bop', icon: Store, label: 'BOP Data' },
  { href: '/bop-billing', icon: ReceiptText, label: 'BOP Billing' },
  { href: '/bills', icon: BookCopy, label: 'Bills' },
  { href: '/defaulters', icon: AlertCircle, label: 'Defaulters' },
  { href: '/payment', icon: CreditCard, label: 'Online Payment', isHidden: true },
  { href: '/reports', icon: LineChart, label: 'Reports' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/users', icon: Users, label: 'User Management' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function ThemeToggle() {
    const { setTheme, theme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function MainLayout({
  children,
  user,
  logout,
}: {
  children: React.ReactNode;
  user: UserType | null;
  logout: () => void;
}) {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const [systemName, setSystemName] = React.useState('RateEase');
  const [supportEmail, setSupportEmail] = React.useState('');
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const generalSettings = inMemorySettings.generalSettings;
    if (generalSettings) {
        setSystemName(generalSettings.systemName || 'RateEase');
        setSupportEmail(generalSettings.contactEmail || '');
    }
  }, []);

  const filteredNavItems = React.useMemo(() => {
    if (!user) return [];
    return navItems.filter(item => hasPermission(user.role, item.href));
  }, [user, hasPermission]);
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
        <div className="grid min-h-screen w-full md:grid-cols-[260px_1fr]">
          <div className="hidden border-r bg-card md:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <Landmark className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl">{systemName}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <nav className="grid items-start px-4 text-sm font-medium">
                  {filteredNavItems.filter(item => !item.isHidden).map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 my-1 text-muted-foreground transition-all hover:bg-muted hover:text-primary",
                        pathname.startsWith(item.href) && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="mt-auto border-t p-4">
                 <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border">
                    <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 md:h-[60px] md:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                  <nav className="grid gap-2 text-lg font-medium">
                    <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4">
                      <Landmark className="h-6 w-6 text-primary" />
                      <span className="font-headline">{systemName}</span>
                    </Link>
                    {filteredNavItems.filter(item => !item.isHidden).map((item) => (
                     <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                          "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                          pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
              <div className="w-full flex-1">
                <form>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="w-full appearance-none bg-background pl-8 shadow-none sm:w-1/2 md:w-1/3"
                    />
                  </div>
                </form>
              </div>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setIsProfileDialogOpen(true)}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => { if (supportEmail) window.location.href = `mailto:${supportEmail}`}} disabled={!supportEmail}>
                    Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 bg-muted/40 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </>
  );
}

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <MainLayout user={user} logout={logout}>
      {children}
    </MainLayout>
  );
}

export default function LayoutWithProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <UserProvider>
        <AuthProvider>
          <PermissionsProvider>
            <PropertyProvider>
              <BopProvider>
                <BillProvider>
                  <AuthenticatedLayout>{children}</AuthenticatedLayout>
                </BillProvider>
              </BopProvider>
            </PropertyProvider>
          </PermissionsProvider>
        </AuthProvider>
      </UserProvider>
    </ThemeProvider>
  );
}

  