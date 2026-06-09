package com.cupboard.api.service;

import com.cupboard.api.entity.ProductSupplier;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.ProductSupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductSupplierService {

    @Autowired private ProductSupplierRepository productSupplierRepository;

    @Transactional
    public void setPreferred(Long productSupplierId, boolean preferred) {
        ProductSupplier ps = productSupplierRepository.findById(productSupplierId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Product supplier relationship not found: " + productSupplierId));
        ps.setPreferred(preferred);
        productSupplierRepository.save(ps);
    }
}
