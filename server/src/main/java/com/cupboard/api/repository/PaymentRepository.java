package com.cupboard.api.repository;

import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByInvoiceId(Long invoiceId);

    @Query(value = "SELECT p FROM Payment p JOIN FETCH p.invoice inv JOIN FETCH inv.client WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:search IS NULL OR (" +
            "  LOWER(p.stripePaymentId) LIKE :search OR " +
            "  LOWER(p.stripeInvoiceId) LIKE :search OR " +
            "  LOWER(inv.client.name) LIKE :search OR " +
            "  LOWER(inv.invoiceNumber) LIKE :search)) AND " +
            "p.createdAt >= :startDate AND " +
            "p.createdAt < :endDate " +
            "ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Payment p JOIN p.invoice inv WHERE " +
            "(:status IS NULL OR p.status = :status) AND " +
            "(:paymentMethod IS NULL OR p.paymentMethod = :paymentMethod) AND " +
            "(:search IS NULL OR (" +
            "  LOWER(p.stripePaymentId) LIKE :search OR " +
            "  LOWER(p.stripeInvoiceId) LIKE :search OR " +
            "  LOWER(inv.client.name) LIKE :search OR " +
            "  LOWER(inv.invoiceNumber) LIKE :search)) AND " +
            "p.createdAt >= :startDate AND " +
            "p.createdAt < :endDate")
    Page<Payment> findAllFiltered(
            @Param("status") PaymentStatus status,
            @Param("paymentMethod") PaymentMethod paymentMethod,
            @Param("search") String search,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
    Optional<Payment> findByStripePaymentId(String stripePaymentId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.status = 'SUCCEEDED' AND p.createdAt >= :startOfMonth")
    Long getCollectedSince(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.status = 'SUCCEEDED' AND p.createdAt >= :start AND p.createdAt < :end")
    Long sumSucceededBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'PENDING'")
    Long getTotalPending();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p " +
            "WHERE p.status = 'REFUNDED' AND p.createdAt >= :startOfMonth")
    Long getTotalRefundedSince(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT i.client.id, i.client.name, SUM(p.amount), COUNT(DISTINCT i.id) " +
            "FROM Payment p JOIN p.invoice i " +
            "WHERE p.status = 'SUCCEEDED' " +
            "GROUP BY i.client.id, i.client.name " +
            "ORDER BY SUM(p.amount) DESC")
    List<Object[]> findTopClientsByRevenue(Pageable pageable);

    @Query("SELECT YEAR(p.createdAt), MONTH(p.createdAt), COALESCE(SUM(p.amount), 0) " +
            "FROM Payment p " +
            "WHERE p.status = 'SUCCEEDED' AND p.createdAt >= :startDate " +
            "GROUP BY YEAR(p.createdAt), MONTH(p.createdAt)")
    List<Object[]> sumSucceededGroupedByMonth(@Param("startDate") LocalDateTime startDate);
}
