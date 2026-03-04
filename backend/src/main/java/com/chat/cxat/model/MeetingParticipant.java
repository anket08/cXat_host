package com.chat.cxat.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Document(collection = "meeting_participants")
public class MeetingParticipant {

    @Id
    private String id;

    private String meetingCode;

    private String userId;

    private String joinedAt =
            LocalDateTime.now(ZoneOffset.UTC).toString();

    private String leftAt;

    public MeetingParticipant() {}

    public String getId() {
        return id;
    }

    public String getMeetingCode() {
        return meetingCode;
    }

    public String getUserId() {
        return userId;
    }

    public String getJoinedAt() {
        return joinedAt;
    }

    public String getLeftAt() {
        return leftAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setMeetingCode(String meetingCode) {
        this.meetingCode = meetingCode;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setJoinedAt(String joinedAt) {
        this.joinedAt = joinedAt;
    }

    public void setLeftAt(String leftAt) {
        this.leftAt = leftAt;
    }
}