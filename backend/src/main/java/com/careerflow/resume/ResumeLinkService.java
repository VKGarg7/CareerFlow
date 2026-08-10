package com.careerflow.resume;

import com.careerflow.application.JobApplication;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ResumeLinkService {

    private final ResumeLinkHistoryRepository resumeLinkHistoryRepository;

    public void linkToApplication(JobApplication application, Resume newResume, User user) {
        Resume previous = application.getResumeLibrary();
        if (Objects.equals(previous == null ? null : previous.getId(), newResume.getId())) return;
        application.setResumeLibrary(newResume);
        recordLink(previous, newResume, LinkedEntityType.APPLICATION, application.getId(), user);
    }

    public void unlinkFromApplication(JobApplication application, User user) {
        Resume previous = application.getResumeLibrary();
        if (previous == null) return;
        application.setResumeLibrary(null);
        recordUnlink(previous, LinkedEntityType.APPLICATION, application.getId(), user);
    }

    public void linkToOpportunity(Opportunity opportunity, Resume newResume, User user) {
        Resume previous = opportunity.getResumeLibrary();
        if (Objects.equals(previous == null ? null : previous.getId(), newResume.getId())) return;
        opportunity.setResumeLibrary(newResume);
        recordLink(previous, newResume, LinkedEntityType.OPPORTUNITY, opportunity.getId(), user);
    }

    public void unlinkFromOpportunity(Opportunity opportunity, User user) {
        Resume previous = opportunity.getResumeLibrary();
        if (previous == null) return;
        opportunity.setResumeLibrary(null);
        recordUnlink(previous, LinkedEntityType.OPPORTUNITY, opportunity.getId(), user);
    }

    public List<ResumeLinkHistoryResponse> getHistoryFor(LinkedEntityType entityType, Long entityId) {
        return resumeLinkHistoryRepository.findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    private void recordLink(Resume previous, Resume newResume, LinkedEntityType entityType, Long entityId, User user) {
        resumeLinkHistoryRepository.save(ResumeLinkHistory.builder()
                .resume(newResume)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .action(previous == null ? LinkAction.LINKED : LinkAction.RELINKED)
                .previousResumeTitle(previous == null ? null : previous.getTitle())
                .newResumeTitle(newResume.getTitle())
                .build());
    }

    private void recordUnlink(Resume previous, LinkedEntityType entityType, Long entityId, User user) {
        resumeLinkHistoryRepository.save(ResumeLinkHistory.builder()
                .resume(null)
                .entityType(entityType)
                .entityId(entityId)
                .user(user)
                .action(LinkAction.UNLINKED)
                .previousResumeTitle(previous.getTitle())
                .newResumeTitle(null)
                .build());
    }

    private ResumeLinkHistoryResponse toResponse(ResumeLinkHistory h) {
        return ResumeLinkHistoryResponse.builder()
                .id(h.getId())
                .action(h.getAction())
                .previousResumeTitle(h.getPreviousResumeTitle())
                .newResumeTitle(h.getNewResumeTitle())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
