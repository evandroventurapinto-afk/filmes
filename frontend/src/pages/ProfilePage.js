import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, subscriptionAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { ArrowLeft, User, CreditCard, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [subRes, historyRes] = await Promise.all([
        subscriptionAPI.getMy(),
        userAPI.getWatchHistory()
      ]);
      setSubscription(subRes.data);
      setWatchHistory(historyRes.data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) {
      return;
    }
    
    try {
      await subscriptionAPI.cancel(subscription.id);
      toast.success('Assinatura cancelada');
      loadData();
    } catch (error) {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-dark text-white py-8 px-4" data-testid="profile-page">
      <div className="container mx-auto max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8"
          data-testid="profile-back-btn"
        >
          <ArrowLeft className="mr-2" /> Voltar
        </Button>

        <h1 className="text-4xl font-bold mb-8">Meu Perfil</h1>

        {/* Subscription Info */}
        <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <CreditCard className="h-8 w-8 text-brand-red" />
            <h2 className="text-2xl font-bold">Assinatura</h2>
          </div>
          
          {subscription && subscription.status === 'active' ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="text-green-500 font-bold">Ativa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Plano:</span>
                <span>R$ 7,00/mês</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Próxima renovação:</span>
                <span>{subscription.end_date ? new Date(subscription.end_date).toLocaleDateString('pt-BR') : 'N/A'}</span>
              </div>
              <Button 
                variant="destructive"
                onClick={handleCancelSubscription}
                className="w-full mt-4"
                data-testid="cancel-subscription-btn"
              >
                Cancelar Assinatura
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-4">Você não tem uma assinatura ativa</p>
              <Button 
                onClick={() => navigate('/checkout')}
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark"
                data-testid="subscribe-btn"
              >
                Assinar Agora
              </Button>
            </div>
          )}
        </Card>

        {/* Watch History */}
        <Card className="bg-gray-900 border-gray-800 p-6">
          <div className="flex items-center gap-4 mb-4">
            <Clock className="h-8 w-8 text-brand-yellow" />
            <h2 className="text-2xl font-bold">Continuar Assistindo</h2>
          </div>
          
          {watchHistory.length > 0 ? (
            <div className="grid gap-4">
              {watchHistory.slice(0, 5).map((item) => (
                <div 
                  key={item.id}
                  className="flex gap-4 bg-gray-800 p-4 rounded-lg hover:bg-gray-700 cursor-pointer transition"
                  onClick={() => navigate(`/content/${item.content_id}`)}
                  data-testid={`history-item-${item.id}`}
                >
                  {item.content?.poster_url && (
                    <img 
                      src={item.content.poster_url}
                      alt={item.content.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold">{item.content?.title}</h3>
                    <p className="text-sm text-gray-400">Assistido em {new Date(item.last_watched).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">Nenhum conteúdo assistido ainda</p>
          )}
        </Card>
      </div>
    </div>
  );
}