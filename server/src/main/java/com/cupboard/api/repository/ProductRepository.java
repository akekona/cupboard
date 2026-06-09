package com.cupboard.api.repository;

import com.cupboard.api.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    @Query("SELECT p FROM Product p WHERE " +
            "p.deletedAt IS NULL AND " +
            "(:searchLike IS NULL OR LOWER(p.name) LIKE :searchLike OR LOWER(p.sku) LIKE :searchLike) AND " +
            "(:filterCategories = false OR p.category IN :categories) AND " +
            "(:filterStatuses = false OR " +
            "  (:inStock = true AND p.stockQuantity > p.reorderThreshold) OR " +
            "  (:lowStock = true AND p.stockQuantity > 0 AND p.stockQuantity <= p.reorderThreshold) OR " +
            "  (:outOfStock = true AND p.stockQuantity = 0))")
    Page<Product> findAllFiltered(
            @Param("searchLike") String searchLike,
            @Param("filterCategories") boolean filterCategories,
            @Param("categories") List<String> categories,
            @Param("filterStatuses") boolean filterStatuses,
            @Param("inStock") boolean inStock,
            @Param("lowStock") boolean lowStock,
            @Param("outOfStock") boolean outOfStock,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE p.deletedAt IS NULL AND LOWER(p.sku) IN :skus")
    List<Product> findBySkus(@Param("skus") List<String> skus);
}
