import React, { useState, useContext, useEffect, useRef } from 'react';
import { FaPaperPlane, FaSmile, FaRobot, FaMicrophone, FaPaperclip } from 'react-icons/fa';
import ChatContext from '../context/ChatContext';
import { sendMessageToGemini, testGeminiConnection } from '../services/geminiService';
import './ChatBox.css';

const ChatBox = () => {
  const { messages, sendMessage } = useContext(ChatContext);
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const commonEmojis = ['😊', '👍', '❤️', '🙏', '👋', '🎉', '🔥', '✨', '💪', '👏'];

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      setIsTyping(true);
      sendMessage({
        content: newMessage,
        timestamp: new Date(),
        type: 'user',
        local: true,
      });

      const userMessage = newMessage;
      setNewMessage('');

      try {
        const response = await sendMessageToGemini(userMessage);
        sendMessage({
          content: response.content,
          timestamp: new Date(),
          type: 'bot',
          local: true,
        });
      } catch (error) {
        console.error('Error getting response from Gemini:', error);
        sendMessage({
          content: "Désolé, je n'ai pas pu traiter votre demande. Veuillez réessayer plus tard.",
          timestamp: new Date(),
          type: 'bot',
          local: true,
          isError: true,
        });
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('File selected:', file.name);
      sendMessage({
        content: `Fichier téléchargé: ${file.name} (fonctionnalité en cours de développement)`,
        timestamp: new Date(),
        type: 'system',
        local: true,
      });
    }
  };

  const handleQuickReply = (reply) => {
    setNewMessage(reply);
    setTimeout(() => handleSendMessage(), 100); // Auto-send for smoother UX
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testGeminiConnection();
        if (result.success) {
          console.log('Gemini API connection successful:', result.message);
          sendMessage({
            content:
              "Bonjour ! Je suis l'Assistant Gemini, votre aide pour gérer projets et tâches. Posez-moi des questions ou utilisez les suggestions ci-dessous pour commencer.",
            timestamp: new Date(),
            type: 'bot',
            local: true,
          });
        } else {
          console.error('Gemini API connection failed:', result.error);
          sendMessage({
            content: "Désolé, je ne peux pas me connecter à l'API Gemini pour le moment.",
            timestamp: new Date(),
            type: 'bot',
            local: true,
            isError: true,
          });
        }
      } catch (error) {
        console.error('Error testing Gemini connection:', error);
      }
    };

    testConnection();
  }, []);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const quickReplies = [
    "Quelles sont mes tâches aujourd'hui ?",
    'Quels projets sont en retard ?',
    "Qui est disponible dans l'équipe ?",
    'Comment ajouter une nouvelle tâche ?',
  ];

  return (
    <div className="chatbox-container">
      <div className="chatbox-card">
        <div className="chatbox-header">
          <div className="chatbot-info">
            <FaRobot className="chatbot-icon" aria-hidden="true" />
            <div>
              <h2 className="chatbot-name">Assistant Gemini</h2>
              <span className="chatbot-subtitle">Votre aide intelligente</span>
            </div>
          </div>
          <div className="chatbot-status">
            <span className="status-indicator online" aria-label="Statut en ligne"></span>
            <span className="status-text">En ligne</span>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-message ${msg.type} ${msg.isError ? 'error' : ''}`}
              role="article"
            >
              <div className="message-avatar">
                {msg.type === 'user' ? '👤' : msg.type === 'bot' ? '🤖' : 'ℹ️'}
              </div>
              <div className="message-content">
                <span className="message-text">{msg.content}</span>
                <span className="message-timestamp">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="typing-indicator" aria-live="polite">
              <span></span>
              <span></span>
              <span></span>
              <span className="typing-text">Gemini écrit...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="quick-replies" role="navigation">
          {quickReplies.map((reply, index) => (
            <button
              key={index}
              className="quick-reply"
              onClick={() => handleQuickReply(reply)}
              aria-label={`Suggestion: ${reply}`}
            >
              {reply}
            </button>
          ))}
        </div>

        <div className="input-group" role="form">
          <div className="input-actions">
            <button
              className="action-button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Ouvrir le sélecteur d'emojis"
              title="Ajouter un emoji"
            >
              <FaSmile />
            </button>
            {showEmojiPicker && (
              <div className="emoji-picker-container" ref={emojiPickerRef}>
                <div className="emoji-grid">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      className="emoji-button"
                      onClick={() => handleEmojiClick(emoji)}
                      aria-label={`Ajouter l'emoji ${emoji}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              className="action-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Joindre un fichier"
              title="Joindre un fichier"
            >
              <FaPaperclip />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <button
              className="action-button disabled"
              disabled
              aria-label="Enregistrement vocal (non disponible)"
              title="Enregistrement vocal (bientôt disponible)"
            >
              <FaMicrophone />
            </button>
          </div>
          <textarea
            placeholder="Écrivez un message..."
            className="input-field"
            value={newMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows="2"
            aria-label="Champ de saisie du message"
          />
          <button
            className="send-button"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            aria-label="Envoyer le message"
            title="Envoyer"
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;