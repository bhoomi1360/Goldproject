import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage, ChatResponse } from '../services/api';
import { Bot, Send, User, Sparkles, Terminal, CheckCircle2, XCircle } from 'lucide-react';

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
      text: "👋 Hi! I'm your AI Gold Loan Assistant. Tell me what jewellery you have (e.g. *\"I have 45 grams of 22 carat jewellery, how much can I get?\"*), and I'll calculate your loan eligibility in real-time!",
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
          text: '⚠️ Sorry, there was an issue connecting to the Loan Engine. Please try again.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="chat-panel">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary)',
            }}
          >
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Loan Assist Agent</div>
            <div className="chat-status">
              <span className="status-dot"></span>
              <span>Tools Connected & Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages" id="chat-messages-container">
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender}`}>
            {/* Tool Execution Chips */}
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div style={{ marginBottom: '0.4rem' }}>
                {m.toolCalls.map((tc, idx) => (
                  <div key={idx} className="chat-tool-chip">
                    <Terminal size={12} />
                    <span>called {tc.name}()</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ whiteSpace: 'pre-line' }}>{m.text}</div>

            {/* In-chat confirmation card if required */}
            {m.requiresConfirmation && (
              <div className="chat-confirmation-card">
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)', marginBottom: '4px' }}>
                  Confirmation Required
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleSendMessage('yes, confirm')}
                  >
                    <CheckCircle2 size={14} />
                    <span>Confirm & Submit</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={() => handleSendMessage('no, cancel')}
                  >
                    <XCircle size={14} />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble assistant">
            <span style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              Assistant is calling financial tools...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompt Pills */}
      <div className="quick-prompts">
        <button
          type="button"
          className="quick-pill"
          onClick={() =>
            handleQuickPrompt('I have 45 grams of 22 carat jewellery, how much can I get?')
          }
        >
          ✨ "45g of 22K jewellery quote"
        </button>
        <button
          type="button"
          className="quick-pill"
          onClick={() => handleQuickPrompt('What loan schemes are available?')}
        >
          📜 "Available schemes"
        </button>
        <button
          type="button"
          className="quick-pill"
          onClick={() => handleQuickPrompt('I have 10 grams of 18k gold')}
        >
          💎 "10g 18K quote"
        </button>
      </div>

      {/* Input Bar */}
      <form
        className="chat-input-bar"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
      >
        <input
          id="chat-user-input"
          type="text"
          className="chat-input"
          placeholder="Ask about your jewellery or loan..."
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
