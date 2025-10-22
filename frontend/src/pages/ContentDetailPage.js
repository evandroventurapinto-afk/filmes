import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentAPI, subscriptionAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Play, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ContentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContent();
    checkSubscription();
  }, [id]);

  const loadContent = async () => {
    try {
      const res = await contentAPI.getById(id);
      setContent(res.data);
    } catch (error) {
      toast.error('Erro ao carregar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const res = await subscriptionAPI.getMy();
      setSubscription(res.data);
    } catch (error) {
      console.error('Failed to check subscription');
    }
  };

  const handleWatch = () => {
    if (!subscription || subscription.status !== 'active') {
      toast.error('Você precisa de uma assinatura ativa');
      navigate('/checkout');
      return;
    }
    navigate(`/watch/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="min-h-screen bg-brand-dark text-white" data-testid="content-detail-page">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50"
        data-testid="back-btn"
      >
        <ArrowLeft className="mr-2" /> Voltar
      </Button>

      {/* Banner */}
      <div className="relative h-[60vh]">
        {content.banner_url && (
          <>
            <img 
              src={content.banner_url} 
              alt={content.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
          </>
        )}
      </div>

      {/* Content Info */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="flex gap-8">
          <img 
            src={content.poster_url || 'https://via.placeholder.com/300x450'} 
            alt={content.title}
            className="w-64 h-96 object-cover rounded-lg shadow-2xl"
          />
          
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-4">{content.title}</h1>
            {content.original_title && (
              <p className="text-xl text-gray-400 mb-4">{content.original_title}</p>
            )}
            
            <div className="flex gap-4 mb-6">
              <span className="px-3 py-1 bg-brand-red rounded">{content.rating}</span>
              <span>{content.year}</span>
              {content.duration_minutes && <span>{content.duration_minutes} min</span>}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {content.genres?.map((genre) => (
                <span key={genre} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                  {genre}
                </span>
              ))}
            </div>
            
            <Button 
              onClick={handleWatch}
              size="lg"
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark mb-6"
              data-testid="watch-btn"
            >
              <Play className="mr-2" /> Assistir Agora
            </Button>
            
            <p className="text-lg mb-4">{content.synopsis}</p>
            {content.synopsis_long && (
              <p className="text-gray-400">{content.synopsis_long}</p>
            )}
            
            {content.director && (
              <div className="mt-6">
                <span className="font-bold">Direção:</span> {content.director}
              </div>
            )}
            
            {content.cast?.length > 0 && (
              <div className="mt-4">
                <span className="font-bold">Elenco:</span> {content.cast.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Episodes for Series */}
        {content.type === 'series' && content.seasons && (
          <div className="mt-12">
            <h2 className="text-3xl font-bold mb-6">Episódios</h2>
            {Object.entries(content.seasons).map(([season, episodes]) => (
              <div key={season} className="mb-8">
                <h3 className="text-2xl font-bold mb-4">Temporada {season}</h3>
                <div className="grid gap-4">
                  {episodes.map((episode) => (
                    <div 
                      key={episode.id}
                      className="flex gap-4 bg-gray-900 p-4 rounded-lg hover:bg-gray-800 cursor-pointer transition"
                      onClick={() => navigate(`/watch/${id}/episode/${episode.id}`)}
                      data-testid={`episode-${episode.id}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-bold">{episode.episode}. {episode.title}</h4>
                        <p className="text-gray-400 text-sm mt-1">{episode.synopsis}</p>
                        <span className="text-xs text-gray-500">{episode.duration_minutes} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}