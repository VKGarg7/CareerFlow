package com.careerflow.rolefit;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Computes an explainable 0-100 fit score from four weighted components
 * (skills 50%, experience 20%, location 15%, compensation 15%). Each
 * component's contribution is included in the breakdown text so the user
 * can see exactly why the score landed where it did, per CF-PRO-006's
 * "fit scoring logic should remain explainable" requirement.
 */
public final class FitScoreCalculator {

    private static final int SKILLS_WEIGHT = 50;
    private static final int EXPERIENCE_WEIGHT = 20;
    private static final int LOCATION_WEIGHT = 15;
    private static final int COMPENSATION_WEIGHT = 15;

    private FitScoreCalculator() {}

    public record Result(int score, FitTier tier, String missingSkills, String breakdown) {}

    public static Result calculate(
            String requiredSkillsCsv, String preferredSkillsCsv, String userSkillsCsv,
            Integer requiredExperienceYears, Double userExperienceYears,
            FitRating locationFit, FitRating compensationFit) {

        Set<String> required = splitSkills(requiredSkillsCsv);
        Set<String> preferred = splitSkills(preferredSkillsCsv);
        Set<String> owned = splitSkills(userSkillsCsv);

        List<String> breakdownLines = new ArrayList<>();
        double totalScore = 0;
        int totalWeight = 0;

        // Skills (required weighted heavier than preferred within the 50% bucket)
        if (!required.isEmpty() || !preferred.isEmpty()) {
            double requiredMatchPct = required.isEmpty() ? 100
                    : (double) countMatches(required, owned) / required.size() * 100;
            double preferredMatchPct = preferred.isEmpty() ? 100
                    : (double) countMatches(preferred, owned) / preferred.size() * 100;
            double skillsPct = required.isEmpty() ? preferredMatchPct
                    : preferred.isEmpty() ? requiredMatchPct
                    : requiredMatchPct * 0.75 + preferredMatchPct * 0.25;

            totalScore += skillsPct * SKILLS_WEIGHT / 100.0;
            totalWeight += SKILLS_WEIGHT;
            breakdownLines.add(String.format(
                    "Skills: %.0f%% match (required %.0f%%, preferred %.0f%%) — weighted %.1f/%d",
                    skillsPct, requiredMatchPct, preferredMatchPct, skillsPct * SKILLS_WEIGHT / 100.0, SKILLS_WEIGHT));
        }

        // Experience
        if (requiredExperienceYears != null && userExperienceYears != null) {
            double experiencePct = requiredExperienceYears <= 0 ? 100
                    : Math.min(100, userExperienceYears / requiredExperienceYears * 100);
            totalScore += experiencePct * EXPERIENCE_WEIGHT / 100.0;
            totalWeight += EXPERIENCE_WEIGHT;
            breakdownLines.add(String.format(
                    "Experience: %.1f/%d years required (%.0f%%) — weighted %.1f/%d",
                    userExperienceYears, requiredExperienceYears, experiencePct,
                    experiencePct * EXPERIENCE_WEIGHT / 100.0, EXPERIENCE_WEIGHT));
        }

        // Location
        if (locationFit != null) {
            double locationPct = ratingToPercent(locationFit);
            totalScore += locationPct * LOCATION_WEIGHT / 100.0;
            totalWeight += LOCATION_WEIGHT;
            breakdownLines.add(String.format(
                    "Location fit: %s (%.0f%%) — weighted %.1f/%d",
                    locationFit, locationPct, locationPct * LOCATION_WEIGHT / 100.0, LOCATION_WEIGHT));
        }

        // Compensation
        if (compensationFit != null) {
            double compensationPct = ratingToPercent(compensationFit);
            totalScore += compensationPct * COMPENSATION_WEIGHT / 100.0;
            totalWeight += COMPENSATION_WEIGHT;
            breakdownLines.add(String.format(
                    "Compensation fit: %s (%.0f%%) — weighted %.1f/%d",
                    compensationFit, compensationPct, compensationPct * COMPENSATION_WEIGHT / 100.0, COMPENSATION_WEIGHT));
        }

        int score = totalWeight == 0 ? 0 : (int) Math.round(totalScore / totalWeight * 100);
        FitTier tier = tierFor(score);

        Set<String> normalizedOwned = normalizeSet(owned);
        Set<String> missing = required.stream()
                .filter(skill -> !normalizedOwned.contains(skill.toLowerCase().trim()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
        String missingSkills = String.join(", ", missing);

        String breakdown = totalWeight == 0
                ? "No inputs provided yet — add skills, experience, location, or compensation fit to compute a score."
                : String.join("\n", breakdownLines) + String.format("\nOverall: %d/100 (%s)", score, tier);

        return new Result(score, tier, missingSkills, breakdown);
    }

    public static FitTier tierFor(int score) {
        if (score >= 85) return FitTier.STRONG_FIT;
        if (score >= 65) return FitTier.MODERATE_FIT;
        if (score >= 40) return FitTier.WEAK_FIT;
        return FitTier.NOT_A_FIT;
    }

    private static double ratingToPercent(FitRating rating) {
        return switch (rating) {
            case GOOD -> 100;
            case OK -> 60;
            case POOR -> 20;
        };
    }

    private static int countMatches(Set<String> needed, Set<String> owned) {
        Set<String> normalizedOwned = normalizeSet(owned);
        Set<String> normalizedNeeded = normalizeSet(needed);
        return (int) normalizedNeeded.stream().filter(normalizedOwned::contains).count();
    }

    private static Set<String> normalizeSet(Set<String> skills) {
        return skills.stream().map(s -> s.toLowerCase().trim()).collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private static Set<String> splitSkills(String csv) {
        if (csv == null || csv.isBlank()) return Set.of();
        return java.util.Arrays.stream(csv.split(","))
                .map(s -> s.trim())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
