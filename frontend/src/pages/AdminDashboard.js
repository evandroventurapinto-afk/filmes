import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { BarChart3, Users, Film, DollarSign, Plus, ArrowLeft } from 'lucide-react';

function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const res = await adminAPI.getOverview();
      setAnalytics(res.data);
    } catch (error) {
      toast.error('Erro ao carregar analytics');
    }
  };

  if (!analytics) return <div>Carregando...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Dashboard</h2>
      
      <div className="grid md:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Usuários</p>
              <p className="text-3xl font-bold">{analytics.total_users}</p>
            </div>
            <Users className="h-8 w-8 text-brand-yellow" />
          </div>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Assinantes Ativos</p>
              <p className="text-3xl font-bold">{analytics.active_subscriptions}</p>
            </div>
            <Users className="h-8 w-8 text-brand-red" />
          </div>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Conteúdos</p>
              <p className="text-3xl font-bold">{analytics.total_contents}</p>
            </div>
            <Film className="h-8 w-8 text-brand-yellow" />
          </div>
        </Card>
        
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Receita Mensal</p>
              <p className="text-3xl font-bold">R$ {analytics.monthly_revenue.toFixed(2)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>
      
      <Card className="bg-gray-900 border-gray-800 p-6">
        <h3 className="text-xl font-bold mb-4">Conteúdos Mais Assistidos</h3>
        <div className="space-y-2">
          {analytics.top_contents?.map((content, index) => (
            <div key={content.title} className="flex justify-between items-center py-2 border-b border-gray-800">
              <span>{index + 1}. {content.title}</span>
              <span className="text-gray-400">{content.views} visualizações</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ContentManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'movie',
    title: '',
    synopsis: '',
    year: new Date().getFullYear(),
    rating: 'PG-13',
    genres: '',
    poster_url: '',
    banner_url: '',
    video_url: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        genres: formData.genres.split(',').map(g => g.trim())
      };
      await adminAPI.createContent(data);
      toast.success('Conteúdo criado com sucesso!');
      setShowForm(false);
      setFormData({
        type: 'movie',
        title: '',
        synopsis: '',
        year: new Date().getFullYear(),
        rating: 'PG-13',
        genres: '',
        poster_url: '',
        banner_url: '',
        video_url: ''
      });
    } catch (error) {
      toast.error('Erro ao criar conteúdo');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gerenciar Conteúdo</h2>
        <Button onClick={() => setShowForm(!showForm)} className="bg-brand-red">
          <Plus className="mr-2" /> Novo Conteúdo
        </Button>
      </div>
      
      {showForm && (
        <Card className="bg-gray-900 border-gray-800 p-6">
          <h3 className="text-xl font-bold mb-4">Adicionar Novo Conteúdo</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-gray-800 border-gray-700 rounded p-2"
              >
                <option value="movie">Filme</option>
                <option value="series">Série</option>
              </select>
            </div>
            
            <div>
              <Label>Título</Label>
              <Input 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div>
              <Label>Sinopse</Label>
              <Textarea 
                value={formData.synopsis}
                onChange={(e) => setFormData({...formData, synopsis: e.target.value})}
                required
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Ano</Label>
                <Input 
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              
              <div>
                <Label>Classificação</Label>
                <Input 
                  value={formData.rating}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  required
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>
            
            <div>
              <Label>Gêneros (separados por vírgula)</Label>
              <Input 
                value={formData.genres}
                onChange={(e) => setFormData({...formData, genres: e.target.value})}
                placeholder="Ação, Drama, Ficção"
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div>
              <Label>URL do Poster</Label>
              <Input 
                value={formData.poster_url}
                onChange={(e) => setFormData({...formData, poster_url: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div>
              <Label>URL do Banner</Label>
              <Input 
                value={formData.banner_url}
                onChange={(e) => setFormData({...formData, banner_url: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div>
              <Label>URL do Vídeo/HLS</Label>
              <Input 
                value={formData.video_url}
                onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            
            <div className="flex gap-4">
              <Button type="submit" className="bg-brand-yellow text-brand-dark">
                Criar Conteúdo
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-dark text-white">
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-brand-red">CINEMA7 Admin</h1>
          <Button variant="ghost" onClick={() => navigate('/home')}>
            <ArrowLeft className="mr-2" /> Voltar ao Site
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 space-y-2">
            <Link to="/admin">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="mr-2" /> Dashboard
              </Button>
            </Link>
            <Link to="/admin/content">
              <Button variant="ghost" className="w-full justify-start">
                <Film className="mr-2" /> Conteúdo
              </Button>
            </Link>
            <Link to="/admin/users">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="mr-2" /> Usuários
              </Button>
            </Link>
          </aside>
          
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<AdminOverview />} />
              <Route path="/content" element={<ContentManagement />} />
              <Route path="/users" element={<div>Gestão de Usuários (Em desenvolvimento)</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}