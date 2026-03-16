/** MultiplayerChat — In-game chat overlay for multiplayer sessions with message sanitization. */
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sanitizeChatMessage, sanitizePlayerName, isValidChatPayload } from '@/lib/security';

interface MultiplayerChatProps {
  isMultiplayer: boolean;
  phase: string;
  localPlayerName: string;
  sendMessage: (msg: any) => void;
  registerMessageHandler: (handler: (msg: any) => void) => (() => void);
  playSound: (sound: string) => void;
}

export const MultiplayerChat = ({
  isMultiplayer,
  phase,
  localPlayerName,
  sendMessage,
  registerMessageHandler,
  playSound,
}: MultiplayerChatProps) => {
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const showChatRef = useRef(showChat);

  useEffect(() => {
    showChatRef.current = showChat;
  }, [showChat]);

  // Listen for chat messages
  useEffect(() => {
    if (isMultiplayer && (phase === 'playing' || phase === 'roundEnd')) {
      const unsubscribe = registerMessageHandler((message: any) => {
        if (message.type === 'chat' && isValidChatPayload(message.payload)) {
          const payload = message.payload;
          const sanitizedText = sanitizeChatMessage(payload.text);
          const sanitizedSender = sanitizePlayerName(payload.sender);
          if (sanitizedText) {
            setChatMessages((prev) => [...prev, { sender: sanitizedSender, text: sanitizedText }]);
            playSound('message');
            if (!showChatRef.current) {
              setUnreadMessages((prev) => prev + 1);
            }
          }
        }
      });
      return unsubscribe;
    }
  }, [isMultiplayer, phase, registerMessageHandler, playSound]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }, 50);
    }
  }, [chatMessages]);

  const handleSend = () => {
    if (!chatInput.trim()) return;
    const sanitizedText = sanitizeChatMessage(chatInput);
    if (!sanitizedText) return;
    const message = { sender: localPlayerName, text: sanitizedText };
    setChatMessages((prev) => [...prev, message]);
    sendMessage({ type: 'chat', payload: message });
    setChatInput('');
  };

  if (!isMultiplayer) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {showChat ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-72 sm:w-80 bg-card border border-primary/30 rounded-xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-border">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="font-pirate text-primary">Chat</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(false)} className="h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-48 p-3 overflow-y-auto" ref={chatScrollRef}>
            <div className="space-y-2">
              {chatMessages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No messages yet</p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-sm p-2 rounded-lg max-w-[85%]',
                    msg.sender === localPlayerName ? 'bg-primary/20 ml-auto' : 'bg-muted'
                  )}
                >
                  <p className="text-xs font-bold text-primary/80">{msg.sender}</p>
                  <p className="text-foreground">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-2 border-t border-border flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button size="icon" onClick={handleSend} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      ) : (
        <Button
          onClick={() => {
            setShowChat(true);
            setUnreadMessages(0);
          }}
          className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-primary hover:bg-primary/90 shadow-lg relative"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </span>
          )}
        </Button>
      )}
    </div>
  );
};
