package com.cupboard.api.enums;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CurrencyTest {

    // ── subunitDivisor ────────────────────────────────────────────────────────

    @Test
    void usd_hasSubunitDivisorOf100() {
        assertThat(Currency.USD.getSubunitDivisor()).isEqualTo(100);
    }

    @Test
    void eur_hasSubunitDivisorOf100() {
        assertThat(Currency.EUR.getSubunitDivisor()).isEqualTo(100);
    }

    @Test
    void jpy_hasSubunitDivisorOf1() {
        assertThat(Currency.JPY.getSubunitDivisor()).isEqualTo(1);
    }

    @Test
    void krw_hasSubunitDivisorOf1() {
        assertThat(Currency.KRW.getSubunitDivisor()).isEqualTo(1);
    }

    @Test
    void vnd_hasSubunitDivisorOf1() {
        assertThat(Currency.VND.getSubunitDivisor()).isEqualTo(1);
    }

    // ── displayName ───────────────────────────────────────────────────────────

    @Test
    void usd_hasCorrectDisplayName() {
        assertThat(Currency.USD.getDisplayName()).isEqualTo("US Dollar");
    }

    @Test
    void allCurrencies_haveNonBlankDisplayName() {
        for (Currency c : Currency.values()) {
            assertThat(c.getDisplayName()).isNotBlank();
        }
    }

    // ── toDisplayAmount ───────────────────────────────────────────────────────

    @Test
    void toDisplayAmount_usd_convertsCentsToDollars() {
        assertThat(Currency.USD.toDisplayAmount(2800)).isEqualTo(28.0);
    }

    @Test
    void toDisplayAmount_usd_handlesOddCents() {
        assertThat(Currency.USD.toDisplayAmount(2850)).isEqualTo(28.5);
    }

    @Test
    void toDisplayAmount_jpy_returnsAmountUnchanged() {
        assertThat(Currency.JPY.toDisplayAmount(500)).isEqualTo(500.0);
    }

    @Test
    void toDisplayAmount_zero_returnsZero() {
        assertThat(Currency.USD.toDisplayAmount(0)).isEqualTo(0.0);
    }

    @Test
    void toDisplayAmount_largeAmount_convertsCorrectly() {
        // $1,200.00 espresso machine
        assertThat(Currency.USD.toDisplayAmount(120000)).isEqualTo(1200.0);
    }

    // ── enum integrity ────────────────────────────────────────────────────────

    @Test
    void allCurrencies_havePositiveSubunitDivisor() {
        for (Currency c : Currency.values()) {
            assertThat(c.getSubunitDivisor()).isPositive();
        }
    }

    @Test
    void contains14Currencies() {
        assertThat(Currency.values()).hasSize(14);
    }

    @Test
    void expectedCurrencyCodesCanBeResolved() {
        for (String code : new String[]{"USD", "EUR", "GBP", "JPY", "KRW", "VND",
                "CAD", "AUD", "NZD", "HKD", "SGD", "PHP", "THB", "CNY"}) {
            assertThat(Currency.valueOf(code)).isNotNull();
        }
    }
}
