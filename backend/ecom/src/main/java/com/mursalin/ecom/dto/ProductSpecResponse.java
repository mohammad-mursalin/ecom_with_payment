package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ProductSpecResponse {
    private String specKey;
    private String specValue;
}
