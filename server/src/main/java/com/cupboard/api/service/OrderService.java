package com.cupboard.api.service;

import com.cupboard.api.dto.order.*;
import com.cupboard.api.entity.*;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.OrderStatus;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.exception.ValidationException;
import com.cupboard.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ClientRepository clientRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private InvoiceRepository invoiceRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getAllOrders(Long clientId, OrderStatus status, Long createdById) {
        return orderRepository.findAllWithFilters(clientId, status, createdById)
                .stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long id) {
        return toOrderResponse(findWithDetailsOrThrow(id));
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest req, Long currentUserId) {
        Client client = clientRepository.findByIdAndDeletedAtIsNull(req.getClientId())
                .orElseThrow(() -> new EntityNotFoundException("Client not found: " + req.getClientId()));
        if (!"ACTIVE".equals(client.getAccountStatus())) {
            throw new ValidationException("Client account is not active: " + client.getName());
        }

        User createdBy = userRepository.findById(currentUserId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + currentUserId));

        Order order = new Order();
        order.setClient(client);
        order.setCreatedBy(createdBy);
        order.setStatus(OrderStatus.DRAFT);
        order.setCurrency(req.getCurrency() != null ? req.getCurrency() : com.cupboard.api.enums.Currency.USD);
        order.setNeedBy(req.getNeedBy());
        order.setNotes(req.getNotes());
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        createOrderItems(order, req.getItems());

        return toOrderResponse(findWithDetailsOrThrow(order.getId()));
    }

    @Transactional
    public OrderResponse updateOrder(Long id, UpdateOrderRequest req, Long currentUserId) {
        Order order = findOrderOrThrow(id);
        requireStatus(order, OrderStatus.DRAFT);

        if (req.getNeedBy() != null) order.setNeedBy(req.getNeedBy());
        if (req.getNotes() != null) order.setNotes(req.getNotes());

        if (req.getItems() != null) {
            orderItemRepository.deleteAllByOrderId(id);
            order.getOrderItems().clear();
            createOrderItems(order, req.getItems());
        }

        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        return toOrderResponse(findWithDetailsOrThrow(id));
    }

    @Transactional
    public OrderResponse confirmOrder(Long id, Long currentUserId) {
        Order order = findWithDetailsOrThrow(id);
        requireStatus(order, OrderStatus.DRAFT);

        // Stock validation
        List<String> insufficient = new ArrayList<>();
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            if (product.getStockQuantity() < item.getQuantity()) {
                insufficient.add(String.format("%s (requested: %d, available: %d)",
                        product.getName(), item.getQuantity(), product.getStockQuantity()));
            }
        }
        if (!insufficient.isEmpty()) {
            throw new ValidationException("Insufficient stock: " + String.join("; ", insufficient));
        }

        // Decrement stock
        for (OrderItem item : order.getOrderItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            product.setUpdatedAt(LocalDateTime.now());
            productRepository.save(product);
        }

        order.setStatus(OrderStatus.CONFIRMED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // Auto-create invoice
        long total = order.getOrderItems().stream()
                .mapToLong(item -> (long) item.getQuantity() * item.getUnitPrice())
                .sum();
        long nextNum = invoiceRepository.count() + 1;

        Invoice invoice = new Invoice();
        invoice.setOrder(order);
        invoice.setClient(order.getClient());
        invoice.setInvoiceNumber("INV-" + String.format("%04d", nextNum));
        invoice.setTotalAmount(total);
        invoice.setCurrency(order.getCurrency());
        invoice.setStatus(InvoiceStatus.DRAFT);
        invoice.setDueDate(LocalDate.now().plusDays(30));
        invoice.setCreatedAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);

        return toOrderResponse(findWithDetailsOrThrow(id));
    }

    @Transactional
    public OrderResponse shipOrder(Long id, Long currentUserId) {
        Order order = findOrderOrThrow(id);
        requireStatus(order, OrderStatus.CONFIRMED);
        order.setStatus(OrderStatus.SHIPPED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toOrderResponse(findWithDetailsOrThrow(id));
    }

    @Transactional
    public OrderResponse fulfillOrder(Long id, Long currentUserId) {
        Order order = findOrderOrThrow(id);
        requireStatus(order, OrderStatus.SHIPPED);
        order.setStatus(OrderStatus.FULFILLED);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);
        return toOrderResponse(findWithDetailsOrThrow(id));
    }

    @Transactional
    public void deleteOrder(Long id, Long currentUserId) {
        Order order = findOrderOrThrow(id);
        requireStatus(order, OrderStatus.DRAFT);
        orderItemRepository.deleteAllByOrderId(id);
        // Re-fetch after cache clear so Hibernate has a clean managed entity to delete
        Order fresh = orderRepository.findById(id).orElseThrow();
        orderRepository.delete(fresh);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
    }

    private Order findWithDetailsOrThrow(Long id) {
        return orderRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new EntityNotFoundException("Order not found: " + id));
    }

    private void requireStatus(Order order, OrderStatus required) {
        if (order.getStatus() != required) {
            throw new ValidationException(String.format(
                    "Order must be %s to perform this action (current status: %s)",
                    required.name(), order.getStatus().name()));
        }
    }

    private void createOrderItems(Order order, List<OrderItemRequest> itemRequests) {
        for (OrderItemRequest req : itemRequests) {
            Product product = productRepository.findByIdAndDeletedAtIsNull(req.getProductId())
                    .orElseThrow(() -> new EntityNotFoundException("Product not found: " + req.getProductId()));
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setQuantity(req.getQuantity());
            item.setUnitPrice(product.getUnitPrice());
            item.setCurrency(product.getCurrency());
            orderItemRepository.save(item);
            order.getOrderItems().add(item); // keep in-memory collection in sync
        }
    }

    private OrderResponse toOrderResponse(Order o) {
        List<OrderItemResponse> items = o.getOrderItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getId(),
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getProduct().getSku(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getCurrency(),
                        (long) item.getQuantity() * item.getUnitPrice()
                ))
                .toList();

        long subtotal = items.stream().mapToLong(OrderItemResponse::lineTotal).sum();

        OrderResponse.InvoiceInfo invoiceInfo = invoiceRepository.findByOrderId(o.getId())
                .map(inv -> new OrderResponse.InvoiceInfo(
                        inv.getId(), inv.getInvoiceNumber(), inv.getStatus(), inv.getTotalAmount()))
                .orElse(null);

        return new OrderResponse(
                o.getId(),
                new OrderResponse.ClientInfo(
                        o.getClient().getId(), o.getClient().getName(), o.getClient().getContactEmail()),
                new OrderResponse.UserInfo(
                        o.getCreatedBy().getId(),
                        o.getCreatedBy().getFirstName(),
                        o.getCreatedBy().getLastName()),
                o.getStatus(),
                o.getCurrency(),
                o.getNeedBy(),
                o.getNotes(),
                items,
                subtotal,
                o.getCreatedAt(),
                o.getUpdatedAt(),
                invoiceInfo
        );
    }

    private OrderSummaryResponse toSummaryResponse(Order o) {
        long subtotal = o.getOrderItems().stream()
                .mapToLong(item -> (long) item.getQuantity() * item.getUnitPrice())
                .sum();
        return new OrderSummaryResponse(
                o.getId(),
                o.getClient().getId(),
                o.getClient().getName(),
                o.getCreatedBy().getFirstName() + " " + o.getCreatedBy().getLastName(),
                o.getStatus(),
                o.getCurrency(),
                subtotal,
                o.getNeedBy(),
                o.getCreatedAt(),
                o.getOrderItems().size()
        );
    }
}
