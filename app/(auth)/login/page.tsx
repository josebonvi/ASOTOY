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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background relative before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] before:bg-[size:40px_40px] before:pointer-events-none">
      {/* Background glow — red ASOTOY */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.50 0.22 29 / 12%) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10 flex-1 flex flex-col justify-center">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white rounded-lg px-5 py-3 inline-block shadow-lg" style={{ boxShadow: "0 0 60px oklch(0.50 0.22 29 / 12%)" }}>
              <Image
                src="/logo.png"
                alt="ASOTOY"
                width={240}
                height={80}
                priority
                className="h-20 w-auto"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Portal de Remuneración — Red de Concesionarios Toyota Venezuela
          </p>
        </div>

        {/* Card con animación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-xl p-6 bg-card border border-border"
        >
          {/* Red accent line */}
          <div className="h-1 bg-primary rounded-full -mt-6 mx-auto mb-6 w-16" />

          <h2 className="text-lg font-semibold mb-1">Iniciar sesión</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Accede con las credenciales de tu concesionario
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@concesionario.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="rounded-lg px-4 py-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive">
                {error}
              </div>
            )}

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 hover:brightness-110 transition-all"
              >
                {loading ? "Ingresando..." : "Ingresar al portal"}
              </Button>
            </motion.div>
          </form>
        </motion.div>

        <p className="text-center text-xs mt-6 text-muted-foreground">
          ¿Problemas para acceder? Escriba a{" "}
          <span className="text-foreground">soporte@asotoy.com</span>
        </p>
        <p className="text-center text-[10px] mt-2 text-muted-foreground/50">
          Asociación Nacional de Concesionarios Toyota de Venezuela
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 pb-4" />
    </div>
  );
}
