import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatResponse } from '../services/api';
import { Bot, Send, Terminal, CheckCircle2, XCircle, RotateCcw, User, Sparkles } from 'lucide-react';

interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  toolCalls?: Array<{ name: string; args: any; result: any }>;
  requiresConfirmation?: ChatResponse['requiresConfirmation'];
}

interface ChatDrawerProps {
  onApplicationCreated?: (appId: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ onApplicationCreated }) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "👋 Namaste! I am your AI Gold Loan Officer. You can tell me in natural language what jewellery you hold—for example: *\"I have 45 grams of 22 carat jewellery, how much can I get?\"*—and I'll fetch live bullion calculations for you.",
    },
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionState, setSessionState] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || input).trim();
    if (!message || isTyping) return;

    setInput('');
    const userMsgId = `user-${Date.now()}`;
    const newMessages: ChatMessageItem[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: message },
    ];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const history = newMessages.map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

      const response: ChatResponse = await sendChatMessage(message, history, sessionState);

      setSessionState(response.state || {});

      const assistantMsgId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          sender: 'assistant',
          text: response.reply,
          toolCalls: response.toolCallsExecuted,
          requiresConfirmation: response.requiresConfirmation,
        },
      ]);

      if (response.applicationId && onApplicationCreated) {
        onApplicationCreated(response.applicationId);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: '⚠️ Unable to connect to the loan valuation server. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: "👋 Namaste! I am your AI Gold Loan Officer. How can I assist you with your gold loan inquiry today?",
      },
    ]);
    setSessionState({});
  };

  return (
    <div className="chat-panel">
      {/* Concierge Header */}
      <div className="chat-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="chat-avatar">
            <Bot size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              Loan Assist Concierge
            </div>
            <div style={{ fontSize: '0.725rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
              <span>Backend Engine Online</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetChat}
          className="btn-outline"
          style={{ padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
          title="Restart Conversation"
        >
          <RotateCcw size={12} />
          <span>Clear</span>
        </button>
      </div>

      {/* Message Timeline */}
      <div className="chat-messages" id="chat-messages-container">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender}`}>
            {/* Tool Execution Chips */}
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div style={{ marginBottom: '0.4rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {m.toolCalls.map((tc, idx) => (
                  <div key={idx} className="tool-badge-chip">
                    <Terminal size={11} />
                    <span>backend: {tc.name}()</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

            {/* In-chat confirmation card if submission is pending */}
            {m.requiresConfirmation && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem',
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--primary)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px' }}>
                  Confirmation Required
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Submit application for <strong>{m.requiresConfirmation.summary.fullName}</strong> ({m.requiresConfirmation.summary.eligibleLoan})?
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleSendMessage('yes, confirm')}
                  >
                    <CheckCircle2 size={13} />
                    <span>Confirm</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleSendMessage('no, cancel')}
                  >
                    <XCircle size={13} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Verifying backend tools...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Natural Quick Prompts */}
      <div className="quick-prompts-scroll">
        <button
          type="button"
          className="quick-prompt-pill"
          onClick={() => handleSendMessage('I have 45 grams of 22 carat jewellery, how much can I get?')}
        >
          🪙 "45g 22K jewellery quote"
        </button>
        <button
          type="button"
          className="quick-prompt-pill"
          onClick={() => handleSendMessage('What loan schemes are available?')}
        >
          📜 "Available loan plans"
        </button>
        <button
          type="button"
          className="quick-prompt-pill"
          onClick={() => handleSendMessage('I have 10 grams of 18k gold')}
        >
          💎 "10g 18K calculation"
        </button>
      </div>

      {/* Input Form */}
      <form
        className="chat-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          id="chat-user-input"
          type="text"
          className="form-input"
          style={{ padding: '0.65rem 0.9rem', fontSize: '0.875rem' }}
          placeholder="Type jewellery weight or loan question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <button
          id="chat-send-btn"
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0.65rem 1rem' }}
          disabled={!input.trim() || isTyping}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
};
