package com.careerflow.contactfollowup;

import com.careerflow.common.PageResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.contact.Contact;
import com.careerflow.contact.ContactRepository;
import com.careerflow.contactfollowup.dto.ContactFollowUpRecommendationResponse;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.outreach.OutreachEvent;
import com.careerflow.outreach.OutreachEventRepository;
import com.careerflow.outreach.OutreachResponseStatus;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactFollowUpRecommendationService {

    public static final int DEFAULT_THRESHOLD_DAYS = 7;

    private final ContactFollowUpRecommendationRepository recommendationRepository;
    private final ContactRepository contactRepository;
    private final OutreachEventRepository outreachEventRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;

    @Transactional
    public PageResponse<ContactFollowUpRecommendationResponse> list(
            Integer thresholdDaysOverride, RecommendationStatus statusFilter, int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        int thresholdDays = thresholdDaysOverride != null ? thresholdDaysOverride : DEFAULT_THRESHOLD_DAYS;

        generateRecommendations(user, workspace, thresholdDays);

        Pageable pageable = org.springframework.data.domain.PageRequest.of(
                Math.max(page, 0), size <= 0 ? 10 : size,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "generatedAt"));

        RecommendationStatus effectiveStatus = statusFilter != null ? statusFilter : RecommendationStatus.PENDING;
        Page<ContactFollowUpRecommendation> results =
                recommendationRepository.findAllByUserIdAndWorkspaceIdAndStatus(user.getId(), workspaceId, effectiveStatus, pageable);

        return PageResponse.of(results.map(this::toResponse));
    }

    @Transactional
    public void generateRecommendations(User user, Workspace workspace, int thresholdDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(thresholdDays);

        List<Contact> contacts = contactRepository.findAllByUserIdAndWorkspaceId(
                user.getId(), workspace.getId(), Pageable.unpaged()).getContent();

        for (Contact contact : contacts) {
            outreachEventRepository
                    .findFirstByContactIdAndUserIdAndWorkspaceIdOrderByEventDateTimeDesc(contact.getId(), user.getId(), workspace.getId())
                    .filter(event -> isUnanswered(event) && event.getEventDateTime().isBefore(cutoff))
                    .ifPresent(event -> createIfNotDuplicate(contact, event, user, workspace, thresholdDays));
        }
    }

    public ContactFollowUpRecommendationResponse dismiss(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ContactFollowUpRecommendation reco = findOwned(id, user.getId(), workspaceId);
        reco.setStatus(RecommendationStatus.DISMISSED);
        reco.setDismissedAt(LocalDateTime.now());
        return toResponse(recommendationRepository.save(reco));
    }

    public ContactFollowUpRecommendationResponse convert(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        ContactFollowUpRecommendation reco = findOwned(id, user.getId(), workspaceId);
        reco.setStatus(RecommendationStatus.CONVERTED);
        reco.setConvertedAt(LocalDateTime.now());
        return toResponse(recommendationRepository.save(reco));
    }

    private boolean isUnanswered(OutreachEvent event) {
        return event.getResponseStatus() == OutreachResponseStatus.NO_RESPONSE
                || event.getResponseStatus() == OutreachResponseStatus.PENDING;
    }

    private void createIfNotDuplicate(Contact contact, OutreachEvent event, User user, Workspace workspace, int thresholdDays) {
        boolean alreadyExists = recommendationRepository.existsByTriggeringOutreachEventIdAndUserIdAndWorkspaceId(
                event.getId(), user.getId(), workspace.getId());
        if (alreadyExists) return;

        ContactFollowUpRecommendation recommendation = ContactFollowUpRecommendation.builder()
                .contact(contact)
                .triggeringOutreachEvent(event)
                .user(user)
                .workspace(workspace)
                .thresholdDays(thresholdDays)
                .recommendedAction("Follow up with " + contact.getName() + " — no response in " + thresholdDays + " days")
                .status(RecommendationStatus.PENDING)
                .generatedAt(LocalDateTime.now())
                .build();
        recommendationRepository.save(recommendation);
    }

    private ContactFollowUpRecommendation findOwned(Long id, Long userId, Long workspaceId) {
        return recommendationRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation not found"));
    }

    private ContactFollowUpRecommendationResponse toResponse(ContactFollowUpRecommendation r) {
        return ContactFollowUpRecommendationResponse.builder()
                .id(r.getId())
                .contactId(r.getContact().getId())
                .contactName(r.getContact().getName())
                .triggeringOutreachEventId(r.getTriggeringOutreachEvent() != null ? r.getTriggeringOutreachEvent().getId() : null)
                .thresholdDays(r.getThresholdDays())
                .recommendedAction(r.getRecommendedAction())
                .status(r.getStatus())
                .generatedAt(r.getGeneratedAt())
                .dismissedAt(r.getDismissedAt())
                .convertedAt(r.getConvertedAt())
                .build();
    }
}
