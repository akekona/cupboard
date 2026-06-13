package com.cupboard.api.dto.ai;

import java.util.List;

public record RestockSuggestionsResponse(
        String summary,
        List<RestockSuggestionItem> items
) {}
