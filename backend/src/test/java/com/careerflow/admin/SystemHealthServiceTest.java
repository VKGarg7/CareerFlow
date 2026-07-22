package com.careerflow.admin;

import com.careerflow.admin.dto.SystemHealthResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SystemHealthServiceTest {

    @Mock
    private DataSource dataSource;

    @InjectMocks
    private SystemHealthService systemHealthService;

    @Test
    void getHealth_reportsDatabaseUp_whenConnectionIsValid() throws SQLException {
        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(true);

        SystemHealthResponse response = systemHealthService.getHealth();

        assertThat(response.isDatabaseUp()).isTrue();
        assertThat(response.getAvailableProcessors()).isGreaterThan(0);
        assertThat(response.getMaxMemoryMb()).isGreaterThan(0);
    }

    @Test
    void getHealth_reportsDatabaseDown_whenConnectionIsInvalid() throws SQLException {
        Connection connection = mock(Connection.class);
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(2)).thenReturn(false);

        SystemHealthResponse response = systemHealthService.getHealth();

        assertThat(response.isDatabaseUp()).isFalse();
    }

    @Test
    void getHealth_reportsDatabaseDown_whenGetConnectionThrows() throws SQLException {
        when(dataSource.getConnection()).thenThrow(new SQLException("connection refused"));

        SystemHealthResponse response = systemHealthService.getHealth();

        assertThat(response.isDatabaseUp()).isFalse();
    }
}
