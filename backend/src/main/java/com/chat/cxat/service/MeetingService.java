package com.chat.cxat.service;

import com.chat.cxat.model.Meeting;
import com.chat.cxat.model.MeetingParticipant;
import com.chat.cxat.repository.MeetingRepository;
import com.chat.cxat.repository.MeetingParticipantRepository;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Random;

@Service
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final MeetingParticipantRepository participantRepository;

    public MeetingService(
            MeetingRepository meetingRepository,
            MeetingParticipantRepository participantRepository) {

        this.meetingRepository = meetingRepository;
        this.participantRepository = participantRepository;
    }

    /*
     * =========================
     * GENERATE MEETING CODE
     * =========================
     */

    private String generateMeetingCode() {

        String chars = "abcdefghijklmnopqrstuvwxyz0123456789";

        StringBuilder code = new StringBuilder();

        Random random = new Random();

        for (int i = 0; i < 8; i++) {

            code.append(chars.charAt(random.nextInt(chars.length())));
        }

        return code.toString();
    }

    /*
     * =========================
     * CREATE MEETING
     * =========================
     */

    public Meeting createMeeting(String hostId) {

        Meeting meeting = new Meeting();

        String code = generateMeetingCode();

        meeting.setMeetingCode(code);

        meeting.setHostId(hostId);

        meeting.setStatus("ACTIVE");

        meetingRepository.save(meeting);

        return meeting;
    }

    /*
     * =========================
     * JOIN MEETING
     * =========================
     */

    public String joinMeeting(String meetingCode, String userId) {

        Meeting meeting = meetingRepository.findByMeetingCode(meetingCode);

        if (meeting == null)
            return "Meeting not found";

        if (!"ACTIVE".equals(meeting.getStatus()))
            return "Meeting ended";

        MeetingParticipant existing =
                participantRepository.findByMeetingCodeAndUserId(
                        meetingCode,
                        userId);

        if (existing != null)
            return "Already joined";

        MeetingParticipant participant = new MeetingParticipant();

        participant.setMeetingCode(meetingCode);

        participant.setUserId(userId);

        participantRepository.save(participant);

        return "Joined";
    }

    /*
     * =========================
     * LEAVE MEETING
     * =========================
     */

    public String leaveMeeting(String meetingCode, String userId) {

        MeetingParticipant participant =
                participantRepository.findByMeetingCodeAndUserId(
                        meetingCode,
                        userId);

        if (participant == null)
            return "Not in meeting";

        participant.setLeftAt(
                String.valueOf(System.currentTimeMillis()));

        participantRepository.save(participant);

        return "Left";
    }

    /*
     * =========================
     * END MEETING
     * =========================
     */

    public String endMeeting(String meetingCode, String hostId) {

        Meeting meeting = meetingRepository.findByMeetingCode(meetingCode);

        if (meeting == null)
            return "Meeting not found";

        if (!meeting.getHostId().equals(hostId))
            return "Only host can end meeting";

        meeting.setStatus("ENDED");

        meetingRepository.save(meeting);

        return "Meeting ended";
    }

    /*
     * =========================
     * GET PARTICIPANTS
     * =========================
     */

    public List<MeetingParticipant> getParticipants(String meetingCode) {

        return participantRepository.findByMeetingCode(meetingCode);
    }

}