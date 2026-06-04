package com.cupboard.api.controller;

import com.cupboard.api.dto.auth.LoginRequest;
import com.cupboard.api.dto.auth.LoginResponse;
import com.cupboard.api.entity.User;
import com.cupboard.api.repository.UserRepository;
import com.cupboard.api.security.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody @Valid LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .toList();

        Map<String, Object> claims = Map.of(
                "firstName", user.getFirstName(),
                "lastName", user.getLastName(),
                "roles", roles
        );
        String token = jwtUtil.generateToken(userDetails, claims);

        return ResponseEntity.ok(new LoginResponse(token, user.getEmail(), user.getFirstName(), user.getLastName(), roles));
    }

    @GetMapping("/me")
    public ResponseEntity<LoginResponse> me() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName()).orElseThrow();

        List<String> roles = user.getRoles().stream()
                .map(role -> role.getName())
                .toList();

        return ResponseEntity.ok(new LoginResponse(null, user.getEmail(), user.getFirstName(), user.getLastName(), roles));
    }
}
