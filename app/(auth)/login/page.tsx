"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu usuario y contraseña.");
      setLoading(false);
      return;
    }

    // Fetch role to redirect properly
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/inicio");
      }
    }
  }

  return (
    <>
      {/* CSS Keyframes for animations */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes float1 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float2 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        @keyframes float3 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-25px);
          }
        }

        @keyframes float4 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-18px);
          }
        }

        @keyframes float5 {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-22px);
          }
        }

        .shimmer-border {
          background: linear-gradient(
            90deg,
            transparent 0%,
            transparent 40%,
            oklch(0.50 0.22 29 / 20%) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        .input-glow:focus {
          box-shadow: 0 0 15px oklch(0.50 0.22 29 / 10%);
        }

        .button-glow:hover {
          box-shadow: 0 0 25px oklch(0.50 0.22 29 / 30%);
        }
      `}</style>

      {/* Background - appears first */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0"
        style={{ background: "#0a0a0a" }}
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, oklch(1 0 0 / 2%) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(1 0 0 / 2%) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Red radial glow top */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 70% 50% at 50% 0%, oklch(0.50 0.22 29 / 8%) 0%, transparent 60%)",
          }}
        />

        {/* Vignette edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, oklch(0 0 0 / 60%) 100%)",
          }}
        />

        {/* Floating particles */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "3px",
            height: "3px",
            background: "oklch(0.50 0.22 29 / 6%)",
            top: "20%",
            left: "15%",
            animation: "float1 12s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "2px",
            height: "2px",
            background: "oklch(0.50 0.22 29 / 8%)",
            top: "60%",
            left: "80%",
            animation: "float2 10s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "4px",
            height: "4px",
            background: "oklch(0.50 0.22 29 / 5%)",
            top: "75%",
            left: "25%",
            animation: "float3 15s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "2px",
            height: "2px",
            background: "oklch(0.50 0.22 29 / 7%)",
            top: "35%",
            left: "70%",
            animation: "float4 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            width: "3px",
            height: "3px",
            background: "oklch(0.50 0.22 29 / 4%)",
            top: "85%",
            left: "60%",
            animation: "float5 11s ease-in-out infinite",
          }}
        />
      </motion.div>

      {/* Content */}
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-sm flex flex-col items-center">
          {/* Logo - cinematic entrance */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.3,
              ease: [0.25, 0.1, 0.25, 1]
            }}
            className="mb-4"
            style={{ filter: "drop-shadow(0 0 100px oklch(0.50 0.22 29 / 20%))" }}
          >
            <Image
              src="/logo-dark.png"
              alt="ASOTOY"
              width={320}
              height={192}
              priority
              className="max-h-48 w-auto"
            />
          </motion.div>

          {/* Red light glow emanating from logo to card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="w-full h-24 -mt-4 mb-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 40% 30% at 50% 0%, oklch(0.50 0.22 29 / 12%) 0%, transparent 100%)",
            }}
          />

          {/* Glass card with shimmer border - spring entrance */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 15,
              delay: 0.4
            }}
            className="relative w-full rounded-2xl p-8 -mt-12"
            style={{
              background: "oklch(0.12 0 0 / 80%)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
            }}
          >
            {/* Shimmer border overlay */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none shimmer-border"
              style={{
                padding: "1px",
                WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />

            {/* Static border underneath */}
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                border: "1px solid oklch(1 0 0 / 6%)",
              }}
            />

            {/* Top gradient accent */}
            <div
              className="absolute top-0 left-8 right-8 h-px pointer-events-none"
              style={{
                background: "linear-gradient(to right, transparent, oklch(0.50 0.22 29 / 30%), transparent)",
              }}
            />

            <h2 className="text-xl font-semibold text-white mb-1">Iniciar sesión</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Accede con las credenciales de tu concesionario
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Correo electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@concesionario.com"
                  required
                  autoComplete="email"
                  className="input-glow bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/40 transition-all duration-300"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input-glow bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-primary/40 transition-all duration-300"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg px-4 py-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive"
                >
                  {error}
                </motion.div>
              )}

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="button-glow w-full py-3 h-auto text-base font-medium tracking-wide transition-all duration-300"
                  style={{
                    background: "linear-gradient(135deg, #CC0000 0%, #990000 100%)",
                  }}
                >
                  {loading ? "Ingresando..." : "Ingresar al portal"}
                </Button>
              </motion.div>
            </form>
          </motion.div>
        </div>
      </div>
    </>
  );
}
