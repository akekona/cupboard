package com.cupboard.api.controller;

import com.cupboard.api.service.StripeWebhookService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
public class WebhookController {

    @Autowired private StripeWebhookService stripeWebhookService;

    @PostMapping("/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        try {
            stripeWebhookService.handleWebhook(payload, sigHeader);
        } catch (Exception e) {
            // Always return 200 — Stripe retries on non-200
        }
        return ResponseEntity.ok().build();
    }
}
