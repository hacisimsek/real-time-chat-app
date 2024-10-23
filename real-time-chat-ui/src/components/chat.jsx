import React, { useState, useEffect, useRef } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';

const Chat = () => {
  const [username, setUsername] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not Connected');
  const stompClient = useRef(null);

  const socketUrl = 'http://localhost:8080/ws';

  useEffect(() => {
    if (isLoggedIn && !stompClient.current) {
      connect();
    }

    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect();
        stompClient.current = null;
      }
    };
  }, [isLoggedIn]);

  const connect = () => {
    const socket = new SockJS(socketUrl);
    stompClient.current = Stomp.over(socket);

    stompClient.current.connect({}, onConnected, onError);
  };

  const onConnected = () => {
    setConnectionStatus('Connected');

    stompClient.current.subscribe('/topic/public', onMessageReceived);

    stompClient.current.send("/app/chat.addUser", {}, JSON.stringify({
      sender: username,
      type: 'JOIN',
      content: `${username} joined the chat`
    }));
  };

  const onError = (error) => {
    console.error('Could not connect to WebSocket server. Please refresh this page to try again!', error);
    setConnectionStatus('Connection Failed');
  };

  const onMessageReceived = (message) => {
    const messageData = JSON.parse(message.body);
    setMessages((prevMessages) => [...prevMessages, messageData]);
  };

  const handleLogin = () => {
    if (username.trim()) {
      setIsLoggedIn(true);
    }
  };

  const handleSendMessage = (event) => {
    event.preventDefault();
    if (messageInput.trim() && stompClient.current) {
      const chatMessage = {
        sender: username,
        content: messageInput,
        type: 'CHAT',
      };
      stompClient.current.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
      setMessageInput('');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Chat Application</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
            >
              Log In
            </button>
            <div className="text-sm text-center text-gray-500">
              Connection Status: {connectionStatus}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold">Chat Application</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {connectionStatus}
            </span>
            <span className="text-sm font-medium">
              {username}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === username ? 'justify-end' : 'justify-start'}`}
            >
              {msg.type === 'CHAT' ? (
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === username
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {msg.sender}
                  </div>
                  <div className="break-words">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="text-center text-sm text-gray-500 w-full py-2">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto flex space-x-4">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(e)}
            className="flex-1 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
