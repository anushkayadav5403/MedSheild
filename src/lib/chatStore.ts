import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DrMedShieldMessage } from './drSentinel';

interface ChatStore {
  messages: DrMedShieldMessage[];
  isEmergency: boolean;
  addMessage: (message: DrMedShieldMessage) => void;
  setMessages: (messages: DrMedShieldMessage[]) => void;
  setIsEmergency: (isEmergency: boolean) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      isEmergency: false,
      
      addMessage: (message) => 
        set((state) => ({ 
          messages: [...state.messages, message] 
        })),
      
      setMessages: (messages) => set({ messages }),
      
      setIsEmergency: (isEmergency) => set({ isEmergency }),
      
      clearChat: () => set({ messages: [], isEmergency: false }),
    }),
    {
      name: 'medshield-chat-storage',
      // We need to handle Date objects during hydration because JSON.stringify converts them to strings
      onRehydrateStorage: () => (state) => {
        if (state && state.messages) {
          state.messages = state.messages.map(m => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
      }
    }
  )
);
