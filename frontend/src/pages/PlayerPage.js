import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentAPI, userAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ReactPlayer from 'react-player';

export default function PlayerPage() {
  const { id, episodeId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [episode, setEpisode] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const playerRef = useRef(null);

  useEffect(() => {
    loadContent();
  }, [id, episodeId]);

  const loadContent = async () => {
    try {
      if (episodeId) {
        const epRes = await contentAPI.getEpisode(episodeId);
        setEpisode(epRes.data);
        setVideoUrl(epRes.data.hls_url || epRes.data.video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      } else {
        const res = await contentAPI.getById(id);
        setContent(res.data);
        setVideoUrl(res.data.hls_url || res.data.video_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8');
      }
    } catch (error) {
      toast.error('Erro ao carregar vídeo');
    }
  };

  const handleProgress = async (state) => {
    try {
      await userAPI.updateWatchHistory(
        id,
        Math.floor(state.playedSeconds),
        episodeId
      );
    } catch (error) {
      console.error('Failed to update watch history');
    }
  };

  return (
    <div className="min-h-screen bg-black" data-testid="player-page">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 text-white"
        data-testid="player-back-btn"
      >
        <ArrowLeft className="mr-2" /> Voltar
      </Button>

      <div className="w-full h-screen flex items-center justify-center">
        {videoUrl && (
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            controls
            playing
            width="100%"
            height="100%"
            onProgress={handleProgress}
            config={{
              file: {
                attributes: {
                  controlsList: 'nodownload'
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
}