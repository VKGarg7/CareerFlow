package com.careerflow.outreach;

import com.careerflow.application.ApplicationRepository;
import com.careerflow.application.JobApplication;
import com.careerflow.common.PageResponse;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.contact.Contact;
import com.careerflow.contact.ContactRepository;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.outreach.dto.OutreachContactSummary;
import com.careerflow.outreach.dto.OutreachEventRequest;
import com.careerflow.outreach.dto.OutreachEventResponse;
import com.careerflow.outreach.dto.OutreachEventUpdateRequest;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OutreachEventService {

    private final OutreachEventRepository outreachEventRepository;
    private final ContactRepository contactRepository;
    private final OpportunityRepository opportunityRepository;
    private final ApplicationRepository applicationRepository;
    private final WorkspaceAccessUtils workspaceAccessUtils;
    private final SecurityUtils securityUtils;

    public OutreachEventResponse create(OutreachEventRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Workspace workspace = workspaceAccessUtils.getOwnedWorkspace(workspaceId, user.getId());
        Contact contact = findOwnedContact(request.getContactId(), user.getId(), workspaceId);
        Opportunity opportunity = resolveOpportunity(request.getOpportunityId(), user.getId(), workspaceId);
        JobApplication application = resolveApplication(request.getApplicationId(), user.getId(), workspaceId);

        OutreachEvent event = OutreachEvent.builder()
                .user(user)
                .workspace(workspace)
                .contact(contact)
                .opportunity(opportunity)
                .application(application)
                .eventDateTime(request.getEventDateTime())
                .channel(request.getChannel())
                .purpose(request.getPurpose())
                .messageSummary(request.getMessageSummary())
                .responseStatus(request.getResponseStatus() != null ? request.getResponseStatus() : OutreachResponseStatus.NO_RESPONSE)
                .nextAction(request.getNextAction())
                .nextActionDate(request.getNextActionDate())
                .build();

        return toResponse(outreachEventRepository.save(event));
    }

    public PageResponse<OutreachEventResponse> list(
            Long contactId, Long opportunityId, Long applicationId,
            int page, int size, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Sort sort = Sort.by(Sort.Direction.DESC, "eventDateTime");

        if (contactId != null) {
            return listAsPage(listByContact(contactId, workspaceId), page, size);
        }
        if (opportunityId != null) {
            return listAsPage(listByOpportunity(opportunityId, workspaceId), page, size);
        }
        if (applicationId != null) {
            return listAsPage(listByApplication(applicationId, workspaceId), page, size);
        }

        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 10 : size, sort);
        Page<OutreachEvent> results = outreachEventRepository.findAllByUserIdAndWorkspaceId(user.getId(), workspaceId, pageable);
        return PageResponse.of(results.map(this::toResponse));
    }

    public List<OutreachEventResponse> listByContact(Long contactId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        findOwnedContact(contactId, user.getId(), workspaceId);
        Sort sort = Sort.by(Sort.Direction.DESC, "eventDateTime");
        return outreachEventRepository.findAllByContactIdAndUserIdAndWorkspaceId(contactId, user.getId(), workspaceId, sort)
                .stream().map(this::toResponse).toList();
    }

    public List<OutreachEventResponse> listByOpportunity(Long opportunityId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Sort sort = Sort.by(Sort.Direction.DESC, "eventDateTime");
        return outreachEventRepository.findAllByOpportunityIdAndUserIdAndWorkspaceId(opportunityId, user.getId(), workspaceId, sort)
                .stream().map(this::toResponse).toList();
    }

    public List<OutreachEventResponse> listByApplication(Long applicationId, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        Sort sort = Sort.by(Sort.Direction.DESC, "eventDateTime");
        return outreachEventRepository.findAllByApplicationIdAndUserIdAndWorkspaceId(applicationId, user.getId(), workspaceId, sort)
                .stream().map(this::toResponse).toList();
    }

    public OutreachEventResponse update(Long id, OutreachEventUpdateRequest request, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        OutreachEvent event = findOwned(id, user.getId(), workspaceId);

        if (request.getOpportunityId() != null)
            event.setOpportunity(resolveOpportunity(request.getOpportunityId(), user.getId(), workspaceId));
        if (request.getApplicationId() != null)
            event.setApplication(resolveApplication(request.getApplicationId(), user.getId(), workspaceId));
        if (request.getEventDateTime() != null) event.setEventDateTime(request.getEventDateTime());
        if (request.getChannel() != null) event.setChannel(request.getChannel());
        if (request.getPurpose() != null) event.setPurpose(request.getPurpose());
        if (request.getMessageSummary() != null)
            event.setMessageSummary(request.getMessageSummary().isBlank() ? null : request.getMessageSummary());
        if (request.getResponseStatus() != null) event.setResponseStatus(request.getResponseStatus());
        if (request.getNextAction() != null)
            event.setNextAction(request.getNextAction().isBlank() ? null : request.getNextAction());
        if (request.getNextActionDate() != null) event.setNextActionDate(request.getNextActionDate());

        return toResponse(outreachEventRepository.save(event));
    }

    public void delete(Long id, Long workspaceId) {
        User user = securityUtils.getCurrentUser();
        OutreachEvent event = findOwned(id, user.getId(), workspaceId);
        event.softDelete();
        outreachEventRepository.save(event);
    }

    private PageResponse<OutreachEventResponse> listAsPage(List<OutreachEventResponse> items, int page, int size) {
        return PageResponse.<OutreachEventResponse>builder()
                .content(items)
                .page(0)
                .size(items.size())
                .totalElements(items.size())
                .totalPages(items.isEmpty() ? 0 : 1)
                .last(true)
                .build();
    }

    private OutreachEvent findOwned(Long id, Long userId, Long workspaceId) {
        return outreachEventRepository.findByIdAndUserIdAndWorkspaceId(id, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Outreach event not found"));
    }

    private Contact findOwnedContact(Long contactId, Long userId, Long workspaceId) {
        return contactRepository.findByIdAndUserIdAndWorkspaceId(contactId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
    }

    private Opportunity resolveOpportunity(Long opportunityId, Long userId, Long workspaceId) {
        if (opportunityId == null) return null;
        return opportunityRepository.findByIdAndUserIdAndWorkspaceId(opportunityId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Opportunity not found"));
    }

    private JobApplication resolveApplication(Long applicationId, Long userId, Long workspaceId) {
        if (applicationId == null) return null;
        return applicationRepository.findByIdAndUserIdAndWorkspaceId(applicationId, userId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));
    }

    private OutreachEventResponse toResponse(OutreachEvent e) {
        return OutreachEventResponse.builder()
                .id(e.getId())
                .contact(OutreachContactSummary.builder()
                        .id(e.getContact().getId())
                        .name(e.getContact().getName())
                        .build())
                .opportunityId(e.getOpportunity() != null ? e.getOpportunity().getId() : null)
                .applicationId(e.getApplication() != null ? e.getApplication().getId() : null)
                .eventDateTime(e.getEventDateTime())
                .channel(e.getChannel())
                .purpose(e.getPurpose())
                .messageSummary(e.getMessageSummary())
                .responseStatus(e.getResponseStatus())
                .nextAction(e.getNextAction())
                .nextActionDate(e.getNextActionDate())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }
}
