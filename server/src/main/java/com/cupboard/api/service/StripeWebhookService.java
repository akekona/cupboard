package com.cupboard.api.service;

import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.repository.InvoiceRepository;
import com.cupboard.api.repository.PaymentRepository;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.EventDataObjectDeserializer;
import com.stripe.model.StripeObject;
import com.stripe.net.Webhook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

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

        EventDataObjectDeserializer deserializer = event.getDataObjectDeserializer();
        Optional<StripeObject> stripeObjectOpt = deserializer.getObject();

        switch (event.getType()) {
            case "invoice.payment_succeeded" -> stripeObjectOpt.ifPresent(obj -> {
                com.stripe.model.Invoice stripeInvoice = (com.stripe.model.Invoice) obj;
                invoiceRepository.findByStripeInvoiceId(stripeInvoice.getId()).ifPresent(invoice -> {
                    Payment payment = new Payment();
                    payment.setInvoice(invoice);
                    payment.setStripeInvoiceId(stripeInvoice.getId());
                    payment.setStripePaymentId(stripeInvoice.getPaymentIntent());
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
            });

            case "invoice.payment_failed" -> stripeObjectOpt.ifPresent(obj -> {
                com.stripe.model.Invoice stripeInvoice = (com.stripe.model.Invoice) obj;
                invoiceRepository.findByStripeInvoiceId(stripeInvoice.getId()).ifPresent(invoice -> {
                    Payment payment = new Payment();
                    payment.setInvoice(invoice);
                    payment.setStripeInvoiceId(stripeInvoice.getId());
                    payment.setStripePaymentId(stripeInvoice.getPaymentIntent());
                    payment.setAmount(invoice.getTotalAmount());
                    payment.setCurrency(invoice.getCurrency());
                    payment.setPaymentMethod(PaymentMethod.STRIPE_CARD);
                    payment.setStatus(PaymentStatus.FAILED);
                    payment.setCreatedAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                });
            });

            case "invoice.voided" -> stripeObjectOpt.ifPresent(obj -> {
                com.stripe.model.Invoice stripeInvoice = (com.stripe.model.Invoice) obj;
                invoiceRepository.findByStripeInvoiceId(stripeInvoice.getId()).ifPresent(invoice -> {
                    invoice.setStatus(InvoiceStatus.REFUNDED);
                    invoice.setUpdatedAt(LocalDateTime.now());
                    invoiceRepository.save(invoice);
                });
            });

            default -> { /* unhandled event type — ignore */ }
        }
    }
}
