package com.careerflow.admin;

import com.careerflow.admin.dto.SystemHealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.sql.Connection;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemHealthService {

    private static final long MB = 1024 * 1024;

    private final DataSource dataSource;

    public SystemHealthResponse getHealth() {
        boolean databaseUp;
        long start = System.currentTimeMillis();
        try (Connection connection = dataSource.getConnection()) {
            databaseUp = connection.isValid(2);
        } catch (Exception e) {
            log.warn("Database health check failed: {}", e.getMessage());
            databaseUp = false;
        }
        long databaseResponseTimeMs = System.currentTimeMillis() - start;

        Runtime runtime = Runtime.getRuntime();
        long usedMemoryMb = (runtime.totalMemory() - runtime.freeMemory()) / MB;
        long maxMemoryMb = runtime.maxMemory() / MB;

        return SystemHealthResponse.builder()
                .databaseUp(databaseUp)
                .databaseResponseTimeMs(databaseResponseTimeMs)
                .uptimeMillis(ManagementFactory.getRuntimeMXBean().getUptime())
                .usedMemoryMb(usedMemoryMb)
                .maxMemoryMb(maxMemoryMb)
                .availableProcessors(runtime.availableProcessors())
                .build();
    }
}
