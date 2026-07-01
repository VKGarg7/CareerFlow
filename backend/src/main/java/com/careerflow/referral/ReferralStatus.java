package com.careerflow.referral;

public enum ReferralStatus {
    DRAFT,          // saved but not yet sent
    REQUESTED,      // request sent to referrer
    ACKNOWLEDGED,   // referrer has seen / replied
    REFERRED,       // referrer submitted the referral
    INTERVIEWING,   // interview in progress after referral
    OFFER_RECEIVED, // offer obtained via this referral
    REJECTED,       // rejected after referral
    WITHDRAWN,      // user withdrew the request
    DECLINED        // referrer declined to refer
}
