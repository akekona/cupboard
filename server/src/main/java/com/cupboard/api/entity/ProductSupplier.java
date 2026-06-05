package com.cupboard.api.entity;

import com.cupboard.api.enums.Currency;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_suppliers")
@Getter
@Setter
@NoArgsConstructor
public class ProductSupplier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id", nullable = false)
    private Supplier supplier;

    @Column(name = "supplier_sku", length = 100)
    private String supplierSku;

    @Column(name = "cost_price", nullable = false)
    private Long costPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 3)
    private Currency currency = Currency.USD;

    @Column(name = "lead_time_days", nullable = false)
    private int leadTimeDays = 1;

    @Column(name = "is_preferred", nullable = false)
    private boolean isPreferred = false;
}
