package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

// import lombok.AllArgsConstructor;
// import lombok.Data;
// import lombok.NoArgsConstructor;

// @Data
// @AllArgsConstructor
// @NoArgsConstructor

@Document(collection = "chat_rooms")
public class ChatRoom {

    public ChatRoom() {}
    @Id
    private String id;   // 4-digit room code

    private String name;
    private String type;
    private String createdAt =LocalDateTime.now(ZoneOffset.UTC).toString(); 

    public String getId() {
        return id;
    }
    public String getName() {
        return name;
    }
    public String getType() {
        return type;
    }
    public String getCreatedAt() {
        return createdAt;
    }
    public void setId(String id) {
        this.id = id;
    }
    public void setName(String name) {
        this.name = name;
    }
    public void setType(String type) {
        this.type = type;
    }
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    
    
}