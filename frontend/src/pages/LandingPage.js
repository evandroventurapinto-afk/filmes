import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Film, PlayCircle, Star, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success('Login realizado com sucesso!');
      } else {
        await register(formData.name, formData.email, formData.password);
        toast.success('Conta criada! Verifique seu email.');
      }
      setShowAuth(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-brand-red" />
            <span className="text-2xl font-bold">CINEMA7</span>
          </div>
          <Button 
            onClick={() => setShowAuth(true)}
            className="bg-brand-red hover:bg-brand-red/90"
            data-testid="header-login-btn"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Seus filmes e séries favoritos por apenas
            <span className="text-brand-yellow"> R$7/mês</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Acesso ilimitado a todo o catálogo. Assista quando e onde quiser.
          </p>
          <Button 
            onClick={() => setShowAuth(true)}
            size="lg"
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark text-lg px-8 py-6 rounded-full font-bold"
            data-testid="hero-cta-btn"
          >
            Assinar por R$7/mês
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-black/30">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <PlayCircle className="h-16 w-16 mx-auto mb-4 text-brand-red" />
              <h3 className="text-2xl font-bold mb-2">Streaming em HD</h3>
              <p className="text-gray-400">Qualidade adaptativa até 1080p</p>
            </div>
            <div className="text-center p-8">
              <Star className="h-16 w-16 mx-auto mb-4 text-brand-yellow" />
              <h3 className="text-2xl font-bold mb-2">Conteúdo Premium</h3>
              <p className="text-gray-400">Filmes e séries exclusivos</p>
            </div>
            <div className="text-center p-8">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 text-brand-red" />
              <h3 className="text-2xl font-bold mb-2">Sempre Atualizado</h3>
              <p className="text-gray-400">Novos títulos toda semana</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl text-gray-300 mb-8">Apenas R$7/mês. Cancele quando quiser.</p>
          <Button 
            onClick={() => setShowAuth(true)}
            size="lg"
            className="bg-brand-red hover:bg-brand-red/90 text-lg px-8 py-6 rounded-full font-bold"
            data-testid="footer-cta-btn"
          >
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Auth Dialog */}
      <Dialog open={showAuth} onOpenChange={setShowAuth}>
        <DialogContent className="bg-gray-900 text-white border-gray-800" data-testid="auth-dialog">
          <DialogHeader>
            <DialogTitle className="text-2xl">{isLogin ? 'Entrar' : 'Criar Conta'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isLogin ? 'Entre para acessar seu conteúdo' : 'Crie sua conta e comece a assistir'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required={!isLogin}
                  className="bg-gray-800 border-gray-700"
                  data-testid="auth-name-input"
                />
              </div>
            )}
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="bg-gray-800 border-gray-700"
                data-testid="auth-email-input"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="bg-gray-800 border-gray-700"
                data-testid="auth-password-input"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-brand-red hover:bg-brand-red/90"
              disabled={loading}
              data-testid="auth-submit-btn"
            >
              {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
            
            <p className="text-center text-sm">
              {isLogin ? 'Não tem conta? ' : 'Já tem conta? '}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-brand-yellow hover:underline"
                data-testid="auth-toggle-btn"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}