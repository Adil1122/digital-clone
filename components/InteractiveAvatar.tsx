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
  avatarName: "ba8d3dc309b6455faab9f114b42e3cd1",
  knowledgeId: "e03c0f1b6dcc4df99b18d62fea7e1425",
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

  async function fetchAccessToken() {
    try {
      const response = await fetch("/api/get-access-token", { method: "POST" });
      const token = await response.text();
      console.log("Access Token:", token);
      return token;
    } catch (error) {
      console.error("Error fetching access token:", error);
      throw error;
    }
  }

  const startSessionV2 = useMemoizedFn(
    async (mode: "text" | "voice" | "video") => {
      setChatMode(mode);
      const isVoiceChat = mode === "voice" || mode === "video";

      try {
        const newToken = await fetchAccessToken();
        const avatar = initAvatar(newToken);

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
              // Optionally mirror in text history:
              // addMessageToHistory({ role: "avatar", content: INTRO_MESSAGE });
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
          // If you want the avatar to interrupt the intro if user starts speaking,
          // clear the scheduled intro here:
          if (introTimeoutRef.current) {
            window.clearTimeout(introTimeoutRef.current);
            introTimeoutRef.current = null;
          }
        });
        avatar.on(StreamingEvents.USER_END_MESSAGE, (event) => {
          console.log(">>>>> User end message:", event);
        });
        avatar.on(StreamingEvents.USER_TALKING_MESSAGE, (event) => {
          console.log(">>>>> User talking message:", event);
        });
        avatar.on(StreamingEvents.AVATAR_TALKING_MESSAGE, (event) => {
          console.log(">>>>> Avatar talking message:", event);
        });
        avatar.on(StreamingEvents.AVATAR_END_MESSAGE, (event) => {
          console.log(">>>>> Avatar end message:", event);
        });

        await startAvatar(config);

        if (isVoiceChat) {
          // SDK signature is startVoiceChat(force?: boolean)
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
      <div className="flex flex-col rounded-xl bg-zinc-900 overflow-hidden">
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
          ) : sessionState === StreamingAvatarSessionState.INACTIVE ? (
            <div className="flex flex-row gap-4">
              <Button onClick={() => startSessionV2("text")}>Start Text Chat</Button>
              <Button onClick={() => startSessionV2("voice")}>Start Voice Chat</Button>
              <Button onClick={() => startSessionV2("video")}>Start Video Chat</Button>
            </div>
          ) : (
            <LoadingIcon />
          )}
        </div>
      </div>
      {sessionState === StreamingAvatarSessionState.CONNECTED && <MessageHistory />}
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