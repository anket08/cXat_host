package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Document(collection = "messages")
public class Message {

    @Id
    private String id;

    private String roomId;
    private String senderId;
    private boolean read = false;
    private String content;

    // UTC timestamp
    private String createdAt =
            LocalDateTime.now(ZoneOffset.UTC).toString();


    // ======================
    // Default Constructor
    // Required for MongoDB & Redis
    // ======================
    public Message() {}


    // ======================
    // Getters
    // ======================

    public String getId() {
        return id;
    }

    public boolean isRead() {
        return read;
    }

    public String getRoomId() {
        return roomId;
    }
    
    

    public String getSenderId() {
        return senderId;
    }

    public String getContent() {
        return content;
    }

    public String getCreatedAt() {
        return createdAt;
    }


    // ======================
    // Setters
    // ======================

    public void setId(String id) {
        this.id = id;
    }
public void setRead(boolean read) {
        this.read = read;
    }
    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}