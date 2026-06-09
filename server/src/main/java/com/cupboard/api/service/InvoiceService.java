package com.cupboard.api.service;

import com.cupboard.api.dto.PagedResponse;
import com.cupboard.api.dto.invoice.*;
import com.cupboard.api.entity.Invoice;
import com.cupboard.api.entity.OrderItem;
import com.cupboard.api.entity.Payment;
import com.cupboard.api.enums.InvoiceStatus;
import com.cupboard.api.enums.PaymentMethod;
import com.cupboard.api.enums.PaymentStatus;
import com.cupboard.api.exception.EntityNotFoundException;
import com.cupboard.api.exception.ValidationException;
import com.cupboard.api.repository.ClientRepository;
import com.cupboard.api.repository.InvoiceRepository;
import com.cupboard.api.repository.OrderItemRepository;
import com.cupboard.api.repository.PaymentRepository;
import com.stripe.model.Customer;
import com.stripe.model.InvoiceItem;
import com.stripe.param.CustomerCreateParams;
import com.stripe.param.InvoiceCreateParams;
import com.stripe.param.InvoiceItemCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.model.Refund;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InvoiceService {

    @Autowired private InvoiceRepository invoiceRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private OrderItemRepository orderItemRepository;
    @Autowired private ClientRepository clientRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PagedResponse<InvoiceSummaryResponse> getInvoicesPaginated(
            Long clientId, InvoiceStatus status, String search, int page, int size) {
        String searchLike = (search == null || search.isBlank()) ? null : "%" + search.toLowerCase() + "%";
        Page<Invoice> invoicePage = invoiceRepository.findAllWithFilters(
                clientId, status, searchLike, PageRequest.of(page, size));
        List<InvoiceSummaryResponse> content = invoicePage.getContent().stream()
                .map(this::toSummaryResponse).toList();
        return new PagedResponse<>(content, invoicePage.getNumber(), invoicePage.getTotalPages(),
                invoicePage.getTotalElements(), invoicePage.getSize(),
                invoicePage.isFirst(), invoicePage.isLast());
    }

    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long id) {
        return toResponse(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public InvoiceStatsResponse getInvoiceStats() {
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDate today = LocalDate.now();
        return new InvoiceStatsResponse(
                invoiceRepository.getTotalOutstanding(),
                invoiceRepository.getTotalOverdue(today),
                invoiceRepository.getTotalPaidSince(startOfMonth),
                invoiceRepository.countOverdue(today),
                invoiceRepository.countOutstanding()
        );
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public InvoiceResponse updateInvoice(Long id, UpdateInvoiceRequest req) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT && invoice.getStatus() != InvoiceStatus.FINALIZED) {
            throw new ValidationException("Invoice can only be updated when DRAFT or FINALIZED");
        }
        if (req.dueDate() != null) invoice.setDueDate(req.dueDate());
        if (req.notes() != null) invoice.setNotes(req.notes());
        invoice.setUpdatedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse finalizeInvoice(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new ValidationException("Invoice must be DRAFT to finalize (current: " + invoice.getStatus() + ")");
        }
        invoice.setStatus(InvoiceStatus.FINALIZED);
        invoice.setUpdatedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse sendInvoice(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.FINALIZED) {
            throw new ValidationException("Invoice must be FINALIZED to send (current: " + invoice.getStatus() + ")");
        }
        if (invoice.getClient().getContactEmail() == null || invoice.getClient().getContactEmail().isBlank()) {
            throw new ValidationException("Client must have a contact email before sending an invoice");
        }

        try {
            var client = invoice.getClient();
            Customer stripeCustomer;
            if (client.getStripeCustomerId() != null) {
                stripeCustomer = Customer.retrieve(client.getStripeCustomerId());
            } else {
                CustomerCreateParams customerParams = CustomerCreateParams.builder()
                        .setEmail(client.getContactEmail())
                        .setName(client.getName())
                        .build();
                stripeCustomer = Customer.create(customerParams);
                client.setStripeCustomerId(stripeCustomer.getId());
                clientRepository.save(client);
            }

            InvoiceCreateParams invoiceParams = InvoiceCreateParams.builder()
                    .setCustomer(stripeCustomer.getId())
                    .setCollectionMethod(InvoiceCreateParams.CollectionMethod.SEND_INVOICE)
                    .setDaysUntilDue(30L)
                    .putMetadata("cupboard_invoice_id", invoice.getId().toString())
                    .putMetadata("cupboard_invoice_number", invoice.getInvoiceNumber())
                    .build();
            com.stripe.model.Invoice stripeInvoice = com.stripe.model.Invoice.create(invoiceParams);

            List<OrderItem> orderItems = orderItemRepository.findAllByOrderId(invoice.getOrder().getId());
            for (OrderItem item : orderItems) {
                String description = String.format("%s × %d",
                        item.getProduct().getName(), item.getQuantity());
                long lineTotal = (long) item.getUnitPrice() * item.getQuantity();
                InvoiceItemCreateParams itemParams = InvoiceItemCreateParams.builder()
                        .setCustomer(stripeCustomer.getId())
                        .setInvoice(stripeInvoice.getId())
                        .setAmount(lineTotal)
                        .setCurrency(invoice.getCurrency().name().toLowerCase())
                        .setDescription(description)
                        .build();
                InvoiceItem.create(itemParams);
            }

            stripeInvoice = stripeInvoice.finalizeInvoice();
            stripeInvoice = stripeInvoice.sendInvoice();

            invoice.setStripeInvoiceId(stripeInvoice.getId());
            invoice.setStripeHostedUrl(stripeInvoice.getHostedInvoiceUrl());
        } catch (Exception e) {
            throw new RuntimeException("Stripe error: " + e.getMessage());
        }

        invoice.setStatus(InvoiceStatus.SENT);
        invoice.setSentAt(LocalDateTime.now());
        invoice.setUpdatedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse markOverdue(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.SENT) {
            throw new ValidationException("Invoice must be SENT to mark as overdue (current: " + invoice.getStatus() + ")");
        }
        if (invoice.getDueDate() == null || !invoice.getDueDate().isBefore(java.time.LocalDate.now())) {
            throw new ValidationException("Invoice due date must be in the past to mark as overdue");
        }
        invoice.setStatus(InvoiceStatus.OVERDUE);
        invoice.setUpdatedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    @Transactional
    public InvoiceResponse processRefund(Long id) {
        Invoice invoice = findOrThrow(id);
        if (invoice.getStatus() != InvoiceStatus.PAID) {
            throw new ValidationException("Invoice must be PAID to refund (current: " + invoice.getStatus() + ")");
        }

        Payment payment = paymentRepository.findAllByInvoiceId(id).stream()
                .filter(p -> p.getStatus() == PaymentStatus.SUCCEEDED)
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("No succeeded payment found for invoice: " + id));

        if (payment.getStripePaymentId() != null) {
            try {
                RefundCreateParams params = RefundCreateParams.builder()
                        .setPaymentIntent(payment.getStripePaymentId())
                        .build();
                Refund.create(params);
            } catch (Exception e) {
                throw new RuntimeException("Stripe error: " + e.getMessage());
            }
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        invoice.setStatus(InvoiceStatus.REFUNDED);
        invoice.setUpdatedAt(LocalDateTime.now());
        return toResponse(invoiceRepository.save(invoice));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Invoice findOrThrow(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Invoice not found: " + id));
    }

    private InvoiceResponse toResponse(Invoice i) {
        return new InvoiceResponse(
                i.getId(),
                i.getInvoiceNumber(),
                new InvoiceResponse.OrderInfo(
                        i.getOrder().getId(),
                        i.getOrder().getStatus(),
                        i.getOrder().getCurrency()),
                new InvoiceResponse.ClientInfo(
                        i.getClient().getId(),
                        i.getClient().getName(),
                        i.getClient().getContactEmail()),
                i.getTotalAmount(),
                i.getCurrency(),
                i.getStatus(),
                i.getDueDate(),
                i.getStripeInvoiceId(),
                i.getStripeHostedUrl(),
                i.getSentAt(),
                i.getPaidAt(),
                i.getNotes(),
                i.getCreatedAt(),
                i.getUpdatedAt()
        );
    }

    private InvoiceSummaryResponse toSummaryResponse(Invoice i) {
        return new InvoiceSummaryResponse(
                i.getId(),
                i.getInvoiceNumber(),
                i.getClient().getId(),
                i.getClient().getName(),
                i.getTotalAmount(),
                i.getCurrency(),
                i.getStatus(),
                i.getDueDate(),
                i.getSentAt(),
                i.getPaidAt(),
                i.getOrder().getId()
        );
    }
}
