import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { LayoutShell } from "@/components/layout-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { User, Mail, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await fetch(api.auth.profile.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      refetchUser();
      toast({
        title: "Profile Updated",
        description: "Your information has been successfully updated.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: any = {};

    if (username !== user?.username) {
      if (!username.trim()) return toast({ title: "Error", description: "Username cannot be empty", variant: "destructive" });
      updates.username = username;
    }

    if (email !== user?.email) {
      if (!email.trim() || !email.includes("@")) return toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      updates.email = email;
    }

    if (newPassword || currentPassword) {
      if (!newPassword) return toast({ title: "Error", description: "Please enter a new password", variant: "destructive" });
      if (newPassword.length < 6) return toast({ title: "Error", description: "Password at least 6 characters", variant: "destructive" });
      if (newPassword !== confirmPassword) return toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      updates.password = newPassword;
    }

    if (Object.keys(updates).length === 0) return toast({ title: "No Changes", description: "There is nothing to update." });
    updateProfileMutation.mutate(updates);
  };

  return (
    <LayoutShell title="Pengaturan Profil">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Informasi Akun</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kelola informasi dasar akun Anda seperti nama pengguna dan alamat email untuk keperluan administrasi.
            </p>
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
              <div className="flex items-center gap-3 text-primary">
                <ShieldCheck className="w-5 h-5" />
                <span className="text-sm font-semibold">Keamanan Terjamin</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Data Anda dienkripsi dan disimpan dengan aman dalam sistem kami.</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <Card className="border-none shadow-md overflow-hidden dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Profil Pengguna
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="username"
                          className="pl-10"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                  <Button type="submit" className="w-full sm:w-auto" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md overflow-hidden dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="w-5 h-5 text-orange-500" /> Keamanan Kata Sandi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
                      <Input
                        id="current-password"
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={updateProfileMutation.isPending}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Kata Sandi Baru</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Min. 6 karakter"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Konfirmasi Kata Sandi</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Ulangi kata sandi baru"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={updateProfileMutation.isPending}
                        />
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" type="submit" className="w-full sm:w-auto" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Memperbarui..." : "Perbarui Kata Sandi"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}

import { ShieldCheck } from "lucide-react";
