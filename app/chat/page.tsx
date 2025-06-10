"use client";

import { Sidebar } from "@/components/chat/Sidebar";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from '@ai-sdk/react';

// Mock data - replace with actual data from your backend
const mockThreads = [
  {
    id: "1",
    title: "Single Letter Title",
    href: "/chat/748c807a-fb3f-44c7-90f9-4b131e867e7c",
  },
];

const mockUser = {
  name: "Hairetsu",
  email: "user@example.com",
  image:
    "https://lh3.googleusercontent.com/a/ACg8ocL2wTXdETccyqR41WhgpL2xBIr-Qn-SYcnSVebxU11EQ4Aw_kqG=s1280-c",
  plan: "Free",
};

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();

  return (
    <div className="flex w-full">
      <div className="absolute inset-0 dark:bg-sidebar !fixed z-0">
        {/* Light mode gradient */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-0"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0)), linear-gradient(rgb(254, 247, 255) 15%, rgb(244, 214, 250))`,
          }}
        ></div>
        {/* Dark mode gradient */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-40"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
          }}
        ></div>
        <div className="absolute inset-0 bg-noise"></div>
        <div className="absolute inset-0 bg-black/40 dark:block hidden"></div>
      </div>
      <Sidebar threads={mockThreads} user={mockUser} />
      <ChatContainer 
        userName={mockUser.name} 
        messages={messages}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
