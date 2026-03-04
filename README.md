# CXAT Backend

Real-time chat backend built using **Spring Boot, MongoDB, Redis, and WebSocket** with **OTP authentication and email integration**.

Deployed using **Docker on Render Cloud**.

## Tech Stack

| Layer | Technology |
|------|------------|
| Backend Framework | Spring Boot 3 |
| Database | MongoDB Atlas |
| Caching | Redis (Upstash) |
| Real-Time Messaging | WebSocket (STOMP) |
| Authentication | OTP Email + BCrypt |
| Email Service | Spring Mail |
| Containerization | Docker |
| Deployment | Render |
| Frontend | Vercel |

---

## Backend Architecture

The backend follows a **Layered Architecture Pattern**.

---

## Layers Explained

### Controller Layer
Handles incoming **HTTP requests** and routes them to services.

### Service Layer
Contains business logic like:
- Authentication
- Messaging
- Caching

### Repository Layer
Uses **Spring Data MongoDB** to interact with the database.

### Redis Layer
Handles caching for:
- Message history
- Online users

### WebSocket Layer
Provides **real-time message delivery** and **read receipts**.

---

## Project Structure

---

## REST API Endpoints

### Authentication

| Method | Endpoint | Description |
|------|------|------|
| POST | /auth/send-otp | Send email OTP |
| POST | /auth/verify-otp | Verify OTP |
| POST | /auth/register | Register user |
| POST | /auth/login | Login |
| POST | /auth/forgot | Forgot password |
| POST | /auth/reset | Reset password |
| GET | /auth/health | Health check |

---

## Chat APIs

| Method | Endpoint | Description |
|------|------|------|
| POST | /chat/room | Create chat room |
| POST | /chat/send | Send message |
| GET | /chat/messages/{roomId} | Get message history |
| GET | /chat/room/{roomId}/exists | Check room |
