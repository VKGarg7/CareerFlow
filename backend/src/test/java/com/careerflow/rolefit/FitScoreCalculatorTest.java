package com.careerflow.rolefit;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FitScoreCalculatorTest {

    @Test
    void calculate_returnsPerfectScore_whenAllComponentsFullyMatch() {
        FitScoreCalculator.Result result = FitScoreCalculator.calculate(
                "Java, Spring Boot, PostgreSQL", "Docker",
                "Java, Spring Boot, PostgreSQL, Docker",
                3, 5.0, FitRating.GOOD, FitRating.GOOD);

        assertThat(result.score()).isEqualTo(100);
        assertThat(result.tier()).isEqualTo(FitTier.STRONG_FIT);
        assertThat(result.missingSkills()).isEmpty();
    }

    @Test
    void calculate_identifiesMissingRequiredSkills_caseInsensitively() {
        FitScoreCalculator.Result result = FitScoreCalculator.calculate(
                "Java, Spring Boot, AWS", null,
                "java, spring boot",
                null, null, null, null);

        assertThat(result.missingSkills()).isEqualTo("AWS");
    }

    @Test
    void calculate_returnsZero_whenNoInputsProvided() {
        FitScoreCalculator.Result result = FitScoreCalculator.calculate(
                null, null, null, null, null, null, null);

        assertThat(result.score()).isZero();
        assertThat(result.tier()).isEqualTo(FitTier.NOT_A_FIT);
        assertThat(result.breakdown()).contains("No inputs provided");
    }

    @Test
    void calculate_weightsRequiredSkillsMoreThanPreferred() {
        FitScoreCalculator.Result allRequired = FitScoreCalculator.calculate(
                "Java, Python", null, "Java, Python", null, null, null, null);
        FitScoreCalculator.Result halfPreferredMissing = FitScoreCalculator.calculate(
                "Java, Python", "React, Vue", "Java, Python", null, null, null, null);

        assertThat(allRequired.score()).isEqualTo(100);
        assertThat(halfPreferredMissing.score()).isLessThan(100);
    }

    @Test
    void calculate_scoresExperienceProportionally_cappedAt100Percent() {
        FitScoreCalculator.Result underQualified = FitScoreCalculator.calculate(
                null, null, null, 5, 2.0, null, null);
        FitScoreCalculator.Result overQualified = FitScoreCalculator.calculate(
                null, null, null, 5, 10.0, null, null);

        assertThat(underQualified.score()).isEqualTo(40);
        assertThat(overQualified.score()).isEqualTo(100);
    }

    @Test
    void calculate_mapsFitRatingsToExpectedPercentages() {
        FitScoreCalculator.Result good = FitScoreCalculator.calculate(null, null, null, null, null, FitRating.GOOD, null);
        FitScoreCalculator.Result ok = FitScoreCalculator.calculate(null, null, null, null, null, FitRating.OK, null);
        FitScoreCalculator.Result poor = FitScoreCalculator.calculate(null, null, null, null, null, FitRating.POOR, null);

        assertThat(good.score()).isEqualTo(100);
        assertThat(ok.score()).isEqualTo(60);
        assertThat(poor.score()).isEqualTo(20);
    }

    @Test
    void tierFor_bucketsScoresIntoExpectedTiers() {
        assertThat(FitScoreCalculator.tierFor(90)).isEqualTo(FitTier.STRONG_FIT);
        assertThat(FitScoreCalculator.tierFor(70)).isEqualTo(FitTier.MODERATE_FIT);
        assertThat(FitScoreCalculator.tierFor(50)).isEqualTo(FitTier.WEAK_FIT);
        assertThat(FitScoreCalculator.tierFor(10)).isEqualTo(FitTier.NOT_A_FIT);
    }
}
