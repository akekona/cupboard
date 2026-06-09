package com.cupboard.api.repository;

import com.cupboard.api.entity.Invoice;
import com.cupboard.api.enums.InvoiceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
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
            "(:status IS NULL OR i.status = :status) AND " +
            "(:searchLike IS NULL OR LOWER(i.invoiceNumber) LIKE :searchLike " +
            "  OR LOWER(i.client.name) LIKE :searchLike) " +
            "ORDER BY i.createdAt DESC")
    Page<Invoice> findAllWithFilters(
            @Param("clientId") Long clientId,
            @Param("status") InvoiceStatus status,
            @Param("searchLike") String searchLike,
            Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.status IN ('SENT', 'OVERDUE')")
    int countOutstanding();

    @Query("SELECT COUNT(i) FROM Invoice i WHERE " +
            "i.status = 'OVERDUE' OR " +
            "(i.status IN ('SENT', 'FINALIZED') AND i.dueDate < :today)")
    int countOverdue(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE i.status IN ('SENT', 'OVERDUE')")
    Long getTotalOutstanding();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i WHERE " +
            "i.status = 'OVERDUE' OR " +
            "(i.status IN ('SENT', 'FINALIZED') AND i.dueDate < :today)")
    Long getTotalOverdue(@Param("today") LocalDate today);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
            "WHERE i.status = 'PAID' AND i.paidAt >= :startOfMonth")
    Long getTotalPaidSince(@Param("startOfMonth") LocalDateTime startOfMonth);

    @Query("SELECT i FROM Invoice i JOIN FETCH i.client WHERE i.status IN :statuses ORDER BY i.createdAt DESC")
    List<Invoice> findRecentByStatusIn(@Param("statuses") List<InvoiceStatus> statuses, Pageable pageable);
}
