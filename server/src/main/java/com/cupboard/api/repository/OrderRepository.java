package com.cupboard.api.repository;

import com.cupboard.api.entity.Order;
import com.cupboard.api.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByClientId(Long clientId);

    List<Order> findAllByCreatedById(Long userId);

    List<Order> findAllByStatus(OrderStatus status);

    @Query("""
            SELECT DISTINCT o FROM Order o
            JOIN FETCH o.client
            JOIN FETCH o.createdBy
            LEFT JOIN FETCH o.orderItems oi
            LEFT JOIN FETCH oi.product
            WHERE (:clientId IS NULL OR o.client.id = :clientId)
            AND (:status IS NULL OR o.status = :status)
            AND (:createdById IS NULL OR o.createdBy.id = :createdById)
            ORDER BY o.createdAt DESC
            """)
    List<Order> findAllWithFilters(
            @Param("clientId") Long clientId,
            @Param("status") OrderStatus status,
            @Param("createdById") Long createdById
    );

    @Query("""
            SELECT o FROM Order o
            JOIN FETCH o.client
            JOIN FETCH o.createdBy
            LEFT JOIN FETCH o.orderItems oi
            LEFT JOIN FETCH oi.product
            WHERE o.id = :id
            """)
    Optional<Order> findByIdWithDetails(@Param("id") Long id);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM Order o WHERE o.id = :id")
    void deleteOrderById(@Param("id") Long id);

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.client.id = :clientId ORDER BY o.createdAt DESC")
    List<Order> findRecentByClientId(@Param("clientId") Long clientId);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :start AND o.createdAt < :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT o FROM Order o JOIN FETCH o.client WHERE o.status IN :statuses ORDER BY o.createdAt DESC")
    List<Order> findRecentByStatusIn(@Param("statuses") List<OrderStatus> statuses, Pageable pageable);
}
