package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ProductImageResponse {
    private Long id;
    private String url;
    private Integer sortOrder;
    private boolean isPrimary;
}
