package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Document(collection = "readreceipts")
public class ReadReceipt {

    @Id
    private String id;

    private String messageId;
    private String roomId;
    private String userId;

    private String readAt =
            LocalDateTime.now(ZoneOffset.UTC).toString();

    public ReadReceipt() {}

    public String getId() {
        return id;
    }

    public String getMessageId() {
        return messageId;
    }

    public String getRoomId() {
        return roomId;
    }

    public String getUserId() {
        return userId;
    }

    public String getReadAt() {
        return readAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setReadAt(String readAt) {
        this.readAt = readAt;
    }
}