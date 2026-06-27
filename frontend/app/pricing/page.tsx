"use client";
/**
 * Pricing page with upgrade CTA.
 */
import { motion } from "framer-motion";
import { Check, Zap, Crown, Building } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    icon: Zap,
    description: "Get started with AI meeting intelligence",
    color: "border-white/10",
    ctaLabel: "Current plan",
    ctaClass: "btn-secondary",
    features: [
      "5 meetings per month",
      "Basic AI summaries",
      "3 action items per meeting",
      "7-day transcript retention",
      "Standard search",
    ],
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    icon: Crown,
    description: "Everything you need for serious meetings",
    color: "border-primary/40 shadow-glow",
    popular: true,
    ctaLabel: "Upgrade to Pro",
    ctaClass: "btn-primary",
    features: [
      "Unlimited meetings",
      "Unlimited AI summaries & chapters",
      "Unlimited action items",
      "1-year transcript retention",
      "Advanced search + filters",
      "Export PDF, Markdown, TXT",
      "Priority email support",
    ],
  },
  {
    name: "Business",
    price: "$39",
    period: "per user/month",
    icon: Building,
    description: "Team collaboration and admin controls",
    color: "border-accent/20",
    ctaLabel: "Contact sales",
    ctaClass: "btn-secondary",
    features: [
      "Everything in Pro",
      "Up to 20 team seats",
      "Shared meeting library",
      "Admin dashboard",
      "SSO / SAML authentication",
      "API access",
      "SLA + dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen hero-bg">
      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="badge-accent mb-4 inline-flex">Simple, transparent pricing</span>
            <h1 className="text-4xl font-bold text-white mb-4">
              Plans for every team size
            </h1>
            <p className="text-text-muted-dark text-lg max-w-xl mx-auto">
              Start free. Scale as you grow. No hidden fees, no setup costs.
            </p>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card p-6 relative ${plan.color} ${plan.popular ? "scale-[1.02]" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-primary text-xs px-3 py-1">Most Popular</span>
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-card ${plan.popular ? "bg-primary/20" : "bg-white/5"} flex items-center justify-center`}>
                  <plan.icon className={`w-5 h-5 ${plan.popular ? "text-primary" : "text-text-muted-dark"}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">{plan.price}</span>
                    <span className="text-xs text-text-muted-dark">/{plan.period}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-muted-dark mb-5">{plan.description}</p>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <span className="text-text-muted-dark">{f}</span>
                  </li>
                ))}
              </ul>

              <button className={`${plan.ctaClass} w-full`}>
                {plan.ctaLabel}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/meetings" className="text-sm text-text-muted-dark hover:text-white transition-colors">
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}
