import { useCallback, useEffect, useRef, useState } from "react";

export interface UserVideoState {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  stream: MediaStream | null;
  error: string | null;
  isLoading: boolean;
}

export const useUserVideo = () => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
      setStream(null);
    }
  }, []);

  const startStream = useCallback(async (video: boolean, audio: boolean) => {
    if (!video && !audio) {
      stopStream();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Stop existing stream first
      stopStream();

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false,
        audio: audio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
      });

      streamRef.current = mediaStream;
      setStream(mediaStream);
      setError(null);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      let errorMessage = "Unable to access camera/microphone";
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = "Camera/microphone access denied. Please allow access and try again.";
        } else if (err.name === 'NotFoundError') {
          errorMessage = "No camera/microphone found on this device.";
        } else if (err.name === 'NotReadableError') {
          errorMessage = "Camera/microphone is already in use by another application.";
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [stopStream]);

  const toggleVideo = useCallback(() => {
    const newVideoState = !isVideoEnabled;
    setIsVideoEnabled(newVideoState);
    startStream(newVideoState, isAudioEnabled);
  }, [isVideoEnabled, isAudioEnabled, startStream]);

  const toggleAudio = useCallback(() => {
    const newAudioState = !isAudioEnabled;
    setIsAudioEnabled(newAudioState);
    startStream(isVideoEnabled, newAudioState);
  }, [isVideoEnabled, isAudioEnabled, startStream]);

  const enableVideoChat = useCallback(() => {
    setIsVideoEnabled(true);
    setIsAudioEnabled(true);
    startStream(true, true);
  }, [startStream]);

  const disableVideoChat = useCallback(() => {
    setIsVideoEnabled(false);
    setIsAudioEnabled(false);
    stopStream();
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Update stream when video/audio state changes
  useEffect(() => {
    if (isVideoEnabled || isAudioEnabled) {
      startStream(isVideoEnabled, isAudioEnabled);
    } else {
      stopStream();
    }
  }, [isVideoEnabled, isAudioEnabled, startStream, stopStream]);

  return {
    isVideoEnabled,
    isAudioEnabled,
    stream,
    error,
    isLoading,
    toggleVideo,
    toggleAudio,
    enableVideoChat,
    disableVideoChat,
    setIsVideoEnabled,
    setIsAudioEnabled,
  };
};