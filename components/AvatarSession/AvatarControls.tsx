import { ToggleGroup, ToggleGroupItem } from "@radix-ui/react-toggle-group";
import React from "react";

import { useVoiceChat } from "../logic/useVoiceChat";
import { Button } from "../Button";
import { useInterrupt } from "../logic/useInterrupt";

import { AudioInput } from "./AudioInput";
import { TextInput } from "./TextInput";

interface AvatarControlsProps {
  chatMode?: 'text' | 'voice' | 'video';
  onChatModeChange?: (mode: 'text' | 'voice' | 'video') => void;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({ 
  chatMode = 'text', 
  onChatModeChange 
}) => {
  const {
    isVoiceChatLoading,
    isVoiceChatActive,
    startVoiceChat,
    stopVoiceChat,
  } = useVoiceChat();
  const { interrupt } = useInterrupt();

  return (
    <div className="flex flex-col gap-3 relative w-full items-center">
      <ToggleGroup
        className={`bg-zinc-700 rounded-lg p-1 w-full md:w-auto flex items-center justify-between  ${isVoiceChatLoading ? "opacity-50" : ""}`}
        disabled={isVoiceChatLoading}
        type="single"
        value={chatMode}
        onValueChange={(value) => {
          const newMode = value as 'text' | 'voice' | 'video';
          if (onChatModeChange) {
            onChatModeChange(newMode);
          }
          
          if (newMode === "voice" || newMode === "video") {
            if (!isVoiceChatActive && !isVoiceChatLoading) {
              startVoiceChat();
            }
          } else if (newMode === "text") {
            if (isVoiceChatActive && !isVoiceChatLoading) {
              stopVoiceChat();
            }
          }
        }}
      >
        <ToggleGroupItem
          className="data-[state=on]:bg-zinc-800 rounded-lg py-2 px-7 text-sm text-center"
          value="text"
        >
          Text
        </ToggleGroupItem>
        <ToggleGroupItem
          className="data-[state=on]:bg-zinc-800 rounded-lg py-2 px-7 text-sm text-center"
          value="voice"
        >
          Voice
        </ToggleGroupItem>
        <ToggleGroupItem
          className="data-[state=on]:bg-zinc-800 rounded-lg py-2 px-7 text-sm text-center"
          value="video"
        >
          Video
        </ToggleGroupItem>
      </ToggleGroup>
      {(isVoiceChatActive || isVoiceChatLoading) && (chatMode === 'voice' || chatMode === 'video') ? <AudioInput /> : <TextInput />}
      <div className="absolute top-[-70px] right-3">
        <Button className="!bg-zinc-700 !text-white" onClick={interrupt}>
          Interrupt
        </Button>
      </div>
    </div>
  );
};
