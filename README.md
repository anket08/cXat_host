# CXAT – Spring Boot Chat Backend

CXAT is a basic chat backend built using **Spring Boot**.
It follows a **layered architecture** and supports user registration, chat room creation, message sending, and message history retrieval.

This project is designed as the **backend foundation** for a real-time chat system and can later be extended with WebSockets, Redis, and Kafka.

---

## Tech Stack

* Java 17
* Spring Boot
* Spring Web
* Spring Data JPA
* Spring Security (basic open config)
* MySQL
* Maven

---

## Project Architecture

The backend follows a **layered structure**:

```
Controller → Service → Repository → Database
```

### Flow

1. Client sends HTTP request.
2. Controller receives the request.
3. Service processes business logic.
4. Repository interacts with the database.
5. Response is returned to the client.

---

## Project Structure

```
com.chat.cxat
 ├── config
 │    └── SecurityConfig
 ├── controller
 │    ├── AuthController
 │    └── ChatController
 ├── model
 │    ├── User
 │    ├── ChatRoom
 │    └── Message
 ├── repository
 │    ├── UserRepository
 │    ├── ChatRoomRepository
 │    └── MessageRepository
 ├── service
 │    ├── UserService
 │    └── ChatService
 └── CxatApplication
```

---

## Database Schema

The backend uses the following main tables:

### users

Stores registered users.

* id (PK)
* username
* email
* password
* status
* created_at

### chat_rooms

Represents private or group chats.

* id (PK)
* name
* type (PRIVATE/GROUP)
* created_at

### messages

Stores chat messages.

* id (PK)
* room_id (FK)
* sender_id (FK)
* content
* created_at

---

## API Endpoints

### Auth APIs

#### Register User

```
POST /auth/register
```

Body:

```json
{
  "username": "user1",
  "email": "user1@gmail.com",
  "password": "1234"
}
```

Response:

```json
{
  "id": 1,
  "username": "user1",
  "email": "user1@gmail.com",
  "password": "1234",
  "status": "OFFLINE",
  "createdAt": "2026-02-11T00:04:52"
}
```

---

#### Login

```
POST /auth/login
```

Body:

```json
{
  "username": "user1",
  "password": "1234"
}
```

Response:

```
Login successful
```

---

### Chat APIs

#### Create Chat Room

```
POST /chat/room
```

Response:

```json
{
  "id": 1,
  "name": null,
  "type": "PRIVATE",
  "createdAt": "..."
}
```

---

#### Send Message

```
POST /chat/send
```

Body:

```json
{
  "roomId": 1,
  "senderId": 1,
  "content": "Hello"
}
```

---

#### Get Messages

```
GET /chat/messages/{roomId}
```

Example:

```
GET /chat/messages/1
```

Response:

```json
[
  {
    "id": 1,
    "roomId": 1,
    "senderId": 1,
    "content": "Hello",
    "createdAt": "..."
  }
]
```

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd cxat/backend
```

---

### 2. Configure database

Edit `application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/cxat_db
spring.datasource.username=root
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

---

### 3. Run the application

Windows:

```bash
mvnw.cmd spring-boot:run
```

Mac/Linux:

```bash
./mvnw spring-boot:run
```

Server will start at:

```
http://localhost:8080
```

---

## Current Features

* User registration
* Basic login validation
* Chat room creation
* Message sending
* Message history retrieval
* Layered Spring Boot architecture

---

## Planned Features (Next Phases)

* WebSocket real-time chat
* JWT authentication
* Group chat support
* Read receipts
* Redis presence tracking
* Kafka-based async messaging

---

## Author

Built as part of a system-design oriented chat backend using Spring Boot.
"# cXat_host" 
