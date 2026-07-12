import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { Switch, Route, useLocation, Router as WouterRouter } from 'wouter';
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import MentorChat from "./pages/MentorChat";
import Hints from "./pages/Hints";
import Analyzer from "./pages/Analyzer";
import Review from "./pages/Review";
import Explain from "./pages/Explain";
import StudyPlan from "./pages/StudyPlan";
import Progress from "./pages/Progress";
import Notes from "./pages/Notes";
import Bookmarks from "./pages/Bookmarks";
import Achievements from "./pages/Achievements";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";

const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkPubKey = rawClerkKey
  ? publishableKeyFromHost(window.location.hostname, rawClerkKey)
  : null;

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
const clerkEnabled = Boolean(clerkPubKey);

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  cssLayerName: "clerk",
  variables: {
    colorPrimary: "hsl(188, 100%, 48%)",
    colorBackground: "hsl(224, 71%, 4%)",
    colorInputBackground: "hsl(216, 34%, 17%)",
    fontFamily: "'Inter', sans-serif",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-card rounded-2xl w-[440px] max-w-full overflow-hidden",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  return (
    <>
      <Show when="signed-in">
        <Layout>{children}</Layout>
      </Show>
      <Show when="signed-out">
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-bold text-foreground font-mono">{`{ StudentBuddy }`}</h1>
            <p className="text-muted-foreground text-lg">Your AI-powered coding interview mentor</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setLocation("/sign-in")} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">Sign In</button>
            <button onClick={() => setLocation("/sign-up")} className="px-6 py-2.5 border border-border text-foreground rounded-md font-medium hover:bg-secondary transition-colors">Sign Up</button>
          </div>
        </div>
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function App() {
  const [, setLocation] = useLocation();

  if (!clerkEnabled) {
    return (
      <QueryClientProvider client={queryClient}>
        <Layout clerkEnabled={false}>
          <Switch>
            <Route path="/">
              <Dashboard />
            </Route>
            <Route path="/mentor">
              <MentorChat />
            </Route>
            <Route path="/hints">
              <Hints />
            </Route>
            <Route path="/analyzer">
              <Analyzer />
            </Route>
            <Route path="/review">
              <Review />
            </Route>
            <Route path="/explain">
              <Explain />
            </Route>
            <Route path="/study-plan">
              <StudyPlan />
            </Route>
            <Route path="/progress">
              <Progress />
            </Route>
            <Route path="/notes">
              <Notes />
            </Route>
            <Route path="/bookmarks">
              <Bookmarks />
            </Route>
            <Route path="/achievements">
              <Achievements />
            </Route>
            <Route path="/settings">
              <Settings />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </QueryClientProvider>
    );
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey as string}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/">
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          </Route>
          <Route path="/mentor">
            <ProtectedRoute><MentorChat /></ProtectedRoute>
          </Route>
          <Route path="/hints">
            <ProtectedRoute><Hints /></ProtectedRoute>
          </Route>
          <Route path="/analyzer">
            <ProtectedRoute><Analyzer /></ProtectedRoute>
          </Route>
          <Route path="/review">
            <ProtectedRoute><Review /></ProtectedRoute>
          </Route>
          <Route path="/explain">
            <ProtectedRoute><Explain /></ProtectedRoute>
          </Route>
          <Route path="/study-plan">
            <ProtectedRoute><StudyPlan /></ProtectedRoute>
          </Route>
          <Route path="/progress">
            <ProtectedRoute><Progress /></ProtectedRoute>
          </Route>
          <Route path="/notes">
            <ProtectedRoute><Notes /></ProtectedRoute>
          </Route>
          <Route path="/bookmarks">
            <ProtectedRoute><Bookmarks /></ProtectedRoute>
          </Route>
          <Route path="/achievements">
            <ProtectedRoute><Achievements /></ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute><Settings /></ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default function Root() {
  return (
    <WouterRouter base={basePath}>
      <App />
    </WouterRouter>
  );
}
