package com.chat.cxat.controller;

import com.chat.cxat.model.Meeting;
import com.chat.cxat.model.MeetingParticipant;
import com.chat.cxat.service.MeetingService;

import org.springframework.web.bind.annotation.*;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.List;

@RestController
@RequestMapping("/meeting")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    /*
     * =========================
     * RENDER KEEP ALIVE
     * =========================
     */
    @Scheduled(fixedRate = 30000)
    public void keepAlive() {
        // Keeps the container active to prevent WebSocket timeouts
    }

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    /*
     * =========================
     * CREATE MEETING
     * =========================
     */

    @PostMapping("/create")
    public Meeting createMeeting(@RequestParam String hostId) {

        return meetingService.createMeeting(hostId);
    }

    /*
     * =========================
     * JOIN MEETING
     * =========================
     */

    @PostMapping("/join")
    public String joinMeeting(
            @RequestParam String meetingCode,
            @RequestParam String userId) {

        return meetingService.joinMeeting(meetingCode, userId);
    }

    /*
     * =========================
     * LEAVE MEETING
     * =========================
     */

    @PostMapping("/leave")
    public String leaveMeeting(
            @RequestParam String meetingCode,
            @RequestParam String userId) {

        return meetingService.leaveMeeting(meetingCode, userId);
    }

    /*
     * =========================
     * END MEETING
     * =========================
     */

    @PostMapping("/end")
    public String endMeeting(
            @RequestParam String meetingCode,
            @RequestParam String hostId) {

        return meetingService.endMeeting(meetingCode, hostId);
    }

    /*
     * =========================
     * GET PARTICIPANTS
     * =========================
     */

    @GetMapping("/participants/{code}")
    public List<MeetingParticipant> getParticipants(
            @PathVariable String code) {

        return meetingService.getParticipants(code);
    }

    /*
     * =========================
     * GET USER'S MEETINGS
     * =========================
     */

    @GetMapping("/user/{userId}")
    public List<MeetingParticipant> getUserMeetings(
            @PathVariable String userId) {

        return meetingService.getUserMeetings(userId);
    }

}