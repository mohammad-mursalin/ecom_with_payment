package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class PaginatedResponse<T> {
    private List<T> content;
    private int currentPage;
    private int totalPages;
    private long totalItems;
    private int pageSize;
    private boolean first;
    private boolean last;
}
