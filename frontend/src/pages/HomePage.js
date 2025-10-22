import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { contentAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, Search, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [genres, setGenres] = useState([]);
  const [contentByGenre, setContentByGenre] = useState({});
  const [currentBanner, setCurrentBanner] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadContent();
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % (featured.length || 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [featured.length]);

  const loadContent = async () => {
    try {
      const [featuredRes, trendingRes, genresRes] = await Promise.all([
        contentAPI.getFeatured(),
        contentAPI.getTrending(),
        contentAPI.getGenres()
      ]);
      
      setFeatured(featuredRes.data);
      setTrending(trendingRes.data);
      setGenres(genresRes.data.slice(0, 5));
      
      // Load content for each genre
      const genreContent = {};
      for (const genre of genresRes.data.slice(0, 5)) {
        const res = await contentAPI.getByGenre(genre, 10);
        genreContent[genre] = res.data;
      }
      setContentByGenre(genreContent);
    } catch (error) {
      console.error('Failed to load content:', error);
      toast.error('Erro ao carregar conteúdo');
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  const banner = featured[currentBanner] || {};

  return (
    <div className="min-h-screen bg-brand-dark" data-testid="home-page">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-brand-dark/90 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-brand-red">CINEMA7</h1>
            <nav className="hidden md:flex gap-6">
              <button className="hover:text-brand-yellow transition">Início</button>
              <button className="hover:text-brand-yellow transition">Filmes</button>
              <button className="hover:text-brand-yellow transition">Séries</button>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-gray-800 border border-gray-700 rounded-full px-4 py-2 pr-10 focus:outline-none focus:border-brand-red"
                data-testid="search-input"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profile')}
              data-testid="profile-btn"
            >
              <User className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              data-testid="logout-btn"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Banner */}
      <section className="relative h-[70vh] mt-16" data-testid="featured-banner">
        {banner.banner_url && (
          <div className="absolute inset-0">
            <img 
              src={banner.banner_url} 
              alt={banner.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/60 to-transparent" />
          </div>
        )}
        
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-end pb-20">
          <h2 className="text-5xl md:text-7xl font-bold mb-4">{banner.title}</h2>
          <p className="text-lg md:text-xl max-w-2xl mb-6 text-gray-300">{banner.synopsis}</p>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate(`/watch/${banner.id}`)}
              className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-dark"
              data-testid="banner-play-btn"
            >
              <Play className="mr-2 h-5 w-5" /> Assistir
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/content/${banner.id}`)}
              className="border-white text-white hover:bg-white/10"
              data-testid="banner-info-btn"
            >
              Mais Informações
            </Button>
          </div>
        </div>
      </section>

      {/* Trending */}
      {trending.length > 0 && (
        <section className="py-8 px-4" data-testid="trending-section">
          <h3 className="text-2xl font-bold mb-4 container mx-auto">Em Alta</h3>
          <div className="container mx-auto overflow-x-auto no-scrollbar">
            <div className="flex gap-4 pb-4">
              {trending.map((item) => (
                <div 
                  key={item.id} 
                  className="flex-shrink-0 w-48 cursor-pointer transition-transform hover:scale-105"
                  onClick={() => navigate(`/content/${item.id}`)}
                  data-testid={`content-card-${item.id}`}
                >
                  <img 
                    src={item.poster_url || 'https://via.placeholder.com/300x450'} 
                    alt={item.title}
                    className="w-full h-72 object-cover rounded-lg"
                  />
                  <p className="mt-2 font-medium truncate">{item.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Content by Genre */}
      {genres.map((genre) => (
        contentByGenre[genre]?.length > 0 && (
          <section key={genre} className="py-8 px-4" data-testid={`genre-section-${genre}`}>
            <h3 className="text-2xl font-bold mb-4 container mx-auto">{genre}</h3>
            <div className="container mx-auto overflow-x-auto no-scrollbar">
              <div className="flex gap-4 pb-4">
                {contentByGenre[genre].map((item) => (
                  <div 
                    key={item.id} 
                    className="flex-shrink-0 w-48 cursor-pointer transition-transform hover:scale-105"
                    onClick={() => navigate(`/content/${item.id}`)}
                    data-testid={`content-card-${item.id}`}
                  >
                    <img 
                      src={item.poster_url || 'https://via.placeholder.com/300x450'} 
                      alt={item.title}
                      className="w-full h-72 object-cover rounded-lg"
                    />
                    <p className="mt-2 font-medium truncate">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      ))}
    </div>
  );
}