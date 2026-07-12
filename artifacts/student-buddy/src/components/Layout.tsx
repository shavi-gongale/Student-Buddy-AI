import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  LayoutDashboard, MessageSquare, Lightbulb, Activity, 
  FileCode2, BookOpen, Calendar, TrendingUp, 
  StickyNote, Bookmark, Award, Settings, LogOut,
  Flame, Star, Menu, X, ChevronRight, Zap
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

const navGroups = [
  {
    label: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/" },
      { icon: TrendingUp, label: "Progress", href: "/progress" },
      { icon: Award, label: "Achievements", href: "/achievements" },
    ],
  },
  {
    label: "AI Tools",
    items: [
      { icon: MessageSquare, label: "Mentor Chat", href: "/mentor" },
      { icon: Lightbulb, label: "Smart Hints", href: "/hints" },
      { icon: Activity, label: "Analyzer", href: "/analyzer" },
      { icon: FileCode2, label: "Code Review", href: "/review" },
      { icon: BookOpen, label: "Concept Explainer", href: "/explain" },
    ],
  },
  {
    label: "Planning",
    items: [
      { icon: Calendar, label: "Study Plan", href: "/study-plan" },
    ],
  },
  {
    label: "Library",
    items: [
      { icon: StickyNote, label: "Notes", href: "/notes" },
      { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
    ],
  },
];

function NavItem({ icon: Icon, label, href, active, onClick }: {
  icon: React.ElementType; label: string; href: string; active: boolean; onClick?: () => void;
}) {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group relative",
          active
            ? "bg-primary/10 text-primary nav-active"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0 transition-transform group-hover:scale-110", active && "text-primary")} />
        <span>{label}</span>
        {active && (
          <motion.div
            layoutId="nav-indicator"
            className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </div>
    </Link>
  );
}

function GuestSidebarContent({ location, onNavClick }: { location: string; onNavClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary-sm">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            Student<span className="text-primary">Buddy</span>
          </span>
        </div>
      </div>

      {/* Guest Profile Card */}
      <div className="p-4 border-b border-white/5 shrink-0">
        <div className="space-y-2">
          <p className="font-semibold text-sm text-foreground">Guest mode</p>
          <p className="text-xs text-muted-foreground">Clerk authentication is disabled. Application navigation is still available.</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={location === item.href}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/5 space-y-0.5 shrink-0">
        <NavItem icon={Settings} label="Settings" href="/settings" active={location === "/settings"} onClick={onNavClick} />
      </div>
    </div>
  );
}

function AuthSidebarContent({ location, onNavClick }: { location: string; onNavClick?: () => void }) {
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { data: user, isLoading } = useGetMe({
    query: { enabled: !!clerkUser, queryKey: [] }
  });

  const xpInLevel = (user?.xp ?? 0) % 100;
  const xpPercent = xpInLevel;

  useEffect(() => {
    if (user) {
      document.documentElement.classList.toggle("dark", user.darkMode ?? true);
    }
  }, [user?.darkMode]);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary-sm">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground font-bold text-lg tracking-tight">
            Student<span className="text-primary">Buddy</span>
          </span>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-b border-white/5 shrink-0">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        ) : user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                  {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-sidebar" />
              </div>
              <div className="overflow-hidden flex-1">
                <p className="font-semibold truncate text-sm text-foreground">{user.name ?? user.email ?? "User"}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-yellow-400 font-medium">Lvl {user.level ?? 1}</span>
                  </span>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-400 fill-current" />
                    <span className="text-orange-400 font-medium">{user.streak ?? 0}d</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{(user.xp ?? 0).toLocaleString()} XP</span>
                <span className="text-primary font-medium">{xpInLevel}/100</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground/50 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={location === item.href}
                  onClick={onNavClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="p-3 border-t border-white/5 space-y-0.5 shrink-0">
        <NavItem icon={Settings} label="Settings" href="/settings" active={location === "/settings"} onClick={onNavClick} />
        <button
          onClick={() => signOut({ redirectUrl: import.meta.env.BASE_URL })}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <LogOut className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function Layout({ children, clerkEnabled = true }: { children: React.ReactNode; clerkEnabled?: boolean }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = clerkEnabled ? AuthSidebarContent : GuestSidebarContent;

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-sidebar hidden md:flex flex-col shrink-0">
        <SidebarContent location={location} />
      </aside>

      {/* Mobile overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-sidebar border-r border-white/5 flex flex-col md:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent location={location} onNavClick={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-white/5 bg-sidebar shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm">
              Student<span className="text-primary">Buddy</span>
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground/30 ml-auto" />
          <span className="text-sm text-muted-foreground capitalize">
            {location === "/" ? "Dashboard" : location.slice(1).replace("-", " ")}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
