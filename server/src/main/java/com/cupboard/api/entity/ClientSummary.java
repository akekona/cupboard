package com.cupboard.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;
import org.hibernate.annotations.Synchronize;

import java.time.LocalDateTime;

@Entity
@Immutable
@Subselect("""
        SELECT id, name, account_status, contact_name, contact_email,
               deleted_at, order_count, total_spend, outstanding_balance
        FROM client_summaries
        """)
@Synchronize({"clients", "orders", "invoices", "payments"})
@Getter
public class ClientSummary {

    @Id
    private Long id;

    private String name;

    @Column(name = "account_status")
    private String accountStatus;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "order_count")
    private Long orderCount;

    @Column(name = "total_spend")
    private Long totalSpend;

    @Column(name = "outstanding_balance")
    private Long outstandingBalance;
}
