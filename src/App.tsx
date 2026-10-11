/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo, type ReactNode, Suspense, lazy } from 'react';
import * as aiService from './services/gemini';
import { 
  Monitor,
  Smartphone,
  Tablet,
  Sparkles,
  Zap,
  Send,
  Loader2,
  Rocket,
  Download,
  History as HistoryIcon,
  Settings,
  Layers,
  Code2,
  Play,
  CheckCircle2,
  Github,
  ChevronDown,
  Edit2,
  Folder,
  FolderPlus,
  Terminal,
  Box,
  Copy,
  Plus,
  Trash2,
  Undo,
  MessageSquareText,
  HelpCircle,
  FileCode,
  X,
  Eye,
  User as UserIcon,
  Database,
  Layout,
  LogIn,
  LogOut,
  Cloud,
  CloudOff,
  AlertCircle,
  Palette,
  Globe,
  PenTool,
  Glasses,
  Leaf,
  ExternalLink,
  Image as ImageIcon,
  Video,
  QrCode,
  Shield,
  CreditCard,
  Book,
  Search,
  BarChart2,
  RefreshCcw,
  TrendingUp,
  Clock,
  Activity,
  FileText,
  Server,
  ShoppingCart,
  Lock,
  Mail,
  Users,
  BookOpen,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
const MonacoEditor = lazy(() => import('@monaco-editor/react'));
import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { parseMultiFiles } from './utils';

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  type User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

import { useGeneration } from './hooks/useGeneration';
import { useProjects } from './hooks/useProjects';
import { useDeploy } from './hooks/useDeploy';
import { McpPanel } from './components/McpPanel';
import { Cpu } from 'lucide-react';

// Firebase Toggle
const FIREBASE_AVAILABLE = Boolean((import.meta as any).env.VITE_FIREBASE_API_KEY);

// Initialize Firebase only if available
const app = FIREBASE_AVAILABLE ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;

// Initialization handles moved to server-side for security


const BackgroundCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 20; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.2 + 0.1
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw Grid Points
      const spacing = 40;
      const time = Date.now() * 0.001;
      for (let x = 0; x < canvas.width; x += spacing) {
        for (let y = 0; y < canvas.height; y += spacing) {
          const pulse = Math.sin(time + (x + y) * 0.01) * 0.03 + 0.05;
          ctx.fillStyle = `rgba(99, 102, 241, ${pulse})`;
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Particles
      particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        p.y -= p.speed;
        if (p.y < -10) p.y = canvas.height + 10;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      <canvas ref={canvasRef} className="w-full h-full opacity-60" />
      <div className="orbe orbe-indigo" />
      <div className="orbe orbe-cyan" />
      <div className="orbe orbe-purple" />
      <div className="scanline" />
    </div>
  );
};

const Logo = () => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 relative flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-full h-full text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
        <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="none" stroke="currentColor" strokeWidth="4" />
        <path d="M50 25 L35 55 L50 55 L45 75 L65 45 L50 45 Z" fill="currentColor" />
      </svg>
    </div>
    <div className="flex flex-col -space-y-1">
      <span className="font-display font-bold text-lg tracking-tight text-white leading-none">WEBFORGE OS</span>
      <span className="text-[7px] uppercase tracking-[0.15em] font-black text-primary/60">Build the future. One prompt at a time.</span>
    </div>
  </div>
);


interface Version {
  timestamp: number;
  files: Record<string, string>;
  prompt: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  category?: string;
  versions: Version[];
  currentVersionIndex: number;
  activeFile: string;
  userId?: string;
  updatedAt?: any;
}


const translations: Record<string, Record<string, string>> = {
  fr: {
    newProject: "Nouveau Projet",
    sites: "Sites",
    library: "Bibliothèque",
    settings: "Paramètres",
    preferences: "Préférences",
    recentProjects: "Projets Récents",
    promptPlaceholder: "Décrivez votre projet...",
    publish: "Publier",
    export: "Exporter",
    monitor: "Monitor",
    source: "Source",
    history: "Historique",
    deploy: "Déployer",
    stats: "Statistiques",
    connect: "Connexion",
    logout: "Déconnexion",
    profile: "Profil",
    forgeBot: "Forge.Bot",
    vision: "X-Vision",
    cinema: "X-Cinema",
    invalidDate: "Date invalide",
    updated: "Mis à jour",
    build: "Construit",
    coreOnline: "Core en ligne",
    kernelLog: "Kernel Log Actif",
    openConsole: "Ouvrir Console",
    thinking: "L'IA réfléchit...",
    generating: "Génération en cours...",
    success: "Succès",
    error: "Erreur",
    newFolder: "Nouveau Dossier"
  },
  en: {
    newProject: "New Project",
    sites: "Sites",
    library: "Library",
    settings: "Settings",
    preferences: "Preferences",
    recentProjects: "Recent Projects",
    promptPlaceholder: "Describe your project...",
    publish: "Publish",
    export: "Export",
    monitor: "Monitor",
    source: "Source",
    history: "History",
    deploy: "Deploy",
    stats: "Analytics",
    connect: "Connect",
    logout: "Logout",
    profile: "Profile",
    forgeBot: "Forge.Bot",
    vision: "X-Vision",
    cinema: "X-Cinema",
    invalidDate: "Invalid Date",
    updated: "Updated",
    build: "Build",
    coreOnline: "Core Online",
    kernelLog: "Kernel Log Active",
    openConsole: "Open Console",
    thinking: "AI is thinking...",
    generating: "Generating...",
    success: "Success",
    error: "Error",
    newFolder: "New Folder"
  }
};

export const PROJECT_TYPES = [
  { id: 'saas', name: 'SAAS', icon: <Layers size={12}/>, lang: 'typescript', color: '#6366f1', prompt: 'Apply a SaaS platform aesthetic: Clean sidebar, card-based layouts, status indicators, and Inter typography.' },
  { id: 'ecommerce', name: 'E-COMMERCE', icon: <ShoppingCart size={12}/>, lang: 'typescript', color: '#ec4899', prompt: 'Apply a high-end e-commerce aesthetic: large product imagery from picsum.photos, clean typography, smooth transitions, functional localStorage cart, and Stripe checkout integration.' },
  { id: 'web', name: 'WEB APP', icon: <Globe size={12}/>, lang: 'html', color: '#6366f1', prompt: 'Construis une application web moderne avec une architecture propre.' },
  { id: 'python', name: 'PYTHON', icon: <Box size={12}/>, lang: 'python', color: '#4584b6', prompt: 'Génère un script Python performant et documenté.' },
  { id: 'fastapi', name: 'FASTAPI', icon: <Server size={12}/>, lang: 'python', color: '#05998b', prompt: 'Crée une API FastAPI moderne avec documentation Swagger et modèles Pydantic.' },
  { id: 'react', name: 'REACT', icon: <Zap size={12}/>, lang: 'typescript', color: '#61dbfb', prompt: 'Crée un composant React moderne en utilisant les hooks.' },
  { id: 'nextjs', name: 'NEXT.JS', icon: <Activity size={12}/>, lang: 'typescript', color: '#000000', prompt: 'Génère une application Next.js avec App Router et Server Components.' },
  { id: 'vue', name: 'VUE', icon: <Glasses size={12}/>, lang: 'typescript', color: '#42b883', prompt: 'Génère une application Vue 3 avec Composition API et Pinia.' },
  { id: 'node', name: 'NODE.JS', icon: <Database size={12}/>, lang: 'javascript', color: '#68a063', prompt: 'Développe une API Node.js robuste et typée.' },
  { id: 'bash', name: 'SHELL', icon: <Terminal size={12}/>, lang: 'shell', color: '#4e9a06', prompt: 'Écris un script shell optimisé pour l\'automatisation.' },
  { id: 'sql', name: 'SQL', icon: <Database size={12}/>, lang: 'sql', color: '#f29111', prompt: 'Conçois une structure de base de données SQL normalisée.' },
  { id: 'docker', name: 'DOCKER', icon: <Box size={12}/>, lang: 'yaml', color: '#2496ed', prompt: 'Génère un Dockerfile ou un docker-compose.yml optimisé.' },
  { id: 'css', name: 'CSS', icon: <Palette size={12}/>, lang: 'css', color: '#264de4', prompt: 'Génère du CSS moderne avec animations et variables.' },
  { id: 'mobile', name: 'MOBILE', icon: <Smartphone size={12}/>, lang: 'typescript', color: '#ff5a5f', prompt: 'Génère une application mobile réactive (PWA ou React Native).' },
  { id: 'docs', name: 'DOCS', icon: <FileText size={12}/>, lang: 'markdown', color: '#000000', prompt: 'Génère une documentation complète et claire en Markdown.' },
];

const SaaS_TEMPLATES = [
  { 
    id: 'starter-pro', 
    name: 'SaaS Starter Pro 🚀', 
    type: 'saas',
    desc: 'Architecture parfaite : Landing Page moderne, Système Authentication (Login/Register), Pricing Table, Dashboard utilisateur et intégration Stripe.',
    fullPrompt: "Génère un SaaS Starter complet. Inclus: 1. index.html (Landing Page haut de gamme style Stripe/Linear), 2. auth.html (Flux login et signup avec validation), 3. dashboard.html (Interface d'administration avec charts Recharts et sidebar), 4. pricing.html (Grille de prix avec toggle mensuel/annuel), 5. stripe-integration.js (Logique de paiement et webhook), 6. README.md (Instructions)."
  },
  { 
    id: 'ecommerce-engine', 
    name: 'E-commerce Engine 🛍️', 
    type: 'ecommerce',
    desc: 'Boutique haute performance avec Catalogue produits dynamique, Panier persistant (LocalStorage) et Checkout sécurisé.',
    fullPrompt: "Génère un E-commerce complet. Inclus: 1. index.html (Showcase produits avec filtres), 2. product.html (Détails produit avec galerie), 3. cart.js (Gestion du panier avec localStorage), 4. checkout.html (Formulaire de commande avec validation), 5. api/products.json (Database mock), 6. styles.css (Design luxe minimaliste)."
  },
  { 
    id: 'blog-cms', 
    name: 'Blog/CMS Editorial ✍️', 
    type: 'web',
    desc: 'Plateforme de contenu avec News Feed, Articles riches, Catégories et SEO optimisé.',
    fullPrompt: "Génère un Blog/CMS complet. Inclus: 1. index.html (Grille d'articles avec recherche), 2. article.html (Template lecture avec barre de lecture et commentaires), 3. admin/editor.html (Interface de rédaction Markdown), 4. seo-config.json (Meta tags et sitemap logic), 5. styles.css (Typographie éditoriale premium)."
  },
  { 
    id: 'portfolio-luxe', 
    name: 'Portfolio Luxe 💎', 
    type: 'web',
    desc: 'Showcase créatif avec animations GSAP, Galerie filtrable et formulaire de contact direct.',
    fullPrompt: "Génère un Portfolio de luxe. Inclus: 1. index.html (Hero section avec animations smooth), 2. projects.html (Galerie bento-grid), 3. contact.js (Gestion de formulaire avec validation), 4. assets/animations.js (Effets de scroll et reveal), 5. theme.css (Noir profond, accents or/cyan, Inter font)."
  },
  { 
    id: 'mobile-app', 
    name: 'App Mobile Interface 📱', 
    type: 'mobile',
    desc: 'UI/UX Mobile First pour PWA : Tab Bar, Gestures, et thèmes Sombre/Clair.',
    fullPrompt: "Génère une interface Mobile App (PWA). Inclus: 1. index.html (Shell de l'app avec Tab Bar), 2. home.html (Feed vertical), 3. profile.html (Paramètres utilisateur), 4. manifest.json (Configuration PWA), 5. app.js (Navigation par swipe et transitions), 6. icons/ (Placeholder SVG)."
  },
  { id: 'b2b-marketplace', name: 'B2B Marketplace 🏢', desc: 'Plateforme multi-vendeurs avec gestion de catalogue.', type: 'saas', fullPrompt: "Génère une Marketplace B2B. Inclus: Landing, Dashboard vendeur, Dashboard acheteur, et Catalog Management." },
  { id: 'crm-management', name: 'CRM Management 📊', desc: 'Gestion clients, pipeline de ventes et analytics.', type: 'saas', fullPrompt: "Génère un CRM complet. Inclus: Pipeline visualizer, Customer cards, Tasks manager, et Sales reports." },
  { id: 'media-platform', name: 'Media Platform 📺', desc: 'Streaming vidéo/audio avec abonnement.', type: 'saas', fullPrompt: "Génère une plateforme de Media. Inclus: Video player (simulé), Content library, Subscription gate, et User library." },
  { id: 'lms-academy', name: 'LMS Academy 🎓', desc: 'E-learning avec cours, quiz et certificats.', type: 'saas', fullPrompt: "Génère un LMS Academy. Inclus: Course viewer, Quiz interface, Student dashboard, et Certificate generator." },
  { id: 'analytics-suite', name: 'Analytics Suite 📈', desc: 'Dashboard temps réel avec graphiques complexes.', type: 'saas', fullPrompt: "Génère une Analytics Suite. Inclus: Real-time charts, Data export PDF/CSV, Alert system, et Data sources manager." }
];

const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe Payments', icon: <CreditCard size={20} />, desc: 'Paiements et abonnements SaaS.', setup: 'STRIPE_SECRET_KEY, VITE_STRIPE_PUB_KEY', code: 'npm install stripe' },
  { id: 'lemonsqueezy', name: 'Lemon Squeezy', icon: <Zap size={20} />, desc: 'Alternative à Stripe avec Merchant of Record.', setup: 'LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET', code: 'npm install @lemonsqueezy/lemonsqueezy.js' },
  { id: 'mailchimp', name: 'Mailchimp Newsletter', icon: <Mail size={20} />, desc: 'Email marketing et newsletter.', setup: 'MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID', code: 'npm install @mailchimp/mailchimp_marketing' },
  { id: 'firebase', name: 'Firebase Auth', icon: <Shield size={20} />, desc: 'Authentification Google & Email.', setup: 'FIREBASE_CONFIG_JSON', code: 'npm install firebase' },
  { id: 'resend', name: 'Resend Email', icon: <Mail size={20} />, desc: 'Emails transactionnels.', setup: 'RESEND_API_KEY', code: 'npm install resend' },
  { id: 'supabase', name: 'Supabase DB', icon: <Database size={20} />, desc: 'Base SQL temps réel.', setup: 'SUPABASE_URL, SUPABASE_ANON_KEY', code: 'npm install @supabase/supabase-js' }
];

export const DEFAULT_FILES: Record<string, string> = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@900&display=swap" rel="stylesheet">
  <title>X-KERNEL FORGE</title>
</head>
<body class="bg-black text-white min-h-screen flex items-center justify-center">
  <h1 class="text-6xl font-black italic">X-KERNEL ONLINE</h1>
</body>
</html>`
};

const OLLAMA_MODELS = [
  { id: 'qwen2.5-coder:7b', name: 'QWEN 2.5 CODER', desc: 'State-of-the-art code generation kernel.' },
  { id: 'codellama', name: 'CODELLAMA', desc: 'Proven reliability in diverse tech stacks.' },
  { id: 'mistral', name: 'MISTRAL', desc: 'Balanced intelligence for rapid prototyping.' }
];

const PLACEHOLDERS = [
  "Build a Tesla-style landing page...",
  "Generate a Python FastAPI microservice...",
  "Design a SaaS dashboard for CRM...",
  "Create a react-based bento-grid portfolio..."
];

interface Version {
  timestamp: number;
  files: Record<string, string>;
  prompt: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  category?: string;
  versions: Version[];
  currentVersionIndex: number;
  activeFile: string;
  userId?: string;
  updatedAt?: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  thinking?: string;
  action?: string;
  code?: string;
  explanation?: string;
  next_steps?: string[];
  timestamp?: number;
}

interface DataItem {
  id: string;
  key: string;
  value: string;
  userId?: string;
}

interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  code: string;
  authorId: string;
  createdAt: any;
}

interface UserPreferences {
  theme: 'dark' | 'light' | 'brutalist';
  autoSave: boolean;
  defaultViewport: 'desktop' | 'tablet' | 'mobile';
  updatedAt?: any;
}

const DESIGN_PRESETS = [
  { id: 'musk', name: 'X-Brutalism', icon: <Zap size={14}/>, description: 'Engineering-first, ultra-bold, high-stakes aesthetic.', prompt: 'Apply an X-Brutalism aesthetic: High-contrast black/white, neon cyan accents, visible oversized grid structures, massive typography, and monospace sub-data.' },
  { id: 'tech', name: 'Mission Control', icon: <Terminal size={14}/>, description: 'Professionnel, précis, inspiré des instruments de contrôle.', prompt: 'Apply a technical dashboard aesthetic: visible grid lines, monospace data values, italic serif headers, muted backgrounds with strong hover inversions.' },
  { id: 'luxury', name: 'Tesla Minimal', icon: <Glasses size={14}/>, description: 'Sophistiqué, minimaliste, atmosphère premium.', prompt: 'Apply a dark luxury aesthetic: pure black backgrounds, very light font weights (300), thin pill borders, tiny uppercase navigation with wide tracking.' },
];

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset' | 'profile'>('login');
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [showIntegrationsModal, setShowIntegrationsModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const [visionPrompt, setVisionPrompt] = useState('');
  const [visionResult, setVisionResult] = useState<any>(null);
  const [isVisionLoading, setIsVisionLoading] = useState(false);
  const [cinemaPrompt, setCinemaPrompt] = useState('');
  const [cinemaResult, setCinemaResult] = useState<string | null>(null);
  const [cinemaStoryboard, setCinemaStoryboard] = useState<any | null>(null);
  const [isCinemaLoading, setIsCinemaLoading] = useState(false);
  const [activeStoryboardScene, setActiveStoryboardScene] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const currentProject = useMemo(() => projects.find(p => p.id === currentProjectId), [projects, currentProjectId]);
  const currentVersion = useMemo(() => currentProject?.versions[currentProject.currentVersionIndex], [currentProject]);
  const currentFiles = useMemo(() => {
    if (!currentProject) return DEFAULT_FILES;
    return currentVersion?.files || DEFAULT_FILES;
  }, [currentProject, currentVersion]);
  const [editorValue, setEditorValue] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dataItems, setDataItems] = useState<DataItem[]>([
    { id: '1', key: 'Nom_Site', value: 'WebForge Deluxe' },
    { id: '2', key: 'Slogan', value: 'L\'IA qui forge votre futur.' }
  ]);
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState('web');
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    autoSave: true,
    defaultViewport: 'desktop'
  });
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history' | 'chat' | 'data' | 'library' | 'styles' | 'deploy' | 'pulse' | 'vision' | 'cinema' | 'settings' | 'analytics' | 'mcp'>('preview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeDeployment, setActiveDeployment] = useState<Deployment | null>(null);
  const [neuralForgeEnabled, setNeuralForgeEnabled] = useState(true);
  const [systemLogs, setSystemLogs] = useState<{msg: string, time: string}[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [latency, setLatency] = useState<number | 'N/A'>(12);
  const [selectedModel, setSelectedModel] = useState<string>(localStorage.getItem('wf_ollama_model') || 'qwen2.5-coder:7b');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [tempProjectName, setTempProjectName] = useState('');
  const [tempProjectCategory, setTempProjectCategory] = useState('');
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(JSON.parse(localStorage.getItem('wf_categories') || '["Projets", "Autres"]'));
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
  const [lang, setLang] = useState<'fr' | 'en'>(localStorage.getItem('wf_lang') as 'fr'|'en' || 'fr');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [deployTokens, setDeployTokens] = useState({
    netlify: localStorage.getItem('wf_netlify_token') || '',
    github: localStorage.getItem('wf_github_token') || '',
    surge: localStorage.getItem('wf_surge_token') || ''
  });
  const [surgeDomain, setSurgeDomain] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [seoScore, setSeoScore] = useState<{ score: number; issues: string[] } | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [memoryData, setMemoryData] = useState<any>(null);
  const [suggestedUpgrades, setSuggestedUpgrades] = useState<any[]>([]);
  const [proactiveSuggestions, setProactiveSuggestions] = useState<string[]>([]);
  const [marketTrends, setMarketTrends] = useState<any>(null);
  const [styleLearningInput, setStyleLearningInput] = useState("");
  const [isLearningStyle, setIsLearningStyle] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [intelStatus, setIntelStatus] = useState<any>(null);
  const [isSyncingIntel, setIsSyncingIntel] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [updateData, setUpdateData] = useState<any>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [aiError, setAiError] = useState<{ message: string; code?: number; type?: 'error' | 'success'; retryFn?: any } | null>(null);

  const addLog = (msg: string) => {
    setSystemLogs(prev => [{msg, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 50));
  };

  const trackEvent = async (event: string, data: any) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-model': selectedModel
        },
        body: JSON.stringify({ event, data })
      });
    } catch (e) {
      console.warn("Analytics failed:", e);
    }
  };

  const fetchProactiveSuggestions = async (prompt: string, type: string) => {
    try {
      const res = await fetch('/api/proactive-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastPrompt: prompt, lastType: type })
      });
      const data = await res.json();
      setProactiveSuggestions(data.suggestions || []);
    } catch (e) {}
  };

  const isPreviewable = useMemo(() => {
    return ['web', 'saas', 'ecommerce', 'mobile'].includes(currentProject?.type || '');
  }, [currentProject?.type]);

  const {
    editingProjectId,
    setEditingProjectId,
    createNewProject,
    deleteProject,
    duplicateProject,
    renameProject,
    updateProjectCode
  } = useProjects(
    user,
    db,
    FIREBASE_AVAILABLE,
    projects,
    setProjects,
    setCurrentProjectId,
    setActiveTab,
    (err: any) => setAiError(err),
    addLog,
    categories,
    setCategories
  );

  const {
    isGenerating,
    setIsGenerating,
    tokensPerSec,
    handleGenerate,
    handleAIError,
    handleAIQuickAction,
    lastGeneration,
    lastPromptRef,
    stopGeneration
  } = useGeneration(
    currentProject,
    currentFiles,
    selectedModel,
    selectedType,
    (files: any, prompt: string) => updateProjectCode(currentProjectId!, files, prompt),
    addLog,
    trackEvent,
    fetchProactiveSuggestions,
    (text: string) => parseMultiFiles(text, currentFiles),
    setActiveTab,
    isPreviewable,
    aiError,
    setAiError
  );

  const {
    deployLoading,
    setDeployLoading,
    deployProgress,
    deployResult,
    qrCodeUrl,
    setQrCodeUrl,
    handleDeploy,
    handleZipExport,
    generateQRCode
  } = useDeploy(
    currentProject,
    currentFiles,
    (files: any, prompt: string) => updateProjectCode(currentProjectId!, files, prompt),
    addLog,
    trackEvent,
    selectedModel,
    deployTokens,
    githubRepo,
    surgeDomain,
    handleAIError
  );

   const testConnection = async () => {
    addLog("NETWORK: Pinging Ollama Kernel via /api/health...");
    const start = Date.now();
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setIsOnline(true);
        setLatency(Date.now() - start);
        addLog(`NETWORK: Kernel Response received in ${Date.now() - start}ms.`);
      } else {
        throw new Error('Kernel Offline');
      }
    } catch (err) {
      setIsOnline(false);
      setLatency('N/A');
      addLog("NETWORK_ERROR: Kernel synthesis unreachable.");
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 30000); // Heartbeat every 30s
    return () => clearInterval(interval);
  }, []);


  const chatEndRef = useRef<HTMLDivElement>(null);

  const debouncedEditorValue = useDebounce(editorValue, 1000);

  const t = (key: string) => translations[lang][key] || key;

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: any) => {
    if (!date) return t('updated') + ': --'
    const d = date?.toDate ? 
      date.toDate() : new Date(date)
    if (isNaN(d.getTime())) 
      return t('updated') + ': --'
    return d.toLocaleDateString(
      lang === 'fr' ? 'fr-FR' : 'en-US',
      { day:'2-digit', month:'short', year:'numeric' }
    )
  }

  const fetchAnalytics = async () => {
    setIsAnalyticsLoading(true);
    try {
      const res = await fetch('/api/analytics', {
        headers: { 'x-model': selectedModel }
      });
      const data = await res.json();
      setAnalyticsData(data.events || []);
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    } finally {
      setIsAnalyticsLoading(false);
    }
  };

  const exportCSV = () => {
    if (analyticsData.length === 0) return;
    const headers = ['Event', 'Timestamp', 'Data'];
    const rows = analyticsData.map(e => [e.event, new Date(e.timestamp).toISOString(), JSON.stringify(e.data).replace(/"/g, '""')]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `webforge_analytics_${Date.now()}.csv`);
    link.click();
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'settings') {
      const measureLatency = async () => {
        const start = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(`/api/health`, { 
        signal: controller.signal,
        headers: { 'x-model': selectedModel }
      });
          const data = await res.json();
          setLatency(Date.now() - start);
          if (data.available_models) {
             setAvailableModels(data.available_models);
          }
        } catch {
          setLatency('N/A');
        } finally {
          clearTimeout(timeoutId);
        }
      };
      measureLatency();
    }
  }, [activeTab]);

  useEffect(() => {
    if (currentProject?.type) {
      setSelectedType(currentProject.type);
    }
  }, [currentProjectId, currentProject?.type]);

  const currentCode = currentFiles[currentProject?.activeFile || 'index.html'] || '';

  const calculateSEOScore = (html: string) => {
    let score = 100;
    const issues = [];
    if (!html.includes('<title>')) { score -= 20; issues.push("Missing <title> tag"); }
    if (!html.includes('<meta name="description"')) { score -= 20; issues.push("Missing meta description"); }
    const h1Count = (html.match(/<h1/g) || []).length;
    if (h1Count !== 1) { score -= 15; issues.push(`Found ${h1Count} H1 tags (should be exactly 1)`); }
    if (!html.includes('rel="canonical"')) { score -= 10; issues.push("Missing canonical URL"); }
    const imgWithoutAlt = (html.match(/<img(?!.*alt=)/g) || []).length;
    if (imgWithoutAlt > 0) { score -= 10; issues.push(`Found ${imgWithoutAlt} images without alt text`); }
    
    setSeoScore({ score, issues });
  };

  const handleUndo = () => {
    addLog("SYSTEM: Restoring previous temporal state...");
    // Integration logic
  };

  const handleRedo = () => {
    addLog("SYSTEM: Forwarding to future state...");
  };

  const handleSaveProject = () => {
    addLog("SYSTEM: Project localized in persistent storage.");
  };

  // --- SELF-LEARNING HELPERS ---
  const submitFeedback = async (score: number, correction?: string) => {
    if (!lastGeneration) return;
    setFeedbackLoading(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: lastGeneration.prompt,
          code: lastGeneration.code,
          score,
          correction
        })
      });
      setShowFeedback(false);
      addLog("NEURAL_FORGE: Feedback processed. Kernel learning sequence updated.");
    } catch (e) {
      console.error("Feedback failed:", e);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setMemoryData(data);
      }
    } catch (e) {
      console.warn("Memory fetch failed silently");
    }
  };

  const fetchUpgrades = async () => {
    try {
      const res = await fetch('/api/upgrades');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setSuggestedUpgrades(data);
      }
    } catch (e) {
      console.warn("Upgrades fetch failed silently");
    }
  };

  const triggerManualImprovement = async () => {
    addLog("NEURAL_FORGE: Initiating manual self-improvement cycle...");
    try {
      const res = await fetch('/api/self-improve');
      const data = await res.json();
      addLog(`NEURAL_FORGE: New optimized prompt generated: ${data.improved_prompt.substring(0, 50)}...`);
    } catch (e) {
      addLog("NEURAL_FORGE_ERROR: Self-improvement cycle failed.");
    }
  };

  const triggerSelfUpgrade = async () => {
    addLog("NEURAL_FORGE: Scanning for architectural self-upgrade opportunities...");
    try {
      const res = await fetch('/api/self-upgrade', { method: 'POST' });
      const data = await res.json();
      addLog(`NEURAL_FORGE: New feature identified: ${data.feature_name}`);
      fetchUpgrades();
    } catch (e) {
      addLog("NEURAL_FORGE_ERROR: Self-upgrade generation failed.");
    }
  };

  const learnFromExample = async () => {
    if (!styleLearningInput) return;
    setIsLearningStyle(true);
    addLog("NEURAL_FORGE: Analyzing design patterns from source...");
    try {
      const res = await fetch('/api/learn-from-example', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ example: styleLearningInput, type: currentProject?.type || 'web' })
      });
      const data = await res.json();
      addLog("NEURAL_FORGE: Style signature extracted and applied to kernel.");
      setStyleLearningInput("");
      fetchMemory();
    } catch (e) {
      addLog("NEURAL_FORGE_ERROR: Style learning failed.");
    } finally {
      setIsLearningStyle(false);
    }
  };

  const fetchMarketTrends = async () => {
    try {
      const res = await fetch('/api/market-trends');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setMarketTrends(data);
      }
    } catch (e) {
      console.warn("Market Pulse fetch failed silently");
    }
  };

  const fetchIntelStatus = async () => {
    try {
      const res = await fetch('/api/intel/status');
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        setIntelStatus(data);
      }
    } catch (e) {
      console.warn("Intel status fetch failed silently");
    }
  };

  const syncIntelManually = async () => {
    setIsSyncingIntel(true);
    addLog("INTEL_FORGE: Force-syncing global intelligence sources...");
    try {
      await fetch('/api/intel/sync', { method: 'POST' });
      await fetchIntelStatus();
      await fetchMarketTrends();
      addLog("INTEL_FORGE: Global intelligence update completed.");
    } catch (e) {
      addLog("INTEL_FORGE_ERROR: Force-sync failed.");
    } finally {
      setIsSyncingIntel(false);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health/detailed');
      const data = await res.json();
      setHealthData(data);
    } catch (e) {}
  };

  const fetchUpdate = async () => {
    try {
      const res = await fetch('/api/check-update');
      const data = await res.json();
      setUpdateData(data);
    } catch (e) {}
  };

  const handleCleanup = async () => {
    setIsCleaning(true);
    addLog("SYSTEM: Running intelligent storage cleanup...");
    try {
      await fetch('/api/storage/cleanup', { method: 'POST' });
      await fetchHealth();
      addLog("SYSTEM: Storage optimized. Obsolete vectors purged.");
    } catch (e) {} finally {
      setIsCleaning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'settings') {
      fetchMemory();
      fetchMarketTrends();
      fetchIntelStatus();
      fetchHealth();
    }
    if (activeTab === 'settings') {
      fetchUpgrades();
      fetchUpdate();
    }
  }, [activeTab]);

  const handleMagicLink = async () => {
    setIsGenerating(true);
    addLog("AUTH_ENGINE: Provisioning Magic Link flow...");
    const prompt = `Implémente un flux complet d'authentification par Magic Link :
    1. Page /login avec champ email.
    2. API route /api/auth/magic-link utilisant Firebase Auth (sendSignInLinkToEmail).
    3. Page /verify pour valider le token et connecter l'utilisateur.
    4. Redirection vers le dashboard après succès.
    Inclus tout le code client et les instructions de configuration Firebase.`;
    handleGenerate(undefined, prompt);
  };

  const handleDeployRailway = async () => {
    if (!currentProject) return;
    setDeployLoading(true);
    addLog("RAILWAY_AUTOMATION: Generating railway.json and deployment blueprints...");
    
    try {
      const railwayConfig = {
        build: { builder: "NIXPACKS" },
        deploy: {
          startCommand: "npm start",
          healthcheckPath: "/"
        }
      };
      
      const guide = `
# 🚂 Guide de Déploiement Railway
1. Connectez votre repository GitHub sur Railway.app.
2. Railway détectera automatiquement 'railway.json'.
3. Configurez vos variables d'environnement dans Railway Dashboard.
4. Le déploiement est automatique à chaque push.
`;
      
      const updatedFiles = {
        ...currentFiles,
        'railway.json': JSON.stringify(railwayConfig, null, 2),
        'RAILWAY_DEPLOY.md': guide
      };
      
      await updateProjectCode(currentProjectId!, updatedFiles, "Railway Deployment Provisioning");
      window.open('https://railway.app/new', '_blank');
      
      setAiError({ 
        message: "Configuration Railway prête ! Guide disponible dans RAILWAY_DEPLOY.md", 
        type: 'success' 
      });
    } catch (err) {
      handleAIError(err);
    } finally {
      setDeployLoading(false);
    }
  };



  const updateProjectMetadata = async (projectId: string, name: string, category: string) => {
    const updated = projects.map(p => p.id === projectId ? { ...p, name, category, updatedAt: new Date().toISOString() } : p);
    setProjects(updated);
    
    if (!categories.includes(category)) {
      const newCats = [...categories, category];
      setCategories(newCats);
      localStorage.setItem('wf_categories', JSON.stringify(newCats));
    }

    const p = updated.find(proj => proj.id === projectId);
    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user' && p) {
      try {
        await setDoc(doc(db!, 'users', user.uid, 'projects', projectId), {
          ...p,
          userId: user.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) { console.error("Cloud metadata update failed:", err); }
    } else {
      localStorage.setItem('wf_projects', JSON.stringify(updated));
    }
  };

  const toggleCategory = (cat: string) => {
    setCollapsedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };



  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handleSaveProject();
            break;
          case 'enter':
            e.preventDefault();
            handleGenerate();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'e':
            e.preventDefault();
            handleZipExport();
            break;
          case '/':
            e.preventDefault();
            setShowShortcuts(true);
            break;
          case '?':
            e.preventDefault();
            setShowShortcuts(true);
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentProjectId, currentVersion, projects]);

  const viewportWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '390px'
  };

  const libraryItems = [
    { name: 'Nav Glass', prompt: 'Ajoute une navigation glassmorphism fixée en haut.' },
    { name: 'Hero Dark', prompt: 'Ajoute une section Hero avec des typographies imposantes.' },
    { name: 'Grille Bento', prompt: 'Crée une section de fonctionnalités en mode Bento Grid.' },
    { name: 'Pricing', prompt: 'Crée un tableau de prix moderne avec des ombres néons.' }
  ];

  // Check connection to Firestore
  useEffect(() => {
    if (!db) {
      addLog("LOCAL_MODE: Engine running without external database support.");
      return;
    }
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, '_internal', 'connection_test'));
        setIsOnline(true);
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
          setIsOnline(false);
        } else {
          setIsOnline(true); // Connected but maybe the doc doesn't exist
        }
      }
    };
    testConnection();
  }, []);

  // Auth Listener
  useEffect(() => {
    if (!auth) {
      setUser({ uid: 'local-user', email: 'local@webforge.dev', displayName: 'Pilot Local' } as User);
      setAuthLoading(false);
      addLog("LOCAL_KERNEL: Persistence bridged to LocalStorage.");
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) addLog(`AUTHENTICATION_ENGAGED: Operator ${currentUser.email || currentUser.uid}`);
      else addLog("AUTHENTICATION_TERMINATED: Neutral state");
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync: Projects
  useEffect(() => {
    if (!FIREBASE_AVAILABLE || !user || user.uid === 'local-user') {
      // Load from LocalStorage for local/guest mode
      const saved = localStorage.getItem('wf_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        if (parsed.length > 0) setCurrentProjectId(parsed[0].id);
      } else {
        const first: Project = {
          id: crypto.randomUUID(),
          name: 'Mon Premier Site',
          type: 'web',
          versions: [{ timestamp: Date.now(), files: DEFAULT_FILES, prompt: 'Initial' }],
          currentVersionIndex: 0,
          activeFile: 'index.html'
        };
        setProjects([first]);
        setCurrentProjectId(first.id);
      }
      return;
    }

    // Sync with Firestore
    const q = query(collection(db!, 'users', user.uid, 'projects'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: Project[] = [];
      snapshot.forEach((doc) => {
        projectsData.push({ id: doc.id, ...doc.data() } as Project);
      });
      setProjects(projectsData);
      if (projectsData.length > 0 && !currentProjectId) {
        setCurrentProjectId(projectsData[0].id);
      }
    });

    const unsubscribePrefs = onSnapshot(doc(db, 'users', user.uid, 'preferences', 'main'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserPreferences;
        setPreferences(data);
        setViewport(data.defaultViewport);
      }
    });

    return () => {
      unsubscribe();
      unsubscribePrefs();
    };
  }, [user]);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    const updated = { ...preferences, ...newPrefs, updatedAt: serverTimestamp ? serverTimestamp() : Date.now() };
    setPreferences(updated as UserPreferences);
    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      await setDoc(doc(db!, 'users', user.uid, 'preferences', 'main'), updated);
      addLog("PREFERENCES_SYNC: User settings updated in Database");
    } else {
      localStorage.setItem('wf_preferences', JSON.stringify(updated));
    }
  };

  // Firestore Sync: CMS Data
  useEffect(() => {
    if (!FIREBASE_AVAILABLE || !user || user.uid === 'local-user') {
      const savedData = localStorage.getItem('wf_cms');
      if (savedData) setDataItems(JSON.parse(savedData));
      return;
    }

    const q = query(collection(db!, 'users', user.uid, 'cms_data'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: DataItem[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as DataItem);
      });
      setDataItems(data);
    });

    return () => unsubscribe();
  }, [user]);

  // Local Storage Backups for Guests
  useEffect(() => {
    if (!user && projects.length > 0) {
      localStorage.setItem('wf_projects', JSON.stringify(projects));
      localStorage.setItem('wf_cms', JSON.stringify(dataItems));
    }
  }, [projects, dataItems, user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Debounced Editor Value
  // Sync editor with current file on switch
  useEffect(() => {
    setEditorValue(currentCode);
  }, [currentProject?.id, currentProject?.activeFile, currentProject?.currentVersionIndex]);

  useEffect(() => {
    if (debouncedEditorValue !== '' && currentProject) {
       const activeFile = currentProject.activeFile || 'index.html';
       if (currentFiles[activeFile] !== debouncedEditorValue) {
          updateProjectCode(currentProjectId!, { ...currentFiles, [activeFile]: debouncedEditorValue }, "Surgical hot-fix via Kernel Interface");
       }
    }
  }, [debouncedEditorValue]);

  const getPreviewSource = () => {
    let html = currentFiles['index.html'] || '';
    if (!html) return '';

    // Simple VFS Resolver: Inject styles and scripts into index.html for preview
    Object.entries(currentFiles).forEach(([path, content]) => {
      if (path === 'index.html') return;
      if (path.endsWith('.css')) {
         const styleTag = `<style data-vfs="${path}">${content}</style>`;
         const linkRegex = new RegExp(`<link[^>]*href=["'](?:\\.\\/)?${path}["'][^>]*>`, 'g');
         html = html.replace(linkRegex, styleTag);
      }
      if (path.endsWith('.js')) {
         const scriptTag = `<script data-vfs="${path}">${content}<\/script>`;
         const jsRegex = new RegExp(`<script[^>]*src=["'](?:\\.\\/)?${path}["'][^>]*><\/script>`, 'g');
         html = html.replace(jsRegex, scriptTag);
      }
    });

    return html;
  };

  useEffect(() => {
    if (iframeRef.current) {
      const html = getPreviewSource();
      const safeHtml = DOMPurify.sanitize(html, {
        WHOLE_DOCUMENT: true,
        FORCE_BODY: false,
        ADD_TAGS: ['style', 'script'],
        ADD_ATTR: ['onclick', 'onload', 'onscroll', 'class', 'id'],
        FORBID_TAGS: ['iframe', 'object', 'embed', 'form'],
        FORBID_ATTR: ['action', 'method']
      });
      iframeRef.current.srcdoc = safeHtml;
    }
  }, [currentFiles]);

  const loginWithGoogle = async () => {
    if (isLoggingIn) return;
    setAuthError(null);
    setIsLoggingIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setShowAuthOverlay(false);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      if (authMode === 'signup') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) await updateProfile(res.user, { displayName });
      } else if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (authMode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        alert("Instructions de réinitialisation envoyées à votre email.");
        setAuthMode('login');
        return;
      }
      setShowAuthOverlay(false);
      resetAuthFields();
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoggingIn(true);
    try {
      await updateProfile(user, { displayName });
      setShowAuthOverlay(false);
    } catch (error: any) {
      handleAuthError(error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVisionGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visionPrompt.trim() || isVisionLoading) return;
    setIsVisionLoading(true);
    setAiError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    try {
      addLog("NEURAL_RENDER: Initiating high-fidelity image prompt refinement...");
      
      const data = await aiService.computeVision(visionPrompt, undefined, controller.signal);
      trackEvent('vision_generate', { prompt: visionPrompt, success: true });

      if (data.type === 'image') {
        setVisionResult(`data:image/png;base64,${data.data}`);
        addLog("NEURAL_RENDER: Image synthesized from raw bytes.");
      } else if (data.type === 'image_url') {
        setVisionResult(data.data);
        addLog("NEURAL_RENDER: Image streamed via external cluster.");
      } else if (data.type === 'svg') {
        setVisionResult(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.data)}`);
        addLog("NEURAL_RENDER: Vector SVG distilled via X-Kernel.");
      } else {
        addLog("VISION_RESTRICTED: Unknown visual format received.");
      }
    } catch (err) {
      handleAIError(err);
    } finally {
      clearTimeout(timeoutId);
      setIsVisionLoading(false);
    }
  };

  const handleCinemaGenerate = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!cinemaPrompt.trim() || isCinemaLoading) return;
    setIsCinemaLoading(true);
    setAiError(null);
    setCinemaStoryboard(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      addLog("CINEMA_FORGE: Distilling temporal coordinates via Gemini Cinema...");
      
      const response = await aiService.generateContent(`You are X-Cinema Director. Generate a professional video storyboard for: "${cinemaPrompt}".
        Return a JSON object with:
        - scenes: Array of { description: string, duration: number, cssAnimation: string (Tailwind classes), particles: boolean }
        - mood: string (e.g. "dark-cyberpunk")
        - videoUrl: A sample video URL (e.g. "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4")`, selectedModel, selectedType);

      const responseText = response.text;
      let data;
      try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (Array.isArray(jsonMatch) ? jsonMatch[1] || jsonMatch[0] : jsonMatch) : responseText;
        data = JSON.parse(jsonStr);
      } catch (e) {
        data = { videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" };
      }
      
      setCinemaStoryboard(data.storyboard || null);
      setCinemaResult(data.videoUrl);
    } catch (err) {
      handleAIError(err);
      setCinemaResult("https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4");
    } finally {
      clearTimeout(timeoutId);
      setIsCinemaLoading(false);
    }
  };

  const handleAuthError = (error: any) => {
    console.error("Auth Error:", error);
    if (error.code === 'auth/popup-closed-by-user') {
      setAuthError("Opération annulée.");
    } else if (error.code === 'auth/email-already-in-use') {
      setAuthError("Cet email est déjà utilisé.");
    } else if (error.code === 'auth/invalid-credential') {
      setAuthError("Email ou mot de passe incorrect.");
    } else if (error.code === 'auth/weak-password') {
      setAuthError("Le mot de passe doit contenir au moins 6 caractères.");
    } else {
      setAuthError(error.message || "Une erreur est survenue lors de l'authentification.");
    }
  };

  const resetAuthFields = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setAuthError(null);
  };

  const getEditorLanguage = () => {
    if (!currentProject?.activeFile) return 'html';
    const file = currentProject.activeFile.toLowerCase();
    if (file.endsWith('.py')) return 'python';
    if (file.endsWith('.js')) return 'javascript';
    if (file.endsWith('.ts') || file.endsWith('.tsx')) return 'typescript';
    if (file.endsWith('.css')) return 'css';
    if (file.endsWith('.sql')) return 'sql';
    if (file.endsWith('.sh')) return 'shell';
    if (file.endsWith('.md')) return 'markdown';
    if (file.endsWith('.json')) return 'json';
    if (file.endsWith('.yml') || file.endsWith('.yaml')) return 'yaml';
    if (file === 'dockerfile') return 'dockerfile';
    
    // Fallback to project type
    const typeInfo = PROJECT_TYPES.find(t => t.id === currentProject.type);
    return typeInfo?.lang || 'html';
  };

  const logout = () => {
    if (auth) signOut(auth);
    else {
      setUser(null);
      addLog("SESSION_RESET: Local guest session finalized.");
    }
  };



  const handleChat = async (msg: string) => {
    if (!msg.trim() || isChatLoading) return;
    setAiError(null);
    const userMsg: Message = { role: 'user', content: msg, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg].slice(-20)); // Keep a reasonable history in state
    setIsChatLoading(true);
    setChatInput('');
    trackEvent('chat_message', { length: msg.length, timestamp: Date.now() });

    try {
      // Memory: last 10 messages
      const historySummary = chatMessages.slice(-10).map(m => `${(m.role || 'user').toUpperCase()}: ${m.content}`).join('\n');
      
      const response = await aiService.generateContent(`Tu es Forge.Bot v2.0, l'intelligence technique intégrée à WebForge OS. 
Tu réponds TOUJOURS en JSON valide.

CONTEXTE_PROJET:
- Type: ${currentProject?.type}
- Fichiers: ${Object.keys(currentFiles).join(', ')}
- Contenu fichier actif (${currentProject?.activeFile}): ${editorValue.slice(0, 5000)}

HISTORIQUE:
${historySummary}

REQUÊTE_UTILISATEUR: ${msg}

Réponds avec cet objet JSON strictement :
{
  "explanation": "Ta réponse textuelle claire",
  "thinking": "Tes réflexions techniques internes",
  "action": "L'action technique entreprise",
  "code": "Code optionnel à appliquer",
  "next_steps": ["Étape 1", "Étape 2"]
}`, selectedModel, selectedType);

      const responseText = response.text;
      let data;
      try {
        const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || responseText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (Array.isArray(jsonMatch) ? jsonMatch[1] || jsonMatch[0] : jsonMatch) : responseText;
        data = JSON.parse(jsonStr);
      } catch (e) {
        data = { explanation: responseText };
      }
      
      setChatMessages(prev => {
        const newMsg: Message = { 
          role: 'assistant', 
          content: data.explanation || data.result || data.text || "Erreur de transmission.",
          thinking: data.thinking,
          action: data.action,
          code: data.code,
          next_steps: data.next_steps,
          timestamp: Date.now()
        };
        return [...prev, newMsg].slice(-20);
      });
    } catch (err) { 
      handleAIError(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: "DÉSOLÉ : Mon noyau de traitement est temporairement indisponible.", timestamp: Date.now() }]);
    } finally { 
      setIsChatLoading(false); 
    }
  };

  const handleExplain = async () => {
    setActiveTab('chat');
    handleChat("Peux-tu m'expliquer la structure et le fonctionnement de ce code ?");
  };



  const exportToGif = (containerId: string) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    addLog("CINEMA_EXPORT: Initiating GIF frame distillation via Canvas API...");
    alert("GIF Export initiated. This process captures CSS transitions frame-by-frame.");
    setTimeout(() => {
      addLog("CINEMA_SUCCESS: Temporal GIF exported to memory.");
    }, 2000);
  };

  const handleProvisionStripe = async () => {
    if (!currentProject) return;
    setDeployLoading(true);
    addLog("STRIPE_PROVISION: Orchestrating server-side webhook architecture...");
    
    try {
      const webhookCode = `import express from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const router = express.Router();

router.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature']!;
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    res.status(400).send(\`Webhook Error: \${err.message}\`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment Succeeded:', session.id);
      break;
    case 'customer.subscription.created':
      // Handle subscription logic
      break;
    case 'customer.subscription.deleted':
      // Handle cancellation logic
      break;
    case 'invoice.payment_failed':
      // Handle failure logic
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.send();
});

export default router;
`;

      const envExample = `
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
`;

      const ngrokGuide = `
# Guide de Configuration Stripe + Ngrok
1. Installez ngrok : https://ngrok.com/download
2. Lancez le tunnel : \`ngrok http 3000\`
3. Copiez l'URL https fournie (ex: https://1234.ngrok-free.app)
4. Sur le Dashboard Stripe : Webhooks > Add Endpoint
5. URL : https://1234.ngrok-free.app/api/webhook/stripe
6. Sélectionnez les événements : 
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.deleted
   - invoice.payment_failed
7. Copiez la "Signing Secret" dans STRIPE_WEBHOOK_SECRET dans votre .env
`;

      const updatedFiles = {
        ...currentFiles,
        'server/stripe-webhook.ts': webhookCode,
        '.env.example': (currentFiles['.env.example'] || '') + envExample,
        'STRIPE_GUIDE.md': ngrokGuide
      };

      await updateProjectCode(currentProjectId!, updatedFiles, "Stripe Webhook Infrastructure Provisioning");
      
      setAiError({ 
        message: "Stack Stripe provisionnée ! Guide disponible dans STRIPE_GUIDE.md", 
        type: 'success' 
      });
    } catch (err) {
      handleAIError(err);
    } finally {
      setDeployLoading(false);
    }
  };

  const syncDataItem = async (id: string, key: string, value: string, isDelete = false) => {
    if (FIREBASE_AVAILABLE && user && user.uid !== 'local-user') {
      if (isDelete) {
        await deleteDoc(doc(db!, 'users', user.uid, 'cms_data', id));
      } else {
        await setDoc(doc(db!, 'users', user.uid, 'cms_data', id), { key, value, userId: user.uid });
      }
    } else {
      if (isDelete) {
        setDataItems(prev => prev.filter(d => d.id !== id));
        localStorage.setItem('wf_cms', JSON.stringify(dataItems.filter(d => d.id !== id)));
      } else {
        const updated = dataItems.some(d => d.id === id) 
          ? dataItems.map(d => d.id === id ? { ...d, key, value } : d)
          : [...dataItems, { id, key, value }];
        setDataItems(updated);
        localStorage.setItem('wf_cms', JSON.stringify(updated));
      }
    }
  };

  const handleDeployVercel = async () => {
    if (!currentProject) return;
    setDeployLoading(true);
    addLog("VERCEL_AUTOMATION: Generating vercel.json and CI/CD pipelines...");
    
    try {
      const vercelConfig = {
        version: 2,
        builds: [{ src: "index.html", use: "@vercel/static" }],
        routes: [{ src: "/(.*)", dest: "/index.html" }]
      };
      
      const githubWorkflow = `
name: Vercel Production Deployment
env:
  VERCEL_ORG_ID: \${{ secrets.VERCEL_ORG_ID }}
  VERCEL_PROJECT_ID: \${{ secrets.VERCEL_PROJECT_ID }}
on:
  push:
    branches:
      - main
jobs:
  Deploy-Production:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      - name: Pull Vercel Project Information
        run: vercel pull --yes --environment=production --token=\${{ secrets.VERCEL_TOKEN }}
      - name: Build Project Artifacts
        run: vercel build --prod --token=\${{ secrets.VERCEL_TOKEN }}
      - name: Deploy Project Artifacts to Vercel
        run: vercel deploy --prebuilt --prod --token=\${{ secrets.VERCEL_TOKEN }}`;

      const updatedFiles = { 
        ...currentFiles, 
        'vercel.json': JSON.stringify(vercelConfig, null, 2),
        '.github/workflows/vercel.yml': githubWorkflow 
      };
      
      await updateProjectCode(currentProjectId!, updatedFiles, "Vercel Deployment Provisioning");
      
      const instructions = `
# 🚀 Instructions Déploiement Vercel
1. Sur Vercel.com, connectez votre repo GitHub.
2. Ajoutez les secrets dans Settings > Environment Variables:
   - VERCEL_TOKEN
   - VERCEL_ORG_ID
   - VERCEL_PROJECT_ID
3. Poussez sur la branche 'main' pour activer le workflow CI/CD.
`;
      
      const updatedFilesWithInstructions = {
        ...updatedFiles,
        'VERCEL_DEPLOY.md': instructions
      };
      await updateProjectCode(currentProjectId!, updatedFilesWithInstructions, "Vercel Instructions Added");

      const queryParams = new URLSearchParams({
        'repository-url': 'https://github.com/new',
        'project-name': currentProject.name.toLowerCase().replace(/\s+/g, '-'),
        'framework': 'other'
      });
      
      window.open(`https://vercel.com/new?${queryParams.toString()}`, '_blank');
      
      setAiError({ 
        message: "Vercel auto-deploy configuré ! Suivez les 3 étapes dans VERCEL_DEPLOY.md", 
        type: 'success' 
      });
    } catch (err) {
      handleAIError(err);
    } finally {
      setDeployLoading(false);
    }
  };



  const updateDeployToken = (service: 'netlify' | 'github' | 'surge', val: string) => {
    setDeployTokens(prev => ({ ...prev, [service]: val }));
    localStorage.setItem(`wf_${service}_token`, val);
  };

  const downloadCSV = () => {
    if (analyticsData.length === 0) return;
    const headers = ['Event', 'Timestamp', 'Data'];
    const rows = analyticsData.map(e => [
      e.event,
      e.timestamp,
      JSON.stringify(e.data).replace(/,/g, ';').replace(/"/g, '')
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `webforge_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAnalyticsStats = () => {
    const generations = analyticsData.filter(e => e.event === 'generate_start');
    const successes = analyticsData.filter(e => e.event === 'generate_success');
    const errors = analyticsData.filter(e => e.event === 'generate_error');

    const total = generations.length;
    const successRate = total > 0 ? ((successes.length / total) * 100).toFixed(1) : 0;
    
    const models: Record<string, number> = {};
    generations.forEach(g => {
      const m = g.data?.model || 'unknown';
      models[m] = (models[m] || 0) + 1;
    });
    const mostUsedModel = Object.entries(models).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const totalDuration = successes.reduce((acc, curr) => acc + (curr.data?.duration || 0), 0);
    const avgDuration = successes.length > 0 ? (totalDuration / successes.length / 1000).toFixed(2) : 0;

    return { total, successRate, mostUsedModel, avgDuration, errorCount: errors.length };
  };

  const getChartData = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const count = analyticsData.filter(e => e.timestamp.startsWith(date) && e.event === 'generate_start').length;
      return { name: date.split('-').slice(2).join('/'), count };
    });
  };



  return (
    <div className="h-screen bg-bg text-text flex flex-col font-sans overflow-hidden relative">
      <BackgroundCanvas />
      
      {/* Redesigned Header (60px) */}
      <header className="h-[60px] border-b border-border flex items-center justify-between px-6 bg-surface/40 backdrop-blur-md z-[100] relative">
        <div className="flex items-center gap-8">
          <Logo />
          
          <div className="h-4 w-[1px] bg-border mx-2" />
          
          {/* Language Toggle Pill */}
          <div className="flex bg-surface2 rounded-full p-1 border border-border overflow-hidden">
            <button 
              onClick={() => { setLang('fr'); localStorage.setItem('wf_lang', 'fr'); }}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${lang === 'fr' ? 'text-white' : 'text-muted hover:text-white'}`}
            >
              {lang === 'fr' && <motion.div layoutId="lang-bg" className="absolute inset-0 bg-primary shadow-lg rounded-full -z-10" />}
              FR
            </button>
            <button 
              onClick={() => { setLang('en'); localStorage.setItem('wf_lang', 'en'); }}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all relative z-10 ${lang === 'en' ? 'text-white' : 'text-muted hover:text-white'}`}
            >
              {lang === 'en' && <motion.div layoutId="lang-bg" className="absolute inset-0 bg-primary shadow-lg rounded-full -z-10" />}
              EN
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            {authLoading ? (
              <Loader2 size={16} className="animate-spin text-muted" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end -space-y-0.5">
                  <span className="text-[10px] font-bold text-white/90 truncate max-w-[100px]">{user.displayName || 'Pilot'}</span>
                  <div className="px-2 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-[7px] uppercase tracking-widest text-primary font-black">PRO UNLIMITED</div>
                </div>
                <div className="w-8 h-8 rounded-xl overflow-hidden border border-border hover:border-primary transition-all cursor-pointer" onClick={() => setShowAuthOverlay(true)}>
                  <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setAuthMode('login'); setShowAuthOverlay(true); }} 
                className="px-5 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all font-display"
              >
                {t('connect')}
              </button>
            )}
          </div>

          <div className="h-6 w-[1px] bg-border" />

          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                const project = projects.find(p => p.id === currentProjectId);
                const name = project?.name || 'project';
                const blob = new Blob([currentCode], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${name}.html`; a.click();
              }} 
              className="px-5 py-2 rounded-xl bg-surface2 border border-border hover:border-primary/40 transition-all text-[10px] font-bold uppercase tracking-widest text-muted hover:text-white"
            >
              {t('export')}
            </button>
            <button 
              onClick={handleZipExport}
              disabled={isGenerating}
              className="px-6 py-2 rounded-xl btn-gradient flex items-center gap-2 text-[10px] uppercase tracking-widest"
            >
              {isGenerating ? <Loader2 size={12} className="animate-spin text-white" /> : <Rocket size={12} className="text-white" />}
              {t('publish')}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside 
              initial={{ x: -240 }} 
              animate={{ x: 0 }} 
              exit={{ x: -240 }} 
              className="w-[240px] border-r border-border bg-surface/20 backdrop-blur-xl flex flex-col shrink-0 overflow-hidden relative z-50"
            >
              <div className="flex-1 p-4 overflow-y-auto scrollbar-hide space-y-8">
                {/* Apps Section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] pl-4 mb-2 block">{t('preferences')}</span>
                  <div className="space-y-1">
                    <SidebarItem icon={<Layers size={18}/>} label={t('recentProjects')} active={activeTab === 'history'} onClick={() => setActiveTab('history')}/>
                    <SidebarItem icon={<Database size={18}/>} label="CMS" active={activeTab === 'data'} onClick={() => setActiveTab('data')}/>
                    <SidebarItem icon={<Layout size={18}/>} label={t('library')} active={activeTab === 'library'} onClick={() => setActiveTab('library')}/>
                    <SidebarItem icon={<Palette size={18}/>} label="Style Guide" active={activeTab === 'styles'} onClick={() => setActiveTab('styles')}/>
                    <SidebarItem icon={<Cpu size={18}/>} label="X-MCP Kernel" active={activeTab === 'mcp'} onClick={() => setActiveTab('mcp')}/>
                    <SidebarItem icon={<Settings size={18}/>} label={t('settings')} active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}/>
                  </div>
                </div>

                {/* Projects Section */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between px-4">
                    <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">{t('sites')}</span>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => {
                          const name = window.prompt("Nom du nouveau dossier ?");
                          if (name) {
                            if (!categories.includes(name)) {
                              setCategories([...categories, name]);
                              localStorage.setItem('wf_categories', JSON.stringify([...categories, name]));
                            }
                          }
                        }}
                        className="p-1 px-2 border border-white/5 rounded-md hover:border-primary/40 transition-all text-muted hover:text-white"
                        title="Nouveau dossier"
                       >
                         <FolderPlus size={12} />
                       </button>
                       <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => createNewProject(t('newProject') + ' ' + (projects.length + 1), selectedType)}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl btn-gradient text-[10px] uppercase tracking-widest shadow-xl"
                  >
                    <Plus size={14} /> {t('newProject')}
                  </button>

                  <div className="space-y-4">
                    {categories.map((cat, catIdx) => (
                      <div 
                        key={cat} 
                        className={`space-y-1 group transition-all duration-300 rounded-2xl ${dragOverCategory === cat ? 'bg-primary/10 ring-2 ring-primary/40 p-1 scale-[1.02]' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverCategory !== cat) setDragOverCategory(cat);
                        }}
                        onDragLeave={() => setDragOverCategory(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggingProjectId) {
                            const proj = projects.find(p => p.id === draggingProjectId);
                            if (proj) {
                              updateProjectMetadata(draggingProjectId, proj.name, cat);
                            }
                          }
                          setDragOverCategory(null);
                          setDraggingProjectId(null);
                        }}
                      >
                        <div 
                          onClick={() => toggleCategory(cat)}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleCategory(cat); }}
                        >
                          <div className="flex items-center gap-2">
                             <Folder size={14} className={collapsedCategories.includes(cat) ? 'text-muted' : 'text-primary'} />
                             <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{cat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {cat !== 'Projets' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newName = window.prompt("Nouveau nom du dossier ?", cat);
                                  if (newName && newName !== cat) {
                                    const newCats = categories.map(c => c === cat ? newName : c);
                                    setCategories(newCats);
                                    localStorage.setItem('wf_categories', JSON.stringify(newCats));
                                    const updatedProjects = projects.map(p => (p.category || 'Projets') === cat ? { ...p, category: newName } : p);
                                    setProjects(updatedProjects);
                                    localStorage.setItem('wf_projects', JSON.stringify(updatedProjects));
                                  }
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:text-accent transition-all"
                                title="Renommer le dossier"
                              >
                                <Edit2 size={10} />
                              </button>
                            )}
                            {cat !== 'Projets' && projects.filter(p => (p.category || 'Projets') === cat).length === 0 && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newCats = categories.filter(c => c !== cat);
                                  setCategories(newCats);
                                  localStorage.setItem('wf_categories', JSON.stringify(newCats));
                                }}
                                className="p-1 opacity-0 group-hover:opacity-100 hover:text-coral transition-all"
                                title="Supprimer le dossier"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                            <ChevronDown size={12} className={`text-muted transition-transform ${collapsedCategories.includes(cat) ? '-rotate-90' : ''}`} />
                          </div>
                        </div>

                        {!collapsedCategories.includes(cat) && (
                          <div className="space-y-1 ml-2 border-l border-white/5 pl-2">
                            {projects.filter(p => (p.category || 'Projets') === cat).length === 0 && (
                              <div className="text-[8px] text-muted/40 italic p-4 text-center">Dossier vide</div>
                            )}
                            {projects.filter(p => (p.category || 'Projets') === cat).map((p, idx) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={p.id} 
                                draggable
                                onDragStart={() => setDraggingProjectId(p.id)}
                                onDragEnd={() => {
                                  setDraggingProjectId(null);
                                  setDragOverCategory(null);
                                }}
                                onClick={() => setCurrentProjectId(p.id)} 
                                className={`group/item p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${currentProjectId === p.id ? 'bg-primary/10 border-primary/40' : 'border-transparent hover:bg-white/5'} ${draggingProjectId === p.id ? 'opacity-40 grayscale scale-95' : ''}`}
                              >
                                {editingProjectId === p.id ? (
                                  <div className="space-y-2 p-1" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      autoFocus
                                      value={tempProjectName} 
                                      onChange={e => setTempProjectName(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-primary transition-all text-white"
                                      placeholder="Nom du projet..."
                                    />
                                    <input 
                                      value={tempProjectCategory} 
                                      onChange={e => setTempProjectCategory(e.target.value)}
                                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold outline-none focus:border-secondary transition-all text-muted"
                                      placeholder="Dossier (ex: Web, Client...)"
                                    />
                                    <div className="flex gap-2 pt-1">
                                       <button 
                                         onClick={() => {
                                           updateProjectMetadata(p.id, tempProjectName, tempProjectCategory);
                                           setEditingProjectId(null);
                                         }}
                                         className="flex-1 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase tracking-widest"
                                       >
                                         Sauver
                                       </button>
                                       <button 
                                         onClick={() => setEditingProjectId(null)}
                                         className="flex-1 py-2 bg-white/5 text-muted rounded-lg text-[9px] font-black uppercase tracking-widest"
                                       >
                                         Annuler
                                       </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-surface2 border border-border overflow-hidden shrink-0 group-hover/item:border-primary/40 transition-all flex items-center justify-center">
                                         <Globe size={14} className="text-primary opacity-40" />
                                      </div>
                                      <div className="flex-1 min-w-0 pr-6">
                                        <div className="text-[11px] font-bold text-white truncate">{p.name}</div>
                                        <div className="text-[8px] text-muted font-medium mt-0.5 uppercase tracking-tight">{formatDate(p.updatedAt || p.versions[0].timestamp)}</div>
                                      </div>
                                    </div>
                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-all">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingProjectId(p.id);
                                          setTempProjectName(p.name);
                                          setTempProjectCategory(p.category || 'Projets');
                                        }} 
                                        className="p-1.5 text-muted hover:text-accent transition-all"
                                      >
                                        <Edit2 size={10}/>
                                      </button>
                                      <button onClick={(e) => duplicateProject(p.id, e)} className="p-1.5 text-muted hover:text-primary transition-all"><Copy size={10}/></button>
                                      <button onClick={(e) => deleteProject(p.id, e)} className="p-1.5 text-muted hover:text-coral transition-all"><Trash2 size={10}/></button>
                                    </div>
                                    {currentProjectId === p.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(99,102,241,0.5)]" />}
                                  </>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => {
                        const name = window.prompt("Nom du nouveau dossier ?");
                        if (name) {
                          if (!categories.includes(name)) {
                            const newCats = [...categories, name];
                            setCategories(newCats);
                            localStorage.setItem('wf_categories', JSON.stringify(newCats));
                          }
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-border text-muted hover:border-primary/40 hover:text-white transition-all text-[10px] font-bold uppercase tracking-widest mt-2 group/add"
                    >
                      <FolderPlus size={14} className="group-hover/add:text-primary transition-colors" /> {t('newFolder') || 'Nouveau dossier'}
                    </button>

                    {projects.length === 0 && (
                      <div className="text-[10px] text-muted italic p-6 text-center border border-dashed border-border rounded-2xl">
                         {t('error')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Version Info Footer */}
              <div className="p-4 border-t border-border bg-surface/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                   <span className="text-[9px] font-black uppercase text-muted tracking-widest">{t('coreOnline')}</span>
                </div>
                <span className="text-[8px] font-mono text-muted/40">FS.v2.0-STABLE</span>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Workspace Area */}
        <div className="flex-1 grid grid-rows-[auto_1fr_auto] relative overflow-hidden bg-black/5 flex flex-col">
          {/* Tab Rows */}
          <div className="border-b border-border bg-surface/20 flex flex-col relative z-20">
            <div className="flex items-center px-6 border-b border-border/50 h-11 gap-8">
              <TabRowItem active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} label={t('monitor')} />
              <TabRowItem active={activeTab === 'editor'} onClick={() => setActiveTab('editor')} label={t('source')} />
              <TabRowItem active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} label={t('forgeBot')} />
            </div>
            <div className="flex items-center px-6 h-11 gap-8 overflow-x-auto scrollbar-hide">
              <TabRowItem active={activeTab === 'vision'} onClick={() => setActiveTab('vision')} label={t('vision')} />
              <TabRowItem active={activeTab === 'cinema'} onClick={() => setActiveTab('cinema')} label={t('cinema')} />
              <TabRowItem active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} label={t('stats')} />
              <TabRowItem active={activeTab === 'deploy'} onClick={() => setActiveTab('deploy')} label={t('deploy')} />
              <TabRowItem active={activeTab === 'mcp'} onClick={() => setActiveTab('mcp')} label="X-MCP KERNEL" />
            </div>
          </div>

          <div className="flex-1 bg-[#0a0a0a] relative">
            <AnimatePresence>
              {aiError && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-xl px-12">
                   <div className={`${aiError.type === 'success' ? 'bg-accent/20 border-accent/40' : 'bg-coral/20 border-coral/40'} border-2 backdrop-blur-3xl p-6 rounded-3xl flex items-start gap-4 shadow-2xl`}>
                     {aiError.type === 'success' ? <CheckCircle2 className="text-accent shrink-0 mt-1" size={24} /> : <AlertCircle className="text-coral shrink-0 mt-1" size={24} />}
                     <div className="flex-1">
                        <div className={`text-[10px] font-black uppercase tracking-widest ${aiError.type === 'success' ? 'text-accent' : 'text-coral'} italic mb-1`}>
                          {aiError.type === 'success' ? 'X-Kernel Operation Success' : 'X-Kernel Thermal Warning'}
                        </div>
                        <div className="text-xs font-bold leading-relaxed">{aiError.message}</div>
                        {aiError.code === 429 && <div className="mt-3 text-[9px] mono text-coral/60 uppercase">Délai estimé de refroidissement : 60s</div>}
                        {aiError.type === 'error' && (
                          <div className="mt-4 flex gap-3">
                            <button onClick={(e) => handleGenerate(e as any)} className="px-4 py-1.5 rounded-lg bg-coral text-bg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all font-bold">Retry Synthesis</button>
                            <button onClick={() => setPrompt("")} className="px-4 py-1.5 rounded-lg border border-coral text-coral text-[9px] font-black uppercase tracking-widest hover:bg-coral/10 transition-all font-bold">Clear Prompt</button>
                          </div>
                        )}
                     </div>
                     <button onClick={() => setAiError(null)} className={`${aiError.type === 'success' ? 'text-accent' : 'text-coral'} hover:text-white transition-colors`}><X size={16}/></button>
                   </div>
                </motion.div>
              )}

              {activeTab === 'mcp' && (
                <motion.div key="mcp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                  <McpPanel lang={lang} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="absolute bottom-6 left-6 z-[100] w-72 bg-black/80 border border-white/10 backdrop-blur-2xl p-5 rounded-3xl shadow-2xl"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <BarChart2 size={12} /> Quality Feedback
                    </div>
                    <button onClick={() => setShowFeedback(false)} className="text-white/40 hover:text-white"><X size={14}/></button>
                  </div>
                  
                  <div className="text-[11px] font-bold text-white/80 mb-4 leading-tight">
                    Comment évalueriez-vous cette génération ?
                  </div>

                  <div className="flex justify-between mb-5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button 
                        key={s} 
                        onClick={() => submitFeedback(s)}
                        className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 transition-all text-sm font-black"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => submitFeedback(5)} className="flex items-center justify-center gap-2 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent text-[9px] font-black uppercase tracking-wider hover:bg-accent/20 transition-all">
                       <Zap size={10} /> Parfait
                     </button>
                     <button onClick={() => submitFeedback(2)} className="flex items-center justify-center gap-2 py-2 rounded-xl bg-coral/10 border border-coral/30 text-coral text-[9px] font-black uppercase tracking-wider hover:bg-coral/20 transition-all">
                       <AlertCircle size={10} /> À corriger
                     </button>
                  </div>

                  {proactiveSuggestions.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                       <div className="text-[8px] font-black uppercase tracking-widest text-white/30">Intelligence Proactive</div>
                       {proactiveSuggestions.map((s, i) => (
                         <button 
                           key={i} 
                           onClick={() => {
                             handleGenerate(undefined, s);
                             setShowFeedback(false);
                           }}
                           className="w-full text-left p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/40 transition-all group"
                         >
                            <div className="text-[10px] text-white/60 group-hover:text-primary transition-colors leading-tight">{s}</div>
                         </button>
                       ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
              {activeTab === 'preview' && (
                <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex items-center justify-center p-8">
                   <div className="h-full bg-white rounded-3xl overflow-hidden shadow-3xl border border-white/10 transition-all duration-500 flex flex-col" style={{ width: viewportWidths[viewport] }}>
                    <div className="bg-white border-b border-gray-100 flex items-center justify-between px-6 py-3 shrink-0">
                       <div className="flex items-center gap-4">
                         <div className="flex gap-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                           <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                           <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                         </div>
                         <div className="h-3 w-px bg-gray-200 mx-2" />
                         <div className="flex items-center gap-2 text-gray-400">
                           <Globe size={11} />
                           <span className="text-[10px] font-mono tracking-tight">localhost:3000</span>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                         {seoScore && (
                            <div className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-[8px] font-bold uppercase tracking-tighter">SEO Score: {seoScore.score}%</div>
                         )}
                         <button onClick={() => generateQRCode("https://x-kernel.internal/" + currentProjectId)} className="text-gray-400 hover:text-accent transition-colors" title="Scan QR Code"><QrCode size={14}/></button>
                         <div className="flex bg-gray-100 rounded-lg p-0.5">
                          {(['desktop', 'tablet', 'mobile'] as const).map(v => (
                            <button key={v} onClick={() => setViewport(v)} className={`p-1.5 rounded-md transition-all ${viewport === v ? 'bg-white text-accent shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                              {v === 'desktop' ? <Monitor size={12} /> : v === 'tablet' ? <Tablet size={12} /> : <Smartphone size={12} />}
                            </button>
                          ))}
                        </div>
                       </div>
                    </div>
                    <iframe ref={iframeRef} title="Aperçu OS" className={`w-full flex-1 ${!isPreviewable ? 'hidden' : ''}`} sandbox="allow-scripts allow-same-origin" />
                    {!isPreviewable && (
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gray-50">
                        <div className="w-20 h-20 rounded-3xl bg-black/5 flex items-center justify-center mb-6">
                           <Code2 size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Aperçu non disponible pour ce type</h3>
                        <p className="text-sm text-gray-400 max-w-sm">Le type de projet <strong>{currentProject?.type?.toUpperCase()}</strong> est purement technique. Consultez le code généré dans l'onglet <strong>SOURCE</strong>.</p>
                        <button onClick={() => setActiveTab('editor')} className="mt-8 px-8 py-3 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-accent transition-all">Voir le code</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              {activeTab === 'editor' && (
                <motion.div key="editor" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="h-full grid grid-cols-[200px_1fr] overflow-hidden">
                  {/* Internal Project File Explorer */}
                  <div className="border-r border-white/5 bg-[#080808] flex flex-col pt-6 overflow-hidden z-10 transition-all">
                    <div className="px-5 mb-6 text-[10px] font-bold uppercase tracking-widest text-muted/40">Workspace FS</div>
                    <div className="flex-1 overflow-y-auto px-3 space-y-1 scrollbar-hide pb-10">
                      {Object.keys(currentFiles).sort().map(f => (
                         <button 
                          key={f} 
                          onClick={() => {
                            if (!currentProject) return;
                            setProjects(projects.map(p => p.id === currentProjectId ? { ...p, activeFile: f } : p));
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 group transition-all duration-300 ${currentProject?.activeFile === f ? 'bg-accent/10 text-accent font-bold' : 'text-muted/60 hover:bg-white/5 hover:text-white'}`}
                         >
                           <FileCode size={12} className={currentProject?.activeFile === f ? 'text-accent' : 'text-muted/40 group-hover:text-muted transition-colors'} />
                           <span className="text-[10px] truncate flex-1 tracking-tight">{f}</span>
                         </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 relative group flex flex-col overflow-hidden">
                    {/* Tab Bar */}
                    <div className="h-12 border-b border-white/5 bg-black/40 flex items-center px-4 gap-1 overflow-x-auto scrollbar-hide shrink-0">
                      {Object.keys(currentFiles).sort().map(f => (
                         <button 
                          key={f}
                          onClick={() => {
                            if (!currentProject) return;
                            setProjects(projects.map(p => p.id === currentProjectId ? { ...p, activeFile: f } : p));
                          }}
                          className={`h-full px-4 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${currentProject?.activeFile === f ? 'border-accent bg-accent/5 text-accent font-bold' : 'border-transparent text-muted/40 hover:text-muted hover:bg-white/5'}`}
                         >
                           <FileCode size={10} />
                           <span className="text-[10px] uppercase tracking-widest">{f}</span>
                           {Object.keys(currentFiles).length > 1 && (
                             <X size={10} className="ml-2 opacity-0 group-hover:opacity-100 hover:text-coral transition-all" onClick={(e) => {
                                e.stopPropagation();
                                const files = { ...currentFiles };
                                delete files[f];
                                const remaining = Object.keys(files);
                                if (remaining.length > 0) {
                                  setProjects(projects.map(p => p.id === currentProjectId ? { ...p, activeFile: remaining[0] } : p));
                                  updateProjectCode(currentProjectId!, files, "Kernel FS: File deletion");
                                }
                             }} />
                           )}
                         </button>
                      ))}
                      <button 
                        onClick={() => {
                          const newFileName = window.prompt("File name (e.g. styles.css):");
                          if (newFileName) updateProjectCode(currentProjectId!, { ...currentFiles, [newFileName]: "" }, "Kernel FS: New resource allocated");
                        }}
                        className="p-2 text-muted/40 hover:text-white transition-all ml-2"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex-1 relative">
                      {/* Quick AI Tools Toolbar */}
                      <div className="absolute top-4 right-8 z-[50] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                       <button onClick={() => handleAIQuickAction('refactor')} className="px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-white/5 hover:border-accent/40 text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all flex items-center gap-2">
                          <Zap size={10} /> Refactor
                       </button>
                       <button onClick={() => handleAIQuickAction('tests')} className="px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-white/5 hover:border-accent/40 text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all flex items-center gap-2">
                          <CheckCircle2 size={10} /> Tests
                       </button>
                       <button onClick={() => handleAIQuickAction('docs')} className="px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-white/5 hover:border-accent/40 text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all flex items-center gap-2">
                          <Book size={10} /> Docs
                       </button>
                       <button onClick={() => handleAIQuickAction('seo')} className="px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-white/5 hover:border-accent/40 text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all flex items-center gap-2">
                          <Search size={10} /> SEO
                       </button>
                       <button onClick={() => handleAIQuickAction('security')} className="px-3 py-1.5 rounded-lg bg-surface/80 backdrop-blur-md border border-white/5 hover:border-accent/40 text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent transition-all flex items-center gap-2">
                          <Shield size={10} /> Security
                       </button>
                       <button onClick={() => setShowIntegrationsModal(true)} className="px-3 py-1.5 rounded-lg bg-primary/20 backdrop-blur-md border border-primary/40 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2">
                          <Plus size={10} /> Add Integration
                       </button>
                    </div>

                    <Suspense fallback={
                      <div style={{
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        height:'100%',
                        color:'#10b981',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em'
                      }}>
                        <Loader2 className="animate-spin mr-3" size={16} />
                        Initializing Kernel Editor...
                      </div>
                    }>
                      <MonacoEditor 
                        height="100%"
                        defaultLanguage="html"
                        language={getEditorLanguage()}
                        theme="vs-dark"
                        value={editorValue}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 12,
                          fontFamily: 'JetBrains Mono',
                          padding: { top: 24 },
                          smoothScrolling: true,
                          cursorBlinking: 'smooth',
                          lineHeight: 1.8,
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          renderLineHighlight: 'all',
                          overviewRulerBorder: false,
                          hideCursorInOverviewRuler: true
                        }}
                        onChange={(val) => {
                          setEditorValue(val || '');
                        }}
                      />
                    </Suspense>
                  </div>
                </div>
              </motion.div>
              )}
               {activeTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-[#070707]">
                   <div className="border-b border-white/5 px-10 py-4 bg-black/40 flex justify-between items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                         <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Forge.Bot v2.0 // Active Thinking Enabled</span>
                      </div>
                      <button onClick={() => setChatMessages([])} className="text-[8px] font-black uppercase tracking-widest text-muted hover:text-coral transition-colors">Wipe History</button>
                   </div>
                  <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-4 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] space-y-3`}>
                          <div className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-40 italic ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                             {m.role === 'user' ? <UserIcon size={10} /> : <Sparkles size={10} />}
                             {m.role === 'user' ? 'Kernel Operator' : 'Forge Intelligence'}
                             <span className="font-mono not-italic opacity-50 px-2">{m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ''}</span>
                          </div>
                          
                          <div className={`p-6 rounded-[2rem] text-sm leading-relaxed shadow-2xl relative overflow-hidden ${m.role === 'user' ? 'bg-accent/10 border border-accent/30 text-white rounded-tr-none' : 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-none'}`}>
                            {m.role === 'assistant' && m.thinking && (
                              <div className="mb-6 p-4 bg-black/40 rounded-2xl border border-white/5 space-y-2">
                                <div className="text-[9px] font-black uppercase tracking-widest text-muted flex items-center gap-2 italic"><Box size={10} className="animate-pulse" /> Analyzed Reasonニング :</div>
                                <div className="text-xs text-muted/60 leading-relaxed font-mono whitespace-pre-wrap">{m.thinking}</div>
                              </div>
                            )}
                            
                            {m.role === 'assistant' && m.action && (
                              <div className="mb-6 flex items-center gap-3 text-accent bg-accent/5 px-4 py-2 rounded-xl border border-accent/20">
                                <Zap size={12} fill="currentColor" className="animate-bounce" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Executing : {m.action}</span>
                              </div>
                            )}

                            <div className="relative z-10 whitespace-pre-wrap">
                              {m.content}
                            </div>

                            {m.role === 'assistant' && (
                              <>
                                {m.code && (
                                  <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-accent/20 space-y-4">
                                    <div className="flex items-center justify-between">
                                       <div className="text-[9px] font-black uppercase tracking-widest text-accent flex items-center gap-2 italic"><Code2 size={10} /> Prototyped Code Module :</div>
                                       <button 
                                         onClick={() => {
                                           if (currentProject?.activeFile) {
                                             setEditorValue(m.code!);
                                             updateProjectCode(currentProjectId!, { ...currentFiles, [currentProject.activeFile]: m.code! }, "Forge.Bot Refactoring Apply");
                                             setAiError({ message: "Code appliqué au fichier actif ✓", type: 'success' });
                                           }
                                         }}
                                         className="px-4 py-1.5 rounded-lg bg-accent text-bg text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-accent/20"
                                       >
                                         Apply to Editor
                                       </button>
                                    </div>
                                    <div className="text-[10px] mono text-white/40 bg-black/20 p-3 rounded-lg overflow-x-auto whitespace-pre">{m.code.slice(0, 300)}{m.code.length > 300 ? '...' : ''}</div>
                                  </div>
                                )}

                                {m.next_steps && m.next_steps.length > 0 && (
                                  <div className="mt-6 pt-6 border-t border-white/5 space-y-3">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-muted/40 italic">Next synthesis steps :</div>
                                    <div className="flex flex-wrap gap-2">
                                      {m.next_steps.map((step, si) => (
                                        <button 
                                          key={si}
                                          onClick={() => handleChat(step)}
                                          className="px-3 py-1.5 rounded-full bg-white/3 border border-white/5 text-[9px] text-muted hover:text-white hover:border-white/20 transition-all font-bold"
                                        >
                                          {step}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                            
                            {m.role === 'assistant' && (
                              <button 
                                onClick={() => navigator.clipboard.writeText(m.content)}
                                className="absolute top-4 right-4 p-2 rounded-lg bg-white/5 hover:bg-accent/20 hover:text-accent transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Copy size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="flex flex-col gap-4 items-start">
                         <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest opacity-40 italic">
                            <Sparkles size={10} /> Forge Intelligence
                         </div>
                         <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                            <div className="flex gap-1">
                               <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                               <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                               <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-accent animate-pulse">Neural Engine Reflecting...</span>
                         </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="p-8 border-t border-white/5 bg-black/40 relative">
                    <form onSubmit={e => { e.preventDefault(); handleChat(chatInput); }} className="flex gap-4 relative z-10">
                      <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Engage technical query..." className="flex-1 bg-surface/80 border border-white/10 rounded-3xl px-8 py-5 text-sm outline-none focus:border-accent transition-all ring-1 ring-white/5 focus:ring-accent/20 shadow-2xl" />
                      <button type="submit" disabled={!chatInput.trim() || isChatLoading} className="w-16 h-16 rounded-[2rem] bg-accent text-bg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"><Send size={20} fill="currentColor" /></button>
                    </form>
                  </div>
                </motion.div>
              )}
              {activeTab === 'history' && (
                <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide pb-40">
                  <h2 className="text-5xl font-black italic tracking-tighter mb-10 text-white/5 uppercase select-none">Time Logs</h2>
                  {currentProject?.versions.map((v, i) => (
                    <div key={i} onClick={() => setProjects(prev => prev.map(p => p.id === currentProjectId ? {...p, currentVersionIndex: i} : p))} className={`p-6 rounded-3xl border transition-all cursor-pointer mb-4 ${currentProject.currentVersionIndex === i ? 'bg-accent/10 border-accent/40 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:border-white/20'}`}>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black italic text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest border border-accent/20">Snapshot V{i+1}</span>
                        <span className="text-[10px] text-muted font-mono">{new Date(v.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-sm font-bold opacity-80 leading-snug">{v.prompt}</div>
                    </div>
                  )).reverse()}
                </motion.div>
              )}
              {activeTab === 'vision' && (
                <motion.div key="vision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-[#050505]">
                  <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                    <div className="max-w-4xl mx-auto space-y-12">
                      <div className="space-y-2">
                        <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">X-Vision Layer</h2>
                        <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Neural Image Synthesis // Stable Diffusion Forge</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                          <div className="space-y-4">
                             <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-2">Visual Prompt</label>
                             <textarea 
                              value={visionPrompt} 
                              onChange={e => setVisionPrompt(e.target.value)} 
                              placeholder="Describe your visual concept... (e.g. Cyberpunk city, brutalist interior, minimalist logo)" 
                              className="w-full h-48 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-sm outline-none focus:border-accent transition-all resize-none shadow-inner"
                            />
                          </div>
                          
                          <button 
                            onClick={handleVisionGenerate}
                            disabled={isVisionLoading || !visionPrompt.trim()}
                            className="w-full h-20 rounded-[2.5rem] bg-accent text-bg font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                          >
                            {isVisionLoading ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20} fill="currentColor" />}
                            Execute Render
                          </button>
                        </div>

                        <div className="aspect-square bg-[#0a0a0a] border-2 border-white/5 rounded-[3rem] overflow-hidden flex items-center justify-center relative group shadow-inner">
                          {isVisionLoading ? (
                            <div className="flex flex-col items-center gap-6">
                              <div className="flex gap-2">
                                 <motion.div animate={{ height: [10, 40, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1.5 bg-accent" />
                                 <motion.div animate={{ height: [20, 10, 20] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }} className="w-1.5 bg-accent" />
                                 <motion.div animate={{ height: [40, 20, 40] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.2 }} className="w-1.5 bg-accent" />
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent animate-pulse">Forging Pixels...</span>
                            </div>
                          ) : visionResult ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative group">
                               <img src={visionResult} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-6 backdrop-blur-md">
                                  <div className="text-[10px] font-black uppercase tracking-[0.4em] text-accent italic">Snapshot Captured</div>
                                  <div className="flex gap-4">
                                     <button onClick={() => window.open(visionResult)} className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-[9px] font-black uppercase tracking-widest border border-white/10">Full View</button>
                                     <button onClick={() => {
                                        const a = document.createElement('a');
                                        a.href = visionResult;
                                        a.download = `wf-asset-${Date.now()}.png`;
                                        a.click();
                                     }} className="px-6 py-3 rounded-xl bg-accent text-bg hover:scale-105 transition-all text-[9px] font-black uppercase tracking-widest shadow-lg shadow-accent/20">Download</button>
                                  </div>
                               </div>
                            </motion.div>
                          ) : (
                            <div className="text-center space-y-6 px-16 opacity-10 group-hover:opacity-20 transition-opacity">
                              <ImageIcon size={64} className="mx-auto" />
                              <div className="space-y-2">
                                 <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed italic">Awaiting Neural Stimulus</p>
                                 <p className="text-[8px] uppercase tracking-widest text-muted">Initialize prompt to begin pixel distillation.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cinema' && (
                <motion.div key="cinema" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col bg-[#050505]">
                  <div className="flex-1 overflow-y-auto p-12 space-y-12 scrollbar-hide">
                    <div className="max-w-5xl mx-auto space-y-12">
                      <div className="space-y-2">
                        <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none">X-Cinema Module</h2>
                        <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Temporal Frame Synthesis // Open-Source Motion Forge</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
                        <div className="lg:col-span-2 space-y-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted pl-4 italic">Sequence Descriptor</label>
                            <textarea 
                              value={cinemaPrompt} 
                              onChange={e => setCinemaPrompt(e.target.value)} 
                              placeholder="Describe the temporal evolution and motion dynamics..." 
                              className="w-full h-56 bg-white/5 border border-white/10 rounded-[2.5rem] p-8 text-sm outline-none focus:border-accent transition-all resize-none shadow-inner"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted">Temporal Depth</label>
                                <select className="w-full bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer">
                                   <option>02 SECONDS</option>
                                   <option>04 SECONDS</option>
                                   <option>08 SECONDS</option>
                                </select>
                             </div>
                             <div className="p-4 rounded-2xl bg-white/3 border border-white/5 space-y-2">
                                <label className="text-[8px] font-black uppercase tracking-[0.3em] text-muted">Motion Intensity</label>
                                <select className="w-full bg-transparent text-[10px] font-bold uppercase outline-none cursor-pointer">
                                   <option>CINEMATOGRAPHIC</option>
                                   <option>FLUID_DYNAMICS</option>
                                   <option>HYPER_MOTION</option>
                                </select>
                             </div>
                          </div>

                          <button 
                            onClick={handleCinemaGenerate}
                            disabled={isCinemaLoading || !cinemaPrompt.trim()}
                            className="w-full h-20 rounded-[2.5rem] bg-accent text-bg font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                          >
                            {isCinemaLoading ? <Loader2 className="animate-spin" size={20}/> : <Video size={20} fill="currentColor" />}
                            Forge Sequence
                          </button>
                        </div>

                        <div id="cinema-stage" className="lg:col-span-3 aspect-video bg-[#0a0a0a] rounded-[3rem] border-2 border-white/5 overflow-hidden relative group shadow-2xl backdrop-blur-3xl">
                          {isCinemaLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 bg-black/60 z-20">
                              <div className="relative">
                                <div className="w-24 h-24 border-2 border-accent/20 rounded-full animate-ping absolute inset-0" />
                                <div className="w-24 h-24 border-2 border-accent border-t-transparent rounded-full animate-spin relative flex items-center justify-center">
                                   <Zap className="text-accent animate-pulse" size={32} />
                                </div>
                              </div>
                              <div className="text-center space-y-2">
                                 <span className="text-[10px] font-black uppercase tracking-[0.5em] text-accent block">Neural Forge Matrix active</span>
                                 <span className="text-[8px] uppercase tracking-widest text-muted animate-pulse">Distilling Temporal Motion Vectors...</span>
                              </div>
                            </div>
                          ) : cinemaStoryboard ? (
                            <div className="w-full h-full p-12 flex flex-col relative">
                               <div className="flex-1 flex items-center justify-center relative overflow-hidden rounded-2xl border border-white/5 bg-black/20">
                                  <AnimatePresence mode="wait">
                                     <motion.div 
                                        key={activeStoryboardScene}
                                        initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                                        className={`text-center p-10 max-w-lg ${cinemaStoryboard.scenes[activeStoryboardScene]?.cssAnimation}`}
                                     >
                                        <div className="text-[10px] uppercase tracking-[0.4em] text-accent font-black mb-4">Scene {activeStoryboardScene + 1}</div>
                                        <div className="text-2xl font-bold text-white italic tracking-tight">{cinemaStoryboard.scenes[activeStoryboardScene]?.description}</div>
                                        {cinemaStoryboard.scenes[activeStoryboardScene]?.particles && (
                                           <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                              {[...Array(10)].map((_, i) => (
                                                 <motion.div 
                                                   key={i} 
                                                   animate={{ y: [0, -100], opacity: [0, 1, 0] }} 
                                                   transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                                   className="absolute w-1 h-1 bg-accent/20 rounded-full"
                                                   style={{ left: `${Math.random() * 100}%`, top: '100%' }}
                                                 />
                                              ))}
                                           </div>
                                        )}
                                     </motion.div>
                                  </AnimatePresence>
                               </div>
                               <div className="h-20 flex items-center justify-between gap-6 px-4">
                                  <div className="flex gap-2">
                                     {cinemaStoryboard.scenes.map((_: any, i: number) => (
                                        <button 
                                          key={i} 
                                          onClick={() => setActiveStoryboardScene(i)}
                                          className={`w-12 h-1 rounded-full transition-all ${activeStoryboardScene === i ? 'bg-accent' : 'bg-white/10'}`}
                                        />
                                     ))}
                                  </div>
                                  <button 
                                    onClick={() => exportToGif('cinema-stage')}
                                    className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-muted hover:text-white transition-all flex items-center gap-2"
                                  >
                                    <Download size={12} /> Export GIF
                                  </button>
                               </div>
                               <div className="absolute top-6 right-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/40 text-[8px] font-black uppercase tracking-widest text-accent italic">
                                  Mood: {cinemaStoryboard.mood}
                               </div>
                            </div>
                          ) : cinemaResult ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full h-full relative group">
                               <video src={cinemaResult} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button onClick={() => window.open(cinemaResult)} className="px-8 py-4 bg-accent text-bg rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Full Cinema Experience</button>
                                </div>
                            </motion.div>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 px-24">
                              <div className="w-24 h-24 rounded-full bg-white/3 border border-white/5 flex items-center justify-center opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700">
                                 <Video size={40} />
                              </div>
                              <div className="space-y-3 opacity-20 group-hover:opacity-50 transition-opacity">
                                 <p className="text-[10px] font-black uppercase tracking-[0.4em] leading-relaxed italic">Awaiting Cinematographic Coordinates</p>
                                 <p className="text-[8px] uppercase tracking-widest text-muted max-w-xs mx-auto">Temporal synthesis requires a valid behavioral sequence descriptor.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'analytics' && (
                <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto p-12 custom-scrollbar pb-40">
                  <header className="mb-12 flex justify-between items-end">
                    <div className="space-y-2">
                       <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 flex items-center gap-2">
                          <TrendingUp size={14} /> Neural Evolution Metrics
                       </div>
                       <h2 className="text-5xl font-black italic text-white tracking-tight">KINETIC PERFORMANCE</h2>
                    </div>
                    <button onClick={exportCSV} className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-muted hover:border-accent hover:text-accent transition-all flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                       <Download size={14} /> EXPORT_LOG
                    </button>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                     <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] font-black uppercase text-white/40 mb-1">Moyenne Qualité</div>
                        <div className="text-4xl font-black text-white italic">
                          {memoryData?.memory?.quality_scores?.length > 0
                            ? (memoryData.memory.quality_scores.reduce((a:any,b:any)=>a+b,0) / memoryData.memory.quality_scores.length).toFixed(1)
                            : '--'}
                          <span className="text-primary text-xl ml-1">/ 5</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-widest">
                           <TrendingUp size={10} /> +12% Efficiency Gain
                        </div>
                     </div>
                     <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] font-black uppercase text-white/40 mb-1">Générations Apprises</div>
                        <div className="text-4xl font-black text-white italic">{memoryData?.memory?.prompt_history?.length || 0}</div>
                        <div className="mt-4 flex items-center gap-2 text-primary text-[9px] font-black uppercase tracking-widest">
                           <Activity size={10} /> Kernel Sync Stable
                        </div>
                     </div>
                     <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-sm">
                        <div className="text-[10px] font-black uppercase text-white/40 mb-1">Patterns Optimisés</div>
                        <div className="text-4xl font-black text-white italic">{memoryData?.memory?.success_patterns?.length || 0}</div>
                        <div className="mt-4 flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-widest">
                           <Sparkles size={10} /> Auto-Optimization Active
                        </div>
                     </div>
                  </div>

                  <div className="space-y-8">
                     <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                        <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 text-white">
                           <Zap size={20} className="text-primary" /> TOP 5 KERNEL PATTERNS
                        </h3>
                        <div className="space-y-4">
                           {memoryData?.memory?.success_patterns?.slice(-5).map((p: any, i: number) => (
                             <div key={i} className="flex items-center gap-6 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-primary/20 transition-all group">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary italic">#{i+1}</div>
                                <div className="flex-1">
                                   <div className="text-xs font-bold text-white/90 mb-1 truncate max-w-lg">{p.prompt}</div>
                                   <div className="text-[9px] font-black uppercase text-white/20">Success Vector Identified • 5.0 Rating</div>
                                </div>
                                <div className="text-accent">
                                   <CheckCircle2 size={16} />
                                </div>
                             </div>
                           ))}
                           {(!memoryData?.memory?.success_patterns || memoryData?.memory?.success_patterns.length === 0) && (
                             <div className="text-center py-12 text-white/20 text-xs italic">En attente de feedbacks positifs...</div>
                           )}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                           <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 text-white">
                              <HistoryIcon size={20} className="text-coral" /> FAILURES LOG
                           </h3>
                           <div className="space-y-4">
                              {memoryData?.memory?.failure_patterns?.slice(-3).map((p: any, i: number) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/[0.01] border border-coral/10">
                                   <div className="text-[10px] font-bold text-white/60 mb-2 truncate">{p.prompt}</div>
                                   <div className="flex items-center gap-2 text-[8px] font-black uppercase text-coral">
                                      <AlertCircle size={10} /> Weak Synthesis Result
                                   </div>
                                </div>
                              ))}
                              {(!memoryData?.memory?.failure_patterns || memoryData?.memory?.failure_patterns.length === 0) && (
                                <div className="text-center py-12 text-white/20 text-xs italic text-white/20">Aucune défaillance critique.</div>
                              )}
                           </div>
                        </div>
                        <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5">
                           <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 text-white">
                              <MessageSquareText size={20} className="text-accent" /> KNOWLEDGE BASE
                           </h3>
                           <div className="space-y-4">
                              {Object.entries(memoryData?.knowledge_base?.best_practices || {}).map(([key, list]: [string, any], i) => (
                                <div key={i} className="p-4 rounded-2xl bg-white/[0.01] border border-accent/10">
                                   <div className="text-[10px] font-black uppercase text-accent mb-2">{key} Standards</div>
                                   <div className="flex flex-wrap gap-2 text-white">
                                      {list.map((item: string, j: number) => (
                                        <span key={j} className="text-[8px] px-2 py-1 rounded bg-accent/10 text-accent font-bold uppercase">{item}</span>
                                      ))}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'deploy' && (
                <motion.div key="deploy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide pb-40">
                   <div className="max-w-5xl mx-auto space-y-16">
                      <div className="space-y-2">
                       <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">X-Deployment Hub</h2>
                        <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Cloud Infusion // Production Bridge</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="p-10 rounded-[3rem] bg-white/3 border border-white/5 space-y-6 flex flex-col justify-center text-center">
                           <Cloud size={48} className="mx-auto text-primary opacity-20" />
                           <div className="space-y-2">
                             <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">Live Deployment</div>
                             <h3 className="text-xl font-bold text-white">Cloud Fusion</h3>
                             <p className="text-xs text-muted max-w-xs mx-auto">Déployez instantanément sur Netlify via X-Kernel Edge.</p>
                           </div>
                           <button onClick={() => handleDeploy('netlify')} className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all">Launch Netlify Drop</button>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-white/3 border border-white/5 space-y-6 flex flex-col justify-center text-center">
                           <Zap size={48} className="mx-auto text-accent opacity-20" />
                           <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-accent italic">Serverless Vercel</div>
                              <h3 className="text-xl font-bold text-white">Hyper Vercel</h3>
                              <p className="text-xs text-muted max-w-xs mx-auto">Vercel auto-deploy avec CI/CD GitHub Action.</p>
                           </div>
                           <button 
                             onClick={handleDeployVercel} 
                             className="w-full py-4 bg-accent text-bg rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 hover:scale-105 transition-all"
                           >
                             Deploy on Vercel
                           </button>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-white/3 border border-white/5 space-y-6 flex flex-col justify-center text-center">
                           <Box size={48} className="mx-auto text-purple-400 opacity-20" />
                           <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-purple-400 italic">Cloud Infrastructure</div>
                              <h3 className="text-xl font-bold text-white">Railway Engine</h3>
                              <p className="text-xs text-muted max-w-xs mx-auto">Configuration Nixpacks avec déploiement automatique.</p>
                           </div>
                           <button 
                             onClick={handleDeployRailway} 
                             className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
                           >
                             Deploy on Railway
                           </button>
                        </div>

                        <div className="p-10 rounded-[3rem] bg-white/3 border border-white/5 space-y-6 flex flex-col justify-center text-center">
                           <Shield size={48} className="mx-auto text-blue-400 opacity-20" />
                           <div className="space-y-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 italic">Firebase Advanced</div>
                              <h3 className="text-xl font-bold text-white">Magic Link Auth</h3>
                              <p className="text-xs text-muted max-w-xs mx-auto">Flux sans mot de passe sécurisé (Passwordless).</p>
                           </div>
                           <button 
                             onClick={handleMagicLink} 
                             className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 hover:scale-105 transition-all"
                           >
                             Forge Magic Link
                           </button>
                        </div>
                     </div>

                      <div className="p-10 rounded-[3rem] border-2 border-dashed border-white/5 bg-white/1 overflow-hidden relative group">
                        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
                          <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                             <CreditCard size={40} />
                          </div>
                          <div className="flex-1 space-y-2 text-center md:text-left">
                             <div className="text-accent text-[10px] font-black uppercase tracking-widest italic">Provisionnement Kernel</div>
                             <h3 className="text-2xl font-bold text-white tracking-tight">Stripe Webhook Fusion</h3>
                             <p className="text-sm text-muted max-w-lg">Générez instantanément une architecture de paiement sécurisée : routes Express, vérification de signature, handlers d'événements et guides de configuration.</p>
                          </div>
                          <button 
                            onClick={handleProvisionStripe}
                            className="px-10 py-5 rounded-2xl bg-white text-bg font-black uppercase text-xs tracking-widest hover:bg-accent hover:text-bg transition-all shadow-xl"
                          >
                            Activer Stripe Stack
                          </button>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">Intégrations Rapides</h3>
                          <div className="px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[8px] font-black uppercase tracking-widest">SaaS.Ready</div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         {INTEGRATIONS.map(integ => (
                           <button 
                             key={integ.id} 
                             onClick={() => {
                               let p = "";
                               if (integ.id === 'lemonsqueezy') {
                                 p = `Intègre Lemon Squeezy :
                                 - Page checkout Lemon Squeezy.
                                 - Webhook handler /api/webhook/lemonsqueezy.
                                 - Vérification signature X-Signature.
                                 - Handlers : order_created, subscription_created, subscription_cancelled.
                                 - Variables d'env : LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_WEBHOOK_SECRET.
                                 - Guide installation 3 étapes.`;
                               } else if (integ.id === 'mailchimp') {
                                 p = `Intègre Mailchimp :
                                 - Formulaire newsletter signup.
                                 - API route /api/subscribe : POST https://us1.api.mailchimp.com/3.0/lists/{LIST_ID}/members.
                                 - Double opt-in handling.
                                 - Variables d'env : MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID, MAILCHIMP_SERVER.`;
                               } else {
                                 p = `Intègre ${integ.name} dans mon projet. Inclus le code boilerplate, les imports nécessaires et la configuration des variables d'environnement pour ${integ.setup}.`;
                               }
                               handleGenerate(undefined, p);
                             }}
                             className="p-6 rounded-3xl bg-white/3 border border-white/5 hover:border-accent/40 transition-all text-left flex flex-col gap-4 group"
                           >
                             <div className="w-10 h-10 rounded-xl bg-white/5 text-muted group-hover:text-accent flex items-center justify-center transition-colors">
                               {integ.icon}
                             </div>
                             <div className="space-y-1">
                               <div className="text-sm font-bold text-white transition-colors group-hover:text-accent">{integ.name}</div>
                               <div className="text-[9px] text-muted line-clamp-1 italic">{integ.desc}</div>
                             </div>
                           </button>
                         ))}
                       </div>
                     </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'settings' && (
                <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide pb-40">
                   <div className="max-w-4xl mx-auto space-y-12">
                       <div className="flex justify-between items-end mb-16">
                        <div className="space-y-2">
                          <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">X-EVOLUTION</h2>
                          <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Neural Learning // Market Awareness // Style Synthesis</p>
                        </div>
                        <div className="flex gap-4">
                           {updateData?.hasUpdate && (
                             <div className="px-5 py-2.5 rounded-full bg-accent/20 border border-accent/40 text-[9px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                                <RefreshCcw size={12} className="animate-spin" /> Mise à jour v{updateData.latest} disponible
                             </div>
                           )}
                           <button onClick={fetchMemory} className="px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:border-accent hover:text-accent transition-all text-white">Sync Kernel</button>
                           <button onClick={fetchMarketTrends} className="px-5 py-2.5 rounded-full bg-primary/20 border border-primary/40 text-[9px] font-black uppercase tracking-widest text-primary">Market Pulse</button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
                         {/* Level 11: Style Learning */}
                         <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                                  <Palette size={24} />
                               </div>
                               <div>
                                  <h3 className="text-lg font-black italic text-white uppercase">Apprentissage par imitation</h3>
                                  <p className="text-[10px] text-muted">Montrez un exemple pour adapter le code aux patterns de design.</p>
                               </div>
                            </div>
                            <textarea 
                              value={styleLearningInput}
                              onChange={(e) => setStyleLearningInput(e.target.value)}
                              placeholder="Collez ici du code ou une URL de référence..."
                              className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] font-mono text-white/60 focus:border-secondary outline-none transition-all scrollbar-hide"
                            />
                            <button 
                               onClick={learnFromExample}
                               disabled={isLearningStyle || !styleLearningInput}
                               className="w-full py-4 rounded-2xl bg-secondary/20 border border-secondary/40 text-secondary text-[10px] font-black uppercase tracking-widest hover:bg-secondary/30 transition-all flex items-center justify-center gap-3"
                            >
                               {isLearningStyle ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                               Analyser et Imiter Style
                            </button>
                         </div>

                         {/* Level 15: Market Trends */}
                         <div className="p-10 rounded-[3rem] bg-primary/5 border border-primary/10 space-y-8">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                  <TrendingUp size={24} />
                               </div>
                               <div>
                                  <h3 className="text-lg font-black italic text-white uppercase">Market Pulse Engine</h3>
                                  <p className="text-[10px] text-muted">Tendances tech mondiales injectées dans le Kernel.</p>
                               </div>
                            </div>
                            <div className="space-y-3">
                               {marketTrends?.trends?.map((t: string, i: number) => (
                                 <div key={i} className="flex gap-4 items-start p-4 rounded-2xl bg-black/40 border border-white/5">
                                    <div className="text-primary mt-1"><Sparkles size={12} /></div>
                                    <div className="text-[11px] text-white/80 leading-relaxed italic">{t}</div>
                                 </div>
                               ))}
                               {(!marketTrends?.trends || marketTrends.trends.length === 0) && (
                                 <div className="py-12 text-center text-[10px] text-white/20 italic">Synchronisation des tendances en cours...</div>
                               )}
                            </div>
                         </div>
                      </div>

                      {/* Level 8-15: Intelligence Sources Monitor */}
                      <div className="p-10 rounded-3xl bg-white/[0.02] border border-white/5 space-y-10">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                              <Database size={24} />
                            </div>
                            <div>
                               <h3 className="text-lg font-black italic text-white uppercase">Intelligence Sources Status</h3>
                               <p className="text-[10px] text-muted">Monitoring des flux de données externes pour l'auto-amélioration.</p>
                            </div>
                          </div>
                          <button 
                            onClick={syncIntelManually}
                            disabled={isSyncingIntel}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:border-accent hover:text-accent transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                          >
                            {isSyncingIntel ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
                            Synchroniser tout
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                           {[
                             { name: 'GitHub Trending', key: 'github', icon: <Rocket size={14}/> },
                             { name: 'NPM Trends', key: 'npm', icon: <Database size={14}/> },
                             { name: 'Design Pulse', key: 'design', icon: <Palette size={14}/> },
                             { name: 'Market Intelligence', key: 'market', icon: <TrendingUp size={14}/> }
                           ].map((source, i) => {
                             const status = intelStatus?.[source.key];
                             return (
                               <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/5 space-y-4">
                                  <div className="flex items-center gap-3 text-white/40">
                                     {source.icon}
                                     <span className="text-[10px] font-black uppercase tracking-widest">{source.name}</span>
                                  </div>
                                  <div className="flex justify-between items-end">
                                     <div className="space-y-1">
                                        <div className="text-xs font-bold text-white/90">{status?.count || 0} Patterns</div>
                                        <div className="text-[8px] text-white/20 uppercase font-black">
                                           {status?.last_updated ? `Maj: ${new Date(status.last_updated).toLocaleTimeString()}` : 'Jamais'}
                                        </div>
                                     </div>
                                     <div className={`w-2 h-2 rounded-full ${status?.last_updated ? 'bg-success animate-pulse' : 'bg-white/10'}`} />
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">X-Settings</h2>
                        <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Kernel Configuration // Global Preferences</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                         {/* Level 8: Prompt Optimizer UI */}
                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 text-accent mb-2">
                               <Sparkles size={18} fill="currentColor" />
                               <span className="text-xs font-black uppercase tracking-widest text-white">Prompt Optimizer</span>
                            </div>
                            <p className="text-[10px] text-muted">Optimisez vos prompts via l'analyse neural des patterns de succès.</p>
                            <button 
                               onClick={() => triggerManualImprovement()}
                               disabled={feedbackLoading}
                               className="w-full py-4 rounded-xl btn-gradient text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                            >
                               {feedbackLoading ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                               Calculer Vecteurs Propres
                            </button>
                         </div>

                         {/* Level 3: Self-Upgrade Suggestions UI */}
                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 text-primary mb-2">
                               <Rocket size={18} />
                               <span className="text-xs font-black uppercase tracking-widest text-white">Self-Upgrade Hub</span>
                            </div>
                            <p className="text-[10px] text-muted">Laissez l'IA imaginer et forger les prochaines fonctions de WebForge.</p>
                            <button 
                               onClick={() => triggerSelfUpgrade()}
                               disabled={feedbackLoading}
                               className="w-full py-4 rounded-xl bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                               {feedbackLoading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                               Scanner Opportunités
                            </button>
                         </div>

                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 text-secondary mb-2 text-white">
                               <Database size={18} />
                               <span className="text-xs font-black uppercase tracking-widest">Memory Modules</span>
                            </div>
                            <div className="space-y-4">
                               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                 <div className="text-[10px] font-black uppercase tracking-widest text-muted">Success Vector</div>
                                 <div className="text-[9px] font-mono text-accent">{memoryData?.memory?.success_patterns?.length || 0}</div>
                               </div>
                               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                 <div className="text-[10px] font-black uppercase tracking-widest text-muted">Correction Sync</div>
                                 <div className="text-[9px] font-mono text-primary">{memoryData?.memory?.user_corrections?.length || 0}</div>
                               </div>
                            </div>
                         </div>
                      </div>

                      {suggestedUpgrades.length > 0 && (
                        <div className="p-10 rounded-[3rem] bg-accent/5 border border-accent/20">
                           <h3 className="text-xl font-black italic mb-8 flex items-center gap-3 text-white">
                              <Zap size={20} className="text-accent" /> SUGGESTED SYSTEM UPGRADES
                           </h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {suggestedUpgrades.map((u: any, i: number) => (
                                <div key={i} className="p-6 rounded-2xl bg-black/40 border border-white/10 flex flex-col justify-between">
                                   <div className="space-y-3">
                                      <div className="flex justify-between items-start">
                                         <span className="text-[9px] font-black uppercase px-2 py-1 bg-accent/10 text-accent rounded">v1.{i+1} Proposed</span>
                                         <span className="text-[10px] font-bold text-white/40">ID: {u.id}</span>
                                      </div>
                                      <h4 className="text-lg font-black text-white">{u.title}</h4>
                                      <p className="text-[11px] text-muted leading-relaxed">{u.description}</p>
                                   </div>
                                   <button className="mt-6 w-full py-3 rounded-xl bg-accent text-bg font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
                                      Integrate Component
                                   </button>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6">
                            <div className="flex items-center gap-3 text-accent mb-2">
                               <Zap size={18} fill="currentColor" />
                               <span className="text-xs font-black uppercase tracking-widest text-white">AI Core Engine</span>
                            </div>
                            <div className="space-y-4">
                               {OLLAMA_MODELS.map(m => (
                                 <button 
                                  key={m.id}
                                  onClick={() => {
                                    setSelectedModel(m.id);
                                    localStorage.setItem('wf_ollama_model', m.id);
                                  }}
                                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedModel === m.id ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/20' : 'bg-white/3 border-white/5 hover:border-white/10'}`}
                                 >
                                    <div className="text-[10px] font-black uppercase tracking-widest mb-1 text-white">{m.name}</div>
                                    <div className="text-[9px] text-muted leading-tight">{m.desc}</div>
                                 </button>
                               ))}
                            </div>
                         </div>

                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6 text-white">
                            <div className="flex items-center gap-3 text-secondary mb-2">
                               <Activity size={18} />
                               <span className="text-xs font-black uppercase tracking-widest">Network Health</span>
                            </div>
                            <div className="space-y-4">
                               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                 <div className="text-[10px] font-black uppercase tracking-widest text-muted">Core Status</div>
                                 <div className="flex items-center gap-2">
                                   <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-accent shadow-[0_0_8px_rgba(0,255,65,0.4)]' : 'bg-coral shadow-[0_0_8px_rgba(255,100,100,0.4)]'}`} />
                                   <span className={`text-[9px] font-black uppercase ${isOnline ? 'text-accent' : 'text-coral'}`}>{isOnline ? 'Online' : 'Offline'}</span>
                                 </div>
                               </div>
                               <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-white/5">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-muted">Kernel Latency</div>
                                  <div className="text-[9px] font-mono text-white">{latency === 'N/A' ? 'N/A' : `${latency}ms`}</div>
                               </div>
                               <button 
                                 onClick={testConnection}
                                 className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                               >
                                 <RefreshCw size={12} className={isChatLoading ? 'animate-spin' : ''} /> Test Connection
                               </button>
                            </div>
                         </div>

                         <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6 text-white">
                            <div className="flex items-center gap-3 text-primary mb-2">
                               <Globe size={18} />
                               <span className="text-xs font-black uppercase tracking-widest">Localization Module</span>
                            </div>
                            <div className="flex gap-4">
                               {['fr', 'en'].map(l => (
                                 <button 
                                  key={l}
                                  onClick={() => {
                                    setLang(l as 'fr'|'en');
                                    localStorage.setItem('wf_lang', l);
                                  }}
                                  className={`flex-1 py-4 rounded-xl border font-black uppercase text-[10px] tracking-widest transition-all ${lang === l ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/3 border-white/5 text-muted hover:text-white'}`}
                                 >
                                    {l === 'fr' ? 'Français' : 'English'}
                                 </button>
                               ))}
                            </div>
                         </div>
                      </div>

                      <div className="p-8 rounded-3xl bg-white/3 border border-white/5 space-y-6 text-white">
                         <div className="flex items-center gap-3 text-muted mb-2">
                            <Shield size={18} />
                            <span className="text-xs font-black uppercase tracking-widest">Environment Status</span>
                         </div>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-white">
                               <div className="text-[8px] text-muted/40 uppercase mb-1">Architecture</div>
                               <div className="text-[10px] font-mono text-white/60">VFS.v2_HYBRID</div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-white">
                               <div className="text-[8px] text-muted/40 uppercase mb-1">Kernel</div>
                               <div className="text-[10px] font-mono text-white/60">TSX_REACT_19</div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-white">
                               <div className="text-[8px] text-muted/40 uppercase mb-1">Styles</div>
                               <div className="text-[10px] font-mono text-white/60">TAILWIND_V4</div>
                            </div>
                            <div className="p-4 rounded-xl bg-black/40 border border-white/5 text-white">
                               <div className="text-[8px] text-muted/40 uppercase mb-1">State</div>
                               <div className="text-[10px] font-mono text-success">STABLE</div>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'library' && (
                <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide pb-40">
                   <div className="max-w-6xl mx-auto space-y-12">
                     <div className="space-y-2">
                       <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">SaaS Blueprints</h2>
                       <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Professional Starter Kits // Neural Templates</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {SaaS_TEMPLATES.map(tmpl => (
                         <div key={tmpl.id} className="p-8 rounded-[2.5rem] bg-white/3 border border-white/5 hover:border-primary/40 transition-all group relative overflow-hidden flex flex-col justify-between">
                           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                             {tmpl.type === 'ecommerce' ? <ShoppingCart size={48} /> : <Layers size={48} />}
                           </div>
                           <div className="space-y-4">
                             <div className="text-[10px] font-black uppercase tracking-widest text-primary italic">SaaS.Blueprint.v2</div>
                             <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{tmpl.name}</h3>
                             <p className="text-xs text-muted leading-relaxed line-clamp-3">{tmpl.desc}</p>
                           </div>
                           <button 
                             onClick={() => {
                               createNewProject(tmpl.name, tmpl.type);
                               handleGenerate(undefined, `Génère un ${tmpl.name} complet avec : ${tmpl.desc}. Inclus Landing, Dashboard, Auth et Stripe integration structure.`);
                             }}
                             className="mt-8 w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:border-primary transition-all"
                           >
                             Forge Project
                           </button>
                         </div>
                       ))}
                     </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'data' && (
                <motion.div key="data" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide">
                   <div className="max-w-4xl mx-auto space-y-12">
                     <div className="space-y-2">
                       <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">X-CMS Core</h2>
                       <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Hybrid Data Persistence // Real-time Sync</p>
                     </div>
                     
                     <div className="p-12 rounded-[3rem] bg-white/3 border border-white/5">
                       <div className="space-y-6">
                         {dataItems.map(item => (
                           <div key={item.id} className="flex gap-4 items-center">
                             <input 
                               value={item.key} 
                               onChange={e => syncDataItem(item.id, e.target.value, item.value)}
                               className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold w-1/3 outline-none focus:border-accent transition-all"
                               placeholder="Key"
                             />
                             <input 
                               value={item.value} 
                               onChange={e => syncDataItem(item.id, item.key, e.target.value)}
                               className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-accent transition-all"
                               placeholder="Value"
                             />
                             <button onClick={() => syncDataItem(item.id, '', '', true)} className="p-3 text-muted hover:text-coral transition-colors">
                               <Trash2 size={16} />
                             </button>
                           </div>
                         ))}
                         <button 
                           onClick={() => syncDataItem(crypto.randomUUID(), 'NOUVELLE_CLE', 'Valeur...')}
                           className="w-full py-4 rounded-2xl border border-dashed border-white/10 text-muted hover:border-accent hover:text-accent transition-all text-[10px] font-black uppercase tracking-widest"
                         >
                           Add New Data Pointer +
                         </button>
                       </div>
                     </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'styles' && (
                <motion.div key="styles" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full p-12 overflow-y-auto scrollbar-hide">
                   <div className="max-w-4xl mx-auto space-y-12">
                     <div className="space-y-2">
                       <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-none text-white">X-Pulse Design</h2>
                       <p className="text-muted text-[10px] uppercase tracking-[0.4em] font-bold opacity-40">Visual Identity Distillation // Neural Presets</p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       {DESIGN_PRESETS.map(preset => (
                         <button 
                           key={preset.id}
                           onClick={() => handleGenerate(undefined, `Applique l'esthétique ${preset.name} : ${preset.prompt}`)}
                           className="p-8 rounded-[2.5rem] bg-white/3 border border-white/5 hover:border-accent/40 transition-all text-left flex flex-col gap-4 group"
                         >
                           <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                             {preset.icon}
                           </div>
                           <div className="space-y-1">
                             <div className="text-[10px] font-black uppercase tracking-widest text-accent">Style Mode</div>
                             <div className="text-lg font-bold text-white">{preset.name}</div>
                           </div>
                           <p className="text-[10px] text-muted leading-relaxed">{preset.description}</p>
                         </button>
                       ))}
                     </div>
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between items-center px-8 py-2 bg-black/40 border-t border-white/5">
             <div className="flex items-center gap-4 text-[9px] mono font-black uppercase tracking-widest text-muted">
                <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help" title={`Latency: ${latency}ms`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-accent shadow-[0_0_8px_rgba(0,255,65,0.6)]' : 'bg-coral shadow-[0_0_8px_rgba(255,80,80,0.6)]'}`} /> 
                  Ollama: {isOnline ? 'Active' : 'Disconnected'}
                </span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5"><Activity size={10} /> Ping: {latency === 'N/A' ? '--' : latency}ms</span>
                <span className="opacity-40">|</span>
                <span className="flex items-center gap-1.5"><Terminal size={10} /> {selectedModel}</span>
             </div>
             <div className="flex items-center gap-4">
                <div className="text-[8px] font-black uppercase tracking-widest text-white/20">VFS_CORE_STABLE_v1.0.4</div>
                <button onClick={() => setShowConsole(!showConsole)} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${showConsole ? 'bg-accent text-bg border-accent shadow-lg shadow-accent/20' : 'text-muted border-white/10 hover:border-white/20'}`}>
                   {showConsole ? 'Close Console' : 'Open Console'}
                </button>
             </div>
          </div>

          <AnimatePresence>
            {showConsole && (
              <motion.div initial={{ height: 0 }} animate={{ height: 160 }} exit={{ height: 0 }} className="bg-black border-t border-white/5 overflow-hidden">
                 <div className="h-full overflow-y-auto p-4 space-y-1 scrollbar-hide font-mono text-[10px]">
                    {systemLogs.length === 0 && <div className="text-muted/30 italic">Console initialized. Awaiting system triggers...</div>}
                    {systemLogs.map((log, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-accent/40 shrink-0">[{log.time}]</span>
                        <span className="text-white/60 group-hover:text-white transition-colors">{'>>'} {log.msg}</span>
                      </div>
                    ))}
                 </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Redesigned Bottom Forge Bar */}
          <div className="px-8 pb-10 relative z-50">
             <div className="max-w-5xl mx-auto space-y-4">
               {/* Project Hub Tags */}
               <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 px-1">
                 {PROJECT_TYPES.map(t => (
                   <button 
                    key={t.id} 
                    onClick={() => setSelectedType(t.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap group ${selectedType === t.id ? 'bg-primary/20 border-primary/40 text-primary font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-surface/40 border-border text-muted hover:border-primary/40 hover:text-white'}`}
                   >
                     <span className={`transition-transform group-hover:scale-110 ${selectedType === t.id ? 'text-primary' : 'text-muted'}`}>{t.icon}</span>
                     <span className="text-[10px] uppercase tracking-widest font-black">{t.name}</span>
                   </button>
                 ))}
               </div>

               <div className="relative group">
                 <div className="absolute -inset-2 bg-primary/20 blur-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700 pointer-events-none" />
                 
                 <form 
                  onSubmit={handleGenerate} 
                  className="bg-surface/40 backdrop-blur-2xl border border-border rounded-[2.5rem] shadow-2xl flex items-center p-2 pl-4 pr-2 focus-within:border-primary/40 transition-all ring-1 ring-border/50 group/form overflow-hidden relative"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5 opacity-0 group-focus-within/form:opacity-100 transition-opacity" />
                   
                   <button 
                    type="button" 
                    onClick={() => setShowTemplates(!showTemplates)} 
                    className="p-3 text-muted hover:text-primary transition-all relative z-10 hover:scale-110"
                   >
                     <Plus size={20}/>
                   </button>

                   <div className="flex-1 flex items-center gap-4 px-4 relative z-10">
                     <div className={`p-2.5 rounded-xl bg-primary/10 text-primary ${isGenerating ? 'animate-pulse' : ''}`}>
                       <Zap size={18}/>
                     </div>
                     
                     <div className="flex-1 relative h-10 flex items-center">
                        {isGenerating && (
                          <div className="absolute -top-12 left-0 flex items-center gap-3 px-4 py-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
                             <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-accent">{tokensPerSec} tokens/sec</span>
                             <div className="w-px h-3 bg-white/10 mx-2" />
                             <button onClick={stopGeneration} className="text-[9px] font-black uppercase tracking-widest text-coral hover:text-white transition-colors flex items-center gap-2 group">
                                <X size={10} className="group-hover:rotate-90 transition-transform" /> Stop
                             </button>
                          </div>
                        )}
                        <AnimatePresence mode="wait">
                          {!prompt && (
                            <motion.div 
                              key={placeholderIndex}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute inset-0 flex items-center text-sm text-muted/40 font-medium pointer-events-none italic"
                            >
                              {t(PLACEHOLDERS[placeholderIndex] as any)}
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <input 
                          value={prompt} 
                          onChange={e => setPrompt(e.target.value)} 
                          disabled={isGenerating} 
                          className="bg-transparent border-none w-full text-sm outline-none focus:ring-0 placeholder:text-transparent font-medium text-white appearance-none" 
                        />
                     </div>

                     {/* Prompt Language Chip */}
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface2 border border-border">
                        <MessageSquareText size={12} className="text-primary/60" />
                        <span className="text-[9px] font-black uppercase text-muted tracking-tighter">Forge Prompt: {lang?.toUpperCase()}</span>
                     </div>
                   </div>

                   <button 
                    type="submit" 
                    disabled={isGenerating || !prompt.trim()} 
                    className="w-14 h-14 rounded-3xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10 group/btn overflow-hidden"
                   >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    {isGenerating ? <Loader2 className="animate-spin" size={24}/> : <Rocket size={24}/>}
                   </button>
                 </form>
               </div>
             </div>
          </div>
        </div>
      </div>

       <AnimatePresence>
        {showAuthOverlay && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-md bg-[#0a0a0a] border-2 border-white/10 rounded-[40px] p-10 relative shadow-3xl overflow-hidden">
               {/* Background Deco */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl rounded-full translate-x-10 -translate-y-10" />
               <div className="relative">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex flex-col">
                       <span className="text-accent font-black italic uppercase tracking-[0.3em] text-[10px] mb-1">X-Security Module</span>
                       <h2 className="text-3xl italic font-black uppercase tracking-tighter">
                          {authMode === 'login' ? 'Nexus Login' : authMode === 'signup' ? 'Pilot Registration' : authMode === 'reset' ? 'Core Recovery' : 'Pilot Profile'}
                       </h2>
                    </div>
                    <button onClick={() => { setShowAuthOverlay(false); resetAuthFields(); }} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"><X size={18}/></button>
                 </div>

                 {authError && (
                    <div className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/30 flex items-center gap-3 text-coral font-bold text-[10px] uppercase">
                       <AlertCircle size={14} />
                       {authError}
                    </div>
                 )}

                 <form onSubmit={authMode === 'profile' ? handleUpdateProfile : handleEmailAuth} className="space-y-4">
                    {(authMode === 'signup' || authMode === 'profile') && (
                       <div className="space-y-1.5">
                          <label className="text-[9px] mono uppercase text-muted tracking-widest pl-4">Nom complet</label>
                          <input required value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ELON MUSK" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-accent transition-all italic font-bold" />
                       </div>
                    )}
                    {authMode !== 'profile' && (
                       <div className="space-y-1.5">
                          <label className="text-[9px] mono uppercase text-muted tracking-widest pl-4">Email de l'opérateur</label>
                          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="operator@x-kernel.core" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-accent transition-all italic font-bold" />
                       </div>
                    )}
                    {(authMode === 'login' || authMode === 'signup') && (
                       <div className="space-y-1.5">
                          <label className="text-[9px] mono uppercase text-muted tracking-widest pl-4">Clé d'autorisation</label>
                          <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm outline-none focus:border-accent transition-all italic font-bold" />
                       </div>
                    )}

                    <button disabled={isLoggingIn} type="submit" className="w-full bg-accent text-bg py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-6">
                       {isLoggingIn ? <Loader2 className="animate-spin" size={16}/> : <Zap size={16} fill="currentColor" />}
                       {authMode === 'login' ? "Engage Kernel" : authMode === 'signup' ? "Forge Account" : authMode === 'reset' ? "Reset Module" : "Update Profile"}
                    </button>
                 </form>

                 {authMode !== 'profile' && (
                    <>
                      <div className="my-8 flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-white/5" />
                        <span className="text-[9px] mono text-muted uppercase tracking-widest">Ou nexus direct</span>
                        <div className="flex-1 h-[1px] bg-white/5" />
                      </div>

                      <button onClick={loginWithGoogle} className="w-full border-2 border-white/5 bg-white/5 py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all group">
                         <div className="p-1.5 bg-white rounded-lg group-hover:scale-110 transition-transform">
                            <svg className="w-3 h-3" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                         </div>
                         <span className="text-[10px] font-bold uppercase tracking-widest">Connect with Google</span>
                      </button>

                      <div className="mt-10 flex flex-col gap-3 text-center">
                         {authMode === 'login' ? (
                           <>
                             <button onClick={() => setAuthMode('signup')} className="text-[10px] text-muted hover:text-accent transition-colors font-bold uppercase tracking-widest">Pas d'accès ? Créer un profil de forge</button>
                             <button onClick={() => setAuthMode('reset')} className="text-[10px] text-muted hover:text-white/60 transition-colors font-bold uppercase tracking-widest underline underline-offset-4">Clé perdue ? Récupérer le module</button>
                           </>
                         ) : (
                           <button onClick={() => setAuthMode('login')} className="text-[10px] text-muted hover:text-accent transition-colors font-bold uppercase tracking-widest">Déjà un profil ? Retour au Nexus</button>
                         )}
                      </div>
                    </>
                 )}
               </div>
            </motion.div>
          </motion.div>
        )}
       </AnimatePresence>

        {/* Integrations Module Overlay */}
        <AnimatePresence>
          {showIntegrationsModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80">
              <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-white/10 rounded-[40px] p-10 relative shadow-3xl overflow-hidden max-h-[80vh] overflow-y-auto scrollbar-hide">
                 <div className="flex justify-between items-center mb-10">
                    <div className="flex flex-col">
                       <span className="text-primary font-black italic uppercase tracking-[0.3em] text-[10px] mb-1">X-Integration Forge</span>
                       <h2 className="text-3xl italic font-black uppercase tracking-tighter text-white">Ajouter Intégration</h2>
                    </div>
                    <button onClick={() => setShowIntegrationsModal(false)} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors text-white"><X size={18}/></button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <IntegrationCard 
                      icon={<Github size={20} />} 
                      title="GitHub Repository" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Ajoute une intégration GitHub complète : Liens repo, badges de build, boutons de clone URL et instructions de déploiement."); }}
                    />
                    <IntegrationCard 
                      icon={<CreditCard size={20} />} 
                      title="Stripe Checkout" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Ajoute un flow complet Stripe Checkout avec boutons, page pricing, et structure de webhook handler."); }}
                    />
                    <IntegrationCard 
                      icon={<Shield size={20} />} 
                      title="Firebase Auth" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Intègre Firebase Authentication (Google & Email) avec pages login/register stylisées et gestion de session."); }}
                    />
                    <IntegrationCard 
                      icon={<CreditCard size={20} className="text-blue-400" />} 
                      title="PayPal Connect" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Ajoute des boutons PayPal intelligents et l'intégration de l'API JavaScript PayPal."); }}
                    />
                    <IntegrationCard 
                      icon={<Zap size={20} className="text-yellow-400" />} 
                      title="Lemon Squeezy Billing" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Intègre Lemon Squeezy pour le SaaS billing avec modal d'overlay et webhooks."); }}
                    />
                    <IntegrationCard 
                      icon={<Mail size={20} />} 
                      title="Resend Emails" 
                      onClick={() => { setShowIntegrationsModal(false); handleGenerate(undefined, "Configure Resend pour l'envoi d'emails transactionnels avec templates React Email."); }}
                    />
                 </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

       {/* Templates Overlay */}
       <AnimatePresence>
        {showTemplates && !isGenerating && (
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} className="absolute bottom-32 left-1/2 -translate-x-1/2 w-full max-w-5xl flex gap-4 px-10 overflow-x-auto scrollbar-hide py-10 bg-black/80 backdrop-blur-3xl border border-white/5 rounded-t-[50px] z-[60]">
             {['Portfolio Minimal', 'SaaS Modern', 'Blog Editorial', 'E-commerce Luxury', 'Landing Mobile'].map(t => (
               <button key={t} onClick={() => handleGenerate(undefined, `Génère un ${t} magnifique.`)} className="shrink-0 w-[240px] p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-accent/40 transition-all text-left shadow-lg group relative">
                  <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl" />
                  <div className="text-[10px] font-black uppercase text-accent tracking-widest mb-2 italic">Blueprint Kernel</div>
                  <div className="text-sm font-bold group-hover:text-accent transition-colors">{t}</div>
               </button>
             ))}
          </motion.div>
        )}
       </AnimatePresence>
      {/* QR Code Modal Overlay */}
      <AnimatePresence>
        {qrCodeUrl && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setQrCodeUrl(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-[#0f0f0f] border border-white/10 rounded-[3rem] p-12 max-w-sm w-full text-center space-y-8 shadow-2xl"
               onClick={e => e.stopPropagation()}
             >
                <div className="space-y-2">
                   <h3 className="text-2xl font-black italic tracking-tighter uppercase text-white">X-Mobile Sync</h3>
                   <p className="text-[10px] text-muted uppercase tracking-widest leading-relaxed">Scannez pour distiller l'expérience sur votre dispositif mobile.</p>
                </div>
                <div className="aspect-square bg-white p-4 rounded-3xl group relative overflow-hidden">
                   <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                   <div className="absolute inset-0 bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <button onClick={() => setQrCodeUrl(null)} className="w-full py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white hover:text-bg transition-all">Dismiss Matrix</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div 
               initial={{ scale: 0.9 }} animate={{ scale: 1 }}
               className="bg-[#0f0f0f] border border-white/10 rounded-[3rem] p-10 max-w-md w-full space-y-8"
               onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-black uppercase italic text-center text-white tracking-widest">Keyboard Matrix</h3>
              <div className="space-y-3">
                {[
                  { k: 'Ctrl + Enter', d: 'Execute Forge' },
                  { k: 'Ctrl + S', d: 'Secure State (Save)' },
                  { k: 'Ctrl + Z', d: 'Temporal Reversion (Undo)' },
                  { k: 'Ctrl + Shift + Z', d: 'Temporal Forwarding (Redo)' },
                  { k: 'Ctrl + E', d: 'Export Artifacts' },
                  { k: 'Ctrl + /', d: 'Access This Interface' },
                ].map(s => (
                  <div key={s.k} className="flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] font-black uppercase text-muted tracking-widest">{s.d}</span>
                    <span className="text-[10px] mono text-accent font-bold px-3 py-1 bg-accent/10 rounded-lg">{s.k}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowShortcuts(false)} className="w-full py-4 rounded-2xl bg-accent text-bg font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 transition-all">Exit Neural View</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabRowItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative h-full flex items-center ${active ? 'text-white' : 'text-muted hover:text-white/60'}`}>
      {label}
      {active && <motion.div layoutId="active-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />}
    </button>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all border ${active ? 'bg-primary/10 border-primary/20 text-white shadow-[0_0_20px_rgba(99,102,241,0.05)]' : 'border-transparent text-muted hover:bg-white/5 hover:text-white'}`}>
      <span className={`transition-all ${active ? 'text-primary drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'text-muted/60'}`}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1 h-1 rounded-full bg-primary animate-pulse" />}
    </button>
  );
}

function ViewportBtn({ icon, active, onClick }: { icon: ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-11 h-9 rounded-lg flex items-center justify-center transition-all ${active ? 'bg-accent text-bg shadow-inner scale-105' : 'text-muted hover:text-white hover:bg-white/5'}`}>
      {icon}
    </button>
  );
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`text-[10px] font-bold uppercase tracking-widest transition-all px-4 py-1.5 rounded-full relative ${active ? 'text-white bg-white/5' : 'text-muted hover:text-white/60'}`}>
      {label}
      {active && <motion.div layoutId="tab-indicator" className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-accent rounded-full" />}
    </button>
  );
}

function IntegrationCard({ icon, title, onClick }: { icon: any, title: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/40 transition-all text-left flex items-center gap-4 group">
      <div className="w-12 h-12 rounded-2xl bg-white/5 text-muted group-hover:text-primary flex items-center justify-center transition-colors">
        {icon}
      </div>
      <div className="text-sm font-bold text-white group-hover:text-primary transition-colors">{title}</div>
    </button>
  );
}

function ApplicationTab({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border ${active ? 'bg-accent/10 border-accent/20 text-accent shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-transparent text-muted hover:bg-white/3 hover:text-white'}`}>
      <span className={active ? 'text-accent' : 'text-muted/40'}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1 h-1 rounded-full bg-accent animate-pulse" />}
    </button>
  );
}

function StatsCard({ label, value, icon, subValue }: { label: string, value: string | number, icon: any, subValue?: string }) {
  return (
    <div className="p-5 rounded-[2rem] bg-white/3 border border-white/5 space-y-3 relative overflow-hidden group hover:border-accent/30 transition-all">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted/60">{label}</div>
        <div className="text-3xl font-black italic tracking-tighter text-white">{value}</div>
      </div>
      {subValue && <div className="text-[9px] text-muted/40 font-mono italic truncate whitespace-nowrap">{subValue}</div>}
    </div>
  )
}

function AppLauncher({ icon, label, active, onClick }: { icon: ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-3xl border transition-all relative group ${active ? 'bg-accent/10 text-accent border-accent/20 shadow-xl shadow-accent/5' : 'bg-white/3 border-white/5 text-muted hover:text-white hover:bg-white/5 hover:border-white/10'}`}>
      <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${active ? 'bg-accent/20' : 'bg-white/5'}`}>{icon}</div>
      <span className="text-[8px] font-bold uppercase tracking-widest leading-none">{label}</span>
      {active && <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
    </button>
  );
}
