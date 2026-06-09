package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.PagedResponse;
import com.cupboard.api.dto.product.CreateProductRequest;
import com.cupboard.api.dto.product.ProductResponse;
import com.cupboard.api.dto.product.UpdateProductRequest;
import com.cupboard.api.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ApiResponse<PagedResponse<ProductResponse>> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) List<String> category,
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> skus,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        return ApiResponse.ok(productService.getProductsPaginated(search, category, status, skus, page, size));
    }

    @GetMapping("/low-stock")
    public ApiResponse<List<ProductResponse>> getLowStock() {
        return ApiResponse.ok(productService.getLowStockProducts());
    }

    @GetMapping("/{id}")
    public ApiResponse<ProductResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(productService.getProductById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> create(@RequestBody @Valid CreateProductRequest req) {
        return ApiResponse.ok(productService.createProduct(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<ProductResponse> update(@PathVariable Long id,
                                               @RequestBody UpdateProductRequest req) {
        return ApiResponse.ok(productService.updateProduct(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        productService.softDeleteProduct(id);
    }
}
