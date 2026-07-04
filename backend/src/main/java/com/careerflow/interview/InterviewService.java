package com.careerflow.interview;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.common.SecurityUtils;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.interview.dto.InterviewRequest;
import com.careerflow.interview.dto.InterviewResponse;
import com.careerflow.interview.dto.InterviewUpdateRequest;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final ApplicationRepository applicationRepository;
    private final SecurityUtils securityUtils;

    public InterviewResponse create(Long applicationId, InterviewRequest request) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwnedApplication(applicationId, user.getId());

        Interview interview = Interview.builder()
                .application(application)
                .user(user)
                .scheduledAt(request.getScheduledAt())
                .round(request.getRound())
                .interviewType(request.getInterviewType())
                .location(request.getLocation())
                .interviewerName(request.getInterviewerName())
                .questionsAsked(request.getQuestionsAsked())
                .feedbackReceived(request.getFeedbackReceived())
                .outcome(request.getOutcome() != null ? request.getOutcome() : InterviewOutcome.AWAITING_RESPONSE)
                .build();

        return toResponse(interviewRepository.save(interview));
    }

    public List<InterviewResponse> getForApplication(Long applicationId) {
        User user = securityUtils.getCurrentUser();
        findOwnedApplication(applicationId, user.getId());
        return interviewRepository
                .findAllByUserIdAndApplicationIdOrderByScheduledAtAsc(user.getId(), applicationId)
                .stream().map(this::toResponse).toList();
    }

    public InterviewResponse update(Long id, InterviewUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        Interview interview = findOwned(id, user.getId());

        if (request.getScheduledAt() != null)    interview.setScheduledAt(request.getScheduledAt());
        if (request.getRound() != null)           interview.setRound(request.getRound());
        if (request.getInterviewType() != null)   interview.setInterviewType(request.getInterviewType());
        if (request.getLocation() != null)        interview.setLocation(request.getLocation());
        if (request.getInterviewerName() != null)  interview.setInterviewerName(request.getInterviewerName());
        if (request.getQuestionsAsked() != null)   interview.setQuestionsAsked(request.getQuestionsAsked());
        if (request.getFeedbackReceived() != null) interview.setFeedbackReceived(request.getFeedbackReceived());
        if (request.getOutcome() != null)          interview.setOutcome(request.getOutcome());

        return toResponse(interviewRepository.save(interview));
    }

    public void delete(Long id) {
        User user = securityUtils.getCurrentUser();
        Interview interview = findOwned(id, user.getId());
        interviewRepository.delete(interview);
    }

    private Interview findOwned(Long id, Long userId) {
        return interviewRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));
    }

    private JobApplication findOwnedApplication(Long applicationId, Long userId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private InterviewResponse toResponse(Interview i) {
        return InterviewResponse.builder()
                .id(i.getId())
                .applicationId(i.getApplication().getId())
                .companyId(i.getApplication().getCompany().getId())
                .companyName(i.getApplication().getCompany().getName())
                .role(i.getApplication().getRole())
                .scheduledAt(i.getScheduledAt())
                .round(i.getRound())
                .interviewType(i.getInterviewType())
                .location(i.getLocation())
                .interviewerName(i.getInterviewerName())
                .questionsAsked(i.getQuestionsAsked())
                .feedbackReceived(i.getFeedbackReceived())
                .outcome(i.getOutcome())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}
