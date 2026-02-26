import {
  AvatarQuality,
  StreamingEvents,
  VoiceChatTransport,
  VoiceEmotion,
  StartAvatarRequest,
  STTProvider,
  ElevenLabsModel,
  TaskType,
} from "@heygen/streaming-avatar";
import { useEffect, useRef, useState } from "react";
import { useMemoizedFn, useUnmount } from "ahooks";

import { Button } from "./Button";
import { AvatarConfig } from "./AvatarConfig";
import { AvatarVideo } from "./AvatarSession/AvatarVideo";
import { useStreamingAvatarSession } from "./logic/useStreamingAvatarSession";
import { AvatarControls } from "./AvatarSession/AvatarControls";
import { useVoiceChat } from "./logic/useVoiceChat";
import { StreamingAvatarProvider, StreamingAvatarSessionState } from "./logic";
import { LoadingIcon } from "./Icons";
import { MessageHistory } from "./AvatarSession/MessageHistory";

// --- Intro message that repeats every time the session becomes ready ---
const INTRO_MESSAGE =
  "Hi. I am the Digital Twin of Major General Paul Nanson - the former Commandant of the Royal Military Academy Sandhurst and author of “Standup Straight”, exploring the fundamentals of leadership at the academy. Lets explore these principles together. Where would you like to start?";

// Hardcoded configuration as requested
const DEFAULT_CONFIG: StartAvatarRequest = {
  quality: AvatarQuality.Low,
  avatarName: "910777e7-530e-47cb-bd29-b3661ca8a74f",
  knowledgeId: "ceaed12f-72d8-431e-9d9d-2ab9c5b965f7",
  voice: {
    rate: 1.5,
    emotion: VoiceEmotion.EXCITED,
    model: ElevenLabsModel.eleven_flash_v2_5,
  },
  language: "en",
  voiceChatTransport: VoiceChatTransport.WEBSOCKET,
  sttSettings: {
    provider: STTProvider.DEEPGRAM,
  },
};

function InteractiveAvatar() {
  const { initAvatar, startAvatar, stopAvatar, sessionState, stream } =
    useStreamingAvatarSession();
  const { startVoiceChat } = useVoiceChat();
  // const { addMessageToHistory } = useMessageStore(); // optional

  const [config] = useState<StartAvatarRequest>(DEFAULT_CONFIG);
  const [chatMode, setChatMode] = useState<"text" | "voice" | "video">("text");

  const mediaStream = useRef<HTMLVideoElement>(null);

  // store the timeout id so we can clear it on unmount / stop
  const introTimeoutRef = useRef<number | null>(null);

  async function fetchSessionData() {
    try {
      const response = await fetch("/api/get-access-token", { method: "POST" });
      const data = await response.json();
      console.log("Session Data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching session data:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(
    async (mode: "text" | "voice" | "video") => {
      setChatMode(mode);
      const isVoiceChat = mode === "voice" || mode === "video";

      try {
        const sessionData = await fetchSessionData();
        // The hook now handles initialization using session_token inside startAvatar
        // but we still want to set up listeners before calling startAvatar if needed.
        // However, the hook version I wrote sets up listeners inside 'start'.

        const avatar = await startAvatar(config, sessionData);

        avatar.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
          console.log("Avatar started talking", e);
        });
        avatar.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
          console.log("Avatar stopped talking", e);
        });
        avatar.on(StreamingEvents.STREAM_DISCONNECTED, () => {
          console.log("Stream disconnected");
        });

        // Proactive, repeatable greeting with a 5 second delay
        avatar.on(StreamingEvents.STREAM_READY, async (event) => {
          console.log(">>>>> Stream ready:", event.detail);

          // clear any previous timeout just in case
          if (introTimeoutRef.current) {
            window.clearTimeout(introTimeoutRef.current);
            introTimeoutRef.current = null;
          }

          // schedule the intro speak after 5 seconds
          introTimeoutRef.current = window.setTimeout(async () => {
            try {
              await avatar.speak({
                text: INTRO_MESSAGE,
                taskType: TaskType.REPEAT,
              });
            } catch (err) {
              console.error("Failed to send intro message:", err);
            } finally {
              introTimeoutRef.current = null;
            }
          }, 5000); // 5000ms = 5s
        });

        avatar.on(StreamingEvents.USER_START, (event) => {
          console.log(">>>>> User started talking:", event);
        });
        avatar.on(StreamingEvents.USER_STOP, (event) => {
          console.log(">>>>> User stopped talking:", event);
          if (introTimeoutRef.current) {
            window.clearTimeout(introTimeoutRef.current);
            introTimeoutRef.current = null;
          }
        });

        if (isVoiceChat) {
          await startVoiceChat();
        }
      } catch (error) {
        console.error("Error starting avatar session:", error);
      }
    }
  );

  // clear timeout and stop avatar on unmount
  useUnmount(() => {
    if (introTimeoutRef.current) {
      window.clearTimeout(introTimeoutRef.current);
      introTimeoutRef.current = null;
    }
    stopAvatar();
  });

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current!.play();
      };
    }
  }, [mediaStream, stream]);

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden p-3 sm:p-0">
        <div className="relative w-full aspect-video overflow-hidden flex flex-col items-center justify-center">
          {sessionState !== StreamingAvatarSessionState.INACTIVE ? (
            <AvatarVideo
              ref={mediaStream}
              showUserVideo={chatMode === "video"}
              userVideoPosition="bottom-right"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Ready to start chat with Sandhurst Coach</p>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 items-center justify-center p-4 border-t border-zinc-700 w-full">
          {sessionState === StreamingAvatarSessionState.CONNECTED ? (
            <div className="w-full flex flex-col sm:flex-row gap-3">
              <AvatarControls
                chatMode={chatMode}
                onChatModeChange={(newMode) => {
                  setChatMode(newMode);
                  if (newMode === "voice" || newMode === "video") {
                    // Start voice chat when switching modes (no params)
                    startVoiceChat();
                  }
                }}
              />
            </div>
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-col sm:flex-row justify-center gap-3 w-full">
              <Button onClick={() => startSessionV2("text")} className="w-full sm:w-auto">Start Text Chat</Button>
              <Button onClick={() => startSessionV2("voice")} className="w-full sm:w-auto">Start Voice Chat</Button>
              <Button onClick={() => startSessionV2("video")} className="w-full sm:w-auto">Start Video Chat</Button>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && (
        <div className="px-3 sm:px-0">
          <MessageHistory />
        </div>
      )}
    </div>
  );
}

export default function InteractiveAvatarWrapper() {
  return (
    <StreamingAvatarProvider basePath={process.env.NEXT_PUBLIC_BASE_API_URL}>
      <InteractiveAvatar />
    </StreamingAvatarProvider>
  );
}