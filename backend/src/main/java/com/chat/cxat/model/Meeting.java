package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Document(collection = "meetings")
public class Meeting {

    @Id
    private String id;

    private String meetingCode;

    private String hostId;

    private String status; // ACTIVE / ENDED

    private String createdAt =
            LocalDateTime.now(ZoneOffset.UTC).toString();

    public Meeting() {}

    public String getId() {
        return id;
    }

    public String getMeetingCode() {
        return meetingCode;
    }

    public String getHostId() {
        return hostId;
    }

    public String getStatus() {
        return status;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setMeetingCode(String meetingCode) {
        this.meetingCode = meetingCode;
    }

    public void setHostId(String hostId) {
        this.hostId = hostId;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}