package com.cupboard.api.repository;

import com.cupboard.api.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.productSuppliers ps LEFT JOIN FETCH ps.supplier WHERE p.deletedAt IS NULL")
    List<Product> findAllByDeletedAtIsNull();

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.productSuppliers ps LEFT JOIN FETCH ps.supplier WHERE p.id = :id AND p.deletedAt IS NULL")
    Optional<Product> findByIdAndDeletedAtIsNull(@Param("id") Long id);

    Optional<Product> findBySkuAndDeletedAtIsNull(String sku);

    @Query("SELECT DISTINCT p FROM Product p LEFT JOIN FETCH p.productSuppliers ps LEFT JOIN FETCH ps.supplier WHERE p.deletedAt IS NULL AND p.stockQuantity <= p.reorderThreshold")
    List<Product> findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold();
}
