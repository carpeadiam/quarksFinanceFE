import { useState, useRef, useEffect } from 'react';
import { parseSRT } from '../../utils/srtParser';
import LoadingSpinner from '@/src/components/ui/LoadingSpinner';

type Lyric = {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
};

type AudioPlayerProps = {
  audioSrc: string;
  lyricsData: string;
  isVisible: boolean;
  onClose: () => void;
};

export default function AudioPlayer({ audioSrc, lyricsData, isVisible, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentLyric, setCurrentLyric] = useState('');
  const [lyrics, setLyrics] = useState<Lyric[]>([]);
  const [spinnerSpeed, setSpinnerSpeed] = useState('2s');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (lyricsData) {
      const parsedLyrics = parseSRT(lyricsData);
      setLyrics(parsedLyrics);
    }
  }, [lyricsData]);

  useEffect(() => {
    if (isVisible && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isVisible]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateLyrics = () => {
      const currentTime = audio.currentTime * 1000;
      const currentLyric = lyrics.find(
        (lyric) => currentTime >= lyric.startTime && currentTime <= lyric.endTime
      );
      
      if (currentLyric) {
        setCurrentLyric(currentLyric.text);
      } else {
        setCurrentLyric('');
      }
    };

    audio.addEventListener('timeupdate', updateLyrics);
    return () => {
      audio.removeEventListener('timeupdate', updateLyrics);
    };
  }, [lyrics]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      // Adjust spinner speed based on playback rate
      const baseSpeed = 2; // 2 seconds for 1x speed
      const newSpeed = baseSpeed / (speed*2);
      setSpinnerSpeed(`${newSpeed}s`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center p-4 z-50">
      <div className="bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 p-6 w-full max-w-6xl mx-4">
        <audio ref={audioRef} src={audioSrc} className="hidden" />
        
        {/* Loading Spinner */}
        <div className="flex justify-center mb-4">
          <div style={{ animation: `spin ${spinnerSpeed} linear infinite` }}>
            <LoadingSpinner size={40} />
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-6">
            <button 
              onClick={togglePlay}
              className="bg-blue-500 hover:bg-blue-600 transition-all duration-200 rounded-full p-3 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={toggleMute}
              className="bg-gray-100 hover:bg-gray-200 transition-all duration-200 rounded-full p-3 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              {isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </button>
            
            <div className="flex items-center space-x-3 bg-gray-50 rounded-full px-4 py-2">
              <span className="text-sm font-medium text-gray-600">Speed:</span>
              {[0.5, 1.0, 1.5, 2.0].map((speed) => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-all duration-200 ${
                    playbackRate === speed 
                      ? 'bg-blue-500 text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="bg-red-50 hover:bg-red-100 transition-all duration-200 rounded-full p-3 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Lyrics Display */}
        <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <div className="text-2xl font-bold text-gray-800 min-h-[3rem] flex items-center justify-center">
            {currentLyric || (
              <span className="text-blue-400 animate-pulse">
                ♪ ♫ ♪ ♫
              </span>
            )}
          </div>
        </div>
        
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}