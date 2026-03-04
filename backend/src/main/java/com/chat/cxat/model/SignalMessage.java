package com.chat.cxat.model;

public class SignalMessage {

    private String type;
    private String senderId;
    private String receiverId;
    private String meetingCode;
    private String data;

    public SignalMessage() {}

    public String getType() {
        return type;
    }

    public String getSenderId() {
        return senderId;
    }

    public String getReceiverId() {
        return receiverId;
    }

    public String getMeetingCode() {
        return meetingCode;
    }

    public String getData() {
        return data;
    }

    public void setType(String type) {
        this.type = type;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public void setReceiverId(String receiverId) {
        this.receiverId = receiverId;
    }

    public void setMeetingCode(String meetingCode) {
        this.meetingCode = meetingCode;
    }

    public void setData(String data) {
        this.data = data;
    }
}