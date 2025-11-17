import React, { forwardRef, useState } from "react";
import { ConnectionQuality } from "@heygen/streaming-avatar";

import { useConnectionQuality } from "../logic/useConnectionQuality";
import { useStreamingAvatarSession } from "../logic/useStreamingAvatarSession";
import { StreamingAvatarSessionState } from "../logic";
import { CloseIcon } from "../Icons";
import { Button } from "../Button";
import UserVideo from "./UserVideo";

export interface AvatarVideoProps {
  showUserVideo?: boolean;
  userVideoPosition?: 'bottom-right' | 'bottom-left' | 'side-by-side';
}

export const AvatarVideo = forwardRef<HTMLVideoElement, AvatarVideoProps>(({ showUserVideo = false, userVideoPosition = 'bottom-right' }, ref) => {
  const { sessionState, stopAvatar } = useStreamingAvatarSession();
  const { connectionQuality } = useConnectionQuality();
  const [userStream, setUserStream] = useState<MediaStream | null>(null);

  const isLoaded = sessionState === StreamingAvatarSessionState.CONNECTED;

  const renderSideBySideLayout = () => (
    <div className="w-full h-full flex gap-4">
      {/* Avatar Video */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        <video
          ref={ref}
          autoPlay
          playsInline
          className="w-full h-full object-contain"
        >
          <track kind="captions" />
        </video>
        {!isLoaded && (
          <div className="w-full h-full flex items-center justify-center absolute top-0 left-0 text-white">
            Loading Avatar...
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white rounded-lg px-2 py-1 text-xs">
          Avatar
        </div>
      </div>
      
      {/* User Video */}
      {showUserVideo && (
        <div className="flex-1 relative">
          <UserVideo onStreamChange={setUserStream} />
        </div>
      )}
    </div>
  );

  const renderPictureInPictureLayout = () => (
    <div className="w-full h-full relative">
      {/* Main Avatar Video */}
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
      >
        <track kind="captions" />
      </video>
      
      {!isLoaded && (
        <div className="w-full h-full flex items-center justify-center absolute top-0 left-0 text-white">
          Loading Avatar...
        </div>
      )}
      
      {/* User Video Overlay */}
      {showUserVideo && (
        <div className={`absolute w-64 h-48 ${
          userVideoPosition === 'bottom-right' ? 'bottom-4 right-4' : 'bottom-4 left-4'
        } z-20`}>
          <UserVideo 
            className="border-2 border-white shadow-lg" 
            onStreamChange={setUserStream} 
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full h-full relative">
      {/* Connection Quality Indicator */}
      {connectionQuality !== ConnectionQuality.UNKNOWN && (
        <div className="absolute top-3 left-3 bg-black text-white rounded-lg px-3 py-2 z-30">
          Connection Quality: {connectionQuality}
        </div>
      )}
      
      {/* Close Button */}
      {isLoaded && (
        <Button
          className="absolute top-3 right-3 !p-2 bg-zinc-700 bg-opacity-50 z-30"
          onClick={stopAvatar}
        >
          <CloseIcon />
        </Button>
      )}
      
      {/* Video Layout */}
      {userVideoPosition === 'side-by-side' ? renderSideBySideLayout() : renderPictureInPictureLayout()}
    </div>
  );
});
AvatarVideo.displayName = "AvatarVideo";
