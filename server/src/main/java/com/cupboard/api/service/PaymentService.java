package com.cupboard.api.service;

import com.cupboard.api.dto.payment.PaymentResponse;
import com.cupboard.api.dto.payment.PaymentStatsResponse;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    @Autowired private PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments(Long invoiceId) {
        List<Payment> payments = invoiceId != null
                ? paymentRepository.findAllByInvoiceId(invoiceId)
                : paymentRepository.findAll();
        return payments.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public PaymentResponse getPaymentById(Long id) {
        return toResponse(paymentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Payment not found: " + id)));
    }

    @Transactional(readOnly = true)
    public PaymentStatsResponse getPaymentStats() {
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        return new PaymentStatsResponse(
                paymentRepository.getCollectedSince(startOfMonth),
                paymentRepository.getTotalPending(),
                paymentRepository.getTotalRefundedSince(startOfMonth)
        );
    }

    private PaymentResponse toResponse(Payment p) {
        return new PaymentResponse(
                p.getId(),
                p.getInvoice().getId(),
                p.getInvoice().getInvoiceNumber(),
                p.getInvoice().getClient().getId(),
                p.getInvoice().getClient().getName(),
                p.getStripeInvoiceId(),
                p.getStripePaymentId(),
                p.getAmount(),
                p.getCurrency(),
                p.getPaymentMethod(),
                p.getStatus(),
                p.getCreatedAt()
        );
    }
}
