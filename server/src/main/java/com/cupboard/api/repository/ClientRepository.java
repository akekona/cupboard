package com.cupboard.api.repository;

import com.cupboard.api.entity.Client;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findAllByDeletedAtIsNull();
    Optional<Client> findByIdAndDeletedAtIsNull(Long id);
}
