import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      toast({
        title: 'Falha na autenticação',
        description: 'E-mail ou senha incorretos. Verifique suas credenciais.',
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Bem-vindo(a)!',
        description: 'Login efetuado com sucesso.',
      })
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4 py-12">
      <div className="w-full max-w-md space-y-6 animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-md">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MarketingADM</h1>
          <p className="text-sm text-slate-500">Sistema de Automação de Posts para Instagram</p>
        </div>

        <Card className="shadow-elevation border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Acessar Painel</CardTitle>
            <CardDescription className="text-center text-xs">
              Entre com o seu e-mail e senha cadastrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="fsato@fksato.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <button
                    type="button"
                    className="text-xs text-indigo-600 hover:underline"
                    onClick={() =>
                      toast({
                        title: 'Recuperação de Senha',
                        description: 'Solicite a redefinição de senha ao administrador do sistema.',
                      })
                    }
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition"
              >
                {loading ? 'Entrando...' : 'Entrar'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
