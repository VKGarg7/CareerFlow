package com.careerflow.referral;

import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReferralStatusHistoryRepository extends JpaRepository<ReferralStatusHistory, Long> {

    List<ReferralStatusHistory> findAllByReferralIdAndUserId(Long referralId, Long userId, Sort sort);

    Optional<ReferralStatusHistory> findByIdAndReferralIdAndUserId(Long id, Long referralId, Long userId);
}
