package com.cupboard.api.enums;

public enum Currency {
    USD("US Dollar", 100),
    EUR("Euro", 100),
    GBP("British Pound", 100),
    JPY("Japanese Yen", 1),
    KRW("South Korean Won", 1),
    VND("Vietnamese Dong", 1),
    CAD("Canadian Dollar", 100),
    AUD("Australian Dollar", 100),
    NZD("New Zealand Dollar", 100),
    HKD("Hong Kong Dollar", 100),
    SGD("Singapore Dollar", 100),
    PHP("Philippine Peso", 100),
    THB("Thai Baht", 100),
    CNY("Chinese Yuan", 100);

    private final String displayName;
    private final int subunitDivisor;

    Currency(String displayName, int subunitDivisor) {
        this.displayName = displayName;
        this.subunitDivisor = subunitDivisor;
    }

    public String getDisplayName() { return displayName; }
    public int getSubunitDivisor() { return subunitDivisor; }

    public double toDisplayAmount(long smallestUnit) {
        return (double) smallestUnit / subunitDivisor;
    }
}
