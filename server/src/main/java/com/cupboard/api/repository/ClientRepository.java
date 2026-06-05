package com.cupboard.api.repository;

import com.cupboard.api.entity.Client;
import com.cupboard.api.repository.projection.ClientActiveProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findAllByDeletedAtIsNull();

    Optional<Client> findByIdAndDeletedAtIsNull(Long id);

    @Query(value = """
            SELECT c.id, COUNT(o.id) AS order_count
            FROM clients c
            LEFT JOIN orders o ON o.client_id = c.id
                AND o.created_at >= :threeMonthsAgo
            WHERE c.account_status = 'ACTIVE'
                AND c.deleted_at IS NULL
            GROUP BY c.id
            ORDER BY order_count DESC, c.name ASC
            LIMIT 10
            """, nativeQuery = true)
    List<ClientActiveProjection> findMostActiveClientIds(
            @Param("threeMonthsAgo") LocalDateTime threeMonthsAgo
    );
}
