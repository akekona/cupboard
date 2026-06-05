package com.cupboard.api.repository;

import com.cupboard.api.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT DISTINCT o FROM Order o LEFT JOIN FETCH o.orderItems WHERE o.client.id = :clientId ORDER BY o.createdAt DESC")
    List<Order> findRecentByClientId(@Param("clientId") Long clientId);
}
