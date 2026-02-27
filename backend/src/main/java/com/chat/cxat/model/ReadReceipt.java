package com.chat.cxat.model;

public class ReadReceipt {

    private String roomId;
    private String userId;

    public ReadReceipt(){}

    public String getRoomId() {
        return roomId;
    }

    public String getUserId() {
        return userId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}