CXAT — Real-Time Chat Backend

CXAT is a production-ready real-time chat backend built with Spring Boot, MongoDB, Redis caching, and WebSocket messaging.

It supports OTP-based authentication, real-time messaging, read receipts, and scalable caching architecture.

Designed with a clean layered architecture and deployed using Docker on Render Cloud.

Live Architecture
Frontend (Vercel)
        │
        │ REST + WebSocket
        ▼
   Spring Boot Backend
        │
 ┌──────┴────────┐
 ▼               ▼
MongoDB        Redis
(Persistence)  (Cache)
        │
        ▼
 Email Service
Key Features
Authentication

Gmail-only registration

OTP email verification

BCrypt password hashing

Duplicate email protection

Duplicate username protection

Real-Time Chat

Private chat rooms

WebSocket real-time messaging

Message history persistence

Read receipts

Performance Optimization

Redis caching

Cache Aside Pattern

Reduced database load

TTL-based cache invalidation

Security

BCrypt encrypted passwords

OTP verification

Email validation

Tech Stack
Layer	Technology
Backend Framework	Spring Boot 3
Database	MongoDB Atlas
Caching	Redis (Upstash)
Real-Time Messaging	WebSocket (STOMP)
Authentication	OTP Email + BCrypt
Email Service	Spring Mail
Containerization	Docker
Deployment	Render
Frontend	Vercel
Backend Architecture

The backend follows a Layered Architecture Pattern.

Controller → Service → Repository → MongoDB
                     ↓
                    Redis Cache
                     ↓
                  WebSocket
                     ↓
                   Email Service
Layers Explained

Controller Layer

Handles incoming HTTP requests and routes them to services.

Service Layer

Contains business logic like authentication, messaging, and caching.

Repository Layer

Uses Spring Data MongoDB to interact with the database.

Redis Layer

Handles caching for message history and online users.

WebSocket Layer

Provides real-time message delivery and read receipts.

Project Structure
com.chat.cxat
│
├── config
│     ├── RedisConfig.java
│     ├── PasswordConfig.java
│     ├── SecurityConfig.java
│     ├── CorsConfig.java
│     └── WebSocketConfig.java
│
├── controller
│     ├── AuthController.java
│     ├── ChatController.java
│     └── WebSocketChatController.java
│
├── model
│     ├── User.java
│     ├── ChatRoom.java
│     ├── Message.java
│     └── ReadReceipt.java
│
├── repository
│     ├── UserRepository.java
│     ├── ChatRoomRepository.java
│     └── MessageRepository.java
│
├── service
│     ├── UserService.java
│     ├── ChatService.java
│     ├── RedisService.java
│     └── MailService.java
│
└── CxatApplication.java
REST API Endpoints
Authentication
Method	Endpoint	Description
POST	/auth/send-otp	Send email OTP
POST	/auth/verify-otp	Verify OTP
POST	/auth/register	Register user
POST	/auth/login	Login
POST	/auth/forgot	Forgot password
POST	/auth/reset	Reset password
GET	/auth/health	Health check
Chat
Method	Endpoint	Description
POST	/chat/room	Create chat room
POST	/chat/send	Send message
GET	/chat/messages/{roomId}	Get message history
GET	/chat/room/{roomId}/exists	Check room
WebSocket API

WebSocket Endpoint

/ws

Send Message

/app/chat

Broadcast Topic

/topic/messages/{roomId}

Read Receipts

/app/read

Broadcast

/topic/read/{roomId}
Redis Caching Strategy
Online Users

Key

online:username

TTL

300 seconds
Chat Messages Cache

Key

chat:roomId

TTL

3600 seconds
Cache Aside Pattern
Client Request
      ↓
Check Redis Cache
      ↓
Cache Hit → Return
Cache Miss → Query MongoDB
                ↓
          Update Redis Cache
Database Collections

MongoDB collections used:

users
chatrooms
messages
Deployment

The application is deployed using Docker on Render Cloud.

Build
mvn clean package
Docker Build
docker build -t cxat-backend .
Run Container
docker run -p 8080:8080 cxat-backend
Problems Solved During Development
Redis Serialization Error

Redis could not serialize objects.

Fix

GenericJackson2JsonRedisSerializer

added in Redis configuration.

Redis LocalDateTime Error

Redis could not store LocalDateTime.

Fix

Converted to string timestamp.

WebSocket Cloud Connection Issue

WebSocket worked locally but failed on cloud.

Fix

setAllowedOriginPatterns("*")

added in WebSocket config.

Render Cold Start Issue

Backend took 30–60 seconds to start.

Fix

/auth/health

endpoint added for service warm-up.

Interview One-Liner

Built a real-time chat backend using Spring Boot with MongoDB persistence, Redis caching, WebSocket messaging, OTP-based authentication, and email integration deployed on Render using Docker.

Author

Anket Aeri
