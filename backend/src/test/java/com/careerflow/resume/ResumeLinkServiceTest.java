package com.careerflow.resume;

import com.careerflow.application.JobApplication;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.resume.dto.ResumeLinkHistoryResponse;
import com.careerflow.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class ResumeLinkServiceTest {

    @Mock
    private ResumeLinkHistoryRepository resumeLinkHistoryRepository;

    @InjectMocks
    private ResumeLinkService resumeLinkService;

    private User currentUser;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    private Resume resume(long id, String title) {
        Resume r = Resume.builder().title(title).build();
        r.setId(id);
        return r;
    }

    @Test
    void linkToApplication_recordsLinked_whenPreviouslyUnlinked() {
        JobApplication app = JobApplication.builder().build();
        app.setId(50L);
        Resume newResume = resume(10L, "SDE Resume");

        resumeLinkService.linkToApplication(app, newResume, currentUser);

        assertThat(app.getResumeLibrary()).isEqualTo(newResume);
        verify(resumeLinkHistoryRepository).save(argThat(h ->
                h.getAction() == LinkAction.LINKED
                        && h.getEntityType() == LinkedEntityType.APPLICATION
                        && h.getEntityId().equals(50L)
                        && h.getPreviousResumeTitle() == null
                        && h.getNewResumeTitle().equals("SDE Resume")));
    }

    @Test
    void linkToApplication_recordsRelinked_whenReplacingExistingResume() {
        Resume oldResume = resume(10L, "Old Resume");
        JobApplication app = JobApplication.builder().resumeLibrary(oldResume).build();
        app.setId(50L);
        Resume newResume = resume(11L, "New Resume");

        resumeLinkService.linkToApplication(app, newResume, currentUser);

        assertThat(app.getResumeLibrary()).isEqualTo(newResume);
        verify(resumeLinkHistoryRepository).save(argThat(h ->
                h.getAction() == LinkAction.RELINKED
                        && h.getPreviousResumeTitle().equals("Old Resume")
                        && h.getNewResumeTitle().equals("New Resume")));
    }

    @Test
    void linkToApplication_noOp_whenResumeUnchanged() {
        Resume sameResume = resume(10L, "SDE Resume");
        JobApplication app = JobApplication.builder().resumeLibrary(sameResume).build();
        app.setId(50L);

        resumeLinkService.linkToApplication(app, sameResume, currentUser);

        verify(resumeLinkHistoryRepository, never()).save(any());
    }

    @Test
    void unlinkFromApplication_recordsUnlinked() {
        Resume oldResume = resume(10L, "SDE Resume");
        JobApplication app = JobApplication.builder().resumeLibrary(oldResume).build();
        app.setId(50L);

        resumeLinkService.unlinkFromApplication(app, currentUser);

        assertThat(app.getResumeLibrary()).isNull();
        verify(resumeLinkHistoryRepository).save(argThat(h ->
                h.getAction() == LinkAction.UNLINKED
                        && h.getPreviousResumeTitle().equals("SDE Resume")
                        && h.getNewResumeTitle() == null));
    }

    @Test
    void unlinkFromApplication_noOp_whenNoResumeLinked() {
        JobApplication app = JobApplication.builder().build();
        app.setId(50L);

        resumeLinkService.unlinkFromApplication(app, currentUser);

        verify(resumeLinkHistoryRepository, never()).save(any());
    }

    @Test
    void linkToOpportunity_recordsLinked() {
        Opportunity opp = Opportunity.builder().build();
        opp.setId(70L);
        Resume newResume = resume(10L, "SDE Resume");

        resumeLinkService.linkToOpportunity(opp, newResume, currentUser);

        assertThat(opp.getResumeLibrary()).isEqualTo(newResume);
        verify(resumeLinkHistoryRepository).save(argThat(h ->
                h.getEntityType() == LinkedEntityType.OPPORTUNITY && h.getEntityId().equals(70L)));
    }

    @Test
    void unlinkFromOpportunity_recordsUnlinked() {
        Resume oldResume = resume(10L, "SDE Resume");
        Opportunity opp = Opportunity.builder().resumeLibrary(oldResume).build();
        opp.setId(70L);

        resumeLinkService.unlinkFromOpportunity(opp, currentUser);

        assertThat(opp.getResumeLibrary()).isNull();
        verify(resumeLinkHistoryRepository).save(argThat(h -> h.getAction() == LinkAction.UNLINKED));
    }

    @Test
    void getHistoryFor_mapsRepositoryRowsToResponses() {
        ResumeLinkHistory history = ResumeLinkHistory.builder()
                .id(1L).action(LinkAction.LINKED)
                .previousResumeTitle(null).newResumeTitle("SDE Resume")
                .build();
        when(resumeLinkHistoryRepository.findAllByEntityTypeAndEntityIdOrderByCreatedAtDesc(LinkedEntityType.APPLICATION, 50L))
                .thenReturn(List.of(history));

        List<ResumeLinkHistoryResponse> result = resumeLinkService.getHistoryFor(LinkedEntityType.APPLICATION, 50L);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNewResumeTitle()).isEqualTo("SDE Resume");
    }
}
