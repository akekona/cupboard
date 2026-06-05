package com.cupboard.api.repository;

import com.cupboard.api.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByInvoiceId(Long invoiceId);
    Optional<Payment> findByStripePaymentId(String stripePaymentId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.status = 'SUCCEEDED' AND p.createdAt >= :startOfMonth")
    Long getCollectedSince(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PENDING'")
    Long getTotalPending();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.status = 'REFUNDED' AND p.createdAt >= :startOfMonth")
    Long getTotalRefundedSince(@Param("startOfMonth") LocalDateTime startOfMonth);
}
