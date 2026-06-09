package com.cupboard.api.repository;

import com.cupboard.api.entity.ProductSupplier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductSupplierRepository extends JpaRepository<ProductSupplier, Long> {

    Optional<ProductSupplier> findByProductIdAndSupplierId(Long productId, Long supplierId);
}
