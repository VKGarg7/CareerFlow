package com.careerflow.followup;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.common.PageResponse;
import com.careerflow.common.PaginationHelper;
import com.careerflow.common.SecurityUtils;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.followup.dto.FollowUpCountsResponse;
import com.careerflow.followup.dto.FollowUpRequest;
import com.careerflow.followup.dto.FollowUpResponse;
import com.careerflow.followup.dto.FollowUpUpdateRequest;
import com.careerflow.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@SuppressWarnings("null")
@Service
@RequiredArgsConstructor
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final ApplicationRepository applicationRepository;
    private final SecurityUtils securityUtils;

    public FollowUpResponse createFollowUp(Long applicationId, FollowUpRequest request) {
        User user = securityUtils.getCurrentUser();
        JobApplication application = findOwnedApplication(applicationId, user.getId());

        FollowUp followUp = FollowUp.builder()
                .application(application)
                .user(user)
                .followUpDate(request.getFollowUpDate())
                .note(request.getNote())
                .build();

        return toResponse(followUpRepository.save(followUp));
    }

    public List<FollowUpResponse> getFollowUpsForApplication(Long applicationId) {
        User user = securityUtils.getCurrentUser();
        findOwnedApplication(applicationId, user.getId());
        return followUpRepository
                .findAllByUserIdAndApplicationIdOrderByFollowUpDateAsc(user.getId(), applicationId)
                .stream().map(this::toResponse).toList();
    }

    public PageResponse<FollowUpResponse> getAllFollowUps(FollowUpStatus status, FollowUpBucket bucket, int page, int size) {
        User user = securityUtils.getCurrentUser();
        Long userId = user.getId();
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? PaginationHelper.DEFAULT_SIZE : Math.min(size, PaginationHelper.MAX_SIZE);
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "followUpDate"));

        Page<FollowUp> results;
        if (bucket != null && status == FollowUpStatus.PENDING) {
            LocalDate today = LocalDate.now();
            results = switch (bucket) {
                case OVERDUE -> followUpRepository.findAllByUserIdAndStatusAndFollowUpDateBefore(userId, status, today, pageable);
                case TODAY -> followUpRepository.findAllByUserIdAndStatusAndFollowUpDate(userId, status, today, pageable);
                case UPCOMING -> followUpRepository.findAllByUserIdAndStatusAndFollowUpDateAfter(userId, status, today, pageable);
            };
        } else if (status != null) {
            results = followUpRepository.findAllByUserIdAndStatusOrderByFollowUpDateAsc(userId, status, pageable);
        } else {
            results = followUpRepository.findAllByUserIdOrderByFollowUpDateAsc(userId, pageable);
        }
        return PageResponse.of(results.map(this::toResponse));
    }

    public FollowUpCountsResponse getFollowUpCounts() {
        User user = securityUtils.getCurrentUser();
        Long userId = user.getId();
        LocalDate today = LocalDate.now();
        return FollowUpCountsResponse.builder()
                .overdue(followUpRepository.countByUserIdAndStatusAndFollowUpDateBefore(userId, FollowUpStatus.PENDING, today))
                .dueToday(followUpRepository.countByUserIdAndStatusAndFollowUpDate(userId, FollowUpStatus.PENDING, today))
                .upcoming(followUpRepository.countByUserIdAndStatusAndFollowUpDateAfter(userId, FollowUpStatus.PENDING, today))
                .completed(followUpRepository.countByUserIdAndStatus(userId, FollowUpStatus.DONE))
                .build();
    }

    public FollowUpResponse updateFollowUp(Long id, FollowUpUpdateRequest request) {
        User user = securityUtils.getCurrentUser();
        FollowUp followUp = findOwned(id, user.getId());

        if (request.getFollowUpDate() != null) followUp.setFollowUpDate(request.getFollowUpDate());
        if (request.getNote() != null) followUp.setNote(request.getNote());
        if (request.getStatus() != null) followUp.setStatus(request.getStatus());

        return toResponse(followUpRepository.save(followUp));
    }

    public void deleteFollowUp(Long id) {
        User user = securityUtils.getCurrentUser();
        FollowUp followUp = findOwned(id, user.getId());
        followUpRepository.delete(followUp);
    }

    private FollowUp findOwned(Long id, Long userId) {
        return followUpRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found"));
    }

    private JobApplication findOwnedApplication(Long applicationId, Long userId) {
        return applicationRepository.findByIdAndUserId(applicationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private FollowUpResponse toResponse(FollowUp f) {
        return FollowUpResponse.builder()
                .id(f.getId())
                .applicationId(f.getApplication().getId())
                .companyId(f.getApplication().getCompany().getId())
                .companyName(f.getApplication().getCompany().getName())
                .role(f.getApplication().getRole())
                .followUpDate(f.getFollowUpDate())
                .note(f.getNote())
                .status(f.getStatus())
                .overdue(f.getStatus() == FollowUpStatus.PENDING && f.getFollowUpDate().isBefore(LocalDate.now()))
                .createdAt(f.getCreatedAt())
                .updatedAt(f.getUpdatedAt())
                .build();
    }
}
