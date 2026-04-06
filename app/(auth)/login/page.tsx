"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative">
      {/* Background glow — red ASOTOY */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, oklch(0.50 0.22 29 / 12%) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="ASOTOY"
              width={180}
              height={60}
              priority
              className="h-14 w-auto"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Estudio de Remuneración Toyota Venezuela
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl p-6 bg-card border border-border">
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

            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? "Ingresando..." : "Ingresar al portal"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs mt-6 text-muted-foreground">
          ¿Problemas para acceder? Contacta a ASOTOY
        </p>
      </div>
    </div>
  );
}
