import { Link } from "wouter";
import { Home, SearchX } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-white/3 border border-white/8 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h1 className="text-6xl font-black text-foreground/10 mb-2">404</h1>
        <h2 className="text-xl font-bold mb-2">Page Not Found</h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          This page doesn't exist — check the URL or head back to the dashboard.
        </p>
        <Link href="/">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer">
            <Home className="w-4 h-4" />
            Back to Dashboard
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
