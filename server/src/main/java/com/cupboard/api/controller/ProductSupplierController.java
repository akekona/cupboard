package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.service.ProductSupplierService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/product-suppliers")
public class ProductSupplierController {

    @Autowired private ProductSupplierService productSupplierService;

    @PatchMapping("/{id}/preferred")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> setPreferred(
            @PathVariable Long id,
            @RequestParam boolean preferred) {
        productSupplierService.setPreferred(id, preferred);
        return new ApiResponse<>(true, null,
                preferred ? "Marked as preferred supplier" : "Removed as preferred supplier");
    }
}
