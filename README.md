# CRYPTOKEN - Web3 Tasks Platform

A decentralized platform that connects users with Web3 communities through task completion and social engagement.

## 🌟 Features

### 🔗 **Multi-Platform Authentication**
- **Wallet Connect**: MetaMask, WalletConnect, and other EVM wallets
- **SIWE Protocol**: Secure Sign-In with Ethereum implementation

### 🎯 **Task Management System**
- **Social Media Tasks**: Follow, like, retweet, comment across platforms
- **Community Engagement**: Join Discord servers, Telegram channels
- **Content Creation**: Create posts, share content
- **Custom Tasks**: Flexible task creation for event organizers

### 🏆 **Gamification & Rewards**
- **Points System**: Earn points for completing tasks
- **Event Participation**: Join community events and campaigns
- **Progress Tracking**: Monitor your engagement and achievements

### 📱 **Platform Integrations**
- **Twitter/X**: Intent-based actions (follow, like, retweet)
- **Discord**: Server joining and verification
- **Telegram**: Channel/group participation
- **YouTube**: Channel subscriptions and engagement
- **Instagram & Facebook**: Social media interactions

### 🛠 **User Experience**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live task completion tracking
- **Glass UI**: Modern, aesthetic interface design
- **Feedback System**: Built-in user feedback collection

## 🏗 **Tech Stack**

### **Frontend**
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS, Aceternity UI with custom glass morphism effects
- **Animations**: Framer Motion for smooth interactions
- **Web3**: Wagmi + Viem for Ethereum integration
- **Wallet**: Reown AppKit (formerly WalletConnect)
- **State Management**: React hooks and context

### **Backend**
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with HTTP-only cookies
- **Social APIs**: Twitter, Discord, Telegram, Google OAuth
- **Security**: CORS, rate limiting, input validation

### **Blockchain**
- **Networks**: Ethereum Mainnet, Arbitrum, Polygon
- **Standards**: EIP-4361 (Sign-In with Ethereum)
- **Wallets**: MetaMask, WalletConnect and other EVM wallets

## 🚀 **Getting Started**

### **Prerequisites**
```bash
# Node.js 18+ and npm
node --version
npm --version

# MongoDB (local or cloud)
# Web3 wallet (MetaMask recommended)
```

### **Installation**

#### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/web3-tasks-site.git
cd web3-tasks-site
```

#### **2. Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Configure your environment variables
```

#### **3. Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env.local file
cp .env.example .env.local
# Configure your environment variables
```

#### **4. Environment Variables**

**Backend (.env)**
```bash
# Database
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Social Media APIs
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
# ... other API credentials

# Server Configuration
PORT=5001
FRONTEND_URL=http://localhost:3001
```

**Frontend (.env.local)**
```bash
# Web3 Configuration
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id

# Backend API
BACKEND_URL=http://localhost:5001
NEXT_PUBLIC_BACKEND_URL=http://localhost:5001
```

#### **5. Run Development Servers**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Application runs on http://localhost:3001
```

## 📖 **Usage Guide**

### **For Users**
1. **Connect Wallet**: Use MetaMask or any supported EVM wallet
2. **Sign Message**: Complete SIWE authentication
3. **Link Socials**: Connect Twitter, Discord, Telegram accounts
4. **Join Events**: Browse and participate in community events
5. **Complete Tasks**: Earn points by completing social media tasks
6. **Track Progress**: Monitor your points and achievements

### **For Event Creators**
1. **Create Events**: Set up community engagement campaigns
2. **Add Tasks**: Configure social media and engagement tasks
3. **Set Rewards**: Define point values for task completion
4. **Monitor Progress**: Track participant engagement
5. **Manage Community**: Build and grow your Web3 community

## 🏛 **Project Structure**

```
web3-tasks-site/
├── frontend/                 # Next.js application
│   ├── app/                 # App router pages
│   ├── components/          # React components
│   ├── config/             # Web3 and app configuration
│   ├── hooks/              # Custom React hooks
│   └── lib/                # Utility libraries
├── backend/                 # Express.js API
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication & validation
│   └── controllers/        # Business logic
└── docs/                   # Documentation
```

## 📝 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/nonce` - Get SIWE nonce
- `POST /api/auth/verify` - Verify SIWE signature
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Logout user

### **Task Management**
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id/complete` - Complete task

### **Social Integration**
- `GET /api/twitter/auth` - Twitter OAuth
- `GET /api/discord/auth` - Discord OAuth
- `GET /api/telegram/auth` - Telegram OAuth

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Wallet Connection Issues**
```bash
# Clear browser cache and reload
# Ensure EVM wallet is unlocked
# Check network configuration
```

#### **Backend Connection Errors**
```bash
# Verify MongoDB connection
# Check environment variables
# Ensure backend server is running
```

#### **Social Media Authentication Failures**
```bash
# Verify API credentials in .env
# Check OAuth redirect URLs
# Ensure proper CORS configuration
```

## 📚 **Resources**

- **[SIWE Documentation](https://eips.ethereum.org/EIPS/eip-4361)**
- **[Reown AppKit Docs](https://docs.reown.com/appkit)**
- **[Next.js Documentation](https://nextjs.org/docs)**
- **[Tailwind CSS](https://tailwindcss.com/docs)**

## 🙏 **Acknowledgments**

- **Ethereum Foundation** for EIP-4361 (SIWE)
- **Reown** for AppKit wallet connection
- **Next.js Team** for the amazing framework
- **Open Source Community** for all the amazing tools
