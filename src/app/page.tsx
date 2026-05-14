
"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Search, 
  Layers, 
  Zap, 
  Shield, 
  Globe, 
  ChevronRight,
  CheckCircle2,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-ai" />,
      title: "AI-Powered Insights",
      description: "Our intelligent engine automatically extracts key concepts and links related thoughts effortlessly."
    },
    {
      icon: <Search className="w-6 h-6 text-primary" />,
      title: "Semantic Search",
      description: "Find exactly what you're looking for by searching for meaning, not just keywords."
    },
    {
      icon: <Layers className="w-6 h-6 text-accent" />,
      title: "Smart Organization",
      description: "Auto-grouping and tagging keep your workspace tidy without manual effort."
    },
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Lightning Fast",
      description: "Optimized for speed. Capture your thoughts the moment they strike with zero lag."
    },
    {
      icon: <Shield className="w-6 h-6 text-green-400" />,
      title: "Private & Secure",
      description: "End-to-end encryption ensures your data stays yours and yours alone."
    },
    {
      icon: <Globe className="w-6 h-6 text-blue-400" />,
      title: "Cross-Platform",
      description: "Access your notes from anywhere. Seamless sync across mobile, desktop, and web."
    }
  ];

  const pricing = [
    {
      name: "Personal",
      price: "$0",
      description: "Perfect for students and individuals starting their journey.",
      features: ["Unlimited Notes", "5GB Storage", "Basic AI Insights", "Mobile App Access"],
      cta: "Get Started",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$12",
      description: "For professionals who need advanced knowledge management.",
      features: ["Everything in Personal", "Unlimited Storage", "Advanced AI Synthesis", "Priority Support", "Version History"],
      cta: "Go Pro",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Scalable solutions for teams and large organizations.",
      features: ["Everything in Pro", "Team Collaboration", "Admin Dashboard", "SSO & SAML", "Dedicated Success Manager"],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden font-body">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 mt-4 mx-auto max-w-6xl left-1/2 -translate-x-1/2 rounded-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="font-bold text-white text-xl">N</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Notly</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
          <Link href="#about" className="hover:text-foreground transition-colors">About</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="rounded-full px-6 font-semibold">Log in</Button>
          </Link>
          <Link href="/signup">
            <Button className="rounded-full px-6 bg-primary text-white hover:bg-primary/90 font-semibold shadow-lg shadow-primary/20">
              Sign up
            </Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 md:hidden"
        >
          <Link href="#features" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Features</Link>
          <Link href="#pricing" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
          <div className="flex flex-col gap-4 w-full px-12 mt-8">
            <Link href="/login" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" className="w-full rounded-xl py-6 text-lg">Log in</Button>
            </Link>
            <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
              <Button className="w-full rounded-xl py-6 text-lg bg-primary">Sign up</Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6">
              Revolutionizing Thought
            </span>
            <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter leading-[1.1]">
              Capture your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-ai">ideas</span> at the speed of thought.
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Notly is the intelligent workspace that helps you organize, connect, and evolve your ideas with AI-powered insights.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link href="/signup">
              <Button size="lg" className="rounded-full px-10 py-7 text-lg font-bold bg-foreground text-background hover:bg-foreground/90 gap-2 shadow-2xl">
                Start for free <ChevronRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full px-10 py-7 text-lg font-bold border-white/10 hover:bg-white/5">
              Watch Demo
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-16 relative"
          >
            <div className="glass-panel p-4 rounded-[2.5rem] border-white/5 shadow-2xl relative z-10 overflow-hidden">
               <div className="rounded-[1.5rem] aspect-video flex items-center justify-center border border-white/10 overflow-hidden bg-muted">
                  <img 
                    src="/images/mockup.png" 
                    alt="Notly App Mockup" 
                    className="w-full h-full object-cover"
                  />
               </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-ai/20 blur-3xl rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need to think better</h2>
          <p className="text-xl text-muted-foreground">Minimalist design meets powerful intelligence.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="glass-card p-8 rounded-3xl space-y-4 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="text-xl text-muted-foreground">Choose the plan that's right for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`glass-panel p-10 rounded-[2.5rem] flex flex-col gap-8 relative ${plan.highlighted ? 'border-primary/50 ring-1 ring-primary/20 scale-105 z-10' : 'border-white/5'}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-widest">
                    Most Popular
                  </div>
                )}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/mo</span>}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                </div>

                <ul className="space-y-4 flex-grow">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup" className="w-full">
                  <Button 
                    variant={plan.highlighted ? "default" : "outline"} 
                    className={`w-full rounded-2xl py-6 text-lg font-bold ${plan.highlighted ? 'bg-primary text-white hover:bg-primary/90' : 'border-white/10 hover:bg-white/5'}`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-xl">N</span>
              </div>
              <span className="text-xl font-bold tracking-tight">Notly</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              The intelligent workspace for modern thinkers and creators.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground">Updates</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About</Link></li>
              <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
              <li><Link href="#" className="hover:text-foreground">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
          © 2026 Notly Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
