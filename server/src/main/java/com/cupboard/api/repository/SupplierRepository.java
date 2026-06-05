package com.cupboard.api.repository;

import com.cupboard.api.entity.Supplier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Query("SELECT DISTINCT s FROM Supplier s LEFT JOIN FETCH s.productSuppliers ps LEFT JOIN FETCH ps.product WHERE s.deletedAt IS NULL")
    List<Supplier> findAllByDeletedAtIsNull();

    @Query("SELECT s FROM Supplier s LEFT JOIN FETCH s.productSuppliers ps LEFT JOIN FETCH ps.product WHERE s.id = :id AND s.deletedAt IS NULL")
    Optional<Supplier> findByIdAndDeletedAtIsNull(@Param("id") Long id);
}
