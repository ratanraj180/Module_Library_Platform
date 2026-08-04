# Live Chat Module

Realtime chat module with chat rooms, message history, typing indicator, online users list, and websocket integration structure.

## Features

- **Socket.io connection manager**: Simple setups wrapping connections securely.
- **Typing notifications support**: Client-triggered hooks matching keystrokes.
- **History persistence adapter**: Database persistence structure hook templates.

## Installation

```bash
npm install @org/live-chat-module
```

## Quick Start Server Integration

```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { registerChatHandlers } = require('@org/live-chat-module');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
});

server.listen(4000, () => console.log('Chat server listening on port 4000'));
```

## Quick Start React integration

```jsx
import React, { useEffect, useState } from 'react';
import { useChat } from '@org/live-chat-module/react';

export function ChatRoom() {
  const { messages, sendMessage, isTyping } = useChat('room_general');
  const [text, setText] = useState('');

  return (
    <div>
      <div className="messages-log">
        {messages.map(m => <p key={m.id}><b>{m.user}:</b> {m.text}</p>)}
        {isTyping && <p className="text-gray-400 text-xs">Someone is typing...</p>}
      </div>
      <input value={text} onChange={e => setText(e.target.value)} />
      <button onClick={() => sendMessage(text)}>Send</button>
    </div>
  );
}
```

## License

Internal Enterprise License. (C) 2026.
