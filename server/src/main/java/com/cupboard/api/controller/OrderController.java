package com.cupboard.api.controller;

// Frontend pagination component expects:
// content, currentPage, totalPages, totalElements, pageSize, first, last
// from PagedResponse<T>
// Use the same Pagination component as products page
import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.PagedResponse;
import com.cupboard.api.dto.order.*;
import com.cupboard.api.enums.OrderStatus;
import com.cupboard.api.repository.UserRepository;
import com.cupboard.api.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private UserRepository userRepository;

    @GetMapping
    public ApiResponse<PagedResponse<OrderSummaryResponse>> getAll(
            @RequestParam(required = false) Long clientId,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long createdById,
            @RequestParam(required = false) String clientSearch,
            @RequestParam(required = false) String orderNumber,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!List.of("createdAt", "needBy").contains(sortBy)) sortBy = "createdAt";
        if (!List.of("asc", "desc").contains(sortDir)) sortDir = "desc";
        return ApiResponse.ok(orderService.getOrdersPaginated(
                clientId, status, createdById, clientSearch, orderNumber, sortBy, sortDir, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(orderService.getOrderById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderResponse> create(@RequestBody @Valid CreateOrderRequest req) {
        return ApiResponse.ok(orderService.createOrder(req, currentUserId()));
    }

    @PutMapping("/{id}")
    public ApiResponse<OrderResponse> update(@PathVariable Long id,
                                             @RequestBody @Valid UpdateOrderRequest req) {
        return ApiResponse.ok(orderService.updateOrder(id, req, currentUserId()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        orderService.deleteOrder(id, currentUserId());
    }

    @PatchMapping("/{id}/confirm")
    public ApiResponse<OrderResponse> confirm(@PathVariable Long id) {
        return ApiResponse.ok(orderService.confirmOrder(id, currentUserId()));
    }

    @PatchMapping("/{id}/ship")
    public ApiResponse<OrderResponse> ship(@PathVariable Long id) {
        return ApiResponse.ok(orderService.shipOrder(id, currentUserId()));
    }

    @PatchMapping("/{id}/fulfill")
    public ApiResponse<OrderResponse> fulfill(@PathVariable Long id) {
        return ApiResponse.ok(orderService.fulfillOrder(id, currentUserId()));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName()).orElseThrow().getId();
    }
}
