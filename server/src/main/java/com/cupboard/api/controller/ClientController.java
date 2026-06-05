package com.cupboard.api.controller;

import com.cupboard.api.dto.ApiResponse;
import com.cupboard.api.dto.client.*;
import com.cupboard.api.entity.ClientSummary;
import com.cupboard.api.service.ClientService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/clients")
public class ClientController {

    @Autowired
    private ClientService clientService;

    @GetMapping
    public ApiResponse<List<ClientSummary>> getAll() {
        return ApiResponse.ok(clientService.getAllClients());
    }

    @GetMapping("/{id}")
    public ApiResponse<ClientDetailResponse> getById(@PathVariable Long id) {
        return ApiResponse.ok(clientService.getClientById(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ClientResponse> create(@RequestBody @Valid CreateClientRequest req) {
        return ApiResponse.ok(clientService.createClient(req));
    }

    @PutMapping("/{id}")
    public ApiResponse<ClientResponse> update(@PathVariable Long id,
                                              @RequestBody UpdateClientRequest req) {
        return ApiResponse.ok(clientService.updateClient(id, req));
    }

    @PatchMapping("/{id}/suspend")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void suspend(@PathVariable Long id) {
        clientService.suspendClient(id);
    }

    @PatchMapping("/{id}/reactivate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void reactivate(@PathVariable Long id) {
        clientService.reactivateClient(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        clientService.softDeleteClient(id);
    }
}
