'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Leaf, Mail, Lock, User as UserIcon, Sparkles, MapPin, Users } from 'lucide-react'
import { toast } from 'sonner'
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/schemas/auth'
import type { UserDTO } from '@/lib/types'

interface AuthScreenProps {
  onAuth: (user: UserDTO) => void
}

const features = [
  { icon: MapPin, text: 'Marque pontos no mapa com sua localização' },
  { icon: Sparkles, text: 'Catalogue frutas, flores, ervas e ornamentais com fotos' },
  { icon: Users, text: 'Compartilhe locais com amigos' },
]

export default function AuthScreen({ onAuth }: AuthScreenProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login')

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  })

  const { isSubmitting: loginLoading } = loginForm.formState
  const { isSubmitting: signupLoading } = signupForm.formState

  async function handleLogin(data: LoginInput) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Erro ao entrar')
        return
      }
      toast.success(`Bem-vindo de volta, ${result.user.name.split(' ')[0]}!`)
      onAuth(result.user)
    } catch {
      toast.error('Erro de rede. Verifique sua conexão.')
    }
  }

  async function handleSignup(data: SignupInput) {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Erro ao cadastrar')
        return
      }
      toast.success(`Conta criada! Bem-vindo, ${result.user.name.split(' ')[0]}!`)
      onAuth(result.user)
    } catch {
      toast.error('Erro de rede. Verifique sua conexão.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-4">
              <Leaf className="w-9 h-9 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Florestreet</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs leading-relaxed">
              Catalogue árvores frutíferas, flores, ervas e plantas ornamentais ao seu redor. Compartilhe com amigos.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid gap-2 mb-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-foreground/80">{f.text}</span>
              </div>
            ))}
          </div>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'signup')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar conta</TabsTrigger>
                </TabsList>
                <TabsContent value="login" className="mt-6">
                  <CardTitle className="text-lg">Acesse seu inventário</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Entre para ver seus pontos e os compartilhados com você.
                  </CardDescription>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          placeholder="voce@exemplo.com"
                          {...loginForm.register('email')}
                          className="pl-9"
                          aria-invalid={!!loginForm.formState.errors.email}
                        />
                      </div>
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••"
                          {...loginForm.register('password')}
                          className="pl-9"
                          aria-invalid={!!loginForm.formState.errors.password}
                        />
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>
                    <Button type="submit" disabled={loginLoading} className="w-full">
                      {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
                    </Button>
                  </form>
                </TabsContent>
                <TabsContent value="signup" className="mt-6">
                  <CardTitle className="text-lg">Crie sua conta</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Comece a catalogar seus pontos de coleta em segundos.
                  </CardDescription>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="mt-5 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          type="text"
                          autoComplete="name"
                          placeholder="Seu nome"
                          {...signupForm.register('name')}
                          className="pl-9"
                          aria-invalid={!!signupForm.formState.errors.name}
                        />
                      </div>
                      {signupForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          autoComplete="email"
                          placeholder="voce@exemplo.com"
                          {...signupForm.register('email')}
                          className="pl-9"
                          aria-invalid={!!signupForm.formState.errors.email}
                        />
                      </div>
                      {signupForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          autoComplete="new-password"
                          placeholder="Mínimo 6 caracteres"
                          {...signupForm.register('password')}
                          className="pl-9"
                          aria-invalid={!!signupForm.formState.errors.password}
                        />
                      </div>
                      {signupForm.formState.errors.password && (
                        <p className="text-xs text-destructive">
                          {signupForm.formState.errors.password.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Use ao menos 6 caracteres para sua segurança.
                      </p>
                    </div>
                    <Button type="submit" disabled={signupLoading} className="w-full">
                      {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar conta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent />
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 px-6 leading-relaxed">
            Seus pontos ficam salvos no seu inventário privado. Você escolhe quem pode ver cada um.
          </p>
        </div>
      </div>
    </div>
  )
}
