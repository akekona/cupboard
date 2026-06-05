package com.cupboard.api.service;

import com.cupboard.api.dto.supplier.*;
import com.cupboard.api.entity.Supplier;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.SupplierRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SupplierService {

    @Autowired
    private SupplierRepository supplierRepository;

    @Transactional(readOnly = true)
    public List<SupplierResponse> getAllSuppliers() {
        return supplierRepository.findAllByDeletedAtIsNull().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public SupplierResponse getSupplierById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public SupplierResponse createSupplier(CreateSupplierRequest req) {
        Supplier s = new Supplier();
        s.setName(req.getName());
        s.setContactName(req.getContactName());
        s.setContactEmail(req.getContactEmail());
        s.setContactPhone(req.getContactPhone());
        s.setAddress(req.getAddress());
        s.setNotes(req.getNotes());
        s.setCreatedAt(LocalDateTime.now());
        s.setUpdatedAt(LocalDateTime.now());
        return toResponse(supplierRepository.save(s));
    }

    @Transactional
    public SupplierResponse updateSupplier(Long id, UpdateSupplierRequest req) {
        Supplier s = findOrThrow(id);
        if (req.getName() != null)        s.setName(req.getName());
        if (req.getContactName() != null) s.setContactName(req.getContactName());
        if (req.getContactEmail() != null) s.setContactEmail(req.getContactEmail());
        if (req.getContactPhone() != null) s.setContactPhone(req.getContactPhone());
        if (req.getAddress() != null)     s.setAddress(req.getAddress());
        if (req.getNotes() != null)       s.setNotes(req.getNotes());
        s.setUpdatedAt(LocalDateTime.now());
        return toResponse(supplierRepository.save(s));
    }

    @Transactional
    public void softDeleteSupplier(Long id) {
        Supplier s = findOrThrow(id);
        s.setDeletedAt(LocalDateTime.now());
        supplierRepository.save(s);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Supplier findOrThrow(Long id) {
        return supplierRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Supplier not found: " + id));
    }

    private SupplierResponse toResponse(Supplier s) {
        List<SupplierProductInfo> productInfos = s.getProductSuppliers().stream()
                .map(ps -> new SupplierProductInfo(
                        ps.getProduct().getId(),
                        ps.getProduct().getName(),
                        ps.getProduct().getSku(),
                        ps.getCostPrice(),
                        ps.getCurrency(),
                        ps.getLeadTimeDays(),
                        ps.isPreferred()
                ))
                .toList();
        return new SupplierResponse(
                s.getId(), s.getName(), s.getContactName(), s.getContactEmail(),
                s.getContactPhone(), s.getAddress(), s.getNotes(),
                productInfos
        );
    }
}
