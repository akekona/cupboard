package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.supplier.CreateSupplierRequest;
import com.cupboard.api.dto.supplier.SupplierResponse;
import com.cupboard.api.dto.supplier.UpdateSupplierRequest;
import com.cupboard.api.service.SupplierService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@PreAuthorize("hasRole('ADMIN')")
public class SupplierController {

    @Autowired
    private SupplierService supplierService;

    @GetMapping
    public ApiResponse<List<SupplierResponse>> getAll() {
        return ApiResponse.ok(supplierService.getAllSuppliers());
    }

    @GetMapping("/{id}")
    public ApiResponse<SupplierResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(supplierService.getSupplierById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SupplierResponse> create(@RequestBody @Valid CreateSupplierRequest req) {
        return ApiResponse.ok(supplierService.createSupplier(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<SupplierResponse> update(@PathVariable Long id,
                                                @RequestBody UpdateSupplierRequest req) {
        return ApiResponse.ok(supplierService.updateSupplier(id, req));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        supplierService.softDeleteSupplier(id);
    }
}
