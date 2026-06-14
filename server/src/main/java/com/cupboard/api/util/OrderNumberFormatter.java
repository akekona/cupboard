package com.cupboard.api.util;

public class OrderNumberFormatter {

    public static String format(Long orderId) {
        return "ORD-" + String.format("%04d", orderId);
    }

    public static Long parse(String input) {
        if (input == null) throw new IllegalArgumentException("Order identifier is required");
        String trimmed = input.trim();
        if (trimmed.toUpperCase().startsWith("ORD-")) {
            return Long.parseLong(trimmed.substring(4));
        }
        return Long.parseLong(trimmed);
    }
}
