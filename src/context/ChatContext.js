import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const ChatContext = createContext();

const socket = io('http://localhost:3001'); // URL du serveur WebSocket

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Gérer la connexion
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    // Écoute les messages entrants
    socket.on('receiveMessage', (message) => {
      // Vérifier si le message existe déjà pour éviter les doublons
      setMessages((prevMessages) => {
        // Vérifier si un message avec le même ID existe déjà
        const messageExists = prevMessages.some(msg =>
          msg.id === message.id ||
          (msg.content === message.content &&
           msg.type === message.type &&
           Math.abs(new Date(msg.timestamp) - new Date(message.timestamp)) < 1000)
        );

        // Si le message existe déjà, ne pas l'ajouter
        if (messageExists) {
          console.log('Message déjà existant, ignoré:', message);
          return prevMessages;
        }

        // Sinon, ajouter le message
        return [...prevMessages, message];
      });
    });

    // Charger les messages précédents au démarrage
    const loadInitialMessages = async () => {
      try {
        // Vous pouvez implémenter un appel API pour charger les messages précédents
        // const response = await fetch('http://localhost:3000/api/chat');
        // const data = await response.json();
        // setMessages(data);
      } catch (error) {
        console.error('Error loading initial messages:', error);
      }
    };

    loadInitialMessages();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('receiveMessage');
    };
  }, []);

  const sendMessage = (messageData) => {
    // Ajouter l'ID de l'expéditeur si nécessaire
    const enhancedMessage = {
      ...messageData,
      id: Date.now().toString(), // Générer un ID unique
    };

    // Ajouter le message localement et/ou l'envoyer au serveur
    if (messageData.type === 'user') {
      // Pour les messages utilisateur
      if (messageData.local === true) {
        // Ajouter localement et envoyer au serveur sans le flag local
        setMessages((prevMessages) => [...prevMessages, enhancedMessage]);

        // Envoyer une copie au serveur sans le flag local
        const serverMessage = { ...enhancedMessage };
        delete serverMessage.local;
        socket.emit('sendMessage', serverMessage);
      } else {
        // Comportement normal (ajouter localement et envoyer au serveur)
        socket.emit('sendMessage', enhancedMessage);
        setMessages((prevMessages) => [...prevMessages, enhancedMessage]);
      }
    } else {
      // Pour les messages du bot (toujours locaux)
      setMessages((prevMessages) => [...prevMessages, enhancedMessage]);

      // Si le message n'est pas marqué comme local, l'envoyer au serveur
      if (messageData.local !== true) {
        socket.emit('sendMessage', enhancedMessage);
      }
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ messages, sendMessage, clearMessages, isConnected }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
