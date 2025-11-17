import React, { forwardRef, useEffect, useRef } from "react";
import { Button } from "../Button";
import { useUserVideo } from "../logic/useUserVideo";

// Simple Camera Icons
const CameraIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" fill="currentColor"/>
    <circle cx="12" cy="13" r="4" fill="white"/>
  </svg>
);

const CameraOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" height="20" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
    <path d="m1 1 22 22M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export interface UserVideoProps {
  className?: string;
  onStreamChange?: (stream: MediaStream | null) => void;
}

export const UserVideo = forwardRef<HTMLVideoElement, UserVideoProps>(
  ({ className, onStreamChange }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const {
      isVideoEnabled,
      isAudioEnabled,
      stream,
      error,
      isLoading,
      toggleVideo,
      toggleAudio,
    } = useUserVideo();

    // Update video element when stream changes
    useEffect(() => {
      const video = ref ? (ref as React.MutableRefObject<HTMLVideoElement>).current : videoRef.current;
      if (video && stream) {
        video.srcObject = stream;
      }
      
      // Notify parent component of stream changes
      if (onStreamChange) {
        onStreamChange(stream);
      }
    }, [stream, onStreamChange]);

    const videoElement = (
      <video
        ref={ref || videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
      />
    );

    if (isLoading) {
      return (
        <div className={`relative w-full h-full bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center ${className || ''}`}>
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-zinc-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
              <CameraIcon className="w-8 h-8" />
            </div>
            <p className="text-sm">Starting camera...</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`relative w-full h-full bg-zinc-800 rounded-lg overflow-hidden ${className || ''}`}>
        {/* Video Controls */}
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          <Button
            className={`!p-2 ${isVideoEnabled ? 'bg-zinc-700' : 'bg-red-600'} bg-opacity-80`}
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <CameraIcon /> : <CameraOffIcon />}
          </Button>
        </div>

        {/* Video Stream or Placeholder */}
        {isVideoEnabled && stream ? (
          videoElement
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-800">
            <div className="text-center text-white">
              <div className="w-16 h-16 bg-zinc-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CameraOffIcon className="w-8 h-8" />
              </div>
              <p className="text-sm">Camera Off</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute top-3 left-3 bg-red-600 text-white rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {/* User Label */}
        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white rounded-lg px-2 py-1 text-xs">
          You
        </div>
      </div>
    );
  }
);

UserVideo.displayName = "UserVideo";

export default UserVideo;