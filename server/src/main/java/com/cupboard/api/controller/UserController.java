package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.user.CreateUserRequest;
import com.cupboard.api.dto.user.UpdateUserRequest;
import com.cupboard.api.dto.user.UserResponse;
import com.cupboard.api.repository.UserRepository;
import com.cupboard.api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<UserResponse>> getAll() {
        return ApiResponse.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(userService.getUserById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<UserResponse> create(@RequestBody @Valid CreateUserRequest req) {
        return ApiResponse.ok(userService.createUser(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> update(@PathVariable Long id,
                                            @RequestBody UpdateUserRequest req) {
        return ApiResponse.ok(userService.updateUser(id, req));
    }

    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> deactivate(@PathVariable Long id) {
        userService.deactivateUser(id, currentUserId());
        return ApiResponse.ok();
    }

    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<UserResponse> reactivate(@PathVariable Long id) {
        return ApiResponse.ok(userService.reactivateUser(id));
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName()).orElseThrow().getId();
    }
}
