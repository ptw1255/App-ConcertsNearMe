"use client";

import { useState, useRef, useEffect } from "react";
import { TopSongData } from "@/types";

interface AudioPreviewPlayerProps {
  songs: TopSongData[];
}

export default function AudioPreviewPlayer({ songs }: AudioPreviewPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  function togglePlay(previewUrl: string) {
    if (currentTrack === previewUrl && isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audioRef.current = audio;
    setCurrentTrack(previewUrl);

    audio.addEventListener("timeupdate", () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    });

    audio.addEventListener("ended", () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTrack(null);
    });

    audio.play();
    setIsPlaying(true);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-white">Top Songs</h3>
      {songs.map((song) => (
        <div
          key={song.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
        >
          {/* Album Art */}
          {song.albumArtUrl ? (
            <img
              src={song.albumArtUrl}
              alt={song.albumName ?? ""}
              className="w-12 h-12 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded bg-gray-700 flex-shrink-0" />
          )}

          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{song.trackName}</p>
            <p className="text-xs text-gray-400 truncate">{song.albumName}</p>

            {/* Progress bar when playing */}
            {currentTrack === song.previewUrl && (
              <div className="mt-1 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>

          {/* Play Button */}
          {song.previewUrl && (
            <button
              onClick={() => togglePlay(song.previewUrl!)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-400 transition-colors"
            >
              {currentTrack === song.previewUrl && isPlaying ? (
                <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-black ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>
          )}

          {/* Spotify Link */}
          {song.spotifyUrl && (
            <a
              href={song.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 text-green-500 hover:text-green-400 transition-colors"
              title="Open in Spotify"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
