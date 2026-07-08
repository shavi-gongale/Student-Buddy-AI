import { useState, useEffect } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { getGetMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, User, Code, Moon, Flame, Star, Zap, Check } from "lucide-react";
import { motion } from "framer-motion";

const LANGUAGES = ["python", "javascript", "typescript", "java", "c++", "go", "rust"];

export default function Settings() {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: [] } });
  const updateMe = useUpdateMe();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("python");
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPreferredLanguage(user.preferredLanguage ?? "python");
      const dm = user.darkMode ?? true;
      setDarkMode(dm);
      document.documentElement.classList.toggle("dark", dm);
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateMe.mutateAsync({ data: { name, preferredLanguage, darkMode } });
      await qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Settings saved! ✓" });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
  }

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-white/5 border border-white/8">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm ml-14">Manage your profile and preferences.</p>
      </motion.div>

      {/* Stats card (read-only) */}
      {!isLoading && user && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-primary/15 bg-primary/3">
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Your Stats</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-lg font-bold text-yellow-400">{user.level ?? 1}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Level</p>
                </div>
                <div className="text-center border-x border-white/5">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-lg font-bold text-primary">{(user.xp ?? 0).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total XP</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <span className="text-lg font-bold text-orange-400">{user.streak ?? 0}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : (
        <motion.form
          onSubmit={handleSave}
          className="space-y-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Profile */}
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" /> Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Display Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-background/60"
                />
              </div>
            </CardContent>
          </Card>

          {/* Coding Preferences */}
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Code className="w-4 h-4 text-muted-foreground" /> Coding Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="text-sm font-medium mb-2 block">Preferred Language</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setPreferredLanguage(l)}
                      className={`px-3 py-1.5 rounded-lg text-sm border capitalize font-medium transition-all ${
                        preferredLanguage === l
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "border-white/8 text-muted-foreground hover:border-white/20"
                      }`}
                    >
                      {preferredLanguage === l && <Check className="w-3 h-3 mr-1 inline" />}
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card className="border-white/5 bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Moon className="w-4 h-4 text-muted-foreground" /> Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Use the dark theme (recommended for coding)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDarkMode(d => !d)}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${darkMode ? "bg-primary" : "bg-muted"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${darkMode ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </label>
            </CardContent>
          </Card>

          <Button type="submit" disabled={updateMe.isPending} className="w-full gap-2">
            {updateMe.isPending
              ? "Saving..."
              : <><Check className="w-4 h-4" /> Save Settings</>
            }
          </Button>
        </motion.form>
      )}
    </div>
  );
}
