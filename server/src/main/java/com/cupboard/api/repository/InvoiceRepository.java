package com.cupboard.api.repository;

import com.cupboard.api.entity.Invoice;
import com.cupboard.api.enums.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByOrderId(Long orderId);
    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    Optional<Invoice> findByStripeInvoiceId(String stripeInvoiceId);

    List<Invoice> findAllByClientId(Long clientId);
    List<Invoice> findAllByStatus(InvoiceStatus status);

    @Query("SELECT i FROM Invoice i WHERE " +
            "(:clientId IS NULL OR i.client.id = :clientId) AND " +
            "(:status IS NULL OR i.status = :status) " +
            "ORDER BY i.createdAt DESC")
    List<Invoice> findAllWithFilters(
            @Param("clientId") Long clientId,
            @Param("status") InvoiceStatus status);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status IN ('SENT', 'OVERDUE')")
    int countOutstanding();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status = 'OVERDUE'")
    int countOverdue();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status IN ('SENT', 'OVERDUE')")
    Long getTotalOutstanding();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status = 'OVERDUE'")
    Long getTotalOverdue();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
            "WHERE i.status = 'PAID' AND i.paidAt >= :startOfMonth")
    Long getTotalPaidSince(@Param("startOfMonth") LocalDateTime startOfMonth);
}
