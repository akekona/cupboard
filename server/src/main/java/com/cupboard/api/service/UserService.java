package com.cupboard.api.service;

import com.cupboard.api.dto.user.CreateUserRequest;
import com.cupboard.api.dto.user.RoleResponse;
import com.cupboard.api.dto.user.UpdateUserRequest;
import com.cupboard.api.dto.user.UserResponse;
import com.cupboard.api.entity.Role;
import com.cupboard.api.entity.User;
import com.cupboard.api.entity.UserAuthProvider;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.exception.ValidationException;
import com.cupboard.api.repository.RoleRepository;
import com.cupboard.api.repository.UserAuthProviderRepository;
import com.cupboard.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;

@Service
public class UserService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private UserAuthProviderRepository userAuthProviderRepository;
    @Autowired private BCryptPasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest req) {
        if (userRepository.findByEmail(req.email()).isPresent()) {
            throw new ValidationException("Email already in use: " + req.email());
        }

        List<Role> roles = roleRepository.findByNameIn(req.roleNames());
        if (roles.size() != req.roleNames().size()) {
            throw new ValidationException("One or more roles not found: " + req.roleNames());
        }

        User user = new User();
        user.setEmail(req.email());
        user.setFirstName(req.firstName());
        user.setLastName(req.lastName());
        user.setPasswordHash(passwordEncoder.encode(req.password()));
        user.setAccountStatus("ACTIVE");
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setRoles(new HashSet<>(roles));
        user = userRepository.save(user);

        UserAuthProvider authProvider = new UserAuthProvider();
        authProvider.setUser(user);
        authProvider.setProvider("LOCAL");
        authProvider.setCreatedAt(LocalDateTime.now());
        userAuthProviderRepository.save(authProvider);

        return toResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest req) {
        User user = findOrThrow(id);

        if (req.firstName() != null) user.setFirstName(req.firstName());
        if (req.lastName() != null) user.setLastName(req.lastName());
        if (req.accountStatus() != null) user.setAccountStatus(req.accountStatus());
        if (req.roleNames() != null && !req.roleNames().isEmpty()) {
            List<Role> roles = roleRepository.findByNameIn(req.roleNames());
            if (roles.size() != req.roleNames().size()) {
                throw new ValidationException("One or more roles not found: " + req.roleNames());
            }
            user.setRoles(new HashSet<>(roles));
        }

        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void deactivateUser(Long id, Long currentUserId) {
        if (id.equals(currentUserId)) {
            throw new ValidationException("You cannot deactivate your own account");
        }
        User user = findOrThrow(id);
        user.setAccountStatus("INACTIVE");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    @Transactional
    public UserResponse reactivateUser(Long id) {
        User user = findOrThrow(id);
        user.setAccountStatus("ACTIVE");
        user.setUpdatedAt(LocalDateTime.now());
        return toResponse(userRepository.save(user));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findOrThrow(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }

    private UserResponse toResponse(User user) {
        List<RoleResponse> roles = user.getRoles().stream()
                .map(r -> new RoleResponse(r.getId(), r.getName(), r.getDescription()))
                .toList();
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getAvatarUrl(),
                user.getAccountStatus(),
                roles,
                user.getCreatedAt()
        );
    }
}
