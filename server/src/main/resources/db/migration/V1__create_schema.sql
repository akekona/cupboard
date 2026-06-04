CREATE TABLE roles (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(50)  NOT NULL UNIQUE,
    description VARCHAR(255)
);

CREATE TABLE users (
    id            BIGSERIAL    PRIMARY KEY,
    email         VARCHAR(255) NOT NULL UNIQUE,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    password_hash VARCHAR,
    avatar_url    VARCHAR,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMP
);

CREATE TABLE user_auth_providers (
    id          BIGSERIAL   PRIMARY KEY,
    user_id     BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider    VARCHAR(20) NOT NULL,
    provider_id VARCHAR,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE suppliers (
    id            BIGSERIAL    PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    contact_name  VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    address       TEXT,
    notes         TEXT,
    is_active     BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at    TIMESTAMP
);

CREATE TABLE products (
    id                BIGSERIAL    PRIMARY KEY,
    sku               VARCHAR(100) NOT NULL UNIQUE,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    category          VARCHAR(50)  NOT NULL,
    unit_price        BIGINT       NOT NULL,
    currency          VARCHAR(3)   NOT NULL DEFAULT 'USD',
    unit              VARCHAR(50)  NOT NULL,
    stock_quantity    INT          NOT NULL DEFAULT 0,
    reorder_threshold INT          NOT NULL DEFAULT 0,
    is_active         BOOLEAN      NOT NULL DEFAULT true,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at        TIMESTAMP
);

CREATE TABLE product_suppliers (
    id             BIGSERIAL    PRIMARY KEY,
    product_id     BIGINT       NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    supplier_id    BIGINT       NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    supplier_sku   VARCHAR(100),
    cost_price     BIGINT       NOT NULL,
    currency       VARCHAR(3)   NOT NULL DEFAULT 'USD',
    lead_time_days INT          NOT NULL DEFAULT 1,
    is_preferred   BOOLEAN      NOT NULL DEFAULT false,
    UNIQUE (product_id, supplier_id)
);

CREATE TABLE clients (
    id             BIGSERIAL    PRIMARY KEY,
    name           VARCHAR(255) NOT NULL,
    contact_name   VARCHAR(255),
    contact_email  VARCHAR(255),
    contact_phone  VARCHAR(50),
    address        TEXT,
    account_status VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at     TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT now(),
    deleted_at     TIMESTAMP
);

CREATE TABLE orders (
    id         BIGSERIAL   PRIMARY KEY,
    client_id  BIGINT      NOT NULL REFERENCES clients(id),
    created_by BIGINT      NOT NULL REFERENCES users(id),
    status     VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    currency   VARCHAR(3)  NOT NULL DEFAULT 'USD',
    need_by    DATE,
    notes      TEXT,
    created_at TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id         BIGSERIAL  PRIMARY KEY,
    order_id   BIGINT     NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id BIGINT     NOT NULL REFERENCES products(id),
    quantity   INT        NOT NULL,
    unit_price BIGINT     NOT NULL,
    currency   VARCHAR(3) NOT NULL DEFAULT 'USD'
);

CREATE TABLE invoices (
    id                BIGSERIAL    PRIMARY KEY,
    order_id          BIGINT       NOT NULL REFERENCES orders(id) UNIQUE,
    client_id         BIGINT       NOT NULL REFERENCES clients(id),
    invoice_number    VARCHAR(50)  NOT NULL UNIQUE,
    total_amount      BIGINT       NOT NULL,
    currency          VARCHAR(3)   NOT NULL DEFAULT 'USD',
    status            VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    due_date          DATE,
    stripe_invoice_id VARCHAR,
    stripe_hosted_url VARCHAR,
    sent_at           TIMESTAMP,
    paid_at           TIMESTAMP,
    notes             TEXT,
    created_at        TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE payments (
    id                BIGSERIAL   PRIMARY KEY,
    invoice_id        BIGINT      NOT NULL REFERENCES invoices(id),
    stripe_invoice_id VARCHAR,
    stripe_payment_id VARCHAR,
    amount            BIGINT      NOT NULL,
    currency          VARCHAR(3)  NOT NULL DEFAULT 'USD',
    payment_method    VARCHAR(20) NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at        TIMESTAMP   NOT NULL DEFAULT now()
);
