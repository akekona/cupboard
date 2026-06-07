package com.cupboard.api.service;

import com.cupboard.api.entity.Product;
import com.cupboard.api.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AiService {

    @Value("${claude.api-key}")
    private String claudeApiKey;

    @Autowired private ProductRepository productRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Toggle this to true when Claude API credits are available
    private static final boolean USE_LIVE_AI = false;

    public String getRestockSuggestions() {
        if (USE_LIVE_AI) {
            return callClaudeApi();
        }
        return getDemoResponse();
    }

    private String callClaudeApi() {
        List<Product> lowStockProducts =
            productRepository.findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold();

        if (lowStockProducts.isEmpty()) {
            return "All products are well stocked. No restock needed at this time.";
        }

        String productContext = lowStockProducts.stream()
            .map(p -> String.format(
                "- %s (SKU: %s): %d units in stock, reorder threshold: %d, category: %s",
                p.getName(), p.getSku(), p.getStockQuantity(),
                p.getReorderThreshold(), p.getCategory()
            ))
            .collect(Collectors.joining("\n"));

        String prompt = """
            You are an inventory manager for Cupboard, a cafe supplier platform.
            Based on the following low stock products, provide concise restock \
            suggestions. For each product mention: current stock vs threshold,
            urgency level, and suggested reorder quantity.
            Keep the response under 150 words and use plain text (no markdown).

            Low stock products:
            """ + productContext;

        Map<String, Object> requestBody = Map.of(
            "model", "claude-sonnet-4-20250514",
            "max_tokens", 300,
            "messages", List.of(
                Map.of("role", "user", "content", prompt)
            )
        );

        try {
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.anthropic.com/v1/messages"))
                .header("Content-Type", "application/json")
                .header("x-api-key", claudeApiKey)
                .header("anthropic-version", "2023-06-01")
                .POST(HttpRequest.BodyPublishers.ofString(
                    objectMapper.writeValueAsString(requestBody)
                ))
                .build();

            HttpResponse<String> response = client.send(
                request, HttpResponse.BodyHandlers.ofString()
            );

            if (response.statusCode() != 200) {
                throw new RuntimeException("Claude API error: " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            return root.path("content").get(0).path("text").asText();

        } catch (Exception e) {
            throw new RuntimeException("Failed to get AI suggestions: " + e.getMessage());
        }
    }

    private String getDemoResponse() {
        return """
            Ethiopian Single Origin 1kg (SKU: COF-ETH-1KG) is critically low \
            at 14 units against a reorder threshold of 50. Suggest ordering \
            100 bags from Oahu Roasters immediately — at current order rates \
            you have approximately 3-4 days of stock remaining.

            Espresso Machine Breville Dual (SKU: EQUIP-ESP-BDB) is out of \
            stock with pending client demand. Contact your equipment supplier \
            to check availability and lead time. Consider stocking 3-5 units \
            given recent order frequency.

            All other products are above their reorder thresholds.
            """;
    }
}
