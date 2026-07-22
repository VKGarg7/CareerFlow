package com.careerflow.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Re-seeds the public demo account's data on a schedule, so a demo login can be
 * shared on the deployed app without its data degrading from visitor edits/deletes.
 * No-ops unless demo.user.email is configured — this job never touches real user data,
 * since the underlying script only ever deletes/inserts rows scoped to that one email.
 */
@Slf4j
@SuppressWarnings("null")
@Component
public class DemoDataResetJob {

    private final JdbcTemplate jdbcTemplate;
    private final String demoUserEmail;

    public DemoDataResetJob(JdbcTemplate jdbcTemplate,
                             @Value("${demo.user.email:}") String demoUserEmail) {
        this.jdbcTemplate = jdbcTemplate;
        this.demoUserEmail = demoUserEmail;
    }

    @Scheduled(cron = "${demo.reset.cron:0 0 3 * * *}")
    public void resetDemoData() {
        if (demoUserEmail == null || demoUserEmail.isBlank()) {
            return;
        }
        try {
            String script = StreamUtils.copyToString(
                    new ClassPathResource("db/demo_seed_data.sql").getInputStream(),
                    StandardCharsets.UTF_8
            ).replace("${demo.user.email}", demoUserEmail);

            log.info("Resetting demo data for {}", demoUserEmail);
            jdbcTemplate.execute(script);
            log.info("Demo data reset complete for {}", demoUserEmail);
        } catch (IOException e) {
            log.error("Failed to load demo seed script", e);
        } catch (Exception e) {
            log.error("Failed to reset demo data for {}", demoUserEmail, e);
        }
    }
}
