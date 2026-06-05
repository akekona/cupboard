package com.cupboard.api.service;

import com.cupboard.api.dto.client.*;
import com.cupboard.api.entity.Client;
import com.cupboard.api.entity.ClientSummary;
import com.cupboard.api.entity.Order;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.repository.ClientRepository;
import com.cupboard.api.repository.ClientSummaryRepository;
import com.cupboard.api.repository.OrderRepository;
import com.cupboard.api.repository.projection.ClientActiveProjection;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;

    @Autowired
    private ClientSummaryRepository clientSummaryRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<ClientSummary> getAllClients() {
        return clientSummaryRepository.findAllByDeletedAtIsNull();
    }

    @Transactional(readOnly = true)
    public List<ClientSummary> getRecentActiveClients() {
        LocalDateTime threeMonthsAgo = LocalDateTime.now().minusDays(90);

        List<ClientActiveProjection> activeClients =
                clientRepository.findMostActiveClientIds(threeMonthsAgo);

        List<Long> orderedIds = activeClients.stream()
                .map(ClientActiveProjection::getId)
                .toList();

        if (orderedIds.isEmpty()) return List.of();

        Map<Long, ClientSummary> summaryMap = clientSummaryRepository.findAllById(orderedIds)
                .stream()
                .collect(Collectors.toMap(ClientSummary::getId, s -> s));

        return orderedIds.stream()
                .map(summaryMap::get)
                .filter(Objects::nonNull)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientDetailResponse getClientById(Long id) {
        Client client = clientRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Client not found: " + id));

        ClientSummary summary = clientSummaryRepository.findById(id)
                .orElse(null);

        List<OrderSummary> recentOrders = orderRepository.findRecentByClientId(id)
                .stream()
                .limit(5)
                .map(this::toOrderSummary)
                .toList();

        return new ClientDetailResponse(
                client.getId(),
                client.getName(),
                client.getContactName(),
                client.getContactEmail(),
                client.getContactPhone(),
                client.getAddress(),
                client.getAccountStatus(),
                summary != null ? summary.getOrderCount() : 0L,
                summary != null ? summary.getTotalSpend() : 0L,
                summary != null ? summary.getOutstandingBalance() : 0L,
                recentOrders
        );
    }

    @Transactional
    public ClientResponse createClient(CreateClientRequest req) {
        Client c = new Client();
        c.setName(req.getName());
        c.setContactName(req.getContactName());
        c.setContactEmail(req.getContactEmail());
        c.setContactPhone(req.getContactPhone());
        c.setAddress(req.getAddress());
        c.setAccountStatus("ACTIVE");
        c.setCreatedAt(LocalDateTime.now());
        c.setUpdatedAt(LocalDateTime.now());
        return toResponse(clientRepository.save(c));
    }

    @Transactional
    public ClientResponse updateClient(Long id, UpdateClientRequest req) {
        Client c = findOrThrow(id);
        if (req.getName() != null)         c.setName(req.getName());
        if (req.getContactName() != null)  c.setContactName(req.getContactName());
        if (req.getContactEmail() != null) c.setContactEmail(req.getContactEmail());
        if (req.getContactPhone() != null) c.setContactPhone(req.getContactPhone());
        if (req.getAddress() != null)      c.setAddress(req.getAddress());
        c.setUpdatedAt(LocalDateTime.now());
        return toResponse(clientRepository.save(c));
    }

    @Transactional
    public void suspendClient(Long id) {
        Client c = findOrThrow(id);
        c.setAccountStatus("SUSPENDED");
        c.setUpdatedAt(LocalDateTime.now());
        clientRepository.save(c);
    }

    @Transactional
    public void reactivateClient(Long id) {
        Client c = findOrThrow(id);
        c.setAccountStatus("ACTIVE");
        c.setUpdatedAt(LocalDateTime.now());
        clientRepository.save(c);
    }

    @Transactional
    public void softDeleteClient(Long id) {
        Client c = findOrThrow(id);
        c.setDeletedAt(LocalDateTime.now());
        clientRepository.save(c);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Client findOrThrow(Long id) {
        return clientRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Client not found: " + id));
    }

    private ClientResponse toResponse(Client c) {
        return new ClientResponse(
                c.getId(), c.getName(), c.getContactName(), c.getContactEmail(),
                c.getContactPhone(), c.getAddress(), c.getAccountStatus()
        );
    }

    private OrderSummary toOrderSummary(Order o) {
        long total = o.getOrderItems().stream()
                .mapToLong(item -> (long) item.getQuantity() * item.getUnitPrice())
                .sum();
        return new OrderSummary(o.getId(), o.getStatus(), total, o.getCurrency(), o.getCreatedAt());
    }
}
