"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";
export default function App() {
  return (
    <div className="w-screen h-screen flex flex-col">
      <div className="w-[900px] max-w-full flex flex-col items-start justify-start gap-5 mx-auto pt-4 pb-20 px-3 sm:px-0">
        <div className="w-full">
          <InteractiveAvatar />
        </div>
      </div>
    </div>
  );
}
