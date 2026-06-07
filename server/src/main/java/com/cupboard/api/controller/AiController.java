package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    @Autowired private AiService aiService;

    @GetMapping("/restock-suggestions")
    public ResponseEntity<ApiResponse<String>> getRestockSuggestions() {
        String suggestions = aiService.getRestockSuggestions();
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }
}
