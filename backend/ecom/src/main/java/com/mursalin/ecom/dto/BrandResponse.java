package com.mursalin.ecom.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BrandResponse {
    private Long id;
    private String name;
    private String slug;
}
