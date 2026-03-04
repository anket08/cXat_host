package com.chat.cxat.repository;

import com.chat.cxat.model.Meeting;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MeetingRepository extends MongoRepository<Meeting, String> {

    // find meeting using meetingCode
    Meeting findByMeetingCode(String meetingCode);

}