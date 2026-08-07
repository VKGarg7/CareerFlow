package com.careerflow.strategy;

import com.careerflow.audit.AuditAction;
import com.careerflow.audit.AuditLogService;
import com.careerflow.common.SecurityUtils;
import com.careerflow.common.WorkspaceAccessUtils;
import com.careerflow.company.Company;
import com.careerflow.exception.BadRequestException;
import com.careerflow.exception.ResourceNotFoundException;
import com.careerflow.opportunity.Opportunity;
import com.careerflow.opportunity.OpportunityRepository;
import com.careerflow.opportunity.OpportunityStatus;
import com.careerflow.strategy.dto.StrategyItemReorderRequest;
import com.careerflow.strategy.dto.StrategyItemRequest;
import com.careerflow.strategy.dto.StrategyItemResponse;
import com.careerflow.strategy.dto.StrategyItemUpdateRequest;
import com.careerflow.strategy.dto.StrategyPlanResponse;
import com.careerflow.user.User;
import com.careerflow.workspace.Workspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@SuppressWarnings("null")
@ExtendWith(MockitoExtension.class)
class StrategyItemServiceTest {

    @Mock
    private StrategyItemRepository strategyItemRepository;
    @Mock
    private OpportunityRepository opportunityRepository;
    @Mock
    private WorkspaceAccessUtils workspaceAccessUtils;
    @Mock
    private SecurityUtils securityUtils;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private StrategyItemService strategyItemService;

    private User currentUser;
    private static final Long WORKSPACE_ID = 99L;
    private static final Long OPPORTUNITY_ID = 5L;

    @BeforeEach
    void setUp() {
        currentUser = new User();
        currentUser.setId(1L);
    }

    private Workspace workspace() {
        Workspace workspace = new Workspace();
        workspace.setId(WORKSPACE_ID);
        return workspace;
    }

    private Opportunity opportunity() {
        Company company = new Company();
        company.setId(10L);
        company.setName("Acme Corp");
        Opportunity opportunity = Opportunity.builder()
                .user(currentUser).workspace(workspace()).company(company)
                .roleTitle("Backend Engineer").status(OpportunityStatus.SAVED)
                .build();
        opportunity.setId(OPPORTUNITY_ID);
        return opportunity;
    }

    private StrategyItem item(Long id, int sortOrder, StrategyItemStatus status) {
        StrategyItem item = StrategyItem.builder()
                .user(currentUser).workspace(workspace()).opportunity(opportunity())
                .actionType(StrategyActionType.RESUME_TAILORING).title("Tailor resume")
                .sortOrder(sortOrder).status(status)
                .build();
        item.setId(id);
        return item;
    }

    private StrategyItemRequest request() {
        StrategyItemRequest request = new StrategyItemRequest();
        request.setOpportunityId(OPPORTUNITY_ID);
        request.setActionType(StrategyActionType.REFERRAL_REQUEST);
        request.setTitle("Ask for referral");
        return request;
    }

    @Test
    void addItem_appendsToEndOfSortOrder_whenSortOrderOmitted() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        when(workspaceAccessUtils.getOwnedWorkspace(WORKSPACE_ID, 1L)).thenReturn(workspace());
        when(strategyItemRepository.findMaxSortOrder(OPPORTUNITY_ID, 1L, WORKSPACE_ID)).thenReturn(2);
        when(strategyItemRepository.save(any(StrategyItem.class))).thenAnswer(invocation -> {
            StrategyItem item = invocation.getArgument(0);
            item.setId(30L);
            return item;
        });

        StrategyItemResponse response = strategyItemService.addItem(request(), WORKSPACE_ID);

        assertThat(response.getSortOrder()).isEqualTo(3);
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.STRATEGY_ITEM_CREATED), anyString());
    }

    @Test
    void addItem_throwsResourceNotFoundException_whenOpportunityNotOwned() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> strategyItemService.addItem(request(), WORKSPACE_ID))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getPlanForOpportunity_readyToApply_whenNoItems() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(List.of());

        StrategyPlanResponse plan = strategyItemService.getPlanForOpportunity(OPPORTUNITY_ID, WORKSPACE_ID);

        assertThat(plan.getReadiness()).isEqualTo(ReadinessState.READY_TO_APPLY);
        assertThat(plan.getTotalCount()).isZero();
    }

    @Test
    void getPlanForOpportunity_readyToApply_whenAllNonSkippedItemsCompleted() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        List<StrategyItem> items = List.of(
                item(1L, 0, StrategyItemStatus.COMPLETED),
                item(2L, 1, StrategyItemStatus.SKIPPED));
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(items);

        StrategyPlanResponse plan = strategyItemService.getPlanForOpportunity(OPPORTUNITY_ID, WORKSPACE_ID);

        assertThat(plan.getReadiness()).isEqualTo(ReadinessState.READY_TO_APPLY);
        assertThat(plan.getSkippedCount()).isEqualTo(1);
    }

    @Test
    void getPlanForOpportunity_inProgress_whenSomeButNotAllCompleted() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        List<StrategyItem> items = List.of(
                item(1L, 0, StrategyItemStatus.COMPLETED),
                item(2L, 1, StrategyItemStatus.PLANNED));
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(items);

        StrategyPlanResponse plan = strategyItemService.getPlanForOpportunity(OPPORTUNITY_ID, WORKSPACE_ID);

        assertThat(plan.getReadiness()).isEqualTo(ReadinessState.IN_PROGRESS);
    }

    @Test
    void getPlanForOpportunity_notStarted_whenNoItemsCompletedOrInProgress() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        List<StrategyItem> items = List.of(item(1L, 0, StrategyItemStatus.PLANNED));
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(items);

        StrategyPlanResponse plan = strategyItemService.getPlanForOpportunity(OPPORTUNITY_ID, WORKSPACE_ID);

        assertThat(plan.getReadiness()).isEqualTo(ReadinessState.NOT_STARTED);
    }

    @Test
    void updateItem_marksComplete() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        StrategyItem existing = item(7L, 0, StrategyItemStatus.PLANNED);
        when(strategyItemRepository.findByIdAndUserIdAndWorkspaceId(7L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(strategyItemRepository.save(any(StrategyItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        StrategyItemUpdateRequest update = new StrategyItemUpdateRequest();
        update.setStatus(StrategyItemStatus.COMPLETED);

        StrategyItemResponse response = strategyItemService.updateItem(7L, update, WORKSPACE_ID);

        assertThat(response.getStatus()).isEqualTo(StrategyItemStatus.COMPLETED);
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.STRATEGY_ITEM_UPDATED), anyString());
    }

    @Test
    void reorderItems_appliesNewSortOrder() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        StrategyItem first = item(1L, 0, StrategyItemStatus.PLANNED);
        StrategyItem second = item(2L, 1, StrategyItemStatus.PLANNED);
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(List.of(first, second))
                .thenReturn(List.of(second, first));
        when(strategyItemRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        StrategyItemReorderRequest reorder = new StrategyItemReorderRequest();
        reorder.setOrderedItemIds(List.of(2L, 1L));

        StrategyPlanResponse plan = strategyItemService.reorderItems(OPPORTUNITY_ID, reorder, WORKSPACE_ID);

        assertThat(second.getSortOrder()).isEqualTo(0);
        assertThat(first.getSortOrder()).isEqualTo(1);
        assertThat(plan.getItems()).extracting(StrategyItemResponse::getId).containsExactly(2L, 1L);
        verify(auditLogService).log(eq(currentUser), eq(AuditAction.STRATEGY_ITEM_REORDERED), anyString());
    }

    @Test
    void reorderItems_throwsBadRequestException_whenIdSetDoesNotMatch() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        when(opportunityRepository.findByIdAndUserIdAndWorkspaceId(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(opportunity()));
        StrategyItem first = item(1L, 0, StrategyItemStatus.PLANNED);
        when(strategyItemRepository.findAllByOpportunityIdAndUserIdAndWorkspaceIdOrderBySortOrderAsc(OPPORTUNITY_ID, 1L, WORKSPACE_ID))
                .thenReturn(List.of(first));

        StrategyItemReorderRequest reorder = new StrategyItemReorderRequest();
        reorder.setOrderedItemIds(List.of(1L, 999L));

        assertThatThrownBy(() -> strategyItemService.reorderItems(OPPORTUNITY_ID, reorder, WORKSPACE_ID))
                .isInstanceOf(BadRequestException.class);

        verify(strategyItemRepository, never()).saveAll(any());
    }

    @Test
    void deleteItem_softDeletesItem() {
        when(securityUtils.getCurrentUser()).thenReturn(currentUser);
        StrategyItem existing = item(9L, 0, StrategyItemStatus.PLANNED);
        when(strategyItemRepository.findByIdAndUserIdAndWorkspaceId(9L, 1L, WORKSPACE_ID))
                .thenReturn(Optional.of(existing));
        when(strategyItemRepository.save(any(StrategyItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        strategyItemService.deleteItem(9L, WORKSPACE_ID);

        verify(strategyItemRepository).save(argThat(i -> i.getDeletedAt() != null));
    }
}
