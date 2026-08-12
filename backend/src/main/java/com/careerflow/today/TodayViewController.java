package com.careerflow.today;

import com.careerflow.today.dto.TodayViewResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/today")
@RequiredArgsConstructor
public class TodayViewController {

    private final TodayViewService todayViewService;

    @GetMapping
    public ResponseEntity<TodayViewResponse> getTodayView(@RequestParam Long workspaceId) {
        return ResponseEntity.ok(todayViewService.getTodayView(workspaceId));
    }
}
