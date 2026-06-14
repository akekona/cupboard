package com.cupboard.api.service;

import com.cupboard.api.dto.ai.RestockSuggestionItem;
import com.cupboard.api.dto.ai.RestockSuggestionsResponse;
import com.cupboard.api.entity.Product;
import com.cupboard.api.entity.ProductSupplier;
import com.cupboard.api.repository.ProductRepository;
import com.cupboard.api.repository.ProductSupplierRepository;
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

    @Value("${use.live.ai:false}")
    private boolean useLiveAi;

    @Autowired private ProductRepository productRepository;
    @Autowired private ProductSupplierRepository productSupplierRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public RestockSuggestionsResponse getRestockSuggestions() {
        if (useLiveAi) {
            return callClaudeApi();
        }
        return getDemoResponse();
    }

    private RestockSuggestionsResponse callClaudeApi() {
        List<Product> lowStockProducts =
            productRepository.findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold();

        if (lowStockProducts.isEmpty()) {
            return new RestockSuggestionsResponse(
                "All products are well stocked. No restock needed at this time.",
                List.of()
            );
        }

        String productContext = lowStockProducts.stream()
            .map(p -> {
                ProductSupplier preferredSupplier = productSupplierRepository
                    .findByProductIdAndIsPreferredTrue(p.getId())
                    .orElseGet(() -> productSupplierRepository
                        .findByProductId(p.getId())
                        .stream().findFirst().orElse(null));

                return String.format(
                    "- productId: %d, name: %s, SKU: %s, category: %s, " +
                    "currentStock: %d, reorderThreshold: %d. " +
                    "Preferred supplier: %s (lead time: %d days, cost: $%.2f/unit)",
                    p.getId(),
                    p.getName(),
                    p.getSku(),
                    p.getCategory(),
                    p.getStockQuantity(),
                    p.getReorderThreshold(),
                    preferredSupplier != null ? preferredSupplier.getSupplier().getName() : "none linked",
                    preferredSupplier != null ? preferredSupplier.getLeadTimeDays() : 0,
                    preferredSupplier != null ? preferredSupplier.getCostPrice() / 100.0 : 0.0
                );
            })
            .collect(Collectors.joining("\n"));

        String prompt = """
            You are an inventory manager for Cupboard, a B2B cafe \
            supplier platform. Based on the following low stock \
            products, return a JSON object with this exact structure \
            and nothing else (no markdown, no code fences, no preamble):

            {
              "summary": "brief overall summary, e.g. X critical items, Y low stock",
              "items": [
                {
                  "productId": number,
                  "productName": "string",
                  "sku": "string",
                  "currentStock": number,
                  "reorderThreshold": number,
                  "urgency": "CRITICAL" or "LOW",
                  "supplierName": "string or null",
                  "leadTimeDays": number or null,
                  "suggestedQty": number,
                  "estimatedCost": number in cents or null,
                  "note": "1-2 sentence reasoning"
                }
              ]
            }

            Urgency rules: CRITICAL if stock is 0 or below 25% of threshold, \
            otherwise LOW.
            Suggested quantity: aim to restock to roughly 2x the reorder threshold.
            Order items array by urgency: CRITICAL first, then LOW.

            Low stock products:
            """ + productContext;

        Map<String, Object> requestBody = Map.of(
            "model", "claude-sonnet-4-5",
            "max_tokens", 1024,
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
            String text = root.path("content").get(0).path("text").asText().strip();
            if (text.startsWith("```")) {
                text = text.replaceFirst("^```[a-zA-Z]*\\n?", "").replaceFirst("```$", "").strip();
            }

            try {
                return objectMapper.readValue(text, RestockSuggestionsResponse.class);
            } catch (Exception parseEx) {
                throw new RuntimeException("Failed to parse Claude response as JSON: " + text);
            }

        } catch (Exception e) {
            throw new RuntimeException("Failed to get AI suggestions: " + e.getMessage());
        }
    }

    private RestockSuggestionsResponse getDemoResponse() {
        return new RestockSuggestionsResponse(
            "1 critical item, 1 low stock",
            List.of(
                new RestockSuggestionItem(
                    null,
                    "Espresso Machine Breville Dual",
                    "EQUIP-ESP-BDB",
                    0, 2, "CRITICAL",
                    "Oahu Roasters", 14, 3, 360000L,
                    "Out of stock with pending client demand. " +
                    "Contact supplier to check availability."
                ),
                new RestockSuggestionItem(
                    null,
                    "Ethiopian Single Origin 1kg",
                    "COF-ETH-1KG",
                    14, 50, "LOW",
                    "Oahu Roasters", 3, 100, 210000L,
                    "Approximately 3-4 days of stock remaining at " +
                    "current order velocity. Order soon to avoid stockout."
                )
            )
        );
    }
}
