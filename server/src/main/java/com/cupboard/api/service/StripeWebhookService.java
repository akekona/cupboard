package com.cupboard.api.service;

import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.repository.InvoiceRepository;
import com.cupboard.api.repository.PaymentRepository;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class StripeWebhookService {

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private PaymentRepository paymentRepository;

    @Transactional
    public void handleWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new RuntimeException("Invalid Stripe webhook signature");
        }

        // Use raw JSON to avoid API version mismatch with typed deserializer
        JsonObject data = JsonParser.parseString(payload)
                .getAsJsonObject()
                .getAsJsonObject("data")
                .getAsJsonObject("object");

        switch (event.getType()) {
            case "invoice.payment_succeeded" -> handlePaymentSucceeded(data);
            case "invoice.payment_failed"    -> handlePaymentFailed(data);
            case "invoice.voided"            -> handleVoided(data);
            default -> { /* unhandled event type — ignore */ }
        }
    }

    private void handlePaymentSucceeded(JsonObject data) {
        String stripeInvoiceId = data.get("id").getAsString();
        String paymentIntentId = data.has("payment_intent") && !data.get("payment_intent").isJsonNull()
                ? data.get("payment_intent").getAsString() : null;

        invoiceRepository.findByStripeInvoiceId(stripeInvoiceId).ifPresent(invoice -> {
            Payment payment = new Payment();
            payment.setInvoice(invoice);
            payment.setStripeInvoiceId(stripeInvoiceId);
            payment.setStripePaymentId(paymentIntentId);
            payment.setAmount(invoice.getTotalAmount());
            payment.setCurrency(invoice.getCurrency());
            payment.setPaymentMethod(PaymentMethod.STRIPE_CARD);
            payment.setStatus(PaymentStatus.SUCCEEDED);
            payment.setCreatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            invoice.setStatus(InvoiceStatus.PAID);
            invoice.setPaidAt(LocalDateTime.now());
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceRepository.save(invoice);
        });
    }

    private void handlePaymentFailed(JsonObject data) {
        String stripeInvoiceId = data.get("id").getAsString();
        String paymentIntentId = data.has("payment_intent") && !data.get("payment_intent").isJsonNull()
                ? data.get("payment_intent").getAsString() : null;

        invoiceRepository.findByStripeInvoiceId(stripeInvoiceId).ifPresent(invoice -> {
            Payment payment = new Payment();
            payment.setInvoice(invoice);
            payment.setStripeInvoiceId(stripeInvoiceId);
            payment.setStripePaymentId(paymentIntentId);
            payment.setAmount(invoice.getTotalAmount());
            payment.setCurrency(invoice.getCurrency());
            payment.setPaymentMethod(PaymentMethod.STRIPE_CARD);
            payment.setStatus(PaymentStatus.FAILED);
            payment.setCreatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
        });
    }

    private void handleVoided(JsonObject data) {
        String stripeInvoiceId = data.get("id").getAsString();

        invoiceRepository.findByStripeInvoiceId(stripeInvoiceId).ifPresent(invoice -> {
            invoice.setStatus(InvoiceStatus.REFUNDED);
            invoice.setUpdatedAt(LocalDateTime.now());
            invoiceRepository.save(invoice);
        });
    }
}
