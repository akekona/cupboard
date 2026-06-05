package com.cupboard.api.repository;

import com.cupboard.api.entity.ClientSummary;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClientSummaryRepository extends JpaRepository<ClientSummary, Long> {
    List<ClientSummary> findAllByDeletedAtIsNull();
}
