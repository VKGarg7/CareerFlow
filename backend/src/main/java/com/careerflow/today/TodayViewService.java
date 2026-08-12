package com.careerflow.today;

import com.careerflow.actionitem.ActionItemService;
import com.careerflow.actionitem.dto.ActionItemResponse;
import com.careerflow.application.ApplicationService;
import com.careerflow.deadline.DeadlineService;
import com.careerflow.interview.Interview;
import com.careerflow.interview.InterviewRepository;
import com.careerflow.referral.ReferralRequest;
import com.careerflow.referral.ReferralRequestRepository;
import com.careerflow.referral.ReferralStatus;
import com.careerflow.common.SecurityUtils;
import com.careerflow.today.dto.TodayInterviewItem;
import com.careerflow.today.dto.TodayReferralItem;
import com.careerflow.today.dto.TodayViewResponse;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TodayViewService {

    private static final List<ReferralStatus> PENDING_REFERRAL_STATUSES =
            List.of(ReferralStatus.OUTREACH_SENT, ReferralStatus.AWAITING_RESPONSE, ReferralStatus.REFERRAL_AGREED);

    private final ActionItemService actionItemService;
    private final ApplicationService applicationService;
    private final DeadlineService deadlineService;
    private final InterviewRepository interviewRepository;
    private final ReferralRequestRepository referralRequestRepository;
    private final SecurityUtils securityUtils;

    public TodayViewResponse getTodayView(Long workspaceId) {
        User user = securityUtils.getCurrentUser();

        Map<String, List<ActionItemResponse>> actionBuckets = actionItemService.getOverdueAndDueTodayActions(workspaceId);
        List<ActionItemResponse> overdueActions = actionBuckets.get("overdue");
        List<ActionItemResponse> actionsDueToday = actionBuckets.get("dueToday");

        List<TodayInterviewItem> interviewsThisWeek = getInterviewsThisWeek(user.getId(), workspaceId);
        List<TodayReferralItem> pendingReferrals = getPendingReferrals(user.getId(), workspaceId);

        int totalCount = overdueActions.size() + actionsDueToday.size() + interviewsThisWeek.size();

        return TodayViewResponse.builder()
                .overdueActions(overdueActions)
                .actionsDueToday(actionsDueToday)
                .interviewsThisWeek(interviewsThisWeek)
                .staleApplications(applicationService.getStaleApplications(workspaceId))
                .pendingReferrals(pendingReferrals)
                .approachingDeadlines(deadlineService.getUpcomingDeadlines(7, workspaceId))
                .totalCount(totalCount)
                .build();
    }

    private List<TodayInterviewItem> getInterviewsThisWeek(Long userId, Long workspaceId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekEnd = now.toLocalDate().plusDays(7).atTime(23, 59, 59);
        List<Interview> interviews = interviewRepository
                .findAllByUserIdAndWorkspaceIdAndScheduledAtBetweenOrderByScheduledAtAsc(userId, workspaceId, now, weekEnd);
        return interviews.stream()
                .map(i -> TodayInterviewItem.builder()
                        .id(i.getId())
                        .applicationId(i.getApplication().getId())
                        .companyName(i.getApplication().getCompany().getName())
                        .role(i.getApplication().getRole())
                        .scheduledAt(i.getScheduledAt())
                        .round(i.getRound())
                        .outcome(i.getOutcome())
                        .build())
                .toList();
    }

    private List<TodayReferralItem> getPendingReferrals(Long userId, Long workspaceId) {
        LocalDate today = LocalDate.now();
        List<ReferralRequest> referrals = referralRequestRepository
                .findAllByUserIdAndWorkspaceIdAndStatusIn(userId, workspaceId, PENDING_REFERRAL_STATUSES);
        return referrals.stream()
                .map(r -> TodayReferralItem.builder()
                        .id(r.getId())
                        .contactName(r.getContact().getName())
                        .targetRole(r.getTargetRole())
                        .status(r.getStatus())
                        .followUpDate(r.getFollowUpDate())
                        .overdue(r.getFollowUpDate() != null && r.getFollowUpDate().isBefore(today))
                        .build())
                .toList();
    }
}
