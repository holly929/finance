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
} from 'lucide-react';

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyProvider } from '@/context/PropertyDataContext';
import { UserProvider } from '@/context/UserDataContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { PermissionsProvider, usePermissions } from '@/context/PermissionsContext';
import { ProfileDialog } from '@/components/profile-dialog';
import { BillProvider } from '@/context/BillDataContext';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/properties', icon: FileText, label: 'Properties' },
  { href: '/billing', icon: ReceiptText, label: 'Billing' },
  { href: '/bills', icon: BookCopy, label: 'Bills' },
  { href: '/reports', icon: LineChart, label: 'Reports' },
  { href: '/integrations', icon: Plug, label: 'Integrations' },
  { href: '/users', icon: Users, label: 'User Management' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user: authUser, logout } = useAuth();
  const { hasPermission } = usePermissions();
  const [systemName, setSystemName] = React.useState('RateEase');
  const [supportEmail, setSupportEmail] = React.useState('');
  const [isProfileDialogOpen, setIsProfileDialogOpen] = React.useState(false);
  
  const filteredNavItems = React.useMemo(() => {
    if (!authUser) return [];
    return navItems.filter(item => hasPermission(authUser.role, item.href));
  }, [authUser, hasPermission]);

  React.useEffect(() => {
    try {
      const savedGeneral = localStorage.getItem('generalSettings');
      if (savedGeneral) {
        const settings = JSON.parse(savedGeneral);
        if (settings.systemName) {
          setSystemName(settings.systemName);
        }
        if (settings.contactEmail) {
            setSupportEmail(settings.contactEmail);
        }
      }
    } catch (error) {
      console.error("Could not load settings from localStorage", error);
    }
  }, []);

  const NavLink = ({ href, icon: Icon, label }: typeof navItems[0]) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
              pathname.startsWith(href) && 'bg-accent text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const MobileNavLink = ({ href, icon: Icon, label }: typeof navItems[0]) => (
     <Link
        href={href}
        className={cn(
          "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
          pathname.startsWith(href) && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
  )

  if (!authUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
        <div className="grid min-h-screen w-full lg:grid-cols-[260px_1fr]">
          <div className="hidden border-r bg-card lg:block">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-[60px] items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                  <Landmark className="h-6 w-6 text-primary" />
                  <span className="font-headline text-xl">{systemName}</span>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto">
                <nav className="grid items-start px-4 text-sm font-medium">
                  {filteredNavItems.map((item) => (
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
                    <AvatarImage src={authUser.photoURL || undefined} alt={authUser.name} />
                    <AvatarFallback>{authUser.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{authUser.name}</span>
                    <span className="text-xs text-muted-foreground">{authUser.email}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
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
                    {filteredNavItems.map((item) => (
                      <MobileNavLink key={item.label} {...item} />
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
                      placeholder="Search properties..."
                      className="w-full appearance-none bg-background pl-8 shadow-none md:w-1/2 lg:w-1/3"
                    />
                  </div>
                </form>
              </div>
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
            <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-8 lg:p-8 bg-muted/40 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      <ProfileDialog isOpen={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen} />
    </>
  );
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        <PropertyProvider>
          <BillProvider>
            <PermissionsProvider>
              <LayoutContent>{children}</LayoutContent>
            </PermissionsProvider>
          </BillProvider>
        </PropertyProvider>
      </UserProvider>
    </AuthProvider>
  );
}
