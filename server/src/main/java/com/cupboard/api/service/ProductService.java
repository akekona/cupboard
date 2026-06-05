package com.cupboard.api.service;

import com.cupboard.api.dto.product.*;
import com.cupboard.api.entity.Product;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByDeletedAtIsNull().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest req) {
        Product p = new Product();
        p.setSku(req.getSku());
        p.setName(req.getName());
        p.setDescription(req.getDescription());
        p.setCategory(req.getCategory());
        p.setUnitPrice(req.getUnitPrice());
        p.setCurrency(req.getCurrency() != null ? req.getCurrency() : "USD");
        p.setUnit(req.getUnit());
        p.setStockQuantity(req.getStockQuantity());
        p.setReorderThreshold(req.getReorderThreshold());
        p.setCreatedAt(LocalDateTime.now());
        p.setUpdatedAt(LocalDateTime.now());
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public ProductResponse updateProduct(Long id, UpdateProductRequest req) {
        Product p = findOrThrow(id);
        if (req.getName() != null)             p.setName(req.getName());
        if (req.getDescription() != null)      p.setDescription(req.getDescription());
        if (req.getCategory() != null)         p.setCategory(req.getCategory());
        if (req.getUnitPrice() != null)        p.setUnitPrice(req.getUnitPrice());
        if (req.getUnit() != null)             p.setUnit(req.getUnit());
        if (req.getStockQuantity() != null)    p.setStockQuantity(req.getStockQuantity());
        if (req.getReorderThreshold() != null) p.setReorderThreshold(req.getReorderThreshold());
        p.setUpdatedAt(LocalDateTime.now());
        return toResponse(productRepository.save(p));
    }

    @Transactional
    public void softDeleteProduct(Long id) {
        Product p = findOrThrow(id);
        p.setDeletedAt(LocalDateTime.now());
        productRepository.save(p);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findAllByDeletedAtIsNullAndStockQuantityLessThanEqualReorderThreshold()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Product findOrThrow(Long id) {
        return productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Product not found: " + id));
    }

    private ProductResponse toResponse(Product p) {
        List<ProductSupplierInfo> supplierInfos = p.getProductSuppliers().stream()
                .map(ps -> new ProductSupplierInfo(
                        ps.getId(),
                        ps.getSupplier().getName(),
                        ps.getCostPrice(),
                        ps.getCurrency(),
                        ps.getLeadTimeDays(),
                        ps.isPreferred()
                ))
                .toList();
        return new ProductResponse(
                p.getId(), p.getSku(), p.getName(), p.getDescription(),
                p.getCategory(), p.getUnitPrice(), p.getCurrency(), p.getUnit(),
                p.getStockQuantity(), p.getReorderThreshold(),
                p.getStockQuantity() <= p.getReorderThreshold(),
                supplierInfos
        );
    }
}
