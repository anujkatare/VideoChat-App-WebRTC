# 📹 WebRTC Video Chat Application

A real-time **video chat application** built using **WebRTC** for peer-to-peer communication and **Socket.IO** for signaling. Users can create or join rooms and communicate via live audio and video directly in the browser.

---

## 🚀 Features

- 🔴 Real-time video & audio calling  
- 👥 Peer-to-peer communication using WebRTC  
- 🔁 Signaling handled with Socket.IO  
- 🧭 Client-side routing using React Router DOM  
- 🌐 Separate client & server architecture  
- ⚡ Fast development with Vite  
- 🖥️ Clean and responsive UI  

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- JavaScript  
- HTML  
- CSS  
- React Router DOM  
- WebRTC  

### Backend
- Node.js  
- Express.js  
- Socket.IO  
- HTTP  

---

## 📁 Project Structure

```
video-chat-app/
│
├── client/        # React frontend
├── server/        # Node.js backend
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone 
cd video-chat-app
```

---

### 2️⃣ Install dependencies

#### Client
```bash
cd client
npm install
```

#### Server
```bash
cd server
npm install
```

---

## ▶️ Running the Application

### Start the Server
```bash
cd server
node index.js
```

The server will start listening for Socket.IO connections.

---

### Start the Client
```bash
cd client
npm run dev
```

The React application will run on:
```
http://localhost:5173
```
*(Port may vary depending on configuration)*

---

## 🔄 How It Works

1. User opens the app and creates or joins a room.
2. Socket.IO handles signaling (offer, answer, ICE candidates).
3. WebRTC establishes a peer-to-peer connection.
4. Audio and video streams are shared directly between users.

---

## 🔐 Requirements

- Modern browser (Chrome, Edge, Firefox)
- Camera and microphone access enabled
- Node.js installed

---

## 📌 Future Improvements

- 🔇 Mute / Unmute audio  
- 🎥 Turn camera on/off  
- 🧑‍🤝‍🧑 Multiple users in one room  
- 💬 Real-time chat during video calls  
- 🔐 Authentication and private rooms  

---

## 📄 License

This project is created for **learning and educational purposes**.
