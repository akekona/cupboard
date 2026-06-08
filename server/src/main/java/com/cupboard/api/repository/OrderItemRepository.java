package com.cupboard.api.repository;

import com.cupboard.api.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Pageable;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findAllByOrderId(Long orderId);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query("DELETE FROM OrderItem oi WHERE oi.order.id = :orderId")
    void deleteAllByOrderId(@Param("orderId") Long orderId);

    @Query("SELECT oi.product.id, oi.product.name, oi.product.sku, SUM(oi.quantity), SUM(oi.unitPrice * oi.quantity) " +
            "FROM OrderItem oi " +
            "GROUP BY oi.product.id, oi.product.name, oi.product.sku " +
            "ORDER BY SUM(oi.unitPrice * oi.quantity) DESC")
    List<Object[]> findTopProductsByRevenue(Pageable pageable);
}
