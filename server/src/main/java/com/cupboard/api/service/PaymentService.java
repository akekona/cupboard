package com.cupboard.api.service;

import com.cupboard.api.dto.PagedResponse;
import com.cupboard.api.dto.payment.PaymentResponse;
import com.cupboard.api.dto.payment.PaymentStatsResponse;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    @Autowired private PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public PagedResponse<PaymentResponse> getPaymentsPaginated(
            PaymentStatus status, PaymentMethod paymentMethod, String search,
            Integer month, Integer year, int page, int size) {
        String searchParam = (search == null || search.isBlank()) ? null : "%" + search.toLowerCase() + "%";
        LocalDateTime startDate;
        LocalDateTime endDate;
        if (month != null && year != null) {
            startDate = LocalDateTime.of(year, month, 1, 0, 0);
            endDate = startDate.plusMonths(1);
        } else if (year != null) {
            startDate = LocalDateTime.of(year, 1, 1, 0, 0);
            endDate = startDate.plusYears(1);
        } else {
            startDate = LocalDateTime.of(1970, 1, 1, 0, 0);
            endDate = LocalDateTime.of(2099, 12, 31, 23, 59, 59);
        }
        Page<Payment> paymentPage = paymentRepository.findAllFiltered(
                status, paymentMethod, searchParam, startDate, endDate, PageRequest.of(page, size));
        List<PaymentResponse> content = paymentPage.getContent().stream().map(this::toResponse).toList();
        return new PagedResponse<>(content, paymentPage.getNumber(), paymentPage.getTotalPages(),
                paymentPage.getTotalElements(), paymentPage.getSize(),
                paymentPage.isFirst(), paymentPage.isLast());
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
