'use client';

import { useState, useRef, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Bot, Send, User, Sparkles, ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUERIES = [
  'Find backend candidates with Docker experience',
  'Show candidates with strong communication scores',
  'Who has verified Python skills?',
  'Compare Arjun and Vikram',
  'Recommend top 3 candidates for Senior Engineer role',
  'Which candidates have risk indicators?',
];

// TODO: Connect to real Copilot API (Epic 2/4)
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "I'm your AI Hiring Copilot. I can help you search candidates, compare profiles, surface evidence, and generate recommendations based on your candidate data.\n\nTry asking me something like: \"Find backend candidates with verified Python skills\" or \"Compare our top 3 DevOps candidates.\"",
    timestamp: new Date(),
  },
];

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (query?: string) => {
    const text = query || inputValue.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // TODO: Replace with real API call to copilot endpoint
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Based on your query "${text}", I found the following insights:\n\n• **3 candidates** match this criteria in your pipeline\n• **Arjun Mehta** has the strongest evidence score (87%) with verified skills across 4 sources\n• **Vikram Singh** has the highest overall readiness (88%) with all evidence sources verified\n\nWould you like me to generate a detailed comparison or export a shortlist report?`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, response]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <PageHeader
        title="AI Recruiter Copilot"
        description="Ask questions, search candidates, and get evidence-based recommendations"
        icon={Bot}
      />

      {/* Chat area */}
      <Card className="border-border flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex gap-3", message.role === 'user' && "justify-end")}>
              {message.role === 'assistant' && (
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={cn(
                "max-w-[70%] rounded-xl px-4 py-3",
                message.role === 'assistant'
                  ? "bg-muted/50 border border-border"
                  : "bg-primary text-primary-foreground"
              )}>
                <p className="text-xs leading-relaxed whitespace-pre-line">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-muted/50 border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested queries */}
        {messages.length <= 1 && (
          <div className="px-6 pb-3">
            <span className="text-2xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Suggested queries</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUERIES.map((query) => (
                <button
                  key={query}
                  onClick={() => handleSend(query)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border bg-muted/10">
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about candidates, compare profiles, generate reports..."
              className="flex-1 h-9 text-xs"
              disabled={isLoading}
            />
            <Button type="submit" size="sm" className="h-9 px-3" disabled={isLoading || !inputValue.trim()}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
