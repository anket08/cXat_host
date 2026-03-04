package com.chat.cxat.repository;

import com.chat.cxat.model.MeetingParticipant;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingParticipantRepository extends MongoRepository<MeetingParticipant, String> {

    // find all users in meeting
    List<MeetingParticipant> findByMeetingCode(String meetingCode);

    // check if user already joined
    MeetingParticipant findByMeetingCodeAndUserId(String meetingCode, String userId);

}